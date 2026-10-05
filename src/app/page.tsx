import { Scheduler } from "@/components/Scheduler";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <rect width="36" height="36" rx="9" fill="var(--brand)" />
          <rect x="9" y="11" width="18" height="16" rx="2.5" fill="none" stroke="#fff" strokeWidth="2.2" />
          <path d="M9 16h18M14 8v5M22 8v5M18 19v5M15.5 21.5h5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinic Appointment Scheduler</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Pick a provider, choose a free time, and book a visit.</p>
        </div>
      </header>
      <Scheduler />
      <footer className="mt-10 border-t pt-4 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        Demo project with made-up clinics and patients. Bookings stay in your browser and no messages are sent. Do not enter real personal or health information.
      </footer>
    </main>
  );
}
