"use client";

import dynamic from "next/dynamic";

const LaserFlow = dynamic(() => import("../visual/LaserFlow"), {
  ssr: false,
});

export default function LaserFlowBG() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex "
    >
      <LaserFlow
        verticalBeamOffset={-0.3}
        horizontalBeamOffset={0.2}
        flowSpeed={0.4}
        fogIntensity={0.45}
        color="#C084FC"
      />
    </div>
  );
}
