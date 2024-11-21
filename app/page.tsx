import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Calendar, FileText, Activity, Heart, Shield, Clock, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      title: "Patient-Centric Care",
      description: "Streamlined patient information management for better care delivery",
      icon: Heart,
      color: "text-red-500"
    },
    {
      title: "Secure Records",
      description: "Advanced security measures to protect sensitive medical data",
      icon: Shield,
      color: "text-blue-500"
    },
    {
      title: "Real-time Updates",
      description: "Instant access to critical patient information and updates",
      icon: Clock,
      color: "text-green-500"
    },
    {
      title: "Efficient Workflow",
      description: "Optimized processes for healthcare professionals",
      icon: Zap,
      color: "text-yellow-500"
    }
  ];

  const modules = [
    {
      title: "Patient Management",
      description: "Comprehensive patient profiles and history tracking",
      icon: Users,
      href: "/patients"
    },
    {
      title: "Appointment System",
      description: "Smart scheduling and appointment management",
      icon: Calendar,
      href: "/appointments"
    },
    {
      title: "Medical Records",
      description: "Digital health records and documentation",
      icon: FileText,
      href: "/records"
    },
    {
      title: "Health Monitoring",
      description: "Real-time patient health tracking and alerts",
      icon: Activity,
      href: "/monitoring"
    }
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-20 py-20">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Modern Healthcare
            <span className="block text-primary">Management System</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
            Streamline your medical practice with our comprehensive electronic medical records system.
            Designed for healthcare professionals who prioritize efficiency and patient care.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">View Demo</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter">Key Features</h2>
            <p className="text-muted-foreground">Designed to enhance your healthcare practice</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-none bg-muted/50">
                <CardHeader>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Modules Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter">Core Modules</h2>
            <p className="text-muted-foreground">Everything you need to manage your practice</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <Card key={module.title} className="group hover:shadow-lg transition-all">
                <Link href={module.href}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <module.icon className="h-8 w-8 text-primary" />
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardTitle className="mt-4">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}