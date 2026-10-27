import axios from "axios";
import config from "../config";

export const api = axios.create({
  baseURL: config.TRACKING_API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // Render free instances can be slow to wake up
});

export const verifyRecaptcha = (token) =>
  api.post(config.ENDPOINTS.VERIFY_RECAPTCHA, { token });

export const trackItem = (ref) =>
  api.get(`${config.ENDPOINTS.TRACK_ITEM}/${encodeURIComponent(ref)}`);

export const saveNotification = (payload) =>
  api.post(config.ENDPOINTS.NOTIFY_ME, payload);
