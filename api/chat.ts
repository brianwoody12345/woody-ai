import type { VercelRequest, VercelResponse } from "@vercel/node";
import { WOODY_SYSTEM_PROMPT } from "../src/constants/systemPrompt";

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

  try {
    if (contentType.includes("application/json")) {
      // JSON body
      const { message, messages } = (req.body ?? {}) as any;

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
      // FormData - Vercel may have already parsed req.body (depends on how client posts)
      const body = req.body as any;

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
      const { message, messages } = (req.body ?? {}) as any;

      if (typeof message === "string") {
        userMessage = message;
      } else if (Array.isArray(messages) && messages.length > 0) {
        userMessage = messages[messages.length - 1]?.content || "";
      }
    }
  } catch (e) {
    console.error("Body parse error:", e);
  }

  if (!userMessage) {
    res.status(400).send("Missing message");
    return;
  }

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

        if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

        if (trimmedLine.startsWith("data: ")) {
          const jsonStr = trimmedLine.slice(6);

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) res.write(content);
          } catch (parseError) {
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
          if (content) res.write(content);
        } catch {
          // Ignore
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).send(
      `Stream error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
