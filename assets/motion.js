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
  const box = (x, y, w, h, title, sub, tone, delay = 0, compact = false) => `<g class="motion-rise" style="--delay:${delay}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="var(--${tone}-pale)" stroke="var(--${tone})" stroke-width="2"/><text x="${x + w / 2}" y="${y + 30}" text-anchor="middle" class="motion-box-title${compact ? ' compact' : ''}" fill="var(--${tone})">${title}</text>${sub ? `<text x="${x + w / 2}" y="${y + (title.includes('<tspan') ? h >= 80 ? 64 : 55 : 51)}" text-anchor="middle" class="motion-box-sub">${sub}</text>` : ''}</g>`;
  const tokens = (x, y, count, tone, delay = 0, rows = 1) => {
    const columns = Math.ceil(count / rows);
    const cells = Array.from({ length: count }, (_, n) => {
      const cx = x + (n % columns) * 30;
      const cy = y + Math.floor(n / columns) * 30;
      return `<rect class="motion-rise" style="--delay:${(delay + n * .075).toFixed(3)}s" x="${cx}" y="${cy}" width="23" height="23" rx="2" fill="${n % 3 === 1 ? `var(--${tone}-mid)` : `var(--${tone}-pale)`}" stroke="var(--${tone})" stroke-width="1.5"/>`;
    }).join('');
    return `<g>${cells}</g>`;
  };
  const root = (content, wide = false, title = '') => `<svg class="motion-svg" viewBox="0 0 ${wide ? 1400 : 900} ${wide ? 480 : 470}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
  const durations = {
    idea: { alignment: 3.9, factorized: 5.3, generation: 4.9 },
    method: { acquire: 8.0, transfer: 6.2, deploy: 5.1 }
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
      ${trace('M547 168C596 168 575 231 627 231H641', colors.green, 2.0)}
      ${trace('M547 357C596 357 575 279 627 279H641', colors.orange, 2.25)}
      ${box(648, 213, 112, 88, 'Coupling', 'invertible', 'purple', 2.9, true)}
      ${trace('M760 257H775', colors.gold, 3.35)}
      <g class="motion-rise" style="--delay:3.7s"><rect x="782" y="215" width="91" height="84" rx="4" fill="var(--gold-pale)" stroke="var(--gold)" stroke-width="2"/></g>
      ${tokens(794, 228, 4, 'gold', 3.84, 2)}
      ${label(821, 337, 'U', colors.gold, 'motion-symbol motion-rise', 4.18)}`, false, 'Geometry and video inform a shared physical code Q; video also informs private appearance A; invertible coupling gives visual state U.'),
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
      ${label(31, 48, 'PAIRED OBSERVATIONS', '#71817f', 'motion-kicker')}
      ${label(371, 48, 'BRANCH-WISE TRANSITIONS', colors.green, 'motion-kicker')}
      ${label(785, 48, 'SHARED RVQ', colors.green, 'motion-kicker')}
      ${label(1138, 48, 'FUTURE DECODERS', '#71817f', 'motion-kicker')}
      ${frame(42, 95, 84, 'method-frame-i.jpg', 'xᵢ', .05)}
      ${frame(42, 260, 84, 'method-frame-j.jpg', 'xⱼ', .16)}
      <path d="M130 146h24v215 M130 303h24" fill="none" stroke="#91a3a3" stroke-width="1.8" class="motion-rise" style="--delay:.34s"/>
      ${box(175, 101, 141, 72, 'PAGE-4D', 'frozen geometry', 'green', .55)}
      ${box(175, 213, 141, 72, 'DFoT', 'video + controls', 'blue', .7)}
      ${box(175, 325, 141, 72, 'DINOv2', 'frozen visual', 'orange', .85)}
      ${trace('M154 146H168', colors.green, .44)}
      ${trace('M154 248H168', colors.blue, .58)}
      ${trace('M154 361H168', colors.orange, .72)}
      ${trace('M316 137H369', colors.green, 1.05)}
      ${trace('M316 249H369', colors.blue, 1.2)}
      ${trace('M316 361H357', colors.orange, 1.34)}
      ${trace('M316 249C347 249 340 367 357 367', colors.blue, 1.42)}
      ${box(376, 103, 103, 73, 'E<tspan baseline-shift="sub" font-size="16">g</tspan>', 'geometry', 'green', 1.34)}
      ${box(376, 215, 103, 73, 'E<tspan baseline-shift="sub" font-size="16">v</tspan>', 'video', 'blue', 1.48)}
      ${box(364, 327, 160, 83, 'Appearance', 'encode + fuse', 'orange', 1.67, true)}
      ${trace('M479 139H514C540 139 521 177 554 177H778', colors.green, 1.84)}
      ${trace('M479 252H514C540 252 521 285 554 285H778', colors.blue, 2.04)}
      ${trace('M518 139V226H555', colors.green, 2.22)}
      ${trace('M518 252V257H555', colors.blue, 2.4)}
      ${box(562, 218, 113, 77, 'Fusion', 'physical', 'green', 2.62)}
      ${trace('M675 257H778', colors.green, 2.94)}
      ${label(716, 158, 'Sg', colors.green, 'motion-small motion-rise', 2.42)}
      ${label(716, 240, 'Sf', colors.green, 'motion-small motion-rise', 3.04)}
      ${label(716, 309, 'Sv', colors.blue, 'motion-small motion-rise', 2.62)}
      ${box(785, 125, 135, 205, 'RVQ', '', 'green', 2.38)}
      ${tokens(794, 171, 4, 'green', 3.14)}
      ${tokens(794, 221, 4, 'green', 3.29)}
      ${tokens(794, 271, 4, 'green', 3.44)}
      ${trace('M920 228H936', colors.green, 4.05)}
      ${cube(944, 184, 53, 'green', 'Q<tspan baseline-shift="sub" font-size="15">m</tspan>', 4.3)}
      ${tokens(704, 376, 6, 'orange', 2.7)}
      ${trace('M524 369H696', colors.orange, 2.19)}
      ${label(775, 446, 'Aₘ', colors.orange, 'motion-small motion-rise', 3.28)}
      ${trace('M1007 230C1064 230 1083 156 1149 156', colors.green, 4.72)}
      ${box(1156, 112, 201, 87, 'D<tspan baseline-shift="sub" font-size="16">g</tspan>', 'geometry future', 'green', 5.15)}
      ${trace('M1007 230C1041 230 1018 343 1032 343', colors.green, 4.84)}
      ${trace('M884 389H1001C1027 389 1013 376 1032 376', colors.orange, 4.87)}
      ${box(1039, 305, 125, 96, 'Coupling', 'invertible', 'purple', 5.2, true)}
      ${trace('M1164 350H1173', colors.gold, 5.56)}
      ${tokens(1180, 328, 4, 'gold', 5.75, 2)}
      ${label(1198, 419, 'Uₘ', colors.gold, 'motion-small motion-rise', 6.08)}
      ${trace('M1235 350H1243', colors.gold, 6.0)}
      ${box(1250, 310, 127, 88, 'D<tspan baseline-shift="sub" font-size="16">v</tspan>', 'visual future', 'blue', 6.25)}
      <text x="1002" y="458" text-anchor="middle" class="motion-small motion-rise" style="--delay:6.65s">Geometry reads Q; visual prediction reads coupled U</text>`, true, 'The same frame pair feeds PAGE-4D, DFoT and DINOv2. Geometry, video and fused physical transitions enter one shared RVQ. A continuous appearance path enters invertible coupling; geometry reads Q and visual prediction reads U.'),
    transfer: () => root(`
      ${label(39, 48, 'PAIRED PHYSICAL CODES', '#71817f', 'motion-kicker')}
      ${cube(67, 110, 78, 'green', 'Q<tspan baseline-shift="sub" font-size="16">v</tspan>', .08)}
      ${cube(67, 275, 78, 'green', 'Q<tspan baseline-shift="sub" font-size="16">f</tspan>', .22)}
      ${trace('M159 167C205 167 199 222 251 222', colors.green, .57)}
      ${trace('M159 332C205 332 199 258 251 258', colors.green, .7)}
      ${box(258, 187, 202, 111, 'Q<tspan baseline-shift="sub" font-size="16">f</tspan> − Q<tspan baseline-shift="sub" font-size="16">v</tspan>', 'paired innovation', 'purple', 1.0)}
      ${trace('M460 241H496', colors.purple, 1.39)}
      ${box(503, 187, 180, 111, 'Conditioner', 'training only', 'purple', 1.7)}
      ${trace('M683 241H729', colors.purple, 2.1)}
      ${box(736, 187, 190, 111, 'Teacher DFoT', 'fused evidence', 'blue', 2.47)}
      ${trace('M926 241H992', colors.purple, 2.88, 2.8, true)}
      <g class="motion-rise" style="--delay:3.15s"><circle cx="1034" cy="241" r="29" fill="#f2ecf7" stroke="${colors.purple}" stroke-width="2"/><path d="m1023 240 8 8 15-17" fill="none" stroke="${colors.purple}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="1034" y="317" text-anchor="middle" class="motion-small">eₜ &lt; eₛ</text></g>
      ${trace('M1064 241H1104', colors.purple, 3.96, 2.8, true)}
      ${box(1111, 187, 240, 111, 'Student DFoT', 'backbone update', 'blue', 4.2)}
      <g class="motion-rise" style="--delay:4.9s"><line x1="735" y1="375" x2="1351" y2="375" stroke="#c3d4ce" stroke-width="1.5"/><text x="1043" y="410" text-anchor="middle" class="motion-small">The conditioner and teacher are removed after training</text></g>`, true, 'Video-only and fused physical codes form a paired innovation. The conditioner guides a teacher DFoT; selective distillation transfers only lower-error teacher predictions into the student backbone.'),
    deploy: () => root(`
      ${label(46, 48, 'BACKBONE-ONLY INFERENCE', '#71817f', 'motion-kicker')}
      ${frame(128, 174, 124, 'method-frame-i.jpg', 'input frame', .08)}
      ${box(137, 70, 158, 75, 'Camera', 'controls', 'blue', .32)}
      ${trace('M295 111C350 111 352 200 453 200', colors.blue, .65)}
      ${trace('M256 236H453', colors.blue, .72)}
      ${box(460, 163, 292, 170, 'DFoT', 'consolidated video backbone', 'blue', 1.08)}
      <g class="motion-rise" style="--delay:1.55s">${[0, 1, 2, 3, 4, 5].map((n) => `<rect x="${485 + n * 40}" y="267" width="26" height="24" fill="${n % 2 ? '#e5eff5' : '#a9c9dc'}" stroke="${colors.blue}"/>`).join('')}</g>
      ${trace('M752 242H867', colors.blue, 1.85)}
      ${frame(885, 178, 111, 'timeline-16.jpg', '16', 2.24)}
      ${frame(1030, 178, 111, 'timeline-32.jpg', '32', 2.7)}
      ${frame(1175, 178, 111, 'timeline-64.jpg', '64', 3.16)}
      <g class="motion-rise" style="--delay:3.7s"><line x1="461" y1="393" x2="1286" y2="393" stroke="#c3d6ce" stroke-width="1.5"/><text x="874" y="428" text-anchor="middle" class="motion-small">No geometry encoder · appearance branch · RVQ · conditioner at inference</text></g>`, true, 'At deployment, only the camera-conditioned DFoT backbone generates the RGB rollout.')
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
