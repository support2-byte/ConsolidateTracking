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

export function fmtTime(input) {
  if (!input) return "";
  const date = new Date(input);
  if (isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: USER_TIME_ZONE,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function fmtDate(input) {
  if (!input) return "";
  const date = new Date(input);
  if (isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: USER_TIME_ZONE,
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}
