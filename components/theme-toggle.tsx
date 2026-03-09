"use client";

import * as React from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "v3", icon: Sparkles, label: "V3" },
  ] as const;

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex h-10 w-[132px] items-center rounded-full bg-muted/70 p-1",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-muted/70 p-1 text-muted-foreground",
        className
      )}
    >
      {options.map(({ id, icon: Icon, label }) => {
        const currentTheme = theme === "system" ? resolvedTheme : theme;
        const active = currentTheme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={cn(
              "flex h-8 w-10 items-center justify-center rounded-full text-xs transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:text-foreground"
            )}
            aria-label={`Switch to ${label} theme`}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
