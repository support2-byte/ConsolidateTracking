import config from "../config";

export default function TerminalNotice({ kind }) {
  const cancelled = kind === "cancelled";
  return (
    <div className={`ot-terminal ${kind}`}>
      <div className="ot-terminal-icon">
        <i className={`fas ${cancelled ? "fa-ban" : "fa-times-circle"}`} />
      </div>
      <div className="ot-terminal-title">
        {cancelled ? "Order Cancelled" : "Order Rejected"}
      </div>
      <p className="ot-terminal-text">
        {cancelled
          ? "This order has been cancelled and will not be processed further."
          : "Unfortunately, this order could not be accepted."}
      </p>
      <p className="ot-terminal-text">
        For more details, please call us at{" "}
        <strong>{config.SUPPORT_PHONE_DISPLAY}</strong>
      </p>
    </div>
  );
}
