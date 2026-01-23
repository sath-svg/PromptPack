"use client";

import { useState } from "react";
import Link from "next/link";

export function RoadmapTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="roadmap-tooltip-trigger"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
    >
      Community-funded roadmap
      {isVisible && (
        <span className="roadmap-tooltip">
          Building these features takes time — and community support.{" "}
          <Link href="/pricing" className="pro-link">Pro</Link> subscribers help fund and shape what comes next.
        </span>
      )}
    </span>
  );
}
