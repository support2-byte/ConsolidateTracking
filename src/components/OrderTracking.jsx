import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import config from "../config";
import { fmtDate, fmtTime } from "../utils/format";
import HorizontalTimeline from "./HorizontalTimeline";
import TerminalNotice from "./TerminalNotice";

const ease = [0.22, 1, 0.36, 1];

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={copy}
      aria-label="Copy tracking ID"
    >
      <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />{" "}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function Route({ pol, pod }) {
  if (!pol && !pod) return null;
  return (
    <div className="route">
      <div className="route-end">
        <small>Loading port</small>
        <b>{pol || "—"}</b>
      </div>
      <motion.div
        className="route-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, ease, delay: 0.15 }}
      >
        <i className="fas fa-ship" />
      </motion.div>
      <div className="route-end right">
        <small>Delivery port</small>
        <b>{pod || "—"}</b>
      </div>
    </div>
  );
}

export function Facts({ items }) {
  return (
    <div className="facts">
      {items
        .filter(
          (f) => f.value !== undefined && f.value !== null && f.value !== "",
        )
        .map((f, i) => (
          <motion.div
            key={f.label}
            className="fact"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
          >
            <div className="info-label">{f.label}</div>
            <div className="info-value">{f.value}</div>
          </motion.div>
        ))}
    </div>
  );
}

export function OrderSummary({ s, onNotify }) {
  return (
    <div>
      <div className="summary-head">
        <div className="ot-banner">
          <span className="ot-banner-label">Tracking ID</span>
          <span className="ot-banner-id">
            {s.trackingId} <CopyButton text={s.trackingId} />
          </span>
        </div>
        <div className="last-updated">Last updated {s.lastUpdated}</div>
      </div>

      <Route pol={s.pol} pod={s.pod} />

      <Facts
        items={[
          { label: "Form no", value: s.formNo },
          { label: "Sender", value: s.senderName },
          { label: "Created", value: s.createdText },
          { label: "Mode", value: s.mode },
          {
            label: "Delivered",
            value: `${s.deliveredCount} of ${s.itemCount} items`,
          },
        ]}
      />

      <div className="actions">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn"
          type="button"
          onClick={onNotify}
        >
          <i className="far fa-bell" /> Notify me
        </motion.button>
      </div>
    </div>
  );
}

export function OrderReceivers({ s }) {
  return (
    <section className="ot-receivers">
      <h3 className="ot-heading">
        Delivery destinations ({s.receivers.length})
      </h3>
      {s.receivers.map((r, i) => (
        <ReceiverCard
          key={r.id ?? i}
          r={r}
          phases={s.phases}
          defaultOpen={i === 0}
        />
      ))}
    </section>
  );
}

function Ring({ done, total }) {
  return (
    <svg className="ring" viewBox="0 0 48 48" aria-hidden="true">
      <circle className="bg" cx="24" cy="24" r="19" />
      <motion.circle
        className="fg"
        cx="24"
        cy="24"
        r="19"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: total ? done / total : 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease, delay: 0.2 }}
      />
    </svg>
  );
}

const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.35, ease },
  style: { overflow: "hidden" },
};

function ReceiverCard({ r, phases, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.article
      className="ot-card"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease }}
    >
      <button
        type="button"
        className="ot-card-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Ring done={r.deliveredCount} total={r.items.length} />
        <div className="ot-card-title">
          <h4>{r.name}</h4>
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
                Now: {r.currentStatus}
              </span>
            )}
          </div>
        </div>
        <i className={`fas fa-chevron-down ot-chev${open ? " open" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div {...reveal}>
            <div className="ot-body">
              {r.leastItem && (
                <>
                  <p className="ot-sub">
                    Overall progress, based on the least advanced item (
                    {r.leastItem.trackingId})
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
                  <strong>Pickup / drop-off schedule</strong>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function ItemCard({ it, phases, i }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(((it.activeIndex + 1) / phases.length) * 100);

  return (
    <motion.div
      className={`ot-item${it.delivered ? " delivered" : ""}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay: i * 0.07 }}
    >
      <div className="ot-item-top">
        <div>
          <div className="ot-item-id">{it.trackingId}</div>
          <div className="ot-item-desc">{it.description || "—"}</div>
        </div>
        <span
          className={`ot-chip ${it.terminal ? "ot-chip-red" : it.delivered ? "ot-chip-green" : "ot-chip-orange ot-live"}`}
        >
          {it.status}
        </span>
      </div>

      {!it.terminal && (
        <div className="ot-mini">
          <motion.div
            className="ot-mini-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease, delay: 0.2 + i * 0.07 }}
          />
        </div>
      )}

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
      </div>

      {it.terminal ? (
        <TerminalNotice kind={it.terminal} />
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

          <AnimatePresence initial={false}>
            {open && (
              <motion.div {...reveal}>
                {it.history.length === 0 ? (
                  <p className="ot-empty">No tracking updates yet.</p>
                ) : (
                  <ol className="ot-hist">
                    {it.history.map((h, k) => (
                      <motion.li
                        key={k}
                        className={k === it.history.length - 1 ? "current" : ""}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: k * 0.05 }}
                      >
                        <span className="ot-hist-dot" />
                        <div>
                          <div className="ot-hist-status">{h.status}</div>
                          <div className="ot-hist-time">{fmtTime(h.time)}</div>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
