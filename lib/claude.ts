import type { Email, EmailAnalysis } from "@/types";

export async function analyzeEmail(email: Email): Promise<EmailAnalysis> {
  const prompt = `Analyze this email and respond with JSON only, no markdown:
{
  "urgency_score": 1-5 (5 = most urgent),
  "is_urgent": boolean (true if score >= 4),
  "action_item": "extracted action the recipient needs to take (1 sentence)",
  "summary": "2-3 sentence summary of what this email is about",
  "suggested_due": "ISO date if deadline detected, null otherwise",
  "category": "urgent" | "school" | "unsubscribe_candidate" | "normal"
}

Urgency signals: explicit deadlines, words like "ASAP/urgent/EOD", someone waiting on response, time-sensitive requests, financial/billing issues.
School signals: sender contains bronxvilleschool.org, bcsdny.org, seesaw.me, or keywords like permission slip, report card, early dismissal.
Unsubscribe signals: marketing emails, newsletters, promotional content, has List-Unsubscribe header.

Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.snippet}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || "{}";

  try {
    // Clean up potential markdown formatting
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    // Return default analysis if parsing fails
    return {
      urgency_score: 2,
      is_urgent: false,
      action_item: "Review email",
      summary: email.snippet.slice(0, 200),
      suggested_due: null,
      category: "normal",
    };
  }
}

export async function analyzeEmails(emails: Email[]): Promise<Email[]> {
  const analyzed = await Promise.all(
    emails.map(async (email) => {
      try {
        const analysis = await analyzeEmail(email);
        return { ...email, analysis };
      } catch (error) {
        console.error(`Failed to analyze email ${email.id}:`, error);
        return {
          ...email,
          analysis: {
            urgency_score: 2,
            is_urgent: false,
            action_item: "Review email",
            summary: email.snippet.slice(0, 200),
            suggested_due: null,
            category: "normal" as const,
          },
        };
      }
    })
  );

  // Sort by urgency score descending
  return analyzed.sort(
    (a, b) => (b.analysis?.urgency_score || 0) - (a.analysis?.urgency_score || 0)
  );
}
