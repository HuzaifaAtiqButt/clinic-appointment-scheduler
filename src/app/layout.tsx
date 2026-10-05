import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const display = Source_Serif_4({ variable: "--font-display", subsets: ["latin"] });
const body = Source_Sans_3({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clinic Appointment Scheduler",
  description: "Book visits with a clinic provider from a weekly calendar. Demo project with sample data, no account needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
