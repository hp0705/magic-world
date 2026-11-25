// Magic World Handwriting Service (Interactive 4-Ruling Grid Canvas, Stroke Guidance, Apple Pencil / Pointer Events)
window.MagicWorld = window.MagicWorld || {};

class HandwritingService {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.currentLetter = null;
    this.strokesGuide = [];
    this.currentStrokeIndex = 0;
    this.isDrawing = false;
    this.activePointerId = null;
    this.activePointers = new Set();
    this.userPoints = [];
    this.sparkles = [];
    this.animationId = null;
    this.onComplete = null;
    this.onReset = null;
    this.demoRunning = false;
    this.wrongShakeUntil = 0;
    this.width = 0;
    this.height = 0;
  }

  init(canvasElement, onCompleteCallback, onResetCallback) {
    this.canvas = canvasElement;
    this.canvas.style.touchAction = 'none';
    this.ctx = this.canvas.getContext('2d');
    this.onComplete = onCompleteCallback;
    this.onReset = onResetCallback || null;
    this.setupResolution();
    this.setupEvents();
    this.startSparkleLoop();

    // Auto update resolution on window resize
    window.addEventListener('resize', () => {
      this.setupResolution();
      this.redraw();
    });
  }

  setupResolution() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Reset transform before re-scaling
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  loadLetter(letterKey) {
    this.currentLetter = letterKey;
    const strokesData = window.MagicWorld.Strokes || {};
    this.strokesGuide = strokesData[letterKey] || strokesData['a'];
    this.currentStrokeIndex = 0;
    this.userPoints = [];
    this.demoRunning = false;
    this.wrongShakeUntil = 0;
    this.updateStrokeBadge();
    if (this.onReset) this.onReset();
    this.setupResolution();
    this.redraw();
  }

  updateStrokeBadge() {
    const badge = document.getElementById('hwStrokeBadge');
    const textEl = document.getElementById('hwStrokeBadgeText');
    if (!badge || !textEl) return;
    const st = this.strokesGuide && this.strokesGuide[this.currentStrokeIndex];
    if (st) {
      textEl.textContent = `Nét ${st.order}: ${st.label}`;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  getCurrentStrokeLabel() {
    const st = this.strokesGuide && this.strokesGuide[this.currentStrokeIndex];
    return st ? st.label : '';
  }

  isPalmOrMultiTouch(e) {
    if (e.pointerType === 'pen') return false;
    // Reject large palm contact area (width/height in CSS px)
    if ((e.width && e.width > 42) || (e.height && e.height > 42)) return true;
    return false;
  }

  setupEvents() {
    if (!this.canvas) return;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.demoRunning) return;
      if (this.isPalmOrMultiTouch(e)) return;

      this.activePointers.add(e.pointerId);
      // Only allow 1 active pointer at a time (anti-palm / multi-finger)
      if (this.activePointers.size > 1) {
        this.isDrawing = false;
        this.activePointerId = null;
        this.userPoints = [];
        this.redraw();
        return;
      }

      this.activePointerId = e.pointerId;
      this.setupResolution();
      this.isDrawing = true;
      const pos = getPos(e);
      this.userPoints = [pos];
      this.addSparkle(pos.x, pos.y);
      if (window.MagicWorld.AudioService) {
        window.MagicWorld.AudioService.playSparkle();
      }
      this.redraw();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing || e.pointerId !== this.activePointerId) return;
      if (this.activePointers.size > 1 || this.isPalmOrMultiTouch(e)) {
        this.isDrawing = false;
        this.userPoints = [];
        this.redraw();
        return;
      }
      e.preventDefault();
      const pos = getPos(e);
      const last = this.userPoints[this.userPoints.length - 1];
      if (!last || Math.hypot(pos.x - last.x, pos.y - last.y) >= 2.5) {
        this.userPoints.push(pos);
        this.addSparkle(pos.x, pos.y);
        this.redraw();
      }
    });

    const endDraw = (e) => {
      this.activePointers.delete(e.pointerId);
      if (!this.isDrawing || e.pointerId !== this.activePointerId) return;
      this.isDrawing = false;
      this.activePointerId = null;
      this.evaluateStroke();
    };

    this.canvas.addEventListener('pointerup', endDraw);
    this.canvas.addEventListener('pointercancel', endDraw);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Draw clean 3-line ruling grid (Đáy đậm, Giữa, Trên; bỏ nhãn & lưới dọc)
  drawRulingGrid() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    ctx.save();
    ctx.fillStyle = "#FAFDFE";
    ctx.fillRect(0, 0, w, h);

    const oliSize = Math.max(46, Math.min(Math.round(h * 0.165), 68));
    const line1Y = Math.round(h * 0.66);      // Đáy (đậm)
    const line2Y = line1Y - oliSize;          // Giữa
    const line3Y = line1Y - (2 * oliSize);    // Trên
    const marginX = 24;

    // Line 3 (Trên)
    ctx.beginPath();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.moveTo(marginX, line3Y);
    ctx.lineTo(w - marginX, line3Y);
    ctx.stroke();

    // Line 2 (Giữa)
    ctx.beginPath();
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(marginX, line2Y);
    ctx.lineTo(w - marginX, line2Y);
    ctx.stroke();

    // Line 1 (Đáy - đậm hơn)
    ctx.beginPath();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([]);
    ctx.moveTo(marginX, line1Y);
    ctx.lineTo(w - marginX, line1Y);
    ctx.stroke();

    ctx.restore();
  }

  getLetterTransform() {
    const w = this.width;
    const h = this.height;
    const oliSize = Math.max(46, Math.min(Math.round(h * 0.165), 68));
    const line1Y = Math.round(h * 0.66);
    const uniformScale = (oliSize * 2) / 48;
    const centerX = Math.round(w / 2);
    const offsetX = Math.round(centerX - (54 * uniformScale));
    const offsetY = Math.round(line1Y - (112 * uniformScale));
    return { w, h, oliSize, line1Y, uniformScale, offsetX, offsetY };
  }

  // Sample points along an SVG path in canvas coordinates for forgiving stroke check
  getGuideSamplePoints(svgPathD, transform, count = 20) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const pathEl = document.createElementNS(svgNS, 'path');
    pathEl.setAttribute('d', svgPathD);
    const totalLen = pathEl.getTotalLength();
    const pts = [];
    for (let i = 0; i <= count; i++) {
      const pt = pathEl.getPointAtLength((totalLen * i) / count);
      pts.push({
        x: transform.offsetX + pt.x * transform.uniformScale,
        y: transform.offsetY + pt.y * transform.uniformScale
      });
    }
    return { pts, totalLen: totalLen * transform.uniformScale };
  }

  // Draw Stroke Guidelines (Uniform Isotropic Scaling Centered on 3-Line Grid)
  drawGuides() {
    if (!this.strokesGuide || !this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    const tr = this.getLetterTransform();
    const now = performance.now();
    const shakeX = (this.wrongShakeUntil > now) ? Math.sin(now * 0.055) * 7 : 0;

    ctx.save();
    this.strokesGuide.forEach((st, idx) => {
      const isCurrent = (idx === this.currentStrokeIndex);
      const isDone = (idx < this.currentStrokeIndex);
      const curShake = isCurrent ? shakeX : 0;

      ctx.save();
      ctx.translate(tr.offsetX + curShake, tr.offsetY);
      ctx.scale(tr.uniformScale, tr.uniformScale);

      const p = new Path2D(st.d);

      // Soft glowing background track for active stroke
      if (isCurrent) {
        ctx.strokeStyle = '#BAE6FD';
        ctx.lineWidth = 24 / tr.uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke(p);
      }

      if (isDone) {
        // Completed stroke turns vivid green!
        ctx.strokeStyle = '#16A34A';
        ctx.lineWidth = 15 / tr.uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke(p);
      } else {
        // Thicker dashed guide path
        ctx.strokeStyle = isCurrent ? '#0284C7' : '#CBD5E1';
        ctx.lineWidth = (isCurrent ? 16 : 9) / tr.uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash(isCurrent ? [8, 6] : [5, 5]);
        ctx.stroke(p);
      }
      ctx.restore();

      // Blinking green starting point dot & big order number for active stroke
      if (isCurrent && st.start) {
        const sx = tr.offsetX + curShake + st.start.x * tr.uniformScale;
        const sy = tr.offsetY + st.start.y * tr.uniformScale;
        const pulse = (Math.sin(now * 0.006) + 1) * 0.5; // 0..1

        // Outer pulsing halo
        ctx.beginPath();
        ctx.arc(sx, sy, 20 + pulse * 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${0.35 - pulse * 0.22})`;
        ctx.fill();

        // Main green circle
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#16A34A';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Big crisp stroke order number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px "Quicksand", "Nunito", system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.order, sx, sy + 1);
      }
    });
    ctx.restore();
  }

  // Smooth thick user stroke (>= 10px) using quadratic midpoint smoothing
  drawUserStroke() {
    if (this.userPoints.length < 2) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.userPoints[0].x, this.userPoints[0].y);
    for (let i = 1; i < this.userPoints.length - 1; i++) {
      const midX = (this.userPoints[i].x + this.userPoints[i + 1].x) / 2;
      const midY = (this.userPoints[i].y + this.userPoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(this.userPoints[i].x, this.userPoints[i].y, midX, midY);
    }
    const last = this.userPoints[this.userPoints.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // Forgiving stroke validation: wide tolerance, checks direction & guide checkpoints
  evaluateStroke() {
    if (this.userPoints.length < 4) {
      this.userPoints = [];
      this.redraw();
      return;
    }

    const st = this.strokesGuide && this.strokesGuide[this.currentStrokeIndex];
    if (!st) return;

    const tr = this.getLetterTransform();
    const { pts: guidePts, totalLen } = this.getGuideSamplePoints(st.d, tr, 16);
    const tolerance = Math.max(60, tr.oliSize * 1.15);

    // 1. Check user stroke length isn't just a tiny dot
    let userLen = 0;
    for (let i = 1; i < this.userPoints.length; i++) {
      userLen += Math.hypot(
        this.userPoints[i].x - this.userPoints[i - 1].x,
        this.userPoints[i].y - this.userPoints[i - 1].y
      );
    }

    // 2. Check start point proximity to start/early part of guide
    const startPt = this.userPoints[0];
    const nearStart = guidePts.slice(0, 6).some(
      gp => Math.hypot(startPt.x - gp.x, startPt.y - gp.y) <= tolerance * 1.25
    );

    // 3. Check sequential checkpoints along the guide
    let matchedIdx = 0;
    let userSearchStart = 0;
    for (let g = 0; g < guidePts.length; g++) {
      const gp = guidePts[g];
      for (let u = userSearchStart; u < this.userPoints.length; u++) {
        if (Math.hypot(this.userPoints[u].x - gp.x, this.userPoints[u].y - gp.y) <= tolerance) {
          matchedIdx++;
          userSearchStart = u;
          break;
        }
      }
    }
    const coverage = matchedIdx / guidePts.length;
    const isValid = nearStart && userLen >= totalLen * 0.25 && coverage >= 0.55;

    if (isValid) {
      this.currentStrokeIndex++;
      this.userPoints = [];
      this.updateStrokeBadge();

      if (window.MagicWorld.AudioService) {
        window.MagicWorld.AudioService.playSparkle();
      }

      if (this.currentStrokeIndex >= this.strokesGuide.length) {
        if (window.MagicWorld.AudioService) {
          window.MagicWorld.AudioService.playChime();
        }
        this.explodeSparkles();
        if (this.onComplete) {
          this.onComplete();
        }
      }
    } else {
      // Gentle shake feedback — no penalty, no red error text
      this.wrongShakeUntil = performance.now() + 450;
      this.userPoints = [];
      if (window.MagicWorld.AudioService) {
        window.MagicWorld.AudioService.playPop();
      }
    }
    this.redraw();
  }

  clear() {
    this.currentStrokeIndex = 0;
    this.userPoints = [];
    this.wrongShakeUntil = 0;
    this.updateStrokeBadge();
    if (this.onReset) this.onReset();
    this.redraw();
  }

  skip() {
    this.currentStrokeIndex = this.strokesGuide.length;
    this.updateStrokeBadge();
    this.redraw();
    if (this.onComplete) {
      this.onComplete();
    }
  }

  // "Xem Bé Mây viết" - Guided demonstration animation
  playDemo() {
    if (this.demoRunning || !this.strokesGuide) return;
    this.demoRunning = true;
    this.currentStrokeIndex = 0;
    this.userPoints = [];
    this.updateStrokeBadge();
    if (this.onReset) this.onReset();

    let currentIdx = 0;
    const runStroke = () => {
      if (currentIdx >= this.strokesGuide.length) {
        this.demoRunning = false;
        this.currentStrokeIndex = 0;
        this.updateStrokeBadge();
        this.redraw();
        return;
      }
      this.currentStrokeIndex = currentIdx;
      this.updateStrokeBadge();
      this.redraw();

      setTimeout(() => {
        currentIdx++;
        if (window.MagicWorld.AudioService) {
          window.MagicWorld.AudioService.playSparkle();
        }
        runStroke();
      }, 950);
    };

    runStroke();
  }

  // Sparkles & visual effects
  addSparkle(x, y) {
    for (let i = 0; i < 3; i++) {
      this.sparkles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 1,
        size: Math.random() * 5 + 3,
        alpha: 1.0,
        color: ['#38BDF8', '#818CF8', '#FBBF24', '#34D399'][Math.floor(Math.random() * 4)]
      });
    }
  }

  explodeSparkles() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.sparkles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 7 + 4,
        alpha: 1.0,
        color: ['#38BDF8', '#FBBF24', '#818CF8', '#34D399'][Math.floor(Math.random() * 4)]
      });
    }
  }

  startSparkleLoop() {
    const loop = () => {
      const isHwVisible = this.canvas && this.canvas.offsetParent !== null;
      const hasActivePulse = isHwVisible && this.strokesGuide && this.currentStrokeIndex < this.strokesGuide.length;
      if (this.sparkles.length > 0 || this.wrongShakeUntil > performance.now() || hasActivePulse) {
        this.redraw();
      }
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  redraw() {
    if (!this.ctx) return;
    if (this.width === 0 || this.height === 0) {
      this.setupResolution();
    }
    this.drawRulingGrid();
    this.drawGuides();
    this.drawUserStroke();

    // Render & update sparkles
    const ctx = this.ctx;
    ctx.save();
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.alpha -= 0.03;
      if (sp.alpha <= 0) {
        this.sparkles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.MagicWorld.HandwritingService = new HandwritingService();
