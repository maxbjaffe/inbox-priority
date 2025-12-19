import type { Email, TodoistTask } from "@/types";

export async function createTodoistTask(task: TodoistTask): Promise<{ id: string }> {
  const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TODOIST_API_TOKEN}`,
    },
    body: JSON.stringify({
      content: task.title,
      description: task.description,
      priority: task.priority,
      due_string: task.due_string,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Todoist API error: ${error}`);
  }

  return response.json();
}

export function emailToTodoistTask(email: Email, dueDate?: string): TodoistTask {
  const priority = email.analysis?.urgency_score === 5
    ? 4 // p1 in Todoist (reversed: 4 = highest)
    : email.analysis?.urgency_score === 4
    ? 3 // p2
    : 2; // p3

  const summary = email.analysis?.summary || email.snippet.slice(0, 200);
  const actionItem = email.analysis?.action_item || "Review this email";

  const description = `**Action:** ${actionItem}

**Summary:** ${summary}

**From:** ${email.fromName} <${email.from}>

---
📧 Open email: https://mail.google.com/mail/u/0/#inbox/${email.id}`;

  return {
    title: email.subject,
    description,
    priority,
    due_string: dueDate || email.analysis?.suggested_due || undefined,
  };
}
