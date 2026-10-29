import axios from "axios";
import config from "../config";

export const api = axios.create({
  baseURL: config.TRACKING_API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

export const trackOrder = (ref) =>
  api.get(`${config.ENDPOINTS.TRACK_ORDER}/${encodeURIComponent(ref)}`);

export const verifyRecaptcha = (token) =>
  api.post(config.ENDPOINTS.VERIFY_RECAPTCHA, { token });

export const trackItem = (ref) =>
  api.get(`${config.ENDPOINTS.TRACK_ITEM}/${encodeURIComponent(ref)}`);

export const saveNotification = (payload) =>
  api.post(config.ENDPOINTS.NOTIFY_ME, payload);

export async function trackShipment(ref) {
  try {
    const { data } = await trackOrder(ref);
    if (data?.success) return { kind: "order", data: data.data };
  } catch (err) {
    if (err.response?.status !== 404) throw err;
  }

  const { data } = await trackItem(ref);
  if (data?.success) return { kind: "item", data: data.data };

  throw Object.assign(new Error("Tracking not found"), {
    response: { status: 404, data },
  });
}
