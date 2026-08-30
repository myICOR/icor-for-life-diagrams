/* ICOR Diagrams - fullscreen viewer for rendered mermaid diagrams.
 *
 * One job: every rendered mermaid block gets a small maximize button that
 * sits next to Obsidian's native edit affordance. Clicking it opens the
 * diagram in a fullscreen modal with mouse-wheel zoom around the cursor,
 * drag panning, two-finger pinch on touch, and a double-click reset.
 *
 * The zoom/pan transform math is shared with ICOR Focus (wirePointer):
 * world = (screen - center - pan) / zoom, and every zoom change re-anchors
 * the pan so the point under the cursor stays under the cursor.
 *
 * Hand-written CommonJS, no build step. INKLINE visual grammar.
 */

'use strict';

const { Plugin, Modal, setIcon } = require('obsidian');

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 8;

/* ------------------------------------------------------------ modal */

class DiagramModal extends Modal {
  constructor(app, svg) {
    super(app);
    this.srcSvg = svg;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.pointers = new Map();
    this.pinch = null;
    this.drag = null;
    this.cleanup = [];
  }

  listen(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    this.cleanup.push(() => el.removeEventListener(type, fn, opts));
  }

  onOpen() {
    this.containerEl.addClass('icor-diag-container');
    this.modalEl.addClass('icor-diag-modal');
    const c = this.contentEl;
    c.addClass('icor-diag-content');

    this.stage = c.createDiv('icor-diag-stage');
    // the holder keeps the class "mermaid" so Obsidian's own dark-mode rule
    // (.theme-dark .mermaid > svg { filter: invert(...) }) applies in here too
    this.holder = this.stage.createDiv('mermaid icor-diag-holder');

    const svg = this.srcSvg.cloneNode(true);
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const rect = this.srcSvg.getBoundingClientRect();
    this.natW = (vb && vb.width) || rect.width || 600;
    this.natH = (vb && vb.height) || rect.height || 400;
    svg.setAttribute('width', String(this.natW));
    svg.setAttribute('height', String(this.natH));
    svg.style.maxWidth = 'none';
    this.holder.style.width = this.natW + 'px';
    this.holder.style.height = this.natH + 'px';
    this.holder.appendChild(svg);

    c.createDiv({ cls: 'icor-diag-kicker', text: 'DIAGRAM' });

    const controls = c.createDiv('icor-diag-controls');
    const btn = (icon, label, fn) => {
      const b = controls.createEl('button', {
        cls: 'icor-diag-ctl', attr: { 'aria-label': label },
      });
      setIcon(b, icon);
      this.listen(b, 'click', fn);
    };
    btn('minus', 'Zoom out', () => this.zoomBy(1 / 1.3));
    btn('plus', 'Zoom in', () => this.zoomBy(1.3));
    btn('rotate-ccw', 'Reset view', () => this.fit());

    this.wirePointer();
    this.listen(c, 'keydown', (e) => {
      if (e.key === '+' || e.key === '=') this.zoomBy(1.3);
      else if (e.key === '-') this.zoomBy(1 / 1.3);
      else if (e.key === '0') this.fit();
      else if (e.key.startsWith('Arrow')) {
        const step = 60;
        if (e.key === 'ArrowLeft') this.pan.x += step;
        if (e.key === 'ArrowRight') this.pan.x -= step;
        if (e.key === 'ArrowUp') this.pan.y += step;
        if (e.key === 'ArrowDown') this.pan.y -= step;
        this.apply();
      } else return;
      e.preventDefault();
    });

    // fit after the modal has real dimensions
    window.requestAnimationFrame(() => this.fit());
  }

  onClose() {
    for (const fn of this.cleanup) fn();
    this.cleanup = [];
    this.contentEl.empty();
  }

  /* screen (stage-local px) -> diagram-centered world coords */
  toWorld(px, py) {
    const rect = this.stage.getBoundingClientRect();
    const cx = rect.width / 2 + this.pan.x;
    const cy = rect.height / 2 + this.pan.y;
    return { x: (px - cx) / this.zoom, y: (py - cy) / this.zoom };
  }

  clampZoom(z) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  }

  /* zoom by a factor around a stage-local anchor (default: the center) */
  zoomBy(factor, px, py) {
    const rect = this.stage.getBoundingClientRect();
    if (px == null) { px = rect.width / 2; py = rect.height / 2; }
    const before = this.toWorld(px, py);
    this.zoom = this.clampZoom(this.zoom * factor);
    const after = this.toWorld(px, py);
    this.pan.x += (after.x - before.x) * this.zoom;
    this.pan.y += (after.y - before.y) * this.zoom;
    this.apply();
  }

  fit() {
    const rect = this.stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.zoom = this.clampZoom(Math.min(
      (rect.width * 0.92) / this.natW,
      (rect.height * 0.92) / this.natH
    ));
    this.pan.x = 0;
    this.pan.y = 0;
    this.apply();
  }

  apply() {
    this.holder.style.transform =
      'translate(calc(-50% + ' + this.pan.x + 'px), calc(-50% + '
      + this.pan.y + 'px)) scale(' + this.zoom + ')';
  }

  wirePointer() {
    const s = this.stage;
    const local = (e) => {
      const rect = s.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const startPinch = () => {
      const [a, b] = [...this.pointers.values()];
      this.drag = null;
      this.pinch = {
        d0: Math.max(12, Math.hypot(a.x - b.x, a.y - b.y)),
        zoom0: this.zoom,
      };
    };
    this.listen(s, 'pointerdown', (e) => {
      const p = local(e);
      this.pointers.set(e.pointerId, p);
      try { s.setPointerCapture(e.pointerId); } catch (err) { /* touch may refuse capture */ }
      if (this.pointers.size === 2) { startPinch(); return; }
      if (this.pointers.size > 2) return;
      this.drag = { px: p.x, py: p.y };
      s.addClass('is-panning');
    });
    this.listen(s, 'pointermove', (e) => {
      const p = local(e);
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, p);
      if (this.pinch && this.pointers.size >= 2) {
        // two-finger pinch: zoom around the midpoint, like wheel-zoom
        // around the cursor
        const [a, b] = [...this.pointers.values()];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const d = Math.max(12, Math.hypot(a.x - b.x, a.y - b.y));
        const before = this.toWorld(mx, my);
        this.zoom = this.clampZoom(this.pinch.zoom0 * (d / this.pinch.d0));
        const after = this.toWorld(mx, my);
        this.pan.x += (after.x - before.x) * this.zoom;
        this.pan.y += (after.y - before.y) * this.zoom;
        this.apply();
        return;
      }
      if (this.drag) {
        this.pan.x += p.x - this.drag.px;
        this.pan.y += p.y - this.drag.py;
        this.drag.px = p.x;
        this.drag.py = p.y;
        this.apply();
      }
    });
    const release = (e) => {
      this.pointers.delete(e.pointerId);
      if (this.pinch && this.pointers.size < 2) this.pinch = null;
      this.drag = null;
      s.removeClass('is-panning');
    };
    this.listen(s, 'pointerup', release);
    this.listen(s, 'pointercancel', release);
    this.listen(s, 'wheel', (e) => {
      e.preventDefault();
      const p = local(e);
      this.zoomBy(Math.exp(-e.deltaY * 0.0016), p.x, p.y);
    }, { passive: false });
    this.listen(s, 'dblclick', () => this.fit());
  }
}

/* ------------------------------------------------------------ plugin */

module.exports = class IcorDiagramsPlugin extends Plugin {
  onload() {
    // Reading view: Obsidian's built-in processor replaces the code block
    // with <div class="mermaid"><svg> asynchronously (mermaid.render is a
    // promise), so we poll the section briefly for the svg to appear.
    this.registerMarkdownPostProcessor((el) => {
      if (!el.querySelector('code.language-mermaid, .mermaid')) return;
      this.waitAndWire(el, 0);
    });
    // Live preview: the cm-embed-block widget renders mermaid through its
    // own canRenderLang path and never runs plugin post processors, so a
    // pointerover delegation catches those blocks on first hover instead.
    this.registerDomEvent(document, 'pointerover', (e) => {
      const t = e.target instanceof Element ? e.target.closest('.mermaid') : null;
      if (t) this.wire(t);
    });
  }

  waitAndWire(section, tries) {
    const m = section.querySelector('.mermaid');
    if (m && m.querySelector('svg')) { this.wire(m); return; }
    if (tries > 40) return; // ~4s: not rendering (e.g. untrusted vault guard)
    window.setTimeout(() => this.waitAndWire(section, tries + 1), 100);
  }

  wire(m) {
    if (!(m instanceof HTMLElement)) return;
    if (m.closest('.icor-diag-modal')) return; // our own fullscreen clone
    const svg = m.querySelector('svg');
    if (!svg) return;
    // Live preview: anchor on the widget block so the button lines up with
    // (and sits left of) Obsidian's own </> edit affordance. Reading view
    // has no edit button; anchor on the diagram itself, top-right.
    const embed = m.closest('.cm-embed-block');
    const host = embed || m;
    if (host.querySelector('.icor-diag-btn')) return; // idempotence guard
    host.classList.add('icor-diag-host');
    const b = host.createEl('button', {
      cls: 'icor-diag-btn' + (embed ? ' icor-diag-btn-lp' : ''),
      attr: { 'aria-label': 'Open diagram fullscreen' },
    });
    setIcon(b, 'maximize-2');
    const swallow = (e) => { e.preventDefault(); e.stopPropagation(); };
    b.addEventListener('pointerdown', swallow);
    b.addEventListener('mousedown', swallow);
    b.addEventListener('click', (e) => {
      swallow(e);
      const live = m.querySelector('svg');
      if (live) new DiagramModal(this.app, live).open();
    });
  }
};
