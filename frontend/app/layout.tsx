import type { Metadata } from "next";
import { Space_Mono, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

/*
  🎓 ROOT LAYOUT WITH MONOSPACED FONT SYSTEM FOR ROBOTIC AI THEME
*/

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InterPass — AI Interview Preparation",
    template: "%s | InterPass",
  },
  description:
    "Practice realistic job interviews powered by AI. Tailored questions for your target company, role, and experience level.",
  keywords: ["interview preparation", "AI interview", "job interview practice", "technical interview"],
  openGraph: {
    title: "InterPass — AI Interview Preparation",
    description: "Practice realistic job interviews powered by AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${shareTechMono.variable} h-full`}>
      <body className="min-h-full antialiased bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
        {children}
      </body>
    </html>
  );
}
