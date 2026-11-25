import type { Locale, PageRoute } from '../types/content';

export type MascotVariant = 'female' | 'male';

export type MascotPose =
  | 'wave-tablet'
  | 'thumbs-up'
  | 'blueprint'
  | 'laptop-sit'
  | 'eureka-point'
  | 'thinking'
  | 'walk-briefcase';

export type MascotExpression = 'happy' | 'joy' | 'surprised' | 'thinking';

export interface MascotPoseMeta {
  id: MascotPose;
  labelFa: string;
  labelEn: string;
  shortFa: string;
  shortEn: string;
  defaultExpression: MascotExpression;
  recommendedVariant: MascotVariant;
}

export interface MascotExpressionMeta {
  id: MascotExpression;
  labelFa: string;
  labelEn: string;
}

export interface RouteMascotPreset {
  pose: MascotPose;
  expression: MascotExpression;
  variant: MascotVariant;
  tipFa: string;
  tipEn: string;
  ctaLabelFa: string;
  ctaLabelEn: string;
  ctaRoute: PageRoute;
}

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface MascotRigFrame {
  rootY: number;
  rootRotY: number;
  torsoRot: Vec3Tuple;
  headRot: Vec3Tuple;
  leftShoulderRot: Vec3Tuple;
  leftElbowRot: Vec3Tuple;
  rightShoulderRot: Vec3Tuple;
  rightElbowRot: Vec3Tuple;
  leftHipRot: Vec3Tuple;
  leftKneeRot: Vec3Tuple;
  rightHipRot: Vec3Tuple;
  rightKneeRot: Vec3Tuple;
  leftThumbUp: boolean;
  rightThumbUp: boolean;
  leftPointing: boolean;
  rightPointing: boolean;
  expression: MascotExpression;
  blinkScaleY: number;
  bowWag: number;
  props: {
    tablet: boolean;
    blueprint: boolean;
    laptop: boolean;
    briefcase: boolean;
    exclamation: boolean;
    question: boolean;
    joyTicks: boolean;
  };
  propFloatY: number;
  propScale: number;
}

export const MASCOT_POSES: readonly MascotPoseMeta[] = [
  {
    id: 'wave-tablet',
    labelFa: 'خوش‌آمد با تبلت',
    labelEn: 'Tablet Welcome',
    shortFa: 'سلام و معرفی همراه تبلت ISB',
    shortEn: 'Warm greeting with ISB tablet',
    defaultExpression: 'happy',
    recommendedVariant: 'female',
  },
  {
    id: 'thumbs-up',
    labelFa: 'تأیید مهندسی',
    labelEn: 'Approved!',
    shortFa: 'تأیید کیفیت و استاندارد پایدار',
    shortEn: 'Engineering & quality approval',
    defaultExpression: 'happy',
    recommendedVariant: 'male',
  },
  {
    id: 'blueprint',
    labelFa: 'بررسی نقشه',
    labelEn: 'Blueprint Study',
    shortFa: 'مطالعه پلان معماری و جزئیات',
    shortEn: 'Inspecting architectural floorplans',
    defaultExpression: 'happy',
    recommendedVariant: 'female',
  },
  {
    id: 'laptop-sit',
    labelFa: 'تحلیل با لپ‌تاپ',
    labelEn: 'Energy Modeling',
    shortFa: 'شبیه‌سازی انرژی و ارزیابی سرو سبز',
    shortEn: 'Running energy & daylight models',
    defaultExpression: 'joy',
    recommendedVariant: 'female',
  },
  {
    id: 'eureka-point',
    labelFa: 'ایده و اشاره',
    labelEn: 'Idea Point',
    shortFa: 'معرفی راهکارهای خلاقانه و پایدار',
    shortEn: 'Highlighting sustainable solutions',
    defaultExpression: 'joy',
    recommendedVariant: 'female',
  },
  {
    id: 'thinking',
    labelFa: 'تفکر و مشاوره',
    labelEn: 'Thinking',
    shortFa: 'سؤالی درباره پروژه یا مبحث ۱۹ دارید؟',
    shortEn: 'Exploring smart project answers',
    defaultExpression: 'thinking',
    recommendedVariant: 'female',
  },
  {
    id: 'walk-briefcase',
    labelFa: 'آماده پروژه',
    labelEn: 'On the Move',
    shortFa: 'همراه شما از طراحی تا اجرا',
    shortEn: 'Ready for site & studio delivery',
    defaultExpression: 'happy',
    recommendedVariant: 'female',
  },
] as const;

export const MASCOT_EXPRESSIONS: readonly MascotExpressionMeta[] = [
  { id: 'happy', labelFa: 'لبخند', labelEn: 'Happy' },
  { id: 'joy', labelFa: 'خوشحالی', labelEn: 'Joy' },
  { id: 'surprised', labelFa: 'شگفت‌زده', labelEn: 'Surprised' },
  { id: 'thinking', labelFa: 'متفکر', labelEn: 'Thinking' },
] as const;

const POSE_SEQUENCE: readonly MascotPose[] = MASCOT_POSES.map((p) => p.id);

export function getNextMascotPose(current: MascotPose): MascotPose {
  const idx = POSE_SEQUENCE.indexOf(current);
  if (idx < 0) return POSE_SEQUENCE[0];
  return POSE_SEQUENCE[(idx + 1) % POSE_SEQUENCE.length];
}

export function getRouteMascotPreset(route: PageRoute, _locale: Locale): RouteMascotPreset {
  switch (route.page) {
    case 'home':
      return {
        pose: 'wave-tablet',
        expression: 'happy',
        variant: 'female',
        tipFa: 'سلام! من همراه سه‌بعدی ISB هستم؛ بزن روم تا پوزیشن‌هام رو ببینی!',
        tipEn: 'Hi! I am the 3D ISB mascot — click me or open my 3D studio!',
        ctaLabelFa: 'شروع ارزیابی پایداری',
        ctaLabelEn: 'Start Assessment',
        ctaRoute: { page: 'sustainability-lab' },
      };
    case 'materials-technologies':
      return {
        pose: 'thumbs-up',
        expression: 'happy',
        variant: 'male',
        tipFa: 'مصالح منتخب با گواهینامه‌های رسمی و کاتالوگ فنی اینجا گردآوری شده!',
        tipEn: 'Explore certified innovative materials and compare specs side-by-side.',
        ctaLabelFa: 'مشاوره انتخاب مصالح',
        ctaLabelEn: 'Material Advisory',
        ctaRoute: { page: 'contact' },
      };
    case 'expertise':
    case 'discipline':
    case 'projects':
    case 'project-detail':
      return {
        pose: 'blueprint',
        expression: 'happy',
        variant: 'female',
        tipFa: 'در حال بررسی پلان‌ها و جزئیات طراحی یکپارچه معماری، انرژی و سازه!',
        tipEn: 'Reviewing integrated architectural, energy, and structural blueprints!',
        ctaLabelFa: 'مشاوره پروژه شما',
        ctaLabelEn: 'Discuss a Project',
        ctaRoute: { page: 'contact' },
      };
    case 'sustainability-lab':
      return {
        pose: 'laptop-sit',
        expression: 'joy',
        variant: 'female',
        tipFa: 'لپ‌تاپ روشنه! آماده شبیه‌سازی مبحث ۱۹ و امتیاز سرو سبز پروژه شما هستم.',
        tipEn: 'Laptop ready! Let us calibrate Code 19 & Saro Sabz performance.',
        ctaLabelFa: 'مشاهده مصالح نوین',
        ctaLabelEn: 'Explore Materials',
        ctaRoute: { page: 'materials-technologies' },
      };
    case 'courses':
    case 'insights':
    case 'insight-detail':
      return {
        pose: 'thinking',
        expression: 'thinking',
        variant: 'female',
        tipFa: 'نکته‌های کاربردی طراحی اقلیمی و مقالات تخصصی گروه ISB رو از دست نده!',
        tipEn: 'Dive into ISB technical insights and hands-on sustainability courses.',
        ctaLabelFa: 'آزمایشگاه پایداری',
        ctaLabelEn: 'Sustainability Lab',
        ctaRoute: { page: 'sustainability-lab' },
      };
    case 'about':
      return {
        pose: 'walk-briefcase',
        expression: 'happy',
        variant: 'male',
        tipFa: 'تیم مهندسی و معماری ISB از ایده‌پردازی تا ساخت پایدار کنار شماست!',
        tipEn: 'Meet the multidisciplinary ISB architects and engineers behind the work.',
        ctaLabelFa: 'تماس با تیم ما',
        ctaLabelEn: 'Contact Our Team',
        ctaRoute: { page: 'contact' },
      };
    case 'contact':
      return {
        pose: 'eureka-point',
        expression: 'joy',
        variant: 'female',
        tipFa: 'فرم رو پر کن تا خیلی سریع با تیم فنی ما جلسه مشاوره تنظیم کنیم!',
        tipEn: 'Share your project brief and our engineers will get right back to you!',
        ctaLabelFa: 'مشاهده پروژه‌ها',
        ctaLabelEn: 'View Projects',
        ctaRoute: { page: 'projects' },
      };
    default:
      return {
        pose: 'wave-tablet',
        expression: 'happy',
        variant: 'female',
        tipFa: 'همراه سه‌بعدی گروه معماری و مهندسی پایدار ISB',
        tipEn: 'Your 3D companion at ISB Sustainable Group',
        ctaLabelFa: 'صفحه اصلی',
        ctaLabelEn: 'Home',
        ctaRoute: { page: 'home' },
      };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Pure kinematic pose evaluator for the 3D ISB mascot.
 * Right side of character = -X in viewer space (character faces +Z).
 * Left side of character = +X in viewer space.
 */
export function evaluateMascotPose(
  pose: MascotPose,
  expression: MascotExpression,
  elapsedSec: number,
  pointerX = 0,
  pointerY = 0,
  clickBurst = 0
): MascotRigFrame {
  const t = Number.isFinite(elapsedSec) ? elapsedSec : 0;
  const px = clamp(Number.isFinite(pointerX) ? pointerX : 0, -1, 1);
  const py = clamp(Number.isFinite(pointerY) ? pointerY : 0, -1, 1);
  const burst = clamp(Number.isFinite(clickBurst) ? clickBurst : 0, 0, 1);

  const breath = Math.sin(t * 2.15) * 0.022;
  const gentleSway = Math.sin(t * 1.15) * 0.032;
  const jumpOffset = Math.sin(burst * Math.PI) * 0.19;
  const burstSpin = Math.sin(burst * Math.PI) * 0.24;

  // Periodic natural blink (~every 3.8 seconds, brief 0.14s dip)
  const blinkCycle = t % 3.85;
  let blinkScaleY = 1;
  if (blinkCycle > 3.68 && blinkCycle < 3.82) {
    const phase = (blinkCycle - 3.68) / 0.14;
    blinkScaleY = 1 - Math.sin(phase * Math.PI) * 0.88;
  }

  const effectiveExpression: MascotExpression = burst > 0.22 ? 'joy' : expression;

  const frame: MascotRigFrame = {
    rootY: breath + jumpOffset,
    rootRotY: gentleSway + burstSpin,
    torsoRot: { x: Math.sin(t * 2.15) * 0.02, y: 0, z: Math.sin(t * 1.15) * 0.018 },
    headRot: {
      x: clamp(-py * 0.18, -0.2, 0.2) + Math.sin(t * 1.6) * 0.022,
      y: clamp(px * 0.3, -0.34, 0.34) + Math.sin(t * 0.95) * 0.035,
      z: -px * 0.06 + Math.sin(t * 1.3) * 0.022,
    },
    // Right-hand rule on -Y limbs: +Z swings OUT to +X (left limb), -Z swings OUT to -X (right limb)
    leftShoulderRot: { x: 0.06, y: 0, z: 0.22 },
    leftElbowRot: { x: -0.22, y: 0, z: 0.06 },
    rightShoulderRot: { x: 0.06, y: 0, z: -0.22 },
    rightElbowRot: { x: -0.22, y: 0, z: -0.06 },
    leftHipRot: { x: 0, y: 0.12, z: 0.06 },
    leftKneeRot: { x: 0, y: 0, z: 0 },
    rightHipRot: { x: 0, y: -0.12, z: -0.06 },
    rightKneeRot: { x: 0, y: 0, z: 0 },
    leftThumbUp: false,
    rightThumbUp: false,
    leftPointing: false,
    rightPointing: false,
    expression: effectiveExpression,
    blinkScaleY,
    bowWag: Math.sin(t * 2.8) * 0.06 + burst * 0.22,
    props: {
      tablet: false,
      blueprint: false,
      laptop: false,
      briefcase: false,
      exclamation: effectiveExpression === 'surprised',
      question: effectiveExpression === 'thinking',
      joyTicks: effectiveExpression === 'joy',
    },
    propFloatY: Math.sin(t * 3.1) * 0.055,
    propScale: 1 + burst * 0.12,
  };

  switch (pose) {
    case 'wave-tablet': {
      // Matches female hero on branding board: left arm (+X, viewer's right) extended out waving warmly; right arm (-X) tucked on hip with ISB tablet!
      const wave = Math.sin(t * 5.0) * 0.2;
      frame.props.tablet = true;
      frame.torsoRot.z = 0.03 + Math.sin(t * 1.6) * 0.015;
      frame.headRot.z += -0.05;
      // Left arm (+X) raised out wide to the side & bent gracefully upward in greeting wave
      frame.leftShoulderRot = { x: -0.26, y: 0.12, z: 1.18 + wave * 0.35 };
      frame.leftElbowRot = { x: -0.22, y: 0, z: 0.82 + wave };
      // Right arm (-X) bent akimbo holding the cream ISB tablet against hip
      frame.rightShoulderRot = { x: -0.24, y: -0.15, z: -0.58 };
      frame.rightElbowRot = { x: -0.55, y: 0.22, z: 0.72 };
      // Confident slight wide stance showcasing orange sneakers
      frame.leftHipRot = { x: -0.03, y: 0.15, z: 0.08 };
      frame.rightHipRot = { x: 0.03, y: -0.15, z: -0.08 };
      break;
    }

    case 'thumbs-up': {
      // Matches left male hero on branding board: bold forward/side right-arm thumbs-up!
      const pulse = Math.sin(t * 3.2) * 0.07;
      frame.rightThumbUp = true;
      frame.rootRotY = 0.14 + gentleSway * 0.6 + burstSpin;
      frame.torsoRot.y = -0.08;
      frame.headRot.y += 0.05;
      // Right arm (-X, viewer's left) raised forward & slightly outward with proud thumbs-up
      frame.rightShoulderRot = { x: -0.96 + pulse, y: -0.18, z: -0.58 };
      frame.rightElbowRot = { x: -0.95 - pulse * 0.4, y: 0.1, z: 0.25 };
      // Left arm (+X) relaxed heroic stance at side
      frame.leftShoulderRot = { x: 0.1, y: 0, z: 0.26 };
      frame.leftElbowRot = { x: -0.28, y: 0, z: -0.08 };
      frame.leftHipRot = { x: -0.04, y: 0.16, z: 0.09 };
      frame.rightHipRot = { x: 0.04, y: -0.16, z: -0.09 };
      break;
    }

    case 'blueprint': {
      // Matches Pose #2: both arms reaching forward holding the unfolded 3D architectural floorplan sheet cleanly by its sides!
      const inspectSway = Math.sin(t * 1.8) * 0.05;
      frame.props.blueprint = true;
      frame.torsoRot.x = 0.06;
      frame.headRot.x += 0.12;
      frame.headRot.y += inspectSway * 1.3;
      frame.leftShoulderRot = { x: -0.68, y: 0.12, z: 0.48 };
      frame.leftElbowRot = { x: -0.78, y: 0, z: -0.36 };
      frame.rightShoulderRot = { x: -0.68, y: -0.12, z: -0.48 };
      frame.rightElbowRot = { x: -0.78, y: 0, z: 0.36 };
      frame.leftHipRot = { x: 0, y: 0.14, z: 0.07 };
      frame.rightHipRot = { x: 0, y: -0.14, z: -0.07 };
      break;
    }

    case 'laptop-sit': {
      // Matches Pose #3: cross-legged floor sit with metallic ISB laptop on lap & left hand open in friendly gesture!
      const typing = Math.sin(t * 6.0) * 0.06;
      frame.props.laptop = true;
      frame.rootY = -0.52 + breath * 0.4 + jumpOffset * 0.45;
      frame.torsoRot.x = 0.06;
      frame.headRot.x += 0.06;
      // Right arm (-X) typing gently behind laptop
      frame.rightShoulderRot = { x: -0.62 + typing * 0.4, y: -0.15, z: -0.34 };
      frame.rightElbowRot = { x: -0.78 - typing * 0.4, y: 0, z: 0.38 };
      // Left arm (+X) open outward in cheerful presentation gesture (matches sheet!)
      frame.leftShoulderRot = { x: -0.34, y: 0.12, z: 0.92 + Math.sin(t * 2.5) * 0.08 };
      frame.leftElbowRot = { x: -0.35, y: 0, z: 0.35 };
      // Wide seated cross-legged lotus pose showing orange sneaker soles tucked cleanly in front!
      frame.leftHipRot = { x: -1.35, y: -0.32, z: 0.68 };
      frame.leftKneeRot = { x: 1.15, y: 0, z: -0.82 };
      frame.rightHipRot = { x: -1.35, y: 0.32, z: -0.68 };
      frame.rightKneeRot = { x: 1.15, y: 0, z: 0.82 };
      break;
    }

    case 'eureka-point': {
      // Matches Pose #4: joyful diagonal upward point with left arm (+X) & energetic wide stance!
      const bounce = Math.abs(Math.sin(t * 3.1)) * 0.04;
      frame.leftPointing = true;
      frame.rootY = breath + bounce + jumpOffset;
      frame.torsoRot.z = 0.08;
      frame.headRot.z += -0.08;
      frame.headRot.y += 0.12;
      // Left arm (+X) raised high pointing diagonally up-right!
      frame.leftShoulderRot = { x: -0.25, y: 0.1, z: 2.28 + Math.sin(t * 3.1) * 0.08 };
      frame.leftElbowRot = { x: -0.12, y: 0, z: 0.08 };
      // Right arm (-X) braced playfully out at hip
      frame.rightShoulderRot = { x: -0.12, y: -0.1, z: -0.68 };
      frame.rightElbowRot = { x: -0.45, y: 0, z: 0.72 };
      // Energetic wide stance
      frame.leftHipRot = { x: -0.05, y: 0.18, z: 0.16 };
      frame.rightHipRot = { x: 0.06, y: -0.18, z: -0.16 };
      frame.rightKneeRot = { x: 0.14, y: 0, z: 0 };
      break;
    }

    case 'thinking': {
      // Matches Expression #4: cute hand raised to chin with floating 3D `?`!
      const tap = Math.sin(t * 2.4) * 0.04;
      frame.props.question = true;
      frame.torsoRot.z = -0.04;
      frame.headRot.z += 0.11;
      frame.headRot.x += -0.04;
      // Left arm (+X) raised forward & bent cleanly up toward chin
      frame.leftShoulderRot = { x: -1.08 + tap, y: 0.25, z: 0.36 };
      frame.leftElbowRot = { x: -1.12, y: 0, z: -0.62 };
      // Right arm (-X) resting comfortably at hip
      frame.rightShoulderRot = { x: 0.08, y: -0.08, z: -0.46 };
      frame.rightElbowRot = { x: -0.42, y: 0, z: 0.52 };
      frame.leftHipRot = { x: 0.02, y: 0.12, z: 0.07 };
      frame.rightHipRot = { x: -0.02, y: -0.12, z: -0.07 };
      break;
    }

    case 'walk-briefcase': {
      // Matches Pose #1: cheerful walk stride carrying the navy ISB satchel!
      const stride = Math.sin(t * 4.4);
      const lift = Math.abs(Math.cos(t * 4.4)) * 0.05;
      frame.props.briefcase = true;
      frame.rootY = lift + jumpOffset;
      frame.rootRotY = 0.32 + gentleSway * 0.35 + burstSpin;
      frame.torsoRot.x = 0.07;
      frame.torsoRot.y = stride * 0.11;
      frame.headRot.y += -0.16;
      // Lively walk stride
      frame.leftHipRot = { x: stride * 0.45, y: 0.08, z: 0.06 };
      frame.leftKneeRot = { x: Math.max(0, -stride * 0.48), y: 0, z: 0 };
      frame.rightHipRot = { x: -stride * 0.45, y: -0.08, z: -0.06 };
      frame.rightKneeRot = { x: Math.max(0, stride * 0.48), y: 0, z: 0 };
      // Left arm (+X) gesturing forward warmly; right arm (-X) holding navy briefcase
      frame.leftShoulderRot = { x: -0.46 - stride * 0.28, y: 0.12, z: 0.44 };
      frame.leftElbowRot = { x: -0.58, y: 0, z: 0.16 };
      frame.rightShoulderRot = { x: 0.16 + stride * 0.16, y: 0, z: -0.32 };
      frame.rightElbowRot = { x: -0.32, y: 0, z: -0.08 };
      break;
    }
  }

  return frame;
}
