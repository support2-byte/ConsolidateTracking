import { fmtDate, fmtTime } from "../utils/format";

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
            </span>
            {sh.eta && (
              <span className={`ot-eta-chip${sh.delivered ? " done" : ""}`}>
                <i className="fas fa-calendar-alt" />
                {sh.delivered
                  ? "Delivered"
                  : sh.ready
                    ? "Ready for Delivery"
                    : "ETA"}
                : {fmtDate(sh.eta)}
              </span>
            )}
          </h4>

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
                  {h.time && (
                    <div className="ot-hist-time">{fmtTime(h.time)}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
