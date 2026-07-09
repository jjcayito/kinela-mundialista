import Link from "next/link";
import { BarChart3, ClipboardList, LockKeyhole, Trophy } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/predict", label: "Predicciones", icon: ClipboardList },
  ...(process.env.NEXT_PUBLIC_SHOW_ADMIN_NAV === "true"
    ? [{ href: "/admin", label: "Admin", icon: LockKeyhole }]
    : []),
];

export function TopNav() {
  return (
    <header className="border-b border-[#d8d0c1] bg-[#fffaf1]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#0f766e] text-white">
            <Trophy size={21} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold leading-tight text-[#151c25]">
              Kinela Mundialista
            </span>
            <span className="block text-sm text-[#5c6570]">Cuartos en vivo</span>
          </span>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d8d0c1] bg-white px-3 text-sm font-medium text-[#24313f] transition hover:border-[#0f766e] hover:text-[#0f766e]"
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
