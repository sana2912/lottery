"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/frontend/components/navigation/Sidebar";
import { Input } from "@/frontend/primitives";
import { appConfig } from "@/lib/app/constants";
import { userNavigation } from "@/lib/app/navigation";

export type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)] lg:flex">
      <Sidebar items={userNavigation} pathname={pathname} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border-soft)]/80 bg-[var(--color-bg-frosted)] px-4 py-4 backdrop-blur md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
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
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
