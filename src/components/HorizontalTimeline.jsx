import { useEffect, useState } from "react";

export default function HorizontalTimeline({ phases, activeIndex, currentStatus }) {
  const target = ((activeIndex + 1) / phases.length) * 100;

  // Start at 0 so the CSS width/left transition animates in
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(target), 100);
    return () => clearTimeout(t);
  }, [target]);

  const tip = phases[activeIndex]?.tip || "Tracking your shipment...";

  return (
    <>
      <div className="timeline-h" id="timelineContainer">
        <div className="line"></div>
        <div className="progress" id="progress" style={{ width: `${pct}%` }}></div>
        <svg
          className="ship"
          id="ship"
          viewBox="0 0 64 64"
          style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
        >
          <path d="M4 40h12l4-6h24l4 6h12v4H4v-4zm4 6h48l-4 10H12l-4-10z" />
        </svg>
        <div className="steps" id="steps-h">
          {phases.map((phase, i) => {
            const cls = i < activeIndex ? "done" : i === activeIndex ? "active" : "";
            return (
              <div key={phase.label} className={`step ${cls}`}>
                <div className="node" title={phase.tip}></div>
                <label style={{ fontWeight: "bold" }}>{phase.label}</label>
              </div>
            );
          })}
        </div>
      </div>

      <div id="statusMsg" className="status-message">
        <strong>Current Status:</strong> {currentStatus}
        <br />
        <span style={{ color: "#666", fontSize: "0.95em" }}>{tip}</span>
      </div>
    </>
  );
}
