import { google } from "googleapis";
import type { Email } from "@/types";

export type DateRange = "today" | "yesterday" | "7d" | "30d" | "60d" | "90d";

export async function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

function getDateRangeQuery(range: DateRange): string {
  const now = new Date();
  let afterDate: Date;
  let beforeDate: Date | null = null;

  switch (range) {
    case "today":
      afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "yesterday":
      afterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      beforeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      afterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      afterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "60d":
      afterDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      afterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
  let query = `is:unread after:${afterTimestamp}`;

  if (beforeDate) {
    const beforeTimestamp = Math.floor(beforeDate.getTime() / 1000);
    query += ` before:${beforeTimestamp}`;
  }

  return query;
}

export async function fetchUnreadEmails(accessToken: string, range: DateRange = "today"): Promise<Email[]> {
  const gmail = await getGmailClient(accessToken);

  const query = getDateRangeQuery(range);

  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const messages = response.data.messages || [];

  const emails: Email[] = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });

      const headers = detail.data.payload?.headers || [];
      const fromHeader = headers.find((h) => h.name?.toLowerCase() === "from");
      const subjectHeader = headers.find((h) => h.name?.toLowerCase() === "subject");
      const dateHeader = headers.find((h) => h.name?.toLowerCase() === "date");

      const fromRaw = fromHeader?.value || "Unknown";
      const fromMatch = fromRaw.match(/^(.+?)\s*<(.+)>$/);

      return {
        id: msg.id!,
        threadId: msg.threadId!,
        from: fromMatch ? fromMatch[2] : fromRaw,
        fromName: fromMatch ? fromMatch[1].replace(/"/g, "") : fromRaw,
        subject: subjectHeader?.value || "(No Subject)",
        snippet: detail.data.snippet || "",
        date: dateHeader?.value || new Date().toISOString(),
      };
    })
  );

  return emails;
}

export async function markEmailAsRead(accessToken: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(accessToken);

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}

export async function archiveEmail(accessToken: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(accessToken);

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["INBOX", "UNREAD"],
    },
  });
}
