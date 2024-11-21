import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  const demoAccounts = [
    {
      role: "Doctor",
      email: "doctor@demo.com",
      password: "demo123",
      features: ["Full patient management", "Consultation records", "Medical history"],
    },
    {
      role: "Nurse",
      email: "nurse@demo.com",
      password: "demo123",
      features: ["Patient vitals", "Appointment scheduling", "Basic records access"],
    },
    {
      role: "Admin",
      email: "admin@demo.com",
      password: "demo123",
      features: ["User management", "System settings", "Reports and analytics"],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Try the Demo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience our EMR system with demo accounts. Choose a role below to explore the features available for different user types.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {demoAccounts.map((account) => (
          <Card key={account.role} className="relative group hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle>{account.role}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Login Credentials:</p>
                <div className="text-sm text-muted-foreground">
                  <p>Email: {account.email}</p>
                  <p>Password: {account.password}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {account.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              <Button className="w-full mt-4" asChild>
                <Link href="/login">
                  Try {account.role} Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Ready to use the system with your own data?
        </p>
        <Button size="lg" asChild>
          <Link href="/register">Create Your Account</Link>
        </Button>
      </div>
    </div>
  );
}