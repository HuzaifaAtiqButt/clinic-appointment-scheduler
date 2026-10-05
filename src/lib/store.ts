import { CLINICS, SAMPLE_PATIENTS, TIMES, type Appt, type Reminder } from "./data";
import { addDays, iso, longLabel, mondayOf } from "./dates";

export type ClinicState = { appts: Appt[]; reminders: Reminder[] };
export type State = { ready: boolean; byClinic: Record<string, ClinicState> };

const KEY = "clinic-appointment-scheduler-v1";
const EMPTY: State = { ready: false, byClinic: {} };

let cache: State | null = null;
const listeners = new Set<() => void>();

const uid = () => Math.random().toString(36).slice(2, 9);

function seed(): State {
  const monday = mondayOf(new Date());
  const byClinic: Record<string, ClinicState> = {};
  CLINICS.forEach((c, ci) => {
    const appts: Appt[] = [];
    let n = ci * 3;
    for (let week = 0; week < 2; week++) {
      for (let day = 0; day < 5; day++) {
        c.providers.forEach((p, pi) => {
          if ((day + pi + week + ci) % 2 === 0) {
            const time = TIMES[(day * 3 + pi * 5 + week * 2 + ci) % TIMES.length];
            appts.push({
              id: uid(),
              clinicId: c.id,
              providerId: p.id,
              date: iso(addDays(monday, week * 7 + day)),
              time,
              patient: SAMPLE_PATIENTS[n++ % SAMPLE_PATIENTS.length],
              reason: c.reasons[(n + pi) % c.reasons.length],
              status: "Booked",
            });
          }
        });
      }
    }
    byClinic[c.id] = { appts, reminders: [] };
  });
  return { ready: true, byClinic };
}

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && parsed.byClinic) return { ...parsed, ready: true };
    }
  } catch {
    // Fall through to fresh sample data.
  }
  return seed();
}

export function getSnapshot(): State {
  if (cache === null) cache = read();
  return cache;
}

export function getServerSnapshot(): State {
  return EMPTY;
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function commit(next: State) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage may be blocked. The app still works for this visit.
  }
  listeners.forEach((l) => l());
}

function withClinic(state: State, clinicId: string, fn: (c: ClinicState) => ClinicState): State {
  const current = state.byClinic[clinicId] ?? { appts: [], reminders: [] };
  return { ...state, byClinic: { ...state.byClinic, [clinicId]: fn(current) } };
}

const note = (text: string): Reminder => ({ id: uid(), text, at: new Date().toISOString() });

export type BookInput = { clinicId: string; providerId: string; date: string; time: string; patient: string; reason: string };

export function book(input: BookInput): { ok: true } | { ok: false; error: string } {
  const patient = input.patient.trim();
  if (!patient) return { ok: false, error: "Enter the patient name." };
  if (patient.length > 60) return { ok: false, error: "The name is too long." };
  const state = getSnapshot();
  const clash = (state.byClinic[input.clinicId]?.appts ?? []).some(
    (a) => a.status === "Booked" && a.providerId === input.providerId && a.date === input.date && a.time === input.time,
  );
  if (clash) return { ok: false, error: "That time was just taken. Pick another slot." };

  const appt: Appt = { id: uid(), clinicId: input.clinicId, providerId: input.providerId, date: input.date, time: input.time, patient, reason: input.reason, status: "Booked" };
  const when = longLabel(input.date, input.time);
  commit(
    withClinic(state, input.clinicId, (c) => ({
      appts: [...c.appts, appt],
      reminders: [
        note(`Confirmation message queued for ${patient}: ${input.reason}, ${when}.`),
        note(`Reminder queued for ${patient}, 24 hours before ${when}.`),
        ...c.reminders,
      ].slice(0, 30),
    })),
  );
  return { ok: true };
}

export function cancelAppt(clinicId: string, id: string) {
  const state = getSnapshot();
  commit(
    withClinic(state, clinicId, (c) => {
      const target = c.appts.find((a) => a.id === id);
      return {
        appts: c.appts.map((a) => (a.id === id ? { ...a, status: "Cancelled" as const } : a)),
        reminders: target
          ? [note(`Cancellation notice queued for ${target.patient}, ${longLabel(target.date, target.time)}.`), ...c.reminders].slice(0, 30)
          : c.reminders,
      };
    }),
  );
}

export function resetAll() {
  commit(seed());
}
