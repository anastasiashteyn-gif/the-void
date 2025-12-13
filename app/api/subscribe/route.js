export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return Response.json({ error: "Email required." }, { status: 400 });
    }

    const provider = (process.env.EMAIL_PROVIDER || "BUTTONDOWN").toUpperCase();

    if (provider === "BUTTONDOWN") {
      const apiKey = process.env.BUTTONDOWN_API_KEY;
      if (!apiKey) {
        return Response.json({ error: "Server not configured (BUTTONDOWN_API_KEY missing)." }, { status: 500 });
      }
      const r = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (r.ok) return Response.json({ ok: true });
      if (r.status === 400) return Response.json({ ok: true, note: "exists" }); // already subscribed
      return Response.json({ error: "Subscription failed." }, { status: 500 });
    }

    if (provider === "CONVERTKIT") {
      const apiKey = process.env.CONVERTKIT_API_KEY;
      const formId = process.env.CONVERTKIT_FORM_ID;
      if (!apiKey || !formId) {
        return Response.json({ error: "Server not configured (CONVERTKIT_API_KEY / CONVERTKIT_FORM_ID missing)." }, { status: 500 });
      }
      const r = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, email }),
      });
      if (r.ok) return Response.json({ ok: true });
      return Response.json({ error: "Subscription failed." }, { status: 500 });
    }

    return Response.json({ error: "Unknown provider." }, { status: 500 });
  } catch {
    return Response.json({ error: "Gate error." }, { status: 500 });
  }
}
