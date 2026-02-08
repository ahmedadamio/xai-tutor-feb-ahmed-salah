from pydantic import BaseModel, Field


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
