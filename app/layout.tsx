
import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
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
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#020409] text-[#E2E6F0] antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
