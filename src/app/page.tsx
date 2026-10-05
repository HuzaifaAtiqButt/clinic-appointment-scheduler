import { Scheduler } from "@/components/Scheduler";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex items-center gap-3">
        <svg width="34" height="34" viewBox="0 0 36 36" aria-hidden="true">
          <rect width="36" height="36" fill="var(--brand)" />
          <path d="M18 8v20M8 18h20" stroke="#fff" strokeWidth="5" />
        </svg>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clinic Appointment Scheduler</h1>
          <p className="text-base" style={{ color: "var(--muted)" }}>Choose a clinic and provider, then pick a free time to book.</p>
        </div>
      </header>
      <Scheduler />
      <footer className="mt-12 border-t pt-4 text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        Demo project with made-up clinics and patients. Bookings stay in your browser and no messages are sent. Do not enter real personal or health information.
      </footer>
    </main>
  );
}
