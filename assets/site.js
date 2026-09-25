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
  seek.addEventListener('input', () => {
    const time = Number(seek.value) / fps;
    videos.forEach((video) => { if (video.readyState >= 1) video.currentTime = time; });
    update();
  });
  videos[0].addEventListener('timeupdate', () => { if (!playing) update(); });
  return { get playing() { return playing; }, setPlaying };
}

const compareVideos = [$('#compareRef'), $('#compareOurs'), $('#compareGF')];
const compare = player({ videos: compareVideos, playButton: $('#comparePlay'), seek: $('#compareSeek'), counter: $('#compareFrame'), frames: 64 });
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
player({ videos: [$('#horizonOurs')], playButton: $('#horizonPlay'), seek: $('#horizonSeek'), counter: $('#horizonFrame'), frames: 256 });

const factorStage = $('#factorStage');
const factorSplit = $('#factorSplit');
$('#factorRGB').addEventListener('timeupdate', () => {
  if (Math.abs($('#factorDepth').currentTime - $('#factorRGB').currentTime) > .25 && $('#factorDepth').readyState >= 2) $('#factorDepth').currentTime = $('#factorRGB').currentTime;
});
const descriptions = {
  physical: 'Geometry-compatible transition information is anchored by a shared codebook.',
  appearance: 'A continuous private pathway retains complementary visual detail, with DINOv2 semantic features during training.',
  unified: 'A structural depth view and full RGB appearance meet in the predictive visual state.'
};
function updateFactorSplit() {
  const split = Number(factorSplit.value);
  factorStage.querySelector('.factor-rgb').style.clipPath = `inset(0 0 0 ${split}%)`;
  factorStage.querySelector('.factor-divider').style.left = `${split}%`;
}
factorSplit.addEventListener('input', updateFactorSplit);
$$('.mode-tab').forEach((button) => button.addEventListener('click', () => {
  const mode = button.dataset.mode;
  factorStage.dataset.mode = mode;
  factorSplit.disabled = mode !== 'unified';
  if (mode === 'unified') updateFactorSplit();
  if (mode === 'physical') factorStage.querySelector('.factor-rgb').style.clipPath = 'inset(0 0 0 100%)';
  if (mode === 'appearance') factorStage.querySelector('.factor-rgb').style.clipPath = 'inset(0 0 0 0)';
  $('#modeDescription').textContent = descriptions[mode];
  $$('.mode-tab').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', String(tab === button)); });
}));

const geometryVideos = [$('#geoOurs'), $('#geoGF')];
geometryVideos[0].addEventListener('timeupdate', () => {
  if (Math.abs(geometryVideos[0].currentTime - geometryVideos[1].currentTime) > .25 && geometryVideos[1].readyState >= 2) geometryVideos[1].currentTime = geometryVideos[0].currentTime;
});
$$('[data-geo-view]').forEach((button) => button.addEventListener('click', () => {
  const view = button.dataset.geoView;
  if (button.classList.contains('active')) return;
  const time = geometryVideos[0].currentTime;
  geometryVideos.forEach((video, index) => {
    const method = index === 0 ? 'upcast' : 'geometry-forcing';
    setSource(video, `assets/media/geometry-${method}-${view}.mp4`, `assets/media/geometry-${method}-${view}.jpg`);
    video.addEventListener('loadedmetadata', () => { video.currentTime = time; video.play().catch(() => {}); }, { once: true });
  });
  $$('[data-geo-view]').forEach((tab) => { tab.classList.toggle('active', tab === button); tab.setAttribute('aria-pressed', String(tab === button)); });
}));

const chart = $('#driftChart');
const svgNS = 'http://www.w3.org/2000/svg';
let chartData, chartMode = 'short';
function svgNode(tag, attributes = {}) {
  const node = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  chart.append(node);
  return node;
}
function drawChart() {
  if (!chartData) return;
  const { upcast, geometryForcing, frames } = chartData[chartMode];
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
  (frames === 64 ? [2, 16, 32, 48, 64] : [2, 64, 128, 192, 256]).forEach((frame) => {
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
$$('[data-chart]').forEach((button) => button.addEventListener('click', () => {
  chartMode = button.dataset.chart;
  $$('[data-chart]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  drawChart();
}));

const dialog = $('#figureDialog');
$$('[data-figure]').forEach((button) => button.addEventListener('click', () => {
  $('#figureDialogImage').src = button.dataset.figure;
  $('#figureDialogImage').alt = button.closest('.figure-shell').querySelector('img').alt;
  dialog.showModal();
}));
$('#figureClose').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) $$('.hero-video, .factor-stage video, .geometry-videos video').forEach((video) => video.pause());
