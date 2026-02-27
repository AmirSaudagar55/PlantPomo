// VideoBackground.jsx
import React, { useEffect, useRef } from "react";

const VideoBackground = ({ videoId = null, isMuted = true, volume = 100, isHidden = false }) => {
  const iframeRef = useRef(null);

  // Send volume command to YouTube player via postMessage (YouTube IFrame API)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !videoId) return;

    // Small delay to ensure the player is ready
    const timeout = setTimeout(() => {
      try {
        // Unmute first (required so setVolume works after muted autoplay)
        if (!isMuted) {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "unMute", args: [] }),
            "*"
          );
        }
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
          "*"
        );
      } catch (_) {
        // cross-origin errors are non-fatal
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [volume, isMuted, videoId]);

  if (!videoId) return null;

  const muteParam = isMuted ? 1 : 0;
  // enablejsapi=1 is required for postMessage commands to work
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muteParam}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  const iframeKey = `${videoId}-${muteParam}`;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        opacity: isHidden ? 0 : 1,
        transition: "opacity 0.5s ease-in-out",
        pointerEvents: isHidden ? "none" : "auto",
      }}
    >
      <iframe
        ref={iframeRef}
        key={iframeKey}
        title="background-video"
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(1.1)",
          width: "100vw",
          height: "100vh",
          minWidth: "177.78vh",
          minHeight: "56.25vw",
          border: "none",
          pointerEvents: "none",
        }}
      />

      {/* overlay to keep foreground readable */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
    </div>
  );
};

export default VideoBackground;