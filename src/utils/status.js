import { RGS_PHASES } from "../constants/phases";

export const normStatus = (s) =>
  (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

const STATUS_ALIASES = {
  created: "order created",
  loaded: "loaded into container",
};

export const canon = (s) => STATUS_ALIASES[normStatus(s)] || normStatus(s);

export const terminalKind = (s) => {
  const n = normStatus(s);
  if (n === "cancelled" || n === "canceled") return "cancelled";
  if (n === "rejected") return "rejected";
  return null;
};

export const findPhaseIndex = (phases, status) =>
  phases.findIndex((p) => canon(p.label) === canon(status));

function phaseInfoFor(label) {
  return RGS_PHASES.find((p) => canon(p.label) === canon(label)) || {};
}

export function getPhases(order) {
  const seq = Array.isArray(order?.status_sequence)
    ? order.status_sequence
    : [];
  if (!seq.length) return RGS_PHASES;
  return seq
    .filter((label) => !terminalKind(label))
    .map((label) => {
      const info = phaseInfoFor(label);
      return { label, tip: info.tip || "", msg: info.msg || "" };
    });
}

export function getCurrentStatus(order) {
  const r = order?.receivers?.[0] || {};
  return (r.current_status || r.status || order?.status || "").trim();
}

export function getActiveIndex(phases, status) {
  const idx = phases.findIndex((p) => canon(p.label) === canon(status));
  if (idx === -1) {
    console.warn("Status not found in phases:", status);
    return 0;
  }
  return idx;
}
