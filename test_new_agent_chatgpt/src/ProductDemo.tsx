import { useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Clock3,
  Database,
  LayoutGrid,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PulseMark } from "./Brand";

const patients = [
  {
    id: "PM-004",
    bed: "04",
    state: "Review suggested",
    color: "red",
    factor: "Increasing oxygen support",
    oxygen: 92,
    fio: 60,
    rate: 28,
  },
  {
    id: "PM-008",
    bed: "08",
    state: "Routine view",
    color: "green",
    factor: "Stable recorded trends",
    oxygen: 97,
    fio: 35,
    rate: 18,
  },
  {
    id: "PM-012",
    bed: "12",
    state: "Data limited",
    color: "amber",
    factor: "Recent measurements missing",
    oxygen: null,
    fio: 40,
    rate: 22,
  },
];
const stages = [
  {
    title: "See the whole unit",
    description: "A shared view of who may need a closer look.",
  },
  {
    title: "Understand the patient",
    description: "Connect the trends. Put each change in context.",
  },
  {
    title: "Trace every signal",
    description: "See the source, the history, and what is missing.",
  },
];

function TrendChart({
  routine = false,
  parameter = false,
  range = "6h",
}: {
  routine?: boolean;
  parameter?: boolean;
  range?: string;
}) {
  const path = routine
    ? "M0 80 C30 76 40 90 65 82 S100 75 130 80 S170 85 200 78 S230 75 260 79 S300 84 330 79 S380 75 410 80 S460 73 500 77"
    : range === "24h"
      ? "M0 120 C30 125 40 110 65 114 S100 100 130 110 S170 87 200 94 S230 75 260 90 S300 77 330 60 S380 73 410 45 S460 51 500 28"
      : "M0 117 C20 120 30 106 50 111 S80 129 105 112 S130 113 155 102 S190 108 215 84 S245 100 270 80 S305 76 330 59 S350 65 380 48 S410 68 435 43 S470 39 500 20";
  const color = routine ? "#35766a" : "#bc193b";
  return (
    <div className="chart">
      <div className="chart-y">
        <span>{parameter ? "70" : "Higher"}</span>
        <span>{parameter ? "50" : ""}</span>
        <span>{parameter ? "30" : "Lower"}</span>
      </div>
      <div className="chart-main">
        <svg
          viewBox="0 0 500 160"
          role="img"
          aria-label={`${parameter ? "Inspired oxygen" : "Illustrative respiratory assessment"} trend over ${range === "24h" ? "24" : "6"} hours${routine ? ", stable" : ", increasing"}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity=".13" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 65, 110, 155].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="500"
              y2={y}
              stroke="#e8e8e6"
              strokeDasharray="3 5"
            />
          ))}
          <path d={`${path} L500 160 L0 160 Z`} fill="url(#chart-fill)" />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx="500"
            cy={routine ? 77 : range === "24h" ? 28 : 20}
            r="4"
            fill={color}
          />
        </svg>
        <div className="chart-x">
          <span>{range === "24h" ? "Yesterday, 14:00" : "08:00"}</span>
          <span>{range === "24h" ? "02:00" : "11:00"}</span>
          <span>14:00</span>
        </div>
      </div>
    </div>
  );
}

export default function ProductDemo() {
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState(0);
  const [range, setRange] = useState("6h");
  const [query, setQuery] = useState("");
  const [reviewed, setReviewed] = useState<string[]>([]);
  const patient = patients[selected];
  const filtered = patients.filter((p) =>
    `${p.id} ${p.bed}`.toLowerCase().includes(query.toLowerCase()),
  );
  function switchStage(index: number) {
    setStage(index);
    setRange("6h");
  }
  return (
    <>
      <div
        className="demo-stages"
        role="tablist"
        aria-label="Explore the PulseMind prototype"
      >
        {stages.map((item, i) => (
          <button
            id={`stage-${i}`}
            key={item.title}
            role="tab"
            aria-selected={stage === i}
            aria-controls="demo-panel"
            tabIndex={stage === i ? 0 : -1}
            className={stage === i ? "active" : ""}
            onClick={() => switchStage(i)}
            onKeyDown={(event) => {
              if (
                ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (i + (event.key === "ArrowRight" ? 1 : 2)) % 3;
                switchStage(next);
                document.getElementById(`stage-${next}`)?.focus();
              }
            }}
          >
            <span className="stage-number">0{i + 1}</span>
            <span>{item.title}</span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <div
        className="demo-browser"
        id="demo-panel"
        role="tabpanel"
        aria-labelledby={`stage-${stage}`}
      >
        <div className="browser-bar">
          <div className="browser-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>
            <ShieldCheck size={12} /> PulseMind / interactive preview
          </span>
          <span className="synthetic-label">SYNTHETIC DATA</span>
        </div>
        <div className="demo-app">
          <aside className="demo-sidebar" aria-label="Prototype navigation">
            <PulseMark />
            <div className="sidebar-rule" />
            <button
              aria-label="Patient overview"
              onClick={() => switchStage(0)}
              className={stage === 0 ? "selected" : ""}
            >
              <LayoutGrid size={19} />
            </button>
            <button
              aria-label="Patient detail"
              onClick={() => switchStage(1)}
              className={stage === 1 ? "selected" : ""}
            >
              <Activity size={20} />
            </button>
            <button
              aria-label="Parameter detail"
              onClick={() => switchStage(2)}
              className={stage === 2 ? "selected" : ""}
            >
              <Database size={18} />
            </button>
            <span className="sidebar-avatar">PM</span>
          </aside>
          <div className="demo-main">
            <div className="demo-heading">
              <div>
                <div className="demo-breadcrumb">
                  ADULT ICU <span>/</span>{" "}
                  {stage === 0 ? "UNIT OVERVIEW" : patient.id}
                </div>
                <h3>
                  {stage === 0
                    ? "Every patient. In perspective."
                    : stage === 1
                      ? "The context behind the change."
                      : "A signal with a source."}
                </h3>
              </div>
              <span className="demo-time">
                <Clock3 size={13} /> 14:00 <span>DEMO</span>
              </span>
            </div>
            {stage === 0 ? (
              <>
                <div className="demo-summary">
                  <div>
                    <span className="summary-dot neutral" />
                    <span>Patients in view</span>
                    <strong>03</strong>
                  </div>
                  <div>
                    <span className="summary-dot red" />
                    <span>Pending review</span>
                    <strong>{reviewed.includes("PM-004") ? "00" : "01"}</strong>
                  </div>
                  <div>
                    <span className="summary-dot amber" />
                    <span>Limited data</span>
                    <strong>01</strong>
                  </div>
                </div>
                <div className="patient-list-heading">
                  <h4>
                    Patient overview <span>3 patients</span>
                  </h4>
                  <label className="demo-search">
                    <Search size={14} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Find patient"
                      aria-label="Find a demo patient"
                    />
                  </label>
                </div>
                <div className="patient-table">
                  <div className="patient-table-head">
                    <span>PATIENT / BED</span>
                    <span>REVIEW STATE</span>
                    <span>CONTEXT</span>
                    <span />
                  </div>
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      className="patient-row"
                      onClick={() => {
                        setSelected(patients.indexOf(p));
                        switchStage(1);
                      }}
                    >
                      <span className="patient-id">
                        <span className="bed-icon">
                          <Activity size={17} />
                        </span>
                        <span>
                          <strong>{p.id}</strong>
                          <small>Bed {p.bed}</small>
                        </span>
                      </span>
                      <span>
                        <span
                          className={`status-pill ${reviewed.includes(p.id) ? "green" : p.color}`}
                        >
                          <i />
                          {reviewed.includes(p.id) ? "Reviewed" : p.state}
                        </span>
                      </span>
                      <span className="patient-factor">{p.factor}</span>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="empty-state">
                      No matching patient. Try PM-004, PM-008, or PM-012.
                    </p>
                  )}
                </div>
                <div className="demo-hint">
                  <span>
                    <ShieldCheck size={14} /> Clear context. Clinical decisions
                    stay with you.
                  </span>
                  <span>
                    Select a patient to explore <ArrowRight size={14} />
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="patient-detail-top">
                  <button
                    className="demo-back"
                    onClick={() => switchStage(stage === 2 ? 1 : 0)}
                  >
                    <ChevronLeft size={14} />{" "}
                    {stage === 2 ? "Patient detail" : "All patients"}
                  </button>
                  <span
                    className={`status-pill ${reviewed.includes(patient.id) ? "green" : patient.color}`}
                  >
                    <i />
                    {reviewed.includes(patient.id) ? "Reviewed" : patient.state}
                  </span>
                  <span className="detail-patient-id">
                    {patient.id} · Bed {patient.bed}
                  </span>
                </div>
                <div className="detail-grid">
                  <div className="trend-panel">
                    <div className="trend-title">
                      <h4>
                        {stage === 1
                          ? "Respiratory assessment trend"
                          : "Inspired oxygen · FiO₂"}
                      </h4>
                      <div
                        className="range-switch"
                        aria-label="Chart time range"
                      >
                        {["6h", "24h"].map((r) => (
                          <button
                            key={r}
                            aria-pressed={range === r}
                            className={range === r ? "active" : ""}
                            onClick={() => setRange(r)}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selected === 2 ? (
                      <div className="unavailable-state">
                        <Database size={25} />
                        <strong>Assessment unavailable</strong>
                        <span>
                          Recent measurements are missing. Last recorded values
                          are shown for context only.
                        </span>
                      </div>
                    ) : (
                      <TrendChart
                        routine={selected === 1}
                        parameter={stage === 2}
                        range={range}
                      />
                    )}
                    <p className="chart-caption">
                      {stage === 1
                        ? "Illustrative assessment, not a validated risk estimate."
                        : "Synthetic measured values · Ventilator · Last update 14:00"}
                    </p>
                  </div>
                  <div className="explanation-panel">
                    <div className="explanation-label">
                      <PulseMark />
                      {stage === 1 ? "A CLOSER LOOK" : "DATA PROVENANCE"}
                    </div>
                    <h4>
                      {selected === 2
                        ? "Know what is missing."
                        : stage === 2
                          ? "The source matters."
                          : selected === 1
                            ? "A consistent recorded pattern."
                            : "Oxygen support is increasing."}
                    </h4>
                    <p>
                      {selected === 2
                        ? "The current assessment is unavailable because recent data are incomplete. Data limitations remain visible."
                        : stage === 2
                          ? "This view distinguishes measured values from carried-forward or reference data, so the history can be checked."
                          : selected === 1
                            ? "Recent oxygen and respiratory measurements remain relatively stable in this example. Review the source data for context."
                            : "Higher inspired oxygen and respiratory rate appear together in this example. Review the underlying measurements in context."}
                    </p>
                    {stage === 1 ? (
                      <button
                        className="small-link"
                        onClick={() => switchStage(2)}
                      >
                        Explore the source <ArrowRight size={14} />
                      </button>
                    ) : (
                      <span className="source-note">
                        <Check size={14} /> Source and timestamp visible
                      </span>
                    )}
                  </div>
                </div>
                <div className="parameter-row">
                  {[
                    {
                      label: "Oxygen saturation",
                      value: patient.oxygen,
                      unit: "%",
                      key: "SpO₂",
                    },
                    {
                      label: "Inspired oxygen",
                      value: patient.fio,
                      unit: "%",
                      key: "FiO₂",
                    },
                    {
                      label: "Respiratory rate",
                      value: patient.rate,
                      unit: "/min",
                      key: "RR",
                    },
                  ].map((p) => (
                    <div key={p.key}>
                      <span>
                        {p.label} <small>{p.key}</small>
                      </span>
                      <strong>
                        {p.value ?? "—"}
                        <small>{p.value ? p.unit : " No recent data"}</small>
                      </strong>
                    </div>
                  ))}
                  {stage === 1 && (
                    <button
                      className={`review-button ${reviewed.includes(patient.id) ? "is-reviewed" : ""}`}
                      onClick={() =>
                        setReviewed((previous) =>
                          previous.includes(patient.id)
                            ? previous.filter((id) => id !== patient.id)
                            : [...previous, patient.id],
                        )
                      }
                    >
                      {reviewed.includes(patient.id) ? (
                        <Check size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}
                      {reviewed.includes(patient.id)
                        ? "Reviewed · Undo"
                        : "Mark as reviewed"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="demo-disclaimer">
          <span className="live-dot" /> CONCEPT PREVIEW{" "}
          <span>
            Illustrative data. No live hospital connection. Not for clinical
            use.
          </span>
        </div>
      </div>
      <div className="demo-caption">
        <p aria-live="polite">{stages[stage].description}</p>
        <span>
          MADE TO BE EXPLORED <ArrowUpRight size={13} />
        </span>
      </div>
    </>
  );
}
