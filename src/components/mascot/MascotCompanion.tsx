import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Maximize2,
  RefreshCw,
  RotateCcw,
  X,
} from '../icons/IsbIcons';
import type { Locale, PageRoute } from '../../types/content';
import { ARCHITECTURAL_EASE } from '../../utils/motionMath';
import {
  getNextMascotPose,
  getRouteMascotPreset,
  MASCOT_EXPRESSIONS,
  MASCOT_POSES,
  type MascotExpression,
  type MascotPose,
  type MascotVariant,
} from '../../utils/mascotRig';
import { IsbMascot3D } from './IsbMascot3D';

interface MascotCompanionProps {
  route: PageRoute;
  locale: Locale;
  onNavigate: (route: PageRoute) => void;
}

export function MascotCompanion({ route, locale, onNavigate }: MascotCompanionProps) {
  const isRtl = locale === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Keep studio admin / login gateways distraction-free
  const hiddenOnRoute = route.page === 'studio' || route.page === 'account';

  const preset = getRouteMascotPreset(route, locale);
  const [pose, setPose] = useState<MascotPose>(preset.pose);
  const [expression, setExpression] = useState<MascotExpression>(preset.expression);
  const [variant, setVariant] = useState<MascotVariant>(preset.variant);
  const [tipOpen, setTipOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [spinResetSignal, setSpinResetSignal] = useState(0);

  // Sync mascot pose & variant naturally whenever user navigates to a new page
  useEffect(() => {
    const next = getRouteMascotPreset(route, locale);
    setPose(next.pose);
    setExpression(next.expression);
    setVariant(next.variant);
    setTipOpen(false);
  }, [route.page, 'slug' in route ? route.slug : '', locale]);

  // Close 3D Studio modal on Escape key
  useEffect(() => {
    if (!studioOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStudioOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [studioOpen]);

  // Lock background page scroll while 3D Studio modal is open
  useEffect(() => {
    if (!studioOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [studioOpen]);

  if (hiddenOnRoute) return null;

  const activePoseMeta = MASCOT_POSES.find((p) => p.id === pose) ?? MASCOT_POSES[0];

  const handleCyclePose = () => {
    const nextPose = getNextMascotPose(pose);
    const nextMeta = MASCOT_POSES.find((p) => p.id === nextPose);
    setPose(nextPose);
    if (nextMeta) {
      setExpression(nextMeta.defaultExpression);
    }
  };

  return (
    <>
      {/* FLOATING CORNER 3D COMPANION (Subtle, Non-Intrusive, Zero Arrival Popup) */}
      {!studioOpen && (
        <div
          data-testid="mascot-floating-companion"
          className="fixed bottom-3.5 end-3.5 sm:bottom-5 sm:end-5 z-40 flex flex-col items-end gap-2 pointer-events-none"
        >
          {/* Contextual Speech Card (Only opens when user clicks the mascot!) */}
          <AnimatePresence>
            {tipOpen && !minimized && (
              <motion.div
                data-testid="mascot-tip-card"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22, ease: ARCHITECTURAL_EASE }}
                className="pointer-events-auto w-[min(86vw,296px)] rounded-2xl border border-[#6F9BFF]/32 bg-[#0B1324]/95 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.92)] p-3.5 sm:p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10.5px] font-semibold text-[#28CF77]">
                      {isRtl
                        ? `همراه سه‌بعدی ISB · ${activePoseMeta.labelFa}`
                        : `ISB 3D Guide · ${activePoseMeta.labelEn}`}
                    </p>
                    <p className="text-[12.5px] text-[#E6EEF9] leading-relaxed rtl:leading-[1.75]">
                      {isRtl ? preset.tipFa : preset.tipEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTipOpen(false)}
                    aria-label={isRtl ? 'بستن پیام' : 'Close tip'}
                    className="p-1 rounded-lg text-[#8B9DB7] hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Interactive Actions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
                  <button
                    type="button"
                    data-testid="open-mascot-studio-btn"
                    onClick={() => {
                      setTipOpen(false);
                      setStudioOpen(true);
                    }}
                    className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#223A87] to-[#2B54B8] hover:brightness-110 text-[#F5F8FC] text-[11.5px] font-semibold px-3 py-1.5 transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#84A65D]" />
                    <span>{isRtl ? 'استودیو ۳بعدی' : '3D Studio'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCyclePose}
                    title={isRtl ? 'تغییر پوزیشن' : 'Next pose'}
                    className="min-h-[36px] inline-flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-[#D7E3F5] text-[11.5px] font-medium px-2.5 py-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#F47221]" />
                    <span>{isRtl ? 'پوزیشن بعدی' : 'Pose'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTipOpen(false);
                      onNavigate(preset.ctaRoute);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#28CF77] hover:text-[#57E599] transition-colors"
                  >
                    <span>{isRtl ? preset.ctaLabelFa : preset.ctaLabelEn}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipOpen(false);
                      setMinimized(true);
                    }}
                    className="text-[11px] text-[#8B9DB7] hover:text-white transition-colors"
                  >
                    {isRtl ? 'کوچک‌کردن' : 'Minimize'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact Minimized Pill OR Live 3D Floating Companion Stage */}
          {minimized ? (
            <button
              type="button"
              data-testid="mascot-restore-btn"
              onClick={() => setMinimized(false)}
              className="pointer-events-auto inline-flex items-center gap-2 min-h-[42px] rounded-full border border-[#84A65D]/45 bg-[#0B1324]/92 hover:bg-[#121F3A] px-3.5 py-2 text-xs font-semibold text-[#F5F8FC] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.85)] transition-all"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#F47221] shrink-0" />
              <span>{isRtl ? 'کاراکتر ۳بعدی ISB' : 'ISB 3D'}</span>
            </button>
          ) : (
            <div className="pointer-events-auto relative group flex flex-col items-center">
              {/* Desktop Live 3D Mascot Corner Stage (Transparent Floating Vinyl Toy Feel) */}
              <div className="hidden sm:block relative w-[124px] h-[152px]">
                {/* Soft subtle radial studio floor glow beneath feet — NOT covering canvas */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 inset-x-3 h-7 rounded-full bg-[#3B68D6]/25 blur-xl transition-opacity group-hover:bg-[#84A65D]/35"
                />
                <IsbMascot3D
                  testId="floating-mascot-canvas"
                  pose={pose}
                  expression={expression}
                  variant={variant}
                  cameraDistance={4.35}
                  cameraTargetY={1.18}
                  onMascotClick={() => setTipOpen((prev) => !prev)}
                  ariaLabel={
                    isRtl
                      ? 'کاراکتر سه‌بعدی گروه ISB — برای تعامل و تغییر پوزیشن کلیک کنید'
                      : 'ISB Group 3D Mascot — click to interact or open 3D studio'
                  }
                  className="w-full h-full"
                />
                {/* Crisp floating micro-action bar on hover/focus */}
                <div className="absolute -bottom-1 inset-x-1 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    data-testid="floating-open-studio-pill"
                    onClick={() => setStudioOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#84A65D]/45 bg-[#0A1222]/92 hover:bg-[#1B3B6F] px-2.5 py-0.5 text-[10px] font-semibold text-[#F5EFE8] shadow-lg transition-colors whitespace-nowrap"
                  >
                    <Maximize2 className="w-2.5 h-2.5 text-[#84A65D]" />
                    <span>{isRtl ? 'استودیو ۳بعدی' : '3D Studio'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinimized(true)}
                    aria-label={isRtl ? 'کوچک‌کردن کاراکتر' : 'Minimize mascot'}
                    className="w-5 h-5 rounded-full border border-white/15 bg-[#0A1222]/90 hover:bg-white/15 text-[#9FB1CA] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mobile Compact Trigger (< sm, strictly compact to preserve viewport & <=15% sticky budget) */}
              <button
                type="button"
                data-testid="mobile-mascot-trigger"
                onClick={() => setStudioOpen(true)}
                aria-label={isRtl ? 'باز کردن استودیو سه‌بعدی کاراکتر ISB' : 'Open ISB 3D Mascot Studio'}
                className="sm:hidden inline-flex items-center gap-2 min-h-[44px] rounded-full border border-[#84A65D]/50 bg-[#0D182E]/95 px-3.5 py-2 text-[11.5px] font-semibold text-[#F5EFE8] shadow-[0_14px_34px_-8px_rgba(0,0,0,0.9)] active:scale-95 transition-transform"
              >
                <span className="w-6 h-6 rounded-full bg-[#1B3B6F] border border-[#F47221]/80 flex items-center justify-center text-[10px] font-bold text-[#F5EFE8]">
                  3D
                </span>
                <span>{isRtl ? 'کاراکتر ISB' : 'ISB 3D'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* FULL INTERACTIVE 3D MASCOT STUDIO SHOWCASE MODAL */}
      {studioOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-testid="mascot-studio-modal"
            role="dialog"
            aria-modal="true"
            aria-label={isRtl ? 'استودیو تعاملی کاراکتر سه‌بعدی ISB' : 'ISB Interactive 3D Mascot Studio'}
            className="fixed inset-0 z-[85] flex flex-col bg-[#060B15]/95"
          >
            {/* Subtle architectural radial studio backdrop behind 3D canvas */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 68% 58% at 50% 44%, rgba(34, 58, 135, 0.42) 0%, rgba(16, 30, 58, 0.28) 46%, rgba(6, 11, 21, 0.96) 100%)',
              }}
            />
            {/* Soft studio pedestal halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[62%] -translate-x-1/2 w-[min(78vw,460px)] h-28 rounded-full bg-[#84A65D]/14 blur-3xl"
            />

            {/* Minimal Top Header Bar (Zero obstructing side panels) */}
            <header className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8 pt-4 pb-2">
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] rtl:tracking-normal text-[#84A65D]">
                  {isRtl ? 'استودیو کاراکتر سه‌بعدی گروه ISB' : 'ISB 3D CHARACTER STUDIO'}
                </p>
                <h2 className="text-base sm:text-xl font-semibold rtl:font-extrabold text-[#F5EFE8] truncate">
                  {isRtl ? activePoseMeta.labelFa : activePoseMeta.labelEn}
                  <span className="hidden sm:inline text-xs font-normal text-[#9FB1CA] ms-2.5">
                    — {isRtl ? activePoseMeta.shortFa : activePoseMeta.shortEn}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Female / Male Character Variant Switcher */}
                <div
                  role="group"
                  aria-label={isRtl ? 'انتخاب نسخه کاراکتر' : 'Character variant'}
                  className="inline-flex items-center rounded-full border border-white/15 bg-[#0C1528]/90 p-1"
                >
                  <button
                    type="button"
                    data-testid="mascot-variant-female"
                    onClick={() => setVariant('female')}
                    className={`min-h-[34px] rounded-full px-3 sm:px-3.5 py-1 text-[11.5px] font-semibold transition-all ${
                      variant === 'female'
                        ? 'bg-[#84A65D] text-[#0A1309]'
                        : 'text-[#C6D2E3] hover:text-white'
                    }`}
                  >
                    {isRtl ? 'نسخه پاپیون سبز' : 'Female Bow'}
                  </button>
                  <button
                    type="button"
                    data-testid="mascot-variant-male"
                    onClick={() => setVariant('male')}
                    className={`min-h-[34px] rounded-full px-3 sm:px-3.5 py-1 text-[11.5px] font-semibold transition-all ${
                      variant === 'male'
                        ? 'bg-[#F47221] text-white'
                        : 'text-[#C6D2E3] hover:text-white'
                    }`}
                  >
                    {isRtl ? 'نسخه کلاسیک' : 'Classic Male'}
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="close-mascot-studio-btn"
                  onClick={() => setStudioOpen(false)}
                  aria-label={isRtl ? 'بستن استودیو سه‌بعدی' : 'Close 3D Studio'}
                  className="w-10 h-10 rounded-full border border-white/18 bg-[#0C1528]/90 hover:bg-white/15 text-[#F5F8FC] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Unobstructed Central 3D Viewport Stage */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-4 pb-2">
              <IsbMascot3D
                testId="studio-mascot-canvas"
                pose={pose}
                expression={expression}
                variant={variant}
                allowOrbit
                freeSpin
                resetSpinSignal={spinResetSignal}
                cameraDistance={4.55}
                cameraTargetY={1.2}
                ariaLabel={
                  isRtl
                    ? 'کاراکتر سه‌بعدی گروه ISB — برای چرخش ۳۶۰ درجه بکشید یا برای واکنش کلیک کنید'
                    : 'ISB 3D Mascot — drag horizontally to rotate 360 degrees or click to react'
                }
                className="w-full max-w-[680px] h-full max-h-[540px]"
              />
              <p className="pointer-events-none text-[11px] text-[#8B9DB7] mt-1">
                {isRtl
                  ? 'برای چرخش ۳۶۰ درجه بکشید · برای پرش و واکنش روی کاراکتر کلیک کنید'
                  : 'Drag horizontally to rotate 360° · Click character for reaction'}
              </p>
            </div>

            {/* Compact Translucent Bottom Control Dock (Zero Side Panels) */}
            <footer className="relative z-10 px-3 sm:px-6 pb-4 sm:pb-5 pt-1">
              <div className="max-w-[960px] mx-auto rounded-2xl border border-white/14 bg-[#0B1324]/92 px-3 py-2.5 sm:px-4 sm:py-3 space-y-2.5 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.9)]">
                {/* 7 Signature Poses Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <span className="text-[10.5px] font-semibold text-[#8B9DB7] shrink-0 pe-1.5">
                    {isRtl ? 'پوزیشن‌ها:' : 'Poses:'}
                  </span>
                  {MASCOT_POSES.map((item) => {
                    const active = pose === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`studio-pose-${item.id}`}
                        onClick={() => {
                          setPose(item.id);
                          setExpression(item.defaultExpression);
                        }}
                        className={`shrink-0 min-h-[36px] rounded-xl px-3 py-1.5 text-[11.5px] font-medium transition-all border ${
                          active
                            ? 'border-[#84A65D] bg-[#84A65D]/20 text-[#F5EFE8] font-semibold'
                            : 'border-white/10 bg-white/[0.03] text-[#C6D2E3] hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {isRtl ? item.labelFa : item.labelEn}
                      </button>
                    );
                  })}
                </div>

                {/* 4 Facial Expressions + Reset View Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10.5px] font-semibold text-[#8B9DB7] shrink-0 pe-1.5">
                      {isRtl ? 'حالت چهره:' : 'Expression:'}
                    </span>
                    {MASCOT_EXPRESSIONS.map((expr) => {
                      const active = expression === expr.id;
                      return (
                        <button
                          key={expr.id}
                          type="button"
                          data-testid={`studio-expr-${expr.id}`}
                          onClick={() => setExpression(expr.id)}
                          className={`shrink-0 min-h-[32px] rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all border ${
                            active
                              ? 'border-[#F47221]/80 bg-[#F47221]/20 text-[#FFF2E8] font-semibold'
                              : 'border-white/10 bg-white/[0.03] text-[#B5C4DA] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {isRtl ? expr.labelFa : expr.labelEn}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSpinResetSignal((c) => c + 1)}
                    className="inline-flex items-center gap-1.5 min-h-[32px] rounded-lg border border-white/12 bg-white/[0.04] hover:bg-white/[0.1] px-2.5 py-1 text-[11px] text-[#C6D2E3] hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'زاویه روبرو' : 'Reset View'}</span>
                  </button>
                </div>
              </div>
            </footer>
          </div>,
          document.body
        )}
    </>
  );
}
