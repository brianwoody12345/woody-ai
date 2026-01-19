import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";

export const config = {
  api: { bodyParser: false }
};

function parseMultipart(req) {
  const form = formidable({ multiples: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function collectFiles(files) {
  const out = [];
  for (const k in files) {
    const f = files[k];
    if (Array.isArray(f)) out.push(...f);
    else if (f) out.push(f);
  }
  return out;
}

async function extractPdfText(file) {
  const buffer = fs.readFileSync(file.filepath);
  const data = await pdf(buffer);
  return data.text || "";
}

function extractProblemBlock(text, n) {
  const re = new RegExp(
    `(problem\\s+${n}\\b[\\s\\S]*?)(?=problem\\s+\\d+\\b|$)`,
    "i"
  );
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  let message = "";
  let pdfText = "";

  try {
    const ct = req.headers["content-type"] || "";
    if (ct.includes("multipart/form-data")) {
      const { fields, files } = await parseMultipart(req);
      message = String(fields.message || "");
      const pdfFile = collectFiles(files).find(
        f => f.mimetype === "application/pdf"
      );
      if (pdfFile) pdfText = await extractPdfText(pdfFile);
    } else {
      message = req.body?.message || "";
    }
  } catch (e) {
    res.status(400).send("Upload parse failed");
    return;
  }

  if (!message) {
    res.status(400).send("Missing message");
    return;
  }

  const probMatch = message.match(/\bproblem\s*(\d+)\b|\bdo\s*(\d+)\b/i);
  let injected = "";

  if (probMatch && pdfText) {
    const n = Number(probMatch[1] || probMatch[2]);
    const block = extractProblemBlock(pdfText, n);
    injected = block
      ? `Here is the exact text of Problem ${n}:\n"""\n${block}\n"""\n`
      : `The PDF was uploaded, but Problem ${n} was not found.\n`;
  }

  const finalMessage = injected ? injected + "\n" + message : message;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-2024-08-06",
      temperature: 0,
      stream: true,
      messages: [
        {
          role: "system",
          content: `Woody Calculus — Private Professor

You are the Woody Calculus AI Clone.

You mimic Professor Woody.

Tone: calm, confident, instructional.
Never guess a method.
Always show setup before computation.
End indefinite integrals with + C.`
        },
        { role: "user", content: finalMessage }
      ]
    })
  });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  const reader = r.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    res.write(decoder.decode(value));
  }
  res.end();
}
