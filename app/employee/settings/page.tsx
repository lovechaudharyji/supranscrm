"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, Bell, Shield, Palette, 
  Lock, Mail, Smartphone, Globe,
  ChevronRight
} from "lucide-react";
import { usePageContext } from "@/contexts/PageContext";

export default function SettingsPage() {
  const router = useRouter();
  const { setSubtitle } = usePageContext();

  useEffect(() => {
    setSubtitle("Manage your account settings and preferences");
  }, [setSubtitle]);

  const settingsSections = [
    {
      icon: User,
      title: "Profile",
      description: "View and update your profile information",
      href: "/employee/profile",
      color: "text-blue-500",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage your notification preferences",
      href: "#notifications",
      color: "text-orange-500",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Control your privacy and security settings",
      href: "#privacy",
      color: "text-green-500",
    },
    {
      icon: Palette,
      title: "Appearance",
      description: "Customize the look and feel",
      href: "#appearance",
      color: "text-purple-500",
    },
    {
      icon: Lock,
      title: "Password",
      description: "Change your password",
      href: "#password",
      color: "text-red-500",
    },
    {
      icon: Mail,
      title: "Email Preferences",
      description: "Manage email notifications",
      href: "#email",
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card 
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(section.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${section.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <CardDescription className="mt-2">
                  {section.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Commonly used settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/employee/profile")}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Bell className="mr-2 h-4 w-4" />
            Notification Settings
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

