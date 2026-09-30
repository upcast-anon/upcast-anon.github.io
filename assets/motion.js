const UpcastMotion = (() => {
  const colors = { blue: '#3e78a5', green: '#2e8067', orange: '#b7763e', gold: '#ae891d', purple: '#80649c', ink: '#263239' };
  const frame = (x, y, size, file, label, delay = 0) => `
    <g class="motion-rise" style="--delay:${delay}s">
      <rect x="${x - 3}" y="${y - 3}" width="${size + 6}" height="${size + 6}" fill="#fff" stroke="#a8b9ba"/>
      <image href="assets/media/${file}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/>
      <text x="${x + size / 2}" y="${y + size + 25}" text-anchor="middle" class="motion-math">${label}</text>
    </g>`;
  const cube = (x, y, size, kind, label, delay = 0) => {
    const c = kind === 'green' ? ['#d7e9e1', '#b6d5c9', '#e8f2ed', colors.green] : ['#d8e8f3', '#b3cfdf', '#eaf2f7', colors.blue];
    const d = size * .18;
    const lines = [1, 2].map((n) => `<path d="M${x + n * size / 3} ${y + d}v${size} M${x} ${y + d + n * size / 3}h${size}" stroke="${c[3]}" stroke-width="1.3"/>`).join('');
    return `<g class="motion-rise" style="--delay:${delay}s"><path d="M${x} ${y + d}l${d} -${d}h${size}l-${d} ${d}Z" fill="${c[2]}" stroke="${c[3]}" stroke-width="1.5"/><path d="M${x + size} ${y + d}l${d} -${d}v${size}l-${d} ${d}Z" fill="${c[1]}" stroke="${c[3]}" stroke-width="1.5"/><rect x="${x}" y="${y + d}" width="${size}" height="${size}" fill="${c[0]}" stroke="${c[3]}" stroke-width="1.5"/>${lines}<text x="${x + size / 2}" y="${y + size + d + 29}" text-anchor="middle" class="motion-math" fill="${c[3]}">${label}</text></g>`;
  };
  const trace = (d, color, delay = 0, width = 2.7, dashed = false) => {
    const line = `<path class="motion-trace${dashed ? ' dashed' : ''}" style="--delay:${delay}s" d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    return dashed ? `${line}<path class="motion-dashed-final" d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-dasharray="10 7" stroke-linecap="round"/>` : line;
  };
  const label = (x, y, content, color = colors.ink, extra = '', delay = 0) => `<text x="${x}" y="${y}" style="fill:${color};--delay:${delay}s" class="motion-label ${extra}">${content}</text>`;
  const box = (x, y, w, h, title, sub, tone, delay = 0) => `<g class="motion-rise" style="--delay:${delay}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="var(--${tone}-pale)" stroke="var(--${tone})" stroke-width="2"/><text x="${x + w / 2}" y="${y + 30}" text-anchor="middle" class="motion-box-title" fill="var(--${tone})">${title}</text>${sub ? `<text x="${x + w / 2}" y="${y + (title.includes('<tspan') ? h >= 80 ? 64 : 55 : 51)}" text-anchor="middle" class="motion-box-sub">${sub}</text>` : ''}</g>`;
  const tokens = (x, y, count, tone, delay = 0, rows = 1) => {
    const columns = Math.ceil(count / rows);
    const cells = Array.from({ length: count }, (_, n) => {
      const cx = x + (n % columns) * 30;
      const cy = y + Math.floor(n / columns) * 30;
      return `<rect class="motion-rise" style="--delay:${(delay + n * .075).toFixed(3)}s" x="${cx}" y="${cy}" width="23" height="23" rx="2" fill="${n % 3 === 1 ? `var(--${tone}-mid)` : `var(--${tone}-pale)`}" stroke="var(--${tone})" stroke-width="1.5"/>`;
    }).join('');
    return `<g>${cells}</g>`;
  };
  const root = (content, wide = false, title = '') => `<svg class="motion-svg" viewBox="0 0 ${wide ? 1100 : 900} ${wide ? 420 : 470}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
  const durations = {
    idea: { alignment: 3.9, factorized: 4.8, generation: 4.9 },
    method: { acquire: 5.85, transfer: 5.0, deploy: 5.0 }
  };

  const idea = {
    alignment: () => root(`
      ${label(45, 52, 'OBSERVATIONS', '#70817e', 'motion-kicker')}
      ${label(461, 52, 'COMPLEMENTARY REPRESENTATIONS', '#70817e', 'motion-kicker')}
      ${frame(66, 118, 108, 'method-frame-i.jpg', 'xᵢ', .1)}
      ${frame(66, 273, 108, 'method-frame-j.jpg', 'xⱼ', .32)}
      <path d="M214 170v159" stroke="#a9b9b6" stroke-width="1.7" fill="none" class="motion-rise" style="--delay:.45s"/>
      ${trace('M215 248H310C362 248 356 143 445 143H558', colors.green, .75)}
      ${trace('M215 248H310C362 248 356 330 445 330H558', colors.blue, 1.1)}
      ${label(369, 102, 'STRUCTURE', colors.green, 'motion-kicker motion-rise', .8)}
      ${label(369, 399, 'VISUAL DETAIL', colors.blue, 'motion-kicker motion-rise', 1.15)}
      ${cube(595, 94, 91, 'green', 'Z<tspan baseline-shift="sub" font-size="16">g</tspan>', 1.55)}
      ${cube(595, 280, 91, 'blue', 'H<tspan baseline-shift="sub" font-size="16">θ</tspan>', 1.85)}
      <g class="motion-rise" style="--delay:2.45s"><line x1="749" y1="95" x2="749" y2="391" stroke="#d9e3df" stroke-width="1.4"/><text x="778" y="216" class="motion-small">Same scene,</text><text x="778" y="239" class="motion-small">different</text><text x="778" y="262" class="motion-small">predictive roles</text></g>`, false, 'The same observed frame pair feeds a geometry view and a visual representation.'),
    factorized: () => root(`
      ${label(42, 48, 'TWO TRANSITION PATHS', '#70817e', 'motion-kicker')}
      ${cube(62, 83, 69, 'green', 'geometry', .1)}
      ${cube(62, 279, 69, 'blue', 'video', .2)}
      ${label(239, 96, 'SHARED PHYSICAL', colors.green, 'motion-kicker')}
      ${label(239, 300, 'PRIVATE APPEARANCE', colors.orange, 'motion-kicker')}
      ${trace('M150 130H258', colors.green, .42)}
      ${trace('M150 328C221 328 186 181 258 181', colors.blue, .65)}
      ${trace('M150 328H258', colors.orange, .8)}
      <g class="motion-rise" style="--delay:1s"><rect x="267" y="119" width="238" height="91" rx="4" fill="#e9f4ee" stroke="#a7cbb9"/><text x="283" y="144" class="motion-small" fill="${colors.green}">Shared RVQ</text></g>
      ${tokens(283, 158, 6, 'green', 1.2, 1)}
      <g class="motion-rise" style="--delay:1.2s"><rect x="267" y="307" width="238" height="70" rx="4" fill="#fcf1e7" stroke="#e2c09e"/><text x="283" y="331" class="motion-small" fill="${colors.orange}">Continuous path</text></g>
      ${tokens(283, 344, 6, 'orange', 1.45, 1)}
      ${label(522, 175, 'Q', colors.green, 'motion-symbol motion-rise', 1.62)}
      ${label(522, 365, 'A', colors.orange, 'motion-symbol motion-rise', 1.82)}
      ${trace('M547 168C596 168 575 226 627 226H674', colors.green, 2.0)}
      ${trace('M547 357C596 357 575 273 627 273H674', colors.orange, 2.25)}
      ${box(681, 198, 123, 105, 'U', 'coupled state', 'gold', 3.0)}
      ${label(688, 336, 'invertible additive coupling', '#82908a', 'motion-small motion-rise', 3.34)}`, false, 'Geometry and video inform a shared physical code Q; video also informs private appearance A; coupling gives visual state U.'),
    generation: () => root(`
      ${label(45, 55, 'DEPLOYMENT PATH', '#70817e', 'motion-kicker')}
      ${frame(70, 175, 118, 'method-frame-i.jpg', 'input xᵢ', .1)}
      ${box(72, 75, 152, 70, 'Camera', 'controls', 'blue', .35)}
      ${trace('M224 116C270 116 268 185 303 185', colors.blue, .65)}
      ${trace('M192 234H303', colors.blue, .58)}
      ${box(310, 155, 217, 156, 'DFoT', 'consolidated backbone', 'blue', .92)}
      <g class="motion-rise" style="--delay:1.4s">${[0, 1, 2, 3, 4].map((n) => `<rect x="${333 + n * 35}" y="256" width="22" height="22" fill="${n % 2 ? '#e7f0f5' : '#b3ccdb'}" stroke="${colors.blue}"/>`).join('')}</g>
      ${trace('M527 234H584', colors.blue, 1.65)}
      ${frame(600, 157, 81, 'timeline-16.jpg', '16', 2.0)}
      ${frame(688, 157, 81, 'timeline-32.jpg', '32', 2.45)}
      ${frame(776, 157, 81, 'timeline-64.jpg', '64', 2.9)}
      <g class="motion-rise" style="--delay:3.4s"><line x1="311" y1="376" x2="858" y2="376" stroke="#c7d7d0" stroke-width="1.5"/><text x="584" y="408" text-anchor="middle" class="motion-small">No geometry encoder, codebook, or conditioner at inference</text></g>`, false, 'A camera-conditioned input enters the consolidated DFoT backbone and produces RGB video without auxiliary modules.')
  };

  const method = {
    acquire: () => root(`
      ${label(28, 44, 'PAIRED OBSERVATIONS', '#71817f', 'motion-kicker')}
      ${frame(43, 106, 82, 'method-frame-i.jpg', 'xᵢ', .05)}
      ${frame(43, 236, 82, 'method-frame-j.jpg', 'xⱼ', .18)}
      ${box(184, 98, 142, 62, 'PAGE-4D', 'frozen geometry', 'green', .35)}
      ${box(184, 207, 142, 62, 'DFoT', 'video features', 'blue', .5)}
      ${box(184, 316, 142, 62, 'DINOv2', 'frozen visual', 'orange', .65)}
      ${trace('M128 161H174', colors.green, .3)}${trace('M128 161C158 161 149 237 174 237', colors.blue, .45)}${trace('M128 281C157 281 150 347 174 347', colors.orange, .55)}
      ${trace('M326 129H375', colors.green, .85)}${trace('M326 238H375', colors.blue, 1)}${trace('M326 238C350 238 346 338 375 338', colors.blue, 1.1)}${trace('M326 347H375', colors.orange, 1.12)}
      ${box(382, 90, 112, 70, 'E<tspan baseline-shift="sub" font-size="16">g</tspan>', 'physical', 'green', 1.1)}
      ${box(382, 200, 112, 70, 'E<tspan baseline-shift="sub" font-size="16">v</tspan>', 'video', 'blue', 1.2)}
      ${box(382, 309, 112, 70, 'F<tspan baseline-shift="sub" font-size="16">a</tspan>', 'appearance fuse', 'orange', 1.32)}
      ${trace('M495 126C516 126 505 156 523 156', colors.green, 1.55)}
      ${trace('M495 235C518 235 507 187 523 187', colors.blue, 1.68)}
      ${box(530, 130, 92, 83, 'F<tspan baseline-shift="sub" font-size="16">p</tspan>', 'physical fuse', 'green', 1.83)}
      ${trace('M622 170H643', colors.green, 2.1)}
      ${box(650, 102, 130, 132, 'RVQ', 'shared across v/g/f', 'green', 2.31)}
      ${tokens(665, 176, 4, 'green', 2.56)}
      ${trace('M495 344H580C651 344 654 289 771 289H799', colors.orange, 2.16)}
      ${label(644, 331, 'A_f', colors.orange, 'motion-small motion-rise', 2.65)}
      ${trace('M780 170C807 170 792 248 799 248', colors.green, 2.7)}
      ${box(806, 225, 92, 91, 'U<tspan baseline-shift="sub" font-size="16">m</tspan>', 'coupling', 'gold', 3.1)}
      ${trace('M898 269H925', colors.gold, 3.23)}
      ${box(932, 224, 142, 92, 'D<tspan baseline-shift="sub" font-size="16">v</tspan>', 'visual future', 'blue', 3.58)}
      ${trace('M780 170C830 170 822 112 925 112', colors.green, 3.36)}
      ${box(932, 70, 142, 82, 'D<tspan baseline-shift="sub" font-size="16">g</tspan>', 'geometry future', 'green', 3.9)}
      <text x="770" y="395" text-anchor="middle" fill="#61716e" class="motion-small motion-rise" style="--delay:4.3s">Shared Q feeds geometry; coupled U feeds visual reconstruction</text>`, true, 'Paired frames provide video and geometry transitions; a fused physical path enters the shared RVQ while video and visual features form continuous appearance. Geometry reads Q; visual reconstruction reads coupled U.'),
    transfer: () => root(`
      ${label(35, 47, 'PAIRED PHYSICAL CODES', '#71817f', 'motion-kicker')}
      ${cube(57, 122, 76, 'green', 'Q<tspan baseline-shift="sub" font-size="16">v</tspan>', .12)}
      ${cube(57, 259, 76, 'green', 'Q<tspan baseline-shift="sub" font-size="16">f</tspan>', .28)}
      ${trace('M153 178C202 178 190 220 246 220', colors.green, .6)}
      ${trace('M153 315C202 315 190 251 246 251', colors.green, .72)}
      ${box(253, 181, 178, 103, 'Q<tspan baseline-shift="sub" font-size="16">f</tspan> − Q<tspan baseline-shift="sub" font-size="16">v</tspan>', 'paired innovation', 'purple', .96)}
      ${trace('M431 232H480', colors.purple, 1.28)}
      ${box(487, 168, 165, 129, 'Conditioner', 'training-time teacher', 'purple', 1.53)}
      ${trace('M652 232H716', colors.purple, 1.93, 2.8, true)}
      <g class="motion-rise" style="--delay:2.35s"><circle cx="751" cy="232" r="31" fill="#f2ecf7" stroke="${colors.purple}" stroke-width="2"/><path d="m739 231 9 9 16-19" fill="none" stroke="${colors.purple}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="750" y="299" text-anchor="middle" class="motion-small">valid FM gain</text></g>
      ${trace('M783 232H830', colors.purple, 2.68, 2.8, true)}
      ${box(837, 168, 214, 129, 'Student DFoT', 'backbone weight update', 'blue', 2.95)}
      <g class="motion-rise" style="--delay:3.45s"><line x1="837" y1="347" x2="1051" y2="347" stroke="#c3d4ce" stroke-width="1.5"/><text x="944" y="376" text-anchor="middle" class="motion-small">Auxiliary paths are removed after training</text></g>`, true, 'A paired innovation conditions a training-time teacher; selective distillation transfers valid corrections to the DFoT student.'),
    deploy: () => root(`
      ${label(37, 48, 'BACKBONE-ONLY INFERENCE', '#71817f', 'motion-kicker')}
      ${frame(65, 135, 116, 'method-frame-i.jpg', 'input frame', .1)}
      ${box(67, 50, 154, 70, 'Camera', 'controls', 'blue', .35)}
      ${trace('M221 89C266 89 264 160 285 160', colors.blue, .62)}
      ${trace('M190 202H285', colors.blue, .65)}
      ${box(292, 126, 267, 161, 'DFoT', 'consolidated video backbone', 'blue', 1.05)}
      <g class="motion-rise" style="--delay:1.43s">${[0, 1, 2, 3, 4, 5].map((n) => `<rect x="${317 + n * 36}" y="225" width="23" height="23" fill="${n % 2 ? '#e5eff5' : '#a9c9dc'}" stroke="${colors.blue}"/>`).join('')}</g>
      ${trace('M559 202H622', colors.blue, 1.7)}
      ${frame(638, 135, 100, 'timeline-16.jpg', '16', 2.05)}
      ${frame(754, 135, 100, 'timeline-32.jpg', '32', 2.55)}
      ${frame(870, 135, 100, 'timeline-64.jpg', '64', 3.05)}
      <g class="motion-rise" style="--delay:3.5s"><line x1="293" y1="343" x2="970" y2="343" stroke="#c3d6ce" stroke-width="1.5"/><text x="631" y="380" text-anchor="middle" class="motion-small">No PAGE-4D · no DINOv2 · no RVQ · no conditioner</text></g>`, true, 'At deployment, only the original camera-conditioned DFoT backbone generates an RGB rollout.')
  };

  function createViewport(canvasClass) {
    const viewport = document.createElement('div');
    viewport.className = 'motion-viewport';
    const canvas = document.createElement('div');
    canvas.className = `motion-canvas ${canvasClass}`;
    viewport.append(canvas);
    const controls = document.createElement('div');
    controls.className = 'motion-pan-nav';
    controls.innerHTML = `<button type="button" aria-label="Pan diagram left" title="Pan left"><i data-lucide="arrow-left" aria-hidden="true"></i></button><button type="button" aria-label="Pan diagram right" title="Pan right"><i data-lucide="arrow-right" aria-hidden="true"></i></button>`;
    const [left, right] = controls.querySelectorAll('button');
    const update = () => {
      left.disabled = viewport.scrollLeft <= 2;
      right.disabled = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2;
    };
    left.addEventListener('click', () => viewport.scrollBy({ left: -viewport.clientWidth * .8, behavior: 'smooth' }));
    right.addEventListener('click', () => viewport.scrollBy({ left: viewport.clientWidth * .8, behavior: 'smooth' }));
    viewport.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    requestAnimationFrame(update);
    return { viewport, canvas, controls, update };
  }

  function decorateArrows(canvas) {
    const svg = canvas.querySelector('svg');
    svg.querySelectorAll('.motion-trace').forEach((path) => {
      const length = path.getTotalLength();
      const duration = Math.min(.8, Math.max(.32, length / 270));
      const delay = parseFloat(path.style.getPropertyValue('--delay'));
      path.style.setProperty('--path-length', `${length.toFixed(2)}`);
      path.style.setProperty('--draw-duration', `${duration.toFixed(3)}s`);
      if (path.classList.contains('dashed')) {
        path.style.setProperty('--fade-delay', `${(delay + duration).toFixed(3)}s`);
        path.nextElementSibling.style.setProperty('--delay', `${(delay + duration).toFixed(3)}s`);
      }
      const end = path.getPointAtLength(length);
      const before = path.getPointAtLength(Math.max(0, length - 9));
      const angle = Math.atan2(end.y - before.y, end.x - before.x) * 180 / Math.PI;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arrow.setAttribute('d', 'M0 0 -9 -5 -9 5Z');
      arrow.setAttribute('transform', `translate(${end.x} ${end.y}) rotate(${angle})`);
      arrow.setAttribute('fill', path.getAttribute('stroke'));
      arrow.setAttribute('class', 'motion-arrow-arrive');
      arrow.style.setProperty('--delay', `${(delay + duration - .03).toFixed(3)}s`);
      svg.append(arrow);
    });
  }

  function mountIdea(key) {
    const art = document.querySelector('#ideaPanelArt');
    if (!art) return;
    let canvas = art.querySelector('.motion-canvas');
    if (!canvas) {
      const parts = createViewport('idea-motion');
      canvas = parts.canvas;
      art.append(parts.viewport, parts.controls);
      art.classList.add('is-enhanced');
      lucide.createIcons();
    } else {
      const fresh = canvas.cloneNode(false);
      fresh.classList.remove('is-paused');
      canvas.replaceWith(fresh);
      canvas = fresh;
    }
    canvas.innerHTML = idea[key]();
    canvas.style.setProperty('--sequence-duration', `${durations.idea[key]}s`);
    decorateArrows(canvas);
    canvas.parentElement.scrollLeft = 0;
  }
  function mountMethod(key) {
    const panel = document.querySelector(`[data-method-panel="${key}"]`);
    if (!panel) return;
    const legacy = panel.querySelector('.acquire-diagram, .transfer-diagram, .deploy-diagram');
    let canvas = panel.querySelector('.motion-canvas');
    if (!canvas) {
      const parts = createViewport('method-motion');
      canvas = parts.canvas;
      legacy.before(parts.viewport, parts.controls);
      panel.classList.add('is-enhanced');
      lucide.createIcons();
    } else {
      const fresh = canvas.cloneNode(false);
      fresh.classList.remove('is-paused');
      canvas.replaceWith(fresh);
      canvas = fresh;
    }
    canvas.innerHTML = method[key]();
    canvas.style.setProperty('--sequence-duration', `${durations.method[key]}s`);
    decorateArrows(canvas);
    canvas.parentElement.scrollLeft = 0;
  }
  return { mountIdea, mountMethod, duration: (kind, key) => durations[kind][key] };
})();
