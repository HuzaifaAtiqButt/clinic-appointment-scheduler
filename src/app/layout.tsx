import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

const body = Atkinson_Hyperlegible_Next({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clinic Appointment Scheduler",
  description: "Book visits with a clinic provider from a weekly calendar. Demo project with sample data, no account needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
