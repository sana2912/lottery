import Link from "next/link";
import { cn } from "@/lib/app/cn";

export type SidebarItem = {
  href: string;
  label: string;
};

export type SidebarProps = {
  items: readonly SidebarItem[];
  pathname: string;
};

export function Sidebar({ items, pathname }: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-[280px] border-r border-white/60 bg-[image:var(--color-bg-sidebar)] px-5 py-6 text-[var(--color-text-inverse)] lg:flex lg:flex-col">
      <div className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-border-inverse-softer)] bg-[var(--color-bg-dark-softer)] p-5 backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-inverse-soft)]">
          Lottery Intelligence
        </p>
        <h1 className="mt-3 text-2xl font-bold leading-tight">
          ผลสลากย้อนหลัง
          <br />
          ในหน้าจอที่พร้อมใช้งาน
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-inverse-muted)]">
          shell แบบ mock-driven สำหรับยืนยัน shape ของข้อมูลก่อนต่อเข้ากับ API จริง
        </p>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] shadow-[var(--shadow-float-strong)]"
                  : "text-white/80 hover:bg-[var(--color-bg-dark-softer)] hover:text-[var(--color-text-inverse)]"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
