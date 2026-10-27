import { useEffect, useState } from "react";
import config from "../config";
import { verifyRecaptcha } from "../api/client";

let scriptPromise = null;

// Loads api.js once, even under React StrictMode's double effect run.
function loadRecaptchaScript(siteKey) {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load reCAPTCHA"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// status: "verifying" | "verified" | "failed" | "error"
export default function useRecaptcha() {
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadRecaptchaScript(config.SITE_KEY);
        await new Promise((res) => window.grecaptcha.ready(res));
        const token = await window.grecaptcha.execute(config.SITE_KEY, {
          action: "homepage",
        });
        const { data } = await verifyRecaptcha(token);
        if (!cancelled) setStatus(data?.success ? "verified" : "failed");
      } catch (err) {
        console.error("reCAPTCHA verification error:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
