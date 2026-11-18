"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/** Plain Mist links on Abyss; the current page is white with a Luminous underline. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <ul className="-mx-2 flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] md:mx-0 md:justify-end md:gap-2 md:px-0">
      {items.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
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
