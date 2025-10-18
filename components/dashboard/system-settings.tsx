"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Database, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save, 
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Key
} from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  general: {
    companyName: string;
    companyEmail: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    leadAssigned: boolean;
    leadConverted: boolean;
    taskReminder: boolean;
    reportGenerated: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
    ipWhitelist: string[];
    auditLogging: boolean;
  };
  integrations: {
    emailProvider: string;
    smsProvider: string;
    calendarSync: boolean;
    crmSync: boolean;
    analyticsTracking: boolean;
  };
  appearance: {
    theme: string;
    primaryColor: string;
    logo: string;
    favicon: string;
    customCss: string;
  };
}

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    companyName: "Your Company",
    companyEmail: "admin@company.com",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    language: "en"
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    leadAssigned: true,
    leadConverted: true,
    taskReminder: true,
    reportGenerated: false
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordPolicy: "medium",
    ipWhitelist: [],
    auditLogging: true
  },
  integrations: {
    emailProvider: "smtp",
    smsProvider: "twilio",
    calendarSync: true,
    crmSync: true,
    analyticsTracking: true
  },
  appearance: {
    theme: "light",
    primaryColor: "#3b82f6",
    logo: "",
    favicon: "",
    customCss: ""
  }
};

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Load settings from localStorage on component mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('system_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('system_settings', JSON.stringify(settings));
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
    toast.info("Settings reset to defaults");
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
            System Settings
          </h2>
          <p className="text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
            Configure system preferences and behavior
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={!hasChanges || loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
              General Settings
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
              {settings.general.companyName}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
              {settings.general.timezone}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
              Notifications
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
              {Object.values(settings.notifications).filter(Boolean).length}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
              Active notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
              Security
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
              {settings.security.twoFactorAuth ? "2FA" : "Basic"}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
              Authentication level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
              Integrations
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
              {Object.values(settings.integrations).filter(Boolean).length}
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
              Active integrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Settings className="h-5 w-5" />
                General Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.general.companyName}
                    onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.general.companyEmail}
                    onChange={(e) => handleSettingChange('general', 'companyEmail', e.target.value)}
                    placeholder="Enter company email"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.general.timezone} onValueChange={(value) => handleSettingChange('general', 'timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.general.currency} onValueChange={(value) => handleSettingChange('general', 'currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>
                  Notification Channels
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Send notifications via email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Send notifications via SMS
                      </p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.notifications.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'smsNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Send browser push notifications
                      </p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>
                  Event Notifications
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="leadAssigned">Lead Assigned</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Notify when a lead is assigned
                      </p>
                    </div>
                    <Switch
                      id="leadAssigned"
                      checked={settings.notifications.leadAssigned}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'leadAssigned', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="leadConverted">Lead Converted</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Notify when a lead is converted
                      </p>
                    </div>
                    <Switch
                      id="leadConverted"
                      checked={settings.notifications.leadConverted}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'leadConverted', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="taskReminder">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Send task reminder notifications
                      </p>
                    </div>
                    <Switch
                      id="taskReminder"
                      checked={settings.notifications.taskReminder}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'taskReminder', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Require 2FA for all users
                    </p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    placeholder="30"
                  />
                </div>
                
                <div>
                  <Label htmlFor="passwordPolicy">Password Policy</Label>
                  <Select value={settings.security.passwordPolicy} onValueChange={(value) => handleSettingChange('security', 'passwordPolicy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Weak (6+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ characters, mixed case)</SelectItem>
                      <SelectItem value="strong">Strong (12+ characters, special chars)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auditLogging">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Log all user actions for security
                    </p>
                  </div>
                  <Switch
                    id="auditLogging"
                    checked={settings.security.auditLogging}
                    onCheckedChange={(checked) => handleSettingChange('security', 'auditLogging', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Globe className="h-5 w-5" />
                Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emailProvider">Email Provider</Label>
                  <Select value={settings.integrations.emailProvider} onValueChange={(value) => handleSettingChange('integrations', 'emailProvider', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="smsProvider">SMS Provider</Label>
                  <Select value={settings.integrations.smsProvider} onValueChange={(value) => handleSettingChange('integrations', 'smsProvider', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="aws-sns">AWS SNS</SelectItem>
                      <SelectItem value="messagebird">MessageBird</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="calendarSync">Calendar Sync</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Sync with Google Calendar
                    </p>
                  </div>
                  <Switch
                    id="calendarSync"
                    checked={settings.integrations.calendarSync}
                    onCheckedChange={(checked) => handleSettingChange('integrations', 'calendarSync', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="crmSync">CRM Sync</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Sync with external CRM systems
                    </p>
                  </div>
                  <Switch
                    id="crmSync"
                    checked={settings.integrations.crmSync}
                    onCheckedChange={(checked) => handleSettingChange('integrations', 'crmSync', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analyticsTracking">Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Enable analytics and tracking
                    </p>
                  </div>
                  <Switch
                    id="analyticsTracking"
                    checked={settings.integrations.analyticsTracking}
                    onCheckedChange={(checked) => handleSettingChange('integrations', 'analyticsTracking', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.appearance.theme} onValueChange={(value) => handleSettingChange('appearance', 'theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="customCss">Custom CSS</Label>
                <Textarea
                  id="customCss"
                  value={settings.appearance.customCss}
                  onChange={(e) => handleSettingChange('appearance', 'customCss', e.target.value)}
                  placeholder="Enter custom CSS code..."
                  className="min-h-32 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                <Database className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                      Database Management
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Advanced database operations and maintenance tools.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <span className="font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                      API Management
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: 'Geist, sans-serif' }}>
                    Manage API keys and external service integrations.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Key className="h-4 w-4 mr-2" />
                      Generate API Key
                    </Button>
                    <Button variant="outline" size="sm">
                      <Globe className="h-4 w-4 mr-2" />
                      Test Connections
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
