import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {};

  // 1. Check env var
  result.api_key_set = !!process.env.ANTHROPIC_API_KEY;
  result.api_key_prefix = process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? "NOT SET";

  // 2. Test Claude
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

  // 3. Test data.gov.il
  try {
    const filters = encodeURIComponent(JSON.stringify({ "שם ישוב": "כפר סבא" }));
    const sort = encodeURIComponent("סוג מוסד asc");
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=5548fd63-5868-4053-ad81-98caddc5e232&filters=${filters}&sort=${sort}&limit=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const json = await res.json();
    result.govil_ok = res.ok;
    result.govil_total = json.result?.total;
    result.govil_first_types = (json.result?.records ?? []).map((r: Record<string, string>) => r["סוג מוסד"]);
  } catch (e) {
    result.govil_ok = false;
    result.govil_error = String(e);
  }

  return Response.json(result);
}
