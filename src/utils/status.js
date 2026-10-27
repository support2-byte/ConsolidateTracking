import { RGS_PHASES } from "../constants/phases";

export const normStatus = (s) =>
  (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");

// DB name -> RGS_PHASES name (used for tips/messages and matching only)
const STATUS_ALIASES = {
  created: "order created",
  loaded: "loaded into container",
};

const canon = (s) => STATUS_ALIASES[normStatus(s)] || normStatus(s);

function phaseInfoFor(label) {
  return RGS_PHASES.find((p) => canon(p.label) === canon(label)) || {};
}

// DB sequence from the API when present, hardcoded list otherwise.
export function getPhases(order) {
  const seq = Array.isArray(order?.status_sequence) ? order.status_sequence : [];
  if (!seq.length) return RGS_PHASES;
  return seq.map((label) => {
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
