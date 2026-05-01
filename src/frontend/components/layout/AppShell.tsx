"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MobileNavigation, Sidebar } from "@/frontend/components/navigation/Sidebar";
import { Input } from "@/frontend/primitives";
import { appConfig } from "@/lib/app/constants";
import { userNavigation } from "@/lib/app/navigation";

export type AppShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const mobileNavigationId = "mobile-primary-navigation";

  return (
    <div className="min-h-screen bg-transparent text-[var(--color-text-primary)] lg:flex">
      <Sidebar items={userNavigation} pathname={pathname} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border-glass)] bg-[linear-gradient(180deg,var(--color-bg-glass-strong),var(--color-bg-glass))] backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-6 lg:px-8">
            <button
              aria-controls={mobileNavigationId}
              aria-expanded={mobileNavigationOpen}
              aria-label={mobileNavigationOpen ? "Close navigation" : "Open navigation"}
              className="inline-flex size-11 items-center justify-center rounded-none border border-[var(--color-border-glass)] bg-[var(--color-bg-glass)] text-[var(--color-text-primary)] shadow-[var(--shadow-micro)] backdrop-blur-lg transition-colors hover:bg-[var(--color-bg-glass-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:hidden"
              onClick={() => setMobileNavigationOpen((open) => !open)}
              type="button"
            >
              {mobileNavigationOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-normal text-[var(--color-text-muted)]">
                {appConfig.name}
              </p>
              <p className="truncate text-sm text-[var(--color-text-secondary)]">
                พื้นที่ทดสอบหน้าโปรดักต์แบบ mock-first เพื่อยืนยัน data contract ของระบบหวย
              </p>
            </div>

            <div className="hidden w-full max-w-xs md:block">
              <Input placeholder="ค้นหางวด เลข หรือแท็ก" />
            </div>
          </div>

          <MobileNavigation
            id={mobileNavigationId}
            items={userNavigation}
            onNavigate={() => setMobileNavigationOpen(false)}
            open={mobileNavigationOpen}
            pathname={pathname}
          />
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
