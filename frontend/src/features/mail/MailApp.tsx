"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiRequest } from "../../lib/api";
import { cx } from "../../lib/utils";
import { Avatar } from "./components/Avatar";
import {
  ArchiveIcon,
  BellIcon,
  CalendarIcon,
  CheckSquareIcon,
  ClockIcon,
  CloseIcon,
  CollapseIcon,
  CubeIcon,
  DotsIcon,
  ExpandIcon,
  ForwardIcon,
  GridIcon,
  HelpIcon,
  HomeIcon,
  MailIcon,
  OpenMailIcon,
  PaperclipIcon,
  PlusIcon,
  PlugIcon,
  SearchIcon,
  SettingsIcon,
  SmileIcon,
  SparkleIcon,
  TrashIcon,
  UsersIcon,
} from "./components/Icons";
import { SidebarItem } from "./components/SidebarItem";
import { FAVORITES, formatDetailDate, formatListDate } from "./constants";
import { Email, FilterTab } from "./types";

function statusBadge(text: string, tone: "success" | "error") {
  return (
    <div
      className={cx(
        "fixed right-6 top-6 z-[100] rounded-lg border px-3 py-2 text-xs font-medium shadow-lg",
        tone === "success"
          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
          : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
      )}
    >
      {text}
    </div>
  );
}

export default function MailApp() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const selectedEmailIdRef = useRef<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [hoveredEmailId, setHoveredEmailId] = useState<string | null>(null);

  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeToName, setComposeToName] = useState("");
  const [composeToEmail, setComposeToEmail] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSendingNew, setIsSendingNew] = useState(false);

  const [replyBody, setReplyBody] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const topSearchRef = useRef<HTMLInputElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const unreadCount = useMemo(
    () => emails.reduce((acc, email) => (email.is_read ? acc : acc + 1), 0),
    [emails]
  );

  const archivedCount = useMemo(
    () => emails.reduce((acc, email) => (email.is_archived ? acc + 1 : acc), 0),
    [emails]
  );

  useEffect(() => {
    selectedEmailIdRef.current = selectedEmailId;
  }, [selectedEmailId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        topSearchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!statusText && !errorText) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatusText(null);
      setErrorText(null);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [statusText, errorText]);

  const fetchEmails = useCallback(
    async (preferredSelectedId?: string | null) => {
      setIsLoadingList(true);
      setErrorText(null);
      try {
        const params = new URLSearchParams();
        params.set("filter", filterTab);
        if (searchQuery) {
          params.set("search", searchQuery);
        }

        const data = await apiRequest<Email[]>(`/emails?${params.toString()}`);
        setEmails(data);

        const selectedCandidate =
          preferredSelectedId === undefined
            ? selectedEmailIdRef.current
            : preferredSelectedId;

        const stillExists =
          selectedCandidate && data.some((email) => email.id === selectedCandidate)
            ? selectedCandidate
            : null;

        const preferredDefault =
          data.find((email) =>
            email.subject.toLowerCase().includes("proposal for partnership")
          ) ?? data[0];
        const nextSelection = stillExists ?? preferredDefault?.id ?? null;
        setSelectedEmailId(nextSelection);

        if (!nextSelection) {
          setSelectedEmail(null);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load emails.";
        setErrorText(message);
      } finally {
        setIsLoadingList(false);
      }
    },
    [filterTab, searchQuery]
  );

  const fetchEmailDetail = useCallback(async (emailId: string) => {
    setIsLoadingDetail(true);
    try {
      const email = await apiRequest<Email>(`/emails/${emailId}`);
      setSelectedEmail(email);
      setEmails((previous) => previous.map((item) => (item.id === email.id ? email : item)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load email.";
      setErrorText(message);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    if (!selectedEmailId) {
      setSelectedEmail(null);
      return;
    }

    void fetchEmailDetail(selectedEmailId);
  }, [fetchEmailDetail, selectedEmailId]);

  const updateEmail = useCallback(async (emailId: string, payload: Partial<Email>) => {
    const updated = await apiRequest<Email>(`/emails/${emailId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setEmails((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedEmail((current) => (current?.id === updated.id ? updated : current));

    return updated;
  }, []);

  const handleSelectEmail = useCallback(
    async (email: Email) => {
      setSelectedEmailId(email.id);

      if (!email.is_read) {
        try {
          await updateEmail(email.id, { is_read: true });
          if (filterTab === "unread") {
            await fetchEmails(email.id);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not update read state.";
          setErrorText(message);
        }
      }
    },
    [fetchEmails, filterTab, updateEmail]
  );

  const handleArchiveToggle = useCallback(
    async (email: Email) => {
      try {
        await updateEmail(email.id, { is_archived: !email.is_archived });
        await fetchEmails(email.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not update archive state.";
        setErrorText(message);
      }
    },
    [fetchEmails, updateEmail]
  );

  const handleReadToggle = useCallback(
    async (email: Email) => {
      try {
        await updateEmail(email.id, { is_read: !email.is_read });
        if (filterTab === "unread") {
          await fetchEmails(email.id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not update read state.";
        setErrorText(message);
      }
    },
    [fetchEmails, filterTab, updateEmail]
  );

  const handleDeleteEmail = useCallback(
    async (emailId: string) => {
      try {
        await apiRequest<void>(`/emails/${emailId}`, { method: "DELETE" });
        setStatusText("Email deleted.");
        await fetchEmails(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not delete email.";
        setErrorText(message);
      }
    },
    [fetchEmails]
  );

  const openNewCompose = useCallback(() => {
    setComposeToName("");
    setComposeToEmail("");
    setComposeSubject("");
    setComposeBody("");
    setIsComposeOpen(true);
  }, []);

  const sendNewMessage = useCallback(async () => {
    if (!composeToName.trim() || !composeToEmail.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setErrorText("Recipient, subject, and body are required.");
      return;
    }

    setIsSendingNew(true);
    try {
      const created = await apiRequest<Email>("/emails", {
        method: "POST",
        body: JSON.stringify({
          recipient: {
            name: composeToName.trim(),
            email: composeToEmail.trim(),
          },
          subject: composeSubject.trim(),
          body: composeBody.trim(),
          attachments: [],
        }),
      });

      setIsComposeOpen(false);
      setFilterTab("all");
      setSearchInput("");
      setSearchQuery("");
      setStatusText("Message sent.");
      setSelectedEmail(created);
      setSelectedEmailId(created.id);
      await fetchEmails(created.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send message.";
      setErrorText(message);
    } finally {
      setIsSendingNew(false);
    }
  }, [composeBody, composeSubject, composeToEmail, composeToName, fetchEmails]);

  const sendReply = useCallback(async () => {
    if (!selectedEmail || !replyBody.trim()) {
      setErrorText("Write a reply before sending.");
      return;
    }

    setIsSendingReply(true);
    try {
      const replySubject = selectedEmail.subject.startsWith("Re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`;

      const created = await apiRequest<Email>("/emails", {
        method: "POST",
        body: JSON.stringify({
          recipient: {
            name: selectedEmail.sender.name,
            email: selectedEmail.sender.email,
          },
          subject: replySubject,
          body: replyBody.trim(),
          attachments: [],
        }),
      });

      setReplyBody("");
      setFilterTab("all");
      setSearchInput("");
      setSearchQuery("");
      setStatusText("Reply sent.");
      setSelectedEmailId(created.id);
      setSelectedEmail(created);
      await fetchEmails(created.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send reply.";
      setErrorText(message);
    } finally {
      setIsSendingReply(false);
    }
  }, [fetchEmails, replyBody, selectedEmail]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#f0f2f5_40%,_#eceff1_100%)] p-6 md:p-10">
      {statusText && statusBadge(statusText, "success")}
      {errorText && statusBadge(errorText, "error")}

      <div className="mx-auto flex h-[760px] max-w-[1420px] overflow-hidden rounded-[18px] border border-[#e5e7eb] bg-[#fbfbfb] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <aside
          className={cx(
            "flex h-full shrink-0 flex-col border-r border-[#e6e7ea] bg-[#f4f5f7] transition-all duration-300",
            isSidebarCollapsed ? "w-[78px]" : "w-[258px]"
          )}
        >
          <div className="border-b border-[#e6e7ea] px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f97316] text-sm font-bold text-white shadow-sm">
                  *
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-[15px] font-semibold tracking-tight text-[#1f2937]">Cusana</span>
                )}
              </div>

              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#6b7280] transition hover:bg-white hover:text-[#1f2937]"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                title="Toggle sidebar"
              >
                <CollapseIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {!isSidebarCollapsed && (
              <label className="mt-3 flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-2 text-[#6b7280]">
                <SearchIcon className="h-3.5 w-3.5" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#a1a1aa]"
                  placeholder="Search"
                />
                <span className="font-mono text-[10px] text-[#9ca3af]">K</span>
              </label>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
            <div className="space-y-1">
              <SidebarItem label="Dashboard" icon={<HomeIcon />} collapsed={isSidebarCollapsed} />
              <SidebarItem label="Notifications" icon={<BellIcon />} collapsed={isSidebarCollapsed} />
              <SidebarItem label="Tasks" icon={<CheckSquareIcon />} collapsed={isSidebarCollapsed} />
              <SidebarItem label="Calendar" icon={<CalendarIcon />} collapsed={isSidebarCollapsed} />
              <SidebarItem label="Widgets" icon={<GridIcon />} collapsed={isSidebarCollapsed} />
            </div>

            {!isSidebarCollapsed && (
              <>
                <p className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                  Marketing
                </p>
                <div className="mt-2 space-y-1">
                  <SidebarItem label="Product" icon={<CubeIcon />} collapsed={false} />
                  <SidebarItem label="Emails" icon={<MailIcon />} active collapsed={false} />
                  <SidebarItem label="Integration" icon={<PlugIcon />} collapsed={false} />
                  <SidebarItem label="Contacts" icon={<UsersIcon />} collapsed={false} />
                </div>

                <p className="mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                  Favorite
                </p>
                <div className="mt-2 space-y-1 px-2">
                  {FAVORITES.map((favorite) => (
                    <div key={favorite.label} className="flex items-center gap-2 py-1.5 text-[13px] text-[#4b5563]">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-[3px]"
                        style={{ backgroundColor: favorite.color }}
                      />
                      <span>{favorite.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-[#e6e7ea] px-3 py-3">
            <div className="space-y-1">
              <SidebarItem label="Settings" icon={<SettingsIcon />} collapsed={isSidebarCollapsed} />
              <SidebarItem label="Help & Center" icon={<HelpIcon />} collapsed={isSidebarCollapsed} />
            </div>

            {!isSidebarCollapsed && (
              <div className="mt-3 flex items-center justify-between rounded-lg px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Avatar name="Richard Brown" size={26} />
                  <span className="text-[13px] font-medium text-[#374151]">Richard Brown</span>
                </div>
                <button type="button" className="text-[#9ca3af] hover:text-[#6b7280]">
                  <DotsIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[#fcfcfd]">
          <header className="border-b border-[#e6e7ea] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[28px] font-semibold tracking-tight text-[#1f2937]">Emails</h1>

              <div className="flex items-center gap-2">
                <label className="flex h-10 items-center gap-2 rounded-lg border border-[#e4e4e7] bg-white px-3 text-[#6b7280] shadow-[0_1px_0_rgba(229,231,235,0.8)]">
                  <SearchIcon className="h-4 w-4" />
                  <input
                    ref={topSearchRef}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search Email"
                    className="w-[155px] bg-transparent text-[13px] outline-none placeholder:text-[#a1a1aa]"
                  />
                </label>

                <button
                  type="button"
                  onClick={openNewCompose}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#101828] px-4 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(17,24,39,0.24)] transition hover:bg-[#1f2937]"
                >
                  <PlusIcon className="h-4 w-4" />
                  New Message
                </button>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="flex min-w-0 w-[360px] shrink-0 flex-col border-r border-[#e6e7ea] bg-white">
              <div className="flex items-center gap-1 border-b border-[#eceef1] px-4 py-3">
                {[
                  { key: "all", label: "All Mails", count: emails.length },
                  { key: "unread", label: "Unread", count: unreadCount },
                  { key: "archived", label: "Archive", count: archivedCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterTab(tab.key as FilterTab)}
                    className={cx(
                      "rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                      filterTab === tab.key
                        ? "bg-[#f3f4f6] text-[#111827]"
                        : "text-[#6b7280] hover:bg-[#f8fafc] hover:text-[#1f2937]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}

                <button
                  type="button"
                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                >
                  <DotsIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingList ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-16 animate-pulse rounded-lg bg-gradient-to-r from-[#f5f6f8] via-[#eef0f4] to-[#f5f6f8]"
                      />
                    ))}
                  </div>
                ) : emails.length === 0 ? (
                  <div className="p-6 text-center text-[13px] text-[#9ca3af]">No emails found.</div>
                ) : (
                  <div className="space-y-0.5 p-2">
                    {emails.map((email) => {
                      const isActive = email.id === selectedEmailId;
                      const isUnread = !email.is_read;
                      return (
                        <article
                          key={email.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => void handleSelectEmail(email)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              void handleSelectEmail(email);
                            }
                          }}
                          onMouseEnter={() => setHoveredEmailId(email.id)}
                          onMouseLeave={() => setHoveredEmailId((current) => (current === email.id ? null : current))}
                          className={cx(
                            "relative cursor-pointer rounded-xl border px-2.5 py-2.5 transition",
                            isActive
                              ? "border-[#dbe6ff] bg-[#f8fbff]"
                              : "border-transparent hover:border-[#edf2f7] hover:bg-[#fbfcff]"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <Avatar name={email.sender.name} size={30} />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={cx(
                                    "truncate text-[12.5px]",
                                    isUnread ? "font-semibold text-[#111827]" : "font-medium text-[#374151]"
                                  )}
                                >
                                  {email.sender.name}
                                </h3>
                                <span className="ml-auto shrink-0 text-[11px] text-[#9ca3af]">
                                  {formatListDate(email)}
                                </span>
                              </div>

                              <p className="mt-0.5 truncate text-[13px] font-semibold text-[#1f2937]">{email.subject}</p>
                              <p className="mt-0.5 truncate text-[12px] text-[#9ca3af]">{email.preview}</p>
                            </div>

                            {isUnread && <span className="mt-1 h-2 w-2 rounded-full bg-[#3b82f6]" />}
                          </div>

                          {hoveredEmailId === email.id && (
                            <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md border border-[#e5e7eb] bg-white px-1 py-0.5 shadow-sm">
                              <button
                                type="button"
                                title="Archive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleArchiveToggle(email);
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]"
                              >
                                <ArchiveIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Forward"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedEmailId(email.id);
                                  setReplyBody((current) =>
                                    current || `Forwarding ${email.subject}\n\n`
                                  );
                                  replyRef.current?.focus();
                                }}
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]"
                              >
                                <ForwardIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="More"
                                className="inline-flex h-6 w-6 items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]"
                              >
                                <DotsIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-[#eceef1] px-4 py-3">
                <div className="h-[3px] w-[86px] rounded-full bg-gradient-to-r from-[#2dd4bf] via-[#10b981] to-[#0ea5e9]" />
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#9ca3af]">
                  <span>6.2GB of 10GB has been used</span>
                  <span>1-20 of 2,312</span>
                </div>
              </div>
            </section>

            <section className="min-w-0 flex-1 bg-[#fcfcfd] p-5">
              {!selectedEmailId ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d1d5db] text-[14px] text-[#9ca3af]">
                  Select an email to view details.
                </div>
              ) : isLoadingDetail && !selectedEmail ? (
                <div className="space-y-3">
                  <div className="h-12 animate-pulse rounded-xl bg-[#eef2f7]" />
                  <div className="h-[220px] animate-pulse rounded-xl bg-[#eef2f7]" />
                  <div className="h-[220px] animate-pulse rounded-xl bg-[#eef2f7]" />
                </div>
              ) : selectedEmail ? (
                <div className="flex h-full min-h-0 flex-col gap-3">
                  <article className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f1f5f9] pb-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={selectedEmail.sender.name} size={34} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111827]">
                            <span className="truncate">{selectedEmail.sender.name}</span>
                            <span className="truncate text-[12px] font-normal text-[#9ca3af]">
                              {selectedEmail.sender.email}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#9ca3af]">To: {selectedEmail.recipient.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="mr-2 text-[12px] text-[#9ca3af]">{formatDetailDate(selectedEmail.date)}</span>

                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8fafc]"
                          title={selectedEmail.is_read ? "Mark as unread" : "Mark as read"}
                          onClick={() => void handleReadToggle(selectedEmail)}
                        >
                          <OpenMailIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8fafc]"
                          title={selectedEmail.is_archived ? "Move to inbox" : "Archive"}
                          onClick={() => void handleArchiveToggle(selectedEmail)}
                        >
                          <ArchiveIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8fafc]"
                          title="Forward"
                          onClick={() => {
                            setReplyBody((current) =>
                              current || `Forwarding ${selectedEmail.subject}\n\n`
                            );
                            replyRef.current?.focus();
                          }}
                        >
                          <ForwardIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#fee2e2] text-[#ef4444] hover:bg-[#fef2f2]"
                          title="Delete"
                          onClick={() => void handleDeleteEmail(selectedEmail.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-tight text-[#111827]">
                      {selectedEmail.subject}
                    </h2>

                    <div className="mt-4 space-y-4 text-[14px] leading-7 text-[#374151]">
                      {selectedEmail.body.split("\n\n").map((paragraph, index) => (
                        <p key={`${selectedEmail.id}-paragraph-${index}`}>{paragraph}</p>
                      ))}
                    </div>

                    {selectedEmail.attachments.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((attachment) => (
                          <div
                            key={`${selectedEmail.id}-${attachment.filename}`}
                            className="flex min-w-[220px] items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-3 py-2"
                          >
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff7ed] text-[#ea580c]">
                              <PaperclipIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-semibold text-[#374151]">{attachment.filename}</p>
                              <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
                                <span>{attachment.size}</span>
                                <a
                                  href={attachment.url}
                                  className="font-semibold text-[#f97316] hover:text-[#ea580c]"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="min-h-[240px] rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                      <div className="flex items-center gap-2 text-[13px] text-[#6b7280]">
                        <Avatar name={selectedEmail.sender.name} size={22} />
                        <span className="font-medium text-[#374151]">To:</span>
                        <span className="font-semibold text-[#111827]">{selectedEmail.sender.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                          title="Expand"
                        >
                          <ExpandIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                          title="Clear"
                          onClick={() => setReplyBody("")}
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      ref={replyRef}
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      placeholder="Write your reply"
                      className="mt-3 h-[140px] w-full resize-none border-none bg-transparent text-[14px] leading-7 text-[#374151] outline-none placeholder:text-[#9ca3af]"
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#f1f5f9] pt-3">
                      <button
                        type="button"
                        disabled={isSendingReply}
                        onClick={() => void sendReply()}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#101828] px-3.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.22)] transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSendingReply ? "Sending" : "Send Now"}
                      </button>

                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f8fafc]"
                        title="Schedule"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </button>

                      <div className="ml-1 flex items-center gap-1 text-[#9ca3af]">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                          title="Attach"
                        >
                          <PaperclipIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                          title="Emoji"
                        >
                          <SmileIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                          title="Template"
                        >
                          <SparkleIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                          title="More"
                        >
                          <DotsIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d1d5db] text-[14px] text-[#9ca3af]">
                  Email detail unavailable.
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-[560px] rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <h3 className="text-[18px] font-semibold text-[#111827]">New Message</h3>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#6b7280]"
                onClick={() => setIsComposeOpen(false)}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-[12px] font-semibold text-[#4b5563]">
                  Recipient Name
                  <input
                    value={composeToName}
                    onChange={(event) => setComposeToName(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] font-medium text-[#111827] outline-none transition focus:border-[#d1d5db]"
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="space-y-1 text-[12px] font-semibold text-[#4b5563]">
                  Recipient Email
                  <input
                    value={composeToEmail}
                    onChange={(event) => setComposeToEmail(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] font-medium text-[#111827] outline-none transition focus:border-[#d1d5db]"
                    placeholder="jane.doe@business.com"
                  />
                </label>
              </div>

              <label className="space-y-1 text-[12px] font-semibold text-[#4b5563]">
                Subject
                <input
                  value={composeSubject}
                  onChange={(event) => setComposeSubject(event.target.value)}
                  className="h-10 w-full rounded-lg border border-[#e5e7eb] px-3 text-[13px] font-medium text-[#111827] outline-none transition focus:border-[#d1d5db]"
                  placeholder="Proposal Follow-up"
                />
              </label>

              <label className="space-y-1 text-[12px] font-semibold text-[#4b5563]">
                Message
                <textarea
                  value={composeBody}
                  onChange={(event) => setComposeBody(event.target.value)}
                  className="h-40 w-full resize-none rounded-lg border border-[#e5e7eb] px-3 py-2 text-[13px] leading-6 text-[#111827] outline-none transition focus:border-[#d1d5db]"
                  placeholder="Write your message"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#f1f5f9] pt-4">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="h-9 rounded-lg border border-[#e5e7eb] px-4 text-[13px] font-semibold text-[#4b5563] transition hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingNew}
                onClick={() => void sendNewMessage()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#101828] px-4 text-[13px] font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {isSendingNew ? "Sending" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
