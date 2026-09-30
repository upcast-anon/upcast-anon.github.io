const UpcastMotion = (() => {
  const durations = { idea: { alignment: 7, factorized: 9, generation: 8 }, method: { acquire: 11, transfer: 10, deploy: 8 } };
  const reveal = (content, delay = 0) => `<g class="motion-rise" style="--delay:${delay}s">${content}</g>`;
  const text = (x, y, value, cls = 'motion-small', anchor = 'start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${value}</text>`;
  const node = (x, y, w, h, title, sub, color, delay, symbol = '') => reveal(`<g class="motion-node" data-title="${title}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="var(--${color}-pale)" stroke="var(--${color})" stroke-width="1.5"/><rect x="${x}" y="${y + 16}" width="3" height="${h - 32}" fill="var(--${color})"/><text x="${x + 18}" y="${y + 32}" class="motion-box-title" fill="var(--${color})">${title}</text>${text(x + 18, y + 58, sub, 'motion-box-sub')}${symbol ? text(x + w - 22, y + h - 18, symbol, 'motion-symbol', 'end') : ''}</g>`, delay);
  const image = (x, y, size, file, caption, delay = 0) => reveal(`<image x="${x}" y="${y}" width="${size}" height="${size}" href="assets/media/${file}" preserveAspectRatio="xMidYMid meet"/><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="var(--motion-line)"/>${text(x + size / 2, y + size + 23, caption, 'motion-box-sub', 'middle')}`, delay);
  // Fixed ports and rounded orthogonal paths keep nodes and arrows aligned throughout playback.
  function wire(points, color, delay) {
    let d = `M${points[0].join(' ')}`;
    for (let i = 1; i < points.length; i++) {
      if (i === points.length - 1) { d += ` L${points[i].join(' ')}`; break; }
      const a = points[i - 1], b = points[i], c = points[i + 1];
      const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
      const r = Math.min(16, ab / 2, bc / 2);
      const p = [b[0] + (a[0] - b[0]) * r / ab, b[1] + (a[1] - b[1]) * r / ab];
      const q = [b[0] + (c[0] - b[0]) * r / bc, b[1] + (c[1] - b[1]) * r / bc];
      d += ` L${p.join(' ')} Q${b.join(' ')} ${q.join(' ')}`;
    }
    const end = points.at(-1), prev = points.at(-2);
    const angle = Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180 / Math.PI;
    return `<path d="${d}" fill="none" stroke="var(--motion-line)" stroke-width="1.3"/><path class="motion-trace" d="${d}" fill="none" stroke="var(--${color})" stroke-width="2.4" style="--delay:${delay}s"/><path d="M0 0 -8 -4 -8 4Z" transform="translate(${end.join(' ')}) rotate(${angle})" fill="var(--${color})" class="motion-arrow-arrive" style="--delay:${delay + .68}s"/>`;
  }
  const heading = (x, y, value) => text(x, y, value, 'motion-kicker');
  const foot = (w, y, title, note) => `<line x1="24" y1="${y}" x2="${w - 24}" y2="${y}" stroke="var(--motion-line)"/>${text(24, y + 32, title, 'motion-foot-title')}${text(24, y + 57, note, 'motion-small')}`;
  function alignment(m) {
    if (m) return [380, 595, heading(24, 34, 'ONE OBSERVATION PAIR') + image(58, 62, 112, 'method-frame-i.jpg', 'Current', .1) + image(210, 62, 112, 'method-frame-j.jpg', 'Future', .3) +
      wire([[190, 210], [190, 245], [105, 245], [105, 282]], 'green', 1) + wire([[190, 210], [190, 245], [275, 245], [275, 282]], 'blue', 1.6) +
      node(24, 292, 160, 125, 'Geometry', 'Layout + structure', 'green', 1.4, 'Zg') + node(196, 292, 160, 125, 'Video', 'Visual detail', 'blue', 2, 'H') + foot(380, 464, 'Complementary evidence', 'Two learned views of the same RGB video.')];
    return [1040, 460, heading(40, 42, 'OBSERVED VIDEO') + heading(470, 42, 'COMPLEMENTARY EVIDENCE') +
      image(40, 100, 138, 'method-frame-i.jpg', 'Current frame', .1) + image(196, 100, 138, 'method-frame-j.jpg', 'Future frame', .3) +
      wire([[354, 170], [408, 170], [408, 132], [462, 132]], 'green', 1) + wire([[354, 170], [408, 170], [408, 276], [462, 276]], 'blue', 1.7) +
      node(472, 88, 236, 94, 'Geometry', 'Layout + correspondence', 'green', 1.35) + node(472, 232, 236, 94, 'Video', 'Color + texture + lighting', 'blue', 2.05) +
      reveal(text(753, 129, 'Structure is essential.', 'motion-foot-title') + text(753, 155, 'But it is not the full visual state.') + text(753, 273, 'Appearance also matters.', 'motion-foot-title') + text(753, 299, 'Predict the future with both.'), 3.1) +
      foot(1040, 361, 'Same video. Different predictive roles.', 'The training views are extracted from RGB, not additional sensor inputs.')];
  }
  function factorized(m) {
    if (m) return [380, 710, heading(24, 34, 'FACTOR THE TRANSITION') +
      node(24, 65, 160, 106, 'Physical', 'Shared, discrete', 'green', .1, 'Q') + node(196, 65, 160, 106, 'Appearance', 'Private, continuous', 'orange', .6, 'A') +
      wire([[104, 181], [104, 234], [145, 234], [145, 272]], 'green', 1.6) + wire([[276, 181], [276, 234], [235, 234], [235, 272]], 'orange', 2.2) +
      node(65, 282, 250, 108, 'Invertible coupling', 'Learn a joint visual state', 'gold', 2.5, 'U') + wire([[190, 400], [190, 458]], 'gold', 3.8) + node(65, 468, 250, 95, 'Predict the future', 'Current state + transition', 'blue', 4.1) + foot(380, 611, 'Two roles, one visual future.', 'Geometry reconstruction uses Q alone.')];
    return [1040, 500, heading(40, 42, 'COMPLEMENTARY TRANSITIONS') + heading(446, 42, 'JOINT VISUAL STATE') +
      node(40, 100, 270, 110, 'Shared physical', 'Geometry + video; shared RVQ', 'green', .1, 'Q') + node(40, 270, 270, 110, 'Private appearance', 'Visual evidence; continuous path', 'orange', .7, 'A') +
      wire([[320, 155], [379, 155], [379, 216], [438, 216]], 'green', 1.5) + wire([[320, 325], [379, 325], [379, 264], [438, 264]], 'orange', 2.1) +
      node(448, 185, 245, 110, 'Invertible coupling', 'Joint visual transition', 'gold', 2.4, 'U') + wire([[703, 240], [759, 240]], 'gold', 3.7) + node(769, 185, 231, 110, 'Visual future', 'Current state + transition', 'blue', 4) +
      foot(1040, 402, 'Complementary states are learned through reconstruction.', 'Q supports geometry; coupled U supports the visual prediction.')];
  }
  function acquire(m) {
    if (m) return [380, 900, heading(24, 34, 'SAME FRAME PAIR + CONTROLS') +
      node(24, 66, 160, 100, 'Geometry', 'PAGE-4D', 'green', .1) + node(196, 66, 160, 100, 'Video', 'DFoT features', 'blue', .4) +
      wire([[104, 176], [104, 223]], 'green', 1) + wire([[276, 176], [276, 202], [164, 202], [164, 223]], 'blue', 1.6) + node(24, 233, 230, 110, 'Shared physical Q', 'Video / geometry / fused RVQ', 'green', 1.9) +
      wire([[264, 288], [306, 288], [306, 386]], 'green', 3) + node(24, 396, 332, 86, 'Geometry reconstruction', 'Predict the same future geometry', 'green', 3.4) +
      node(24, 515, 160, 110, 'Appearance A', 'DFoT + DINOv2', 'orange', 4.1) + wire([[306, 288], [369, 288], [369, 550], [366, 550]], 'green', 4.7) + wire([[194, 570], [210, 570]], 'orange', 5.2) +
      node(220, 515, 136, 110, 'Coupling', 'Visual state U', 'gold', 5.5) + wire([[288, 635], [288, 673]], 'gold', 6.5) + node(24, 683, 332, 86, 'Visual reconstruction', 'Current anchor + time interval', 'blue', 6.8) + foot(380, 804, 'One future, three training branches.', 'The appearance path bypasses RVQ.')];
    return [1200, 570, heading(35, 42, 'RGB-DERIVED TRAINING VIEWS') + heading(405, 42, 'FACTORIZED TRANSITIONS') + heading(910, 42, 'PREDICT THE SAME FUTURE') +
      node(35, 104, 270, 112, 'Geometry + video', 'PAGE-4D + DFoT features', 'green', .1) + node(35, 317, 270, 112, 'Visual evidence', 'DFoT + DINOv2 features', 'orange', .5) +
      wire([[315, 160], [395, 160]], 'green', 1) + node(405, 104, 285, 112, 'Shared physical Q', 'Video / geometry / fused RVQ', 'green', 1.3) +
      wire([[315, 373], [395, 373]], 'orange', 2.1) + node(405, 317, 285, 112, 'Private appearance A', 'Continuous; bypasses the RVQ', 'orange', 2.4) +
      wire([[700, 142], [900, 142]], 'green', 3.5) + node(910, 104, 255, 100, 'Geometry future', 'Decoded from physical Q', 'green', 3.8) +
      wire([[700, 186], [755, 186], [755, 310], [787, 310]], 'green', 4.8) + wire([[700, 373], [755, 373], [755, 358], [787, 358]], 'orange', 5.3) +
      node(797, 281, 155, 108, 'Coupling', 'Invertible', 'gold', 5.6, 'U') + wire([[962, 334], [1000, 334]], 'gold', 6.5) + node(1010, 281, 155, 108, 'Visual future', 'Decoded from U', 'blue', 6.8) +
      foot(1200, 472, 'Cross-modal reconstruction gives the states their predictive roles.', 'Each branch predicts the same future, conditioned on the current anchor and temporal interval.')];
  }
  function transfer(m) {
    if (m) return [380, 800, heading(24, 34, 'TRAINING-TIME TRANSFER') +
      node(40, 66, 300, 106, 'Paired innovation', 'Fused minus video-only code', 'green', .1, 'Qf − Qv') + wire([[190, 182], [190, 218]], 'green', .9) + node(40, 228, 300, 96, 'Conditioned teacher', 'Learn from fused evidence', 'purple', 1.3) +
      wire([[190, 334], [190, 370]], 'purple', 2.5) + node(40, 380, 300, 110, 'Selective distillation', 'Lower teacher error + valid signal', 'purple', 2.9, 'eT < eS') + wire([[190, 500], [190, 538]], 'purple', 4.5) + node(40, 548, 300, 96, 'Student DFoT', 'Consolidate into the backbone', 'blue', 4.9) + foot(380, 693, 'Refine on generated history.', 'Deploy the student without its teacher.')];
    return [1200, 470, heading(35, 42, '01 / TEACH') + heading(460, 42, '02 / SELECT') + heading(885, 42, '03 / CONSOLIDATE') +
      node(35, 116, 280, 120, 'Conditioned teacher', 'Paired innovation: Qf − Qv', 'purple', .2) + reveal(text(35, 270, 'Fused evidence supplements video-only codes.'), .7) +
      wire([[325, 174], [447, 174]], 'purple', 1.6) + node(457, 116, 280, 120, 'Selective distillation', 'Lower teacher error + valid signal', 'purple', 2, 'eT < eS') + wire([[747, 174], [874, 174]], 'purple', 3.9) + node(884, 116, 280, 120, 'Student DFoT', 'Update the standalone backbone', 'blue', 4.3) +
      reveal(text(884, 270, 'Then refine with generated history.'), 5.4) + foot(1200, 350, 'Training-time knowledge. Backbone-only generation.', 'The learned transition space, conditioner and teacher do not remain in the deployed model.')];
  }
  function deploy(m) {
    if (m) return [380, 710, heading(24, 34, 'INPUT FRAME + CAMERA CONTROLS') + image(134, 62, 112, 'stairwell-reference.jpg', 'Conditioning frame', .1) + wire([[190, 213], [190, 264]], 'blue', 1) + node(65, 274, 250, 104, 'DFoT backbone', 'Consolidated video generator', 'blue', 1.4) + wire([[190, 388], [190, 438]], 'blue', 2.6) +
      image(24, 448, 102, 'timeline-16.jpg', 'Frame 16', 3) + image(139, 448, 102, 'timeline-32.jpg', 'Frame 32', 3.6) + image(254, 448, 102, 'timeline-64.jpg', 'Frame 64', 4.2) + foot(380, 610, 'One backbone at inference.', 'No auxiliary encoders or conditioner.')];
    return [1040, 460, heading(35, 42, 'CONDITION') + heading(310, 42, 'GENERATE') + heading(666, 42, 'RGB ROLLOUT') +
      image(35, 115, 142, 'stairwell-reference.jpg', 'Input + camera controls', .1) + wire([[195, 185], [300, 185]], 'blue', .9) + node(310, 132, 250, 112, 'DFoT backbone', 'Consolidated video generator', 'blue', 1.3) + wire([[570, 185], [640, 185]], 'blue', 2.5) +
      image(658, 135, 104, 'timeline-16.jpg', 'Frame 16', 2.9) + image(777, 135, 104, 'timeline-32.jpg', 'Frame 32', 3.5) + image(896, 135, 104, 'timeline-64.jpg', 'Frame 64', 4.1) + foot(1040, 351, 'The auxiliary training system is gone.', 'No geometry encoder, appearance encoder, RVQ, or conditioner at inference.')];
  }
  const scenes = { idea: { alignment, factorized, generation: deploy }, method: { acquire, transfer, deploy } };
  function render(kind, key, mobile = false) {
    const [w, h, content] = scenes[kind][key](mobile);
    return `<svg class="motion-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${kind}: ${key}" xmlns="http://www.w3.org/2000/svg"><title>${key}</title>${content}</svg>`;
  }
  function mount(kind, key) {
    const host = kind === 'idea' ? document.querySelector('#ideaPanelArt') : document.querySelector(`[data-method-panel="${key}"]`);
    if (!host) return;
    let viewport = host.querySelector('.motion-viewport');
    if (!viewport) {
      viewport = document.createElement('div'); viewport.className = 'motion-viewport';
      const legacy = host.querySelector('.acquire-diagram, .transfer-diagram, .deploy-diagram');
      if (legacy) legacy.before(viewport); else host.append(viewport);
    }
    host.classList.add('is-enhanced');
    const canvas = document.createElement('div'); canvas.className = `motion-canvas ${kind}-motion`;
    canvas.dataset.kind = kind; canvas.dataset.scene = key;
    canvas.style.setProperty('--sequence-duration', `${durations[kind][key]}s`);
    canvas.innerHTML = render(kind, key, matchMedia('(max-width: 640px)').matches);
    viewport.replaceChildren(canvas);
    canvas.querySelectorAll('.motion-trace').forEach(path => path.style.setProperty('--path-length', path.getTotalLength()));
  }
  matchMedia('(max-width: 640px)').addEventListener('change', () => {
    document.querySelectorAll('.motion-canvas').forEach(canvas => mount(canvas.dataset.kind, canvas.dataset.scene));
  });
  return { mountIdea: key => mount('idea', key), mountMethod: key => mount('method', key), duration: (kind, key) => durations[kind][key], render };
})();
