import { useState, useEffect } from "react";
import axios from "axios";

const ServerWakeUp = ({ children }) => {
  const [serverStatus, setServerStatus] = useState("checking"); // checking | awake | sleeping

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl || apiUrl.includes("localhost")) {
      // Skip check for local development
      setServerStatus("awake");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      // If no response in 4 seconds, server is likely cold-starting
      if (serverStatus === "checking") setServerStatus("sleeping");
    }, 4000);

    axios
      .get(`${apiUrl}/`, { signal: controller.signal, timeout: 60000 })
      .then(() => {
        clearTimeout(timeoutId);
        setServerStatus("awake");
      })
      .catch((err) => {
        if (!axios.isCancel(err)) {
          clearTimeout(timeoutId);
          // Even on error, server responded — it's awake
          setServerStatus("awake");
        }
      });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  if (serverStatus === "awake") return children;

  return (
    <div className="fixed inset-0 bg-[#1a1a2e] flex flex-col items-center justify-center z-[9999] text-white">
      {/* Animated logo area */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-[#E67E22]/30 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-[#E67E22] animate-spin absolute"></div>
          <span className="material-symbols-outlined text-[#E67E22] text-3xl">dns</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {serverStatus === "checking" ? "Connecting to server..." : "Waking up the server..."}
      </h2>

      <p className="text-gray-400 text-sm text-center max-w-md px-4 mb-6">
        {serverStatus === "checking"
          ? "Please wait while we establish a connection."
          : "The server is hosted on a free tier and goes to sleep after inactivity. This usually takes 30-60 seconds."}
      </p>

      {/* Progress dots */}
      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-[#E67E22] animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-[#E67E22] animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-[#E67E22] animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>

      {serverStatus === "sleeping" && (
        <p className="text-gray-500 text-xs mt-8">
          Thank you for your patience — the app will load automatically once the server is ready.
        </p>
      )}
    </div>
  );
};

export default ServerWakeUp;
