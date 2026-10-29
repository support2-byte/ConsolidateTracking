import { fmtDate, fmtTime } from "./format";
import {
  getPhases,
  getCurrentStatus,
  getActiveIndex,
  findPhaseIndex,
  terminalKind,
} from "./status";

export function buildShipmentView(raw) {
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
    terminal:
      terminalKind(currentStatus) ||
      terminalKind(order.status) ||
      (receiver.items || []).map((i) => terminalKind(i.status)).find(Boolean) ||
      null,
    pol: order.place_of_loading ?? "—",
    pod: order.place_of_delivery ?? "—",
    referenceId: receiver.items?.[0]?.tracking_id || "—",
    orderId: order.rgl_booking_number || "—",
    etaText: eta ? fmtDate(eta) : "—",
    qty: totalQty > 0 ? totalQty : "—",
    weight: totalWeight > 0 ? `${totalWeight} kg` : "—",
    lastUpdated: fmtTime(latest?.time || new Date()),
  };
}

export function buildOrderView(raw) {
  const order = Array.isArray(raw) ? raw[0] : raw;
  if (!order) return null;

  const phases = getPhases(order);
  const orderTerminal = terminalKind(order.status);
  const lastIdx = phases.length - 1;
  const rankOf = (status) => Math.max(findPhaseIndex(phases, status), 0);

  let totalQty = 0;
  let totalWeight = 0;
  let itemCount = 0;
  let deliveredCount = 0;
  let latestTime = 0;
  let etaMs = null;

  const receivers = (order.receivers || []).map((r) => {
    const items = (r.shippingDetails || []).map((it) => {
      const history = (it.status_history || [])
        .filter((h) => h.status)
        .sort((a, b) => new Date(a.time) - new Date(b.time));
      const containers = (it.containerDetails || [])
        .filter(
          (c) =>
            c.container?.container_number &&
            c.container.container_number !== "Unknown",
        )
        .map((c) => ({
          number: c.container.container_number,
          boxes: Number(c.assign_total_box) || 0,
        }));
      const idx = rankOf(it.status);
      const t = new Date(
        it.lastUpdated || history[history.length - 1]?.time || 0,
      ).getTime();
      if (t > latestTime) latestTime = t;

      const eta = it.eta || null;
      const delivered = idx === lastIdx;
      if (eta && !delivered) {
        const ms = new Date(eta).getTime();
        if (!isNaN(ms) && (etaMs === null || ms < etaMs)) etaMs = ms;
      }

      totalQty += Number(it.totalNumber) || 0;
      totalWeight += Number(it.weight) || 0;
      itemCount += 1;
      if (delivered) deliveredCount += 1;

      return {
        id: it.id,
        trackingId: it.trackingId || "—",
        description: [
          it.category,
          it.subcategory && `• ${it.subcategory}`,
          it.type && `(${it.type})`,
        ]
          .filter(Boolean)
          .join(" "),
        qty: Number(it.totalNumber) || 0,
        weight: Number(it.weight) || 0,
        status: it.status || phases[0].label,
        activeIndex: idx,
        terminal: orderTerminal || terminalKind(it.status),
        delivered,
        eta,
        containers,
        consignments: it.consignments || [],
        history,
      };
    });

    const least = items.reduce(
      (min, it) =>
        it.terminal ? min : !min || it.activeIndex < min.activeIndex ? it : min,
      null,
    );
    const activeIndex = least ? least.activeIndex : 0;

    return {
      id: r.id,
      name: r.receiverName || "—",
      address: r.receiverAddress || "",
      items,
      leastItem: least,
      activeIndex,
      currentStatus: phases[activeIndex]?.label || "",
      deliveredCount: items.filter((i) => i.delivered).length,
      dropOffs: (r.dropOffDetails || []).map((d) => ({
        method: d.drop_method || "—",
        date: d.drop_date || null,
      })),
    };
  });

  const etaIso = etaMs ? new Date(etaMs).toISOString() : null;

  return {
    order,
    phases,
    receivers,
    trackingId: order.tracking_id || "—",
    formNo: order.rgl_booking_number || order.booking_ref || "—",
    senderName: order.sender_name || "—",
    mode: order.transport_type || "",
    createdText: order.created_at ? fmtDate(order.created_at) : "—",
    pol: order.place_of_loading || "",
    pod: order.place_of_delivery || "",
    itemCount,
    deliveredCount,
    qty: totalQty > 0 ? totalQty : "—",
    weight: totalWeight > 0 ? `${totalWeight} kg` : "—",
    etaText: etaIso ? fmtDate(etaIso) : "—",
    lastUpdated: fmtTime(latestTime ? new Date(latestTime) : new Date()),
    referenceId: order.tracking_id || "—",
    orderId: order.rgl_booking_number || order.booking_ref || "—",
  };
}
