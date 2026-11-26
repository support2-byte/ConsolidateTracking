import config from "../config";
import { fmtTime, fmtDate } from "../utils/format";
import ExpectedArrival from "./ExpectedArrival";

export default function StatusHistory({ receiver, statusLabel }) {
  const history = (receiver?.status_history || []).filter((h) => h.status);

  return (
    <section className="panel" id="timelinePanel">
      {history.map((h, i) => {
        const state = i === history.length - 1 ? "active" : "done";
        return (
          <div
            key={h.tracking_id ?? i}
            className={`item ${state}${i === history.length - 1 ? " last" : ""}`}
          >
            <div className="dot"></div>
            <div className="content">
              <div className="status">{h.status}</div>
              {h.time && <div className="time">{fmtTime(h.time)}</div>}
            </div>
          </div>
        );
      })}

      <ExpectedArrival
        statusLabel={statusLabel}
        etaText={receiver?.eta ? fmtDate(receiver.eta) : ""}
      />
    </section>
  );
}
