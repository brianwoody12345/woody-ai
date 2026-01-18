// api/chat.js
import { WOODY_SYSTEM_PROMPT } from "./systemPrompt.js";

export default async function handler(req, res) {
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
  let conversationHistory = [];

  const contentType = req.headers?.["content-type"] || "";

  if (contentType.includes("application/json")) {
    const { message, messages } = req.body ?? {};

    if (typeof message === "string") {
      userMessage = message;
    } else if (Array.isArray(messages) && messages.length > 0) {
      conversationHistory = messages.filter(
        (m) => m.role === "user" || m.role === "assistant"
      );
      userMessage = messages[messages.length - 1]?.content || "";
    }
  } else if (contentType.includes("multipart/form-data")) {
    const body = req.body ?? {};

    if (typeof body?.message === "string") userMessage = body.message;
    else if (body?.message) userMessage = String(body.message);

    if (body?.history) {
      try {
        conversationHistory = JSON.parse(body.history);
      } catch {
        // ignore
      }
    }
  } else {
    // fallback
    const { message, messages } = req.body ?? {};
    if (typeof message === "string") userMessage = message;
    else if (Array.isArray(messages) && messages.length > 0) {
      userMessage = messages[messages.length - 1]?.content || "";
    }
  }

  if (!userMessage) {
    res.status(400).send("Missing message");
    return;
  }

  // Build messages array for OpenAI
  const openaiMessages = [{ role: "system", content: WOODY_SYSTEM_PROMPT }];

  // Add conversation history if available
  if (conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        openaiMessages.push({ role: msg.role, content: msg.content });
      }
    }
  } else {
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
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) res.write(content);
        } catch {
          // ignore partial chunks
        }
      }
    }

    // Process any remaining buffer
    const tail = buffer.trim();
    if (tail && tail !== "data: [DONE]" && tail.startsWith("data: ")) {
      try {
        const parsed = JSON.parse(tail.slice(6));
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) res.write(content);
      } catch {
        // ignore
      }
    }

    res.end();
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).send("Server error");
  }
}
