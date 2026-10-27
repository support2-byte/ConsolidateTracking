import { toast } from "react-toastify";

// type: "success" | "error" | "info"
export const showNotification = (message, type = "info") => {
  toast.dismiss();
  const show = toast[type] || toast;
  show(message);
};
