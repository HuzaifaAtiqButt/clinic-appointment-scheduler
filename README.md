# Clinic Appointment Scheduler

A small scheduling demo: choose a clinic and a provider, pick a free time from a weekly calendar, and book a visit.

This is a demo project. The clinics and patients are made up, there is no database, and bookings stay in your browser (localStorage). No message is ever sent. Do not enter real personal or health information.

## What it shows

- Two separate clinics, each with its own providers, appointments and message log.
- A five-day calendar with half-hour slots. Taken and past slots cannot be picked, and double booking is blocked.
- Booking with validation, a list of upcoming visits, and cancellation.
- A message log that lists the confirmation, reminder and cancellation messages a real system would send.
- Light and dark themes, keyboard-friendly controls, and screen-reader labels on every slot.

## Stack

Next.js, React, TypeScript, Tailwind CSS. No calendar or state libraries.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Going further

A production version would add staff logins, a real database with row-level access per clinic, and email or text delivery for the messages.
