import type { Metadata } from "next";

// The back-office never belongs in search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
