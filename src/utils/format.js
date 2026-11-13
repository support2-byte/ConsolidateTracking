export const USER_TIME_ZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time";

export function getTimezoneLabel() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
      timeZone: USER_TIME_ZONE,
    }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === "timeZoneName");
    return tz ? `${USER_TIME_ZONE} (${tz.value})` : USER_TIME_ZONE;
  } catch {
    return USER_TIME_ZONE;
  }
}

export const toDate = (d) => {
  if (d instanceof Date) return d;
  const s = String(d);
  return new Date(
    /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : s.replace(" ", "T") + "Z",
  );
};

export const fmtDate = (d) =>
  d
    ? toDate(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtTime = (d) =>
  d
    ? toDate(d).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
