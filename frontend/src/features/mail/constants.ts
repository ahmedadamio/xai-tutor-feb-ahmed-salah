import { Email } from "./types";

export const FAVORITES = [
  { label: "Opportunity Stages", color: "#f97316" },
  { label: "Key Metrics", color: "#10b981" },
  { label: "Product Plan", color: "#f59e0b" },
] as const;

export const AVATAR_COLORS = [
  "#fee2e2",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#ede9fe",
  "#ffe4e6",
];

export const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

export const DETAIL_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
});

export const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
});

export function formatListDate(email: Email) {
  const date = new Date(email.date);
  if (!email.is_read) {
    return TIME_FORMATTER.format(date);
  }
  return DATE_FORMATTER.format(date);
}

export function formatDetailDate(value: string) {
  return DETAIL_DATE_FORMATTER.format(new Date(value)).replace(",", "");
}
