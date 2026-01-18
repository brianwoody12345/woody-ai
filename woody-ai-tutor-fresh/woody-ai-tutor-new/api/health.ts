// Simple health check for Vercel.
// Visit /api/health to verify the serverless layer is deployed and has env vars.

export default function handler(req: any, res: any) {
  const hasKey = Boolean(process.env.OPENAI_API_KEY && String(process.env.OPENAI_API_KEY).trim());
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      ok: true,
      hasOpenAIKey: hasKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    })
  );
}
