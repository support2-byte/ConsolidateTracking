import { useState } from "react";
import config from "../config";
import { fmtDate, fmtTime } from "../utils/format";
import HorizontalTimeline from "./HorizontalTimeline";

export function OrderSummary({ s, onNotify }) {
  return (
    <div className="ot-fade">
      <div className="ot-banner">
        <span className="ot-banner-label">Tracking ID</span>
        <span className="ot-banner-id">{s.trackingId}</span>
      </div>

      {(s.pol || s.pod) && (
        <div className="route">
          <span>POL: {s.pol || "—"}</span>
          <span className="arrow">➜</span>
          <span>POD: {s.pod || "—"}</span>
        </div>
      )}

      <div className="last-updated">Last updated: {s.lastUpdated}</div>

      <div className="order-info">
        <div className="info-block">
          <div className="info-label">Form No</div>
          <div className="info-value">{s.formNo}</div>
        </div>
        <div className="info-block">
          <div className="info-label">Sender</div>
          <div className="info-value">{s.senderName}</div>
        </div>
        <div className="info-block">
          <div className="info-label">Created</div>
          <div className="info-value">{s.createdText}</div>
        </div>
        {s.mode && (
          <div className="info-block">
            <div className="info-label">Mode</div>
            <div className="info-value">{s.mode}</div>
          </div>
        )}
        <div className="info-block">
          <div className="info-label">Delivered</div>
          <div className="info-value">
            {s.deliveredCount}/{s.itemCount} items
          </div>
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
      <h3 className="ot-heading">
        Delivery Destinations ({s.receivers.length})
      </h3>
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
            {r.items.length > 0 && (
              <>
                <p className="ot-sub">
                  Overall progress (based on the least advanced item
                  {r.leastItem ? `: ${r.leastItem.trackingId}` : ""})
                </p>
                <HorizontalTimeline
                  phases={phases}
                  activeIndex={r.activeIndex}
                  currentStatus={r.currentStatus}
                />
              </>
            )}

            <div className="ot-items">
              {r.items.length === 0 && (
                <p className="ot-empty">No items found for this receiver.</p>
              )}
              {r.items.map((it, k) => (
                <ItemCard key={it.id ?? k} it={it} phases={phases} i={k} />
              ))}
            </div>

            {r.dropOffs.length > 0 && (
              <div className="ot-dropoff">
                <strong>Pickup / Drop-off Schedule</strong>
                {r.dropOffs.map((d, k) => (
                  <div key={k}>
                    {d.method}
                    {d.date ? ` • ${fmtDate(d.date)}` : ""}
                  </div>
                ))}
                <div className="ot-dropoff-note">
                  To schedule, call{" "}
                  <strong>{config.SUPPORT_PHONE_DISPLAY}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ItemCard({ it, phases, i }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(((it.activeIndex + 1) / phases.length) * 100);

  return (
    <div
      className={`ot-item${it.delivered ? " delivered" : ""}`}
      style={{ "--i": i, "--pct": `${pct}%` }}
    >
      <div className="ot-item-top">
        <div>
          <div className="ot-item-id">{it.trackingId}</div>
          <div className="ot-item-desc">{it.description || "—"}</div>
        </div>
        <span
          className={`ot-chip ${it.delivered ? "ot-chip-green" : "ot-chip-orange ot-live"}`}
        >
          {it.status}
        </span>
      </div>

      <div className="ot-mini">
        <div className="ot-mini-fill" />
      </div>

      <div className="ot-item-meta">
        <span>
          <b>{it.qty.toLocaleString()}</b> pkgs
        </span>
        <span>
          <b>{it.weight.toLocaleString()}</b> kg
        </span>
        <span>
          ETA <b>{it.eta ? fmtDate(it.eta) : "—"}</b>
        </span>
        <span>
          {it.containers.length
            ? it.containers.map((c) => c.number).join(", ")
            : "Container: Not assigned"}
        </span>
        {it.consignments.length > 0 && (
          <span>
            Consignment:{" "}
            <b>{it.consignments.map((c) => c.number).join(", ")}</b>
          </span>
        )}
      </div>

      <button
        type="button"
        className="ot-link"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide" : "View"} tracking history
        <i className={`fas fa-chevron-down ot-chev${open ? " open" : ""}`} />
      </button>

      <div className={`ot-collapse${open ? " open" : ""}`}>
        <div className="ot-collapse-inner">
          {it.history.length === 0 ? (
            <p className="ot-empty">No tracking updates yet.</p>
          ) : (
            <ol className="ot-hist">
              {it.history.map((h, k) => (
                <li
                  key={k}
                  className={k === 0 ? "current" : ""}
                  style={{ "--i": k }}
                >
                  <span className="ot-hist-dot" />
                  <div>
                    <div className="ot-hist-status">{h.status}</div>
                    <div className="ot-hist-time">
                      {fmtTime(h.time)}
                      {h.container_number && ` • ${h.container_number}`}
                      {h.consignment_number && ` • ${h.consignment_number}`}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
