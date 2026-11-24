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
    this.userPoints = [];
    this.sparkles = [];
    this.animationId = null;
    this.onComplete = null;
    this.demoRunning = false;
    this.width = 0;
    this.height = 0;
  }

  init(canvasElement, onCompleteCallback) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.onComplete = onCompleteCallback;
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
    this.setupResolution();
    this.redraw();
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
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.userPoints.push(pos);
      this.addSparkle(pos.x, pos.y);
      this.redraw();
    });

    const endDraw = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.evaluateStroke();
    };

    this.canvas.addEventListener('pointerup', endDraw);
    this.canvas.addEventListener('pointercancel', endDraw);
  }

  // Draw 4-line primary school ruling grid (Vở 4 ô li chuẩn Bộ GD&ĐT)
  drawRulingGrid() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    ctx.save();
    // Warm notebook paper background
    ctx.fillStyle = "#FAFDFE";
    ctx.fillRect(0, 0, w, h);

    // Primary school 4-oli ruling proportion (vở ô ly chuẩn tiểu học):
    // 1 oli = ~h * 0.155 (around 42px - 64px, neat and comfortable for kids)
    const oliSize = Math.max(42, Math.min(Math.round(h * 0.155), 64));
    
    // Position Baseline (Dòng 1 - đáy chữ) comfortably at ~66% of canvas height
    const line1Y = Math.round(h * 0.66);
    const line2Y = line1Y - oliSize; // Dòng 2 (1 ô ly)
    const line3Y = line1Y - (2 * oliSize); // Dòng 3 (2 ô ly - đỉnh chữ thấp: a, c, e, o, m, n...)
    const line4Y = line1Y - (3 * oliSize); // Dòng 4 (3 ô ly - đỉnh chữ d, đ, t...)
    const line5Y = line1Y - (4 * oliSize); // Dòng 5 (4 ô ly - đỉnh chữ b, l, h, k...)
    const lineUnderY = line1Y + Math.round(1.5 * oliSize); // Chân chữ g, y, p, q
    const marginX = Math.max(92, Math.round(w * 0.12));

    // Vertical ruling lines (lưới ô vuông nhỏ - mỗi ô vuông = 1 ô li x 1 ô li)
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const centerX = Math.round(w / 2);
    // Left of center
    for (let x = centerX - oliSize; x > marginX; x -= oliSize) {
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, h - 15);
      ctx.stroke();
    }
    // Center and right
    for (let x = centerX; x < w - 20; x += oliSize) {
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, h - 15);
      ctx.stroke();
    }

    // Horizontal ruling lines:
    // Line 5 (nếu vừa trong canvas)
    if (line5Y > 15) {
      ctx.beginPath();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.moveTo(marginX, line5Y);
      ctx.lineTo(w - 20, line5Y);
      ctx.stroke();
    }

    // Line 4 (3 ô li)
    if (line4Y > 15) {
      ctx.beginPath();
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(marginX, line4Y);
      ctx.lineTo(w - 20, line4Y);
      ctx.stroke();
    }

    // Line 3 (ĐỈNH CHỮ THẤP: a, ă, â, o, e, c, n, m...)
    ctx.beginPath();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.moveTo(marginX, line3Y);
    ctx.lineTo(w - 20, line3Y);
    ctx.stroke();

    // Line 2 (ĐƯỜNG KẺ GIỮA - 1 Ô LI)
    ctx.beginPath();
    ctx.strokeStyle = '#7DD3FC';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(marginX, line2Y);
    ctx.lineTo(w - 20, line2Y);
    ctx.stroke();

    // Line 1 (BASE LINE - ĐƯỜNG KẺ ĐẬM ĐÁY CHỮ)
    ctx.beginPath();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([]);
    ctx.moveTo(marginX, line1Y);
    ctx.lineTo(w - 20, line1Y);
    ctx.stroke();

    // Line Under (Chân chữ g, y)
    if (lineUnderY < h - 15) {
      ctx.beginPath();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(marginX, lineUnderY);
      ctx.lineTo(w - 20, lineUnderY);
      ctx.stroke();
    }

    // Red margin line (Đường kẻ lề vở học sinh)
    ctx.beginPath();
    ctx.strokeStyle = '#F87171';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.moveTo(marginX, 15);
    ctx.lineTo(marginX, h - 15);
    ctx.stroke();

    // Ruling line labels on the left margin
    ctx.font = 'bold 12px "Quicksand", "Nunito", system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = '#0284C7';
    ctx.fillText('Dòng 1 (Đáy)', marginX - 10, line1Y);

    ctx.fillStyle = '#0284C7';
    ctx.fillText('Dòng 2', marginX - 10, line2Y);

    ctx.fillStyle = '#0284C7';
    ctx.fillText('Dòng 3', marginX - 10, line3Y);

    if (line4Y > 35) {
      ctx.fillStyle = '#64748B';
      ctx.fillText('Dòng 4', marginX - 10, line4Y);
    }
    if (line5Y > 35) {
      ctx.fillStyle = '#64748B';
      ctx.fillText('Dòng 5', marginX - 10, line5Y);
    }

    ctx.restore();
  }

  // Draw Stroke Guidelines (Uniform Isotropic Scaling Centered Vertically on Ruling Grid)
  drawGuides() {
    if (!this.strokesGuide || !this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Scale calculation:
    // In stroke data: baseline y=112, Line 3 y=64 (height 48 units = 2 ô li).
    const oliSize = Math.max(42, Math.min(Math.round(h * 0.155), 64));
    const line1Y = Math.round(h * 0.66);
    const uniformScale = (oliSize * 2) / 48;

    // Center letter horizontally around x = 54 in stroke data
    const centerX = Math.round(w / 2);
    const offsetX = Math.round(centerX - (54 * uniformScale));
    const offsetY = Math.round(line1Y - (112 * uniformScale));

    ctx.save();
    this.strokesGuide.forEach((st, idx) => {
      const isCurrent = (idx === this.currentStrokeIndex);
      const isDone = (idx < this.currentStrokeIndex);

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(uniformScale, uniformScale);

      const p = new Path2D(st.d);

      // 1. Soft glowing background track for toddler finger guidance
      if (isCurrent) {
        ctx.strokeStyle = '#BAE6FD';
        ctx.lineWidth = 22 / uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke(p);
      }

      if (isDone) {
        // Solid vivid blue ink for completed strokes
        ctx.strokeStyle = '#1D4ED8';
        ctx.lineWidth = 14 / uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke(p);
      } else {
        // Guide dashed line
        ctx.strokeStyle = isCurrent ? '#0284C7' : '#94A3B8';
        ctx.lineWidth = (isCurrent ? 14 : 8) / uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash(isCurrent ? [7, 5] : [4, 4]);
        ctx.stroke(p);
      }
      ctx.restore();

      // Starting point dot & order number for current active stroke
      if (isCurrent && st.start) {
        const sx = offsetX + st.start.x * uniformScale;
        const sy = offsetY + st.start.y * uniformScale;

        // Big glowing green pulse circle
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#16A34A';
        ctx.shadowColor = '#22C55E';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Stroke number tag inside dot
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px "Quicksand", "Nunito", system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.order, sx, sy);

        // Friendly guide badge at the top
        ctx.save();
        const badgeText = `Nét ${st.order}: ${st.label}`;
        ctx.font = 'bold 15px "Quicksand", "Nunito", system-ui';
        const textWidth = ctx.measureText(badgeText).width;
        const badgeX = w / 2;
        const badgeY = 28;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(badgeX - textWidth / 2 - 20, badgeY - 16, textWidth + 40, 32, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0369A1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX, badgeY);
        ctx.restore();
      }
    });
    ctx.restore();
  }

  // Draw user's live drawing line
  drawUserStroke() {
    if (this.userPoints.length < 2) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.userPoints[0].x, this.userPoints[0].y);
    for (let i = 1; i < this.userPoints.length; i++) {
      ctx.lineTo(this.userPoints[i].x, this.userPoints[i].y);
    }
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // Check stroke completion (forgiving kid-friendly tolerance)
  evaluateStroke() {
    if (this.userPoints.length < 5) return; // Too short to be intentional

    this.currentStrokeIndex++;
    this.userPoints = [];

    if (window.MagicWorld.AudioService) {
      window.MagicWorld.AudioService.playSparkle();
    }

    if (this.currentStrokeIndex >= this.strokesGuide.length) {
      // Completed all strokes of the letter!
      if (window.MagicWorld.AudioService) {
        window.MagicWorld.AudioService.playChime();
      }
      this.explodeSparkles();
      if (this.onComplete) {
        this.onComplete();
      }
    }
    this.redraw();
  }

  clear() {
    this.currentStrokeIndex = 0;
    this.userPoints = [];
    this.redraw();
  }

  skip() {
    this.currentStrokeIndex = this.strokesGuide.length;
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

    let currentIdx = 0;
    const runStroke = () => {
      if (currentIdx >= this.strokesGuide.length) {
        this.demoRunning = false;
        this.currentStrokeIndex = 0;
        this.redraw();
        return;
      }
      this.currentStrokeIndex = currentIdx;
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
      if (this.sparkles.length > 0) {
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
