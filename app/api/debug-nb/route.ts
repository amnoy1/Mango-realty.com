import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {};

  result.api_key_prefix = process.env.ANTHROPIC_API_KEY?.slice(0, 14) ?? "NOT SET";

  try {
    const client = new Anthropic();
    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 30,
      messages: [{ role: "user", content: "say: ok" }],
    });
    result.claude_ok = true;
    result.claude_response = (content[0] as { text: string }).text;
  } catch (e) {
    result.claude_ok = false;
    result.claude_error = String(e);
  }

  return Response.json(result);
}
