import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Calendar, 
  FileText, 
  Settings, 
  Users 
} from "lucide-react";

export default function Navbar() {
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Activity },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Records", href: "/records", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6" />
          <span className="text-xl font-bold">MediFlow</span>
        </Link>
        <nav className="flex items-center space-x-6 mx-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium transition-colors hover:text-primary flex items-center space-x-2"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="outline" size="sm">
            Theme
          </Button>
          <Button size="sm">Get Started</Button>
        </div>
      </div>
    </div>
  );
}