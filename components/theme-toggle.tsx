"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div 
      className="inline-flex items-center bg-muted rounded-full p-1 cursor-pointer"
      onClick={toggleTheme}
    >
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          isDark ? "bg-primary text-primary-foreground" : "bg-transparent"
        )}
      >
        <Sun className="h-5 w-5" />
      </div>
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          !isDark ? "bg-primary text-primary-foreground" : "bg-transparent"
        )}
      >
        <Moon className="h-5 w-5" />
      </div>
    </div>
  );
}
