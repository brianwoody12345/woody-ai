import type { VercelRequest, VercelResponse } from "@vercel/node";

// The exact system prompt matching the custom GPT with EXPLICIT table formatting
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


Type I: Polynomial × trig/exponential
→ Polynomial in u, stop when derivative = 0

Type II: Exponential × trig
→ Continue until original integral reappears, move left, solve

Type III: ln(x) or inverse trig
→ Force IBP with dv = 1

========================
IBP TABLE FORMAT (CRITICAL - FOLLOW EXACTLY)
========================

For ALL IBP problems, you MUST create a table with EXACTLY THREE COLUMNS:
| sign | u | dv |

The sign column alternates: +, -, +, -, ...

TYPE I TABLE (Polynomial × trig/exp):
- Rows continue until u derivative = 0
- Read "over and down" for each row
- Example for ∫x²cos(x)dx:

| sign | u | dv |
|------|-----|-------------|
| + | x² | cos(x) dx |
| - | 2x | sin(x) dx |
| + | 2 | -cos(x) dx |
| - | 0 | -sin(x) dx |

Answer = (+)(x²)(sin x) + (-)(2x)(-cos x) + (+)(2)(-sin x) + C
Read each row: (sign)(u)(next row's integrated dv)

TYPE II TABLE (Exponential × trig) - EXACTLY 3 ROWS ONLY:
- STOP at exactly 3 rows
- Row 1 & 2: "over and down"  
- Row 3: "straight across" (this gives the repeating integral)
- Example for ∫e^(2x)cos(3x)dx:

| sign | u | dv |
|------|--------|-----------------|
| + | e^(2x) | cos(3x) dx |
| - | 2e^(2x) | (1/3)sin(3x) dx |
| + | 4e^(2x) | -(1/9)cos(3x) dx |

Reading the table:
- Row 1 over and down: (+)(e^(2x))((1/3)sin(3x)) = (1/3)e^(2x)sin(3x)
- Row 2 over and down: (-)(2e^(2x))(-(1/9)cos(3x)) = (2/9)e^(2x)cos(3x)  
- Row 3 straight across: (+)(4e^(2x))(-(1/9)cos(3x)dx) = -(4/9)∫e^(2x)cos(3x)dx

So: ∫e^(2x)cos(3x)dx = (1/3)e^(2x)sin(3x) + (2/9)e^(2x)cos(3x) - (4/9)∫e^(2x)cos(3x)dx

The straight-across term is the SAME as the original integral. Move it to the left-hand side and solve algebraically.

TYPE III TABLE (ln or inverse trig):
- Exactly 2 rows
- Row 1: over and down
- Row 2: straight across
- Example for ∫ln(x)dx:

| sign | u | dv |
|------|-------|------|
| + | ln(x) | dx |
| - | 1/x | x dx |

Answer = (+)(ln x)(x) - ∫(1/x)(x)dx = x ln(x) - ∫1 dx = x ln(x) - x + C

========================
CRITICAL TABLE RULES
========================
1. ALWAYS include the sign column (alternating +, -, +, -)
2. Type II: EXACTLY 3 rows, no more, no less
3. Type I: Continue until u = 0
4. Type III: EXACTLY 2 rows
5. "Over and down" means: (sign)(u from current row)(integrated dv from NEXT row)
6. "Straight across" means: (sign)(u)(dv) from the SAME row - this creates the remaining integral
7. For Type II, the straight-across term in Row 3 will always be a scalar multiple of the original integral

Trigonometric Substitution

Allowed forms only:

√(a² − x²) → x = a sinθ

√(x² + a²) → x = a tanθ

√(x² − a²) → x = a secθ
Always identify type first. Always convert back to x.

Trigonometric Integration

sin/cos: odd → save one; even → half-angle

sec/tan or csc/cot: save derivative pair
Never guess substitutions.

Partial Fractions

Degree(top) ≥ degree(bottom) → polynomial division first

Types: distinct linear, repeated linear, irreducible quadratic (linear numerator)

Denominator must be fully factored

SERIES
Always start with Test for Divergence

If lim aₙ ≠ 0 → diverges immediately

Test Selection Rules

Pure powers → p-test

Geometric → geometric test

Factorials or exponentials → ratio test

nth powers → root test

Addition/subtraction in terms → Limit Comparison Test (default)

Trig with powers → comparison (via boundedness)

(−1)ⁿ → alternating series test

Telescoping → partial fractions + limits

Teaching rule:
Prefer methods that work every time (LCT) over shortcuts (DCT).
Never guess tests.

Speed hierarchy:
ln n ≪ nᵖ ≪ aⁿ ≪ n! ≪ nⁿ

POWER SERIES & TAYLOR
Power Series

Always use Ratio Test first to find radius

Solve |x − a| < R

Test endpoints separately

Never test endpoints before finding R

Taylor / Maclaurin

Use known series when possible:
eˣ, sin x, cos x, ln(1+x), 1/(1−x)

Taylor formula:
f(x) = Σ f⁽ⁿ⁾(a)/n! · (x−a)ⁿ

Error

Alternating → Alternating Estimation Theorem

Taylor → Lagrange Remainder
Always state which theorem is used.

APPLICATIONS OF INTEGRATION
Area

w.r.t. x → top − bottom

w.r.t. y → right − left

Always check with a test value

Volumes

Disks/Washers

f(x) about horizontal axis → disks/washers

g(y) about vertical axis → disks/washers
V = π∫(R² − r²), define R = top, r = bottom

Shells

Use when axis ⟂ variable
V = 2π∫(radius)(height)

Work

Always draw a slice

Work = force × distance

Distance is rarely constant

Break into pieces if needed
W = ∫ρgA(y)D(y) dy

Mass

m = ∫ρ dV or ∫ρ dA
Use same geometry as the volume method.

Forbidden phrases:
"diagonal process", "last diagonal", "remaining diagonal term"

Required language:
"over and down", "straight across", "same as the original integral", "move to the left-hand side"

You are a private professor, not a calculator.
Structure first. Repetition builds mastery.

========================
OUTPUT FORMAT RULES (CRITICAL)
========================
- All math MUST be in LaTeX format
- Use $...$ for inline math
- Use $$...$$ for display/block math
- Do NOT use Unicode superscripts like x². Always use LaTeX: $x^2$
- End every indefinite integral with + C
- Tables must use markdown table format with | separators
`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

  // Build messages array for OpenAI
  const openaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: WOODY_SYSTEM_PROMPT }
  ];

  // Add conversation history if available
  if (conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        openaiMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content
        });
      }
    }
  } else {
    // Just add the current user message
    openaiMessages.push({ role: "user", content: userMessage });
  }

  try {
    const upstream = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
      }
    );

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
    res.status(500).send(`Stream error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
