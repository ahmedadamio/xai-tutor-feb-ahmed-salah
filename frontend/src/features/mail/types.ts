export type FilterTab = "all" | "unread" | "archived";

export type Contact = {
  name: string;
  email: string;
  avatar?: string | null;
};

export type Attachment = {
  filename: string;
  size: string;
  url: string;
};

export type Email = {
  id: string;
  sender: Contact;
  recipient: Contact;
  subject: string;
  preview: string;
  body: string;
  date: string;
  is_read: boolean;
  is_archived: boolean;
  attachments: Attachment[];
};
