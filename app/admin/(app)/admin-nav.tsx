"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <li key={it.href} className="shrink-0">
            <Link
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`block px-2 py-2.5 text-small transition-colors duration-150 ${
                active
                  ? "font-semibold text-white underline decoration-luminous decoration-2 underline-offset-[0.45em]"
                  : "text-mist/80 hover:text-luminous"
              }`}
            >
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
