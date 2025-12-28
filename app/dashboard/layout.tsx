// Phase 5.2 CardNav integration complete
// Dashboard layout with navbar

import DashboardLayoutClient from "./layout.client";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
