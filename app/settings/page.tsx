'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import React, { useState } from 'react';

// Placeholder for user data - replace with actual data fetching/auth context later
interface UserSettings {
  fullName: string;
  email: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  // Placeholder state - connect to user data later
  const [settings, setSettings] = useState<UserSettings>({
    fullName: 'Dr. John Doe', // Example data
    email: 'john.doe@example.com', // Example data
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement logic to save settings (e.g., call an API)
    console.log('Saving settings:', settings);
    setIsEditing(false);
    toast({
      title: "Settings Saved",
      description: "Your profile information has been updated.",
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName"
                name="fullName"
                value={settings.fullName}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={settings.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize application behavior.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Preference settings coming soon...</p>
          {/* TODO: Add actual preference settings (e.g., theme, notifications) */}
        </CardContent>
      </Card>
       
      {/* Add more sections as needed (e.g., Security, Notifications) */}

    </div>
  );
} 