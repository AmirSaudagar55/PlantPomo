import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import TaskTabs from "./TaskTabs";

const FocusCard = () => {
  return (
    <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8">
      <p className="text-center text-muted-foreground mb-4">
        Ready to lock in on your idea?
      </p>

      <div className="flex justify-center mb-6">
        <button
          type="button"
          className="px-6 py-2.5 rounded-full bg-timer-green text-background text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Focus (30 min)
        </button>
      </div>

      <TimerDisplay />
      <TimerControls />
      <TaskTabs />
    </div>
  );
};

export default FocusCard;