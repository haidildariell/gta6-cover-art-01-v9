// Tideline Cover Press — editor + screenshot scenes.
// Loads the cast, draws the live preview, lets the maker swap any photo,
// re-crop every panel, edit the lettering, pick a grade / layout / export
// size, and export a PNG. ?shot=cover|editor|cover-square|cover-story
// renders the fixed scenes the screenshots are taken from.
import { CAST, GRADES, DEFAULT_TEXT, loadCast, loadImage, drawCover } from './cover.js';

const SIZES = {
  '1920x1080': [1920, 1080],
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
};

const state = {
  text: { ...DEFAULT_TEXT },
  grade: 'sunset',
  layout: 'mosaic',
  size: '1920x1080',
  crops: {},
  selected: 'boss',
};

let images = {};
let stage = null;
let stageCtx = null;

const $ = (id) => document.getElementById(id);

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts */ }
}

function previewSize() {
  const [w, h] = SIZES[state.size];
  const maxW = 960;
  const maxH = 620;
  const s = Math.min(maxW / w, maxH / h, 1);
  return [Math.round(w * s), Math.round(h * s)];
}

function drawPreview() {
  if (!stage) return;
  const [w, h] = previewSize();
  stage.width = w;
  stage.height = h;
  drawCover(stageCtx, w, h, images, {
    text: state.text,
    grade: state.grade,
    layout: state.layout,
    crops: state.crops,
  });
}

function renderShotCanvas(w, h) {
  stage.width = w;
  stage.height = h;
  drawCover(stageCtx, w, h, images, {
    text: state.text,
    grade: state.grade,
    layout: state.layout,
    crops: state.crops,
  });
}

function shotDone() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

async function runShot(shot) {
  document.body.classList.add('shot-cover');
  if (shot === 'cover') {
    renderShotCanvas(window.innerWidth, window.innerHeight);
  } else if (shot === 'cover-square') {
    renderShotCanvas(1080, 1080);
  } else if (shot === 'cover-story') {
    renderShotCanvas(1080, 1350);
  } else {
    // editor scene: back to the normal editor, photo loaded.
    document.body.classList.remove('shot-cover');
    drawPreview();
  }
  shotDone();
}

function buildCastList() {
  const list = $('castList');
  list.innerHTML = '';
  for (const slot of CAST) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cast-btn' + (state.selected === slot.id ? ' selected' : '');
    btn.dataset.slot = slot.id;
    const thumb = document.createElement('img');
    thumb.alt = slot.label;
    const img = images[slot.id];
    thumb.src = img ? img.src : slot.src;
    const name = document.createElement('span');
    name.textContent = slot.label;
    btn.append(thumb, name);
    btn.addEventListener('click', () => {
      state.selected = slot.id;
      syncCastPanel();
      buildCastList();
    });
    list.appendChild(btn);
  }
}

function cropOf(id) {
  const slot = CAST.find((s) => s.id === id);
  const over = state.crops[id] || {};
  return {
    zoom: over.zoom ?? slot.zoom,
    cx: over.cx ?? slot.cx,
    cy: over.cy ?? slot.cy,
  };
}

function syncCastPanel() {
  const slot = CAST.find((s) => s.id === state.selected);
  const c = cropOf(slot.id);
  $('castName').textContent = slot.label;
  $('zoomRange').value = c.zoom;
  $('zoomVal').textContent = c.zoom.toFixed(2) + '×';
  $('cxRange').value = c.cx;
  $('cxVal').textContent = Math.round(c.cx * 100) + '%';
  $('cyRange').value = c.cy;
  $('cyVal').textContent = Math.round(c.cy * 100) + '%';
  document.querySelectorAll('.cast-btn').forEach((b) => {
    b.classList.toggle('selected', b.dataset.slot === slot.id);
  });
}

function bindCrop(id, key, parse) {
  $(id).addEventListener('input', (e) => {
    const slot = CAST.find((s) => s.id === state.selected);
    const cur = cropOf(slot.id);
    state.crops[slot.id] = { ...cur, [key]: parse(e.target.value) };
    syncCastPanel();
    drawPreview();
  });
}

function bindText(id, key) {
  $(id).addEventListener('input', (e) => {
    state.text[key] = e.target.value;
    drawPreview();
  });
}

function wireEditor() {
  $('titleInput').value = state.text.title;
  $('scriptInput').value = state.text.script;
  $('taglineInput').value = state.text.tagline;
  $('quoteInput').value = state.text.quote;
  $('gazetteInput').value = state.text.gazette;
  bindText('titleInput', 'title');
  bindText('scriptInput', 'script');
  bindText('taglineInput', 'tagline');
  bindText('quoteInput', 'quote');
  bindText('gazetteInput', 'gazette');

  $('gradeSelect').addEventListener('change', (e) => {
    state.grade = e.target.value;
    drawPreview();
  });
  $('layoutSelect').addEventListener('change', (e) => {
    state.layout = e.target.value;
    drawPreview();
  });
  $('sizeSelect').addEventListener('change', (e) => {
    state.size = e.target.value;
    drawPreview();
  });
  bindCrop('zoomRange', 'zoom', Number);
  bindCrop('cxRange', 'cx', Number);
  bindCrop('cyRange', 'cy', Number);

  $('photoInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      images[state.selected] = await loadImage(url);
      buildCastList();
      drawPreview();
    } catch {
      alert('Photo could not be read.');
    }
    e.target.value = '';
  });
  $('resetPhoto').addEventListener('click', async () => {
    const slot = CAST.find((s) => s.id === state.selected);
    images[slot.id] = await loadImage(slot.src);
    buildCastList();
    drawPreview();
  });
  $('resetCrop').addEventListener('click', () => {
    delete state.crops[state.selected];
    syncCastPanel();
    drawPreview();
  });

  $('exportBtn').addEventListener('click', () => {
    const [w, h] = SIZES[state.size];
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off.getContext('2d'), w, h, images, {
      text: state.text,
      grade: state.grade,
      layout: state.layout,
      crops: state.crops,
    });
    off.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `velvet-tide-${state.size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  });
}

async function init() {
  stage = $('stage');
  stageCtx = stage.getContext('2d');
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  await ensureFonts();
  images = await loadCast();
  if (shot) {
    await runShot(shot);
    return;
  }
  buildCastList();
  syncCastPanel();
  wireEditor();
  drawPreview();
}

init().catch((err) => {
  document.body.insertAdjacentHTML('beforeend', `<p class="err">Failed to start: ${err.message}</p>`);
});
