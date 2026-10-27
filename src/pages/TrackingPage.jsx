import { useCallback, useEffect, useState } from "react";
import { trackItem } from "../api/client";
import { getTimezoneLabel } from "../utils/format";
import { buildShipmentView } from "../utils/shipment";
import HorizontalTimeline from "../components/HorizontalTimeline";
import StatusHistory from "../components/StatusHistory";
import NotifyModal from "../components/NotifyModal";

function errorMessageFor(err) {
  const status = err.response?.status;
  if (status === 404) return "No shipment found with this reference ID";
  if (status >= 500) return "Server error — please try again later";
  if (err.response) {
    return err.response.data?.message || `Request failed: ${status}`;
  }
  if (err.code === "ECONNABORTED") return "The request timed out. Please try again.";
  return "Network error — check your internet or try again later";
}

export default function TrackingPage({ verified }) {
  const [refInput, setRefInput] = useState(
    () => new URLSearchParams(window.location.search).get("ref")?.trim() || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shipment, setShipment] = useState(null);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const track = useCallback(async (value) => {
    const ref = value.trim();
    if (!ref) {
      setError("Please enter a reference ID");
      return;
    }

    setError("");
    setShipment(null);
    setLoading(true);

    try {
      const { data } = await trackItem(ref);
      if (!data?.success) {
        throw Object.assign(new Error(), {
          response: { status: 404, data },
        });
      }
      const view = buildShipmentView(data.data);
      if (!view) throw new Error("Empty response");
      setShipment({ ...view, inputRef: ref });
    } catch (err) {
      console.error("Track shipment error:", err);
      setError(errorMessageFor(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-track when the page is opened with ?ref=... (after reCAPTCHA passes)
  useEffect(() => {
    if (verified && refInput) track(refInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  // Error banner disappears after 5s, like the original page
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    track(refInput);
  };

  const s = shipment;

  return (
    <main className="container1">
      <section className="summary">
        <h2>Track Your Shipment</h2>

        <form className="search-box" id="searchBox" onSubmit={handleSubmit}>
          <input
            id="refInput"
            type="text"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="Enter Reference ID (e.g. ORDER-ITEM-REF-1-1-1096xxxxx)"
          />{" "}
          <button id="searchBtn" type="submit" className="search-btn" disabled={loading}>
            {loading ? "Loading..." : "Track"}
          </button>
        </form>

        {error && <div className="error-message" style={{ display: "block" }}>{error}</div>}

        {s && (
          <>
            <div className="route" id="route">
              <span id="pol">POL: {s.pol}</span>
              <span className="arrow">➜</span>
              <span id="pod">POD: {s.pod}</span>
            </div>

            <div className="last-updated" id="lastUpdated">
              Last updated: {s.lastUpdated}
            </div>

            <div className="order-info" id="orderInfo">
              <div className="info-block ref-block">
                <div className="info-label">REF ID</div>
                <div className="info-value" id="refId">{s.referenceId}</div>
              </div>
              <div className="info-block">
                <div className="info-label">Order ID</div>
                <div className="info-value">{s.orderId}</div>
              </div>
              <div className="info-block">
                <div className="info-label">Quantity</div>
                <div className="info-value">{s.qty}</div>
              </div>
              <div className="info-block">
                <div className="info-label">Weight</div>
                <div className="info-value">{s.weight}</div>
              </div>
              <div className="info-block">
                <div className="info-label">Eta</div>
                <div className="info-value">{s.etaText}</div>
              </div>
            </div>

            <div className="timezone-note-wrap">
              <span className="timezone-note">
                <i className="fas fa-clock"></i> All dates and times are shown in
                your local timezone: {getTimezoneLabel()}
              </span>
            </div>

            <HorizontalTimeline
              phases={s.phases}
              activeIndex={s.activeIndex}
              currentStatus={s.currentStatus}
            />

            <div className="actions" id="actions">
              <button
                className="btn"
                type="button"
                title="Get email alerts when status changes"
                onClick={() => setNotifyOpen(true)}
              >
                Notify Me
              </button>
            </div>
          </>
        )}
      </section>

      {s && <StatusHistory receiver={s.receiver} />}

      {s && (
        <NotifyModal
          open={notifyOpen}
          onClose={() => setNotifyOpen(false)}
          shipment={s}
        />
      )}
    </main>
  );
}
