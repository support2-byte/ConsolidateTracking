import { useState } from "react";
import config from "../config";
import { fmtDate, fmtTime } from "../utils/format";
import TerminalNotice from "./TerminalNotice";
import HorizontalTimeline from "./HorizontalTimeline";

const fmtWeight = (w) => {
  const n = parseFloat(String(w).replace(/,/g, ""));
  return Number.isFinite(n) ? `${n.toLocaleString("en-US")} KG` : "—";
};

export function OrderSummary({ s, onNotify }) {
  return (
    <div className="ot-fade">
      <div className="ot-banner">
        <span className="ot-banner-label">Tracking ID</span>
        <span className="ot-banner-id">
          {s.trackingId && s.trackingId !== "—" ? s.trackingId : s.inputRef}
        </span>
      </div>

      {(s.pol || s.pod) && (
        <div className="route">
          <span>{s.pol || "—"}</span>
          <span className="arrow">➜</span>
          <span>{s.pod || "—"}</span>
        </div>
      )}

      <div className="last-updated">Last updated: {s.lastUpdated}</div>

      <div className="order-info">
        <div className="info-block ref-block">
          <div className="info-label">Ref ID</div>
          <div className="info-value" id="refId">
            {s.referenceId && s.referenceId !== "—"
              ? s.referenceId
              : s.inputRef}
          </div>
        </div>
        <div className="info-block">
          <div className="info-label">Order ID</div>
          <div className="info-value">{s.orderId}</div>
        </div>
        <div className="info-block">
          <div className="info-label">Quantity</div>
          <div className="info-value">{s.qty}</div>
          {s.itemType && <div className="info-sub">{s.itemType}</div>}
        </div>
        <div className="info-block">
          <div className="info-label">Weight</div>
          <div className="info-value">{fmtWeight(s.weight)}</div>
        </div>
        <div className="info-block">
          <div className="info-label">
            {s.allDelivered ? "Delivered" : "ETA"}
          </div>
          <div className="info-value">{s.etaText}</div>
        </div>
      </div>

      <div className="actions">
        <button className="btn" type="button" onClick={onNotify}>
          Notify Me
        </button>
      </div>
    </div>
  );
}

export function OrderReceivers({ s }) {
  return (
    <section className="ot-receivers">
      {s.receivers.map((r, i) => (
        <ReceiverCard
          key={r.id ?? i}
          r={r}
          index={i}
          phases={s.phases}
          defaultOpen={i === 0}
        />
      ))}
    </section>
  );
}

function ReceiverCard({ r, index, phases, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="ot-card" style={{ "--i": index }}>
      <button
        type="button"
        className="ot-card-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="ot-card-title">
          <h4>
            Receiver {index + 1}: {r.name}
          </h4>
          {r.address && <p>{r.address}</p>}
          <div className="ot-chips">
            <span className="ot-chip ot-chip-blue">
              {r.items.length} item{r.items.length === 1 ? "" : "s"}
            </span>
            <span className="ot-chip ot-chip-green">
              {r.deliveredCount}/{r.items.length} delivered
            </span>
            {r.leastItem && (
              <span className="ot-chip ot-chip-orange ot-live">
                Current: {r.currentStatus}
              </span>
            )}
          </div>
        </div>
        <i className={`fas fa-chevron-down ot-chev${open ? " open" : ""}`} />
      </button>

      <div className={`ot-collapse${open ? " open" : ""}`}>
        <div className="ot-collapse-inner">
          <div className="ot-body">
            {r.leastItem && (
              <>
                <HorizontalTimeline
                  phases={phases}
                  activeIndex={r.activeIndex}
                  currentStatus={r.currentStatus}
                />
              </>
            )}

            {r.partial ? (
              <div className="ot-items">
                {r.items.map((it, k) => (
                  <ItemCard key={it.id ?? k} it={it} phases={phases} i={k} />
                ))}
              </div>
            ) : r.leastItem ? (
              <HistoryList history={r.leastItem.history} />
            ) : (
              r.items[0]?.terminal && (
                <TerminalNotice kind={r.items[0].terminal} />
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function OrderItems({ s }) {
  const items = s.receivers.flatMap((r) => r.items);
  return (
    <div className="ot-items">
      {items.map((it, k) => (
        <ItemCard key={it.id ?? k} it={it} phases={s.phases} i={k} />
      ))}
    </div>
  );
}

function HistoryList({ history }) {
  if (!history || history.length === 0)
    return <p className="ot-empty">No tracking updates yet.</p>;

  return (
    <ol className="ot-hist">
      {history.map((h, k) => (
        <li
          key={k}
          className={k === history.length - 1 ? "current" : ""}
          style={{ "--i": k }}
        >
          <span className="ot-hist-dot" />
          <div>
            <div className="ot-hist-status">{h.status}</div>
            {h.time && <div className="ot-hist-time">{fmtTime(h.time)}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ShipmentCard({ sh, n, total, phases }) {
  const [open, setOpen] = useState(false);
  const updates = sh.history?.length || 0;

  return (
    <div className={`ot-ship${sh.delivered ? " delivered" : ""}`}>
      <div className="ot-ship-head">
        <div className="ot-ship-info">
          <div className="ot-ship-title">
            Shipment {n + 1} of {total}
          </div>
          <div className="ot-ship-meta">
            <span>
              <b>{sh.qty.toLocaleString()}</b> pkgs
            </span>
            {sh.weight > 0 && (
              <span>
                <b>{sh.weight.toLocaleString()}</b> kg
              </span>
            )}
            {sh.eta && (
              <span>
                {sh.delivered ? "Delivered" : "ETA"} <b>{fmtDate(sh.eta)}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      <HorizontalTimeline
        phases={phases}
        activeIndex={sh.activeIndex}
        currentStatus={sh.status}
        hideMessage
      />

      {updates > 0 && (
        <>
          <button
            type="button"
            className="ot-link"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "Show"} updates ({updates})
            <i
              className={`fas fa-chevron-down ot-chev${open ? " open" : ""}`}
            />
          </button>
          {open && <HistoryList history={sh.history} />}
        </>
      )}
    </div>
  );
}

function ItemCard({ it, phases, i }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(((it.activeIndex + 1) / phases.length) * 100);
  const partial = it.shipments.length > 1;

  return (
    <div
      className={`ot-item${it.delivered ? " delivered" : ""}`}
      style={{ "--i": i, "--pct": `${pct}%` }}
    >
      <div className="ot-item-top">
        <div>
          <div className="ot-item-id">
            Item #{i + 1}
            {it.type ? ` · ${it.type}` : ""}
          </div>
        </div>
        <span
          className={`ot-chip ${it.terminal ? "ot-chip-red" : it.delivered ? "ot-chip-green" : "ot-chip-orange ot-live"}`}
        >
          {it.status}
        </span>
      </div>

      {!it.terminal && !partial && (
        <div className="ot-mini">
          <div className="ot-mini-fill" />
        </div>
      )}

      <div className="ot-item-meta">
        <span>
          <b>{it.qty.toLocaleString()}</b> pkgs
        </span>
        <span>
          <b>{it.weight.toLocaleString()}</b> kg
        </span>
        {!partial && it.eta && (
          <span>
            {it.delivered ? "Delivered" : "ETA"} <b>{fmtDate(it.eta)}</b>
          </span>
        )}
        {partial && (
          <span>
            <b>{it.shipments.length}</b> shipments
          </span>
        )}
      </div>

      {it.terminal ? (
        <TerminalNotice kind={it.terminal} />
      ) : partial ? (
        <div className="ot-ships">
          {it.shipments.map((sh, n) => (
            <ShipmentCard
              key={n}
              sh={sh}
              n={n}
              total={it.shipments.length}
              phases={phases}
            />
          ))}
        </div>
      ) : (
        <>
          <button
            type="button"
            className="ot-link"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "View"} tracking history
            <i
              className={`fas fa-chevron-down ot-chev${open ? " open" : ""}`}
            />
          </button>

          <div className={`ot-collapse${open ? " open" : ""}`}>
            <div className="ot-collapse-inner">
              <HistoryList history={it.history} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
