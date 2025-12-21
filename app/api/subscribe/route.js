export const runtime = "nodejs";

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function looksAlreadySubscribed(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("already subscribed") ||
    t.includes("already a subscriber") ||
    t.includes("already exists") ||
    t.includes("has already been taken") ||
    t.includes("subscriber with this email") ||
    t.includes("email_address") && t.includes("already") // extra safety
  );
}

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
      return json(400, { error: "Email missing or invalid" });
    }

    const apiKey = process.env.BUTTONDOWN_API_KEY;
    if (!apiKey) {
      return json(500, { error: "Missing BUTTONDOWN_API_KEY" });
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
        email_address: email,
        tags: ["ardra"],
        ...(ip ? { ip_address: ip } : {}),
      }),
    });

    const text = await r.text().catch(() => "");

    // ✅ SUCCESS: newly subscribed
    if (r.ok) {
      return json(200, { ok: true, status: "subscribed" });
    }

    // ✅ ALSO SUCCESS: already subscribed (grant access again)
    if (looksAlreadySubscribed(text)) {
      return json(200, { ok: true, status: "already_subscribed" });
    }

    // ❌ REAL ERROR (show a friendly message, keep details for debugging)
    return json(r.status || 400, {
      error: "Buttondown rejected request",
      details: text,
    });
  } catch (err) {
    return json(500, { error: "Server error", details: String(err) });
  }
}
