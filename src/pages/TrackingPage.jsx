import { useCallback, useEffect, useState } from "react";
import { trackShipment } from "../api/client";
import { getTimezoneLabel } from "../utils/format";
import { buildShipmentView, buildOrderView } from "../utils/shipment";
import HorizontalTimeline from "../components/HorizontalTimeline";
import StatusHistory from "../components/StatusHistory";
import NotifyModal from "../components/NotifyModal";
import { OrderSummary, OrderReceivers } from "../components/OrderTracking";
import TerminalNotice from "../components/TerminalNotice";

function errorMessageFor(err) {
  const status = err.response?.status;
  if (status === 404)
    return "Tracking Not Found — please check your tracking ID";
  if (status >= 500) return "Server error — please try again later";
  if (err.response) {
    return err.response.data?.message || `Request failed: ${status}`;
  }
  if (err.code === "ECONNABORTED")
    return "The request timed out. Please try again.";
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
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    track(refInput);
  };

  const s = shipment;

  const isOrder = s?.kind === "order";
  const isItem = s?.kind === "item";

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
            placeholder="Enter Tracking ID (e.g. RGSL-ORD-XXXXXX)"
          />{" "}
          <button
            id="searchBtn"
            type="submit"
            className="search-btn"
            disabled={loading}
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {loading && (
          <div className="ot-searching">
            <span className="ot-ship-loader">
              <i className="fas fa-ship"></i>
            </span>
            Searching shipment...
          </div>
        )}

        {error && (
          <div className="error-message" style={{ display: "block" }}>
            {error}
          </div>
        )}

        {isOrder && <OrderSummary s={s} onNotify={() => setNotifyOpen(true)} />}

        {isItem && (
          <div className="ot-fade">
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
                <div className="info-value" id="refId">
                  {s.referenceId}
                </div>
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
                <i className="fas fa-clock"></i> All dates and times are shown
                in your local timezone: {getTimezoneLabel()}
              </span>
            </div>

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
          </div>
        )}

        {isOrder && (
          <div className="timezone-note-wrap">
            <span className="timezone-note">
              <i className="fas fa-clock"></i> All dates and times are shown in
              your local timezone: {getTimezoneLabel()}
            </span>
          </div>
        )}
      </section>

      {isOrder && <OrderReceivers s={s} />}
      {isItem && !s.terminal && <StatusHistory receiver={s.receiver} />}

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
