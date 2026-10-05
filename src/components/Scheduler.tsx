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

const card = { background: "var(--card)", borderColor: "var(--ink)" };
const muted = { color: "var(--muted)" };

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
    return <p className="py-16 text-center text-sm" style={muted}>Loading the schedule...</p>;
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
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Clinic" className="flex gap-6 border-b-2" style={{ borderColor: "var(--ink)" }}>
          {CLINICS.map((c) => (
            <button
              key={c.id}
              aria-pressed={c.id === clinic.id}
              onClick={() => {
                setClinicId(c.id);
                setProviderId("");
                setSlot(null);
                setDone("");
              }}
              className="-mb-[2px] border-b-4 py-2 text-base font-semibold"
              style={{ borderColor: c.id === clinic.id ? "var(--brand)" : "transparent", color: c.id === clinic.id ? "var(--ink)" : "var(--muted)" }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          Provider
          <select
            value={provider.id}
            onChange={(e) => {
              setProviderId(e.target.value);
              setSlot(null);
            }}
            className="rounded-sm border bg-transparent px-2 py-2"
            style={{ borderColor: "var(--line)" }}
          >
            {clinic.providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="self-start border-2 p-4" style={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{dayLabel(days[0])} to {dayLabel(days[4])}</h2>
            <div className="flex gap-2">
              <button onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0} className="rounded-sm border px-3 py-1.5 text-sm disabled:opacity-40" style={{ borderColor: "var(--line)" }} aria-label="Previous week">Prev</button>
              <button onClick={() => setWeekOffset((w) => Math.min(3, w + 1))} disabled={weekOffset === 3} className="rounded-sm border px-3 py-1.5 text-sm disabled:opacity-40" style={{ borderColor: "var(--line)" }} aria-label="Next week">Next</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid min-w-[600px]" style={{ gridTemplateColumns: "52px repeat(5, minmax(0, 1fr))" }}>
              <div />
              {days.map((d) => (
                <p key={iso(d)} className="border-b-2 pb-2 text-center text-sm font-semibold" style={{ borderColor: "var(--ink)" }}>
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
                        className={`slot h-8 border-b border-l text-xs font-semibold disabled:cursor-not-allowed ${!taken && !past ? "slot-free" : ""}`}
                        style={
                          selected
                            ? { background: "var(--brand)", borderColor: "var(--line)", color: "#fff" }
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
          <p className="mt-3 text-xs" style={muted}>Empty cells are free. Letters show who is booked. Shaded cells have passed.</p>
        </section>

        <aside className="space-y-6">
          <form onSubmit={submit} className="border-2 p-5" style={card}>
            <h2 className="font-semibold">Book a visit</h2>
            {slot ? (
              <p className="mt-1 text-sm" style={muted}>{longLabel(slot.date, slot.time)} with {provider.name}</p>
            ) : (
              <p className="mt-1 text-sm" style={muted}>Choose a free time in the calendar.</p>
            )}
            <label className="mt-4 block text-sm">
              Patient name
              <input
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                maxLength={60}
                disabled={!slot}
                placeholder="For example Alex Morgan"
                className="mt-1 w-full rounded-sm border bg-transparent px-3 py-2 disabled:opacity-50"
                style={{ borderColor: "var(--line)" }}
              />
            </label>
            <label className="mt-3 block text-sm">
              Reason
              <select
                value={reasonValue}
                onChange={(e) => setReason(e.target.value)}
                disabled={!slot}
                className="mt-1 w-full rounded-sm border bg-transparent px-3 py-2 disabled:opacity-50"
                style={{ borderColor: "var(--line)" }}
              >
                {clinic.reasons.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <button
              type="submit"
              disabled={!slot}
              className="mt-4 w-full rounded-sm px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              Confirm booking
            </button>
            <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm" style={{ color: error ? "#b91c1c" : "var(--brand)" }}>
              {error || done}
            </p>
          </form>

          <div className="border-2 p-5" style={card}>
            <h2 className="font-semibold">Upcoming visits</h2>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm" style={muted}>No upcoming visits.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{a.patient}</p>
                      <p style={muted}>{longLabel(a.date, a.time)}</p>
                      <p style={muted}>{a.reason} · {nameOf(a.providerId)}</p>
                    </div>
                    <button onClick={() => cancelAppt(clinic.id, a.id)} className="shrink-0 text-xs underline" style={muted}>Cancel</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-2 p-5" style={card}>
            <h2 className="font-semibold">Message log</h2>
            <p className="mt-1 text-xs" style={muted}>Messages are listed here, not sent to anyone.</p>
            {cs.reminders.length === 0 ? (
              <p className="mt-2 text-sm" style={muted}>Book or cancel a visit to see messages.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {cs.reminders.slice(0, 5).map((r) => <li key={r.id}>{r.text}</li>)}
              </ul>
            )}
          </div>
          <button onClick={() => { resetAll(); setSlot(null); setDone(""); }} className="text-sm underline" style={muted}>
            Reset sample data
          </button>
        </aside>
      </div>
    </div>
  );
}
