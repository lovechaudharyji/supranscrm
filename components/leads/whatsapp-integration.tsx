"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  User, 
  MapPin,
  DollarSign,
  Star,
  History,
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Bot,
  Users,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

interface WhatsAppMessage {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  message: string;
  type: 'sent' | 'received';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  template?: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  usage: number;
  lastUsed: string;
}

interface WhatsAppCampaign {
  id: string;
  name: string;
  template: string;
  recipients: number;
  sent: number;
  delivered: number;
  read: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  scheduledAt: string;
  createdAt: string;
}

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: '1',
    name: 'Welcome Message',
    category: 'Onboarding',
    content: 'Hi {{name}}, welcome to Startup Squad! We\'re excited to help you with {{service}}. How can we assist you today?',
    variables: ['name', 'service'],
    usage: 45,
    lastUsed: '2024-01-15'
  },
  {
    id: '2',
    name: 'Follow-up Reminder',
    category: 'Follow-up',
    content: 'Hi {{name}}, this is a friendly reminder about your {{service}} inquiry. Are you ready to move forward?',
    variables: ['name', 'service'],
    usage: 32,
    lastUsed: '2024-01-14'
  },
  {
    id: '3',
    name: 'Meeting Confirmation',
    category: 'Scheduling',
    content: 'Hi {{name}}, your meeting is confirmed for {{date}} at {{time}}. We\'ll discuss your {{service}} requirements.',
    variables: ['name', 'date', 'time', 'service'],
    usage: 28,
    lastUsed: '2024-01-13'
  },
  {
    id: '4',
    name: 'Payment Reminder',
    category: 'Payment',
    content: 'Hi {{name}}, your invoice for {{service}} is due. Amount: ₹{{amount}}. Please complete payment at your earliest convenience.',
    variables: ['name', 'service', 'amount'],
    usage: 15,
    lastUsed: '2024-01-12'
  },
  {
    id: '5',
    name: 'Service Completion',
    category: 'Completion',
    content: 'Hi {{name}}, your {{service}} is now complete! Thank you for choosing Startup Squad. We appreciate your business.',
    variables: ['name', 'service'],
    usage: 22,
    lastUsed: '2024-01-11'
  }
];

export function WhatsAppIntegration() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(DEFAULT_TEMPLATES);
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      const { data: leads, error } = await supabase
        .from('Leads')
        .select('*')
        .order('date_and_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      return leads || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  };

  const sendMessage = async (leadId: string, message: string, template?: string) => {
    try {
      setLoading(true);
      
      // Simulate sending message
      const newMsg: WhatsAppMessage = {
        id: Date.now().toString(),
        leadId,
        leadName: selectedLead?.name || 'Unknown',
        phone: selectedLead?.phone || '',
        message,
        type: 'sent',
        timestamp: new Date().toISOString(),
        status: 'sent',
        template
      };

      setMessages(prev => [newMsg, ...prev]);
      setNewMessage('');
      
      // Update template usage
      if (template) {
        setTemplates(prev => 
          prev.map(t => 
            t.id === template 
              ? { ...t, usage: t.usage + 1, lastUsed: new Date().toISOString().split('T')[0] }
              : t
          )
        );
      }

      // Simulate delivery status update
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMsg.id 
              ? { ...msg, status: 'delivered' }
              : msg
          )
        );
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: WhatsAppTemplate) => {
    let content = template.content;
    
    // Replace variables with actual data
    template.variables.forEach(variable => {
      const value = selectedLead?.[variable] || `{{${variable}}}`;
      content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    setNewMessage(content);
    setSelectedTemplate(template.id);
    setShowTemplates(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-600';
      case 'delivered': return 'text-green-600';
      case 'read': return 'text-green-700';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
            <MessageCircle className="h-6 w-6 text-green-500" />
            WhatsApp Integration
          </h2>
          <p className="text-muted-foreground">
            Direct communication with leads through WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCampaigns(!showCampaigns)}>
            <Users className="h-4 w-4 mr-2" />
            Campaigns
          </Button>
        </div>
      </div>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Lead Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Select Lead
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedLead ? (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{selectedLead.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {selectedLead.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {selectedLead.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {selectedLead.city}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          ₹{parseFloat(selectedLead.deal_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a lead to start messaging</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Composer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplates(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => selectedLead && sendMessage(selectedLead.whalesync_postgres_id, newMessage)}
                      disabled={!newMessage || !selectedLead || loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Message History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.type === 'sent' 
                            ? 'bg-green-100 ml-8' 
                            : 'bg-gray-100 mr-8'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium">
                            {message.type === 'sent' ? 'You' : message.leadName}
                          </span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(message.status)}
                            <span className={`text-xs ${getStatusColor(message.status)}`}>
                              {message.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                    >
                      Use
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Used {template.usage} times</span>
                    <span>Last used: {template.lastUsed}</span>
                  </div>
                  
                  {template.variables.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>WhatsApp Campaigns</span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p>No campaigns created yet</p>
                    <p className="text-sm">Create your first WhatsApp campaign to reach multiple leads</p>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.recipients} recipients • {campaign.sent} sent • {campaign.delivered} delivered
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          campaign.status === 'sent' ? 'default' :
                          campaign.status === 'sending' ? 'secondary' :
                          campaign.status === 'scheduled' ? 'outline' : 'destructive'
                        }>
                          {campaign.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
                    <p className="text-2xl font-bold">1,234</p>
                    <p className="text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +12% from last month
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                    <p className="text-2xl font-bold">98.5%</p>
                    <p className="text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +0.5% from last month
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Read Rate</p>
                    <p className="text-2xl font-bold">87.2%</p>
                    <p className="text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +3.2% from last month
                    </p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                    <p className="text-2xl font-bold">45.8%</p>
                    <p className="text-xs text-green-600">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +5.8% from last month
                    </p>
                  </div>
                  <Bot className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
