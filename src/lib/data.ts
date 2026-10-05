export type Provider = { id: string; name: string; role: string };
export type Clinic = { id: string; name: string; providers: Provider[]; reasons: string[] };

export const CLINICS: Clinic[] = [
  {
    id: "riverside",
    name: "Riverside Family Clinic",
    providers: [
      { id: "r1", name: "Dr. Amira Khan", role: "Family doctor" },
      { id: "r2", name: "Dr. Luke Bennett", role: "Family doctor" },
      { id: "r3", name: "Joy Adams", role: "Nurse practitioner" },
    ],
    reasons: ["Check-up", "Follow-up visit", "Vaccination", "New concern", "Prescription review"],
  },
  {
    id: "hillcrest",
    name: "Hillcrest Dental Care",
    providers: [
      { id: "h1", name: "Dr. Sofia Marin", role: "Dentist" },
      { id: "h2", name: "Dr. Ravi Menon", role: "Dentist" },
      { id: "h3", name: "Mia Fischer", role: "Hygienist" },
    ],
    reasons: ["Cleaning", "Check-up", "Filling", "Tooth pain", "Whitening consult"],
  },
];

export const TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h < 17; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

export type Appt = {
  id: string;
  clinicId: string;
  providerId: string;
  date: string;
  time: string;
  patient: string;
  reason: string;
  status: "Booked" | "Cancelled";
};

export type Reminder = { id: string; text: string; at: string };

// Made-up patient names for sample appointments.
export const SAMPLE_PATIENTS = [
  "Jordan Lee", "Casey Morgan", "Riley Chen", "Sam Patel", "Taylor Brooks", "Avery Stone",
  "Morgan Reyes", "Jamie Fox", "Quinn Hart", "Drew Santos", "Blake Ito", "Parker Nash",
];
