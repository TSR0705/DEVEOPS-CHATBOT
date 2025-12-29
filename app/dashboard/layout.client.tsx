"use client";

import React, { ReactNode } from "react";

export default function DashboardLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#020409] relative overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-black/5 to-black/30 pointer-events-none"></div>

      {/* Main content */}
      <main className="relative z-20 min-h-[calc(100vh-5rem)]">{children}</main>
    </div>
  );
}
