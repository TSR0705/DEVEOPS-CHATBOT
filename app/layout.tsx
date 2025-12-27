// Phase 5.1 frontend skeleton complete
// Root layout — SERVER COMPONENT (no "use client")
// Minimal, Lighthouse-safe baseline

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeployBot",
  description: "A safe, chat-driven Kubernetes control plane",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
