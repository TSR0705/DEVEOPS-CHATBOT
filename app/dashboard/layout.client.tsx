// Phase 5.2 CardNav integration complete
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Dynamically import the navbar component with no SSR
const CardNavClient = dynamic(() => import("../../components/nav/CardNavClient"), {
  ssr: false,
  loading: () => <div className="h-16 bg-white/90 backdrop-blur-sm border-b border-slate-200" />
});

export default function DashboardLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // In a real app, you would check auth status here
  useEffect(() => {
    // Simulate checking auth status
    // In real implementation, you would use Clerk hooks here
    // Setting state based on external auth status
    const checkAuth = () => {
      // Simulate auth check - would use Clerk in real implementation
      setIsAuthenticated(true);
    };
    
    checkAuth();
  }, []);

  return (
    <>
      <CardNavClient isAuthenticated={isAuthenticated} />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}