import config from "../config";

export default function ExpectedArrival({ statusLabel, etaText }) {
  const date = etaText && etaText !== "—" ? etaText : "To be confirmed";

  return (
    <div style={{ textAlign: "center", marginTop: 18 }}>
      <span className="eta">
        {statusLabel === "Shipment Delivered"
          ? "Shipment Delivered"
          : statusLabel === "Ready for Delivery"
            ? `Ready for Delivery: ${date}`
            : `Expected Arrival: ${date}`}
      </span>
      <p
        style={{
          marginTop: 10,
          fontSize: 13,
          color: "var(--rg-subtext)",
          fontFamily: "'Inter', Arial, sans-serif",
        }}
      >
        Are you looking to schedule your delivery? <br />
        Please call us at{" "}
        <strong style={{ color: "var(--rg-orange)" }}>
          {config.SUPPORT_PHONE_DISPLAY}
        </strong>{" "}
        and book your delivery with best competitive prices.
      </p>
    </div>
  );
}
