import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import config from "../config";
import { trackShipment } from "../api/client";
import { getTimezoneLabel } from "../utils/format";
import { buildShipmentView, buildOrderView } from "../utils/shipment";
import HorizontalTimeline from "../components/HorizontalTimeline";
import StatusHistory from "../components/StatusHistory";
import NotifyModal from "../components/NotifyModal";
import TerminalNotice from "../components/TerminalNotice";
import {
  OrderSummary,
  OrderReceivers,
  Route,
  Facts,
  CopyButton,
} from "../components/OrderTracking";

const ease = [0.22, 1, 0.36, 1];
const RECENT_KEY = "rgsl:recent-tracking";

const readRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
};
const saveRecent = (ref) => {
  try {
    const next = [ref, ...readRecent().filter((r) => r !== ref)].slice(0, 3);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
};

function errorMessageFor(err) {
  const status = err.response?.status;
  if (status === 404)
    return "Tracking not found. Check your tracking ID and try again.";
  if (status >= 500) return "Server error. Please try again later.";
  if (err.response) {
    return err.response.data?.message || `Request failed: ${status}`;
  }
  if (err.code === "ECONNABORTED")
    return "The request timed out. Please try again.";
  return "Network error. Check your internet connection and try again.";
}

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease, delay },
});

function Hero({ refInput, setRefInput, onSubmit, loading, recent, onPick }) {
  return (
    <section className="hero">
      <div className="hero-dots" />
      <motion.div
        className="hero-wedge"
        initial={{ x: "30%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, ease }}
      />
      <motion.div
        className="hero-art"
        style={{ backgroundImage: 'url("/banner.png")' }}
        initial={{ x: "20%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.1, ease, delay: 0.12 }}
      />
      <svg
        className="hero-route"
        viewBox="0 0 600 200"
        fill="none"
        aria-hidden="true"
      >
        <motion.path
          d="M10 170 C 120 40, 240 190, 340 90 S 520 20, 590 60"
          stroke="#ff5e14"
          strokeWidth="2"
          strokeDasharray="2 9"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, ease: "easeInOut", delay: 0.4 }}
        />
        <motion.circle
          cx="10"
          cy="170"
          r="5"
          fill="#ff5e14"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
        />
        <motion.circle
          cx="590"
          cy="60"
          r="5"
          fill="#fff"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2.6 }}
        />
      </svg>

      <div className="hero-in">
        <div className="hero-copy">
          <motion.h1 {...rise(0.1)}>
            Where is your shipment right now?
          </motion.h1>
          <motion.p className="lede" {...rise(0.22)}>
            Enter the tracking ID from your booking confirmation to see live
            status, route and delivery estimate.
          </motion.p>

          <motion.form
            className="search"
            id="searchBox"
            onSubmit={onSubmit}
            {...rise(0.34)}
          >
            <i className="fas fa-search" aria-hidden="true" />
            <input
              id="refInput"
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="e.g. RGSL-ORD-XXXXXX"
              aria-label="Tracking ID"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <motion.button
              id="searchBtn"
              type="submit"
              className="search-btn"
              disabled={loading}
              whileTap={{ scale: 0.96 }}
            >
              <i
                className={
                  loading
                    ? "fas fa-circle-notch fa-spin"
                    : "fas fa-location-arrow"
                }
              />
              <span>{loading ? "Searching" : "Track"}</span>
            </motion.button>
          </motion.form>

          {recent.length > 0 && (
            <motion.div className="recent" {...rise(0.46)}>
              Recent:
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => onPick(r)}>
                  {r}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <motion.div
      className="summary skeleton"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      aria-busy="true"
      aria-label="Searching shipment"
    >
      <span className="w1" />
      <span className="w3" />
      <span className="w2" />
      <span className="w3" />
    </motion.div>
  );
}

function ItemTracking({ s, onNotify }) {
  return (
    <>
      <div className="summary-head">
        <div className="ot-banner">
          <span className="ot-banner-label">Reference ID</span>
          <span className="ot-banner-id" id="refId">
            {s.referenceId} <CopyButton text={s.referenceId} />
          </span>
        </div>
        <div className="last-updated" id="lastUpdated">
          Last updated {s.lastUpdated}
        </div>
      </div>

      <Route pol={s.pol} pod={s.pod} />

      <Facts
        items={[
          { label: "Order ID", value: s.orderId },
          { label: "Quantity", value: s.qty },
          { label: "Weight", value: s.weight },
          { label: "ETA", value: s.etaText },
        ]}
      />

      {s.terminal ? (
        <TerminalNotice kind={s.terminal} />
      ) : (
        <>
          <HorizontalTimeline
            phases={s.phases}
            activeIndex={s.activeIndex}
            currentStatus={s.currentStatus}
          />
          <div className="actions" id="actions">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="btn"
              type="button"
              title="Get email alerts when status changes"
              onClick={onNotify}
            >
              <i className="far fa-bell" /> Notify me
            </motion.button>
          </div>
        </>
      )}
    </>
  );
}

export default function TrackingPage({ verified }) {
  const [refInput, setRefInput] = useState(
    () => new URLSearchParams(window.location.search).get("ref")?.trim() || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shipment, setShipment] = useState(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const resultsRef = useRef(null);

  const track = useCallback(async (value) => {
    const ref = value.trim();
    if (!ref) {
      setError("Please enter a tracking ID");
      return;
    }

    setError("");
    setShipment(null);
    setLoading(true);

    try {
      const { kind, data } = await trackShipment(ref);
      const view =
        kind === "order" ? buildOrderView(data) : buildShipmentView(data);
      if (!view) throw new Error("Empty response");
      setShipment({ ...view, kind, inputRef: ref });
      setRecent(saveRecent(ref));
      window.history.replaceState(null, "", `?ref=${encodeURIComponent(ref)}`);
      setTimeout(
        () =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        150,
      );
    } catch (err) {
      console.error("Track shipment error:", err);
      setError(errorMessageFor(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (verified && refInput) track(refInput);
  }, [verified]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    track(refInput);
  };

  const pick = (r) => {
    setRefInput(r);
    track(r);
  };

  const s = shipment;
  const isOrder = s?.kind === "order";
  const isItem = s?.kind === "item";

  return (
    <MotionConfig reducedMotion="user">
      <Hero
        refInput={refInput}
        setRefInput={setRefInput}
        onSubmit={handleSubmit}
        loading={loading}
        recent={recent}
        onPick={pick}
      />

      <main className="container1" ref={resultsRef}>
        <AnimatePresence mode="wait">
          {loading && <Skeleton key="skeleton" />}

          {!loading && !s && (
            <motion.div
              key="help"
              className="empty-help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.5 }}
            >
              <i className="fas fa-file-invoice" aria-hidden="true" />
              <p>
                <b>Can't find your tracking ID?</b> It's in your booking
                confirmation email. You can also call us on{" "}
                <a
                  href={`tel:${config.SUPPORT_PHONE_DISPLAY.replace(/[^\d+]/g, "")}`}
                >
                  <b>{config.SUPPORT_PHONE_DISPLAY}</b>
                </a>
                .
              </p>
            </motion.div>
          )}

          {!loading && s && (
            <motion.section
              key={s.inputRef}
              className="summary"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease }}
            >
              {isOrder && (
                <OrderSummary s={s} onNotify={() => setNotifyOpen(true)} />
              )}
              {isItem && (
                <ItemTracking s={s} onNotify={() => setNotifyOpen(true)} />
              )}

              <div className="timezone-note-wrap">
                <span className="timezone-note">
                  <i className="fas fa-clock"></i> Times are shown in your local
                  timezone: {getTimezoneLabel()}
                </span>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              className="error-message"
              role="alert"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <i className="fas fa-exclamation-circle" />
              {error}
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setError("")}
              >
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isOrder && <OrderReceivers s={s} />}
        {isItem && !s.terminal && <StatusHistory receiver={s.receiver} />}
      </main>

      {s && (
        <NotifyModal
          open={notifyOpen}
          onClose={() => setNotifyOpen(false)}
          shipment={s}
        />
      )}
    </MotionConfig>
  );
}
