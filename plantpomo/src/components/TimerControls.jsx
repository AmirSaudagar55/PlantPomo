import { Play, Check, Bell, Settings } from "lucide-react";

const TimerControls = () => {
  const controls = [
    { icon: Play, active: false },
    { icon: Check, active: false },
    { icon: Bell, active: true },
    { icon: Settings, active: false },
  ];

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      {controls.map((ctrl, i) => {
        const Icon = ctrl.icon;

        return (
          <button
            key={i}
            type="button"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              ctrl.active
                ? "bg-accent shadow-[0_0_20px_hsl(var(--accent)/0.4)]"
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