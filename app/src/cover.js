// Tideline Cover Press — cover engine for "VELVET TIDE".
// Draws the multi-panel GTA-style poster on any 2D canvas: one hard sunset
// grade across every panel, a full-bleed mosaic, chrome-banded title below
// the hero's chin, and the film furniture (press strip, seal, 18+, billing,
// barcode). Pure canvas, no network, no dependencies.

export const CAST = [
  { id: 'driver', label: 'THE DRIVER', src: 'samples/driver.jpg', zoom: 3.3, cx: 0.565, cy: 0.3 },
  { id: 'boss', label: 'THE BOSS', src: 'samples/boss.jpg', zoom: 1.1, cx: 0.5, cy: 0.4 },
  { id: 'friends', label: 'THE WILDCARDS', src: 'samples/friends.jpg', zoom: 1.15, cx: 0.515, cy: 0.36 },
  { id: 'courier', label: 'THE COURIER', src: 'samples/courier.jpg', zoom: 3.1, cx: 0.4, cy: 0.33 },
  { id: 'rider', label: 'THE RIDER', src: 'samples/rider.jpg', zoom: 1.83, cx: 0.5, cy: 0.4 },
  { id: 'lookout', label: 'THE LOOKOUT', src: 'samples/lookout.jpg', zoom: 3.9, cx: 0.4, cy: 0.25 },
];

export const GRADES = {
  sunset: { filter: 'saturate(1.5) contrast(1.2) brightness(1.06) sepia(0.22)', wash: 0.16 },
  golden: { filter: 'saturate(1.35) contrast(1.12) brightness(1.08) sepia(0.15)', wash: 0.12 },
  neon: { filter: 'saturate(1.6) contrast(1.15) brightness(0.98) hue-rotate(-12deg)', wash: 0.14 },
};

export const DEFAULT_TEXT = {
  title: 'VELVET TIDE',
  script: 'salt on the wind',
  tagline: 'SEVEN STRANGERS · ONE BURNING COAST · EVERY DEBT COMES DUE',
  quote: 'EVERY FRAME DRIPS WITH SUNLIGHT AND SIN',
  gazette: 'The Coral Bay Chronicle',
  vol: 'VOL. 7',
  billing: 'A TIDELINE PICTURES PRODUCTION',
  starring: 'STARRING MARINA SOL · SILAS MARLOWE · DANTE REYES · ROXY VANE · COLE BRANNON · ELIAS COVE',
  fine: 'PRODUCED BY TIDELINE PRESS · SHOT ON LEONIDA · GRADED BY HAND',
};

const GOLD = '#ffc95e';
const INK = '#160409';

// Vertical band layout for the cover, as fractions of height. Three aspect
// presets so the same engine serves 1920x1080, 1080x1080 and 1080x1350.
function bandsFor(w, h) {
  const a = w / h;
  if (a >= 1.5) {
    return { press: 0.043, mosaicBot: 0.463, friendsBot: 0.222, stripesBot: 0.519,
      titleBase: 0.63, titleSize: 0.172, scriptBase: 0.735, scriptSize: 0.058,
      tagBase: 0.795, tagSize: 0.03, furnTop: 0.83 };
  }
  if (a >= 0.9) {
    return { press: 0.04, mosaicBot: 0.42, friendsBot: 0.225, stripesBot: 0.465,
      titleBase: 0.575, titleSize: 0.148, scriptBase: 0.64, scriptSize: 0.052,
      tagBase: 0.685, tagSize: 0.027, furnTop: 0.72 };
  }
  return { press: 0.034, mosaicBot: 0.38, friendsBot: 0.2, stripesBot: 0.42,
    titleBase: 0.52, titleSize: 0.126, scriptBase: 0.585, scriptSize: 0.046,
    tagBase: 0.63, tagSize: 0.024, furnTop: 0.68 };
}

function panelRects(w, h, b) {
  const top = b.press * h;
  const bot = b.mosaicBot * h;
  const mid = b.friendsBot * h;
  return {
    driver: [0, top, 0.208 * w, bot],
    boss: [0.208 * w, top, 0.615 * w, bot],
    friends: [0.615 * w, top, w, mid],
    courier: [0.615 * w, mid, 0.745 * w, bot],
    rider: [0.745 * w, mid, 0.875 * w, bot],
    lookout: [0.875 * w, mid, w, bot],
  };
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
}

export async function loadCast() {
  const out = {};
  for (const slot of CAST) out[slot.id] = await loadImage(slot.src);
  return out;
}

// Cover-crop: show a window of the source (zoom = sourceWidth / windowWidth)
// centred on (cx, cy), fitted exactly into rect [x0, y0, x1, y1].
function drawPanelImage(ctx, img, rect, crop, grade) {
  const [x0, y0, x1, y1] = rect;
  const rw = x1 - x0;
  const rh = y1 - y0;
  const winW = img.naturalWidth / crop.zoom;
  const winH = (winW * rh) / rw;
  let sx = crop.cx * img.naturalWidth - winW / 2;
  let sy = crop.cy * img.naturalHeight - winH / 2;
  sx = Math.max(0, Math.min(img.naturalWidth - winW, sx));
  sy = Math.max(0, Math.min(img.naturalHeight - winH, sy));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, rw, rh);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, sx, sy, winW, winH, x0, y0, rw, rh);
  ctx.filter = 'none';
  // Warm overlay wash: the same sunset pushed over every panel.
  const g = ctx.createLinearGradient(x0, y0, x0, y1);
  g.addColorStop(0, 'rgba(255,120,30,0.20)');
  g.addColorStop(0.55, 'rgba(255,80,40,0.10)');
  g.addColorStop(1, 'rgba(255,70,40,0.16)');
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, rw, rh);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function labelChip(ctx, x, y, text, h, alignRight) {
  ctx.save();
  ctx.font = `${Math.round(h * 0.62)}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = h * 0.45;
  const bw = tw + pad * 2 + h * 0.35;
  const bx = alignRight ? x - bw : x;
  ctx.fillStyle = 'rgba(12,2,6,0.82)';
  ctx.fillRect(bx, y, bw, h);
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx, y, h * 0.22, h);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + pad + h * 0.3, y + h / 2 + h * 0.03);
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawPressStrip(ctx, w, h, b, t) {
  const ph = b.press * h;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#2b0a12');
  g.addColorStop(0.5, '#1c0508');
  g.addColorStop(1, '#2b0a12');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, ph);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, ph - Math.max(1.5, h * 0.002), w, Math.max(1.5, h * 0.002));
  const cy = ph / 2;
  const starR = ph * 0.26;
  for (let i = 0; i < 5; i++) drawStar(ctx, w * 0.02 + i * starR * 2.4, cy, starR, GOLD);
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(ph * 0.42)}px Anton, sans-serif`;
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText('“' + t.quote + '”', w * 0.115, cy + ph * 0.02);
  const gw = ctx.measureText('“' + t.quote + '”').width;
  ctx.font = `italic ${Math.round(ph * 0.4)}px Georgia, serif`;
  ctx.fillStyle = '#ffb08a';
  ctx.fillText('— ' + t.gazette, w * 0.115 + gw + w * 0.012, cy + ph * 0.02);
  // Right: HEAT meter + volume chip.
  ctx.font = `${Math.round(ph * 0.4)}px Anton, sans-serif`;
  ctx.fillStyle = GOLD;
  const heat = 'HEAT ★★★★★';
  const hw = ctx.measureText(heat).width;
  ctx.fillText(heat, w * 0.985 - hw - w * 0.075, cy + ph * 0.02);
  ctx.fillStyle = GOLD;
  ctx.fillRect(w * 0.985 - w * 0.062, ph * 0.18, w * 0.055, ph * 0.64);
  ctx.fillStyle = INK;
  ctx.font = `${Math.round(ph * 0.42)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(t.vol, w * 0.985 - w * 0.0345, cy + ph * 0.03);
  ctx.textAlign = 'left';
}

function drawStripes(ctx, w, h, b) {
  const y0 = b.mosaicBot * h;
  const y1 = b.stripesBot * h;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#ff9a2a');
  g.addColorStop(0.35, '#ff5e3a');
  g.addColorStop(0.7, '#ff2e88');
  g.addColorStop(1, '#b02a6e');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, w, y1 - y0);
  ctx.fillStyle = 'rgba(255,220,120,0.35)';
  ctx.fillRect(0, y0 + (y1 - y0) * 0.18, w, (y1 - y0) * 0.1);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, y0 + (y1 - y0) * 0.55, w, (y1 - y0) * 0.08);
}

function drawChromeTitle(ctx, w, h, b, title) {
  const size = b.titleSize * h;
  ctx.save();
  ctx.font = `${Math.round(size)}px Anton, sans-serif`;
  // Shrink only if the title would overflow the frame.
  const maxW = w * 0.78;
  const tw = ctx.measureText(title).width;
  const scale = tw > maxW ? maxW / tw : 1;
  const cx = w / 2;
  const base = b.titleBase * h;
  ctx.translate(cx, base);
  ctx.scale(scale, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Drop shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(title, size * 0.02, size * 0.06);
  // Thick black outline.
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.09;
  ctx.strokeStyle = '#12030a';
  ctx.strokeText(title, 0, 0);
  // Chrome gradient fill.
  const grad = ctx.createLinearGradient(0, -size * 0.72, 0, size * 0.12);
  grad.addColorStop(0, '#fff3b0');
  grad.addColorStop(0.28, '#ffd76a');
  grad.addColorStop(0.52, '#ff7a2a');
  grad.addColorStop(0.78, '#ff2e88');
  grad.addColorStop(1, '#c22ad8');
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  // Sunset bands clipped inside the letters.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(-w, -size * 0.55, w * 2, size * 0.1);
  ctx.fillStyle = 'rgba(255,46,136,0.30)';
  ctx.fillRect(-w, -size * 0.18, w * 2, size * 0.16);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(-w, size * 0.02, w * 2, size * 0.08);
  ctx.restore();
  // Thin gold inner stroke for definition.
  ctx.lineWidth = size * 0.012;
  ctx.strokeStyle = 'rgba(255,220,120,0.85)';
  ctx.strokeText(title, 0, 0);
  ctx.restore();
}

function drawSeal(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  // Scalloped gold burst.
  ctx.beginPath();
  for (let i = 0; i < 48; i++) {
    const ang = (Math.PI * 2 * i) / 48;
    const rad = i % 2 === 0 ? r : r * 0.88;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
  g.addColorStop(0, '#ffe9a0');
  g.addColorStop(0.7, '#f5b73c');
  g.addColorStop(1, '#c07f14');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.fillStyle = '#a86e0e';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = '#f7c948';
  ctx.fill();
  ctx.fillStyle = '#5c3a00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(r * 0.24)}px Anton, sans-serif`;
  ctx.fillText('ORIGINAL', 0, -r * 0.18);
  ctx.fillText('COVER ART', 0, r * 0.14);
  drawStar(ctx, 0, r * 0.42, r * 0.09, '#5c3a00');
  ctx.restore();
}

function drawBarcode(ctx, x, y, bw, bh, withNumber = true) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, bw, bh);
  const widths = [3, 1, 2, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2];
  let px = x + bw * 0.06;
  ctx.fillStyle = '#111';
  for (const u of widths) {
    const wdt = u * bw * 0.008;
    ctx.fillRect(px, y + bh * 0.06, wdt, bh * 0.68);
    px += wdt + bw * 0.012;
    if (px > x + bw * 0.94) break;
  }
  ctx.fillStyle = '#111';
  if (withNumber) {
    ctx.font = `${Math.round(bh * 0.13)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('0 19872 06501 3', x + bw / 2, y + bh * 0.92);
  }
  ctx.restore();
}

function drawFurniture(ctx, w, h, b, t) {
  const top = b.furnTop * h;
  // Warm dark floor, never purple dead space.
  const g = ctx.createLinearGradient(0, top, 0, h);
  g.addColorStop(0, '#3a0d16');
  g.addColorStop(1, '#180409');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, w, h - top);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, top, w, Math.max(1.5, h * 0.002));
  const zoneH = h - top;
  if (w < h * 1.5) {
    // Square / portrait: stack the furniture so nothing collides — the
    // 18+ box and COMING SOON share the top row with the seal, the billing
    // block sits centred below them, barcode at the seal's right.
    const boxW = w * 0.085;
    const boxH = zoneH * 0.42;
    const bx = w * 0.03;
    const by = top + zoneH * 0.06;
    ctx.fillStyle = '#f5f0e6';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(Math.min(boxH * 0.13, boxW * 0.115))}px Anton, sans-serif`;
    ctx.fillText('LEONIDA', bx + boxW / 2, by + boxH * 0.16);
    ctx.font = `${Math.round(Math.min(boxH * 0.42, boxW * 0.52))}px Anton, sans-serif`;
    ctx.fillText('18+', bx + boxW / 2, by + boxH * 0.56);
    ctx.font = `${Math.round(Math.min(boxH * 0.1, boxW * 0.09))}px Arial, sans-serif`;
    ctx.fillText('ADULTS ONLY', bx + boxW / 2, by + boxH * 0.86);
    ctx.textAlign = 'left';
    ctx.fillStyle = GOLD;
    ctx.font = `${Math.round(Math.min(h * 0.026, w * 0.02))}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(w * 0.004)}px`; } catch { /* older canvas */ }
    ctx.fillText('COMING SOON', bx + boxW + w * 0.02, by + boxH * 0.62);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    const sealR = Math.min(zoneH * 0.3, w * 0.055);
    drawSeal(ctx, w * 0.8, top + zoneH * 0.27, sealR);
    drawBarcode(ctx, w * 0.885, top + zoneH * 0.08, w * 0.085, zoneH * 0.38, false);
    const cy = top + zoneH * 0.72;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9b0';
    ctx.font = `${Math.round(Math.min(h * 0.02, w * 0.016))}px Anton, sans-serif`;
    ctx.fillText(t.billing, w / 2, cy - h * 0.032);
    ctx.fillStyle = '#f5f0e6';
    ctx.font = `${Math.round(Math.min(h * 0.0145, w * 0.0115))}px Arial, sans-serif`;
    ctx.fillText(t.starring, w / 2, cy + h * 0.002);
    ctx.fillStyle = '#c9a37e';
    ctx.font = `${Math.round(Math.min(h * 0.011, w * 0.009))}px Arial, sans-serif`;
    ctx.fillText(t.fine, w / 2, cy + h * 0.032);
    ctx.textAlign = 'left';
    return;
  }
  const cy = top + zoneH * 0.52;
  // Left: 18+ box + COMING SOON.
  const boxW = w * 0.062;
  const boxH = zoneH * 0.62;
  const bx = w * 0.018;
  const by = top + zoneH * 0.14;
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(boxH * 0.13)}px Anton, sans-serif`;
  ctx.fillText('LEONIDA', bx + boxW / 2, by + boxH * 0.16);
  ctx.font = `${Math.round(boxH * 0.42)}px Anton, sans-serif`;
  ctx.fillText('18+', bx + boxW / 2, by + boxH * 0.56);
  ctx.font = `${Math.round(boxH * 0.1)}px Arial, sans-serif`;
  ctx.fillText('ADULTS ONLY', bx + boxW / 2, by + boxH * 0.86);
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = `${Math.round(h * 0.026)}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(w * 0.004)}px`; } catch { /* older canvas */ }
  ctx.fillText('COMING SOON', bx + boxW + w * 0.02, by + boxH * 0.95);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  // Centre: billing block.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9b0';
  ctx.font = `${Math.round(h * 0.02)}px Anton, sans-serif`;
  ctx.fillText(t.billing, w / 2, cy - h * 0.032);
  ctx.fillStyle = '#f5f0e6';
  ctx.font = `${Math.round(h * 0.0145)}px Arial, sans-serif`;
  ctx.fillText(t.starring, w / 2, cy + h * 0.002);
  ctx.fillStyle = '#c9a37e';
  ctx.font = `${Math.round(h * 0.011)}px Arial, sans-serif`;
  ctx.fillText(t.fine, w / 2, cy + h * 0.032);
  ctx.textAlign = 'left';
  // Right: seal + barcode + platform pill.
  drawSeal(ctx, w * 0.865, top + zoneH * 0.48, zoneH * 0.42);
  drawBarcode(ctx, w * 0.912, top + zoneH * 0.2, w * 0.068, zoneH * 0.62);
}

let noiseCanvas = null;
function grain(ctx, w, h) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 160;
    noiseCanvas.height = 160;
    const nctx = noiseCanvas.getContext('2d');
    const data = nctx.createImageData(160, 160);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 90);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 28;
    }
    nctx.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ctx.createPattern(noiseCanvas, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(20,0,5,0)');
  g.addColorStop(1, 'rgba(20,0,5,0.26)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function drawCover(ctx, w, h, images, opts = {}) {
  const t = { ...DEFAULT_TEXT, ...(opts.text || {}) };
  const grade = GRADES[opts.grade || 'sunset'] || GRADES.sunset;
  const b = bandsFor(w, h);
  const crops = {};
  for (const slot of CAST) {
    const over = (opts.crops || {})[slot.id] || {};
    crops[slot.id] = { zoom: over.zoom ?? slot.zoom, cx: over.cx ?? slot.cx, cy: over.cy ?? slot.cy };
  }
  // Warm frame background: the mosaic is full-bleed, no dark surround.
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#ff9a2a');
  bg.addColorStop(0.5, '#ff5e3a');
  bg.addColorStop(1, '#7a1030');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const layout = opts.layout || 'mosaic';
  if (layout === 'single') {
    const hero = images.boss || images.driver;
    if (hero) {
      ctx.save();
      ctx.filter = grade.filter;
      ctx.drawImage(hero, 0, 0, w, h);
      ctx.filter = 'none';
      ctx.restore();
      const dg = ctx.createLinearGradient(0, h * 0.4, 0, h);
      dg.addColorStop(0, 'rgba(20,0,5,0)');
      dg.addColorStop(1, 'rgba(20,0,5,0.72)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, h * 0.4, w, h * 0.6);
    }
  } else {
    const rects = panelRects(w, h, b);
    const gap = Math.max(2, Math.round(w * 0.0022));
    for (const slot of CAST) {
      const [x0, y0, x1, y1] = rects[slot.id];
      drawPanelImage(ctx, images[slot.id], [x0 + gap / 2, y0 + gap / 2, x1 - gap / 2, y1 - gap / 2], crops[slot.id], grade);
    }
    // Gold hairlines between panels.
    ctx.strokeStyle = 'rgba(255,190,90,0.55)';
    ctx.lineWidth = Math.max(1.5, w * 0.0012);
    for (const slot of CAST) {
      const [x0, y0, x1, y1] = rects[slot.id];
      ctx.strokeRect(x0 + gap / 2, y0 + gap / 2, x1 - x0 - gap, y1 - y0 - gap);
    }
    // One warm unify wash over the whole mosaic so no panel stays pale,
    // blue-dusk or neon-night on its own.
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const uw = ctx.createLinearGradient(0, b.press * h, 0, b.mosaicBot * h);
    uw.addColorStop(0, 'rgba(255,140,50,0.9)');
    uw.addColorStop(1, 'rgba(255,90,40,0.9)');
    ctx.fillStyle = uw;
    ctx.fillRect(0, b.press * h, w, (b.mosaicBot - b.press) * h);
    ctx.restore();
    // Role labels: boss top-right (keeps the title zone clean), the rest
    // bottom-left of their panel, always clear of every face.
    const lh = Math.max(14, h * 0.026);
    labelChip(ctx, rects.driver[0] + w * 0.008, rects.driver[3] - lh - h * 0.012, 'THE DRIVER', lh, false);
    labelChip(ctx, rects.boss[2] - w * 0.008, rects.boss[1] + h * 0.012, 'THE BOSS', lh, true);
    labelChip(ctx, rects.friends[0] + w * 0.008, rects.friends[1] + h * 0.012, 'THE WILDCARDS', lh, false);
    labelChip(ctx, rects.courier[0] + w * 0.008, rects.courier[3] - lh - h * 0.012, 'THE COURIER', lh, false);
    labelChip(ctx, rects.rider[0] + w * 0.008, rects.rider[3] - lh - h * 0.012, 'THE RIDER', lh, false);
    labelChip(ctx, rects.lookout[0] + w * 0.008, rects.lookout[3] - lh - h * 0.012, 'THE LOOKOUT', lh, false);
    // Platform pill, top-right over the friends sky (no face there).
    ctx.save();
    ctx.font = `${Math.round(h * 0.016)}px Anton, sans-serif`;
    const pill = 'PS5 · XBOX · PC';
    const pw = ctx.measureText(pill).width + h * 0.03;
    ctx.fillStyle = 'rgba(12,2,6,0.82)';
    ctx.fillRect(w - pw - w * 0.008, rects.friends[3] - h * 0.038, pw, h * 0.03);
    ctx.fillStyle = '#ffe9b0';
    ctx.textBaseline = 'middle';
    ctx.fillText(pill, w - pw - w * 0.008 + h * 0.015, rects.friends[3] - h * 0.023);
    ctx.restore();
  }

  drawPressStrip(ctx, w, h, b, t);
  if (layout === 'mosaic') drawStripes(ctx, w, h, b);
  drawChromeTitle(ctx, w, h, b, t.title);
  // Script subtitle, tilted, overlapping the title's lower edge.
  ctx.save();
  ctx.translate(w / 2, b.scriptBase * h);
  ctx.rotate(-0.035);
  ctx.font = `${Math.round(b.scriptSize * h)}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = h * 0.008;
  ctx.shadowOffsetY = h * 0.004;
  ctx.fillStyle = '#ffd7ec';
  ctx.fillText(t.script, 0, 0);
  ctx.restore();
  // Tagline strip with gold rules.
  ctx.save();
  ctx.font = `${Math.round(b.tagSize * h)}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(w * 0.002)}px`; } catch { /* older canvas */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText(t.tagline, w / 2, b.tagBase * h);
  const tw = ctx.measureText(t.tagline).width;
  ctx.fillStyle = GOLD;
  ctx.fillRect(w / 2 - tw / 2 - w * 0.03, b.tagBase * h - h * 0.004, w * 0.02, h * 0.008);
  ctx.fillRect(w / 2 + tw / 2 + w * 0.01, b.tagBase * h - h * 0.004, w * 0.02, h * 0.008);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  ctx.restore();

  drawFurniture(ctx, w, h, b, t);
  grain(ctx, w, h);
  vignette(ctx, w, h);
}
