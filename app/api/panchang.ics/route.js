export const runtime = "nodejs";

import tzLookup from "tz-lookup";
import { DateTime } from "luxon";
import { createEvents } from "ics";
import { getPanchangam, Observer, tithiNames, nakshatraNames, yogaNames } from "@ishubhamx/panchangam-js";

async function geocode(city, country) {
  const q = `${city}, ${country}`.trim();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const ua = process.env.NOMINATIM_USER_AGENT || "void.calendar";
  const r = await fetch(url.toString(), {
    headers: { "User-Agent": ua, Accept: "application/json" },
  });

  if (!r.ok) throw new Error("Geocoding failed.");
  const data = await r.json();
  if (!data?.length) throw new Error("Location not found.");

  const lat = Number(data[0].lat);
  const lon = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Bad location.");

  return { lat, lon };
}

function fmt(dt, tz) {
  if (!dt) return "—";
  return DateTime.fromJSDate(dt).setZone(tz).toFormat("HH:mm");
}

function fmtRange(a, b, tz) {
  return `${fmt(a, tz)}–${fmt(b, tz)}`;
}

// Library returns vara as number 0-6 (Sunday..Saturday)
const varaNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const city = (searchParams.get("city") || "").trim();
    const country = (searchParams.get("country") || "").trim();
    const yearStr = (searchParams.get("year") || "2026").trim();
    const year = Number(yearStr);

    if (!city || !country || !Number.isInteger(year) || year < 1900 || year > 2100) {
      return new Response("Bad request.", { status: 400 });
    }

    const { lat, lon } = await geocode(city, country);
    const tz = tzLookup(lat, lon);

    // IMPORTANT: Observer expects elevation in meters; we’ll keep 0 for now.
    const observer = new Observer(lat, lon, 0);

    const events = [];
    const start = DateTime.fromObject({ year, month: 1, day: 1 }, { zone: tz });
    const end = start.plus({ years: 1 });

    let d = start;
    while (d < end) {
      // Step 1: get sunrise for THIS civil date
      // Use local noon to safely be within the day and avoid midnight edge cases.
      const noonLocal = d.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toJSDate();
      const pNoon = getPanchangam(noonLocal, observer);

      const sunrise = pNoon.sunrise || noonLocal;

      // Step 2: compute the Panchang anchored at sunrise (this matches most Panchang sources)
      const p = getPanchangam(sunrise, observer);

      const dateLabel = d.toFormat("yyyy-LL-dd");
      const title = `${dateLabel} · ${d.toFormat("cccc")}`;

      // Note: karana is a STRING in this library (e.g., "Bava"), not an index.
      const karanaName = p.karana || "—";
      const varaName = Number.isInteger(p.vara) ? varaNames[p.vara] : d.toFormat("cccc");

      const desc =
`ARDRA — THE VOID

Location: ${city}, ${country}
Timezone: ${tz}

Vāra: ${varaName}

Sunrise: ${fmt(pNoon.sunrise, tz)}
Sunset:  ${fmt(pNoon.sunset, tz)}

Nakshatra (Moon):
- ${nakshatraNames[p.nakshatra] ?? "—"}: ${fmtRange(p.nakshatraStartTime, p.nakshatraEndTime, tz)}

Tithi:
- ${tithiNames[p.tithi] ?? "—"}: ${fmtRange(p.tithiStartTime, p.tithiEndTime, tz)}

Karana:
- ${karanaName}

Yoga:
- ${yogaNames[p.yoga] ?? "—"}: ${fmtRange(p.yogaStartTime, p.yogaEndTime, tz)}
`;

      events.push({
        title,
        description: desc,
        start: [d.year, d.month, d.day],
        startOutputType: "local",
        duration: { days: 1 },
      });

      d = d.plus({ days: 1 });
    }

    const { error, value } = createEvents(events);
    if (error) return new Response("ICS error.", { status: 500 });

    return new Response(value, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    // Useful for debugging via Vercel logs
    return new Response(`Error. ${String(e)}`, { status: 500 });
  }
}
