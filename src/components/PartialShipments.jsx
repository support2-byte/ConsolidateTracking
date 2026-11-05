import { fmtDate, fmtTime } from "../utils/format";
import HorizontalTimeline from "./HorizontalTimeline";

export function PartialShipments({ s }) {
  return (
    <div className="ot-partials">
      {s.shipments.map((sh, n) => (
        <section key={n} className="ot-partial">
          <h4 className="ot-partial-title">
            Shipment {n + 1} of {s.shipments.length}
            <span>
              {sh.qty.toLocaleString()} pkgs
              {sh.weight > 0 ? ` · ${sh.weight.toLocaleString()} kg` : ""}
              {sh.container ? ` · ${sh.container}` : ""}
              {!sh.delivered && sh.eta ? ` · ETA ${fmtDate(sh.eta)}` : ""}
            </span>
          </h4>

          <HorizontalTimeline
            phases={s.phases}
            activeIndex={sh.activeIndex}
            currentStatus={sh.status}
          />

          <ol className="ot-hist">
            {sh.history.map((h, k) => (
              <li
                key={k}
                className={k === sh.history.length - 1 ? "current" : ""}
                style={{ "--i": k }}
              >
                <span className="ot-hist-dot" />
                <div>
                  <div className="ot-hist-status">{h.status}</div>
                  <div className="ot-hist-time">{fmtTime(h.time)}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
