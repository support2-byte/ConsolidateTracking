import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function useNarrow(query = "(max-width: 720px)") {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
}

const spring = { type: "spring", stiffness: 70, damping: 18, delay: 0.25 };

export default function HorizontalTimeline({
  phases,
  activeIndex,
  currentStatus,
}) {
  const narrow = useNarrow();
  const n = phases.length;
  const pct = Math.min(Math.max(activeIndex, 0) / Math.max(n - 1, 1), 1) * 100;
  const tip = phases[activeIndex]?.tip || "Tracking your shipment...";

  return (
    <>
      <div
        className={`voyage${narrow ? " vertical" : ""}`}
        id="timelineContainer"
        style={{ "--n": n }}
      >
        <div className="voyage-rail">
          <div className="voyage-track" />
          <motion.div
            className="voyage-fill"
            initial={narrow ? { height: 0 } : { width: 0 }}
            animate={narrow ? { height: `${pct}%` } : { width: `${pct}%` }}
            transition={spring}
          />
          {!narrow && (
            <motion.div
              className="voyage-ship"
              initial={{ left: "0%" }}
              animate={{ left: `${pct}%` }}
              transition={spring}
              aria-hidden="true"
            >
              <i className="fas fa-ship" />
            </motion.div>
          )}
        </div>

        <ol className="voyage-steps">
          {phases.map((phase, i) => {
            const cls =
              i < activeIndex ? "done" : i === activeIndex ? "active" : "";
            return (
              <motion.li
                key={phase.label}
                className={cls}
                title={phase.tip}
                aria-current={i === activeIndex ? "step" : undefined}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <span className="voyage-node">
                  {i < activeIndex && <i className="fas fa-check" />}
                </span>
                <span className="voyage-label">{phase.label}</span>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <div id="statusMsg" className="status-message" role="status">
        <span className="live" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStatus}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <strong>{currentStatus}</strong>
            <small>{tip}</small>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
