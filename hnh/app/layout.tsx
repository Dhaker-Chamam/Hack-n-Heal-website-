import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
const f = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300","400","500","600","700","800"], variable: "--font-jakarta" });
export const metadata: Metadata = { title: "Hack N Heal — Where technology meets life", description: "An interdisciplinary event at INSAT bringing together Medicine, Bioinformatics and Artificial Intelligence." };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={f.variable}><body>{children}</body></html>;
}
