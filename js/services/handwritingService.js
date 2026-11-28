// Magic World Handwriting Service (Interactive 4-Ruling Grid Canvas, Stroke Guidance, Apple Pencil / Pointer Events)
window.MagicWorld = window.MagicWorld || {};

// Ratio-based stroke grading constants (relative to letter height H on canvas)
const HW_CONSTANTS = {
  RESAMPLE_COUNT: 50,      // resample both guide and user stroke to 50 points
  TOLERANCE: 0.14,         // 14% of letter box height H (within 12-15% range)
  START_TOLERANCE: 0.28,   // 28% of H for starting point check
  PASS_THRESHOLD: 0.65,    // >= 65% coverage required to pass
  MIN_DIRECTION_DOT: 0.20, // start->end direction alignment for open strokes
  TIDY_MIN: 0.65,          // anti-scribble: >= 65% of user points near guide
  STAR_3_MIN: 0.90,        // >= 90% = 3 stars
  STAR_2_MIN: 0.80,        // 80-89% = 2 stars, 65-79% = 1 star
  DIFFICULTIES: {
    easy: { tolMult: 1.25, passMin: 0.65 },
    medium: { tolMult: 1.0, passMin: 0.65 },
    hard: { tolMult: 0.85, passMin: 0.72 }
  }
};

function resampleStrokePoints(pts, count) {
  if (!pts || pts.length === 0) return [];
  if (pts.length === 1 || count <= 1) return [pts[0]];
  const cumLen = [0];
  for (let i = 1; i < pts.length; i++) {
    cumLen.push(cumLen[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const totalLen = cumLen[cumLen.length - 1];
  if (totalLen === 0) return Array.from({ length: count }, () => ({ x: pts[0].x, y: pts[0].y }));

  const out = [];
  let segIdx = 0;
  for (let k = 0; k < count; k++) {
    const target = (totalLen * k) / (count - 1);
    while (segIdx < cumLen.length - 2 && cumLen[segIdx + 1] < target) {
      segIdx++;
    }
    const segStart = cumLen[segIdx];
    const segEnd = cumLen[segIdx + 1];
    const t = segEnd > segStart ? (target - segStart) / (segEnd - segStart) : 0;
    out.push({
      x: pts[segIdx].x + (pts[segIdx + 1].x - pts[segIdx].x) * t,
      y: pts[segIdx].y + (pts[segIdx + 1].y - pts[segIdx].y) * t
    });
  }
  return out;
}

function gradeStroke(userPts, guidePts, H, difficulty = 'easy') {
  const diff = HW_CONSTANTS.DIFFICULTIES[difficulty] || HW_CONSTANTS.DIFFICULTIES.easy;
  const n = HW_CONSTANTS.RESAMPLE_COUNT;
  const uRes = resampleStrokePoints(userPts, n);
  const gRes = resampleStrokePoints(guidePts, n);
  if (uRes.length < 2 || gRes.length < 2) {
    return { passed: false, startOk: false, directionOk: false, coverage: 0, tidyRatio: 0, score: 0, H };
  }

  const tol = HW_CONSTANTS.TOLERANCE * H * diff.tolMult;
  const startTol = HW_CONSTANTS.START_TOLERANCE * H * diff.tolMult;
  const tidyTol = tol * 1.5;

  const startOk = Math.hypot(uRes[0].x - gRes[0].x, uRes[0].y - gRes[0].y) <= startTol;

  // Coverage: % of guide resampled points that have a user point within tol
  let guideCovered = 0;
  for (let g = 0; g < gRes.length; g++) {
    const gp = gRes[g];
    for (let u = 0; u < uRes.length; u++) {
      if (Math.hypot(uRes[u].x - gp.x, uRes[u].y - gp.y) <= tol) {
        guideCovered++;
        break;
      }
    }
  }
  const coverage = guideCovered / gRes.length;

  // Anti-scribble: % of user resampled points within tidyTol of guide
  let tidyHits = 0;
  for (let u = 0; u < uRes.length; u++) {
    const up = uRes[u];
    let minDist = Infinity;
    for (let g = 0; g < gRes.length; g++) {
      const d = Math.hypot(up.x - gRes[g].x, up.y - gRes[g].y);
      if (d < minDist) minDist = d;
    }
    if (minDist <= tidyTol) tidyHits++;
  }
  const tidyRatio = tidyHits / uRes.length;

  // Direction check: forward sequential match vs reverse sequential match + start->end vector
  const seqMatchCount = (uArr, gArr) => {
    let matched = 0;
    let uSearch = 0;
    for (let g = 0; g < gArr.length; g++) {
      for (let u = uSearch; u < uArr.length; u++) {
        if (Math.hypot(uArr[u].x - gArr[g].x, uArr[u].y - gArr[g].y) <= tol * 1.35) {
          matched++;
          uSearch = u;
          break;
        }
      }
    }
    return matched / gArr.length;
  };
  const fwdSeq = seqMatchCount(uRes, gRes);
  const revSeq = seqMatchCount(uRes, [...gRes].reverse());

  const gDx = gRes[gRes.length - 1].x - gRes[0].x;
  const gDy = gRes[gRes.length - 1].y - gRes[0].y;
  const gSpan = Math.hypot(gDx, gDy);
  const uDx = uRes[uRes.length - 1].x - uRes[0].x;
  const uDy = uRes[uRes.length - 1].y - uRes[0].y;
  const uSpan = Math.hypot(uDx, uDy);

  let vectorOk = true;
  if (gSpan > 0.18 * H && uSpan > 0.1 * H) {
    const dot = (gDx * uDx + gDy * uDy) / (gSpan * uSpan);
    vectorOk = dot >= HW_CONSTANTS.MIN_DIRECTION_DOT;
  }
  const directionOk = vectorOk && fwdSeq >= 0.45 && fwdSeq >= revSeq - 0.05;

  const passed = startOk && directionOk && coverage >= diff.passMin && tidyRatio >= HW_CONSTANTS.TIDY_MIN;
  return { passed, startOk, directionOk, coverage, tidyRatio, fwdSeq, revSeq, score: coverage, H };
}

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
    this.completedUserStrokes = [];
    this.lastWrongPoints = null;
    this.sparkles = [];
    this.animationId = null;
    this.onComplete = null;
    this.onReset = null;
    this.demoRunning = false;
    this.demoDotPos = null;
    this.wrongShakeUntil = 0;
    this.wrongAttempts = 0;
    this.retryRadiusMult = 1.0;
    this.difficulty = 'easy';
    this.lastEvalDebug = null;
    this.width = 0;
    this.height = 0;
  }

  setDifficulty(level) {
    this.difficulty = HW_CONSTANTS.DIFFICULTIES[level] ? level : 'easy';
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

  loadLetter(letterKey, customStrokes = null) {
    this.currentLetter = letterKey;
    const strokesData = window.MagicWorld.Strokes || {};
    this.strokesGuide = customStrokes || strokesData[letterKey] || strokesData['a'];
    this.currentStrokeIndex = 0;
    this.userPoints = [];
    this.completedUserStrokes = [];
    this.lastWrongPoints = null;
    this.demoRunning = false;
    this.demoDotPos = null;
    this.wrongShakeUntil = 0;
    this.wrongAttempts = 0;
    this.retryRadiusMult = 1.0;
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
      this.lastWrongPoints = null;
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
    ctx.fillStyle = "#FFF8FB";
    ctx.fillRect(0, 0, w, h);

    const oliSize = Math.max(46, Math.min(Math.round(h * 0.165), 68));
    const line1Y = Math.round(h * 0.66);      // Đáy (đậm)
    const line2Y = line1Y - oliSize;          // Giữa
    const line3Y = line1Y - (2 * oliSize);    // Trên
    const marginX = 24;

    // Line 3 (Trên)
    ctx.beginPath();
    ctx.strokeStyle = '#F9A8D4';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.moveTo(marginX, line3Y);
    ctx.lineTo(w - marginX, line3Y);
    ctx.stroke();

    // Line 2 (Giữa)
    ctx.beginPath();
    ctx.strokeStyle = '#FCE7F3';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(marginX, line2Y);
    ctx.lineTo(w - marginX, line2Y);
    ctx.stroke();

    // Line 1 (Đáy - đậm hơn)
    ctx.beginPath();
    ctx.strokeStyle = '#EC4899';
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

      // Soft glowing pink background track for active stroke
      if (isCurrent) {
        ctx.strokeStyle = '#FBCFE8';
        ctx.lineWidth = 24 / tr.uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke(p);
      }

      if (isDone) {
        // Keep faint dashed guide behind the child's actual drawn stroke
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 10 / tr.uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([5, 5]);
        ctx.stroke(p);
      } else {
        // Thicker dashed guide path
        ctx.strokeStyle = isCurrent ? '#EC4899' : '#CBD5E1';
        ctx.lineWidth = (isCurrent ? 16 : 9) / tr.uniformScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash(isCurrent ? [8, 6] : [5, 5]);
        ctx.stroke(p);
      }
      ctx.restore();

      // Blinking pink starting point dot & big order number for active stroke
      if (isCurrent && st.start) {
        const sx = tr.offsetX + curShake + st.start.x * tr.uniformScale;
        const sy = tr.offsetY + st.start.y * tr.uniformScale;
        const pulse = (Math.sin(now * 0.006) + 1) * 0.5; // 0..1

        // Outer pulsing halo
        ctx.beginPath();
        ctx.arc(sx, sy, 20 + pulse * 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 72, 153, ${0.35 - pulse * 0.22})`;
        ctx.fill();

        // Main pink circle
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#EC4899';
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

  // Smooth thick polyline renderer for exact child strokes
  drawSmoothPolyline(pts, strokeStyle, lineWidth) {
    if (!pts || pts.length < 2) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  drawUserStroke() {
    for (const item of this.completedUserStrokes) {
      this.drawSmoothPolyline(item.points, '#6D28D9', 13);
    }
    if (this.lastWrongPoints && this.lastWrongPoints.length >= 2) {
      this.drawSmoothPolyline(this.lastWrongPoints, '#EA580C', 13);
    }
    if (this.userPoints.length >= 2) {
      this.drawSmoothPolyline(this.userPoints, '#4C1D95', 14);
    }
  }

  getLetterHeightPx(tr) {
    return (tr && tr.oliSize ? tr.oliSize * 2 : 96);
  }

  // Ratio-based stroke validation (scales with letter height H, direction, stroke order, anti-scribble)
  evaluateStroke() {
    const st = this.strokesGuide && this.strokesGuide[this.currentStrokeIndex];
    if (!st) return;

    const tr = this.getLetterTransform();
    const H = this.getLetterHeightPx(tr);

    // Special forgiving check for dot tone mark ("Dấu nặng")
    if (st.isDot && st.start) {
      if (this.userPoints.length === 0) return;
      const sx = tr.offsetX + st.start.x * tr.uniformScale;
      const sy = tr.offsetY + st.start.y * tr.uniformScale;
      const p0 = this.userPoints[0];
      const pLast = this.userPoints[this.userPoints.length - 1];
      const dist = Math.min(Math.hypot(p0.x - sx, p0.y - sy), Math.hypot(pLast.x - sx, pLast.y - sy));
      if (dist <= HW_CONSTANTS.START_TOLERANCE * H) {
        this.advanceStrokeSuccess(3, 1.0);
      } else {
        this.handleWrongStroke('mismatch', { startOk: false, directionOk: true, coverage: 0, tidyRatio: 0, score: 0 });
      }
      return;
    }

    const { pts: guidePts, totalLen } = this.getGuideSamplePoints(st.d, tr, HW_CONSTANTS.RESAMPLE_COUNT);

    if (this.userPoints.length < 3) {
      this.handleWrongStroke('too-short', { startOk: false, directionOk: false, coverage: 0, tidyRatio: 0, score: 0 });
      return;
    }

    let userLen = 0;
    for (let i = 1; i < this.userPoints.length; i++) {
      userLen += Math.hypot(
        this.userPoints[i].x - this.userPoints[i - 1].x,
        this.userPoints[i].y - this.userPoints[i - 1].y
      );
    }
    if (userLen < Math.max(8, totalLen * 0.15)) {
      this.handleWrongStroke('too-short', { startOk: false, directionOk: false, coverage: 0, tidyRatio: 0, score: 0 });
      return;
    }

    const evalRes = gradeStroke(this.userPoints, guidePts, H, this.difficulty);
    this.lastEvalDebug = evalRes;

    if (evalRes.passed) {
      const stars = evalRes.coverage >= HW_CONSTANTS.STAR_3_MIN ? 3 : (evalRes.coverage >= HW_CONSTANTS.STAR_2_MIN ? 2 : 1);
      this.advanceStrokeSuccess(stars, evalRes.coverage);
      return;
    }

    // Check if the child drew a later stroke out of order (e.g. stroke 2 before stroke 1)
    for (let k = this.currentStrokeIndex + 1; k < this.strokesGuide.length; k++) {
      const laterGuide = this.getGuideSamplePoints(this.strokesGuide[k].d, tr, HW_CONSTANTS.RESAMPLE_COUNT).pts;
      const laterRes = gradeStroke(this.userPoints, laterGuide, H, 'easy');
      if (laterRes.passed || (laterRes.startOk && laterRes.coverage >= 0.55)) {
        this.handleWrongStroke('wrong-order', evalRes);
        return;
      }
    }

    this.handleWrongStroke('mismatch', evalRes);
  }

  advanceStrokeSuccess(stars, coverageScore) {
    this.completedUserStrokes.push({
      points: this.userPoints.slice(),
      stars,
      score: typeof coverageScore === 'number' ? coverageScore : HW_CONSTANTS.PASS_THRESHOLD
    });
    this.currentStrokeIndex++;
    this.userPoints = [];
    this.lastWrongPoints = null;
    this.wrongAttempts = 0;
    this.updateStrokeBadge();

    if (window.MagicWorld.AudioService) {
      window.MagicWorld.AudioService.playSparkle();
    }

    if (window.MagicWorldAppInstance && window.MagicWorldAppInstance.showHoldHint) {
      window.MagicWorldAppInstance.showHoldHint(`${'⭐'.repeat(stars)} Đẹp quá!`);
    }

    if (this.currentStrokeIndex >= this.strokesGuide.length) {
      const total = this.completedUserStrokes.reduce((sum, s) => sum + s.score, 0);
      const avgScore = this.completedUserStrokes.length ? total / this.completedUserStrokes.length : 0;
      const letterPassed = avgScore >= HW_CONSTANTS.PASS_THRESHOLD;
      if (letterPassed) {
        const letterStars = avgScore >= HW_CONSTANTS.STAR_3_MIN ? 3 : (avgScore >= HW_CONSTANTS.STAR_2_MIN ? 2 : 1);
        if (window.MagicWorld.AudioService) {
          window.MagicWorld.AudioService.playChime();
        }
        this.explodeSparkles();
        if (this.onComplete) {
          this.onComplete(letterStars, avgScore);
        }
      }
    }
    this.redraw();
  }

  handleWrongStroke(reason, evalRes) {
    this.wrongAttempts++;
    // Keep the child's stroke visible in coral-orange so they can compare with the guide
    this.lastWrongPoints = this.userPoints.length >= 2 ? this.userPoints.slice() : null;
    this.userPoints = [];
    this.wrongShakeUntil = performance.now() + 450;

    if (window.MagicWorldAppInstance && window.MagicWorldAppInstance.showHoldHint) {
      if (reason === 'wrong-order') {
        window.MagicWorldAppInstance.showHoldHint(`Mình viết nét ${this.currentStrokeIndex + 1} trước nhé!`);
      } else {
        window.MagicWorldAppInstance.showHoldHint('Gần đúng rồi, con thử lại nhé!');
      }
    }

    if (window.MagicWorld.AudioService) {
      window.MagicWorld.AudioService.playPop();
    }
    this.redraw();
  }

  playDemoForCurrentStroke() {
    if (this.demoRunning || !this.strokesGuide) return;
    const st = this.strokesGuide[this.currentStrokeIndex];
    if (!st) return;
    this.demoRunning = true;
    const tr = this.getLetterTransform();
    const { pts } = this.getGuideSamplePoints(st.d, tr, 20);
    let step = 0;
    const anim = () => {
      if (!this.demoRunning || step >= pts.length) {
        this.demoRunning = false;
        this.demoDotPos = null;
        this.redraw();
        return;
      }
      this.demoDotPos = pts[step];
      step++;
      this.redraw();
      setTimeout(anim, 35);
    };
    anim();
  }

  clear() {
    this.currentStrokeIndex = 0;
    this.userPoints = [];
    this.completedUserStrokes = [];
    this.lastWrongPoints = null;
    this.wrongShakeUntil = 0;
    this.wrongAttempts = 0;
    this.retryRadiusMult = 1.0;
    this.demoDotPos = null;
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
    this.completedUserStrokes = [];
    this.lastWrongPoints = null;
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
        color: ['#FF6FAE', '#B388FF', '#FBBF24', '#F472B6'][Math.floor(Math.random() * 4)]
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

    if (this.demoDotPos) {
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.demoDotPos.x, this.demoDotPos.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

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

const VN_BASE_TO_STROKE_KEY = {
  a: 'a', 'ă': 'aw', 'â': 'aa',
  b: 'b', c: 'c', d: 'd', 'đ': 'dd',
  e: 'e', 'ê': 'ee',
  g: 'g', h: 'h', i: 'i', k: 'k', l: 'l', m: 'm', n: 'n',
  o: 'o', 'ô': 'oo', 'ơ': 'ow',
  p: 'p', q: 'q', r: 'r', s: 's', t: 't',
  u: 'u', 'ư': 'uw',
  v: 'v', x: 'x', y: 'y'
};

const VN_TONE_MARKS = {
  '\u0301': 'sac',   // sắc
  '\u0300': 'huyen', // huyền
  '\u0309': 'hoi',   // hỏi
  '\u0303': 'nga',   // ngã
  '\u0323': 'nang'   // nặng
};

function buildToneStroke(tone, order, hasHatOrBreve) {
  const dy = hasHatOrBreve ? -6 : 0;
  if (tone === 'sac') {
    return { order, label: 'Dấu sắc', d: `M 64 ${34 + dy} L 46 ${48 + dy}`, start: { x: 64, y: 34 + dy } };
  }
  if (tone === 'huyen') {
    return { order, label: 'Dấu huyền', d: `M 44 ${34 + dy} L 62 ${48 + dy}`, start: { x: 44, y: 34 + dy } };
  }
  if (tone === 'hoi') {
    return { order, label: 'Dấu hỏi', d: `M 48 ${34 + dy} C 58 ${28 + dy} 62 ${38 + dy} 50 ${44 + dy} L 54 ${49 + dy}`, start: { x: 48, y: 34 + dy } };
  }
  if (tone === 'nga') {
    return { order, label: 'Dấu ngã', d: `M 42 ${44 + dy} Q 48 ${36 + dy} 54 ${42 + dy} Q 60 ${48 + dy} 66 ${40 + dy}`, start: { x: 42, y: 44 + dy } };
  }
  if (tone === 'nang') {
    return { order, label: 'Dấu nặng', isDot: true, d: 'M 54 119 A 3.5 3.5 0 1 1 53.9 119', start: { x: 54, y: 122 } };
  }
  return null;
}

function decomposeVietnameseWord(wordText) {
  const strokesData = window.MagicWorld.Strokes || {};
  const chars = Array.from((wordText || '').toLowerCase());
  const result = [];
  for (const ch of chars) {
    if (ch === ' ') continue;
    const nfd = ch.normalize('NFD');
    let tone = null;
    let baseChars = '';
    for (const part of Array.from(nfd)) {
      if (VN_TONE_MARKS[part]) {
        tone = VN_TONE_MARKS[part];
      } else {
        baseChars += part;
      }
    }
    const baseLetter = baseChars.normalize('NFC');
    const strokeKey = VN_BASE_TO_STROKE_KEY[baseLetter];
    if (!strokeKey || !strokesData[strokeKey]) continue;
    const baseStrokes = strokesData[strokeKey].map(s => ({ ...s, start: s.start ? { ...s.start } : undefined }));
    const hasHatOrBreve = ['aw', 'aa', 'ee', 'oo'].includes(strokeKey);
    if (tone) {
      const toneStroke = buildToneStroke(tone, baseStrokes.length + 1, hasHatOrBreve);
      if (toneStroke) baseStrokes.push(toneStroke);
    }
    result.push({ char: ch, baseLetter, strokeKey, tone, strokes: baseStrokes });
  }
  return result;
}

window.MagicWorld.HandwritingGrade = { HW_CONSTANTS, resampleStrokePoints, gradeStroke, decomposeVietnameseWord };
window.MagicWorld.HandwritingService = new HandwritingService();
