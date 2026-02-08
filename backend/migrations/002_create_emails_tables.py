"""
Migration: Create emails and attachments tables
Version: 002
Description: Adds email client schema and seed records used by the frontend.
"""

import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DATABASE_PATH

MIGRATION_NAME = "002_create_emails_tables"

SEED_EMAILS = [
    {
        "sender_name": "Michael Lee",
        "sender_email": "michael.lee@company.com",
        "sender_avatar": "/avatars/michael.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Follow-Up: Product Demo Feedback",
        "preview": "Hi John, Thank you for attending the product demo yesterday.",
        "body": (
            "Hi John,\n\n"
            "Thank you for attending the product demo yesterday. We would love to hear your feedback and "
            "discuss next steps for rollout.\n\n"
            "Best,\nMichael Lee"
        ),
        "date": "2024-12-10T09:00:00",
        "is_read": 0,
        "is_archived": 0,
        "attachments": [],
    },
    {
        "sender_name": "Jane Doe",
        "sender_email": "jane.doe@business.com",
        "sender_avatar": "/avatars/jane.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Proposal for Partnership",
        "preview": "Hi John, hope this message finds you well! I am reaching out to explore a partnership.",
        "body": (
            "Hi John,\n\n"
            "hope this message finds you well! I am reaching out to explore a potential partnership between our "
            "companies. At Jane Corp, which could complement your offerings at John Organisation Corp.\n\n"
            "I have attached a proposal detailing how we envision our collaboration, including key benefits, "
            "timelines, and implementation strategies. I believe this partnership could unlock exciting "
            "opportunities for both of us!\n\n"
            "Let me know your thoughts or a convenient time to discuss this further. I am happy to schedule a "
            "call or meeting at your earliest convenience. Looking forward to hearing from you!\n\n"
            "Warm regards,\nJane Doe"
        ),
        "date": "2024-12-10T09:00:00",
        "is_read": 0,
        "is_archived": 0,
        "attachments": [
            {
                "filename": "Proposal Partnership.pdf",
                "size": "1.5 MB",
                "url": "/files/proposal-partnership.pdf",
            }
        ],
    },
    {
        "sender_name": "Support Team",
        "sender_email": "support@contractor.com",
        "sender_avatar": "/avatars/support.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Contract Renewal Due",
        "preview": "Dear John, This is a reminder that the contract renewal is due next week.",
        "body": (
            "Dear John,\n\nThis is a reminder that the contract renewal is due next week. "
            "Please review the terms and confirm if you need changes.\n\nRegards,\nSupport Team"
        ),
        "date": "2024-12-11T08:20:00",
        "is_read": 1,
        "is_archived": 0,
        "attachments": [],
    },
    {
        "sender_name": "Sarah Connor",
        "sender_email": "sarah.connor@strategy.io",
        "sender_avatar": "/avatars/sarah.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Meeting Recap: Strategies for 2025",
        "preview": "Hi John, Thank you for your insights during yesterday's strategy call.",
        "body": (
            "Hi John,\n\nThank you for your insights during yesterday's strategy call. "
            "I am sharing the recap and action items for this quarter.\n\nBest,\nSarah Connor"
        ),
        "date": "2024-12-11T07:35:00",
        "is_read": 1,
        "is_archived": 0,
        "attachments": [],
    },
    {
        "sender_name": "Downe Johnson",
        "sender_email": "downe.johnson@events.io",
        "sender_avatar": "/avatars/downe.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Invitation: Annual Client Appreciation",
        "preview": "Dear John, We are delighted to invite you to our annual appreciation event.",
        "body": (
            "Dear John,\n\nWe are delighted to invite you to our annual client appreciation event this month. "
            "Please RSVP when convenient.\n\nRegards,\nDowne Johnson"
        ),
        "date": "2024-12-11T07:10:00",
        "is_read": 1,
        "is_archived": 0,
        "attachments": [],
    },
    {
        "sender_name": "Lily Alexa",
        "sender_email": "lily.alexa@supportdesk.io",
        "sender_avatar": "/avatars/lily.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Technical Support Update",
        "preview": "Dear John, Your issue regarding server connectivity has been resolved.",
        "body": (
            "Dear John,\n\nYour issue regarding server connectivity has been resolved. "
            "Please let us know if you still experience any interruptions.\n\nThanks,\nLily Alexa"
        ),
        "date": "2024-12-10T15:45:00",
        "is_read": 1,
        "is_archived": 0,
        "attachments": [],
    },
    {
        "sender_name": "Natasha Brown",
        "sender_email": "natasha@kozuki-tea.com",
        "sender_avatar": "/avatars/natasha.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Happy Holidays from Kozuki tea",
        "preview": "Hi John, As the holiday season approaches, we wanted to share our thanks.",
        "body": (
            "Hi John,\n\nAs the holiday season approaches, we wanted to share our thanks for your partnership "
            "throughout this year.\n\nWarm wishes,\nNatasha Brown"
        ),
        "date": "2024-12-10T10:50:00",
        "is_read": 1,
        "is_archived": 0,
        "attachments": [],
    },
    {
        "sender_name": "Downe Johnson",
        "sender_email": "downe.johnson@events.io",
        "sender_avatar": "/avatars/downe.jpg",
        "recipient_name": "Richard Brown",
        "recipient_email": "richard@example.com",
        "subject": "Invitation: Annual Client Appreciation",
        "preview": "Dear John, Friendly reminder to confirm your attendance for next week.",
        "body": (
            "Dear John,\n\nFriendly reminder to confirm your attendance for next week's event. "
            "We look forward to hosting you.\n\nRegards,\nDowne Johnson"
        ),
        "date": "2024-12-11T06:00:00",
        "is_read": 1,
        "is_archived": 1,
        "attachments": [],
    },
]


def _ensure_migrations_table(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def upgrade():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    _ensure_migrations_table(cursor)
    cursor.execute("SELECT 1 FROM _migrations WHERE name = ?", (MIGRATION_NAME,))
    if cursor.fetchone():
        print(f"Migration {MIGRATION_NAME} already applied. Skipping.")
        conn.close()
        return

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            sender_avatar TEXT,
            recipient_name TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            preview TEXT NOT NULL,
            body TEXT NOT NULL,
            date TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            size TEXT NOT NULL,
            url TEXT NOT NULL,
            FOREIGN KEY(email_id) REFERENCES emails(id) ON DELETE CASCADE
        )
        """
    )

    cursor.execute("SELECT COUNT(1) FROM emails")
    row_count = cursor.fetchone()[0]
    if row_count == 0:
        for email in SEED_EMAILS:
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
                    email["sender_name"],
                    email["sender_email"],
                    email["sender_avatar"],
                    email["recipient_name"],
                    email["recipient_email"],
                    email["subject"],
                    email["preview"],
                    email["body"],
                    email["date"],
                    email["is_read"],
                    email["is_archived"],
                ),
            )
            email_id = cursor.lastrowid
            for attachment in email["attachments"]:
                cursor.execute(
                    """
                    INSERT INTO attachments (email_id, filename, size, url)
                    VALUES (?, ?, ?, ?)
                    """,
                    (email_id, attachment["filename"], attachment["size"], attachment["url"]),
                )

    cursor.execute("INSERT INTO _migrations (name) VALUES (?)", (MIGRATION_NAME,))
    conn.commit()
    conn.close()
    print(f"Migration {MIGRATION_NAME} applied successfully.")


def downgrade():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS attachments")
    cursor.execute("DROP TABLE IF EXISTS emails")
    cursor.execute("DELETE FROM _migrations WHERE name = ?", (MIGRATION_NAME,))

    conn.commit()
    conn.close()
    print(f"Migration {MIGRATION_NAME} reverted successfully.")
