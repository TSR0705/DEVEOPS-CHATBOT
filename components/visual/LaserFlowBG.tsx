"use client";

import dynamic from "next/dynamic";

const LaserFlow = dynamic(() => import("./LaserFlow"), { ssr: false });

type State = "idle" | "queued" | "executing" | "success" | "error";
type Variant = "hero" | "ambient";

const STATE_COLOR: Record<State, string> = {
  idle: "#64748b",
  queued: "#f59e0b",
  executing: "#a855f7",
  success: "#22c55e",
  error: "#ef4444",
};

export default function LaserFlowBG({
  state,
  variant,
}: {
  state: State;
  variant: Variant;
}) {
  return (
    <div
      id="laserflow-root"
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden laserflow-container"
    >
      <LaserFlow
        mouseSmoothTime={0}
        mouseTiltStrength={0}
        verticalBeamOffset={-0.15}
        wispIntensity={variant === "hero" ? 3 : 1.5}
        fogIntensity={variant === "hero" ? 0.35 * 0.7 : 0.2 * 0.7} 
        color={STATE_COLOR[state]}
      />
    </div>
  );
}

