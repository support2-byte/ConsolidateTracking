export default function Loader({ status }) {
  const failed = status === "failed";
  const errored = status === "error";

  return (
    <div id="loader">
      <h2>
        {failed ? "Verification failed!" : errored ? "Error verifying!" : "Verifying..."}
      </h2>
      <p>
        {failed
          ? "Please refresh and try again."
          : errored
            ? "Check console for details."
            : "Please wait while we verify you are human."}
      </p>
    </div>
  );
}
