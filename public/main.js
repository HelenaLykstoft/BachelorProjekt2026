const views = {
  landing: document.getElementById('view-landing'),
  choice: document.getElementById('view-choice'),
  upload: document.getElementById('view-upload'),
  existing: document.getElementById('view-existing'),
  edits: document.getElementById('view-edits'),
  editor: document.getElementById('view-editor')
};

const screenEl = document.querySelector('.screen');
const titleBlockEl = document.querySelector('.title-block');

/* ---- Theme toggle (dark by default) ---- */
const themeToggleBtn = document.getElementById('theme-toggle');

function updateThemeToggleLabel() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  themeToggleBtn.textContent = isLight ? 'Dark mode' : 'Light mode';
  themeToggleBtn.setAttribute('aria-pressed', String(isLight));
}

themeToggleBtn.addEventListener('click', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
  updateThemeToggleLabel();
});

updateThemeToggleLabel();

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
  screenEl.classList.toggle('screen-wide', name === 'editor');
  titleBlockEl.classList.toggle('title-block-wide', name === 'editor');
}

function setStatus(el, message, kind) {
  el.textContent = message;
  el.className = `status status-${kind}`;
}

document.getElementById('start-btn').addEventListener('click', () => showView('choice'));
document.getElementById('choice-upload').addEventListener('click', () => {
  uploadContinueBtn.hidden = true;
  showView('upload');
});
document.getElementById('choice-existing').addEventListener('click', () => {
  showView('existing');
  loadTemplates();
});

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.back));
});

/* ---- Upload template ---- */
const form = document.getElementById('upload-form');
const fileInput = document.getElementById('template-file');
const nameInput = document.getElementById('template-name');
const uploadStatusEl = document.getElementById('upload-status');
const uploadBtn = document.getElementById('upload-btn');
const uploadContinueBtn = document.getElementById('upload-continue-btn');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  uploadContinueBtn.hidden = true;

  const file = fileInput.files[0];
  if (!file) {
    setStatus(uploadStatusEl, 'Please choose a PNG file first.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('template', file);
  formData.append('name', nameInput.value);

  uploadBtn.disabled = true;
  setStatus(uploadStatusEl, 'Uploading...', 'pending');

  try {
    const response = await fetch('/api/templates', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus(uploadStatusEl, result.message || 'Upload failed. Please try again.', 'error');
      return;
    }

    setStatus(uploadStatusEl, result.message, 'success');
    form.reset();
    uploadContinueBtn.hidden = false;
    uploadContinueBtn.onclick = () => openEditor(result.template, null);
  } catch (error) {
    setStatus(uploadStatusEl, 'Could not reach the server. Please try again.', 'error');
  } finally {
    uploadBtn.disabled = false;
  }
});

/* ---- Choose a template ---- */
const listEl = document.getElementById('templates-list');
const emptyEl = document.getElementById('templates-empty');
const selectionStatusEl = document.getElementById('selection-status');
const existingContinueBtn = document.getElementById('existing-continue-btn');
let selectedCard = null;
let selectedTemplate = null;

function renderTemplates(templates) {
  listEl.innerHTML = '';
  emptyEl.hidden = templates.length > 0;
  selectedCard = null;
  selectedTemplate = null;
  selectionStatusEl.textContent = '';
  selectionStatusEl.className = 'status';
  existingContinueBtn.hidden = true;

  templates.forEach((template) => {
    const item = document.createElement('li');

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'template-card';

    const thumb = document.createElement('img');
    thumb.src = template.url;
    thumb.alt = template.name;
    thumb.className = 'template-thumb';

    const name = document.createElement('span');
    name.className = 'template-name';
    name.textContent = template.name;

    card.append(thumb, name);
    card.addEventListener('click', () => {
      if (selectedCard) {
        selectedCard.classList.remove('selected');
      }
      card.classList.add('selected');
      selectedCard = card;
      selectedTemplate = template;
      setStatus(selectionStatusEl, `Working with "${template.name}".`, 'success');
      existingContinueBtn.hidden = false;
    });

    item.appendChild(card);
    listEl.appendChild(item);
  });
}

async function loadTemplates() {
  const response = await fetch('/api/templates');
  const templates = await response.json();
  renderTemplates(templates);
}

existingContinueBtn.addEventListener('click', () => {
  if (selectedTemplate) {
    openEditPicker(selectedTemplate);
  }
});

/* ---- Choose a skin ---- */
const editsHeadingEl = document.getElementById('edits-heading');
const editsGridEl = document.getElementById('edits-grid');
const newEditCard = document.getElementById('new-edit-card');
let templateForEdits = null;

async function openEditPicker(template) {
  templateForEdits = template;
  editsHeadingEl.textContent = `${template.name} — choose a skin`;

  editsGridEl.querySelectorAll('.skin-card').forEach((el) => el.remove());
  showView('edits');

  const response = await fetch(`/api/projects?templateId=${template.id}`);
  const data = await response.json();
  const skins = data.projects || [];

  skins.forEach((skin) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'choice-card skin-card';

    const swatch = document.createElement('span');
    swatch.className = 'skin-swatch';
    swatch.style.background = skin.color.hex;

    const title = document.createElement('span');
    title.className = 'choice-title';
    title.textContent = skin.name;

    const sub = document.createElement('span');
    sub.className = 'choice-sub';
    sub.textContent = `Last edited ${new Date(skin.updatedAt).toLocaleDateString()}`;

    card.append(swatch, title, sub);
    card.addEventListener('click', () => openEditor(template, skin));

    editsGridEl.insertBefore(card, newEditCard);
  });
}

newEditCard.addEventListener('click', () => {
  if (templateForEdits) {
    openEditor(templateForEdits, null);
  }
});

/* ---- Editor: shared state ---- */
const projectTagEl = document.getElementById('project-tag');
const projectTagNameEl = document.getElementById('project-tag-name');
const editorPreviewEl = document.getElementById('editor-preview');
const skinNameInput = document.getElementById('skin-name-input');
const saveBtn = document.getElementById('save-btn');
const saveStatusEl = document.getElementById('save-status');

let currentTemplateId = null;
let currentTemplateName = '';
let currentSkinId = null;

function updateProjectTag() {
  const skinName = skinNameInput.value.trim();
  projectTagNameEl.textContent = skinName ? `${currentTemplateName} — ${skinName}` : currentTemplateName;
}

skinNameInput.addEventListener('input', updateProjectTag);

async function openEditor(template, skin) {
  currentTemplateId = template.id;
  currentTemplateName = template.name;
  currentSkinId = skin ? skin.id : null;
  skinNameInput.value = skin ? skin.name : '';

  editorPreviewEl.src = template.url;
  editorPreviewEl.alt = template.name;

  colorTintEl.style.webkitMaskImage = `url(${template.url})`;
  colorTintEl.style.maskImage = `url(${template.url})`;
  colorOverlayEl.style.webkitMaskImage = `url(${template.url})`;
  colorOverlayEl.style.maskImage = `url(${template.url})`;
  grainLayerEl.style.webkitMaskImage = `url(${template.url})`;
  grainLayerEl.style.maskImage = `url(${template.url})`;

  setTintColor('#3c5670');
  intensityInput.value = 0;
  applyIntensity();
  setActiveSwatch('');

  fadeInput.value = 0;
  applyFade();
  setTexture('grain');
  grainInput.value = 0;
  applyGrain();

  setZoom(1);

  resetLogo();
  setStatus(saveStatusEl, '', 'pending');
  saveStatusEl.textContent = '';

  updateProjectTag();
  projectTagEl.hidden = false;

  showView('editor');

  if (skin) {
    setTintColor(skin.color.hex);
    customColorInput.value = skin.color.hex;
    intensityInput.value = skin.color.intensity;
    applyIntensity();

    fadeInput.value = typeof skin.fade === 'number' ? skin.fade : 0;
    applyFade();
    setTexture(skin.textureType || 'grain');
    grainInput.value = skin.grain;
    applyGrain();

    setCanvasSize(skin.canvasSize.width, skin.canvasSize.height);

    if (skin.logo) {
      restoreLogo(skin.logo);
    }
  } else if (editorPreviewEl.complete && editorPreviewEl.naturalWidth) {
    setCanvasSize(editorPreviewEl.naturalWidth, editorPreviewEl.naturalHeight);
  } else {
    editorPreviewEl.onload = () => setCanvasSize(editorPreviewEl.naturalWidth, editorPreviewEl.naturalHeight);
  }
}

/* ---- Base color ---- */
const colorTintEl = document.getElementById('color-tint');
const colorOverlayEl = document.getElementById('color-overlay');
const intensityInput = document.getElementById('intensity-input');
const intensityValueEl = document.getElementById('intensity-value');
const customColorInput = document.getElementById('custom-color');
const swatchButtons = document.querySelectorAll('.color-swatch[data-color]');

let currentColorHex = '#3c5670';

function setActiveSwatch(color) {
  swatchButtons.forEach((btn) => {
    btn.classList.toggle('active', color !== '' && btn.dataset.color.toLowerCase() === color.toLowerCase());
  });
}

function setTintColor(color) {
  currentColorHex = color;
  colorTintEl.style.backgroundColor = color;
  colorOverlayEl.style.backgroundColor = color;
  setActiveSwatch(color);
}

// The "color" blend tint preserves the template's own shading/folds, but
// that means it preserves luminosity too — on a near-black or near-white
// template it stays invisible no matter the opacity, since there's no
// shading left to recolor. The "normal" blend overlay doesn't have that
// problem (it mixes in real color regardless of backdrop luminosity), so it
// now ramps in across the whole 0-100% range instead of only above 50%,
// squared so it still stays gentle at low intensity and only fully takes
// over — reaching a flat, fully opaque color, e.g. true white — at 100%.
function applyIntensity() {
  const value = Number(intensityInput.value);
  colorTintEl.style.opacity = String(value / 100);
  colorOverlayEl.style.opacity = String((value / 100) ** 2);
  intensityValueEl.textContent = `${value}%`;
}

function bumpIntensityIfZero() {
  if (Number(intensityInput.value) === 0) {
    intensityInput.value = 50;
  }
  applyIntensity();
}

swatchButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setTintColor(btn.dataset.color);
    bumpIntensityIfZero();
  });
});

customColorInput.addEventListener('input', () => {
  setTintColor(customColorInput.value);
  bumpIntensityIfZero();
});

intensityInput.addEventListener('input', applyIntensity);

/* ---- Adjustments: fade + texture ---- */
const fadeInput = document.getElementById('fade-input');
const fadeValueEl = document.getElementById('fade-value');
const grainInput = document.getElementById('grain-input');
const grainValueEl = document.getElementById('grain-value');
const grainLayerEl = document.getElementById('grain-layer');
const fabricLayerEl = document.getElementById('fabric-layer');
const textureButtons = document.querySelectorAll('.texture-option');

// One-directional: 0% is the true color untouched, 100% is fully gray.
// Deliberately never boosts past natural saturation — a boost mostly just
// clips at the sRGB gamut edge with no visible change, which is what made
// the old two-directional saturation slider feel broken.
function applyFade() {
  const value = Number(fadeInput.value);
  fabricLayerEl.style.filter = `saturate(${100 - value}%)`;
  fadeValueEl.textContent = `${value}%`;
}

// Each pattern is centered on neutral gray (128,128,128) so mix-blend-mode:
// overlay treats it as a no-op on average — texture shows up as light/dark
// speckling instead of uniformly darkening the base color underneath it.
const TEXTURES = {
  grain: {
    size: '96px 96px',
    dataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='1.6 0 0 0 -0.52  1.6 0 0 0 -0.52  1.6 0 0 0 -0.52  0 0 0 0 1'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"
  },
  weave: {
    size: '12px 12px',
    dataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><rect width='12' height='12' fill='rgb(128,128,128)'/><path d='M0 0 L12 12' stroke='rgb(162,162,162)' stroke-width='2'/><path d='M12 0 L0 12' stroke='rgb(94,94,94)' stroke-width='2'/></svg>"
  },
  scuffed: {
    size: '260px 260px',
    dataUri: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='s' x='0' y='0' width='260' height='260' primitiveUnits='userSpaceOnUse'><feTurbulence type='turbulence' baseFrequency='0.015' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix type='matrix' values='2.2 0 0 0 -0.19  2.2 0 0 0 -0.19  2.2 0 0 0 -0.19  0 0 0 0 1'/></filter><rect width='260' height='260' filter='url(%23s)'/></svg>"
  }
};

let currentTexture = 'grain';

function setTexture(type) {
  currentTexture = TEXTURES[type] ? type : 'grain';
  const texture = TEXTURES[currentTexture];
  grainLayerEl.style.backgroundImage = `url("${texture.dataUri}")`;
  grainLayerEl.style.backgroundSize = texture.size;
  textureButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.texture === currentTexture);
  });
}

function applyGrain() {
  const value = Number(grainInput.value);
  grainLayerEl.style.opacity = String(value / 100);
  grainValueEl.textContent = `${value}%`;
}

fadeInput.addEventListener('input', applyFade);
grainInput.addEventListener('input', applyGrain);
textureButtons.forEach((btn) => {
  btn.addEventListener('click', () => setTexture(btn.dataset.texture));
});

/* ---- Canvas size ---- */
const sizeButtons = document.querySelectorAll('.size-option');
const sizeWidthInput = document.getElementById('size-width-input');
const sizeHeightInput = document.getElementById('size-height-input');
const sizeHintEl = document.getElementById('size-hint');
let canvasSize = { width: 2048, height: 2048 };

function setCanvasSize(width, height) {
  canvasSize = { width, height };
  sizeWidthInput.value = width;
  sizeHeightInput.value = height;
  sizeButtons.forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.w) === width && Number(btn.dataset.h) === height);
  });
  sizeHintEl.textContent = `Exported at ${width} × ${height}px.`;
}

sizeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setCanvasSize(Number(btn.dataset.w), Number(btn.dataset.h));
  });
});

function onSizeInputChange() {
  const width = clamp(Math.round(Number(sizeWidthInput.value) || 0), 16, 8192);
  const height = clamp(Math.round(Number(sizeHeightInput.value) || 0), 16, 8192);
  setCanvasSize(width, height);
}

sizeWidthInput.addEventListener('change', onSizeInputChange);
sizeHeightInput.addEventListener('change', onSizeInputChange);

/* ---- Logo ---- */
const canvasSurface = document.getElementById('canvas-surface');
const logoInput = document.getElementById('logo-input');
const logoDropzone = document.getElementById('logo-dropzone');
const logoChip = document.getElementById('logo-chip');
const logoChipNameEl = document.getElementById('logo-chip-name');
const logoRemoveBtn = document.getElementById('logo-remove');

let logoObjectUrl = null;
let logoWrapper = null;
let logoState = null;
let logoAspect = 1;
let pendingLogoFile = null;
let logoServerUrl = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function applyLogoStyle() {
  logoWrapper.style.left = `${logoState.x}%`;
  logoWrapper.style.top = `${logoState.y}%`;
  logoWrapper.style.width = `${logoState.w}%`;
  logoWrapper.style.aspectRatio = `1 / ${logoAspect}`;
}

function startLogoInteraction(event, mode, handle) {
  event.preventDefault();

  const canvasRect = canvasSurface.getBoundingClientRect();
  const wrapperRect = logoWrapper.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const start = { ...logoState };

  const rightPx = wrapperRect.right - canvasRect.left;
  const leftPx = wrapperRect.left - canvasRect.left;
  const bottomPx = wrapperRect.bottom - canvasRect.top;
  const startWidthPx = wrapperRect.width;

  function onMove(moveEvent) {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;

    if (mode === 'move') {
      const heightPercent = ((start.w / 100) * canvasRect.width * logoAspect / canvasRect.height) * 100;
      logoState.x = clamp(start.x + (dx / canvasRect.width) * 100, 0, 100 - start.w);
      logoState.y = clamp(start.y + (dy / canvasRect.height) * 100, 0, 100 - heightPercent);
    } else {
      const minWidthPx = canvasRect.width * 0.05;
      let newWidthPx;
      if (handle.includes('r')) {
        newWidthPx = clamp(startWidthPx + dx, minWidthPx, canvasRect.width - leftPx);
      } else {
        newWidthPx = clamp(startWidthPx - dx, minWidthPx, rightPx);
      }
      const newHeightPx = newWidthPx * logoAspect;

      logoState.w = (newWidthPx / canvasRect.width) * 100;

      if (handle.includes('l')) {
        logoState.x = ((rightPx - newWidthPx) / canvasRect.width) * 100;
      }
      if (handle.includes('t')) {
        logoState.y = ((bottomPx - newHeightPx) / canvasRect.height) * 100;
      }
    }
    applyLogoStyle();
  }

  function onUp() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  }

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

function placeLogo(url, name, position) {
  if (logoWrapper) {
    logoWrapper.remove();
  }

  logoState = position ? { ...position } : { x: 40, y: 32, w: 20 };

  logoWrapper = document.createElement('div');
  logoWrapper.className = 'logo-mark';
  logoWrapper.innerHTML = `
    <img class="logo-img" draggable="false" alt="Logo" />
    <div class="logo-select">
      <span class="handle tl" data-handle="tl"></span>
      <span class="handle tr" data-handle="tr"></span>
      <span class="handle bl" data-handle="bl"></span>
      <span class="handle br" data-handle="br"></span>
    </div>
  `;
  logoWrapper.querySelector('.logo-img').src = url;
  canvasSurface.appendChild(logoWrapper);
  applyLogoStyle();

  logoWrapper.querySelector('.logo-img').addEventListener('pointerdown', (event) => {
    startLogoInteraction(event, 'move');
  });
  logoWrapper.querySelectorAll('.handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      startLogoInteraction(event, 'resize', handle.dataset.handle);
    });
  });

  logoDropzone.hidden = true;
  logoChip.hidden = false;
  logoChipNameEl.textContent = name;
}

function resetLogo() {
  if (logoObjectUrl) {
    URL.revokeObjectURL(logoObjectUrl);
    logoObjectUrl = null;
  }
  if (logoWrapper) {
    logoWrapper.remove();
    logoWrapper = null;
  }
  logoState = null;
  pendingLogoFile = null;
  logoServerUrl = null;
  logoDropzone.hidden = false;
  logoChip.hidden = true;
  logoInput.value = '';
}

function handleLogoFile(file) {
  if (file.type !== 'image/png') {
    return;
  }

  if (logoObjectUrl) {
    URL.revokeObjectURL(logoObjectUrl);
  }
  logoObjectUrl = URL.createObjectURL(file);
  pendingLogoFile = file;
  logoServerUrl = null;

  const probe = new Image();
  probe.onload = () => {
    logoAspect = probe.naturalHeight / probe.naturalWidth;
    placeLogo(logoObjectUrl, file.name);
  };
  probe.src = logoObjectUrl;
}

function restoreLogo(logo) {
  const probe = new Image();
  probe.onload = () => {
    logoAspect = probe.naturalHeight / probe.naturalWidth;
    placeLogo(logo.url, logo.name || 'logo.png', { x: logo.x, y: logo.y, w: logo.w });
    logoServerUrl = logo.url;
    pendingLogoFile = null;
  };
  probe.src = logo.url;
}

logoDropzone.addEventListener('click', () => logoInput.click());
logoDropzone.addEventListener('dragover', (event) => event.preventDefault());
logoDropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) {
    handleLogoFile(file);
  }
});
logoInput.addEventListener('change', () => {
  const file = logoInput.files[0];
  if (file) {
    handleLogoFile(file);
  }
});
logoRemoveBtn.addEventListener('click', resetLogo);

/* ---- AI logo prompt (sourced from ai-prompt.md, so it's editable without touching code) ---- */
const aiPromptPreviewEl = document.getElementById('ai-prompt-preview');
const copyPromptBtn = document.getElementById('copy-prompt-btn');
const copyPromptStatusEl = document.getElementById('copy-prompt-status');
let aiPromptText = null;

async function getAiPromptText() {
  if (aiPromptText === null) {
    const response = await fetch('/ai-prompt.md');
    aiPromptText = (await response.text()).trim();
  }
  return aiPromptText;
}

getAiPromptText()
  .then((text) => { aiPromptPreviewEl.textContent = text; })
  .catch(() => { aiPromptPreviewEl.textContent = 'Could not load the prompt.'; });

copyPromptBtn.addEventListener('click', async () => {
  copyPromptBtn.disabled = true;
  try {
    const text = await getAiPromptText();
    await navigator.clipboard.writeText(text);
    setStatus(copyPromptStatusEl, 'Prompt copied to clipboard.', 'success');
  } catch (error) {
    setStatus(copyPromptStatusEl, 'Could not copy the prompt. Please try again.', 'error');
  } finally {
    copyPromptBtn.disabled = false;
  }
});

/* ---- Zoom ---- */
const canvasPaneEl = document.getElementById('canvas-pane');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomLevelBtn = document.getElementById('zoom-level-btn');

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;
let canvasZoom = 1;

function applyZoom() {
  canvasSurface.style.transform = `scale(${canvasZoom})`;
  zoomLevelBtn.textContent = `${Math.round(canvasZoom * 100)}%`;
  zoomInBtn.disabled = canvasZoom >= ZOOM_MAX;
  zoomOutBtn.disabled = canvasZoom <= ZOOM_MIN;
}

function setZoom(value) {
  canvasZoom = clamp(value, ZOOM_MIN, ZOOM_MAX);
  applyZoom();
}

zoomInBtn.addEventListener('click', () => setZoom(canvasZoom + ZOOM_STEP));
zoomOutBtn.addEventListener('click', () => setZoom(canvasZoom - ZOOM_STEP));
zoomLevelBtn.addEventListener('click', () => setZoom(1));

// Ctrl+wheel (and trackpad pinch, which Chrome reports as ctrlKey wheel events)
// zooms; plain wheel/trackpad scroll is left alone so panning still works.
canvasPaneEl.addEventListener('wheel', (event) => {
  if (!event.ctrlKey) {
    return;
  }
  event.preventDefault();
  setZoom(canvasZoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
}, { passive: false });

/* ---- Save skin ---- */
saveBtn.addEventListener('click', async () => {
  const name = skinNameInput.value.trim();
  if (!name) {
    setStatus(saveStatusEl, 'Please name this skin before saving.', 'error');
    return;
  }

  saveBtn.disabled = true;
  setStatus(saveStatusEl, 'Saving...', 'pending');

  try {
    let logoPayload = null;

    if (logoState) {
      let logoUrl = logoServerUrl;

      if (!logoUrl && pendingLogoFile) {
        const formData = new FormData();
        formData.append('logo', pendingLogoFile);

        const uploadResponse = await fetch('/api/logos', { method: 'POST', body: formData });
        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success) {
          setStatus(saveStatusEl, uploadResult.message || 'Could not save the logo.', 'error');
          return;
        }

        logoUrl = uploadResult.logo.url;
        logoServerUrl = logoUrl;
        pendingLogoFile = null;
      }

      logoPayload = {
        url: logoUrl,
        name: logoChipNameEl.textContent,
        x: logoState.x,
        y: logoState.y,
        w: logoState.w
      };
    }

    const payload = {
      templateId: currentTemplateId,
      name,
      color: { hex: currentColorHex, intensity: Number(intensityInput.value) },
      fade: Number(fadeInput.value),
      textureType: currentTexture,
      grain: Number(grainInput.value),
      canvasSize,
      logo: logoPayload
    };

    const url = currentSkinId ? `/api/projects/${currentSkinId}` : '/api/projects';
    const method = currentSkinId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus(saveStatusEl, result.message || 'Could not save the skin.', 'error');
      return;
    }

    currentSkinId = result.project.id;
    setStatus(saveStatusEl, result.message, 'success');
  } catch (error) {
    setStatus(saveStatusEl, 'Could not reach the server. Please try again.', 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

/* ---- Download flattened PNG ---- */
const downloadBtn = document.getElementById('download-btn');

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

// Paints one fabric effect (tint / overlay / grain) onto its own canvas, clips
// it to the template's own alpha shape via destination-in (the canvas
// equivalent of the CSS mask-image trick each layer uses live), then
// composites it onto the target with the matching blend mode + opacity —
// mirrors the #fabric-layer stack pixel for pixel.
function compositeMaskedLayer(targetCtx, templateImg, width, height, alpha, blendMode, paint) {
  if (alpha <= 0) {
    return;
  }
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  const layerCtx = layer.getContext('2d');
  paint(layerCtx);
  layerCtx.globalCompositeOperation = 'destination-in';
  layerCtx.drawImage(templateImg, 0, 0, width, height);

  targetCtx.save();
  targetCtx.globalAlpha = alpha;
  targetCtx.globalCompositeOperation = blendMode;
  targetCtx.drawImage(layer, 0, 0);
  targetCtx.restore();
}

async function renderSkinToCanvas() {
  const { width, height } = canvasSize;
  const templateImg = await loadImageEl(editorPreviewEl.src);

  const composite = document.createElement('canvas');
  composite.width = width;
  composite.height = height;
  const ctx = composite.getContext('2d');
  ctx.drawImage(templateImg, 0, 0, width, height);

  const intensity = Number(intensityInput.value);
  compositeMaskedLayer(ctx, templateImg, width, height, intensity / 100, 'color', (layerCtx) => {
    layerCtx.fillStyle = currentColorHex;
    layerCtx.fillRect(0, 0, width, height);
  });
  compositeMaskedLayer(ctx, templateImg, width, height, (intensity / 100) ** 2, 'source-over', (layerCtx) => {
    layerCtx.fillStyle = currentColorHex;
    layerCtx.fillRect(0, 0, width, height);
  });

  const grainAlpha = Number(grainInput.value) / 100;
  if (grainAlpha > 0) {
    const texture = TEXTURES[currentTexture];
    const textureImg = await loadImageEl(texture.dataUri);
    const [tileW, tileH] = texture.size.split(' ').map(parseFloat);
    compositeMaskedLayer(ctx, templateImg, width, height, grainAlpha, 'overlay', (layerCtx) => {
      const tile = document.createElement('canvas');
      tile.width = tileW;
      tile.height = tileH;
      tile.getContext('2d').drawImage(textureImg, 0, 0, tileW, tileH);
      layerCtx.fillStyle = layerCtx.createPattern(tile, 'repeat');
      layerCtx.fillRect(0, 0, width, height);
    });
  }

  const final = document.createElement('canvas');
  final.width = width;
  final.height = height;
  const finalCtx = final.getContext('2d');
  finalCtx.filter = `saturate(${100 - Number(fadeInput.value)}%)`;
  finalCtx.drawImage(composite, 0, 0);
  finalCtx.filter = 'none';

  if (logoState) {
    const logoImg = await loadImageEl(logoWrapper.querySelector('.logo-img').src);
    const logoW = (logoState.w / 100) * width;
    const logoH = logoW * logoAspect;
    const logoX = (logoState.x / 100) * width;
    const logoY = (logoState.y / 100) * height;
    finalCtx.drawImage(logoImg, logoX, logoY, logoW, logoH);
  }

  return final;
}

downloadBtn.addEventListener('click', async () => {
  downloadBtn.disabled = true;
  setStatus(saveStatusEl, 'Preparing PNG...', 'pending');

  try {
    const canvas = await renderSkinToCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

    const rawName = skinNameInput.value.trim() || currentTemplateName || 'skin';
    const filename = `${rawName.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'skin'}.png`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    setStatus(saveStatusEl, `Downloaded "${filename}".`, 'success');
  } catch (error) {
    setStatus(saveStatusEl, 'Could not generate the PNG. Please try again.', 'error');
  } finally {
    downloadBtn.disabled = false;
  }
});
