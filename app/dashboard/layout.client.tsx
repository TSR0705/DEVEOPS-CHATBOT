"use client";

import dynamic from "next/dynamic";
import React, { ReactNode } from "react";


const items = [
  {
    label: "Dashboard",
    bgColor: "#0D0716",
    textColor: "#ffffff",
    links: [
      {
        label: "Overview",
        href: "/dashboard",
        ariaLabel: "Dashboard Overview",
      },
      { label: "Resources", href: "#", ariaLabel: "Resources" },
    ],
  },
  {
    label: "Tools",
    bgColor: "#170D27",
    textColor: "#ffffff",
    links: [
      { label: "Load Testing", href: "#", ariaLabel: "Load Testing" },
      { label: "Analytics", href: "#", ariaLabel: "Analytics" },
    ],
  },
  {
    label: "Support",
    bgColor: "#271E37",
    textColor: "#ffffff",
    links: [
      { label: "Documentation", href: "#", ariaLabel: "Documentation" },
      { label: "GitHub Issues", href: "#", ariaLabel: "GitHub Issues" },
    ],
  },
];


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
