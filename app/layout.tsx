import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Hack'n'Heal 2026", template: "%s · Hack'n'Heal 2026" },
  description:
    "Hack'n'Heal 2026, les 5 et 6 décembre à l'INSAT, Tunis : médecine, bioinformatique et intelligence artificielle réunies autour du cancer et des maladies auto-immunes. Inscription gratuite.",
};

export const viewport: Viewport = {
  themeColor: "#06292B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
