"use client";

import { useMemo, useState } from "react";

function yearOptions() {
  const now = new Date().getFullYear();
  const set = new Set([2026, now, now + 1, now - 1]);
  return Array.from(set).sort((a,b) => a-b);
}

export default function Home() {
  const years = useMemo(() => yearOptions(), []);
  const [email, setEmail] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMsg, setGateMsg] = useState("");

  const [city, setCity] = useState("Berlin");
  const [country, setCountry] = useState("Germany");
  const [year, setYear] = useState(2026);
  const [feedUrl, setFeedUrl] = useState("");
  const [genMsg, setGenMsg] = useState("");

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

  function generateLink(e) {
    e.preventDefault();
    setGenMsg("");
    const u = new URL(window.location.origin + "/api/panchang.ics");
    u.searchParams.set("city", city.trim());
    u.searchParams.set("country", country.trim());
    u.searchParams.set("year", String(year));
    setFeedUrl(u.toString());
    setGenMsg("access granted");
  }

  async function copyLink() {
    if (!feedUrl) return;
    await navigator.clipboard.writeText(feedUrl);
    setGenMsg("copied");
    setTimeout(() => setGenMsg("access granted"), 1200);
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

          <form className="row" onSubmit={generateLink}>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!gateOpen}
              required
            />
            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={!gateOpen}
              required
            />
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={!gateOpen}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <button type="submit" disabled={!gateOpen}>
              Generate Google Calendar URL
            </button>

            {feedUrl ? (
              <div className="small">
                <div style={{ marginBottom: 8 }}><span className="pill">URL</span></div>
                <div>{feedUrl}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <button type="button" onClick={copyLink} disabled={!gateOpen}>Copy</button>
                  <a href={feedUrl} style={{ width: "100%" }} target="_blank" rel="noreferrer">
                    <button type="button" disabled={!gateOpen}>Open</button>
                  </a>
                </div>
                <div style={{ marginTop: 10, opacity: 0.86 }}>
                  Google Calendar → Add by URL → paste.
                </div>
              </div>
            ) : null}

            {genMsg ? <div className="small">{genMsg}</div> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
