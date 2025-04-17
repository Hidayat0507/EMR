"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null on the server and initial client render
    // to avoid mismatch
    return <div className={cn("inline-flex items-center bg-muted rounded-full p-1 h-[40px] w-[72px]", className)} />; 
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center bg-muted rounded-full p-1 cursor-pointer",
        className
      )}
      onClick={toggleTheme}
    >
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          !isDark ? "bg-primary text-primary-foreground" : "bg-transparent"
        )}
      >
        <Sun className="h-5 w-5" />
      </div>
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          isDark ? "bg-primary text-primary-foreground" : "bg-transparent"
        )}
      >
        <Moon className="h-5 w-5" />
      </div>
    </div>
  );
}
