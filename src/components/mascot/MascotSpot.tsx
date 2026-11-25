import React, { Suspense, lazy, useState } from 'react';
import type { Locale } from '../../types/content';
import {
  MASCOT_POSES,
  type MascotExpression,
  type MascotPose,
  type MascotVariant,
} from '../../utils/mascotRig';

const LazyIsbMascot3D = lazy(() =>
  import('./IsbMascot3D').then((m) => ({ default: m.IsbMascot3D }))
);

interface MascotSpotProps {
  locale: Locale;
  initialPose: MascotPose;
  cyclePoses?: readonly MascotPose[];
  initialExpression?: MascotExpression;
  variant?: MascotVariant;
  allowOrbit?: boolean;
  cameraDistance?: number;
  cameraTargetY?: number;
  className?: string;
  showHintBadge?: boolean;
  testId?: string;
}

/**
 * Lazy-loaded contextual 3D Mascot placement for embedding naturally inside key editorial sections.
 * Clicking cycles through curated fun poses with an instant joyful jump reaction.
 */
export function MascotSpot({
  locale,
  initialPose,
  cyclePoses,
  initialExpression,
  variant = 'female',
  allowOrbit = true,
  cameraDistance = 4.45,
  cameraTargetY = 1.2,
  className = '',
  showHintBadge = true,
  testId,
}: MascotSpotProps) {
  const isRtl = locale === 'fa';
  const poses = cyclePoses && cyclePoses.length > 0 ? cyclePoses : [initialPose];
  const [poseIdx, setPoseIdx] = useState(0);

  const currentPose = poses[poseIdx] ?? initialPose;
  const poseMeta = MASCOT_POSES.find((p) => p.id === currentPose);
  const currentExpression: MascotExpression =
    poseIdx === 0 && initialExpression
      ? initialExpression
      : (poseMeta?.defaultExpression ?? 'happy');

  const handleClick = () => {
    if (poses.length > 1) {
      setPoseIdx((prev) => (prev + 1) % poses.length);
    }
  };

  return (
    <div
      data-testid={testId ? `${testId}-wrapper` : undefined}
      className={`relative flex flex-col items-center justify-center ${className}`}
    >
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-[#84A65D]/30 bg-[#1B3B6F]/25 animate-pulse" />
          </div>
        }
      >
        <LazyIsbMascot3D
          testId={testId}
          pose={currentPose}
          expression={currentExpression}
          variant={variant}
          allowOrbit={allowOrbit}
          cameraDistance={cameraDistance}
          cameraTargetY={cameraTargetY}
          onMascotClick={handleClick}
          ariaLabel={
            isRtl
              ? `کاراکتر سه‌بعدی ISB (${poseMeta?.labelFa ?? ''}) — برای تغییر پوزیشن کلیک کنید`
              : `ISB 3D Mascot (${poseMeta?.labelEn ?? ''}) — click to switch pose`
          }
          className="w-full h-full"
        />
      </Suspense>

      {showHintBadge && poseMeta && (
        <span className="pointer-events-none mt-1 text-[10.5px] font-medium text-[#C6D2E3]/85 tracking-tight">
          {isRtl ? poseMeta.labelFa : poseMeta.labelEn}
          {poses.length > 1 && (
            <span className="text-[#84A65D] ms-1">
              {isRtl ? '· کلیک کنید' : '· Tap'}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
