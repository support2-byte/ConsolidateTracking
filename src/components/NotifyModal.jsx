import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { saveNotification } from "../api/client";
import { showNotification } from "../utils/notify";
import { USER_TIME_ZONE } from "../utils/format";

export default function NotifyModal({ open, onClose, shipment }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      showNotification("Please enter a valid email address.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { data: result } = await saveNotification({
        action: "saveNotification",
        email: trimmed,
        referenceId: shipment.referenceId,
        orderId: shipment.orderId,
        place_of_loading: shipment.pol,
        place_of_delivery: shipment.pod,
        eta: shipment.etaText,
        timestamp: new Date().toISOString(),
        userTimeZone: USER_TIME_ZONE,
      });

      if (!result?.success) {
        throw new Error(
          result?.message || result?.error || "Unknown server error",
        );
      }
      showNotification(
        "Thank you! You will now receive updates on your shipment status.",
        "success",
      );
      setEmail("");
      onClose();
    } catch (err) {
      console.error("Notify error:", err);
      const msg = err.response?.data?.message || err.message;
      showNotification(`Error: ${msg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="rgs-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="rgs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rgsModalTitle"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="rgs-modal-header">
              <h2 className="rgs-modal-title" id="rgsModalTitle">
                Get shipment updates
              </h2>
              <button
                className="rgs-close-btn"
                type="button"
                aria-label="Close"
                onClick={onClose}
              >
                &times;
              </button>
            </div>
            <p className="sub">
              We'll email you each time the status of this shipment changes.
            </p>
            <form onSubmit={handleSubmit}>
              <label className="rgs-form-label" htmlFor="rgsEmail">
                Email address
              </label>
              <input
                ref={inputRef}
                type="email"
                id="rgsEmail"
                className="rgs-form-control"
                placeholder="you@company.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="rgs-modal-actions">
                <button
                  type="button"
                  className="rgs-btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rgs-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span>
                      <span className="rgs-loading"></span>Subscribing...
                    </span>
                  ) : (
                    "Subscribe to updates"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
