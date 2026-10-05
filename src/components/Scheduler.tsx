"use client";

import { useState, useSyncExternalStore } from "react";
import { CLINICS, TIMES } from "@/lib/data";
import { addDays, dayLabel, isPast, iso, longLabel, mondayOf } from "@/lib/dates";
import { book, cancelAppt, getServerSnapshot, getSnapshot, resetAll, subscribe } from "@/lib/store";

const subscribeNow = (cb: () => void) => {
  const t = setInterval(cb, 60000);
  return () => clearInterval(t);
};
const nowSnapshot = () => Math.floor(Date.now() / 60000) * 60000;
const nowServer = () => 0;

const muted = { color: "var(--muted)" };
const panel = { background: "var(--card)", borderColor: "var(--line)" };

export function Scheduler() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const nowMs = useSyncExternalStore(subscribeNow, nowSnapshot, nowServer);

  const [clinicId, setClinicId] = useState(CLINICS[0].id);
  const [providerId, setProviderId] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [slot, setSlot] = useState<{ date: string; time: string } | null>(null);
  const [patient, setPatient] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const clinic = CLINICS.find((c) => c.id === clinicId) ?? CLINICS[0];
  const provider = clinic.providers.find((p) => p.id === providerId) ?? clinic.providers[0];
  const reasonValue = clinic.reasons.includes(reason) ? reason : clinic.reasons[0];

  if (!state.ready || nowMs === 0) {
    return <p className="p-10 text-center text-base" style={muted}>Loading the schedule...</p>;
  }

  const now = new Date(nowMs);
  const cs = state.byClinic[clinic.id] ?? { appts: [], reminders: [] };
  const monday = addDays(mondayOf(now), weekOffset * 7);
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const booked = new Map(
    cs.appts
      .filter((a) => a.status === "Booked" && a.providerId === provider.id)
      .map((a) => [`${a.date}|${a.time}`, a]),
  );
  const upcoming = cs.appts
    .filter((a) => a.status === "Booked" && !isPast(a.date, a.time, now))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 6);
  const nameOf = (id: string) => clinic.providers.find((p) => p.id === id)?.name ?? "";

  const pick = (date: string, time: string) => {
    setSlot({ date, time });
    setError("");
    setDone("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    const res = book({ clinicId: clinic.id, providerId: provider.id, date: slot.date, time: slot.time, patient, reason: reasonValue });
    if (res.ok) {
      setDone(`Booked ${longLabel(slot.date, slot.time)} with ${provider.name}.`);
      setSlot(null);
      setPatient("");
      setError("");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
      <nav aria-label="Clinic and provider" className="px-5 py-8 text-white lg:py-10" style={{ background: "var(--side)" }}>
        <p className="text-2xl font-bold leading-tight">Appointments</p>
        <p className="mt-1 text-sm opacity-80">Front desk view</p>

        <div role="group" aria-label="Clinic" className="mt-8">
          <p className="mb-2 text-sm font-bold opacity-80">Clinic</p>
          <ul>
            {CLINICS.map((c) => (
              <li key={c.id}>
                <button
                  aria-pressed={c.id === clinic.id}
                  onClick={() => {
                    setClinicId(c.id);
                    setProviderId("");
                    setSlot(null);
                    setDone("");
                  }}
                  className="mb-1 block w-full border-l-4 px-3 py-2 text-left text-base"
                  style={{
                    borderColor: c.id === clinic.id ? "var(--amber)" : "transparent",
                    background: c.id === clinic.id ? "rgba(255,255,255,.14)" : "transparent",
                    fontWeight: c.id === clinic.id ? 700 : 400,
                  }}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div role="group" aria-label="Provider" className="mt-8">
          <p className="mb-2 text-sm font-bold opacity-80">Calendar for</p>
          <ul>
            {clinic.providers.map((p) => (
              <li key={p.id}>
                <button
                  aria-pressed={p.id === provider.id}
                  onClick={() => {
                    setProviderId(p.id);
                    setSlot(null);
                  }}
                  className="mb-1 block w-full border-l-4 px-3 py-2 text-left"
                  style={{
                    borderColor: p.id === provider.id ? "var(--amber)" : "transparent",
                    background: p.id === provider.id ? "rgba(255,255,255,.14)" : "transparent",
                  }}
                >
                  <span className="block text-base" style={{ fontWeight: p.id === provider.id ? 700 : 400 }}>{p.name}</span>
                  <span className="block text-sm opacity-75">{p.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={() => { resetAll(); setSlot(null); setDone(""); }} className="mt-10 text-sm underline underline-offset-4 opacity-85">
          Reset sample data
        </button>
      </nav>

      <div className="px-5 py-8 sm:px-8 lg:py-10">
        <h1 className="text-3xl font-bold leading-tight">{clinic.name}</h1>
        <p className="mt-1 text-base" style={muted}>Showing {provider.name}. Pick a free time to book a visit.</p>

        <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_330px]">
          <section className="self-start border" style={panel}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
              <h2 className="text-lg font-bold">{dayLabel(days[0])} to {dayLabel(days[4])}</h2>
              <div className="flex gap-2">
                <button onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0} className="border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" style={{ borderColor: "var(--ink)" }} aria-label="Previous week">Prev</button>
                <button onClick={() => setWeekOffset((w) => Math.min(3, w + 1))} disabled={weekOffset === 3} className="border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" style={{ borderColor: "var(--ink)" }} aria-label="Next week">Next</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[600px]" style={{ gridTemplateColumns: "52px repeat(5, minmax(0, 1fr))" }}>
                <div />
                {days.map((d) => (
                  <p key={iso(d)} className="border-b-2 py-2 text-center text-sm font-bold" style={{ borderColor: "var(--ink)" }}>
                    {dayLabel(d)}
                  </p>
                ))}
                {TIMES.map((t) => (
                  <div key={t} className="contents">
                    <p className="border-b pr-2 pt-1.5 text-right text-xs tabular-nums" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
                      {t}
                    </p>
                    {days.map((d) => {
                      const key = `${iso(d)}|${t}`;
                      const appt = booked.get(key);
                      const taken = !!appt;
                      const past = isPast(iso(d), t, now);
                      const selected = slot?.date === iso(d) && slot.time === t;
                      return (
                        <button
                          key={key}
                          disabled={taken || past}
                          onClick={() => pick(iso(d), t)}
                          aria-label={`${dayLabel(d)} ${t}${taken ? ", booked" : past ? ", unavailable" : ", available"}`}
                          aria-pressed={selected}
                          className={`h-8 border-b border-l text-xs font-bold disabled:cursor-not-allowed ${!taken && !past ? "slot-free" : ""}`}
                          style={
                            selected
                              ? { background: "var(--amber)", borderColor: "var(--line)", color: "#1a1100" }
                              : taken
                                ? { background: "var(--booked)", borderColor: "var(--line)", color: "var(--ink)" }
                                : past
                                  ? { background: "var(--past)", borderColor: "var(--line)" }
                                  : { borderColor: "var(--line)" }
                          }
                        >
                          {selected ? "Picked" : appt ? appt.patient.split(" ").map((w) => w[0]).join("") : ""}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="border-t px-4 py-3 text-sm" style={{ borderColor: "var(--line)", ...muted }}>
              Empty cells are free. Letters show who is booked. Grey cells have passed.
            </p>
          </section>

          <aside className="space-y-6">
            <form onSubmit={submit} className="border p-5" style={panel}>
              <h2 className="text-lg font-bold">Book a visit</h2>
              {slot ? (
                <p className="mt-1 text-base font-semibold">{longLabel(slot.date, slot.time)}</p>
              ) : (
                <p className="mt-1 text-base" style={muted}>Choose a free time in the calendar.</p>
              )}
              <label className="mt-4 block text-sm font-bold">
                Patient name
                <input
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  maxLength={60}
                  disabled={!slot}
                  placeholder="For example Alex Morgan"
                  className="mt-1 w-full border-2 bg-transparent px-3 py-2 text-base font-normal disabled:opacity-50"
                  style={{ borderColor: "var(--ink)" }}
                />
              </label>
              <label className="mt-3 block text-sm font-bold">
                Reason
                <select
                  value={reasonValue}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={!slot}
                  className="mt-1 w-full border-2 bg-transparent px-3 py-2 text-base font-normal disabled:opacity-50"
                  style={{ borderColor: "var(--ink)" }}
                >
                  {clinic.reasons.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <button
                type="submit"
                disabled={!slot}
                className="mt-4 w-full px-4 py-3 text-base font-bold text-white disabled:opacity-50"
                style={{ background: "var(--side)" }}
              >
                Confirm booking
              </button>
              <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm font-semibold" style={{ color: error ? "#b91c1c" : "var(--side-text)" }}>
                {error || done}
              </p>
            </form>

            <div className="border p-5" style={panel}>
              <h2 className="text-lg font-bold">Upcoming visits</h2>
              {upcoming.length === 0 ? (
                <p className="mt-2 text-base" style={muted}>No upcoming visits.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {upcoming.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="text-base font-bold">{a.patient}</p>
                        <p>{longLabel(a.date, a.time)}</p>
                        <p style={muted}>{a.reason}, {nameOf(a.providerId)}</p>
                      </div>
                      <button onClick={() => cancelAppt(clinic.id, a.id)} className="shrink-0 text-sm font-semibold underline underline-offset-4">Cancel</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border p-5" style={panel}>
              <h2 className="text-lg font-bold">Message log</h2>
              <p className="mt-1 text-sm" style={muted}>These are listed here and not sent to anyone.</p>
              {cs.reminders.length === 0 ? (
                <p className="mt-2 text-base" style={muted}>Book or cancel a visit to see messages.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {cs.reminders.slice(0, 5).map((r) => <li key={r.id}>{r.text}</li>)}
                </ul>
              )}
            </div>
          </aside>
        </div>

        <footer className="mt-12 border-t pt-4 text-sm" style={{ borderColor: "var(--line)", ...muted }}>
          A demo with made-up clinics and patients. Bookings stay in this browser and no messages are sent. Do not enter real personal or health information.
        </footer>
      </div>
    </div>
  );
}
