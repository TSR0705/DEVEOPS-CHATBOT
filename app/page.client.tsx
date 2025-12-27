// Phase 5.2 CardNav integration complete
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import the navbar component with no SSR
const CardNavClient = dynamic(() => import("../components/nav/CardNavClient"), {
  ssr: false,
  loading: () => <div className="h-16 bg-white/90 backdrop-blur-sm border-b border-slate-200" />
});

export default function LandingPageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // In a real app, you would check auth status here
  useEffect(() => {
    // Simulate checking auth status
    // In real implementation, you would use Clerk hooks here
    // Setting state based on external auth status
    const checkAuth = () => {
      // Simulate auth check - would use Clerk in real implementation
      setIsAuthenticated(false);
    };
    
    checkAuth();
  }, []);

  return (
    <>
      <CardNavClient isAuthenticated={isAuthenticated} />
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            DeployBot
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            A safe, chat-driven Kubernetes control plane
          </p>
        </div>
      </main>
    </>
  );
}