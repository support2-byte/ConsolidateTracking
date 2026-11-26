import config from "../config";

export default function ExpectedArrival({ statusLabel, etaText }) {
  if (!statusLabel && (!etaText || etaText === "—")) return null;

  return (
    <div style={{ textAlign: "center", marginTop: 18 }}>
      <span className="eta">Expected Arrival: {statusLabel || etaText}</span>
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
