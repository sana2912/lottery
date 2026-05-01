import Link from "next/link";
import { cn } from "@/lib/app/cn";

export type SidebarItem = {
  href: string;
  label: string;
};

export type SidebarProps = Readonly<{
  items: readonly SidebarItem[];
  pathname: string;
}>;

type MobileNavigationProps = Readonly<
  SidebarProps & {
    id: string;
    open: boolean;
    onNavigate?: () => void;
  }
>;

export function Sidebar({ items, pathname }: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-[280px] border-r border-[var(--color-border-inverse-soft)] bg-[image:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0)),var(--color-bg-sidebar)] px-5 py-6 text-[var(--color-text-inverse)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)] lg:flex lg:flex-col">
      <div className="mb-8 rounded-none border border-[var(--color-border-inverse-softer)] bg-[var(--color-bg-glass-dark)] p-5 shadow-[var(--shadow-glass-strong)] backdrop-blur-xl">
        <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-inverse-soft)]">
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
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center rounded-none border px-4 py-3 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-200",
                isActive
                  ? "border-[var(--color-border-sidebar-item-active)] bg-[image:linear-gradient(90deg,var(--color-sidebar-accent),var(--color-sidebar-accent)),var(--color-bg-sidebar-item-active)] bg-[length:3px_100%,100%_100%] bg-[position:left_top,left_top] bg-no-repeat pl-5 text-[var(--color-text-inverse)] shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                  : "border-transparent text-[var(--color-text-inverse-muted)] hover:border-[var(--color-border-inverse-soft)] hover:bg-[var(--color-bg-sidebar-item-hover)] hover:text-[var(--color-text-inverse)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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

export function MobileNavigation({ id, items, onNavigate, open, pathname }: MobileNavigationProps) {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="border-t border-[var(--color-border-glass)] bg-[var(--color-bg-glass-strong)] backdrop-blur-xl lg:hidden"
      hidden={!open}
      id={id}
    >
      <div className="grid grid-cols-2 gap-px bg-[var(--color-border-glass)]">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "bg-[var(--color-bg-glass)] px-4 py-3 text-sm font-medium transition-colors backdrop-blur-lg",
                isActive
                  ? "text-[var(--color-brand)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
