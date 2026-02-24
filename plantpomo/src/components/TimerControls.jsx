import React from "react";
import { Play, Check, Bell, Settings } from "lucide-react";

const TimerControls = () => {
  const controls = [
    { icon: Play, active: false, label: "Start" },
    { icon: Check, active: false, label: "Complete" },
    { icon: Bell, active: true, label: "Notifications" },
    { icon: Settings, active: false, label: "Settings" },
  ];

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {controls.map((ctrl, i) => {
        const Icon = ctrl.icon;
        return (
          <button
            key={i}
            type="button"
            aria-label={ctrl.label}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${
              ctrl.active
                ? "bg-accent shadow-[0_0_20px_rgba(57,255,20,0.16)]"
                : "bg-secondary hover:bg-border"
            }`}
          >
            <Icon
              size={18}
              className={
                ctrl.active
                  ? "text-accent-foreground"
                  : "text-muted-foreground"
              }
            />
          </button>
        );
      })}
    </div>
  );
};

export default TimerControls;