export const runtime = "nodejs";

export async function POST(req) {
  try {
    // 1) Read request body safely
    const body = await req.json().catch(() => ({}));
    const email = body?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Read Buttondown API key from Vercel env vars
    const apiKey = process.env.BUTTONDOWN_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing BUTTONDOWN_API_KEY in Vercel Environment Variables" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3) Call Buttondown
    const r = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        tags: ["ardra"],
      }),
    });

    // IMPORTANT: read as text first so we don't crash on non-JSON responses
    const text = await r.text();

    if (!r.ok) {
      return new Response(JSON.stringify({ error: "Buttondown error", details: text }), {
        status: r.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error", details: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
