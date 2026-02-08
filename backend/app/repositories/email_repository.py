from __future__ import annotations

from sqlite3 import Connection


def fetch_attachments_for_ids(conn: Connection, email_ids: list[int]) -> dict[int, list[dict]]:
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


def serialize_email(row, attachments: list[dict]) -> dict:
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


def fetch_email_by_id(conn: Connection, email_id: int) -> dict | None:
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

    attachments = fetch_attachments_for_ids(conn, [email_id]).get(email_id, [])
    return serialize_email(row, attachments)


def list_emails(
    conn: Connection,
    filter_value: str,
    search_value: str | None,
) -> list[dict]:
    conditions: list[str] = []
    params: list[object] = []

    if filter_value == "archived":
        conditions.append("is_archived = 1")
    else:
        conditions.append("is_archived = 0")
        if filter_value == "unread":
            conditions.append("is_read = 0")

    if search_value:
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
        like_value = f"%{search_value.strip()}%"
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
    attachments = fetch_attachments_for_ids(conn, email_ids)
    return [serialize_email(row, attachments.get(row["id"], [])) for row in rows]


def create_email(
    conn: Connection,
    *,
    sender_name: str,
    sender_email: str,
    sender_avatar: str | None,
    recipient_name: str,
    recipient_email: str,
    subject: str,
    preview: str,
    body: str,
    date: str,
    attachments: list[dict],
) -> dict:
    cursor = conn.cursor()
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
            sender_name,
            sender_email,
            sender_avatar,
            recipient_name,
            recipient_email,
            subject,
            preview,
            body,
            date,
            1,
            0,
        ),
    )
    email_id = cursor.lastrowid

    for attachment in attachments:
        cursor.execute(
            """
            INSERT INTO attachments (email_id, filename, size, url)
            VALUES (?, ?, ?, ?)
            """,
            (email_id, attachment["filename"], attachment["size"], attachment["url"]),
        )

    created = fetch_email_by_id(conn, int(email_id))
    if created is None:
        raise RuntimeError("Failed to create email")
    return created


def update_email(
    conn: Connection,
    email_id: int,
    *,
    updates: dict,
    attachments: list[dict] | None,
) -> dict | None:
    if updates:
        update_fields = ", ".join(updates.keys())
        params = list(updates.values()) + [email_id]
        cursor = conn.cursor()
        cursor.execute(f"UPDATE emails SET {update_fields} WHERE id = ?", tuple(params))

    if attachments is not None:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM attachments WHERE email_id = ?", (email_id,))
        for attachment in attachments:
            cursor.execute(
                """
                INSERT INTO attachments (email_id, filename, size, url)
                VALUES (?, ?, ?, ?)
                """,
                (email_id, attachment["filename"], attachment["size"], attachment["url"]),
            )

    return fetch_email_by_id(conn, email_id)


def delete_email(conn: Connection, email_id: int) -> bool:
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM emails WHERE id = ?", (email_id,))
    if cursor.fetchone() is None:
        return False

    cursor.execute("DELETE FROM attachments WHERE email_id = ?", (email_id,))
    cursor.execute("DELETE FROM emails WHERE id = ?", (email_id,))
    return True
