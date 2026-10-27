import { useState } from "react";
import { saveNotification } from "../api/client";
import { showNotification } from "../utils/notify";
import { USER_TIME_ZONE } from "../utils/format";

export default function NotifyModal({ open, onClose, shipment }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        throw new Error(result?.message || result?.error || "Unknown server error");
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
    <div
      className={`rgs-modal-overlay${open ? " active" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rgs-modal">
        <div className="rgs-modal-header">
          <h2 className="rgs-modal-title">Get Shipment Updates</h2>
          <button className="rgs-close-btn" type="button" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="rgs-form-group">
            <label className="rgs-form-label" htmlFor="rgsEmail">Email Address</label>
            <input
              type="email"
              id="rgsEmail"
              className="rgs-form-control"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="rgs-modal-actions">
            <button type="button" className="rgs-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rgs-btn-primary" disabled={submitting}>
              {submitting ? (
                <span>
                  <span className="rgs-loading"></span>
                  Submitting...
                </span>
              ) : (
                "Subscribe to Updates"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
