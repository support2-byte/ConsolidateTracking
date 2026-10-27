import { fmtDate, fmtTime } from "./format";
import { getPhases, getCurrentStatus, getActiveIndex } from "./status";

// Turns the raw API order into everything the page needs to render.
export function buildShipmentView(raw) {
  // The backend returns an array when the ILIKE pattern matches several orders
  const order = Array.isArray(raw) ? raw[0] : raw;
  if (!order) return null;

  const receivers = order.receivers || [];
  const receiver = receivers[0] || {};

  let totalWeight = 0;
  let totalQty = 0;
  receivers.forEach((r) =>
    (r.items || []).forEach((item) => {
      totalWeight += item.weight || 0;
      totalQty += item.total_number || 0;
    }),
  );

  const phases = getPhases(order);
  const currentStatus = getCurrentStatus(order) || phases[0].label;
  const activeIndex = getActiveIndex(phases, currentStatus);

  const eta = receiver.eta || order.eta;
  const latest = [...(receiver.status_history || [])].sort(
    (a, b) => new Date(b.time) - new Date(a.time),
  )[0];

  return {
    order,
    receiver,
    phases,
    currentStatus,
    activeIndex,
    pol: order.place_of_loading ?? "—",
    pod: order.place_of_delivery ?? "—",
    referenceId: receiver.items?.[0]?.item_ref || order.booking_ref || "—",
    orderId: order.rgl_booking_number || "—",
    etaText: eta ? fmtDate(eta) : "—",
    qty: totalQty > 0 ? totalQty : "—",
    weight: totalWeight > 0 ? `${totalWeight} kg` : "—",
    lastUpdated: fmtTime(latest?.time || new Date()),
  };
}
