'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type QuestionnaireLayoutProps = {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
};

type StaticSwirl = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  flip: boolean;
};

function createSeededRng(seed: number) {
  let t = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function QuestionnaireLayout({
  children,
  currentStep: _currentStep,
  totalSteps: _totalSteps,
}: QuestionnaireLayoutProps): React.JSX.Element {
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [swirls, setSwirls] = useState<StaticSwirl[]>([]);

  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const h = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        window.innerHeight
      );
      setViewport({ width: w, height: h });
    };

    measure();
    window.addEventListener('resize', measure);

    const observer = new MutationObserver(() => {
      setTimeout(measure, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;

    // Reduced count for elegance
    const count = window.innerWidth < 768 ? 12 : 18;
    const minSize = 36;
    const maxSize = 72;
    const opacityMin = 0.02;
    const opacityMax = 0.06;
    const areaPadding = 60;

    const rng = createSeededRng(12345);
    const results: StaticSwirl[] = [];
    const maxAttempts = count * 10;
    const spacing = 12;

    for (let i = 0; i < count && i < maxAttempts; i++) {
      const size = minSize + rng() * (maxSize - minSize);
      const x = areaPadding + rng() * (viewport.width - areaPadding * 2);
      const y = areaPadding + rng() * (viewport.height - areaPadding * 2);
      const rotation = rng() * 360;
      const opacity = opacityMin + rng() * (opacityMax - opacityMin);
      const flip = rng() > 0.5;

      let overlaps = false;
      const r = size / 2;
      for (const existing of results) {
        const dx = x - existing.x;
        const dy = y - existing.y;
        const minDist = r + existing.size / 2 + spacing;
        if (dx * dx + dy * dy < minDist * minDist) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        results.push({ x, y, size, rotation, opacity, flip });
      }
    }

    setSwirls(results);
  }, [viewport]);

  return (
    <div className="bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Refined ambient glow */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(167, 218, 219, 0.04) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 100% 100%, rgba(79, 70, 229, 0.03) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Elegant swirl pattern */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-0 overflow-hidden"
        style={{
          width: viewport.width,
          height: viewport.height,
        }}
      >
        {swirls.map((swirl, idx) => (
          <Image
            key={idx}
            src="/logo-swirl.png"
            alt=""
            width={Math.round(swirl.size)}
            height={Math.round(swirl.size)}
            className="absolute select-none"
            style={{
              left: swirl.x,
              top: swirl.y,
              opacity: swirl.opacity,
              transform: `translate(-50%, -50%) rotate(${swirl.rotation}deg) scaleX(${swirl.flip ? -1 : 1})`,
              pointerEvents: 'none',
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="animate-scale-in">{children}</div>
      </div>
    </div>
  );
}
