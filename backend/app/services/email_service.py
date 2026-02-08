from datetime import datetime, timezone

from app.repositories import email_repository
from app.schemas.email import Attachment, EmailCreate, EmailUpdate

CURRENT_USER = {
    "name": "Richard Brown",
    "email": "richard@example.com",
    "avatar": "/avatars/richard.jpg",
}


def build_preview(text: str, limit: int = 64) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[:limit - 3].rstrip()}..."


def list_emails(conn, filter_value: str, search_value: str | None) -> list[dict]:
    return email_repository.list_emails(conn, filter_value, search_value)


def get_email(conn, email_id: int) -> dict | None:
    return email_repository.fetch_email_by_id(conn, email_id)


def create_email(conn, payload: EmailCreate) -> dict:
    date_iso = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    preview = build_preview(payload.body)
    attachments = [attachment.model_dump() for attachment in payload.attachments]

    return email_repository.create_email(
        conn,
        sender_name=CURRENT_USER["name"],
        sender_email=CURRENT_USER["email"],
        sender_avatar=CURRENT_USER["avatar"],
        recipient_name=payload.recipient.name,
        recipient_email=payload.recipient.email,
        subject=payload.subject.strip(),
        preview=preview,
        body=payload.body.strip(),
        date=date_iso,
        attachments=attachments,
    )


def update_email(conn, email_id: int, payload: EmailUpdate) -> dict | None:
    updates: dict[str, object] = {}

    if payload.is_read is not None:
        updates["is_read"] = 1 if payload.is_read else 0
    if payload.is_archived is not None:
        updates["is_archived"] = 1 if payload.is_archived else 0
    if payload.subject is not None:
        updates["subject"] = payload.subject.strip()
    if payload.body is not None:
        body_value = payload.body.strip()
        updates["body"] = body_value
        updates["preview"] = build_preview(body_value)
    if payload.recipient is not None:
        updates["recipient_name"] = payload.recipient.name.strip()
        updates["recipient_email"] = payload.recipient.email.strip()

    attachments: list[Attachment] | None = payload.attachments
    attachment_payload = (
        [attachment.model_dump() for attachment in attachments] if attachments is not None else None
    )

    return email_repository.update_email(
        conn,
        email_id,
        updates=updates,
        attachments=attachment_payload,
    )


def delete_email(conn, email_id: int) -> bool:
    return email_repository.delete_email(conn, email_id)
