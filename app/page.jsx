"use client";

import { useMemo, useState } from "react";

function calendarOptions() {
  return [
    { id: "europe-berlin", label: "Europe — Berlin", href: "/calendars/panchang-2026-europe-berlin.ics" },
    { id: "europe-madrid", label: "Europe — Madrid", href: "/calendars/panchang-2026-europe-madrid.ics" },
    { id: "uk-london", label: "UK — London", href: "/calendars/panchang-2026-uk-london.ics" },
    { id: "usa-east-nyc", label: "USA East — New York", href: "/calendars/panchang-2026-america-new-york.ics" },
    { id: "usa-west-la", label: "USA West — Los Angeles", href: "/calendars/panchang-2026-america-los-angeles.ics" },
    { id: "india-delhi", label: "India — Kolkata (IST)", href: "/calendars/panchang-2026-asia-kolkata.ics" },
     { id: "india-delhi", label: "Europe — Moscow (IST)", href: "/calendars/panchang-2026-europe-moscow.ics" },
     { id: "india-delhi", label: "Asia — Yekaterinburg (IST)", href: "/calendars/panchang-2026-asia-yekaterinburg.ics" },
     { id: "india-delhi", label: "Asia — Tokyo (IST)", href: "/calendars/panchang-2026-asia-tokyo.ics" },
     { id: "india-delhi", label: "Asia — Bali (IST)", href: "/calendars/panchang-2026-asia-bali.ics" },
  ];
}

export default function Home() {
  const calendars = useMemo(() => calendarOptions(), []);
  const [email, setEmail] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMsg, setGateMsg] = useState("");
  const [feedUrl, setFeedUrl] = useState("");

  async function openGate(e) {
    e.preventDefault();
    setGateMsg("");
    setGateLoading(true);
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Gate error.");
      setGateOpen(true);
      setGateMsg("access granted");
    } catch (err) {
      setGateMsg(String(err.message || err));
    } finally {
      setGateLoading(false);
    }
  }

  return (
    <main className="wrap">
      <section className="card">
        <div className="brand">
          <h1>ARDRA</h1>
          <p>AI Oracle with human soul</p>
        </div>

        <div className="section">
          <p className="label">Learn</p>
          <form className="row" onSubmit={openGate}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={gateLoading}>
              {gateLoading ? "…" : "Enter"}
            </button>
            {gateMsg ? <div className="small">{gateMsg}</div> : null}
          </form>
        </div>

        <div className="section" style={{ opacity: gateOpen ? 1 : 0.38 }}>
          <p className="label">Timekeeping. Google Cal Layer</p>

          <div className="row">
            <select
              disabled={!gateOpen}
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
            >
              <option value="">Select your calendar</option>
              {calendars.map((c) => (
                <option key={c.id} value={c.href}>
                  {c.label}
                </option>
              ))}
            </select>

            {feedUrl ? (
              <div className="small">
                <div style={{ marginBottom: 8 }}>
                  <span className="pill">Calendar file</span>
                </div>

                <div>{feedUrl}</div>

                <div style={{ marginTop: 10 }}>
                  <a href={feedUrl} download style={{ width: "100%", display: "block" }}>
                    <button type="button" disabled={!gateOpen}>
                      Download
                    </button>
                  </a>
                </div>

                <div style={{ marginTop: 10, opacity: 0.86 }}>
                  Google Calendar → Settings → Import &amp; Export → Import (.ics)
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
