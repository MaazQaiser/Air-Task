import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirTasks — Spatial Task Workspace",
  description:
    "A gesture and voice controlled task management workspace. Organize your work on an infinite spatial canvas with floating task cards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
