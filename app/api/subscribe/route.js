export const runtime = "nodejs";

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawEmail = body?.email_address || body?.email;
    const email =
      typeof rawEmail === "string"
        ? rawEmail.trim().toLowerCase()
        : "";

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email missing or invalid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.BUTTONDOWN_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing BUTTONDOWN_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;

    const r = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email, // ✅ THIS IS THE KEY FIX
        tags: ["ardra"],
        ...(ip ? { ip_address: ip } : {}),
      }),
    });

    const text = await r.text();

    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: "Buttondown rejected request", details: text }),
        { status: r.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
