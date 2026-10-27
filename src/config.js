const required = (name) => {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to your .env file.`);
  }
  return value.trim().replace(/\/+$/, "");
};

const API_BASE = required("VITE_API_BASE");
const TRACKING_API_BASE = required("VITE_TRACKING_API_BASE");
const SITE_KEY = required("VITE_RECAPTCHA_SITE_KEY");

const config = Object.freeze({
  API_BASE,
  TRACKING_API_BASE,
  SITE_KEY,
  ENDPOINTS: Object.freeze({
    VERIFY_RECAPTCHA: "/api/internal/verify-recaptcha",
    TRACK_ITEM: "/api/orders/track/item",
    NOTIFY_ME: "/api/orders/notify/me/",
  }),
  SUPPORT_PHONE_DISPLAY: "+971555658321",
});

export default config;
