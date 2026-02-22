"use client";

import { useState, ReactNode, KeyboardEvent } from "react";

type Tab = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: Tab[];
  children: (activeTab: string) => ReactNode;
  defaultTab?: string;
};

export function Tabs({ tabs, children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      (e.currentTarget.parentElement?.children[nextIndex] as HTMLButtonElement)?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
      (e.currentTarget.parentElement?.children[prevIndex] as HTMLButtonElement)?.focus();
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Demo sections"
        className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-base border border-border"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-pop"
                : "text-secondary hover:bg-surface hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="mt-4"
      >
        {children(activeTab)}
      </div>
    </div>
  );
}
