"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const viewTabs = [
  { id: "queue", label: "Queue", meta: "live" },
  { id: "records", label: "Records", meta: "42 open" },
  { id: "tasks", label: "Tasks", meta: "7 due" },
];

const quickStats = [
  { label: "Arrivals", value: "18", trend: "+3", tone: "positive" },
  { label: "Wait Avg", value: "12m", trend: "-4m", tone: "positive" },
  { label: "Consults", value: "26", trend: "+6", tone: "neutral" },
  { label: "Follow-ups", value: "9", trend: "+2", tone: "alert" },
];

export function TopNavV3() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isV3 = currentTheme === "v3";
  const [activeTab, setActiveTab] = React.useState(viewTabs[0].id);

  if (!isV3) {
    return null;
  }

  return (
    <section className="v3-nav">
      <div className="v3-nav__controls">
        <div className="v3-nav__tabs">
          {viewTabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "v3-nav__tab",
                  isActive && "v3-nav__tab--active"
                )}
              >
                <span>{tab.label}</span>
                <span className="text-xs text-v3-muted">{tab.meta}</span>
              </button>
            );
          })}
        </div>
        <div className="v3-nav__search">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-v3-muted" />
            <Input
              type="search"
              placeholder="Universal quick search"
              className="pl-10 pr-14 v3-nav__search-input"
            />
            <span className="v3-nav__kbd">⌘K</span>
          </div>
          <Button type="button" variant="ghost" className="v3-nav__ghost">
            <Filter className="size-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="v3-nav__stats">
        {quickStats.map((stat) => (
          <div key={stat.label} className="v3-nav__stat-card">
            <div className="text-xs uppercase tracking-[0.2em] text-v3-muted">
              {stat.label}
            </div>
            <div className="text-2xl font-semibold text-white">{stat.value}</div>
            <div
              className={cn(
                "text-xs font-medium",
                stat.tone === "positive" && "text-green-300",
                stat.tone === "alert" && "text-rose-300",
                stat.tone === "neutral" && "text-slate-200"
              )}
            >
              {stat.trend} today
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
