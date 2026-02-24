import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const ShowHideVideoToggle = () => {
  const [hidden, setHidden] = useState(() => {
    try {
      return document.documentElement.getAttribute("data-video-hidden") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-video-hidden", hidden ? "true" : "false");
    } catch {}
    // dispatch event so pages (Index.jsx) can listen and act (e.g. pause video, free resources)
    const e = new CustomEvent("video:visibilitychange", { detail: { hidden } });
    window.dispatchEvent(e);
  }, [hidden]);

  const toggle = () => setHidden((h) => !h);

  return (
    <button
      onClick={toggle}
      aria-pressed={hidden}
      title={hidden ? "Show background video" : "Hide background video"}
      className={`p-2 rounded-lg transition-colors ${
        hidden ? "bg-secondary/80 text-muted-foreground" : "bg-secondary hover:bg-border text-foreground"
      }`}
    >
      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
};

export default ShowHideVideoToggle;