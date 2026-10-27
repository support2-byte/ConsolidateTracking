import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useRecaptcha from "./hooks/useRecaptcha";
import Loader from "./components/Loader";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import TrackingPage from "./pages/TrackingPage";

export default function App() {
  const recaptcha = useRecaptcha();

  if (recaptcha !== "verified") return <Loader status={recaptcha} />;

  return (
    <>
      <SiteHeader />
      <TrackingPage verified />
      <SiteFooter />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
