import type { Metadata } from "next";

// Personal pages: never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
