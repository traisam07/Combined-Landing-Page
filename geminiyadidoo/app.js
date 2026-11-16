/* ==========================================================================
   PULSEMIND — INTERACTIVE CLINICAL WORKSTATION, TELEMETRY & SURVEY ENGINE
   Bach Khoa Innovation 2026 Grand Finalist
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initHeroWaveformCanvas();
  initWorkstationPrototype();
  initSurveyExplorer();
  initFinancialSimulator();
  initArchitectureBlueprints();
  initRegistersTabs();
});

/* ==========================================================================
   1. LIVE ICU UNIT CLOCK
   ========================================================================== */
function initLiveClock() {
  const clockEl = document.getElementById('topLiveClock');
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss} ICT`;
  }
  updateClock();
  setInterval(updateClock, 1000);
}

/* ==========================================================================
   2. HERO INTERACTIVE TELEMETRY & WAVEFORM VISUALIZER (CANVAS)
   ========================================================================== */
function initHeroWaveformCanvas() {
  const canvas = document.getElementById('pulseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnChaos = document.getElementById('btnModeChaos');
  const btnAligned = document.getElementById('btnModeAligned');
  const hudStream = document.getElementById('hudStreamState');
  const hudPrompt = document.getElementById('hudPromptState');

  let simMode = 'aligned'; // 'aligned' | 'chaos'
  let phase = 0;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function setMode(mode) {
    simMode = mode;
    if (mode === 'chaos') {
      btnChaos.classList.add('active');
      btnAligned.classList.remove('active');
      hudStream.textContent = 'FRAGMENTED · 4.25 UNSYNCHRONIZED SOURCES';
      hudPrompt.textContent = '⚠ 14 THRESHOLD ALARMS // HIGH FATIGUE';
    } else {
      btnAligned.classList.add('active');
      btnChaos.classList.remove('active');
      hudStream.textContent = 'CHRONOLOGICALLY ALIGNED · 60M WINDOW';
      hudPrompt.textContent = 'HIGH RISK (68.2%) · RR + PEEP DRIVEN';
    }
  }

  btnChaos?.addEventListener('click', () => setMode('chaos'));
  btnAligned?.addEventListener('click', () => setMode('aligned'));

  function drawFrame() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    ctx.clearRect(0, 0, w, h);

    phase += 0.032;

    // Draw threshold reference lines
    ctx.save();
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.35)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    const critY = h * 0.28;
    ctx.beginPath();
    ctx.moveTo(0, critY);
    ctx.lineTo(w, critY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(253, 164, 175, 0.75)';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText(
      simMode === 'aligned'
        ? 'SELECTIVE PROMPT GATE (HIGH / CRITICAL THRESHOLD)'
        : 'RAW BEDSIDE ALARM THRESHOLD (UNFILTERED)',
      16,
      critY - 6
    );
    ctx.restore();

    if (simMode === 'aligned') {
      // Draw secondary aligned physiological traces (PEEP, SpO2, Vt)
      const subTraces = [
        { color: 'rgba(148, 163, 184, 0.35)', amp: 14, freq: 0.022, yOffset: h * 0.72 },
        { color: 'rgba(56, 189, 248, 0.35)', amp: 10, freq: 0.035, yOffset: h * 0.62 }
      ];

      subTraces.forEach((tr, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = tr.color;
        ctx.lineWidth = 1.5;
        for (let x = 0; x <= w; x += 4) {
          const y =
            tr.yOffset +
            Math.sin(x * tr.freq + phase * (1 + idx * 0.3)) * tr.amp +
            Math.cos(x * 0.01 - phase) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Draw main PulseMind Time-Aligned Crimson Risk Trajectory (rising from 54% to 68.2%)
      ctx.save();
      const grad = ctx.createLinearGradient(0, critY, 0, h);
      grad.addColorStop(0, 'rgba(225, 29, 72, 0.32)');
      grad.addColorStop(1, 'rgba(225, 29, 72, 0.0)');

      ctx.beginPath();
      const points = [];
      for (let x = 24; x <= w - 24; x += 6) {
        const progress = (x - 24) / (w - 48);
        // Smooth upward risk trajectory with subtle respiratory modulation
        const baseCurve = h * 0.68 - progress * (h * 0.34);
        const respWave =
          Math.sin(x * 0.045 - phase * 1.4) * 6 +
          Math.pow(Math.max(0, Math.sin(x * 0.09 - phase * 2.8)), 3) * -10;
        const y = baseCurve + respWave;
        points.push({ x, y });
        if (x === 24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#E11D48';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(225, 29, 72, 0.6)';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Fill under trajectory
      if (points.length > 1) {
        ctx.lineTo(points[points.length - 1].x, h);
        ctx.lineTo(points[0].x, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();

      // Draw time-aligned anchor nodes (20:55, 20:59, 21:04, 21:08, 21:13)
      const timeLabels = ['20:55', '20:59', '21:04', '21:08', '21:13 (68.2%)'];
      timeLabels.forEach((lbl, i) => {
        const idx = Math.min(
          points.length - 1,
          Math.floor((i / (timeLabels.length - 1)) * (points.length - 1))
        );
        const pt = points[idx];
        if (!pt) return;

        ctx.save();
        ctx.fillStyle = i === timeLabels.length - 1 ? '#FF4D6D' : '#FFFFFF';
        ctx.strokeStyle = '#C8102E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, i === timeLabels.length - 1 ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        const textAlignOffset = i === timeLabels.length - 1 ? -68 : -16;
        ctx.fillText(lbl, pt.x + textAlignOffset, pt.y - 12);
        ctx.restore();
      });
    } else {
      // CHAOS MODE: 4.25 fragmented device streams with uncoordinated spikes and gaps
      const chaosStreams = [
        { name: 'VENTILATOR (POINT-IN-TIME)', yBase: h * 0.35, color: '#EF4444', speed: 2.6 },
        { name: 'BEDSIDE MONITOR (SPO2/HR)', yBase: h * 0.55, color: '#F59E0B', speed: 1.9 },
        { name: 'ABG LAB (DELAYED SNAPSHOT)', yBase: h * 0.72, color: '#38BDF8', speed: 1.1 },
        { name: 'MANUAL FLOWSHEET', yBase: h * 0.85, color: '#A855F7', speed: 0.8 }
      ];

      chaosStreams.forEach((st, sIdx) => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 1.8;

        for (let x = 0; x < w; x += 5) {
          // Introduce missing/unsynchronized gaps
          if ((x + sIdx * 70) % 190 > 155) {
            ctx.moveTo(x, st.yBase);
            continue;
          }
          const spike =
            Math.sin(x * 0.08 + phase * st.speed + sIdx) * 16 +
            (Math.sin(x * 0.23 - phase * 3 + sIdx) > 0.85 ? -28 : 0);
          const y = st.yBase + spike;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = st.color;
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(st.name, 16, st.yBase - 18);
        ctx.restore();
      });
    }

    requestAnimationFrame(drawFrame);
  }

  requestAnimationFrame(drawFrame);
}

/* ==========================================================================
   3. INTERACTIVE 3-SCREEN PULSEMIND CLINICAL WORKSTATION PROTOTYPE
   (Exact data & workflow from Section 3, Figures 4, 5, 6, 7, 8 of BKI Report)
   ========================================================================== */
const PROTOTYPE_PATIENTS = [
  {
    id: 'PT-2006',
    reviewState: 'PENDING',
    riskLevel: 'CRITICAL',
    riskScore: 90.6,
    dataStatus: 'DATA SUFFICIENCY UNKNOWN',
    primaryDriver: 'Minute ventilation (0.591)',
    readingTime: '21:14 local (1 min ago)',
    integrityWarning: 'Data integrity: 2 warnings on this patient (Data sufficiency unknown)',
    readingsHeld: '4 readings at this level',
    dataSufficiency: 'Unknown',
    imputedShare: '31.2%',
    docShare: '68.0%',
    explanation:
      'Minute ventilation carries the largest contribution in this reading, followed by Respiratory rate. Note: Data sufficiency is currently unknown due to unverified ABG timestamp linkage.',
    history: [74, 79, 84, 88, 90.6],
    drivers: [
      { name: 'Minute ventilation', pct: 59.1 },
      { name: 'Respiratory rate', pct: 52.8 },
      { name: 'PEEP', pct: 44.0 },
      { name: 'Driving pressure', pct: 38.2 }
    ],
    parameters: [
      { name: 'Respiratory rate', val: '28', unit: 'breaths/min', source: 'Measured', charted: '21:14 local (1 min ago)', modelUse: 'Current score factor', series: [24, 25, 26, 28], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Tidal volume', val: '460', unit: 'mL', source: 'Measured', charted: '21:14 local (1 min ago)', modelUse: 'Model use unknown', series: [450, 455, 455, 460], provenance: ['M', 'M', 'CF', 'M'] },
      { name: 'PEEP', val: '12', unit: 'cmH₂O', source: 'Measured', charted: '21:14 local (1 min ago)', modelUse: 'Current score factor', series: [10, 10, 12, 12], provenance: ['M', 'CF', 'M', 'M'] },
      { name: 'FiO2', val: '0.70', unit: 'fraction (0–1)', source: 'Measured', charted: '21:14 local (1 min ago)', modelUse: 'Current score factor', series: [0.60, 0.65, 0.70, 0.70], provenance: ['M', 'M', 'M', 'CF'] },
      { name: 'SpO2', val: '89', unit: '%', source: 'Measured', charted: '21:14 local (1 min ago)', modelUse: 'Model use unknown', series: [92, 91, 90, 89], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Plateau pressure', val: '29', unit: 'cmH₂O', source: 'Carried forward', charted: '21:14 local (last measured 24m ago)', modelUse: 'Model use unknown', series: [28, 29, 29, 29], provenance: ['M', 'M', 'CF', 'CF'] },
      { name: 'Driving pressure', val: '17', unit: 'cmH₂O', source: 'Measured', charted: '21:14 local (1 min ago)', modelUse: 'Current score factor', series: [15, 16, 17, 17], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Minute ventilation', val: '13.4', unit: 'L/min', source: 'Measured', charted: '21:14 local (1 min ago)', modelUse: 'Current score factor', series: [11.2, 12.0, 12.8, 13.4], provenance: ['M', 'M', 'M', 'M'] }
    ]
  },
  {
    id: 'PT-2018',
    reviewState: 'PENDING',
    riskLevel: 'CRITICAL',
    riskScore: 90.2,
    dataStatus: 'SUFFICIENT',
    primaryDriver: 'PEEP (0.64)',
    readingTime: '21:13 local (2 min ago)',
    integrityWarning: 'Data integrity: All required ventilator & monitor streams verified',
    readingsHeld: '3 readings at this level',
    dataSufficiency: 'Sufficient',
    imputedShare: '12.0%',
    docShare: '82.4%',
    explanation:
      'PEEP carries the largest contribution in this reading (64.0%), followed by Driving pressure and FiO2 across the last 60-minute window.',
    history: [76, 81, 85, 89, 90.2],
    drivers: [
      { name: 'PEEP', pct: 64.0 },
      { name: 'Driving pressure', pct: 54.2 },
      { name: 'FiO2', pct: 47.5 },
      { name: 'Respiratory rate', pct: 39.1 }
    ],
    parameters: [
      { name: 'Respiratory rate', val: '25', unit: 'breaths/min', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [22, 23, 24, 25], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Tidal volume', val: '410', unit: 'mL', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [420, 415, 410, 410], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'PEEP', val: '14', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [10, 12, 14, 14], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'FiO2', val: '0.65', unit: 'fraction (0–1)', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [0.55, 0.60, 0.65, 0.65], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'SpO2', val: '91', unit: '%', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [94, 92, 91, 91], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Plateau pressure', val: '30', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [26, 28, 30, 30], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Driving pressure', val: '16', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [14, 15, 16, 16], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Minute ventilation', val: '11.8', unit: 'L/min', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [10.5, 11.0, 11.5, 11.8], provenance: ['M', 'M', 'M', 'M'] }
    ]
  },
  {
    id: 'PT-1001',
    reviewState: 'PENDING',
    riskLevel: 'CRITICAL',
    riskScore: 87.2,
    dataStatus: 'SUFFICIENT',
    primaryDriver: 'PEEP (0.623)',
    readingTime: '21:13 local (2 min ago)',
    integrityWarning: 'Data integrity: Sufficient completeness across 60m window',
    readingsHeld: '2 readings at this level',
    dataSufficiency: 'Sufficient',
    imputedShare: '14.5%',
    docShare: '79.0%',
    explanation:
      'PEEP carries the largest contribution in this reading (62.3%), accompanied by elevated Driving pressure and FiO2 requirements.',
    history: [69, 74, 80, 84, 87.2],
    drivers: [
      { name: 'PEEP', pct: 62.3 },
      { name: 'Driving pressure', pct: 48.9 },
      { name: 'FiO2', pct: 41.2 },
      { name: 'Respiratory rate', pct: 33.4 }
    ],
    parameters: [
      { name: 'Respiratory rate', val: '24', unit: 'breaths/min', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [20, 22, 23, 24], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Tidal volume', val: '405', unit: 'mL', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [410, 405, 405, 405], provenance: ['M', 'M', 'CF', 'M'] },
      { name: 'PEEP', val: '12', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [8, 10, 12, 12], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'FiO2', val: '0.60', unit: 'fraction (0–1)', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [0.50, 0.55, 0.60, 0.60], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'SpO2', val: '92', unit: '%', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [95, 94, 92, 92], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Plateau pressure', val: '27', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [24, 25, 27, 27], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Driving pressure', val: '15', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [13, 14, 15, 15], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Minute ventilation', val: '10.9', unit: 'L/min', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [9.8, 10.2, 10.6, 10.9], provenance: ['M', 'M', 'M', 'M'] }
    ]
  },
  {
    id: 'PT-2001',
    reviewState: 'PENDING',
    riskLevel: 'HIGH',
    riskScore: 73.8,
    dataStatus: 'DATA-LIMITED',
    primaryDriver: 'SpO2 (0.596)',
    readingTime: '21:12 local (3 min ago)',
    integrityWarning: 'Data integrity: 1 warning (Data-limited — 2 parameters carried forward)',
    readingsHeld: '2 readings at this level',
    dataSufficiency: 'Data-Limited',
    imputedShare: '26.8%',
    docShare: '71.2%',
    explanation:
      'SpO2 carries the largest contribution in this reading (59.6%), followed by FiO2. Explicit Data-Limited flag indicates carried-forward plateau pressure readings.',
    history: [58, 63, 68, 71, 73.8],
    drivers: [
      { name: 'SpO2', pct: 59.6 },
      { name: 'FiO2', pct: 46.2 },
      { name: 'Respiratory rate', pct: 38.0 },
      { name: 'PEEP', pct: 29.4 }
    ],
    parameters: [
      { name: 'Respiratory rate', val: '22', unit: 'breaths/min', source: 'Measured', charted: '21:12 local (3 min ago)', modelUse: 'Current score factor', series: [19, 20, 21, 22], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Tidal volume', val: '430', unit: 'mL', source: 'Measured', charted: '21:12 local (3 min ago)', modelUse: 'Model use unknown', series: [430, 430, 430, 430], provenance: ['M', 'CF', 'CF', 'M'] },
      { name: 'PEEP', val: '8', unit: 'cmH₂O', source: 'Measured', charted: '21:12 local (3 min ago)', modelUse: 'Current score factor', series: [8, 8, 8, 8], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'FiO2', val: '0.55', unit: 'fraction (0–1)', source: 'Measured', charted: '21:12 local (3 min ago)', modelUse: 'Current score factor', series: [0.45, 0.50, 0.55, 0.55], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'SpO2', val: '91', unit: '%', source: 'Measured', charted: '21:12 local (3 min ago)', modelUse: 'Current score factor', series: [95, 93, 92, 91], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Plateau pressure', val: '24', unit: 'cmH₂O', source: 'Carried forward', charted: '21:12 local (last measured 22m ago)', modelUse: 'Model use unknown', series: [24, 24, 24, 24], provenance: ['M', 'CF', 'CF', 'CF'] },
      { name: 'Driving pressure', val: '14', unit: 'cmH₂O', source: 'Carried forward', charted: '21:12 local (last measured 22m ago)', modelUse: 'Model use unknown', series: [14, 14, 14, 14], provenance: ['M', 'CF', 'CF', 'CF'] },
      { name: 'Minute ventilation', val: '9.9', unit: 'L/min', source: 'Measured', charted: '21:12 local (3 min ago)', modelUse: 'Model use unknown', series: [9.4, 9.6, 9.8, 9.9], provenance: ['M', 'M', 'M', 'M'] }
    ]
  },
  {
    // EXACT REPLICA OF FIGURE 6 & FIGURE 7 IN PDF REPORT!
    id: 'PT-1002',
    reviewState: 'PENDING',
    riskLevel: 'HIGH',
    riskScore: 68.2,
    dataStatus: 'SUFFICIENT',
    primaryDriver: 'Respiratory rate (0.647)',
    readingTime: '21:13 local (1 min ago)',
    integrityWarning: 'Data integrity: 1 warning on this patient (Minute ventilation carried forward)',
    readingsHeld: '3 readings at this level',
    dataSufficiency: 'Sufficient',
    imputedShare: '18.4%',
    docShare: '77.5%',
    explanation:
      'Respiratory rate carries the largest contribution in this reading, followed by PEEP. The remaining recorded factors contribute less individually.',
    history: [54, 60, 64, 66.5, 68.2],
    drivers: [
      { name: 'Respiratory rate', pct: 64.7 },
      { name: 'PEEP', pct: 50.4 },
      { name: 'Driving pressure', pct: 41.4 },
      { name: 'FiO2', pct: 29.6 }
    ],
    parameters: [
      { name: 'Respiratory rate', val: '21', unit: 'breaths/min', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [22, 19, 20, 21], provenance: ['CF', 'M', 'M', 'M'] },
      { name: 'Tidal volume', val: '399', unit: 'mL', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [405, 402, 400, 399], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'PEEP', val: '7', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [6, 6, 7, 7], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'FiO2', val: '0.54', unit: 'fraction (0–1)', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [0.50, 0.50, 0.54, 0.54], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'SpO2', val: '93', unit: '%', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [95, 94, 94, 93], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Plateau pressure', val: '23', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Model use unknown', series: [21, 22, 23, 23], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Driving pressure', val: '12', unit: 'cmH₂O', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [11, 11, 12, 12], provenance: ['M', 'M', 'M', 'M'] },
      { name: 'Minute ventilation', val: '10.7', unit: 'L/min', source: 'Carried forward', charted: '21:13 local (last measured 20:57, 18m ago)', modelUse: 'Model use unknown', series: [10.7, 10.7, 10.7, 10.7], provenance: ['M', 'CF', 'CF', 'CF'] }
    ]
  },
  {
    id: 'PT-2007',
    reviewState: 'PENDING',
    riskLevel: 'UNAVAILABLE',
    riskScore: null,
    dataStatus: 'DATA SUFFICIENCY UNKNOWN',
    primaryDriver: 'No ranked factors available',
    readingTime: '21:10 local (5 min ago)',
    integrityWarning: 'Explicit Unavailable State: Insufficient synchronized inputs to compute calibrated risk score.',
    readingsHeld: 'Score unavailable',
    dataSufficiency: 'Unknown',
    imputedShare: 'N/A',
    docShare: 'N/A',
    explanation:
      'PulseMind displays an explicit RISK LEVEL UNAVAILABLE state rather than leaving fields blank or guessing when minimum data-sufficiency criteria are not met.',
    history: [45, 46, 46, 46, 46],
    drivers: [],
    parameters: [
      { name: 'Respiratory rate', val: '18', unit: 'breaths/min', source: 'Carried forward', charted: '21:10 local (25 min ago)', modelUse: 'Model use unknown', series: [18, 18, 18, 18], provenance: ['M', 'CF', 'CF', 'CF'] }
    ]
  },
  {
    id: 'PT-1003',
    reviewState: 'REVIEWED',
    riskLevel: 'MEDIUM',
    riskScore: 55.1,
    dataStatus: 'SUFFICIENT',
    primaryDriver: 'Minute ventilation (0.6)',
    readingTime: '21:13 local (2 min ago)',
    integrityWarning: 'Data integrity: Sufficient completeness',
    readingsHeld: '4 readings at this level',
    dataSufficiency: 'Sufficient',
    imputedShare: '9.2%',
    docShare: '85.1%',
    explanation:
      'Medium risk assessment (55.1%). Does not meet High/Critical threshold for generating a selective review prompt; remains accessible via routine monitoring.',
    history: [58, 57, 56, 55.5, 55.1],
    drivers: [
      { name: 'Minute ventilation', pct: 60.0 },
      { name: 'PEEP', pct: 32.0 }
    ],
    parameters: [
      { name: 'Respiratory rate', val: '17', unit: 'breaths/min', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [18, 17, 17, 17], provenance: ['M', 'M', 'M', 'M'] }
    ]
  },
  {
    id: 'PT-1004',
    reviewState: 'REVIEWED',
    riskLevel: 'LOW',
    riskScore: 25.4,
    dataStatus: 'SUFFICIENT',
    primaryDriver: 'FiO2 (0.595)',
    readingTime: '21:13 local (2 min ago)',
    integrityWarning: 'Data integrity: Sufficient completeness',
    readingsHeld: '6 readings at this level',
    dataSufficiency: 'Sufficient',
    imputedShare: '6.4%',
    docShare: '88.0%',
    explanation:
      'Low risk trajectory (25.4%). Stable ventilator and oxygenation parameters across the 60-minute window.',
    history: [30, 28, 27, 26, 25.4],
    drivers: [
      { name: 'FiO2', pct: 59.5 },
      { name: 'PEEP', pct: 21.0 }
    ],
    parameters: [
      { name: 'Respiratory rate', val: '14', unit: 'breaths/min', source: 'Measured', charted: '21:13 local (2 min ago)', modelUse: 'Current score factor', series: [15, 14, 14, 14], provenance: ['M', 'M', 'M', 'M'] }
    ]
  }
];

function initWorkstationPrototype() {
  let selectedPatientId = 'PT-1002';
  let selectedParamName = 'Respiratory rate';
  let currentScreen = 'overview'; // 'overview' | 'detail' | 'parameter' | 'guidance'
  let activeFilter = { type: null, val: null };
  let searchQuery = '';

  const wsFrame = document.getElementById('workstationFrame');
  const screenTabs = document.querySelectorAll('.screen-tab-btn');
  const tabDetailLabel = document.getElementById('tabDetailLabel');
  const tabParamLabel = document.getElementById('tabParamLabel');

  const elOverview = document.getElementById('wsScreenOverview');
  const elDetail = document.getElementById('wsScreenDetail');
  const elParameter = document.getElementById('wsScreenParameter');
  const elGuidance = document.getElementById('wsScreenGuidance');

  // Theme & CVD Controls
  const themeBtn = document.getElementById('wsThemeToggle');
  const cvdSelect = document.getElementById('cvdSelect');

  themeBtn?.addEventListener('click', () => {
    wsFrame.classList.toggle('dark-mode');
    const isDark = wsFrame.classList.contains('dark-mode');
    themeBtn.innerHTML = isDark
      ? '<span>☀ Day-Shift Light Mode</span>'
      : '<span>☾ Night-Shift Dark Mode</span>';
  });

  cvdSelect?.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-cvd-mode', e.target.value);
  });

  // Screen Navigation
  function switchScreen(screenName) {
    currentScreen = screenName;
    screenTabs.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.screen === screenName);
    });

    elOverview.style.display = screenName === 'overview' ? 'block' : 'none';
    elDetail.style.display = screenName === 'detail' ? 'block' : 'none';
    elParameter.style.display = screenName === 'parameter' ? 'block' : 'none';
    elGuidance.style.display = screenName === 'guidance' ? 'block' : 'none';

    if (screenName === 'overview') renderOverview();
    if (screenName === 'detail') renderPatientDetail();
    if (screenName === 'parameter') renderParameterDetail();
  }

  screenTabs.forEach((btn) => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
  });

  document.getElementById('wsGuidanceQuickBtn')?.addEventListener('click', () => {
    switchScreen('guidance');
  });
  document.getElementById('backFromGuidanceBtn')?.addEventListener('click', () => {
    switchScreen('overview');
  });

  // Search & Filter Chip Handlers
  const searchInput = document.getElementById('wsPatientSearch');
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toUpperCase();
    renderOverview();
  });

  document.querySelectorAll('.ws-filter-rows .ws-chip[data-filter-type]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const fType = chip.dataset.filterType;
      const fVal = chip.dataset.filterVal;
      if (activeFilter.type === fType && activeFilter.val === fVal) {
        activeFilter = { type: null, val: null };
      } else {
        activeFilter = { type: fType, val: fVal };
      }
      updateFilterChipStyles();
      renderOverview();
    });
  });

  document.getElementById('wsResetFiltersBtn')?.addEventListener('click', () => {
    activeFilter = { type: null, val: null };
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    updateFilterChipStyles();
    renderOverview();
  });

  function updateFilterChipStyles() {
    document.querySelectorAll('.ws-filter-rows .ws-chip[data-filter-type]').forEach((chip) => {
      const isMatch =
        chip.dataset.filterType === activeFilter.type &&
        chip.dataset.filterVal === activeFilter.val;
      chip.classList.toggle('active-filter', isMatch);
    });
  }

  function getRiskChipHTML(pt) {
    if (pt.riskLevel === 'CRITICAL') {
      return `<span class="ws-chip ws-chip--crit">! CRITICAL · ${pt.riskScore}%</span>`;
    }
    if (pt.riskLevel === 'HIGH') {
      return `<span class="ws-chip ws-chip--high">▲ HIGH · ${pt.riskScore}%</span>`;
    }
    if (pt.riskLevel === 'MEDIUM') {
      return `<span class="ws-chip ws-chip--med">◆ MEDIUM · ${pt.riskScore}%</span>`;
    }
    if (pt.riskLevel === 'LOW') {
      return `<span class="ws-chip ws-chip--low">Θ LOW · ${pt.riskScore}%</span>`;
    }
    return `<span class="ws-chip ws-chip--na">? RISK LEVEL UNAVAILABLE · score unavailable</span>`;
  }

  function getDataBadgeHTML(pt) {
    if (pt.dataStatus === 'DATA-LIMITED') {
      return `<span class="ws-chip ws-chip--datalim">⚠ DATA-LIMITED</span>`;
    }
    if (pt.dataStatus === 'DATA SUFFICIENCY UNKNOWN') {
      return `<span class="ws-chip ws-chip--dataunk">⚠ DATA SUFFICIENCY UNKNOWN</span>`;
    }
    return `<span style="font-family:var(--font-mono); font-size:0.7rem; color:#64748B;">✓ Sufficient</span>`;
  }

  function renderOverview() {
    const pendingContainer = document.getElementById('wsPendingContainer');
    const reviewedContainer = document.getElementById('wsReviewedContainer');

    // Update counts
    const totalPending = PROTOTYPE_PATIENTS.filter((p) => p.reviewState === 'PENDING').length;
    const totalReviewed = PROTOTYPE_PATIENTS.filter((p) => p.reviewState === 'REVIEWED').length;
    document.getElementById('countPending').textContent = totalPending;
    document.getElementById('countReviewed').textContent = totalReviewed;
    document.getElementById('pendingListBadge').textContent = totalPending;
    document.getElementById('reviewedListBadge').textContent = totalReviewed;

    const filtered = PROTOTYPE_PATIENTS.filter((pt) => {
      if (searchQuery && !pt.id.includes(searchQuery)) return false;
      if (activeFilter.type === 'review' && pt.reviewState !== activeFilter.val) return false;
      if (activeFilter.type === 'data' && pt.dataStatus !== activeFilter.val) return false;
      if (activeFilter.type === 'risk' && pt.riskLevel !== activeFilter.val) return false;
      return true;
    });

    const pendingPts = filtered.filter((p) => p.reviewState === 'PENDING');
    const reviewedPts = filtered.filter((p) => p.reviewState === 'REVIEWED');

    function buildRowHTML(pt, index) {
      const isSelected = pt.id === selectedPatientId;
      const revBadge =
        pt.reviewState === 'PENDING'
          ? `<span class="ws-chip ws-chip--pending">⚑ PENDING REVIEW</span>`
          : `<span class="ws-chip ws-chip--reviewed">✓ REVIEWED</span>`;

      return `
        <div class="ws-patient-row ${isSelected ? 'selected-row' : ''}" data-pt-id="${pt.id}">
          <div class="ws-pt-id">
            <span class="ws-pt-rank">${index + 1}</span>
            <span>${pt.id}</span>
          </div>
          <div>${revBadge}</div>
          <div>${getRiskChipHTML(pt)}</div>
          <div>${getDataBadgeHTML(pt)}</div>
          <div class="ws-pt-driver">Primary driver: <strong>${pt.primaryDriver}</strong></div>
        </div>
      `;
    }

    pendingContainer.innerHTML =
      pendingPts.map((pt, idx) => buildRowHTML(pt, idx)).join('') ||
      `<div style="padding:0.75rem; font-size:0.82rem; color:#64748B;">No pending patients match current filter.</div>`;

    reviewedContainer.innerHTML =
      reviewedPts.map((pt, idx) => buildRowHTML(pt, pendingPts.length + idx)).join('') ||
      `<div style="padding:0.75rem; font-size:0.82rem; color:#64748B;">No reviewed patients match current filter.</div>`;

    // Bind row selection
    document.querySelectorAll('.ws-patient-row').forEach((row) => {
      row.addEventListener('click', () => {
        selectedPatientId = row.dataset.ptId;
        tabDetailLabel.textContent = `Patient Detail (${selectedPatientId})`;
        renderOverview();
      });
      row.addEventListener('dblclick', () => {
        selectedPatientId = row.dataset.ptId;
        tabDetailLabel.textContent = `Patient Detail (${selectedPatientId})`;
        switchScreen('detail');
      });
    });

    renderSummaryDrawer();
  }

  function renderSummaryDrawer() {
    const drawer = document.getElementById('wsSummaryDrawer');
    const pt = PROTOTYPE_PATIENTS.find((p) => p.id === selectedPatientId) || PROTOTYPE_PATIENTS[0];

    drawer.innerHTML = `
      <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--crimson-core); font-weight:700; text-transform:uppercase; margin-bottom:0.35rem;">
        INITIAL SCREENING SUMMARY PANEL
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem;">
        <h4 style="font-size:1.3rem; font-weight:800;">Patient ${pt.id}</h4>
        <span style="font-family:var(--font-mono); font-size:0.7rem; color:#64748B;">${pt.readingTime}</span>
      </div>
      <div style="margin-bottom:0.85rem; display:flex; flex-wrap:wrap; gap:0.4rem;">
        ${getRiskChipHTML(pt)}
        ${getDataBadgeHTML(pt)}
      </div>
      <p style="font-size:0.82rem; line-height:1.5; margin-bottom:1rem; opacity:0.9;">
        ${pt.explanation}
      </p>
      <div style="border-top:1px solid #CBD5E1; padding-top:0.85rem; margin-bottom:1rem; font-size:0.78rem;">
        <div style="margin-bottom:0.3rem;"><strong>Primary Driver:</strong> ${pt.primaryDriver}</div>
        <div style="margin-bottom:0.3rem;"><strong>Data Sufficiency:</strong> ${pt.dataSufficiency}</div>
        <div><strong>Imputed / Doc Share:</strong> ${pt.imputedShare} / ${pt.docShare}</div>
      </div>
      <button type="button" class="btn-crimson" id="openDetailFromDrawerBtn" style="width:100%; justify-content:center; padding:0.7rem 1rem; font-size:0.82rem;">
        <span>Open Patient Detail (${pt.id})</span>
        <span>→</span>
      </button>
      <div style="font-size:0.7rem; color:#64748B; margin-top:0.6rem; text-align:center;">
        Selecting a row previews the summary; opening Patient Detail is a separate deliberate action.
      </div>
    `;

    document.getElementById('openDetailFromDrawerBtn')?.addEventListener('click', () => {
      switchScreen('detail');
    });
  }

  function renderPatientDetail() {
    const pt = PROTOTYPE_PATIENTS.find((p) => p.id === selectedPatientId) || PROTOTYPE_PATIENTS[4];
    tabDetailLabel.textContent = `Patient Detail (${pt.id})`;

    // Build SVG Trajectory Points for 60m Risk History
    const svgW = 360;
    const svgH = 130;
    const coords = pt.history.map((val, i) => {
      const x = 35 + (i / (pt.history.length - 1)) * (svgW - 55);
      const y = svgH - 22 - (val / 100) * (svgH - 40);
      return { x, y, val };
    });
    const polylinePts = coords.map((c) => `${c.x},${c.y}`).join(' ');

    const driversHTML =
      pt.drivers.length > 0
        ? pt.drivers
            .map(
              (d, i) => `
          <div class="driver-bar-item">
            <div class="driver-bar-top">
              <span>${i + 1}. ${d.name}</span>
              <span style="font-family:var(--font-mono); color:var(--crimson-core);">${d.pct}%</span>
            </div>
            <div class="driver-bar-track">
              <div class="driver-bar-fill" style="width: ${d.pct}%;"></div>
            </div>
          </div>
        `
            )
            .join('')
        : `<div style="font-size:0.82rem; color:#64748B;">No ranked contributing factors available when risk score is unavailable.</div>`;

    const paramRowsHTML = pt.parameters
      .map((param) => {
        const isCarried = param.source.toLowerCase().includes('carried');
        return `
        <tr>
          <td>
            <span class="ws-param-link" data-param-name="${param.name}">${param.name}</span>
          </td>
          <td><strong>${param.val}</strong> <span style="color:#64748B; font-size:0.75rem;">${param.unit}</span></td>
          <td>
            <span class="provenance-badge ${isCarried ? 'provenance-badge--carried' : ''}">
              ${isCarried ? '⤴ Carried forward' : '∿ Measured'}
            </span>
          </td>
          <td style="font-family:var(--font-mono); font-size:0.75rem;">${param.charted}</td>
          <td>
            <span style="font-size:0.75rem; font-weight:600; color:${
              param.modelUse.includes('Current') ? '#0F172A' : '#64748B'
            };">
              ${param.modelUse.includes('Current') ? '● Current score factor' : '⚠ Model use unknown'}
            </span>
          </td>
        </tr>
      `;
      })
      .join('');

    const isCrit = pt.riskLevel === 'CRITICAL';
    const scoreDisplay = pt.riskScore !== null ? `${pt.riskScore}%` : 'N/A';

    elDetail.innerHTML = `
      <div class="ws-detail-header">
        <div>
          <button type="button" class="ws-param-link" id="detailBackToOverviewBtn" style="margin-bottom:0.35rem; display:inline-block;">
            ← Back to overview
          </button>
          <h3 style="font-size:1.55rem; font-weight:800;">Patient ${pt.id}</h3>
          <span style="font-size:0.76rem; color:#64748B;">reading as of ${pt.readingTime}</span>
        </div>
        <div style="display:flex; gap:0.65rem; align-items:center;">
          <span class="ws-readonly-pill">SESSION-ONLY REVIEW STATE</span>
        </div>
      </div>

      <div class="ws-detail-top-grid">
        <div class="ws-score-banner ${isCrit ? 'crit-banner' : ''}">
          <div>
            <div style="font-family:var(--font-mono); font-size:0.65rem; text-transform:uppercase; opacity:0.8;">RESPIRATORY-RISK SCORE</div>
            <div class="ws-score-big">${scoreDisplay}</div>
            <div style="font-weight:700; font-size:0.84rem; margin-top:0.2rem;">▲ ${pt.riskLevel}</div>
          </div>
          <div>
            <div style="font-weight:700; font-size:0.82rem; margin-bottom:0.25rem;">Explanation (Source-Constrained Output)</div>
            <p style="font-size:0.84rem; line-height:1.45;">${pt.explanation}</p>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.65rem;">
          <div class="ws-card" style="padding:0.75rem 1rem; border-left:4px solid #F59E0B;">
            <span style="font-size:0.78rem; font-weight:600;">⚠ ${pt.integrityWarning}</span>
          </div>
          <div class="ws-card" style="padding:0.85rem 1rem; display:flex; align-items:center; justify-content:space-between;">
            <div>
              <div style="font-weight:700; font-size:0.84rem;">
                ${pt.reviewState === 'PENDING' ? '⚑ Pending review' : '✓ Reviewed (Current Session)'}
              </div>
              <div style="font-size:0.72rem; color:#64748B;">Does not write to hospital EMR or silence alarms</div>
            </div>
            <button type="button" id="toggleReviewStateBtn" style="background:${
              pt.reviewState === 'PENDING' ? '#4F46E5' : '#15803D'
            }; color:#FFF; font-weight:700; font-size:0.76rem; padding:0.5rem 0.9rem; border-radius:5px;">
              ${pt.reviewState === 'PENDING' ? 'Mark as reviewed' : 'Return to pending'}
            </button>
          </div>
        </div>
      </div>

      <div class="ws-detail-mid-grid">
        <!-- 60m Risk Trajectory SVG Chart -->
        <div class="ws-card">
          <div class="ws-card__title">RISK HISTORY</div>
          <div class="ws-card__heading">Respiratory-risk score · last 60 minutes</div>
          <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%; height:auto; overflow:visible;">
            <line x1="30" y1="25" x2="${svgW - 10}" y2="25" stroke="#FCA5A5" stroke-dasharray="3,3" />
            <text x="${svgW - 38}" y="22" fill="#DC2626" font-size="8" font-family="monospace">CRIT</text>
            <line x1="30" y1="52" x2="${svgW - 10}" y2="52" stroke="#FCD34D" stroke-dasharray="3,3" />
            <text x="${svgW - 38}" y="49" fill="#D97706" font-size="8" font-family="monospace">HIGH</text>
            <line x1="30" y1="80" x2="${svgW - 10}" y2="80" stroke="#CBD5E1" stroke-dasharray="3,3" />
            <polyline fill="none" stroke="#1D4ED8" stroke-width="2.5" points="${polylinePts}" />
            ${coords
              .map(
                (c, idx) => `
              <circle cx="${c.x}" cy="${c.y}" r="${idx === coords.length - 1 ? 4.5 : 3}" fill="${
                  idx === coords.length - 1 ? '#C8102E' : '#1D4ED8'
                }" />
            `
              )
              .join('')}
            <text x="32" y="${svgH - 4}" fill="#64748B" font-size="9" font-family="monospace">20:55</text>
            <text x="110" y="${svgH - 4}" fill="#64748B" font-size="9" font-family="monospace">20:59</text>
            <text x="185" y="${svgH - 4}" fill="#64748B" font-size="9" font-family="monospace">21:04</text>
            <text x="260" y="${svgH - 4}" fill="#64748B" font-size="9" font-family="monospace">21:08</text>
            <text x="320" y="${svgH - 4}" fill="#64748B" font-size="9" font-family="monospace">21:13</text>
          </svg>
        </div>

        <!-- Reading State & Tri-Share Card -->
        <div class="ws-card">
          <div class="ws-card__title">READING STATE &amp; INTEGRITY</div>
          <div class="ws-card__heading">Data Provenance Shares</div>
          <div style="font-size:0.78rem; margin-bottom:0.6rem;">
            <span style="color:#64748B; display:block; font-size:0.68rem;">READINGS HELD AT THIS LEVEL</span>
            <strong>${pt.readingsHeld}</strong>
          </div>
          <div style="font-size:0.78rem; margin-bottom:0.6rem;">
            <span style="color:#64748B; display:block; font-size:0.68rem;">DATA SUFFICIENCY</span>
            <strong style="color:#1D4ED8;">${pt.dataSufficiency}</strong>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; padding-top:0.4rem; border-top:1px solid #E2E8F0;">
            <div>
              <span style="color:#64748B; display:block; font-size:0.65rem;">IMPUTED SHARE</span>
              <strong style="font-family:var(--font-mono); font-size:0.95rem; color:#1D4ED8;">${pt.imputedShare}</strong>
            </div>
            <div>
              <span style="color:#64748B; display:block; font-size:0.65rem;">DOCUMENTATION SHARE</span>
              <strong style="font-family:var(--font-mono); font-size:0.95rem; color:#1D4ED8;">${pt.docShare}</strong>
            </div>
          </div>
        </div>

        <!-- Ranked Contributing Factors -->
        <div class="ws-card">
          <div class="ws-card__title">MODEL-CONTRIBUTING VARIABLES</div>
          <div class="ws-card__heading">Ranked factors contributing to current score</div>
          ${driversHTML}
        </div>
      </div>

      <!-- Respiratory Parameters Table -->
      <div class="ws-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem; flex-wrap:wrap;">
          <div>
            <div class="ws-card__heading" style="margin-bottom:0.15rem;">Respiratory parameters (Click any parameter to inspect Screen 3 Provenance)</div>
            <div style="font-size:0.74rem; color:#64748B;">
              Point-in-time snapshot of the latest reading; values are not merged across readings.
            </div>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="ws-param-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Latest value</th>
                <th>Source</th>
                <th>Charted</th>
                <th>Model use</th>
              </tr>
            </thead>
            <tbody>
              ${paramRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('detailBackToOverviewBtn')?.addEventListener('click', () => {
      switchScreen('overview');
    });

    document.getElementById('toggleReviewStateBtn')?.addEventListener('click', () => {
      pt.reviewState = pt.reviewState === 'PENDING' ? 'REVIEWED' : 'PENDING';
      renderPatientDetail();
    });

    elDetail.querySelectorAll('.ws-param-link[data-param-name]').forEach((link) => {
      link.addEventListener('click', () => {
        selectedParamName = link.dataset.paramName;
        tabParamLabel.textContent = `Parameter Detail (${selectedParamName})`;
        switchScreen('parameter');
      });
    });
  }

  function renderParameterDetail() {
    const pt = PROTOTYPE_PATIENTS.find((p) => p.id === selectedPatientId) || PROTOTYPE_PATIENTS[4];
    const paramObj =
      pt.parameters.find((pr) => pr.name === selectedParamName) || pt.parameters[0];
    selectedParamName = paramObj.name;
    tabParamLabel.textContent = `Parameter Detail (${selectedParamName})`;

    const pillsHTML = pt.parameters
      .map(
        (pr) => `
      <button type="button" class="param-pill-btn ${
        pr.name === selectedParamName ? 'active' : ''
      }" data-switch-param="${pr.name}">
        ${pr.name === selectedParamName ? '● ' : ''}${pr.name}
      </button>
    `
      )
      .join('');

    // Build SVG Provenance Chart (Replica of Figure 7)
    const vals = paramObj.series || [22, 19, 20, 21];
    const provs = paramObj.provenance || ['CF', 'M', 'M', 'M'];
    const minVal = Math.min(...vals) * 0.7;
    const maxVal = Math.max(...vals) * 1.25 || 40;

    const svgW = 680;
    const svgH = 210;
    const pts = vals.map((v, i) => {
      const x = 70 + (i / (vals.length - 1)) * (svgW - 130);
      const y = svgH - 40 - ((v - minVal) / (maxVal - minVal || 1)) * (svgH - 80);
      return { x, y, v, prov: provs[i] || 'M' };
    });

    const measuredCount = provs.filter((p) => p === 'M').length;
    const carriedCount = provs.filter((p) => p === 'CF').length;

    elParameter.innerHTML = `
      <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
        <div>
          <button type="button" class="ws-param-link" id="paramBackToDetailBtn" style="margin-bottom:0.35rem; display:inline-block;">
            ← Back to Patient ${pt.id} Detail
          </button>
          <h3 style="font-size:1.45rem; font-weight:800;">${paramObj.name}</h3>
          <div style="font-size:0.76rem; color:#64748B;">
            Patient ${pt.id} · chart time 2026-08-23 21:13 local
          </div>
        </div>
      </div>

      <div class="param-selector-pills">
        ${pillsHTML}
      </div>

      <div class="ws-card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:1rem;">
          <div class="ws-card__heading" style="margin-bottom:0;">Charting history and provenance</div>
          <div style="display:flex; gap:1rem; font-family:var(--font-mono); font-size:0.7rem;">
            <span><strong style="color:#1D4ED8;">●</strong> MEASURED</span>
            <span><strong style="color:#D97706;">○</strong> CARRIED_FORWARD</span>
            <span><strong style="color:#DB2777;">●</strong> POPULATION_REFERENCE</span>
          </div>
        </div>

        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%; height:auto;">
          <line x1="55" y1="30" x2="${svgW - 30}" y2="30" stroke="#E2E8F0" />
          <line x1="55" y1="85" x2="${svgW - 30}" y2="85" stroke="#E2E8F0" />
          <line x1="55" y1="140" x2="${svgW - 30}" y2="140" stroke="#E2E8F0" />
          <line x1="55" y1="170" x2="${svgW - 30}" y2="170" stroke="#94A3B8" />

          <polyline fill="none" stroke="#2563EB" stroke-width="2.2" points="${pts
            .map((p) => `${p.x},${p.y}`)
            .join(' ')}" />

          ${pts
            .map((p) => {
              const isCF = p.prov === 'CF';
              return `
                <circle cx="${p.x}" cy="${p.y}" r="6" fill="${
                isCF ? '#FFFFFF' : '#2563EB'
              }" stroke="${isCF ? '#D97706' : '#2563EB'}" stroke-width="2.5" />
                <text x="${p.x - 14}" y="${p.y - 12}" fill="#334155" font-size="11" font-weight="bold" font-family="monospace">${
                p.v
              } ${paramObj.unit}</text>
              `;
            })
            .join('')}

          <text x="60" y="192" fill="#64748B" font-size="11" font-family="monospace">20:55</text>
          <text x="235" y="192" fill="#64748B" font-size="11" font-family="monospace">20:59</text>
          <text x="410" y="192" fill="#64748B" font-size="11" font-family="monospace">21:08</text>
          <text x="580" y="192" fill="#64748B" font-size="11" font-family="monospace">21:13</text>
        </svg>

        <div style="margin-top:0.85rem; padding-top:0.75rem; border-top:1px solid #E2E8F0; font-family:var(--font-mono); font-size:0.73rem; color:#475569;">
          <strong>PROVENANCE:</strong> ${measuredCount} of the last ${pts.length} readings measured · ${carriedCount} carried forward · 0 from population references.
          <div style="font-family:var(--font-sans); font-size:0.74rem; color:#64748B; margin-top:0.2rem;">
            Shows when each value was measured, carried forward, or taken from a population reference — not an independent clinical trend classification. Values hold flat while carried forward.
          </div>
        </div>
      </div>
    `;

    document.getElementById('paramBackToDetailBtn')?.addEventListener('click', () => {
      switchScreen('detail');
    });

    elParameter.querySelectorAll('.param-pill-btn[data-switch-param]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedParamName = btn.dataset.switchParam;
        renderParameterDetail();
      });
    });
  }

  // Initial render
  renderOverview();
}

/* ==========================================================================
   4. UPDATED N=36 TWO-SITE ICU CLINICIAN SURVEY EXPLORER
   (Translating the updated Vietnamese .md executive report into English)
   ========================================================================== */
const SURVEY_COHORT_DATA = {
  combined: {
    badge: 'COMBINED SAMPLE // N = 36 VALID RESPONSES (100% ADULT VENTILATED ICU EXPERIENCE)',
    title: 'Executive Synthesis Across Both ICU Survey Cohorts (N = 36)',
    subtitle:
      'Combines matched demographic, information-source, and conditional-usefulness variables from Cohort A (N=22, People’s Hospital 115) and Cohort B (N=14, Nam Sài Gòn Hospital). Non-equivalent question structures are rigorously kept separate.',
    cards: [
      {
        kicker: 'SAMPLE PROFILE & EXPERIENCE (TABLE 2.1)',
        title: 'Role & ICU Tenure Distribution (N = 36)',
        bars: [
          { label: 'ICU Nurses (13 in N=22; 9 in N=14)', val: '22 / 36 (61.1%)', pct: 61.1 },
          { label: 'ICU Physicians (9 in N=22; 5 in N=14)', val: '14 / 36 (38.9%)', pct: 38.9 },
          { label: 'Early-Career: ≤ 3 Years ICU Experience', val: '23 / 36 (63.9%)', pct: 63.9 },
          { label: 'Mid-Career: 4–7 Years ICU Experience', val: '9 / 36 (25.0%)', pct: 25.0 },
          { label: 'Senior: ≥ 8 Years ICU Experience', val: '4 / 36 (11.1%)', pct: 11.1 }
        ]
      },
      {
        kicker: 'CONDITIONAL CONCEPT ACCEPTANCE (SECTION 6)',
        title: 'Perceived Usefulness (If Validated Safe & Workflow-Fit)',
        bars: [
          { label: 'Rated "Useful" or "Very Useful" (Combined)', val: '28 / 36 (77.8%)', pct: 77.8 },
          { label: 'Rated "Moderately Useful" (Conditional)', val: '8 / 36 (22.2%)', pct: 22.2 },
          { label: 'Rated "Not Useful" across both cohorts', val: '0 / 36 (0.0%)', pct: 0 },
          { label: 'Avg. Mapped Information Sources Selected', val: '4.25 / 6 Groups', pct: 70.8 }
        ]
      }
    ],
    footerTakeaway:
      'Key Takeaway (Section 9): With clinicians consulting an average of 4.25 out of 6 clinical source groups per respiratory review, a time-aligned multi-source interface has strong exploratory justification—provided it never becomes an uncontrolled new layer of alarms.'
  },
  cohort22: {
    badge: 'COHORT A // N = 22 (PEOPLE’S HOSPITAL 115 — INTERVIEWS, OPEN-ENDED & MATRIX)',
    title: 'Trust Conditions, Prompt Content & Alarm Burden (N = 22)',
    subtitle:
      'Explores spontaneous open-ended workflow pain points, required conditions for trusting a clinical decision-support tool, and leading clinician concerns.',
    cards: [
      {
        kicker: 'CONDITIONS FOR CONSIDERING USE (TABLE 7.1)',
        title: 'What Clinicians Require Before Trusting PulseMind',
        bars: [
          { label: 'Physician & Nurse Participation in Design/Eval', val: '22 / 22 (100.0%)', pct: 100 },
          { label: 'Clear Explanation of Why System Flagged Patient', val: '20 / 22 (90.9%)', pct: 90.9 },
          { label: 'Highlights a Worsening Clinical Trend', val: '20 / 22 (90.9%)', pct: 90.9 },
          { label: 'Human Verification & Final Decision Control', val: '20 / 22 (90.9%)', pct: 90.9 },
          { label: 'Validated on Data Suitable for Local Hospital', val: '13 / 22 (59.1%)', pct: 59.1 },
          { label: 'Easily Understood Risk Level & Latest Data Time', val: '13/22 & 9/22', pct: 59.1 }
        ]
      },
      {
        kicker: 'LEADING CONCERNS & WORKFLOW PAIN POINTS (SEC 4 & 7.2)',
        title: 'Why Selective Prompting & Data Provenance Matter',
        bars: [
          { label: 'Concern: Excessive Prompts / Alarm Fatigue (n=21)', val: '21 / 22 (95.5%)', pct: 95.5 },
          { label: 'Top Monitoring Issue: Ventilator Alarms/Params', val: '20 / 22 (90.9%)', pct: 90.9 },
          { label: 'Open Difficulty: Point-in-Time Ventilator Info', val: '12 / 22 (54.5%)', pct: 54.5 },
          { label: 'Concern: Difficult to Understand or Use', val: '12 / 22 (54.5%)', pct: 54.5 },
          { label: 'Concern: Incorrect, Missing or Unsynced Data', val: '7 / 22 (31.8%)', pct: 31.8 }
        ]
      }
    ],
    footerTakeaway:
      'Methodological Note: In Cohort A (N=22), 20/22 open-ended responses cited ventilator alarms or abnormal parameters as having the greatest effect on monitoring work, and 21/22 flagged excessive prompting—directly shaping PulseMind’s selective High/Critical prompt gate.'
  },
  cohort14: {
    badge: 'COHORT B // N = 14 (NAM SÀI GÒN HOSPITAL — STRUCTURED & PROTOTYPE EVALUATION)',
    title: '3-Screen Prototype Evaluation & Safety Mechanisms to Preserve (N = 14)',
    subtitle:
      'Evaluated the three-screen PulseMind prototype directly and identified which existing ICU practices must never be replaced by AI.',
    cards: [
      {
        kicker: 'EXISTING PRACTICES TO PRESERVE (SECTION 5)',
        title: 'Non-Negotiable Bedside Safety Mechanisms (N = 14)',
        bars: [
          { label: 'Preserve Existing Ventilator/Monitor Safety Alarms', val: '14 / 14 (100.0%)', pct: 100 },
          { label: 'Preserve Routine Bedside Nurse Monitoring', val: '14 / 14 (100.0%)', pct: 100 },
          { label: 'Preserve Direct Physical Patient Examination', val: '13 / 14 (92.9%)', pct: 92.9 },
          { label: 'Preserve Physician Assessment & Decision-Making', val: '11 / 14 (78.6%)', pct: 78.6 },
          { label: 'Preserve Direct Shift Handover & Flowsheets', val: '9 / 14 (64.3%)', pct: 64.3 }
        ]
      },
      {
        kicker: 'PROTOTYPE EVALUATION & REFINEMENT (SECTION 8)',
        title: '3-Screen Ratings (Scale 1–5) & Perceived Value',
        bars: [
          { label: 'Screen 2: Patient Detail (Mean 3.86 / Median 4)', val: '9 / 14 (64.3% ≥ 4)', pct: 77.2 },
          { label: 'Screen 1: Patient Overview (Mean 3.79 / Median 4)', val: '9 / 14 (64.3% ≥ 4)', pct: 75.8 },
          { label: 'Screen 3: Parameter Detail (Mean 3.69 / n=13)', val: '8 / 13 (61.5% ≥ 4)', pct: 73.8 },
          { label: 'Valued: Risk Level & Trend / Short Explanation', val: '9 / 14 (64.3%)', pct: 64.3 },
          { label: 'UI Priority: Contrast, Color & Font Size Tuning', val: '10 / 14 (71.4%)', pct: 71.4 }
        ]
      }
    ],
    footerTakeaway:
      'Design Action Taken: Because 10/14 respondents in Cohort B highlighted color contrast and typography size for refinement, PulseMind incorporated WCAG 2.2 AA contrast targets and multi-palette Color-Vision Deficiency (CVD) encodings (testable live in Section 02 above).'
  },
  deepdive: {
    badge: 'METHODOLOGICAL DEEP-DIVE // SECTIONS 3, 4 & 8 OF UPDATED SURVEY REPORT',
    title: 'Clinical Attention Triggers, Shift Handover & Component Critique',
    subtitle:
      'Contrasts spontaneous open-ended responses (N=22) against prompted multi-select choices (N=14) without conflating non-equivalent denominators, alongside detailed UI component feedback.',
    cards: [
      {
        kicker: 'CLINICAL ATTENTION TRIGGERS (SECTION 4.2)',
        title: 'Unprompted (N=22) vs. Prompted (N=14) Clinical Signals',
        bars: [
          { label: 'Direct Clinical Exam/Observation (Unprompted N=22)', val: '21 / 22 (95.5%)', pct: 95.5 },
          { label: 'Ventilator Alarms/Params (Prompted N=14)', val: '13 / 14 (92.9%)', pct: 92.9 },
          { label: 'Vital Signs / Bedside Monitor (Prompted N=14)', val: '12 / 14 (85.7%)', pct: 85.7 },
          { label: 'Direct Clinical Exam/Observation (Prompted N=14)', val: '11 / 14 (78.6%)', pct: 78.6 },
          { label: 'Ventilator Alarms/Params (Unprompted N=22)', val: '14 / 22 (63.6%)', pct: 63.6 },
          { label: 'Arterial Blood Gas / Lab Results (Prompted N=14)', val: '8 / 14 (57.1%)', pct: 57.1 }
        ]
      },
      {
        kicker: 'PROTOTYPE COMPONENT BREAKDOWN (SEC 8.2, N=14)',
        title: 'Perceived Value vs. Information Density & Pain Points',
        bars: [
          { label: 'Valued: Risk Level & Trend Trajectory', val: '9 / 14 (64.3%)', pct: 64.3 },
          { label: 'Valued: Concise Risk Explanation', val: '9 / 14 (64.3%)', pct: 64.3 },
          { label: 'Valued: Patient List / Status / Risk Overview', val: '8 / 14 (57.1%)', pct: 57.1 },
          { label: 'Valued: Individual Parameter Charts & Provenance', val: '7 / 14 (50.0%)', pct: 50.0 },
          { label: 'N=14 Pain Point: Point-in-Time Snapshot Limit', val: '8 / 14 (57.1%)', pct: 57.1 },
          { label: 'Information Density Rated "Just Right" (7/14)', val: '7 / 14 (50.0%)', pct: 50.0 }
        ]
      }
    ],
    footerTakeaway:
      'Design Hypothesis Note (Section 8.3): Individual clinician suggestions in Cohort B—such as distinguishing measured vs. population-reference data (implemented in Screen 3) and displaying sedation/neuromuscular blockade, vasopressor status, and latest ABG—are retained as testable design hypotheses for Phase 2.'
  }
};

function initSurveyExplorer() {
  const stage = document.getElementById('surveyStageContent');
  const cohortBtns = document.querySelectorAll('.cohort-btn[data-cohort]');
  if (!stage) return;

  function renderCohort(key) {
    const data = SURVEY_COHORT_DATA[key] || SURVEY_COHORT_DATA.combined;

    const cardsHTML = data.cards
      .map(
        (card) => `
      <div class="survey-card">
        <div class="survey-card__kicker">${card.kicker}</div>
        <h4 class="survey-card__title">${card.title}</h4>
        <div>
          ${card.bars
            .map(
              (b) => `
            <div class="stat-bar-row">
              <div class="stat-bar-header">
                <span>${b.label}</span>
                <span>${b.val}</span>
              </div>
              <div class="stat-bar-bg">
                <div class="stat-bar-fill" style="width: ${b.pct}%;"></div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
      )
      .join('');

    stage.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <span class="editorial-kicker">${data.badge}</span>
        <h3 style="font-family: var(--font-serif); font-size: 2.1rem; margin-bottom: 0.35rem;">${data.title}</h3>
        <p style="font-size: 0.9rem; color: var(--slate-600); max-width: 820px;">${data.subtitle}</p>
      </div>
      <div class="survey-viz-grid">
        ${cardsHTML}
      </div>
      <div style="margin-top: 1.5rem; padding: 1rem 1.25rem; background-color: var(--white-paper); border: 1px solid var(--grid-line-strong); font-size: 0.84rem; color: var(--slate-800);">
        <strong style="color: var(--crimson-core); font-family: var(--font-mono);">EMPIRICAL SYNTHESIS // </strong>
        ${data.footerTakeaway}
      </div>
    `;
  }

  cohortBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      cohortBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCohort(btn.dataset.cohort);
    });
  });

  renderCohort('combined');
}

/* ==========================================================================
   5. YEAR 3 FINANCIAL SENSITIVITY SIMULATOR (TABLE 22 / APPENDIX B.3.4)
   ========================================================================== */
const FIN_SCENARIOS = {
  base: {
    activity: '2 Paid Evals · 1 Active Licence',
    arr: 'VND 0.80b ARR',
    opResult: '−VND 1.85b',
    isPositive: false
  },
  breakeven: {
    activity: '2 Paid Evals · 5 Active Licences',
    arr: 'VND 4.00b ARR',
    opResult: '+VND 0.55b (Profitable)',
    isPositive: true
  },
  three: {
    activity: '2 Paid Evals · 3 Active Licences',
    arr: 'VND 2.40b ARR',
    opResult: '−VND 0.65b',
    isPositive: false
  },
  upside: {
    activity: '2 Evals · 1 Licence @ VND 1.00b',
    arr: 'VND 1.00b ARR',
    opResult: '−VND 1.65b',
    isPositive: false
  },
  noconv: {
    activity: '2 Paid Evals · 0 Licences',
    arr: 'VND 0.00b ARR',
    opResult: '−VND 2.45b',
    isPositive: false
  },
  highcost: {
    activity: 'Base Case · Direct Costs +50%',
    arr: 'VND 0.80b ARR',
    opResult: '−VND 2.175b',
    isPositive: false
  }
};

function initFinancialSimulator() {
  const select = document.getElementById('finScenarioSelect');
  const output = document.getElementById('finScenarioOutput');
  if (!select || !output) return;

  function renderScenario(key) {
    const sc = FIN_SCENARIOS[key] || FIN_SCENARIOS.base;
    output.innerHTML = `
      <div>
        <div style="color: var(--slate-500); font-size: 0.65rem;">YEAR 3 ACTIVITY</div>
        <div style="font-weight: 700; color: var(--slate-900); margin-top: 0.15rem;">${sc.activity}</div>
      </div>
      <div>
        <div style="color: var(--slate-500); font-size: 0.65rem;">RECURRING REVENUE</div>
        <div style="font-weight: 700; color: var(--slate-900); margin-top: 0.15rem;">${sc.arr}</div>
      </div>
      <div>
        <div style="color: var(--slate-500); font-size: 0.65rem;">Y3 OPERATING RESULT</div>
        <div style="font-weight: 700; color: ${
          sc.isPositive ? '#0F766E' : 'var(--crimson-core)'
        }; margin-top: 0.15rem;">${sc.opResult}</div>
      </div>
    `;
  }

  select.addEventListener('change', (e) => renderScenario(e.target.value));
  renderScenario('base');
}

/* ==========================================================================
   6. INTERACTIVE ARCHITECTURAL BLUEPRINTS (FIGURES 1, 2 & 3)
   ========================================================================== */
const BLUEPRINT_DIAGRAMS = {
  fig1: {
    title: 'Figure 1 — Level 0 Context Diagram & Intended PulseMind System Boundary',
    svg: `
      <svg viewBox="0 0 920 260" style="width:100%; height:auto; min-width:680px; font-family:'JetBrains Mono', monospace;">
        <defs>
          <marker id="arrowCrimson" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#E11D48" />
          </marker>
          <marker id="arrowSlate" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#94A3B8" />
          </marker>
        </defs>
        <!-- Data Sources Entity -->
        <rect x="30" y="90" width="190" height="80" rx="4" fill="#1E293B" stroke="#94A3B8" stroke-width="1.5"/>
        <text x="125" y="125" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">CLINICAL DATA</text>
        <text x="125" y="145" fill="#94A3B8" font-size="11" text-anchor="middle">SOURCES (READ-ONLY)</text>

        <!-- Arrow: Clinical Data -> PulseMind -->
        <line x1="220" y1="130" x2="352" y2="130" stroke="#E11D48" stroke-width="2.5" marker-end="url(#arrowCrimson)"/>
        <text x="286" y="118" fill="#FDA4AF" font-size="10" text-anchor="middle">Clinical Data Feed</text>

        <!-- Central PulseMind System Circle -->
        <circle cx="445" cy="130" r="85" fill="#8A081E" stroke="#E11D48" stroke-width="3"/>
        <text x="445" y="122" fill="#FFFFFF" font-size="15" font-weight="700" text-anchor="middle">PULSEMIND</text>
        <text x="445" y="142" fill="#FDA4AF" font-size="12" font-weight="600" text-anchor="middle">SYSTEM BOUNDARY</text>
        <text x="445" y="160" fill="#FFE0E5" font-size="9" text-anchor="middle">Non-Autonomous CDS</text>

        <!-- Clinical User Entity -->
        <rect x="680" y="30" width="210" height="75" rx="4" fill="#1E293B" stroke="#E11D48" stroke-width="2"/>
        <text x="785" y="63" fill="#FFFFFF" font-size="13" font-weight="700" text-anchor="middle">ICU CLINICAL USER</text>
        <text x="785" y="83" fill="#FDA4AF" font-size="10" text-anchor="middle">Nurses &amp; Physicians</text>

        <!-- Arrows: PulseMind <-> Clinical User -->
        <line x1="526" y1="95" x2="672" y2="60" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrowCrimson)"/>
        <text x="600" y="64" fill="#FDA4AF" font-size="9.5" text-anchor="middle">Decision-Support Info</text>
        <line x1="678" y1="84" x2="532" y2="115" stroke="#94A3B8" stroke-width="1.6" stroke-dasharray="4,4" marker-end="url(#arrowSlate)"/>
        <text x="612" y="112" fill="#94A3B8" font-size="9.5" text-anchor="middle">Acknowledge Review Prompt</text>

        <!-- System Administrator Entity -->
        <rect x="680" y="155" width="210" height="75" rx="4" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/>
        <text x="785" y="188" fill="#FFFFFF" font-size="12" font-weight="700" text-anchor="middle">SYSTEM ADMINISTRATOR</text>
        <text x="785" y="206" fill="#94A3B8" font-size="9.5" text-anchor="middle">No Clinical Decision Role</text>

        <!-- Arrows: PulseMind <-> System Admin -->
        <line x1="526" y1="162" x2="672" y2="185" stroke="#94A3B8" stroke-width="1.6" marker-end="url(#arrowSlate)"/>
        <text x="605" y="168" fill="#94A3B8" font-size="9.5" text-anchor="middle">System Status Info</text>
        <line x1="678" y1="205" x2="528" y2="180" stroke="#94A3B8" stroke-width="1.6" stroke-dasharray="4,4" marker-end="url(#arrowSlate)"/>
        <text x="605" y="212" fill="#94A3B8" font-size="9.5" text-anchor="middle">Authorised Tech Config</text>
      </svg>
    `
  },
  fig2: {
    title: 'Figure 2 — Intended Hospital MDIP & Edge Connector Integration Architecture',
    svg: `
      <svg viewBox="0 0 940 270" style="width:100%; height:auto; min-width:720px; font-family:'JetBrains Mono', monospace;">
        <defs>
          <marker id="arrRed2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#E11D48" />
          </marker>
        </defs>
        <!-- Left Box: ICU Device Data Sources -->
        <rect x="15" y="20" width="215" height="230" rx="4" fill="rgba(255,255,255,0.02)" stroke="#64748B" stroke-dasharray="4,4"/>
        <text x="122" y="42" fill="#FDA4AF" font-size="10.5" font-weight="700" text-anchor="middle">ICU DEVICE DATA SOURCES</text>
        <rect x="32" y="55" width="180" height="32" rx="3" fill="#1E293B" stroke="#475569"/>
        <text x="122" y="75" fill="#F8FAFC" font-size="10.5" text-anchor="middle">Ventilators 1–3 (Format A/B/C)</text>
        <rect x="32" y="98" width="180" height="32" rx="3" fill="#1E293B" stroke="#475569"/>
        <text x="122" y="118" fill="#F8FAFC" font-size="10.5" text-anchor="middle">Bedside Monitors 1–2 (D/E)</text>
        <rect x="32" y="142" width="180" height="32" rx="3" fill="#1E293B" stroke="#475569"/>
        <text x="122" y="162" fill="#94A3B8" font-size="9.5" text-anchor="middle">Separate Lab/EMR Interfaces*</text>
        <text x="122" y="205" fill="#64748B" font-size="8.5" text-anchor="middle">*Requires separate hospital approval</text>

        <!-- Middle Box: Existing Hospital Integration Infrastructure -->
        <rect x="265" y="20" width="250" height="230" rx="4" fill="rgba(56,189,248,0.04)" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="390" y="42" fill="#38BDF8" font-size="10.5" font-weight="700" text-anchor="middle">HOSPITAL INTEGRATION INFRA</text>
        <rect x="285" y="65" width="210" height="55" rx="4" fill="#0F172A" stroke="#38BDF8"/>
        <text x="390" y="90" fill="#FFFFFF" font-size="11" font-weight="700" text-anchor="middle">Connectivity Hub</text>
        <text x="390" y="106" fill="#94A3B8" font-size="9.5" text-anchor="middle">(e.g. Capsule Neuron)</text>

        <rect x="285" y="150" width="210" height="65" rx="4" fill="#0F172A" stroke="#38BDF8"/>
        <text x="390" y="178" fill="#FFFFFF" font-size="11" font-weight="700" text-anchor="middle">MDIP Medical Device</text>
        <text x="390" y="194" fill="#38BDF8" font-size="10" text-anchor="middle">Integration Platform</text>

        <line x1="212" y1="80" x2="280" y2="88" stroke="#E11D48" stroke-width="2" marker-end="url(#arrRed2)"/>
        <line x1="212" y1="114" x2="280" y2="98" stroke="#E11D48" stroke-width="2" marker-end="url(#arrRed2)"/>
        <line x1="390" y1="120" x2="390" y2="144" stroke="#E11D48" stroke-width="2" marker-end="url(#arrRed2)"/>

        <!-- Right Box: PulseMind System Boundary (Hospital-Approved Computing Env) -->
        <rect x="555" y="20" width="370" height="230" rx="4" fill="rgba(200,16,46,0.08)" stroke="#E11D48" stroke-width="2"/>
        <text x="740" y="42" fill="#FDA4AF" font-size="10.5" font-weight="700" text-anchor="middle">PULSEMIND BOUNDARY (HOSPITAL COMPUTING ENV)</text>

        <rect x="575" y="65" width="155" height="65" rx="4" fill="#8A081E" stroke="#E11D48" stroke-width="1.5"/>
        <text x="652" y="92" fill="#FFFFFF" font-size="11" font-weight="700" text-anchor="middle">PulseMind Edge</text>
        <text x="652" y="108" fill="#FFE0E5" font-size="10" text-anchor="middle">Connector</text>

        <rect x="755" y="65" width="150" height="65" rx="4" fill="#8A081E" stroke="#E11D48" stroke-width="1.5"/>
        <text x="830" y="92" fill="#FFFFFF" font-size="11" font-weight="700" text-anchor="middle">PulseMind</text>
        <text x="830" y="108" fill="#FFE0E5" font-size="10" text-anchor="middle">Core Software</text>

        <rect x="635" y="162" width="220" height="58" rx="4" fill="#1E293B" stroke="#FDA4AF" stroke-width="1.5"/>
        <text x="745" y="188" fill="#FFFFFF" font-size="11.5" font-weight="700" text-anchor="middle">Hospital ICU Workstation</text>
        <text x="745" y="205" fill="#FDA4AF" font-size="9.5" text-anchor="middle">Read-Only Web Dashboard (3 Screens)</text>

        <line x1="495" y1="182" x2="570" y2="105" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrRed2)"/>
        <line x1="730" y1="97" x2="750" y2="97" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrRed2)"/>
        <line x1="830" y1="130" x2="765" y2="158" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrRed2)"/>
      </svg>
    `
  },
  fig3: {
    title: 'Figure 3 — Level 1 Temporal Analysis, Risk Estimation & Selective Prompt Process',
    svg: `
      <svg viewBox="0 0 940 190" style="width:100%; height:auto; min-width:720px; font-family:'JetBrains Mono', monospace;">
        <defs>
          <marker id="arrRed3" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#E11D48" />
          </marker>
        </defs>
        <circle cx="70" cy="95" r="45" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
        <text x="70" y="91" fill="#FFFFFF" font-size="10" font-weight="700" text-anchor="middle">Patient Data</text>
        <text x="70" y="106" fill="#38BDF8" font-size="9.5" text-anchor="middle">Received</text>

        <line x1="115" y1="95" x2="148" y2="95" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrRed3)"/>

        <rect x="155" y="50" width="150" height="90" rx="4" fill="#1E293B" stroke="#94A3B8" stroke-width="1.5"/>
        <text x="230" y="82" fill="#FDA4AF" font-size="9.5" font-weight="700" text-anchor="middle">STEP 01</text>
        <text x="230" y="100" fill="#FFFFFF" font-size="11" font-weight="700" text-anchor="middle">Organize Data</text>
        <text x="230" y="116" fill="#94A3B8" font-size="9.5" text-anchor="middle">Over Time + Quality</text>

        <line x1="305" y1="95" x2="338" y2="95" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrRed3)"/>

        <rect x="345" y="50" width="150" height="90" rx="4" fill="#1E293B" stroke="#94A3B8" stroke-width="1.5"/>
        <text x="420" y="82" fill="#FDA4AF" font-size="9.5" font-weight="700" text-anchor="middle">STEP 02</text>
        <text x="420" y="100" fill="#FFFFFF" font-size="11" font-weight="700" text-anchor="middle">Analyse Trends</text>
        <text x="420" y="116" fill="#94A3B8" font-size="9.5" text-anchor="middle">Slopes &amp; Context</text>

        <line x1="495" y1="95" x2="528" y2="95" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrRed3)"/>

        <rect x="535" y="50" width="150" height="90" rx="4" fill="#1E293B" stroke="#E11D48" stroke-width="1.5"/>
        <text x="610" y="82" fill="#FDA4AF" font-size="9.5" font-weight="700" text-anchor="middle">STEP 03</text>
        <text x="610" y="100" fill="#FFFFFF" font-size="11" font-weight="700" text-anchor="middle">Detect Upcoming</text>
        <text x="610" y="116" fill="#FDA4AF" font-size="9.5" text-anchor="middle">Target Risk + Drivers</text>

        <line x1="685" y1="95" x2="718" y2="95" stroke="#E11D48" stroke-width="2.2" marker-end="url(#arrRed3)"/>

        <circle cx="810" cy="95" r="56" fill="#8A081E" stroke="#E11D48" stroke-width="2.5"/>
        <text x="810" y="84" fill="#FFFFFF" font-size="10.5" font-weight="700" text-anchor="middle">Selective Prompt</text>
        <text x="810" y="100" fill="#FDA4AF" font-size="9.5" font-weight="700" text-anchor="middle">&amp; RAG Citation</text>
        <text x="810" y="115" fill="#FFE0E5" font-size="8.5" text-anchor="middle">(High/Critical Only)</text>
      </svg>
    `
  }
};

function initArchitectureBlueprints() {
  const container = document.getElementById('blueprintCanvasContainer');
  const titleEl = document.getElementById('blueprintTitle');
  const btns = document.querySelectorAll('[data-blueprint]');
  if (!container) return;

  function renderBlueprint(key) {
    const bp = BLUEPRINT_DIAGRAMS[key] || BLUEPRINT_DIAGRAMS.fig2;
    if (titleEl) titleEl.textContent = bp.title;
    container.innerHTML = bp.svg;
  }

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderBlueprint(btn.dataset.blueprint);
    });
  });

  renderBlueprint('fig2');
}

/* ==========================================================================
   7. INTERACTIVE ASSUMPTIONS REGISTER (A1-A9) & RACI MATRIX (TABLES 11 & 18)
   ========================================================================== */
function initRegistersTabs() {
  const container = document.getElementById('registerTabContainer');
  const btns = document.querySelectorAll('[data-register-tab]');
  if (!container) return;

  const assumptionsHTML = `
    <table class="comp-table" style="min-width:780px; font-size:0.8rem;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Core Hypothesis (Appendix B.2 / Table 18)</th>
          <th>Required Evidence &amp; Validation Gate</th>
          <th>Current Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color:var(--crimson-core); font-family:var(--font-mono);">A1</strong></td>
          <td>Target hospitals can provide required variables with reliable timestamps and patient/bed mapping.</td>
          <td>Technical discovery, connector review, and sample-data profiling at partner hospital.</td>
          <td><span class="scope-symbol scope-symbol--part">Unvalidated at target hospital</span></td>
        </tr>
        <tr>
          <td><strong style="color:var(--crimson-core); font-family:var(--font-mono);">A2</strong></td>
          <td>PulseMind can meet predefined discrimination, calibration, useful lead-time, and prompt-burden criteria.</td>
          <td>Retrospective evaluation using a locked protocol and separated validation dataset.</td>
          <td><span class="scope-symbol scope-symbol--part">Unvalidated (MIMIC-IV PoC only)</span></td>
        </tr>
        <tr>
          <td><strong style="color:var(--crimson-core); font-family:var(--font-mono);">A3</strong></td>
          <td>Clinicians can understand the output and incorporate review into ICU workflow without unacceptable burden.</td>
          <td>Scenario-based usability testing followed by controlled shadow-mode observation.</td>
          <td><span class="scope-symbol scope-symbol--prop">Prototype stage (N=36 survey)</span></td>
        </tr>
        <tr>
          <td><strong style="color:var(--crimson-core); font-family:var(--font-mono);">A4–A5</strong></td>
          <td>Authorised hospital buyer has a feasible budget/procurement pathway and accepts VND 300M eval / VND 800M licence pricing.</td>
          <td>Structured buyer interviews, mapped decision unit, and signed paid evaluation proposal.</td>
          <td><span class="scope-symbol scope-symbol--part">Planning hypothesis only</span></td>
        </tr>
        <tr>
          <td><strong style="color:var(--crimson-core); font-family:var(--font-mono);">A6–A9</strong></td>
          <td>Site activation stays within direct-cost limits (VND 225M eval / VND 200M annual) and 5 active licences achieve operating break-even.</td>
          <td>Actual site delivery logs, supplier quotations, and observed evaluation-to-licence conversion.</td>
          <td><span class="scope-symbol scope-symbol--part">Financial scenario assumption</span></td>
        </tr>
      </tbody>
    </table>
  `;

  const raciHTML = `
    <table class="comp-table" style="min-width:780px; font-size:0.8rem;">
      <thead>
        <tr>
          <th>Workstream (Table 11)</th>
          <th>Nguyễn Lê Phương Khánh</th>
          <th>Nguyễn Phương Trai</th>
          <th>Lê Việt Hải</th>
          <th>Phạm Hoàng Bảo</th>
          <th>Phạm Quang Luân</th>
          <th>Yoshio Nomura</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Model Development</strong></td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td><strong>A (Accountable)</strong></td>
        </tr>
        <tr>
          <td><strong>Frontend Development</strong></td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td>C (Consulted)</td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td><strong>A (Accountable)</strong></td>
          <td><strong>A (Accountable)</strong></td>
        </tr>
        <tr>
          <td><strong>Backend Development</strong></td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td><strong>A (Accountable)</strong></td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
        </tr>
        <tr>
          <td><strong>Market Analysis</strong></td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td>C (Consulted)</td>
          <td><strong>A (Accountable)</strong></td>
          <td><strong>A (Accountable)</strong></td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
        </tr>
        <tr>
          <td><strong>Business Analysis</strong></td>
          <td>C (Consulted)</td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td>C (Consulted)</td>
          <td><strong>A (Accountable)</strong></td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
        </tr>
        <tr>
          <td><strong>Graphic Design</strong></td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td>I (Informed)</td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td><strong>A (Accountable)</strong></td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
        </tr>
        <tr>
          <td><strong>Public Relations</strong></td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td><strong>A (Accountable)</strong></td>
          <td><strong style="color:var(--crimson-core);">R (Responsible)</strong></td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
          <td>I (Informed)</td>
        </tr>
      </tbody>
    </table>
  `;

  function renderRegTab(key) {
    container.innerHTML = key === 'raci' ? raciHTML : assumptionsHTML;
  }

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderRegTab(btn.dataset.registerTab);
    });
  });

  renderRegTab('assumptions');
}


