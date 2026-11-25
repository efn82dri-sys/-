import * as THREE from 'three';
import type { MascotExpression, MascotRigFrame, MascotVariant } from '../../utils/mascotRig';

// Palette calibrated for ACESFilmic tone mapping + RoomEnvironment so deep navy, sage green & vibrant orange match the branding board faithfully
const COLORS = {
  navyFrame: 0x163161,
  navyDeep: 0x102447,
  pantsNavy: 0x17253d,
  pantsPocket: 0x1e304e,
  sageGreen: 0x7da154,
  sageLight: 0x8eb464,
  cream: 0xf4eee6,
  creamWarm: 0xeae1d7,
  orangeSneaker: 0xf96915,
  eyeBlack: 0x0d121c,
  tongueCoral: 0xe66d5e,
  laptopTaupe: 0x766c66,
  laptopDark: 0x222938,
  blueprintPaper: 0xf1ece4,
  tabletBody: 0xe2dad2,
} as const;

export interface BuiltIsbMascot {
  root: THREE.Group;
  setVariant: (variant: MascotVariant) => void;
  applyFrame: (frame: MascotRigFrame, dt: number) => void;
  dispose: () => void;
}

function drawIsbLeafPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  // Stepped architectural ISB leaf silhouette matching the uploaded branding board
  ctx.beginPath();
  ctx.moveTo(cx, cy - 42 * scale);
  ctx.lineTo(cx + 12 * scale, cy - 34 * scale);
  ctx.lineTo(cx + 12 * scale, cy - 22 * scale);
  ctx.lineTo(cx + 24 * scale, cy - 15 * scale);
  ctx.lineTo(cx + 24 * scale, cy + 12 * scale);
  ctx.quadraticCurveTo(cx + 24 * scale, cy + 28 * scale, cx + 4 * scale, cy + 32 * scale);
  ctx.lineTo(cx + 4 * scale, cy + 44 * scale);
  ctx.lineTo(cx - 4 * scale, cy + 44 * scale);
  ctx.lineTo(cx - 4 * scale, cy + 32 * scale);
  ctx.quadraticCurveTo(cx - 24 * scale, cy + 28 * scale, cx - 24 * scale, cy + 12 * scale);
  ctx.lineTo(cx - 24 * scale, cy - 15 * scale);
  ctx.lineTo(cx - 12 * scale, cy - 22 * scale);
  ctx.lineTo(cx - 12 * scale, cy - 34 * scale);
  ctx.closePath();
}

function createIsbEmblemTexture(
  strokeColor: string,
  bgColor: string,
  withWordmark = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = withWordmark ? 512 : 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = withWordmark ? 11 : 14;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (withWordmark) {
    drawIsbLeafPath(ctx, 118, 126, 1.45);
    ctx.stroke();

    // Inner stem tick
    ctx.beginPath();
    ctx.moveTo(118, 152);
    ctx.lineTo(118, 186);
    ctx.stroke();

    // Divider line
    ctx.fillStyle = strokeColor;
    ctx.fillRect(178, 72, 4, 108);

    // Stylized "isb" + "GROUP"
    ctx.font = '700 72px system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('isb', 206, 108);
    ctx.font = '700 34px system-ui, -apple-system, sans-serif';
    ctx.fillText('GROUP', 208, 162);
  } else {
    drawIsbLeafPath(ctx, 128, 126, 2.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, 162);
    ctx.lineTo(128, 214);
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createBlueprintTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F2ECE4';
  ctx.fillRect(0, 0, 512, 360);

  // Subtle architectural drafting grid
  ctx.strokeStyle = 'rgba(27, 59, 111, 0.1)';
  ctx.lineWidth = 1;
  for (let x = 24; x < 512; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 360);
    ctx.stroke();
  }
  for (let y = 24; y < 360; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Outer blueprint border & fold crease shadows
  ctx.strokeStyle = '#3C4D69';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 468, 316);

  // Architectural walls & rooms (matching Pose #2 sheet)
  ctx.strokeStyle = '#314463';
  ctx.lineWidth = 4.5;
  ctx.strokeRect(46, 46, 210, 165);
  ctx.strokeRect(256, 46, 210, 130);
  ctx.strokeRect(46, 211, 145, 102);
  ctx.strokeRect(191, 211, 165, 102);
  ctx.strokeRect(356, 176, 110, 137);

  // Interior partition walls + door swing arcs
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(135, 46);
  ctx.lineTo(135, 160);
  ctx.moveTo(356, 46);
  ctx.lineTo(356, 128);
  ctx.stroke();

  // Door arcs
  ctx.strokeStyle = '#6A7B96';
  ctx.lineWidth = 2;
  const arcs: [number, number, number, number, number][] = [
    [135, 185, 28, -Math.PI * 0.5, 0],
    [256, 120, 26, Math.PI * 0.5, Math.PI],
    [191, 260, 24, 0, Math.PI * 0.5],
    [356, 245, 24, Math.PI, Math.PI * 1.5],
  ];
  for (const [ax, ay, r, s, e] of arcs) {
    ctx.beginPath();
    ctx.arc(ax, ay, r, s, e);
    ctx.stroke();
  }

  // Green sustainability solar/landscape accent notes
  ctx.fillStyle = 'rgba(132, 166, 93, 0.24)';
  ctx.fillRect(272, 62, 70, 52);
  ctx.strokeStyle = '#6F924B';
  ctx.lineWidth = 2;
  ctx.strokeRect(272, 62, 70, 52);

  // Small title block bottom-right
  ctx.fillStyle = '#1B3B6F';
  ctx.fillRect(374, 272, 78, 28);
  ctx.fillStyle = '#F5EFE8';
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText('ISB CAD', 385, 291);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createLaptopScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 160);
  grad.addColorStop(0, '#0D1C38');
  grad.addColorStop(1, '#102A3A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 160);

  // Energy performance bars
  const bars = [
    { x: 26, h: 64, color: '#28CF77' },
    { x: 56, h: 88, color: '#38BDF8' },
    { x: 86, h: 74, color: '#84A65D' },
    { x: 116, h: 96, color: '#28CF77' },
  ];
  for (const b of bars) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, 126 - b.h, 18, b.h);
  }

  // Circular gauge
  ctx.strokeStyle = '#28CF77';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(196, 78, 32, -Math.PI * 0.5, Math.PI * 0.95);
  ctx.stroke();

  ctx.fillStyle = '#F5EFE8';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('EC++', 176, 84);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(6, 12, 24, 0.52)');
  grad.addColorStop(0.55, 'rgba(6, 12, 24, 0.24)');
  grad.addColorStop(1, 'rgba(6, 12, 24, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Builds the iconic stepped ISB architectural leaf head silhouette as a 2D THREE.Shape.
 * Scaled cleanly so outer width ~0.88 and outer height ~1.02.
 */
function createIsbHeadShape(inset = 0): THREE.Shape {
  const s = new THREE.Shape();
  const k = 1 - inset;

  const topPeakW = 0.145 * k;
  const topPeakY = 0.53 * k;
  const step1Y = 0.35 * k;
  const midW = 0.305 * k;
  const step2Y = 0.23 * k;
  const cheekW = 0.435 * k;
  const cheekLowY = -0.17 * k;
  const chinY = -0.375 * k;

  // Start at top-center crown
  s.moveTo(0, topPeakY + 0.035 * k);
  // Crown right slope
  s.quadraticCurveTo(topPeakW * 0.95, topPeakY + 0.01 * k, topPeakW, topPeakY - 0.06 * k);
  // First vertical drop to upper step
  s.lineTo(topPeakW, step1Y + 0.02);
  // Step out to mid shoulder
  s.quadraticCurveTo(topPeakW + 0.04, step1Y - 0.015, midW - 0.03, step1Y - 0.055 * k);
  s.quadraticCurveTo(midW, step1Y - 0.08 * k, midW, step2Y);
  // Step out to wide cheek shoulder
  s.quadraticCurveTo(midW + 0.04, step2Y - 0.025, cheekW - 0.03, step2Y - 0.075 * k);
  s.quadraticCurveTo(cheekW, step2Y - 0.11 * k, cheekW, cheekLowY);
  // Lower rounded cheek curving down to chin
  s.quadraticCurveTo(cheekW, chinY + 0.05, 0.14 * k, chinY);
  // Bottom center
  s.quadraticCurveTo(0, chinY - 0.018 * k, -0.14 * k, chinY);
  // Mirror left lower cheek
  s.quadraticCurveTo(-cheekW, chinY + 0.05, -cheekW, cheekLowY);
  s.quadraticCurveTo(-cheekW, step2Y - 0.11 * k, -cheekW + 0.03, step2Y - 0.075 * k);
  s.quadraticCurveTo(-midW - 0.04, step2Y - 0.025, -midW, step2Y);
  s.quadraticCurveTo(-midW, step1Y - 0.08 * k, -midW + 0.03, step1Y - 0.055 * k);
  s.quadraticCurveTo(-topPeakW - 0.04, step1Y - 0.015, -topPeakW, step1Y + 0.02);
  s.lineTo(-topPeakW, topPeakY - 0.06 * k);
  s.quadraticCurveTo(-topPeakW * 0.95, topPeakY + 0.01 * k, 0, topPeakY + 0.035 * k);
  s.closePath();

  return s;
}

/**
 * Builds a complete, tactile, vinyl-collectible 3D ISB Mascot faithful to the branding board.
 */
export function buildIsbMascot(initialVariant: MascotVariant = 'female'): BuiltIsbMascot {
  const disposables: { dispose: () => void }[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    disposables.push(t);
    return t;
  };

  // --- Shared PBR Materials (deliberate roughness contrast: glossy eyes vs satin rubber vs matte vinyl vs fabric) ---
  const matNavyFrame = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.navyFrame,
      roughness: 0.48,
      metalness: 0.06,
    })
  );
  const matNavyDeep = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.navyDeep,
      roughness: 0.54,
      metalness: 0.05,
    })
  );
  const matCreamVinyl = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.cream,
      roughness: 0.44,
      metalness: 0.02,
    })
  );
  const matSageJacket = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.sageGreen,
      roughness: 0.68,
      metalness: 0.02,
    })
  );
  const matSageBow = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.sageLight,
      roughness: 0.5,
      metalness: 0.04,
    })
  );
  const matPants = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.pantsNavy,
      roughness: 0.74,
      metalness: 0.02,
    })
  );
  const matPantsPocket = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.pantsPocket,
      roughness: 0.72,
      metalness: 0.02,
    })
  );
  const matOrangeRubber = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.orangeSneaker,
      roughness: 0.34,
      metalness: 0.04,
    })
  );
  const matEyeGloss = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: COLORS.eyeBlack,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    })
  );
  const matWhiteCatchlight = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const matTongue = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.tongueCoral,
      roughness: 0.42,
      metalness: 0,
    })
  );
  const matLaptopBody = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.laptopTaupe,
      roughness: 0.52,
      metalness: 0.14,
    })
  );
  const matLaptopDark = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.laptopDark,
      roughness: 0.45,
      metalness: 0.25,
    })
  );
  const matTablet = trackMat(
    new THREE.MeshStandardMaterial({
      color: COLORS.tabletBody,
      roughness: 0.38,
      metalness: 0.08,
    })
  );

  // Procedural CanvasTextures
  const chestCrestTex = trackTex(createIsbEmblemTexture('#F5EFE8', 'transparent', false));
  const backLogoTex = trackTex(createIsbEmblemTexture('#F5EFE8', 'transparent', true));
  const tabletLogoTex = trackTex(createIsbEmblemTexture('#1B3B6F', 'transparent', false));
  const blueprintTex = trackTex(createBlueprintTexture());
  const laptopScreenTex = trackTex(createLaptopScreenTexture());
  const shadowTex = trackTex(createContactShadowTexture());

  const matChestDecal = trackMat(
    new THREE.MeshBasicMaterial({ map: chestCrestTex, transparent: true, depthWrite: false })
  );
  const matBackDecal = trackMat(
    new THREE.MeshBasicMaterial({ map: backLogoTex, transparent: true, depthWrite: false })
  );
  const matTabletDecal = trackMat(
    new THREE.MeshBasicMaterial({ map: tabletLogoTex, transparent: true, depthWrite: false })
  );
  const matBlueprint = trackMat(
    new THREE.MeshStandardMaterial({
      map: blueprintTex,
      roughness: 0.82,
      metalness: 0,
      side: THREE.DoubleSide,
    })
  );
  const matLaptopScreen = trackMat(
    new THREE.MeshBasicMaterial({ map: laptopScreenTex })
  );
  const matShadow = trackMat(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    })
  );

  // --- Root Hierarchy ---
  const root = new THREE.Group();
  root.name = 'IsbMascotRoot';

  // Ground contact shadow stays anchored at y = 0.004
  const contactShadow = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.42, 1.05)), matShadow);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.004;
  root.add(contactShadow);

  // Articulated character body group (moves up/down on jump or sit)
  const characterRig = new THREE.Group();
  characterRig.position.y = 0;
  root.add(characterRig);

  // Pelvis / Hip base at y = 0.80
  const pelvis = new THREE.Group();
  pelvis.position.set(0, 0.8, 0);
  characterRig.add(pelvis);

  // Sculpted waist belt + lower pants pelvis block
  const pelvisMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.245, 0.255, 0.16, 20)),
    matPants
  );
  pelvisMesh.scale.set(1.06, 1, 0.82);
  pelvisMesh.position.y = -0.02;
  pelvisMesh.castShadow = true;
  pelvis.add(pelvisMesh);

  const beltMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.258, 0.258, 0.055, 20)),
    matNavyDeep
  );
  beltMesh.scale.set(1.06, 1, 0.84);
  beltMesh.position.y = 0.04;
  pelvis.add(beltMesh);

  // --- Torso (Two-Tone Bomber Jacket: Navy upper + Sage lower + Cream inner shirt) ---
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.07, 0);
  pelvis.add(torsoPivot);

  // Lower sage-green bomber section
  const lowerJacketGeo = trackGeo(new THREE.CylinderGeometry(0.265, 0.248, 0.27, 24));
  const lowerJacket = new THREE.Mesh(lowerJacketGeo, matSageJacket);
  lowerJacket.scale.set(1.06, 1, 0.84);
  lowerJacket.position.y = 0.15;
  lowerJacket.castShadow = true;
  lowerJacket.receiveShadow = true;
  torsoPivot.add(lowerJacket);

  // Elastic sage waist rib cuff
  const waistRib = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.245, 0.032, 10, 24)),
    matSageBow
  );
  waistRib.rotation.x = Math.PI / 2;
  waistRib.scale.set(1.05, 0.84, 1);
  waistRib.position.y = 0.025;
  torsoPivot.add(waistRib);

  // Upper navy jacket yoke
  const upperJacketGeo = trackGeo(new THREE.CylinderGeometry(0.228, 0.272, 0.26, 24));
  const upperJacket = new THREE.Mesh(upperJacketGeo, matNavyFrame);
  upperJacket.scale.set(1.08, 1, 0.85);
  upperJacket.position.y = 0.39;
  upperJacket.castShadow = true;
  upperJacket.receiveShadow = true;
  torsoPivot.add(upperJacket);

  // Rounded shoulder cap bridge
  const shoulderCap = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.24, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52)),
    matNavyFrame
  );
  shoulderCap.scale.set(1.12, 0.56, 0.88);
  shoulderCap.position.y = 0.49;
  torsoPivot.add(shoulderCap);

  // Cream inner tee shirt strip visible down front center
  const innerShirt = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.115, 0.48, 0.08)),
    matCreamVinyl
  );
  innerShirt.position.set(0, 0.28, 0.192);
  torsoPivot.add(innerShirt);

  // Vertical jacket opening trims framing the cream shirt
  for (const side of [-1, 1]) {
    const zipTrim = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.032, 0.47, 0.055)),
      matNavyFrame
    );
    zipTrim.position.set(side * 0.068, 0.275, 0.205);
    torsoPivot.add(zipTrim);

    // Subtle slanted jacket pocket welt on sage lower panels
    const pocketWelt = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.075, 0.022, 0.02)),
      matNavyDeep
    );
    pocketWelt.position.set(side * 0.175, 0.14, 0.195);
    pocketWelt.rotation.z = side * 0.65;
    pocketWelt.rotation.y = side * 0.48;
    torsoPivot.add(pocketWelt);
  }

  // Green bomber collar ring
  const collarRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.155, 0.038, 12, 24)),
    matSageBow
  );
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.set(0, 0.555, 0);
  torsoPivot.add(collarRing);

  // Front left-chest ISB emblem decal (+X side, viewer's right!)
  const chestDecal = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.115, 0.115)), matChestDecal);
  chestDecal.position.set(0.145, 0.375, 0.222);
  chestDecal.rotation.y = 0.34;
  torsoPivot.add(chestDecal);

  // Back "isb GROUP" wordmark decal (matches BACK turnaround on sheet!)
  const backDecal = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.28, 0.14)), matBackDecal);
  backDecal.position.set(0, 0.355, -0.225);
  backDecal.rotation.y = Math.PI;
  torsoPivot.add(backDecal);

  // --- HEAD PIVOT (Iconic Stepped 3D ISB Emblem Head!) ---
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.61, 0);
  torsoPivot.add(headPivot);

  // Short sturdy cream/navy neck cylinder
  const neckMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.088, 0.105, 0.14, 16)),
    matNavyDeep
  );
  neckMesh.position.y = 0.05;
  headPivot.add(neckMesh);

  // Center head geometry slightly above pivot so head tilts naturally around neck
  const headCenter = new THREE.Group();
  headCenter.position.set(0, 0.44, 0);
  headPivot.add(headCenter);

  // 1. Outer Deep-Navy Stepped ISB Frame
  const outerShape = createIsbHeadShape(0);
  const outerHeadGeo = trackGeo(
    new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.085,
      bevelSize: 0.06,
      bevelSegments: 5,
      curveSegments: 16,
    })
  );
  outerHeadGeo.center();
  const outerHeadMesh = new THREE.Mesh(outerHeadGeo, matNavyFrame);
  outerHeadMesh.castShadow = true;
  outerHeadMesh.receiveShadow = true;
  headCenter.add(outerHeadMesh);

  // 2. Inner Warm-Cream Sculpted Face & Back Plate (slightly proud in Z for collectible vinyl depth!)
  const innerShape = createIsbHeadShape(0.185);
  const innerHeadGeo = trackGeo(
    new THREE.ExtrudeGeometry(innerShape, {
      depth: 0.41,
      bevelEnabled: true,
      bevelThickness: 0.075,
      bevelSize: 0.036,
      bevelSegments: 5,
      curveSegments: 16,
    })
  );
  innerHeadGeo.center();
  const innerHeadMesh = new THREE.Mesh(innerHeadGeo, matCreamVinyl);
  innerHeadMesh.position.y = 0.005;
  innerHeadMesh.castShadow = true;
  innerHeadMesh.receiveShadow = true;
  headCenter.add(innerHeadMesh);

  // 3. Signature Bottom-Center Navy Vertical Stem / Chin Tab (short & chunky, ending well below smile!)
  const chinStem = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.078, 0.165, 0.515)),
    matNavyFrame
  );
  chinStem.position.set(0, -0.375, 0.018);
  chinStem.castShadow = true;
  headCenter.add(chinStem);

  // Rounded cap on top of chin stem
  const chinStemCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.039, 0.039, 0.515, 12)),
    matNavyFrame
  );
  chinStemCap.rotation.x = Math.PI / 2;
  chinStemCap.position.set(0, -0.292, 0.018);
  headCenter.add(chinStemCap);

  // 4. Female Variant: 4-Petal Sculpted Sage-Green Bow perched prominently on upper-right step (+X, +Y)
  const bowGroup = new THREE.Group();
  bowGroup.position.set(0.275, 0.345, 0.185);
  bowGroup.rotation.set(0.1, 0.16, -0.52);
  headCenter.add(bowGroup);

  const bowKnot = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.062, 16, 12)), matSageBow);
  bowKnot.scale.set(1, 0.92, 0.88);
  bowGroup.add(bowKnot);

  const petalGeo = trackGeo(new THREE.SphereGeometry(0.096, 16, 12));
  const petalConfigs: [number, number, number, number][] = [
    [-0.092, 0.044, 0, 0.34],
    [0.092, 0.044, 0, -0.34],
    [-0.078, -0.058, -0.01, -0.44],
    [0.078, -0.058, -0.01, 0.44],
  ];
  for (const [px, py, pz, rz] of petalConfigs) {
    const petal = new THREE.Mesh(petalGeo, matSageBow);
    petal.scale.set(1.25, 0.72, 0.58);
    petal.position.set(px, py, pz);
    petal.rotation.z = rz;
    petal.castShadow = true;
    bowGroup.add(petal);
  }

  // --- FACIAL FEATURES (Glossy Oval Eyes, Joy Crescents, Eyelashes, Swappable Mouths) ---
  const faceZ = 0.275;

  // Open glossy eyes group (scales Y for natural blinking)
  const openEyesGroup = new THREE.Group();
  openEyesGroup.position.set(0, -0.005, faceZ);
  headCenter.add(openEyesGroup);

  const eyeGeo = trackGeo(new THREE.SphereGeometry(0.068, 18, 14));
  const catchGeo = trackGeo(new THREE.SphereGeometry(0.017, 10, 8));
  const lashGeo = trackGeo(new THREE.CapsuleGeometry(0.01, 0.036, 4, 8));
  const eyelashesGroup = new THREE.Group();
  openEyesGroup.add(eyelashesGroup);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, matEyeGloss);
    eye.scale.set(0.84, 1.18, 0.52);
    eye.position.set(side * 0.148, 0, 0);
    openEyesGroup.add(eye);

    const catchlight = new THREE.Mesh(catchGeo, matWhiteCatchlight);
    catchlight.position.set(side * 0.148 - 0.02, 0.035, 0.033);
    openEyesGroup.add(catchlight);

    // Cute female outer-top eyelash flick
    const lash = new THREE.Mesh(lashGeo, matEyeGloss);
    lash.position.set(side * 0.212, 0.058, -0.004);
    lash.rotation.z = -side * 0.75;
    eyelashesGroup.add(lash);
  }

  // Joy crescent eyes (`^ ^`)
  const joyEyesGroup = new THREE.Group();
  joyEyesGroup.position.set(0, 0.005, faceZ + 0.008);
  joyEyesGroup.visible = false;
  headCenter.add(joyEyesGroup);

  const crescentGeo = trackGeo(new THREE.TorusGeometry(0.062, 0.017, 10, 18, Math.PI * 0.88));
  for (const side of [-1, 1]) {
    const arc = new THREE.Mesh(crescentGeo, matEyeGloss);
    arc.position.set(side * 0.148, -0.015, 0);
    arc.rotation.z = 0.18;
    joyEyesGroup.add(arc);
  }

  // Mouths (Happy smile, Joy open smile, Surprised O, Thinking gentle grin)
  const mouthAnchor = new THREE.Group();
  mouthAnchor.position.set(0, -0.118, faceZ + 0.006);
  headCenter.add(mouthAnchor);

  // Happy D-smile + tiny coral tongue
  const mouthHappy = new THREE.Group();
  const smileShape = new THREE.Shape();
  smileShape.moveTo(-0.072, 0.012);
  smileShape.quadraticCurveTo(0, -0.01, 0.072, 0.012);
  smileShape.quadraticCurveTo(0.062, -0.062, 0, -0.065);
  smileShape.quadraticCurveTo(-0.062, -0.062, -0.072, 0.012);
  const smileGeo = trackGeo(
    new THREE.ExtrudeGeometry(smileShape, { depth: 0.018, bevelEnabled: false })
  );
  const smileMesh = new THREE.Mesh(smileGeo, matEyeGloss);
  mouthHappy.add(smileMesh);

  const tongueMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.032, 12, 10)), matTongue);
  tongueMesh.scale.set(1.25, 0.65, 0.4);
  tongueMesh.position.set(0, -0.036, 0.015);
  mouthHappy.add(tongueMesh);
  mouthAnchor.add(mouthHappy);

  // Surprised 'o' mouth
  const mouthSurprised = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.042, 16, 12)),
    matEyeGloss
  );
  mouthSurprised.scale.set(0.86, 1.12, 0.4);
  mouthSurprised.position.set(0, -0.015, 0.006);
  mouthSurprised.visible = false;
  mouthAnchor.add(mouthSurprised);

  // Thinking subtle smile curve
  const mouthThinking = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.048, 0.012, 8, 16, Math.PI * 0.72)),
    matEyeGloss
  );
  mouthThinking.rotation.z = Math.PI + 0.44;
  mouthThinking.position.set(0.006, 0.012, 0.008);
  mouthThinking.visible = false;
  mouthAnchor.add(mouthThinking);

  // --- FLOATING 3D EXPRESSION PROPS (`!`, `?`, Joy Ticks) ---
  const floatingPropGroup = new THREE.Group();
  floatingPropGroup.position.set(0.56, 0.24, 0.06);
  headCenter.add(floatingPropGroup);

  // 1. 3D Sage-Green Exclamation Mark (`!`)
  const propExclamation = new THREE.Group();
  propExclamation.visible = false;
  const exBar = new THREE.Mesh(
    trackGeo(new THREE.CapsuleGeometry(0.032, 0.16, 6, 12)),
    matSageBow
  );
  exBar.position.y = 0.09;
  exBar.rotation.z = -0.14;
  const exDot = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.036, 12, 10)), matSageBow);
  exDot.position.set(-0.02, -0.075, 0);
  propExclamation.add(exBar, exDot);
  floatingPropGroup.add(propExclamation);

  // 2. 3D Sage-Green Question Mark (`?`)
  const propQuestion = new THREE.Group();
  propQuestion.visible = false;
  const qHook = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.072, 0.028, 10, 18, Math.PI * 1.45)),
    matSageBow
  );
  qHook.position.set(0, 0.11, 0);
  qHook.rotation.z = -Math.PI * 0.22;
  const qStem = new THREE.Mesh(
    trackGeo(new THREE.CapsuleGeometry(0.026, 0.06, 6, 10)),
    matSageBow
  );
  qStem.position.set(0, 0.015, 0);
  const qDot = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.033, 12, 10)), matSageBow);
  qDot.position.set(0, -0.075, 0);
  propQuestion.add(qHook, qStem, qDot);
  floatingPropGroup.add(propQuestion);

  // 3. 3D Joy Celebration Ticks (`\` `/`)
  const propJoyTicks = new THREE.Group();
  propJoyTicks.visible = false;
  const tick1 = new THREE.Mesh(
    trackGeo(new THREE.CapsuleGeometry(0.024, 0.095, 6, 10)),
    matSageBow
  );
  tick1.position.set(0.02, 0.08, 0);
  tick1.rotation.z = -0.78;
  const tick2 = new THREE.Mesh(
    trackGeo(new THREE.CapsuleGeometry(0.022, 0.075, 6, 10)),
    matSageBow
  );
  tick2.position.set(0.06, -0.04, 0);
  tick2.rotation.z = -1.32;
  propJoyTicks.add(tick1, tick2);
  floatingPropGroup.add(propJoyTicks);

  // --- ARTICULATED ARMS (Navy Upper Sleeve + Sage Forearm + Navy Cuff + Cream Stylized Hand) ---
  function buildArm(side: -1 | 1) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.305, 0.44, 0);
    torsoPivot.add(shoulder);

    // Rounded navy shoulder ball
    const shoulderCapBall = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.095, 16, 12)),
      matNavyFrame
    );
    shoulderCapBall.castShadow = true;
    shoulder.add(shoulderCapBall);

    // Upper sleeve (navy)
    const upperArm = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.078, 0.16, 6, 14)),
      matNavyFrame
    );
    upperArm.position.y = -0.11;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    // Elbow pivot
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.22, 0);
    shoulder.add(elbow);

    // Forearm sleeve (sage green matching bomber jacket sleeves!)
    const forearm = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.074, 0.15, 6, 14)),
      matSageJacket
    );
    forearm.position.y = -0.095;
    forearm.castShadow = true;
    elbow.add(forearm);

    // Navy wrist cuff
    const cuff = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.076, 0.066, 0.055, 16)),
      matNavyDeep
    );
    cuff.position.y = -0.195;
    elbow.add(cuff);

    // Stylized plump cream hand
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.27, 0);
    elbow.add(handGroup);

    const palm = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.078, 16, 12)),
      matCreamVinyl
    );
    palm.scale.set(0.95, 1.05, 0.78);
    palm.castShadow = true;
    handGroup.add(palm);

    // Articulated thumb (rotates upright for Thumbs Up!)
    const thumb = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.028, 0.058, 5, 10)),
      matCreamVinyl
    );
    thumb.position.set(-side * 0.058, 0.015, 0.032);
    thumb.rotation.z = side * 0.65;
    handGroup.add(thumb);

    // Index finger stub (extends cleanly for Eureka Point pose!)
    const pointerFinger = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.023, 0.072, 5, 10)),
      matCreamVinyl
    );
    pointerFinger.position.set(0, -0.088, 0.01);
    pointerFinger.visible = false;
    handGroup.add(pointerFinger);

    return { shoulder, elbow, handGroup, thumb, pointerFinger };
  }

  const leftArm = buildArm(1); // +X (character's left, viewer's right)
  const rightArm = buildArm(-1); // -X (character's right, viewer's left)

  // --- ARTICULATED LEGS (Cargo Trousers + Chunky Navy/Cream/Orange Designer Sneakers) ---
  function buildLeg(side: -1 | 1) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.165, -0.05, 0);
    pelvis.add(hip);

    // Upper thigh
    const thigh = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.118, 0.106, 0.34, 18)),
      matPants
    );
    thigh.position.y = -0.17;
    thigh.castShadow = true;
    hip.add(thigh);

    // Signature outer-thigh 3D Cargo Pocket + flap
    const pocket = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.055, 0.14, 0.125)),
      matPantsPocket
    );
    pocket.position.set(side * 0.102, -0.18, 0.01);
    pocket.rotation.z = side * 0.06;
    hip.add(pocket);

    const pocketFlap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.062, 0.036, 0.13)),
      matNavyDeep
    );
    pocketFlap.position.set(side * 0.105, -0.115, 0.01);
    hip.add(pocketFlap);

    // Knee pivot
    const knee = new THREE.Group();
    knee.position.set(0, -0.34, 0);
    hip.add(knee);

    // Lower cargo trouser leg
    const shin = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.104, 0.095, 0.27, 18)),
      matPants
    );
    shin.position.y = -0.135;
    shin.castShadow = true;
    knee.add(shin);

    // Trouser cuff roll
    const pantCuff = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.094, 0.022, 10, 18)),
      matNavyDeep
    );
    pantCuff.rotation.x = Math.PI / 2;
    pantCuff.position.y = -0.255;
    knee.add(pantCuff);

    // --- CHUNKY SIGNATURE SNEAKER (Grounded cleanly at local y = -0.41 => world y = 0.00!) ---
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.345, 0.055);
    knee.add(shoeGroup);

    // 1. Vibrant Orange Thick Rubber Outsole (chunky iconic silhouette from branding board!)
    const outsole = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.23, 0.056, 0.395)),
      matOrangeRubber
    );
    outsole.position.set(0, -0.037, 0.015);
    outsole.castShadow = true;
    outsole.receiveShadow = true;
    shoeGroup.add(outsole);

    // Rounded orange front bumper wrapping slightly upward at toe
    const orangeToeBumper = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.114, 0.116, 0.06, 16)),
      matOrangeRubber
    );
    orangeToeBumper.position.set(0, -0.035, 0.172);
    shoeGroup.add(orangeToeBumper);

    // 2. Thick Cream Midsole Platform
    const midsole = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.214, 0.048, 0.355)),
      matCreamVinyl
    );
    midsole.position.set(0, 0.012, 0.01);
    midsole.castShadow = true;
    shoeGroup.add(midsole);

    // 3. Cream Rounded Toe Cap (iconic front sneaker look)
    const creamToe = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.108, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)),
      matCreamVinyl
    );
    creamToe.scale.set(1.0, 0.84, 1.2);
    creamToe.position.set(0, 0.024, 0.14);
    creamToe.castShadow = true;
    shoeGroup.add(creamToe);

    // 4. Deep Navy Sneaker Upper & Heel Counter
    const sneakerUpper = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.192, 0.11, 0.235)),
      matNavyFrame
    );
    sneakerUpper.position.set(0, 0.068, -0.032);
    sneakerUpper.castShadow = true;
    shoeGroup.add(sneakerUpper);

    // Padded sneaker tongue
    const tongue = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.058, 0.05, 6, 12)),
      matNavyFrame
    );
    tongue.position.set(0, 0.115, 0.048);
    tongue.rotation.x = 0.35;
    shoeGroup.add(tongue);

    // 5. Chunky Vibrant Orange Shoelaces (2 cross bars + playful bow knot!)
    for (let i = 0; i < 2; i++) {
      const lace = new THREE.Mesh(
        trackGeo(new THREE.CapsuleGeometry(0.017, 0.115, 5, 10)),
        matOrangeRubber
      );
      lace.rotation.z = Math.PI / 2;
      lace.position.set(0, 0.088 + i * 0.028, 0.092 - i * 0.032);
      shoeGroup.add(lace);
    }
    const laceKnot = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.024, 10, 8)),
      matOrangeRubber
    );
    laceKnot.position.set(0, 0.132, 0.055);
    shoeGroup.add(laceKnot);

    // 6. Vibrant Orange Side Emblem Accent on outer sneaker side
    const sideAccent = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.02, 0.055, 0.115)),
      matOrangeRubber
    );
    sideAccent.position.set(side * 0.095, 0.05, -0.03);
    sideAccent.rotation.x = -0.15;
    shoeGroup.add(sideAccent);

    return { hip, knee, shoeGroup };
  }

  const leftLeg = buildLeg(1);
  const rightLeg = buildLeg(-1);

  // --- SIGNATURE 3D PROPS (Tablet, Blueprint Sheet, ISB Laptop, Navy Briefcase) ---

  // 1. Cream ISB Tablet (tucked naturally against right side / hip during `wave-tablet`)
  const propTablet = new THREE.Group();
  const tabletBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.35, 0.036)),
    matTablet
  );
  tabletBody.castShadow = true;
  propTablet.add(tabletBody);
  const tabletLogoFront = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.16, 0.16)),
    matTabletDecal
  );
  tabletLogoFront.position.z = 0.02;
  propTablet.add(tabletLogoFront);
  const tabletLogoBack = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.16, 0.16)),
    matTabletDecal
  );
  tabletLogoBack.position.z = -0.02;
  tabletLogoBack.rotation.y = Math.PI;
  propTablet.add(tabletLogoBack);
  propTablet.position.set(-0.24, 0.13, 0.24);
  propTablet.rotation.set(0.08, -0.45, -0.26);
  torsoPivot.add(propTablet);

  // 2. Unfolded Architectural Blueprint Sheet (curved trifold geometry in front of torso)
  const propBlueprint = new THREE.Group();
  const bpGeo = trackGeo(new THREE.PlaneGeometry(0.76, 0.48, 18, 4));
  const posAttr = bpGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    // Gentle trifold architectural paper wave
    const zCurve = Math.cos(x * 4.4) * 0.048 - Math.abs(x) * 0.14;
    posAttr.setZ(i, zCurve);
  }
  bpGeo.computeVertexNormals();
  const bpMesh = new THREE.Mesh(bpGeo, matBlueprint);
  bpMesh.castShadow = true;
  propBlueprint.add(bpMesh);
  propBlueprint.position.set(0, 0.24, 0.44);
  propBlueprint.rotation.x = -0.3;
  propBlueprint.visible = false;
  torsoPivot.add(propBlueprint);

  // 3. 3D Architectural Laptop with White ISB Emblem on Outer Lid (during `laptop-sit`)
  const propLaptop = new THREE.Group();
  // Base keyboard deck
  const laptopBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.56, 0.028, 0.34)),
    matLaptopBody
  );
  laptopBase.castShadow = true;
  propLaptop.add(laptopBase);
  const keyboardDeck = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.48, 0.012, 0.2)),
    matLaptopDark
  );
  keyboardDeck.position.set(0, 0.015, -0.01);
  propLaptop.add(keyboardDeck);

  // Open screen lid tilted slightly open toward character, showing outer metallic lid + ISB emblem to viewer!
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.014, 0.165);
  lidPivot.rotation.x = -0.2;
  propLaptop.add(lidPivot);

  const laptopLid = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.56, 0.36, 0.026)),
    matLaptopBody
  );
  laptopLid.position.set(0, 0.18, 0);
  laptopLid.castShadow = true;
  lidPivot.add(laptopLid);

  const lidScreen = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.5, 0.3)),
    matLaptopScreen
  );
  lidScreen.position.set(0, 0.18, -0.015);
  lidScreen.rotation.y = Math.PI;
  lidPivot.add(lidScreen);

  const lidLogo = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.145, 0.145)),
    matChestDecal
  );
  lidLogo.position.set(0, 0.185, 0.016);
  lidPivot.add(lidLogo);

  propLaptop.position.set(0, -0.04, 0.39);
  propLaptop.visible = false;
  pelvis.add(propLaptop);

  // 4. Navy ISB Satchel / Briefcase (carried on right side during `walk-briefcase`)
  const propBriefcase = new THREE.Group();
  const bagBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.11, 0.28, 0.34)),
    matNavyFrame
  );
  bagBody.castShadow = true;
  propBriefcase.add(bagBody);
  const bagFlap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.125, 0.13, 0.345)),
    matNavyDeep
  );
  bagFlap.position.set(0, 0.075, 0);
  propBriefcase.add(bagFlap);
  const bagLogo = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.14, 0.14)),
    matChestDecal
  );
  bagLogo.position.set(-0.06, -0.02, 0);
  bagLogo.rotation.y = -Math.PI / 2;
  propBriefcase.add(bagLogo);
  const bagStrap = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.24, 0.02, 8, 20, Math.PI)),
    matNavyDeep
  );
  bagStrap.position.set(0.06, 0.14, 0);
  bagStrap.rotation.y = Math.PI / 2;
  propBriefcase.add(bagStrap);
  propBriefcase.position.set(-0.32, 0.04, 0.03);
  propBriefcase.rotation.z = -0.14;
  propBriefcase.visible = false;
  torsoPivot.add(propBriefcase);

  // --- Variant Setter (Female with Green Bow & Eyelashes vs Male Classic Hero) ---
  function setVariant(variant: MascotVariant) {
    const isFemale = variant === 'female';
    bowGroup.visible = isFemale;
    eyelashesGroup.visible = isFemale;
  }
  setVariant(initialVariant);

  // --- Smoothly Apply Kinematic Frame with Exponential Damping ---
  function dampEuler(euler: THREE.Euler, target: { x: number; y: number; z: number }, lambda: number, dt: number) {
    euler.x = THREE.MathUtils.damp(euler.x, target.x, lambda, dt);
    euler.y = THREE.MathUtils.damp(euler.y, target.y, lambda, dt);
    euler.z = THREE.MathUtils.damp(euler.z, target.z, lambda, dt);
  }

  let initialized = false;

  function applyExpression(expr: MascotExpression, blinkScaleY: number) {
    const isJoy = expr === 'joy';
    openEyesGroup.visible = !isJoy;
    joyEyesGroup.visible = isJoy;
    if (!isJoy) {
      openEyesGroup.scale.y = blinkScaleY;
    }

    mouthHappy.visible = expr === 'happy' || expr === 'joy';
    mouthHappy.scale.set(isJoy ? 1.18 : 1, isJoy ? 1.24 : 1, 1);
    mouthSurprised.visible = expr === 'surprised';
    mouthThinking.visible = expr === 'thinking';
  }

  function applyFrame(frame: MascotRigFrame, dt: number) {
    const lambda = initialized ? 15.5 : 1000;
    const step = initialized ? Math.min(dt, 0.12) : 1;
    initialized = true;

    characterRig.position.y = THREE.MathUtils.damp(characterRig.position.y, frame.rootY, lambda, step);
    characterRig.rotation.y = THREE.MathUtils.damp(characterRig.rotation.y, frame.rootRotY, lambda, step);

    // Keep shadow softly scaled to character elevation
    const shadowScale = THREE.MathUtils.clamp(1 - Math.max(0, frame.rootY) * 0.45, 0.72, 1.15);
    contactShadow.scale.set(shadowScale, shadowScale, 1);

    dampEuler(torsoPivot.rotation, frame.torsoRot, lambda, step);
    dampEuler(headPivot.rotation, frame.headRot, lambda, step);

    dampEuler(leftArm.shoulder.rotation, frame.leftShoulderRot, lambda, step);
    dampEuler(leftArm.elbow.rotation, frame.leftElbowRot, lambda, step);
    dampEuler(rightArm.shoulder.rotation, frame.rightShoulderRot, lambda, step);
    dampEuler(rightArm.elbow.rotation, frame.rightElbowRot, lambda, step);

    dampEuler(leftLeg.hip.rotation, frame.leftHipRot, lambda, step);
    dampEuler(leftLeg.knee.rotation, frame.leftKneeRot, lambda, step);
    dampEuler(rightLeg.hip.rotation, frame.rightHipRot, lambda, step);
    dampEuler(rightLeg.knee.rotation, frame.rightKneeRot, lambda, step);

    // Hand gesture details (thumbs-up & pointing)
    const rThumbTargetY = frame.rightThumbUp ? 0.075 : 0.015;
    const rThumbTargetRotZ = frame.rightThumbUp ? 0.06 : -0.65;
    rightArm.thumb.position.y = THREE.MathUtils.damp(rightArm.thumb.position.y, rThumbTargetY, 14, step);
    rightArm.thumb.rotation.z = THREE.MathUtils.damp(rightArm.thumb.rotation.z, rThumbTargetRotZ, 14, step);

    const lThumbTargetY = frame.leftThumbUp ? 0.075 : 0.015;
    const lThumbTargetRotZ = frame.leftThumbUp ? -0.06 : 0.65;
    leftArm.thumb.position.y = THREE.MathUtils.damp(leftArm.thumb.position.y, lThumbTargetY, 14, step);
    leftArm.thumb.rotation.z = THREE.MathUtils.damp(leftArm.thumb.rotation.z, lThumbTargetRotZ, 14, step);

    leftArm.pointerFinger.visible = frame.leftPointing;
    rightArm.pointerFinger.visible = frame.rightPointing;

    // Bow subtle life
    bowGroup.rotation.z = -0.58 + frame.bowWag;

    // Expression meshes
    applyExpression(frame.expression, frame.blinkScaleY);

    // 3D Props visibility & lively floating motion
    propTablet.visible = frame.props.tablet;
    propBlueprint.visible = frame.props.blueprint;
    propLaptop.visible = frame.props.laptop;
    propBriefcase.visible = frame.props.briefcase;

    propExclamation.visible = frame.props.exclamation;
    propQuestion.visible = frame.props.question;
    propJoyTicks.visible = frame.props.joyTicks;

    floatingPropGroup.position.y = 0.24 + frame.propFloatY;
    floatingPropGroup.scale.setScalar(frame.propScale);
  }

  function dispose() {
    for (const item of disposables) {
      item.dispose();
    }
  }

  return {
    root,
    setVariant,
    applyFrame,
    dispose,
  };
}
