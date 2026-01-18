import type { VercelRequest, VercelResponse } from "@vercel/node";
import { WOODY_SYSTEM_PROMPT } from "../src/constants/systemPrompt";

/**
 * Trig-sub constant guard:
 * If user asks for sqrt(x^2 - C), sqrt(C - x^2), sqrt(x^2 + C),
 * append a non-negotiable note that a = sqrt(C), not C.
 *
 * This is NOT “more prompt” — it’s input conditioning to prevent the exact a^2→a bug.
 */
function applyTrigSubConstantGuard(input: string): string {
  const raw = (input || "").trim();
  const t = raw.toLowerCase();

  // Try to catch common user phrasings:
  // - "sqrt(x^2-10)"
  // - "square root of x^2-10"
  // - "sqrt(x^2 - 10)"
  // - "sqrt(10 - x^2)"
  // - "sqrt(x^2 + 10)"
  //
  // We only guard numeric constants (10, 18, 3/2, etc. is out-of-scope for now).
  const patterns: Array<{ re: RegExp; kind: "minus" | "plus" | "cminus" }> = [
    // sqrt(x^2 - 10) OR square root of x^2 - 10
    { re: /(sqrt\(\s*x\^?2\s*-\s*(\d+(?:\.\d+)?)\s*\))|(square root of\s*x\^?2\s*-\s*(\d+(?:\.\d+)?))/i, kind: "minus" },
    // sqrt(x^2 + 10) OR square root of x^2 + 10
    { re: /(sqrt\(\s*x\^?2\s*\+\s*(\d+(?:\.\d+)?)\s*\))|(square root of\s*x\^?2\s*\+\s*(\d+(?:\.\d+)?))/i, kind: "plus" },
    // sqrt(10 - x^2) OR square root of 10 - x^2
    { re: /(sqrt\(\s*(\d+(?:\.\d+)?)\s*-\s*x\^?2\s*\))|(square root of\s*(\d+(?:\.\d+)?)\s*-\s*x\^?2)/i, kind: "cminus" },
  ];

  let C: string | null = null;
  let type: "Type 1" | "Type 2" | "Type 3" | null = null;
  let sub: string | null = null;

  for (const p of patterns) {
    const m = raw.match(p.re);
    if (!m) continue;

    // Find the numeric capture in the match groups
    const num = (m[2] || m[4] || m[3] || m[5] || m[6] || m[8]) as string | undefined;
    if (!num) continue;

    C = num;

    if (p.kind === "minus") {
      type = "Type 3";
      sub = `x = \\sqrt{${C}}\\sec\\theta`;
    } else if (p.kind === "plus") {
      type = "Type 2";
      sub = `x = \\sqrt{${C}}\\tan\\theta`;
    } else {
      type = "Type 1";
      sub = `x = \\sqrt{${C}}\\sin\\theta`;
    }
    break;
  }

  // If nothing matched, return original input unchanged
  if (!C || !type || !sub) return raw;

  // Append a short, deterministic “must obey” instruction.
  // This is tiny but prevents the exact "a^2=10 so a=10" failure.
  return `${raw}

CRITICAL TRIG-SUB NOTE: This is ${type} with a^2 = ${C}, so a = \\sqrt{${C}} (NOT ${C}). Use $$${sub}$$.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    res.status(500).send("Missing OPENAI_API_KEY");
    return;
  }

  // Parse request body - handle both JSON and FormData
  let userMessage = "";
  let conversationHistory: Array<{ role: string; content: string }> = [];

  // Check content type
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    // JSON body
    const { message, messages } = req.body ?? {};

    if (typeof message === "string") {
      userMessage = message;
    } else if (Array.isArray(messages) && messages.length > 0) {
      // Support full conversation history
      conversationHistory = messages.filter(
        (m: { role: string; content: string }) =>
          m.role === "user" || m.role === "assistant"
      );
      userMessage = messages[messages.length - 1]?.content || "";
    }
  } else if (contentType.includes("multipart/form-data")) {
    // FormData - parse it manually from body
    // For Vercel, the body should already be parsed
    const body = req.body;

    if (typeof body?.message === "string") {
      userMessage = body.message;
    } else if (body?.message) {
      userMessage = String(body.message);
    }

    // Handle conversation history if provided
    if (body?.history) {
      try {
        conversationHistory = JSON.parse(body.history);
      } catch {
        // Ignore parse errors
      }
    }
  } else {
    // Try to parse as JSON anyway
    try {
      const { message, messages } = req.body ?? {};

      if (typeof message === "string") {
        userMessage = message;
      } else if (Array.isArray(messages) && messages.length > 0) {
        userMessage = messages[messages.length - 1]?.content || "";
      }
    } catch {
      // Ignore
    }
  }

  if (!userMessage) {
    res.status(400).send("Missing message");
    return;
  }

  // ✅ Apply trig-sub constant guard BEFORE sending to the model
  userMessage = applyTrigSubConstantGuard(userMessage);

  // Build messages array for OpenAI
  const openaiMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: WOODY_SYSTEM_PROMPT }];

  // Add conversation history if available
  if (conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        openaiMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }
    // Make sure the newest user message is the guarded one
    // (some clients include history but omit the final message)
    const last = conversationHistory[conversationHistory.length - 1];
    if (!last || last.role !== "user") {
      openaiMessages.push({ role: "user", content: userMessage });
    }
  } else {
    // Just add the current user message
    openaiMessages.push({ role: "user", content: userMessage });
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        temperature: 0,
        stream: true,
        messages: openaiMessages,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "Unknown error");
      console.error("OpenAI API error:", upstream.status, errorText);
      res.status(upstream.status).send(`OpenAI API error: ${errorText}`);
      return;
    }

    if (!upstream.body) {
      res.status(500).send("No response body from OpenAI");
      return;
    }

    // Set headers for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine === "data: [DONE]") {
          continue;
        }

        if (trimmedLine.startsWith("data: ")) {
          const jsonStr = trimmedLine.slice(6);

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              res.write(content);
            }
          } catch (parseError) {
            // Skip invalid JSON (can happen with partial chunks)
            console.error("JSON parse error:", parseError);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim() && buffer.trim() !== "data: [DONE]") {
      if (buffer.trim().startsWith("data: ")) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(6));
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(content);
          }
        } catch {
          // Ignore
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("Stream error:", error);
    res
      .status(500)
      .send(
        `Stream error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
  }
}
