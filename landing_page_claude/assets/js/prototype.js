/* PulseMind — interactive prototype (simulated data, illustrative values only) */
(() => {
  'use strict';
  const root = document.getElementById('app');
  if (!root) return;
  const crumb = document.getElementById('crumb');

  /* ───────── Icons ───────── */
  const I = {
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    crit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/></svg>',
    tri: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/></svg>',
    diamond: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 21 12 12 21 3 12z"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2-2.3 3.6M12 17v.3"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>',
    carry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13l-3-3M20 15H7l3 3"/></svg>',
    pop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8-.6 6 1.2 6 4.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  };
  const LV = {
    critical: { label: 'Critical', icon: I.crit, rank: 0 },
    high: { label: 'High', icon: I.tri, rank: 1 },
    medium: { label: 'Medium', icon: I.diamond, rank: 2 },
    low: { label: 'Low', icon: I.minus, rank: 3 },
    unavailable: { label: 'Risk level unavailable', icon: I.help, rank: 4 },
  };
  const DATA = {
    limited: { label: 'Data-limited', icon: I.tri },
    unknown: { label: 'Data sufficiency unknown', icon: I.tri },
  };
  const PARAMS = [
    { k: 'rr', name: 'Respiratory rate', unit: 'breaths/min', dec: 0 },
    { k: 'vt', name: 'Tidal volume', unit: 'mL', dec: 0 },
    { k: 'peep', name: 'PEEP', unit: 'cmH₂O', dec: 0 },
    { k: 'fio2', name: 'FiO₂', unit: 'fraction', dec: 2 },
    { k: 'spo2', name: 'SpO₂', unit: '%', dec: 0 },
    { k: 'pplat', name: 'Plateau pressure', unit: 'cmH₂O', dec: 0 },
    { k: 'dp', name: 'Driving pressure', unit: 'cmH₂O', dec: 0 },
    { k: 'mv', name: 'Minute ventilation', unit: 'L/min', dec: 1 },
  ];
  const PNAME = Object.fromEntries(PARAMS.map(p => [p.k, p.name]));

  /* ───────── Simulated patients (mirrors the team’s prototype) ─────────
     src: m = measured, c = carried forward, p = population reference, n = not available */
  const patients = [
    { id: 'PT-2006', review: 'pending', level: 'critical', score: 90.6, data: 'unknown',
      factors: [['mv', 59.1], ['rr', 47.3], ['dp', 38.0], ['spo2', 21.5]],
      hist: [78.1, 83.4, 86.9, 89.7, 90.6], held: 4, suff: 'Unknown', imp: 31.2, doc: 64.0,
      warn: ['Data sufficiency unknown: FiO₂ field mapping not yet confirmed', 'Tidal volume carried forward, last measured 26 min ago'],
      p: { rr: [29, 'm'], vt: [362, 'c', 26], peep: [10, 'm'], fio2: [.65, 'm'], spo2: [90, 'm'], pplat: [29, 'm'], dp: [19, 'm'], mv: [12.9, 'm'] } },
    { id: 'PT-2018', review: 'pending', level: 'critical', score: 90.2, data: null,
      factors: [['peep', 64.0], ['fio2', 52.2], ['spo2', 44.9], ['pplat', 30.1]],
      hist: [81.0, 84.2, 86.0, 88.8, 90.2], held: 5, suff: 'Sufficient', imp: 9.8, doc: 58.3, warn: [],
      p: { rr: [24, 'm'], vt: [410, 'm'], peep: [14, 'm'], fio2: [.8, 'm'], spo2: [89, 'm'], pplat: [30, 'm'], dp: [16, 'm'], mv: [9.8, 'm'] } },
    { id: 'PT-1001', review: 'pending', level: 'critical', score: 87.2, data: null,
      factors: [['peep', 62.3], ['dp', 48.8], ['rr', 36.5], ['vt', 22.0]],
      hist: [74.4, 79.0, 83.1, 85.6, 87.2], held: 3, suff: 'Sufficient', imp: 12.1, doc: 61.7, warn: [],
      p: { rr: [26, 'm'], vt: [385, 'm'], peep: [12, 'm'], fio2: [.7, 'm'], spo2: [91, 'm'], pplat: [28, 'm'], dp: [16, 'm'], mv: [10.0, 'm'] } },
    { id: 'PT-2001', review: 'pending', level: 'high', score: 73.8, data: 'limited',
      factors: [['spo2', 59.6], ['fio2', 45.0], ['rr', 33.1], ['peep', 20.4]],
      hist: [61.2, 64.0, 69.5, 72.2, 73.8], held: 2, suff: 'Limited', imp: 41.5, doc: 70.2,
      warn: ['SpO₂ carried forward, last measured 24 min ago', 'FiO₂ taken from a population reference: no charted value in 60 min'],
      p: { rr: [23, 'm'], vt: [420, 'm'], peep: [8, 'm'], fio2: [.6, 'p'], spo2: [92, 'c', 24], pplat: [24, 'm'], dp: [16, 'm'], mv: [9.7, 'm'] } },
    { id: 'PT-1002', review: 'pending', level: 'high', score: 68.2, data: null,
      factors: [['rr', 64.7], ['peep', 50.4], ['dp', 41.4], ['fio2', 29.6]],
      hist: [50.8, 72.4, 71.6, 69.9, 68.2], held: 3, suff: 'Sufficient', imp: 18.4, doc: 77.5,
      warn: ['Minute ventilation carried forward, last measured 18 min ago'],
      p: { rr: [21, 'm'], vt: [399, 'm'], peep: [7, 'm'], fio2: [.54, 'm'], spo2: [93, 'm'], pplat: [23, 'm'], dp: [12, 'm'], mv: [10.7, 'c', 18] } },
    { id: 'PT-2007', review: 'pending', level: 'unavailable', score: null, data: 'unknown',
      factors: [], hist: [], held: 0, suff: 'Unknown', imp: null, doc: null,
      warn: ['No FiO₂ charted in the last 60 min', 'Ventilator feed not yet associated with this bed', 'Assessment withheld: risk level unavailable rather than guessed'],
      p: { rr: [20, 'm'], vt: [null, 'n'], peep: [6, 'm'], fio2: [null, 'n'], spo2: [95, 'm'], pplat: [null, 'n'], dp: [null, 'n'], mv: [8.1, 'c', 31] } },
    { id: 'PT-1003', review: 'reviewed', level: 'medium', score: 55.1, data: null,
      factors: [['mv', 60.0], ['rr', 41.2], ['vt', 30.5], ['peep', 18.9]],
      hist: [53.2, 56.0, 54.8, 55.6, 55.1], held: 6, suff: 'Sufficient', imp: 14.0, doc: 72.3, warn: [],
      p: { rr: [22, 'm'], vt: [430, 'm'], peep: [8, 'm'], fio2: [.45, 'm'], spo2: [95, 'm'], pplat: [22, 'm'], dp: [14, 'm'], mv: [9.5, 'm'] } },
    { id: 'PT-1004', review: 'reviewed', level: 'low', score: 25.4, data: null,
      factors: [['fio2', 59.5], ['spo2', 36.1], ['peep', 22.4], ['rr', 15.0]],
      hist: [35.2, 31.0, 29.4, 27.0, 25.4], held: 4, suff: 'Sufficient', imp: 10.6, doc: 66.0, warn: [],
      p: { rr: [16, 'm'], vt: [450, 'm'], peep: [6, 'm'], fio2: [.4, 'm'], spo2: [97, 'm'], pplat: [19, 'm'], dp: [13, 'm'], mv: [7.2, 'm'] } },
  ];
  const HIST_MIN = [-19, -14, -9, -5, -1];

  /* ───────── Helpers ───────── */
  const pad = n => String(n).padStart(2, '0');
  const at = minsAgo => { const d = new Date(Date.now() + minsAgo * 60000); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtVal = (k, v) => { const p = PARAMS.find(x => x.k === k); return v == null ? '—' : (p.dec ? v.toFixed(p.dec) : String(v)); };
  const rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const sortPatients = list => list.slice().sort((a, b) =>
    (a.review === b.review ? 0 : a.review === 'pending' ? -1 : 1) ||
    (LV[a.level].rank - LV[b.level].rank) || ((b.score ?? -1) - (a.score ?? -1)));

  const riskBadge = p => p.level === 'unavailable'
    ? `<span class="badge b-unavailable">${I.help}Risk unavailable</span>`
    : `<span class="badge b-${p.level}">${LV[p.level].icon}${LV[p.level].label} · ${p.score.toFixed(1)}%</span>`;
  const reviewBadge = p => p.review === 'pending'
    ? `<span class="badge b-pending">${I.flag}Pending review</span>`
    : `<span class="badge b-reviewed">${I.check}Reviewed</span>`;
  const dataBadge = p => (p.data ? `<span class="badge b-${p.data}">${DATA[p.data].icon}${DATA[p.data].label}</span>` : '');

  /* ───────── State ───────── */
  const state = { view: 'overview', id: null, param: 'rr', filter: null, q: '' };
  let toastTimer = 0;

  function shell(body) {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <div class="app-top">
        <span class="app-logo"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 42h12c2 0 3-1 4-3l4-17c.6-2.4 3-2.4 3.6 0L31 30h6c1.4 0 2.2.8 2.8 2l2.6 6c.8 2 1.8 4 4 4H58"/></svg>PulseMind</span>
        <span class="app-pill">Read-only · Decision support</span>
        <span class="app-clock"><small>Unit clock · local</small><b>${pad(now.getHours())}:${pad(now.getMinutes())}</b> <span>${date}</span></span>
        <span class="app-av" aria-label="Signed in as demo clinician">DC</span>
      </div>
      <div class="app-body">${body}</div>
      <div class="toast" role="status" id="toast"></div>`;
  }

  /* ───────── Overview ───────── */
  function counts() {
    const c = { pending: 0, reviewed: 0, limited: 0, unknown: 0, critical: 0, high: 0, medium: 0, low: 0, unavailable: 0 };
    patients.forEach(p => { c[p.review]++; if (p.data) c[p.data]++; c[p.level]++; });
    return c;
  }
  function chip(key, cls, icon, label, n) {
    const pressed = state.filter === key;
    const dim = state.filter && !pressed;
    return `<button class="fchip badge b-${cls}${dim ? ' is-dim' : ''}" data-filter="${key}" aria-pressed="${pressed}">${icon}${label} ${n}</button>`;
  }
  function matches(p) {
    if (state.q && !p.id.toLowerCase().includes(state.q.toLowerCase())) return false;
    const f = state.filter;
    if (!f) return true;
    return p.review === f || p.data === f || p.level === f;
  }
  function row(p, i) {
    const drv = p.factors.length
      ? `<b>Primary driver:</b> ${esc(PNAME[p.factors[0][0]])} (${+(p.factors[0][1] / 100).toFixed(3)})`
      : 'No ranked factors available';
    return `<button class="prow" data-open="${p.id}" aria-label="Open ${p.id}">
      <span class="rk">${i}</span>
      <span class="pid">${p.id}</span>
      <span class="c-rev">${reviewBadge(p)}</span>
      <span class="c-risk">${riskBadge(p)}</span>
      <span class="c-data">${dataBadge(p)}</span>
      <span class="drv">${drv}</span>
    </button>`;
  }
  function overview() {
    const c = counts();
    const list = sortPatients(patients);
    const pend = list.filter(p => p.review === 'pending' && matches(p));
    const rev = list.filter(p => p.review === 'reviewed' && matches(p));
    let idx = 0;
    const head = `<div class="prow-head"><span></span><span>Patient</span><span>Review</span><span>Risk · score</span><span>Data</span><span>Primary driver</span></div>`;
    const group = (title, items, note) => `
      <h4>${title} <span class="n">${items.length}</span> ${note ? `<small>${note}</small>` : ''}</h4>
      ${head}
      <div class="plist">${items.length ? items.map(p => row(p, ++idx)).join('') : '<p class="p-empty">No patients match this filter.</p>'}</div>`;
    return shell(`
      <div class="filters">
        <div class="search"><label for="pmSearch">Search patient ID</label><input id="pmSearch" type="search" placeholder="e.g. PT-1002" value="${esc(state.q)}" autocomplete="off"></div>
        <div class="f-rows">
          <div class="f-row"><span>Review</span>${chip('pending', 'pending', I.flag, 'Pending review', c.pending)}${chip('reviewed', 'reviewed', I.check, 'Reviewed', c.reviewed)}</div>
          <div class="f-row"><span>Data</span>${chip('limited', 'limited', I.tri, 'Data-limited', c.limited)}${chip('unknown', 'unknown', I.tri, 'Sufficiency unknown', c.unknown)}</div>
          <div class="f-row"><span>Risk</span>${chip('critical', 'critical', I.crit, 'Critical', c.critical)}${chip('high', 'high', I.tri, 'High', c.high)}${chip('medium', 'medium', I.diamond, 'Medium', c.medium)}${chip('low', 'low', I.minus, 'Low', c.low)}${chip('unavailable', 'unavailable', I.help, 'Unavailable', c.unavailable)}</div>
        </div>
      </div>
      <div class="ptable">
        ${group('Pending review', pend, 'ranked first, then by risk')}
        ${group('Reviewed', rev)}
      </div>`);
  }

  /* ───────── Charts ───────── */
  function riskChart(p) {
    const W = 420, H = 190, L = 34, R = 40, T = 10, B = 26;
    const x = i => L + (i / 4) * (W - L - R);
    const y = v => T + (1 - v / 100) * (H - T - B);
    const thr = [[85, 'CRIT'], [65, 'HIGH'], [40, 'MED']];
    let s = `<svg class="rchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Risk score over the last 20 minutes">`;
    s += `<rect class="band" x="${L}" y="${y(100)}" width="${W - L - R}" height="${y(40) - y(100)}"/>`;
    [0, 25, 50, 75, 100].forEach(v => { s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`; });
    thr.forEach(([v, t]) => { s += `<line class="thr" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="thr-l" x="${W - R + 6}" y="${y(v) + 3.5}" text-anchor="start">${t}</text>`; });
    HIST_MIN.forEach((m, i) => { s += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${at(m)}</text>`; });
    s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
    if (p.hist.length) {
      const pts = p.hist.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      s += `<polyline class="ln" points="${pts}"/>`;
      p.hist.forEach((v, i) => { s += `<circle class="${i === p.hist.length - 1 ? 'pt-last' : 'pt'}" cx="${x(i)}" cy="${y(v)}" r="${i === p.hist.length - 1 ? 5 : 3.5}"><title>${at(HIST_MIN[i])} · ${v.toFixed(1)}</title></circle>`; });
    } else {
      s += `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" style="font-size:12px">No risk history: assessment unavailable</text>`;
    }
    return s + '</svg>';
  }

  function paramSeries(p, k) {
    const [cur, src, ago] = p.p[k];
    if (cur == null) return [];
    const r = rng(p.id.charCodeAt(3) * 31 + k.length * 7);
    const mins = [-18, -13, -8, -3];
    const def = PARAMS.find(x => x.k === k);
    const spread = { rr: 3, vt: 30, peep: 1, fio2: .05, spo2: 2, pplat: 2, dp: 2, mv: .8 }[k];
    const out = mins.map((m, i) => {
      let v = cur + (r() - .5) * 2 * spread * (1 - i / 4);
      v = def.dec ? +v.toFixed(def.dec) : Math.round(v);
      return { m, v, s: 'm' };
    });
    out[0].s = 'c'; // first value in the window was carried in from before it
    out[3].v = cur;
    if (src === 'c') {
      // last real measurement was `ago` minutes ago; everything after it is carried forward
      let last = -1;
      mins.forEach((m, i) => { if (m <= -ago) last = i; });
      if (last >= 0) { out[last].s = 'm'; out[last].v = cur; }
      for (let i = last + 1; i < out.length; i++) { out[i].s = 'c'; out[i].v = cur; }
    }
    if (src === 'p') out[3].s = 'p';
    return out;
  }

  function paramChart(p, k) {
    const s = paramSeries(p, k);
    const def = PARAMS.find(x => x.k === k);
    const W = 760, H = 260, L = 48, R = 18, T = 14, B = 30;
    if (!s.length) {
      return `<svg class="rchart" viewBox="0 0 ${W} 120" role="img" aria-label="No recorded values"><text x="${W / 2}" y="64" text-anchor="middle" style="font-size:13px">No recorded values for ${esc(def.name)} in the last 20 minutes: shown as unavailable, not estimated.</text></svg>`;
    }
    const vals = s.map(d => d.v);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const padv = Math.max((hi - lo) * .6, { rr: 6, vt: 60, peep: 3, fio2: .1, spo2: 4, pplat: 4, dp: 4, mv: 2 }[k]);
    lo = Math.max(0, lo - padv); hi = hi + padv;
    const x = m => L + ((m + 20) / 20) * (W - L - R);
    const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    let out = `<svg class="rchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(def.name)} charting history and provenance">`;
    for (let i = 0; i <= 4; i++) { const v = lo + (i / 4) * (hi - lo); out += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 3.5}" text-anchor="end">${def.dec ? v.toFixed(def.dec) : Math.round(v)}</text>`; }
    [-20, -15, -10, -5, 0].forEach(m => { out += `<text x="${x(m)}" y="${H - 8}" text-anchor="middle">${at(m)}</text>`; });
    out += `<line class="axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
    let d = `M${x(-20)} ${y(s[0].v)}`;
    s.forEach((pt, i) => { d += ` L${x(pt.m)} ${y(i ? s[i - 1].v : pt.v)} L${x(pt.m)} ${y(pt.v)}`; });
    d += ` L${x(0)} ${y(s[s.length - 1].v)}`;
    out += `<path class="ln-step" d="${d}"/>`;
    s.forEach(pt => {
      const cls = pt.s === 'm' ? 'pt-m' : pt.s === 'c' ? 'pt-c' : 'pt-p';
      out += `<circle class="${cls}" cx="${x(pt.m)}" cy="${y(pt.v)}" r="6"><title>${at(pt.m)} · ${fmtVal(k, pt.v)} · ${pt.s === 'm' ? 'measured' : pt.s === 'c' ? 'carried forward' : 'population reference'}</title></circle>`;
    });
    return out + '</svg>';
  }

  /* ───────── Patient detail ───────── */
  function detail(p) {
    const lv = LV[p.level];
    const top2 = p.factors.slice(0, 2).map(f => PNAME[f[0]]);
    const expl = p.level === 'unavailable'
      ? 'No assessment was produced: required inputs are missing or not yet associated with this bed. PulseMind shows this state instead of estimating a score.'
      : `${top2[0]} carries the largest contribution in this reading, followed by ${top2[1]}. The remaining recorded factors contribute less individually.`;
    const scoreBlock = p.level === 'unavailable'
      ? `<div><p class="card-k">Respiratory-risk score</p><p class="score-n" style="font-size:34px">—</p><p class="score-lv">${I.help}Unavailable</p></div>`
      : `<div><p class="card-k">Respiratory-risk score</p><p class="score-n">${p.score.toFixed(1)}<small>%</small></p><p class="score-lv">${lv.icon}${lv.label}</p></div>`;
    const reviewed = p.review === 'reviewed';
    const factorList = p.factors.length
      ? `<ol>${p.factors.map((f, i) => `<li><span class="i">${i + 1}.</span><span>${esc(PNAME[f[0]])}</span><span class="v">${f[1].toFixed(1)}%</span><span class="bar"><i style="transform:scaleX(${f[1] / 100});animation-delay:${i * .08}s"></i></span></li>`).join('')}</ol>`
      : '<p class="none">No ranked factors: no assessment was produced.</p>';
    const prmRows = PARAMS.map(def => {
      const [v, src, ago] = p.p[def.k];
      const used = p.factors.some(f => f[0] === def.k);
      const srcHtml = src === 'm' ? `<span class="src">${I.pulse}Measured</span>`
        : src === 'c' ? `<span class="src carried">${I.carry}Carried forward</span><span class="src-sub">last measured ${at(-ago)} (${ago} min ago)</span>`
        : src === 'p' ? `<span class="src pop">${I.pop}Population reference</span>`
        : `<span class="src na">${I.help}Not available</span>`;
      const useHtml = used ? '<span class="use">Current score factor</span>' : `<span class="use unk">${I.tri}Model use unknown</span>`;
      return `<button class="prm" data-param="${def.k}" aria-label="Open ${esc(def.name)} detail">
        <span class="nm">${esc(def.name)}</span>
        <span class="val"><b>${fmtVal(def.k, v)}</b>${v == null ? '' : `<small>${def.unit}</small>`}</span>
        <span class="c-src">${srcHtml}</span>
        <span class="t">${at(-1)} <small>(1 min ago)</small></span>
        <span class="c-use">${useHtml}</span>
      </button>`;
    }).join('');
    const pct = v => (v == null ? '—' : v.toFixed(1) + '%');
    return shell(`
      <button class="back" data-nav="overview">${I.back}Back to overview</button>
      <div class="d-head">
        <div><h3>Patient ${p.id}</h3><p>reading as of ${at(-1)} local (1 min ago) · target and horizon illustrative</p></div>
        ${dataBadge(p)}
      </div>
      <div class="d-grid">
        <div class="card score lv-${p.level}">
          ${scoreBlock}
          <div class="score-x"><h5>Explanation</h5><p>${expl}</p><p class="tiny">Model-contributing variables are influences on the estimate, not confirmed causes.</p></div>
        </div>
        <div class="side">
          <details class="card integ"${p.warn.length ? '' : ''}>
            <summary>${I.tri}Data integrity: ${p.warn.length ? `${p.warn.length} warning${p.warn.length > 1 ? 's' : ''} on this patient` : 'no warnings'}</summary>
            ${p.warn.length ? `<ul>${p.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '<ul><li>All required inputs present and recent.</li></ul>'}
          </details>
          <div class="card review${reviewed ? ' is-done' : ''}">
            <div>
              <b>${reviewed ? I.check + 'Reviewed' : I.flag + 'Pending review'}</b>
              <small>${reviewed ? 'Marked this session. Not written to any record.' : 'An in-interface flag, not an alarm.'}</small>
            </div>
            ${reviewed ? '' : `<button class="mark-btn" data-mark="${p.id}">Mark as reviewed</button>`}
          </div>
        </div>
      </div>
      <div class="d-row">
        <div class="card chart-card"><p class="card-k">Risk history</p><h5>Respiratory-risk score <small>${reviewed ? 'Reviewed' : 'Not reviewed yet'}</small></h5>${riskChart(p)}</div>
        <div class="card rstate"><p class="card-k">Reading state</p>
          <dl>
            <div><dt>Readings held at this level</dt><dd>${p.held || '—'}</dd></div>
            <div><dt>Data sufficiency</dt><dd class="${p.suff === 'Sufficient' ? '' : p.suff === 'Limited' ? 'warn' : 'bad'}">${p.suff}</dd></div>
            <div><dt>Imputed share</dt><dd>${pct(p.imp)}</dd></div>
            <div><dt>Documentation · physiology share</dt><dd>${pct(p.doc)} · ${p.doc == null ? '—' : (100 - p.doc).toFixed(1) + '%'}</dd></div>
          </dl>
        </div>
        <div class="card factors"><h5>Ranked factors contributing to the current score</h5><small>Influences on the model, not causes.</small>${factorList}</div>
      </div>
      <div class="card params">
        <div class="params-h"><h5>Respiratory parameters</h5><p>Point-in-time snapshot of the latest reading. Select a parameter to see where each value came from.</p></div>
        <div class="prm-head"><span>Parameter</span><span>Latest value</span><span>Source</span><span>Charted</span><span>Model use</span></div>
        ${prmRows}
      </div>`);
  }

  /* ───────── Parameter detail ───────── */
  function paramView(p) {
    const k = state.param;
    const def = PARAMS.find(x => x.k === k);
    const s = paramSeries(p, k);
    const nM = s.filter(d => d.s === 'm').length, nC = s.filter(d => d.s === 'c').length, nP = s.filter(d => d.s === 'p').length;
    const lastM = [...s].reverse().find(d => d.s === 'm');
    const prov = s.length
      ? `<b>PROVENANCE</b> Last real measurement ${lastM ? `${-lastM.m} min ago` : 'not in window'} · ${nM} of the last ${s.length} readings measured · ${nC} carried forward · ${nP} from population references.`
      : `<b>PROVENANCE</b> No values recorded in this window. Shown as unavailable rather than estimated.`;
    return shell(`
      <button class="back" data-nav="detail">${I.back}Back to ${p.id}</button>
      <div class="d-head"><div><h3>${esc(def.name)}</h3><p>Patient ${p.id} · chart time ${at(-1)} local (1 min ago)</p></div></div>
      <div class="pchips" role="group" aria-label="Choose parameter">
        ${PARAMS.map(d => `<button class="pchip" data-pchip="${d.k}" aria-pressed="${d.k === k}">${esc(d.name)}</button>`).join('')}
      </div>
      <div class="card chart-card">
        <h5>Charting history and provenance <small>Where each value came from. Not a trend classification.</small></h5>
        <div class="legend-a"><span><i style="background:#2459c9"></i>Measured</span><span><i style="border:2px solid #b0741c;background:#fff"></i>Carried forward</span><span><i style="background:#a24bc4"></i>Population reference</span></div>
        ${paramChart(p, k)}
        <p class="prov">${prov}</p>
      </div>`);
  }

  /* ───────── Render & events ───────── */
  function render(focusSel) {
    const p = patients.find(x => x.id === state.id);
    if (state.view === 'detail' && p) { root.innerHTML = detail(p); crumb.textContent = p.id.toLowerCase(); }
    else if (state.view === 'param' && p) { root.innerHTML = paramView(p); crumb.textContent = `${p.id.toLowerCase()} / ${state.param}`; }
    else { root.innerHTML = overview(); crumb.textContent = 'overview'; }
    if (focusSel) { const el = root.querySelector(focusSel); if (el) el.focus({ preventScroll: true }); }
  }
  function keepInView() {
    const r = root.getBoundingClientRect();
    if (r.top < 60 || r.top > innerHeight * .5) {
      window.scrollTo({ top: scrollY + r.top - 110, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  function toast(msg) {
    const t = root.querySelector('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  root.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) { state.view = 'detail'; state.id = open.dataset.open; render('.back'); keepInView(); return; }
    const nav = e.target.closest('[data-nav]');
    if (nav) { state.view = nav.dataset.nav; render(state.view === 'overview' ? `[data-open="${state.id}"]` : '.back'); keepInView(); return; }
    const f = e.target.closest('[data-filter]');
    if (f) { state.filter = state.filter === f.dataset.filter ? null : f.dataset.filter; render(`[data-filter="${f.dataset.filter}"]`); return; }
    const m = e.target.closest('[data-mark]');
    if (m) {
      const p = patients.find(x => x.id === m.dataset.mark);
      p.review = 'reviewed'; render('.back');
      toast(`${p.id} marked as reviewed: this session only, nothing written or sent.`);
      return;
    }
    const prm = e.target.closest('[data-param]');
    if (prm) { state.view = 'param'; state.param = prm.dataset.param; render('.back'); keepInView(); return; }
    const pc = e.target.closest('[data-pchip]');
    if (pc) { state.param = pc.dataset.pchip; render(`[data-pchip="${state.param}"]`); }
  });
  root.addEventListener('input', e => {
    if (e.target.id !== 'pmSearch') return;
    state.q = e.target.value.trim();
    const pos = e.target.selectionStart;
    render('#pmSearch');
    const inp = root.querySelector('#pmSearch'); if (inp) inp.setSelectionRange(pos, pos);
  });

  render();
  setInterval(() => { const c = root.querySelector('.app-clock b'); if (c) { const n = new Date(); c.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}`; } }, 15000);
})();
