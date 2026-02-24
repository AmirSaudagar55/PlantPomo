const TimerDisplay = () => {
  return (
    <div className="rounded-xl bg-timer-bg border border-border p-6">
      <div className="flex items-center justify-center font-mono text-6xl md:text-7xl tracking-wider text-timer-green font-bold">
        <span>00</span>
        <span className="mx-2 text-timer-green">:</span>
        <span>30</span>
        <span className="mx-2 text-timer-green">:</span>
        <span>00</span>
      </div>
    </div>
  );
};

export default TimerDisplay;