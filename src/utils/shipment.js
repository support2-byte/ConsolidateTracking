import { fmtDate, fmtTime } from "./format";
import {
  getPhases,
  getCurrentStatus,
  getActiveIndex,
  findPhaseIndex,
  canonLabel,
  terminalKind,
  fillMissing,
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
  const currentStatus =
    canonLabel(phases, getCurrentStatus(order)) || phases[0].label;
  const activeIndex = getActiveIndex(phases, currentStatus);

  const lastIdx = phases.length - 1;
  const rankOf = (status) => Math.max(findPhaseIndex(phases, status), 0);
  const item = (receiver.items || [])[0] || {};
  const shipments = (item.shipments || []).map((sh) => {
    const i = rankOf(sh.status);
    return {
      qty: Number(sh.qty) || 0,
      weight: Number(sh.weight) || 0,
      container: sh.container || null,
      status: phases[i]?.label || sh.status || phases[0].label,
      activeIndex: i,
      delivered: i === lastIdx,
      eta: sh.eta || null,
      history: fillMissing(
        phases,
        (sh.history || [])
          .filter((h) => h.status)
          .map((h) => ({ ...h, status: canonLabel(phases, h.status) }))
          .sort((a, b) => new Date(a.time) - new Date(b.time)),
      ),
    };
  });
  const partialEta = shipments
    .filter((sh) => !sh.delivered && sh.eta)
    .map((sh) => sh.eta)
    .sort((a, b) => new Date(a) - new Date(b))[0];

  const eta = partialEta || receiver.eta || order.eta;
  const latest = [...(receiver.status_history || [])].sort(
    (a, b) => new Date(b.time) - new Date(a.time),
  )[0];

  const allDelivered = shipments.length
    ? shipments.every((sh) => sh.delivered)
    : activeIndex === lastIdx;

  const itemType = [
    ...new Set(
      receivers
        .flatMap((r) => (r.items || []).map((i) => i.type))
        .filter(Boolean),
    ),
  ].join(", ");

  return {
    order,
    receiver: {
      ...receiver,
      status_history: fillMissing(
        phases,
        (receiver.status_history || [])
          .filter((h) => h.status)
          .map((h) => ({
            ...h,
            status: canonLabel(phases, h.status),
          })),
      ),
    },
    phases,
    currentStatus,
    activeIndex,
    terminal:
      terminalKind(currentStatus) ||
      terminalKind(order.status) ||
      (receiver.items || []).map((i) => terminalKind(i.status)).find(Boolean) ||
      null,
    shipments,
    pol: order.place_of_loading ?? "—",
    pod: order.place_of_delivery ?? "—",
    referenceId: receiver.items?.[0]?.tracking_id || "—",
    orderId: order.rgl_booking_number || "—",
    etaText: eta ? fmtDate(eta) : "—",
    delivered: allDelivered,
    qty: totalQty > 0 ? totalQty : "—",
    itemType,
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
      const aQty = Number(it.assignedQty ?? it.totalNumber) || 0;
      const aWeight = Number(it.assignedWeight ?? it.weight) || 0;
      const history = fillMissing(
        phases,
        (it.status_history || [])
          .filter((h) => h.status)
          .map((h) => ({ ...h, status: canonLabel(phases, h.status) }))
          .sort((a, b) => new Date(a.time) - new Date(b.time)),
      );
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
      const shipments = (it.shipments || []).map((s) => {
        const i = rankOf(s.status);
        return {
          qty: Number(s.qty) || 0,
          weight: Number(s.weight) || 0,
          status: phases[i]?.label || s.status,
          activeIndex: i,
          delivered: i === lastIdx,
          eta: s.eta || null,
          history: fillMissing(
            phases,
            (s.history || [])
              .filter((h) => h.status)
              .map((h) => ({ ...h, status: canonLabel(phases, h.status) }))
              .sort((a, b) => new Date(a.time) - new Date(b.time)),
          ),
        };
      });
      const idx = shipments.length
        ? Math.min(...shipments.map((s) => s.activeIndex))
        : rankOf(it.status);
      const lastWithTime = [...history].reverse().find((h) => h.time);
      const t = new Date(it.lastUpdated || lastWithTime?.time || 0).getTime();
      if (t > latestTime) latestTime = t;

      const eta =
        shipments
          .filter((s) => !s.delivered && s.eta)
          .map((s) => s.eta)
          .sort((a, b) => new Date(a) - new Date(b))[0] ||
        it.eta ||
        null;
      const delivered = shipments.length
        ? shipments.every((s) => s.delivered)
        : idx === lastIdx;
      if (eta) {
        const ms = new Date(eta).getTime();
        if (!isNaN(ms) && (etaMs === null || ms < etaMs)) etaMs = ms;
      }

      totalQty += aQty;
      totalWeight += aWeight;
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
        qty: aQty,
        weight: aWeight,
        status: shipments.length
          ? phases[idx]?.label || phases[0].label
          : canonLabel(phases, it.status) || phases[0].label,
        shipments,
        activeIndex: idx,
        terminal: orderTerminal || terminalKind(it.status),
        delivered,
        eta,
        type: it.type || "",
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
      partial: items.some((it) => it.shipments.length > 1),
      activeIndex,
      currentStatus: phases[activeIndex]?.label || "",
      deliveredCount: items.filter((i) => i.delivered).length,
      dropOffs: (r.dropOffDetails || []).map((d) => ({
        method: d.drop_method || "—",
        date: d.drop_date || null,
      })),
    };
  });

  const allItems = receivers.flatMap((r) => r.items);
  const leastAll = allItems.reduce(
    (min, it) =>
      it.terminal ? min : !min || it.activeIndex < min.activeIndex ? it : min,
    null,
  );
  const activeIndex = leastAll ? leastAll.activeIndex : 0;
  const currentStatus = phases[activeIndex]?.label || "";
  const terminal =
    orderTerminal ||
    (allItems.length && allItems.every((i) => i.terminal)
      ? allItems[0].terminal
      : null);

  const etaIso = etaMs ? new Date(etaMs).toISOString() : null;
  const itemType = [
    ...new Set(allItems.map((i) => i.type).filter(Boolean)),
  ].join(", ");

  return {
    order,
    phases,
    activeIndex,
    currentStatus,
    terminal,
    partial: allItems.some((it) => it.shipments.length > 1),
    delivered: itemCount > 0 && deliveredCount === itemCount,
    receiver: { status_history: leastAll ? leastAll.history : [] },
    receivers,
    trackingId: order.tracking_id || "—",
    formNo: order.rgl_booking_number || order.booking_ref || "—",
    senderName: order.sender_name || "—",
    mode: order.transport_type || "",
    createdText: order.created_at ? fmtDate(order.created_at) : "—",
    pol: order.place_of_loading ?? "—",
    pod: order.place_of_delivery ?? "—",
    itemCount,
    deliveredCount,
    qty: totalQty > 0 ? totalQty : "—",
    itemType,
    weight: totalWeight > 0 ? `${totalWeight} kg` : "—",
    etaText: etaIso ? fmtDate(etaIso) : "—",
    allDelivered: itemCount > 0 && deliveredCount === itemCount,
    lastUpdated: fmtTime(latestTime ? new Date(latestTime) : new Date()),
    referenceId: order.tracking_id || "—",
    orderId: order.rgl_booking_number || order.booking_ref || "—",
    sheetPart: order.lookup?.sheetPart || null,
  };
}
