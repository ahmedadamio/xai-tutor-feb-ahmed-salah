from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.database import get_db

router = APIRouter(prefix="/emails", tags=["emails"])

CURRENT_USER = {
    "name": "Richard Brown",
    "email": "richard@example.com",
    "avatar": "/avatars/richard.jpg",
}


class Contact(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    avatar: str | None = None


class Attachment(BaseModel):
    filename: str = Field(min_length=1)
    size: str = Field(min_length=1)
    url: str = Field(min_length=1)


class EmailResponse(BaseModel):
    id: str
    sender: Contact
    recipient: Contact
    subject: str
    preview: str
    body: str
    date: str
    is_read: bool
    is_archived: bool
    attachments: list[Attachment]


class EmailCreate(BaseModel):
    recipient: Contact
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)
    attachments: list[Attachment] = Field(default_factory=list)


class EmailUpdate(BaseModel):
    is_read: bool | None = None
    is_archived: bool | None = None
    subject: str | None = None
    body: str | None = None
    recipient: Contact | None = None
    attachments: list[Attachment] | None = None


def _build_preview(text: str, limit: int = 64) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[:limit - 3].rstrip()}..."


def _fetch_attachments_for_ids(conn, email_ids: list[int]) -> dict[int, list[dict]]:
    if not email_ids:
        return {}

    placeholders = ",".join("?" for _ in email_ids)
    cursor = conn.cursor()
    cursor.execute(
        f"""
        SELECT email_id, filename, size, url
        FROM attachments
        WHERE email_id IN ({placeholders})
        ORDER BY id
        """,
        tuple(email_ids),
    )
    rows = cursor.fetchall()
    attachment_map: dict[int, list[dict]] = {email_id: [] for email_id in email_ids}
    for row in rows:
        attachment_map[row["email_id"]].append(
            {"filename": row["filename"], "size": row["size"], "url": row["url"]}
        )
    return attachment_map


def _serialize_email(row, attachments: list[dict]) -> dict:
    return {
        "id": str(row["id"]),
        "sender": {
            "name": row["sender_name"],
            "email": row["sender_email"],
            "avatar": row["sender_avatar"],
        },
        "recipient": {
            "name": row["recipient_name"],
            "email": row["recipient_email"],
            "avatar": None,
        },
        "subject": row["subject"],
        "preview": row["preview"],
        "body": row["body"],
        "date": row["date"],
        "is_read": bool(row["is_read"]),
        "is_archived": bool(row["is_archived"]),
        "attachments": attachments,
    }


def _fetch_email_by_id(conn, email_id: int) -> dict | None:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            id,
            sender_name,
            sender_email,
            sender_avatar,
            recipient_name,
            recipient_email,
            subject,
            preview,
            body,
            date,
            is_read,
            is_archived
        FROM emails
        WHERE id = ?
        """,
        (email_id,),
    )
    row = cursor.fetchone()
    if row is None:
        return None

    attachments = _fetch_attachments_for_ids(conn, [email_id]).get(email_id, [])
    return _serialize_email(row, attachments)


@router.get("", response_model=list[EmailResponse])
def list_emails(
    filter: Literal["all", "unread", "archived"] = Query(default="all"),
    search: str | None = Query(default=None),
):
    try:
        with get_db() as conn:
            conditions: list[str] = []
            params: list[object] = []

            if filter == "archived":
                conditions.append("is_archived = 1")
            else:
                conditions.append("is_archived = 0")
                if filter == "unread":
                    conditions.append("is_read = 0")

            if search:
                conditions.append(
                    """
                    (
                        sender_name LIKE ?
                        OR sender_email LIKE ?
                        OR recipient_name LIKE ?
                        OR recipient_email LIKE ?
                        OR subject LIKE ?
                        OR preview LIKE ?
                        OR body LIKE ?
                    )
                    """
                )
                like_value = f"%{search.strip()}%"
                params.extend([like_value] * 7)

            where_clause = " AND ".join(conditions) if conditions else "1 = 1"
            cursor = conn.cursor()
            cursor.execute(
                f"""
                SELECT
                    id,
                    sender_name,
                    sender_email,
                    sender_avatar,
                    recipient_name,
                    recipient_email,
                    subject,
                    preview,
                    body,
                    date,
                    is_read,
                    is_archived
                FROM emails
                WHERE {where_clause}
                ORDER BY is_read ASC, date DESC, id ASC
                """,
                tuple(params),
            )
            rows = cursor.fetchall()
            email_ids = [row["id"] for row in rows]
            attachments = _fetch_attachments_for_ids(conn, email_ids)
            return [_serialize_email(row, attachments.get(row["id"], [])) for row in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.get("/{email_id}", response_model=EmailResponse)
def get_email(email_id: int):
    try:
        with get_db() as conn:
            email = _fetch_email_by_id(conn, email_id)
            if email is None:
                raise HTTPException(status_code=404, detail="Email not found")
            return email
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.post("", response_model=EmailResponse, status_code=201)
def create_email(payload: EmailCreate):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            date_iso = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
            preview = _build_preview(payload.body)

            cursor.execute(
                """
                INSERT INTO emails (
                    sender_name,
                    sender_email,
                    sender_avatar,
                    recipient_name,
                    recipient_email,
                    subject,
                    preview,
                    body,
                    date,
                    is_read,
                    is_archived
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    CURRENT_USER["name"],
                    CURRENT_USER["email"],
                    CURRENT_USER["avatar"],
                    payload.recipient.name,
                    payload.recipient.email,
                    payload.subject.strip(),
                    preview,
                    payload.body.strip(),
                    date_iso,
                    1,
                    0,
                ),
            )
            email_id = cursor.lastrowid

            for attachment in payload.attachments:
                cursor.execute(
                    """
                    INSERT INTO attachments (email_id, filename, size, url)
                    VALUES (?, ?, ?, ?)
                    """,
                    (email_id, attachment.filename, attachment.size, attachment.url),
                )

            email = _fetch_email_by_id(conn, int(email_id))
            if email is None:
                raise HTTPException(status_code=500, detail="Failed to create email")
            return email
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.put("/{email_id}", response_model=EmailResponse)
def update_email(email_id: int, payload: EmailUpdate):
    try:
        with get_db() as conn:
            existing = _fetch_email_by_id(conn, email_id)
            if existing is None:
                raise HTTPException(status_code=404, detail="Email not found")

            updates: list[str] = []
            params: list[object] = []

            if payload.is_read is not None:
                updates.append("is_read = ?")
                params.append(1 if payload.is_read else 0)
            if payload.is_archived is not None:
                updates.append("is_archived = ?")
                params.append(1 if payload.is_archived else 0)
            if payload.subject is not None:
                updates.append("subject = ?")
                params.append(payload.subject.strip())
            if payload.body is not None:
                body_value = payload.body.strip()
                updates.append("body = ?")
                params.append(body_value)
                updates.append("preview = ?")
                params.append(_build_preview(body_value))
            if payload.recipient is not None:
                updates.append("recipient_name = ?")
                params.append(payload.recipient.name.strip())
                updates.append("recipient_email = ?")
                params.append(payload.recipient.email.strip())

            if updates:
                params.append(email_id)
                cursor = conn.cursor()
                cursor.execute(
                    f"UPDATE emails SET {', '.join(updates)} WHERE id = ?",
                    tuple(params),
                )

            if payload.attachments is not None:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM attachments WHERE email_id = ?", (email_id,))
                for attachment in payload.attachments:
                    cursor.execute(
                        """
                        INSERT INTO attachments (email_id, filename, size, url)
                        VALUES (?, ?, ?, ?)
                        """,
                        (email_id, attachment.filename, attachment.size, attachment.url),
                    )

            updated = _fetch_email_by_id(conn, email_id)
            if updated is None:
                raise HTTPException(status_code=404, detail="Email not found")
            return updated
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@router.delete("/{email_id}", status_code=204)
def delete_email(email_id: int):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM emails WHERE id = ?", (email_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Email not found")

            cursor.execute("DELETE FROM attachments WHERE email_id = ?", (email_id,))
            cursor.execute("DELETE FROM emails WHERE id = ?", (email_id,))
            return None
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
