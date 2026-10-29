import config from "../config";
import { fmtTime, fmtDate } from "../utils/format";

export default function StatusHistory({ receiver }) {
  const history = [...(receiver?.status_history || [])]
    .filter((h) => h.status)
    .sort((a, b) => new Date(a.time) - new Date(b.time));

  return (
    <section className="panel" id="timelinePanel">
      {history.map((h, i) => (
        <div
          key={h.tracking_id ?? i}
          className={`item ${i === history.length - 1 ? "active last" : "done"}`}
        >
          <div className="dot"></div>
          <div className="content">
            <div className="status">{h.status}</div>
            <div className="time">{fmtTime(h.time)}</div>
          </div>
        </div>
      ))}

      {receiver?.eta && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <span className="eta">Expected Arrival: {fmtDate(receiver.eta)}</span>
          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              color: "var(--rg-subtext)",
              fontFamily: "'Inter', Arial, sans-serif",
            }}
          >
            Are you looking to schedule your delivery? <br />
            Please call us at{" "}
            <strong style={{ color: "var(--rg-orange)" }}>
              {config.SUPPORT_PHONE_DISPLAY}
            </strong>{" "}
            and book your delivery with best competitive prices.
          </p>
        </div>
      )}
    </section>
  );
}
