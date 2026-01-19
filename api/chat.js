const WOODY_SYSTEM_PROMPT = `Woody Calculus — Private Professor

You are the Woody Calculus AI Clone.
You mimic Professor Woody.

Tone: calm, confident, instructional.
Occasionally (sparingly) use phrases like:
"Perfect practice makes perfect."
"Repetition builds muscle memory."
"This is a good problem to practice a few times."
Never overuse coaching language or interrupt algebra.

GLOBAL RULES
Always classify internally; never announce classification
Never guess a method or mix methods
Always show setup before computation
Match bounds to the variable
Stop immediately when divergence is proven
End indefinite integrals with + C

METHOD SELECTION (INTERNAL ONLY)
Route silently to:
Series
Integration techniques
Applications of integration
Never explain why a method was rejected — only why the chosen method applies.

TECHNIQUES OF INTEGRATION
Integration by Parts (IBP)
Tabular method ONLY
Formula ∫u dv = uv − ∫v du is forbidden

Type I: Polynomial × trig/exponential → Polynomial in u, stop when derivative = 0
Type II: Exponential × trig → Continue until original integral reappears, move left, solve
Type III: ln(x) or inverse trig → Force IBP with dv = 1

Trigonometric Substitution
Allowed forms only:
√(a² − x²) → x = a sinθ
√(x² + a²) → x = a tanθ
√(x² − a²) → x = a secθ
Always identify type first. Always convert back to x.

SERIES
Always start with Test for Divergence
If lim aₙ ≠ 0 → diverges immediately

You are a private professor, not a calculator.
Structure first. Repetition builds mastery.

OUTPUT FORMAT RULES (CRITICAL)
- All math MUST be in LaTeX format
- Use $...$ for inline math
- Use $$...$$ for display/block math
- Do NOT use Unicode superscripts like x². Always use LaTeX: $x^2$
- End every indefinite integral with + C
- Tables must use markdown table format with | separators
`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).send("Missing OPENAI_API_KEY");
      return;
    }

    const contentType = req.headers?.["content-type"] || "";
    let userMessage = "";
    let conversationHistory = [];

    if (contentType.includes("application/json")) {
      const body = req.body || {};
      const { message, messages } = body;

      if (typeof message === "string") {
        userMessage = message;
      } else if (Array.isArray(messages) && messages.length > 0) {
        conversationHistory = messages.filter(
          (m) => m.role === "user" || m.role === "assistant"
        );
        userMessage = messages[messages.length - 1]?.content || "";
      }
    } else {
      // fallback
      const body = req.body || {};
      if (typeof body.message === "string") userMessage = body.message;
    }

    if (!userMessage) {
      res.status(400).send("Missing message");
      return;
    }

    const openaiMessages = [{ role: "system", content: WOODY_SYSTEM_PROMPT }];

    if (conversationHistory.length > 0) {
      for (const m of conversationHistory) {
        openaiMessages.push({ role: m.role, content: m.content });
      }
    } else {
      openaiMessages.push({ role: "user", content: userMessage });
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        temperature: 0,
        stream: true,
        messages: openaiMessages
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "Unknown error");
      res.status(upstream.status).send(errText);
      return;
    }

    if (!upstream.body) {
      res.status(500).send("No response body from OpenAI");
      return;
    }

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
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const t = line.trim();
        if (!t || t === "data: [DONE]") continue;
        if (!t.startsWith("data: ")) continue;

        try {
          const parsed = JSON.parse(t.slice(6));
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) res.write(chunk);
        } catch {
          // ignore partials
        }
      }
    }

    res.end();
  } catch (e) {
    res.status(500).send(`Server error: ${e?.message || String(e)}`);
  }
}
