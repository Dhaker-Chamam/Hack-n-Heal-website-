import Link from "next/link";
import { Lockup } from "./brand/logo";

/** Minimal Abyss band for the organisers' login pages. */
export function AdminBand() {
  return (
    <header className="on-dark bg-abyss px-5 py-4 text-mist">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <Link href="/" aria-label="Hack'n'Heal 2026, accueil" className="py-1">
          <Lockup dark size={20} />
        </Link>
        <span className="border-l border-mist/20 pl-4 text-small text-mist/80">Organisateurs</span>
      </div>
    </header>
  );
}
