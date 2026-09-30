const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const lucideName = { arrow: 'arrow-up-right', down: 'chevron-down', play: 'play', pause: 'pause', expand: 'maximize', close: 'x', file: 'file-text', menu: 'menu' };
const icon = (name) => `<i class="icon" data-lucide="${lucideName[name]}" aria-hidden="true"></i>`;
function renderIcons() {
  $$('.icon use').forEach((use) => {
    const key = use.getAttribute('href').replace('#icon-', '');
    const placeholder = document.createElement('i');
    placeholder.className = 'icon';
    placeholder.dataset.lucide = lucideName[key];
    placeholder.setAttribute('aria-hidden', 'true');
    use.closest('svg').replaceWith(placeholder);
  });
  lucide.createIcons();
}
renderIcons();

const menuToggle = $('#menuToggle');
const mobileNav = $('#mobileNav');
menuToggle.addEventListener('click', () => {
  const open = mobileNav.hidden;
  mobileNav.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuToggle.innerHTML = icon(open ? 'close' : 'menu');
  lucide.createIcons();
});
$$('.mobile-nav a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.innerHTML = icon('menu');
  lucide.createIcons();
}));

function setSource(video, source, poster) {
  video.pause();
  video.poster = poster;
  video.querySelector('source').src = source;
  video.addEventListener('loadedmetadata', () => { video.currentTime = 0; }, { once: true });
  video.load();
}

function player({ videos, playButton, seek, counter, frames, fps = 8 }) {
  let playing = false;
  let tickId;
  const update = () => {
    const frame = Math.min(frames - 1, Math.max(0, Math.floor(videos[0].currentTime * fps)));
    seek.value = String(frame);
    counter.textContent = `FRAME ${String(frame + 1).padStart(frames > 99 ? 3 : 2, '0')} / ${frames}`;
    videos.slice(1).forEach((video) => {
      if (Math.abs(video.currentTime - videos[0].currentTime) > 0.22 && video.readyState >= 2) video.currentTime = videos[0].currentTime;
    });
    if (playing) tickId = requestAnimationFrame(update);
  };
  const setPlaying = (enabled) => {
    playing = enabled;
    playButton.innerHTML = icon(enabled ? 'pause' : 'play');
    lucide.createIcons();
    playButton.setAttribute('aria-label', enabled ? 'Pause synchronized videos' : 'Play synchronized videos');
    if (enabled) {
      videos.forEach((video) => video.play().catch(() => {}));
      cancelAnimationFrame(tickId);
      tickId = requestAnimationFrame(update);
    } else {
      videos.forEach((video) => video.pause());
      cancelAnimationFrame(tickId);
      update();
    }
  };
  playButton.addEventListener('click', () => setPlaying(!playing));
  const seekFrame = (frame) => {
    seek.value = String(frame);
    const time = Number(frame) / fps;
    videos.forEach((video) => { if (video.readyState >= 1) video.currentTime = time; });
    update();
  };
  seek.addEventListener('input', () => seekFrame(seek.value));
  videos[0].addEventListener('timeupdate', () => { if (!playing) update(); });
  return { get playing() { return playing; }, setPlaying, seekFrame };
}

const ideaSteps = {
  alignment: { image: 'intro-alignment.png', alt: 'The same video provides geometric and visual representations.', number: '01 / THE OBSERVATION', title: 'One video, complementary evidence.', text: "A geometric representation can preserve layout and correspondence, but it cannot alone specify the scene's color, texture, and lighting.", key: 'Same observation · different predictive roles' },
  factorized: { image: 'intro-factorized.png', alt: 'A shared physical codebook and a private appearance path form a coupled visual state.', number: '02 / THE TRANSITION', title: 'Share the structure. Keep the detail.', text: 'A geometry-anchored codebook organizes physical changes across representations; a continuous appearance path carries complementary visual change. Coupling lets both inform visual prediction.', key: 'Q: shared physical · A: private appearance · U: coupled visual' },
  generation: { image: 'intro-generation.png', alt: 'The trained DFoT backbone rolls out RGB video without auxiliary modules.', number: '03 / THE DEPLOYMENT', title: 'The video model stands on its own.', text: 'Training-time representations improve the original backbone. At inference, the model takes an input frame and controls and rolls out RGB video without the auxiliary pathways.', key: 'Training-time knowledge · backbone-only inference' }
};
const ideaOrder = ['alignment', 'factorized', 'generation'];
function setMotionPlayback(selector, playing) {
  const canvas = $(selector);
  if (!canvas) return;
  canvas.classList.toggle('is-paused', !playing);
  canvas.getAnimations({ subtree: true }).forEach((animation) => { if (playing) animation.play(); else animation.pause(); });
}
function activateIdea(button) {
  const step = ideaSteps[button.dataset.idea];
  UpcastMotion.mountIdea(button.dataset.idea);
  $('#ideaPanelImage').src = `assets/media/${step.image}`;
  $('#ideaPanelImage').alt = step.alt;
  $('#ideaPanelNumber').textContent = step.number;
  $('#ideaPanelTitle').textContent = step.title;
  $('#ideaPanelText').textContent = step.text;
  $('#ideaPanelKey').textContent = step.key;
  $('#ideaProgress').textContent = `${String(ideaOrder.indexOf(button.dataset.idea) + 1).padStart(2, '0')} / 03`;
  $$('[data-idea]').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); });
}

const compareVideos = [$('#compareRef'), $('#compareOurs'), $('#compareGF')];
const compare = player({ videos: compareVideos, playButton: $('#comparePlay'), seek: $('#compareSeek'), counter: $('#compareFrame'), frames: 64 });
$$('[data-video-scrub]').forEach((frame) => {
  let dragging = false;
  const scrub = (event) => {
    const bounds = frame.getBoundingClientRect();
    compare.seekFrame(Math.max(0, Math.min(63, Math.round((event.clientX - bounds.left) / bounds.width * 63))));
  };
  frame.addEventListener('pointerdown', (event) => { dragging = true; compare.setPlaying(false); frame.setPointerCapture(event.pointerId); scrub(event); });
  frame.addEventListener('pointermove', (event) => { if (dragging) scrub(event); });
  frame.addEventListener('pointerup', () => { dragging = false; });
  frame.addEventListener('pointercancel', () => { dragging = false; });
});
const roleNames = ['reference', 'upcast', 'geometry-forcing'];
$$('.scene-pick').forEach((button) => button.addEventListener('click', () => {
  if (button.classList.contains('active')) return;
  compare.setPlaying(false);
  $$('.scene-pick').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  const scene = button.dataset.scene;
  compareVideos.forEach((video, index) => setSource(video, `assets/media/${scene}-${roleNames[index]}.mp4`, `assets/media/${scene}-${roleNames[index]}.jpg`));
  $('#compareSeek').value = 0;
  $('#compareFrame').textContent = 'FRAME 01 / 64';
}));
const methodOrder = ['acquire', 'transfer', 'deploy'];
function activateMethod(button) {
  $$('[data-method]').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); });
  $$('[data-method-panel]').forEach((panel) => { panel.hidden = panel.dataset.methodPanel !== button.dataset.method; });
  $('#methodProgress').textContent = `${String(methodOrder.indexOf(button.dataset.method) + 1).padStart(2, '0')} / 03`;
  UpcastMotion.mountMethod(button.dataset.method);
}
function bindMotionTour({ kind, order, tabSelector, buttonSelector, canvasSelector, observerSelector, threshold, activate }) {
  const button = $(buttonSelector);
  const keyOf = (tab) => tab.dataset[kind === 'idea' ? 'idea' : 'method'];
  const currentTab = () => $(`${tabSelector}.active`);
  const duration = (key) => UpcastMotion.duration(kind, key) * 1000;
  let timer = null;
  let deadline = 0;
  let remaining = null;
  let seen = false;
  let userStopped = false;
  let completed = false;
  let replayOnStart = false;

  const setButton = (playing) => {
    button.innerHTML = icon(playing ? 'pause' : 'play');
    button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${kind === 'idea' ? 'guided' : 'method'} walkthrough`);
    lucide.createIcons();
  };
  const pause = (manual = false) => {
    if (timer) {
      remaining = Math.max(0, deadline - performance.now());
      clearTimeout(timer);
      timer = null;
    }
    setMotionPlayback(canvasSelector, false);
    if (manual) userStopped = true;
    setButton(false);
  };
  const schedule = () => {
    setMotionPlayback(canvasSelector, true);
    setButton(true);
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      remaining = null;
      const index = order.indexOf(keyOf(currentTab()));
      if (index === order.length - 1) {
        completed = true;
        pause();
        return;
      }
      const next = $(`${tabSelector}[data-${kind}="${order[index + 1]}"]`);
      activate(next);
      remaining = duration(order[index + 1]);
      schedule();
    }, remaining);
  };
  const play = () => {
    if (timer) return;
    if (!$(canvasSelector)) activate(currentTab());
    if (completed || replayOnStart) {
      const tab = completed ? $(`${tabSelector}[data-${kind}="${order[0]}"]`) : currentTab();
      activate(tab);
      remaining = duration(keyOf(tab));
      completed = false;
      replayOnStart = false;
    } else if (remaining === null) {
      remaining = duration(keyOf(currentTab()));
    }
    userStopped = false;
    schedule();
  };

  $$(tabSelector).forEach((tab) => tab.addEventListener('click', () => {
    seen = true;
    pause(true);
    activate(tab);
    remaining = null;
    completed = false;
    replayOnStart = true;
  }));
  button.addEventListener('click', () => {
    seen = true;
    if (timer) pause(true);
    else play();
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    activate($(`${tabSelector}[data-${kind}="${order[0]}"]`));
    return;
  }
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (!seen) {
        seen = true;
        activate($(`${tabSelector}[data-${kind}="${order[0]}"]`));
        remaining = duration(order[0]);
        play();
      } else if (!userStopped && !completed && !timer && remaining !== null) {
        play();
      }
    } else if (timer) {
      pause();
    }
  }, { threshold }).observe($(observerSelector));
}
bindMotionTour({ kind: 'idea', order: ideaOrder, tabSelector: '[data-idea]', buttonSelector: '#ideaAuto', canvasSelector: '#ideaPanelArt .motion-canvas', observerSelector: '#ideaPanel', threshold: .28, activate: activateIdea });
bindMotionTour({ kind: 'method', order: methodOrder, tabSelector: '[data-method]', buttonSelector: '#methodAuto', canvasSelector: '[data-method-panel]:not([hidden]) .motion-canvas', observerSelector: '#methodStage', threshold: .22, activate: activateMethod });
const featureExplanations = {
  page: 'PAGE-4D provides geometry features and point maps that anchor the shared physical vocabulary.',
  dino: 'DINOv2 supplies patch-level visual structure to the continuous appearance path and the visual reconstruction target.',
  vjepa: 'V-JEPA supplies a frozen spatiotemporal predictive regularizer during training; it is not an inference module or a third latent branch.'
};
$$('[data-feature]').forEach((button) => button.addEventListener('click', () => {
  $('#featureExplain').textContent = featureExplanations[button.dataset.feature];
  $$('[data-feature]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
}));

const stageMetrics = {
  fvd: { name: 'FVD', values: [869.8, 674.4, 708.9, 707.5], digits: 1, note: 'Unified-space learning improves FVD; the backbone-only handoff retains most of that gain.' },
  jedi: { name: 'JEDi', values: [7.88, 6.59, 6.05, 5.90], digits: 2, note: 'JEDi improves at each stage, including after backbone consolidation and generated-history refinement.' },
  psnr: { name: 'PSNR', values: [13.78, 14.22, 14.29, 14.30], digits: 2, note: 'PSNR rises with unified-space learning and remains improved after the auxiliary branches are removed.' }
};
const stageNames = [['Video', 'backbone'], ['Unified-space', 'learning'], ['Backbone', 'consolidation'], ['Rollout', 'refinement']];
function renderStagePlot(metric) {
  const { name, values, digits, note } = stageMetrics[metric];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const margin = (high - low) * .18;
  const min = low - margin;
  const max = high + margin;
  const xs = [105, 365, 625, 885];
  const ys = values.map((value) => 33 + (max - value) / (max - min) * 143);
  const points = xs.map((x, index) => `${x},${ys[index].toFixed(1)}`).join(' ');
  const guides = [33, 104.5, 176].map((y, index) => `<line x1="76" y1="${y}" x2="920" y2="${y}" class="stage-guide"/><text x="63" y="${y + 4}" text-anchor="end" class="stage-axis">${(max - (max - min) * index / 2).toFixed(digits)}</text>`).join('');
  $('#stagePlot').innerHTML = `${guides}<polyline class="stage-plot-line" points="${points}" fill="none"/>${xs.map((x, index) => `<g class="stage-point" style="--stage-delay:${(.2 + index * .22).toFixed(2)}s"><circle cx="${x}" cy="${ys[index].toFixed(1)}" r="6"/><text x="${x}" y="${Math.max(20, ys[index] - 17).toFixed(1)}" class="stage-value" text-anchor="middle">${values[index].toFixed(digits)}</text><text x="${x}" y="211" class="stage-name" text-anchor="middle">${stageNames[index][0]}<tspan x="${x}" dy="18">${stageNames[index][1]}</tspan></text></g>`).join('')}`;
  $('#stagePlot').setAttribute('aria-label', `${name} across four training stages: ${values.map((value) => value.toFixed(digits)).join(', ')}`);
  $('#stagePlotNote').textContent = note;
  $$('[data-stage-metric]').forEach((button) => { button.classList.toggle('active', button.dataset.stageMetric === metric); button.setAttribute('aria-pressed', String(button.dataset.stageMetric === metric)); });
}
$$('[data-stage-metric]').forEach((button) => button.addEventListener('click', () => renderStagePlot(button.dataset.stageMetric)));
renderStagePlot('fvd');

const geometryFrames = [2, 9, 17, 25, 33, 41, 49, 57, 64];
const geometryCompare = $('#geometryCompare');
const geoHandle = $('#geoHandle');
let geometryView = 'error';
let geometryScene = 'hallway';
const geometryScenes = {
  hallway: { title: 'Tiled doorway', note: 'The floor and door boundaries retain more of the sensor-referenced layout.' },
  poster: { title: 'Floor poster', note: 'The poster outline and surrounding floor plane provide a compact test of the reconstructed surface.' }
};
function updateGeometryFrame() {
  const frame = geometryFrames[Number($('#geoFrameRange').value)];
  const name = String(frame).padStart(2, '0');
  $('#geoFrameLabel').textContent = `FRAME ${name} / 64`;
  $('#geoOurs').src = `assets/media/geometry-${geometryScene}-upcast-${geometryView}-${name}.jpg`;
  $('#geoGF').src = `assets/media/geometry-${geometryScene}-geometry-forcing-${geometryView}-${name}.jpg`;
  $('#geoOursFull').src = $('#geoOurs').src;
  $('#geoGFFull').src = $('#geoGF').src;
  $('#geoReference').src = `assets/media/geometry-${geometryScene}-reference-rgb-${name}.jpg`;
  $('#geoReference').alt = `Reference RGB at frame ${frame}`;
  $('#geoSensor').src = `assets/media/geometry-${geometryScene}-reference-depth-${name}.jpg`;
  $('#geoSensor').alt = `Sensor depth at frame ${frame}`;
  $('#geoOursFull').alt = `Complete UPCAST ${geometryView} frame ${frame}`;
  $('#geoGFFull').alt = `Complete Geometry Forcing ${geometryView} frame ${frame}`;
  $('#depthLegend').hidden = geometryView !== 'error';
}
$('#geoFrameRange').addEventListener('input', updateGeometryFrame);
$$('[data-geo-scene]').forEach((button) => button.addEventListener('click', () => {
  geometryScene = button.dataset.geoScene;
  $$('[data-geo-scene]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  $('#geoSceneTitle').textContent = geometryScenes[geometryScene].title;
  $('#geoSceneNote').textContent = `${geometryScenes[geometryScene].note} Values compare UPCAST / Geometry Forcing on this clip.`;
  const data = window.UPCAST_GEOMETRY[geometryScene];
  $('#geoSceneAbsRel').innerHTML = `${data.upcast.absRel.toFixed(3)} <em>/ ${data['geometry-forcing'].absRel.toFixed(3)}</em>`;
  $('#geoSceneFscore').innerHTML = `${data.upcast.fscore.toFixed(3)} <em>/ ${data['geometry-forcing'].fscore.toFixed(3)}</em>`;
  updateGeometryFrame();
}));
$$('[data-geo-view]').forEach((button) => button.addEventListener('click', () => {
  geometryView = button.dataset.geoView;
  $$('[data-geo-view]').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', String(tab === button)); });
  updateGeometryFrame();
}));
function setGeometrySplit(value) {
  const split = Math.max(5, Math.min(95, Math.round(value)));
  geometryCompare.style.setProperty('--split', `${split}%`);
  geoHandle.setAttribute('aria-valuenow', String(split));
  geoHandle.setAttribute('aria-valuetext', `${split}% UPCAST, ${100 - split}% Geometry Forcing`);
}
let draggingGeometry = false;
function dragGeometry(event) {
  const bounds = geometryCompare.getBoundingClientRect();
  setGeometrySplit((event.clientX - bounds.left) / bounds.width * 100);
}
geometryCompare.addEventListener('pointerdown', (event) => { draggingGeometry = true; geometryCompare.setPointerCapture(event.pointerId); dragGeometry(event); });
geometryCompare.addEventListener('pointermove', (event) => { if (draggingGeometry) dragGeometry(event); });
geometryCompare.addEventListener('pointerup', () => { draggingGeometry = false; });
geometryCompare.addEventListener('pointercancel', () => { draggingGeometry = false; });
geoHandle.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const value = Number(geoHandle.getAttribute('aria-valuenow'));
  setGeometrySplit(event.key === 'Home' ? 5 : event.key === 'End' ? 95 : value + (event.key === 'ArrowRight' ? 5 : -5));
});

const chart = $('#driftChart');
const svgNS = 'http://www.w3.org/2000/svg';
let chartData;
function svgNode(tag, attributes = {}) {
  const node = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  chart.append(node);
  return node;
}
function drawChart() {
  if (!chartData) return;
  const { upcast, geometryForcing, frames } = chartData.short;
  const W = 1000, H = 258, L = 43, R = 12, T = 13, B = 28;
  const both = [...upcast.slice(1), ...geometryForcing.slice(1)];
  const min = Math.floor(Math.min(...both) - .5), max = Math.ceil(Math.max(...both) + .5);
  const x = (index) => L + (index - 1) / (frames - 2) * (W - L - R);
  const y = (value) => T + (max - value) / (max - min) * (H - T - B);
  chart.replaceChildren(); chart.setAttribute('viewBox', `0 0 ${W} ${H}`);
  for (let value = Math.ceil(min / 2) * 2; value <= max; value += 2) {
    const height = y(value);
    svgNode('line', { x1: L, y1: height, x2: W - R, y2: height, stroke: '#527064', 'stroke-opacity': '.55', 'stroke-width': 1 });
    svgNode('text', { x: L - 12, y: height + 3, 'text-anchor': 'end', fill: '#9fb6a5', 'font-size': 11, 'font-family': 'Manrope, Arial' }).textContent = String(value);
  }
  [2, 16, 32, 48, 64].forEach((frame) => {
    svgNode('text', { x: x(frame - 1), y: H - 2, 'text-anchor': frame === 2 ? 'start' : frame === frames ? 'end' : 'middle', fill: '#9fb6a5', 'font-size': 11, 'font-family': 'Manrope, Arial' }).textContent = String(frame);
  });
  const path = (values) => values.slice(1).map((value, offset) => `${offset ? 'L' : 'M'}${x(offset + 1).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  svgNode('path', { d: path(geometryForcing), fill: 'none', stroke: '#e6ad71', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' });
  svgNode('path', { d: path(upcast), fill: 'none', stroke: '#8edcad', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' });
  const marker = svgNode('line', { x1: L, y1: T, x2: L, y2: H - B, stroke: '#eaf4e8', 'stroke-opacity': '.7', 'stroke-width': 1, visibility: 'hidden' });
  const dotOurs = svgNode('circle', { r: 5, fill: '#8edcad', visibility: 'hidden' });
  const dotGF = svgNode('circle', { r: 5, fill: '#e6ad71', visibility: 'hidden' });
  const label = svgNode('text', { fill: '#e9f3e8', 'font-size': 12, 'font-weight': 700, 'font-family': 'Manrope, Arial', visibility: 'hidden' });
  chart.onpointermove = (event) => {
    const box = chart.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width * W;
    const index = Math.max(1, Math.min(frames - 1, Math.round((px - L) / (W - L - R) * (frames - 2)) + 1));
    const pointX = x(index);
    marker.setAttribute('x1', pointX); marker.setAttribute('x2', pointX);
    dotOurs.setAttribute('cx', pointX); dotOurs.setAttribute('cy', y(upcast[index]));
    dotGF.setAttribute('cx', pointX); dotGF.setAttribute('cy', y(geometryForcing[index]));
    label.setAttribute('x', Math.min(pointX + 9, W - 175)); label.setAttribute('y', 20);
    label.textContent = `F${index + 1}  ${upcast[index].toFixed(1)} / ${geometryForcing[index].toFixed(1)} dB`;
    [marker, dotOurs, dotGF, label].forEach((node) => node.setAttribute('visibility', 'visible'));
  };
  chart.onpointerleave = () => [marker, dotOurs, dotGF, label].forEach((node) => node.setAttribute('visibility', 'hidden'));
}
chartData = window.UPCAST_CURVES;
if (chartData) drawChart();
else chart.outerHTML = '<p>Chart data unavailable.</p>';

const horizonResults = {
  64: [
    ['DFoT', '654.0', '69.46', '0.440', '0.474', '13.64', '5.65', '0.176'],
    ['REPA', '643.6', '69.42', '0.457', '0.463', '13.33', '6.77', '0.283'],
    ['VideoREPA', '795.4', '76.09', '0.485', '0.410', '11.48', '9.98', '0.282'],
    ['Geometry Forcing', '534.9', '65.15', '0.391', '0.522', '12.44', '4.40', '0.192'],
    ['UPCAST', '497.8', '61.26', '0.396', '0.498', '13.94', '3.88', '0.161']
  ],
  128: [
    ['DFoT', '1136.3', '153.9', '0.608', '0.362', '10.91', '–', '–'],
    ['REPA', '1258.5', '162.2', '0.632', '0.312', '10.31', '–', '–'],
    ['VideoREPA', '1068.1', '142.9', '0.619', '0.290', '9.75', '–', '–'],
    ['Geometry Forcing', '924.7', '128.1', '0.549', '0.408', '9.13', '–', '–'],
    ['UPCAST', '803.6', '136.5', '0.541', '0.390', '11.28', '–', '–']
  ],
  256: [
    ['DFoT', '1711.5', '214.0', '0.717', '0.298', '9.32', '18.88', '–'],
    ['REPA', '2065.9', '220.0', '0.750', '0.238', '8.77', '32.68', '–'],
    ['VideoREPA', '1378.0', '201.7', '0.705', '0.237', '8.88', '16.22', '–'],
    ['Geometry Forcing', '1221.7', '175.1', '0.643', '0.373', '7.73', '15.45', '–'],
    ['UPCAST', '1217.6', '189.7', '0.664', '0.340', '9.59', '12.83', '–']
  ]
};
function markTableBest(table) {
  const headers = Array.from(table.tHead.rows[0].cells).slice(1);
  const rows = Array.from(table.tBodies[0].rows);
  headers.forEach((header, index) => {
    const ascending = header.textContent.includes('↓');
    const descending = header.textContent.includes('↑');
    if (!ascending && !descending) return;
    const cells = rows.map((row) => row.cells[index + 1]);
    const values = cells.map((cell) => Number.parseFloat(cell.textContent));
    const valid = values.filter(Number.isFinite);
    if (!valid.length) return;
    const best = ascending ? Math.min(...valid) : Math.max(...valid);
    cells.forEach((cell, rowIndex) => {
      cell.classList.toggle('metric-best', values[rowIndex] === best);
    });
  });
}
function showHorizon(horizon) {
  const rows = horizonResults[horizon];
  const tbody = $('#horizonTable tbody');
  tbody.replaceChildren();
  rows.forEach(([method, ...values]) => {
    const row = document.createElement('tr');
    if (method === 'UPCAST') row.className = 'ours-row';
    const name = document.createElement('th');
    name.scope = 'row';
    name.textContent = method;
    row.append(name);
    values.forEach((value) => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); });
    tbody.append(row);
  });
  markTableBest($('#horizonTable'));
  $('#horizonCaption').textContent = `${horizon}-frame rollouts · ${horizon === '64' ? '100' : '12'} matched videos`;
  $('#horizonNote').textContent = horizon === '64'
    ? 'Bold marks the best displayed value per metric. RPE uses the first 12 primary-test videos; other columns use all 100.'
    : 'Bold marks the best displayed value per metric. Separate 12-video stress cohort; dashes indicate unreported metrics.';
  $$('[data-horizon]').forEach((button) => { const active = button.dataset.horizon === String(horizon); button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
}
$$('[data-horizon]').forEach((button) => button.addEventListener('click', () => showHorizon(button.dataset.horizon)));
showHorizon(64);
$$('.results-table:not(#horizonTable)').forEach(markTableBest);

const dialog = $('#figureDialog');
$$('[data-figure]').forEach((button) => button.addEventListener('click', () => {
  $('#figureDialogImage').src = button.dataset.figure;
  $('#figureDialogImage').alt = button.closest('.figure-shell').querySelector('img').alt;
  dialog.showModal();
}));
$('#figureClose').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) $('.hero-video').pause();
