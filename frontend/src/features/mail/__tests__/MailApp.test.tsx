import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MailApp from "../MailApp";

const baseEmails = [
  {
    id: "1",
    sender: { name: "Jane Doe", email: "jane@example.com", avatar: "/avatars/jane.jpg" },
    recipient: { name: "Richard Brown", email: "richard@example.com" },
    subject: "Proposal for Partnership",
    preview: "Hi John, hope this message finds you well...",
    body: "Hi John,\n\nPartnership details.",
    date: "2024-12-10T09:00:00",
    is_read: false,
    is_archived: false,
    attachments: [],
  },
  {
    id: "2",
    sender: { name: "Support Team", email: "support@example.com", avatar: "/avatars/support.jpg" },
    recipient: { name: "Richard Brown", email: "richard@example.com" },
    subject: "Contract Renewal Due",
    preview: "Reminder about renewal.",
    body: "Dear John, renewal is due.",
    date: "2024-12-11T08:20:00",
    is_read: true,
    is_archived: false,
    attachments: [],
  },
  {
    id: "3",
    sender: { name: "Downe Johnson", email: "downe@example.com", avatar: "/avatars/downe.jpg" },
    recipient: { name: "Richard Brown", email: "richard@example.com" },
    subject: "Invitation: Annual Client Appreciation",
    preview: "Reminder to confirm attendance.",
    body: "Dear John, please RSVP.",
    date: "2024-12-11T06:00:00",
    is_read: true,
    is_archived: true,
    attachments: [],
  },
];

function createFetchMock() {
  let emails = [...baseEmails];

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/emails")) {
      const urlObj = new URL(url, "http://localhost");
      const path = urlObj.pathname;

      if (method === "GET" && path === "/emails") {
        const filter = urlObj.searchParams.get("filter") ?? "all";
        const search = urlObj.searchParams.get("search");

        let result = emails;
        if (filter === "unread") {
          result = result.filter((email) => !email.is_read && !email.is_archived);
        } else if (filter === "archived") {
          result = result.filter((email) => email.is_archived);
        } else {
          result = result.filter((email) => !email.is_archived);
        }

        if (search) {
          const query = search.toLowerCase();
          result = result.filter((email) => email.subject.toLowerCase().includes(query));
        }

        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (method === "GET" && path.startsWith("/emails/")) {
        const id = path.split("/").pop();
        const email = emails.find((item) => item.id === id);
        if (!email) return new Response("Not found", { status: 404 });
        return new Response(JSON.stringify(email), { status: 200 });
      }

      if (method === "POST" && path === "/emails") {
        const payload = init?.body ? JSON.parse(init.body.toString()) : {};
        const created = {
          id: String(emails.length + 1),
          sender: { name: "Richard Brown", email: "richard@example.com", avatar: "/avatars/richard.jpg" },
          recipient: payload.recipient,
          subject: payload.subject,
          preview: payload.body.slice(0, 40),
          body: payload.body,
          date: "2024-12-10T10:30:00",
          is_read: true,
          is_archived: false,
          attachments: [],
        };
        emails = [created, ...emails];
        return new Response(JSON.stringify(created), { status: 201 });
      }

      if (method === "PUT" && path.startsWith("/emails/")) {
        const id = path.split("/").pop();
        const payload = init?.body ? JSON.parse(init.body.toString()) : {};
        emails = emails.map((item) => (item.id === id ? { ...item, ...payload } : item));
        const updated = emails.find((item) => item.id === id);
        return new Response(JSON.stringify(updated), { status: 200 });
      }

      if (method === "DELETE" && path.startsWith("/emails/")) {
        const id = path.split("/").pop();
        emails = emails.filter((item) => item.id !== id);
        return new Response(null, { status: 204 });
      }
    }

    return new Response("Not Found", { status: 404 });
  });
}

describe("MailApp", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = createFetchMock() as unknown as typeof fetch;
  });

  it("renders email list and details", async () => {
    render(<MailApp />);

    expect(await screen.findByText("Proposal for Partnership")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Contract Renewal Due")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText("Proposal for Partnership").length).toBeGreaterThan(0);
    });
  });

  it("filters unread emails", async () => {
    render(<MailApp />);

    const unreadTab = await screen.findByRole("button", { name: "Unread" });
    await userEvent.click(unreadTab);

    await waitFor(() => {
      expect(screen.getByText("Proposal for Partnership")).toBeInTheDocument();
      expect(screen.queryByText("Contract Renewal Due")).not.toBeInTheDocument();
    });
  });

  it("opens compose modal and sends new message", async () => {
    render(<MailApp />);

    const button = await screen.findByRole("button", { name: "New Message" });
    await userEvent.click(button);

    await userEvent.type(screen.getByPlaceholderText("Jane Doe"), "Ava Stone");
    await userEvent.type(screen.getByPlaceholderText("jane.doe@business.com"), "ava@stone.io");
    await userEvent.type(screen.getByPlaceholderText("Proposal Follow-up"), "Hello");
    await userEvent.type(screen.getByPlaceholderText("Write your message"), "Thanks for the update.");

    await userEvent.click(screen.getByRole("button", { name: "Send Message" }));

    await waitFor(() => {
      expect(screen.getByText("Message sent.")).toBeInTheDocument();
    });
  });
});
