import type { Metadata } from "next";
import { RouteProgress } from "@/frontend/components/navigation/RouteProgress";
import "@/frontend/styles/globals.css";

export const metadata: Metadata = {
  title: "Lottery Intelligence Dashboard",
  description: "User-facing lottery statistics and prediction dashboard scaffold."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <RouteProgress />
        {children}
      </body>
    </html>
  );
}
