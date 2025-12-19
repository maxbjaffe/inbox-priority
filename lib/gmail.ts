import { google } from "googleapis";
import type { Email } from "@/types";

export async function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function fetchUnreadEmails(accessToken: string): Promise<Email[]> {
  const gmail = await getGmailClient(accessToken);

  // Get emails from last 24 hours
  const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

  const response = await gmail.users.messages.list({
    userId: "me",
    q: `is:unread after:${oneDayAgo}`,
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
