import { useState } from "react";

const tabs = ["Code", "Market", "Design"];

const TaskTabs = () => {
  const [active, setActive] = useState("Code");

  return (
    <div className="flex items-center gap-1 mt-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActive(tab)}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            active === tab
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TaskTabs;