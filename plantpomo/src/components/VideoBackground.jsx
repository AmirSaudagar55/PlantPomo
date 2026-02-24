// VideoBackground.jsx
import React from "react";

const VideoBackground = ({ videoId = null, isMuted = true }) => {
  if (!videoId) return null;

  const muteParam = isMuted ? 1 : 0;
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muteParam}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`;
  const iframeKey = `${videoId}-${muteParam}`;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      // ensure container covers safe-area on iOS as well
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <iframe
        key={iframeKey}
        title="background-video"
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        // position the iframe centrally and size so it always *covers* the viewport
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          // keep 16:9 aspect ratio cover logic:
          width: "max(100vw, calc(100vh * (16/9)))",
          height: "max(100vh, calc(100vw * (9/16)))",
          border: "0",
        }}
      />

      {/* an overlay to keep foreground readable */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
    </div>
  );
};

export default VideoBackground;