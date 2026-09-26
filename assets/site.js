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
$$('[data-idea]').forEach((button) => button.addEventListener('click', () => {
  const step = ideaSteps[button.dataset.idea];
  $('#ideaPanelImage').src = `assets/media/${step.image}`;
  $('#ideaPanelImage').alt = step.alt;
  $('#ideaPanelNumber').textContent = step.number;
  $('#ideaPanelTitle').textContent = step.title;
  $('#ideaPanelText').textContent = step.text;
  $('#ideaPanelKey').textContent = step.key;
  $$('[data-idea]').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); });
}));

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
  const wasPlaying = compare.playing;
  compare.setPlaying(false);
  $$('.scene-pick').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  const scene = button.dataset.scene;
  compareVideos.forEach((video, index) => setSource(video, `assets/media/${scene}-${roleNames[index]}.mp4`, `assets/media/${scene}-${roleNames[index]}.jpg`));
  $('#compareSeek').value = 0;
  $('#compareFrame').textContent = 'FRAME 01 / 64';
  if (wasPlaying) compareVideos[0].addEventListener('loadedmetadata', () => compare.setPlaying(true), { once: true });
}));
$$('[data-method]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-method]').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-selected', String(tab === button)); });
  $$('[data-method-panel]').forEach((panel) => { panel.hidden = panel.dataset.methodPanel !== button.dataset.method; });
}));
const featureExplanations = {
  page: 'PAGE-4D provides geometry features and point maps that anchor the shared physical vocabulary.',
  dino: 'DINOv2 supplies patch-level visual structure to the continuous appearance path and the visual reconstruction target.',
  vjepa: 'V-JEPA supplies a frozen spatiotemporal predictive regularizer during training; it is not an inference module or a third latent branch.'
};
$$('[data-feature]').forEach((button) => button.addEventListener('click', () => {
  $('#featureExplain').textContent = featureExplanations[button.dataset.feature];
  $$('[data-feature]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
}));

const geometryFrames = [2, 9, 17, 25, 33, 41, 49, 57, 64];
const geometryCompare = $('#geometryCompare');
const geoHandle = $('#geoHandle');
let geometryView = 'rgb';
function updateGeometryFrame() {
  const frame = geometryFrames[Number($('#geoFrameRange').value)];
  const name = String(frame).padStart(2, '0');
  $('#geoFrameLabel').textContent = `FRAME ${name} / 64`;
  $('#geoOurs').src = `assets/media/geometry-upcast-${geometryView}-${name}.jpg`;
  $('#geoGF').src = `assets/media/geometry-geometry-forcing-${geometryView}-${name}.jpg`;
  $('#geoOursFull').src = $('#geoOurs').src;
  $('#geoGFFull').src = $('#geoGF').src;
  $('#geoReference').src = `assets/media/geometry-reference-${name}.jpg`;
  $('#geoReference').alt = `Reference ARKitScenes frame ${frame}`;
  $('#geoOursFull').alt = `Complete UPCAST ${geometryView} frame ${frame}`;
  $('#geoGFFull').alt = `Complete Geometry Forcing ${geometryView} frame ${frame}`;
}
$('#geoFrameRange').addEventListener('input', updateGeometryFrame);
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

const dialog = $('#figureDialog');
$$('[data-figure]').forEach((button) => button.addEventListener('click', () => {
  $('#figureDialogImage').src = button.dataset.figure;
  $('#figureDialogImage').alt = button.closest('.figure-shell').querySelector('img').alt;
  dialog.showModal();
}));
$('#figureClose').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) $('.hero-video').pause();
