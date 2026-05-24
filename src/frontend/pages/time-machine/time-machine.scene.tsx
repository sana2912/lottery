"use client";

import { useMemo } from "react";

const STAR_COUNT = 96;

function buildStarField() {
  const stars: {
    id: string;
    left: string;
    opacity: number;
    size: number;
    top: string;
  }[] = [];

  for (let index = 0; index < STAR_COUNT; index += 1) {
    const seed = index * 12.9898;

    stars.push({
      id: `tm-star-${index}`,
      left: `${((Math.sin(seed) * 43758.5453) % 1) * 100}%`,
      opacity: 0.28 + (index % 5) * 0.1,
      size: index % 9 === 0 ? 2 : 1,
      top: `${((Math.sin(seed + 1.23) * 43758.5453) % 1) * 100}%`
    });
  }

  return stars;
}

export default function TimeMachineScene() {
  const stars = useMemo(() => buildStarField(), []);

  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden bg-[#0b1220]">
      {stars.map((star) => (
        <span
          className="absolute rounded-full bg-[#e2e8f0]"
          key={star.id}
          style={{
            height: star.size,
            left: star.left,
            opacity: star.opacity,
            top: star.top,
            width: star.size
          }}
        />
      ))}
    </div>
  );
}
