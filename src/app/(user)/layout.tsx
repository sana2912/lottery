import { AppShell } from "@/frontend/components/layout/AppShell";

export default function UserLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
