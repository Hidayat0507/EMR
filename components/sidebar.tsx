"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { 
  Activity, 
  Calendar, 
  FileText, 
  Settings, 
  Users,
  LayoutDashboard,
  Bell,
  LogOut,
  Package,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Records", href: "/records", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: Activity },
  { name: "Inventory", href: "/inventory", icon: Package },
];

const bottomNavigation = [
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex h-screen border-r bg-background relative transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col flex-1">
        <div className="flex h-14 items-center border-b px-4 justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-6 w-6" />
              <span className="text-xl font-bold">MediFlow</span>
            </Link>
          )}
          {isCollapsed && <Activity className="h-6 w-6 mx-auto" />}
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute -right-4 top-16 h-8 w-8 rounded-full border bg-background"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-1 flex-col px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t p-4 space-y-1">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full", 
              isCollapsed ? "justify-center px-2" : "justify-start"
            )} 
            asChild
          >
            <Link 
              href="/logout" 
              className="text-muted-foreground hover:text-accent-foreground"
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Logout</span>}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}