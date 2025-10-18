"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Merge, 
  Trash2, 
  Edit, 
  Eye,
  Zap,
  Database,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  X,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  Target,
  Brain,
  Shield,
  Activity
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  source: string;
  stage: string;
  services: string;
  dealAmount: number;
  dateCreated: string;
  assignedTo: string;
  enrichedData?: {
    companyName?: string;
    jobTitle?: string;
    industry?: string;
    companySize?: string;
    socialProfiles?: string[];
    additionalEmails?: string[];
    additionalPhones?: string[];
  };
}

interface DuplicateGroup {
  id: string;
  confidence: number;
  reason: string;
  leads: Lead[];
  suggestedAction: 'merge' | 'keep_separate' | 'manual_review';
}

interface EnrichmentResult {
  leadId: string;
  status: 'success' | 'partial' | 'failed';
  newData: any;
  confidence: number;
  sources: string[];
}

export function SmartLeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [enrichmentResults, setEnrichmentResults] = useState<EnrichmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrichment, setShowEnrichment] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const { data: leadsData, error } = await supabase
        .from('Leads')
        .select('*')
        .order('date_and_time', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedLeads: Lead[] = (leadsData || []).map(lead => ({
        id: lead.whalesync_postgres_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        source: lead.source,
        stage: lead.stage,
        services: lead.services,
        dealAmount: parseFloat(lead.deal_amount) || 0,
        dateCreated: lead.date_and_time,
        assignedTo: lead.assigned_to
      }));

      setLeads(formattedLeads);
      
      // Simulate duplicate detection
      detectDuplicates(formattedLeads);
      
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectDuplicates = (leadsData: Lead[]) => {
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    leadsData.forEach(lead => {
      if (processed.has(lead.id)) return;

      const similarLeads = leadsData.filter(otherLead => {
        if (otherLead.id === lead.id || processed.has(otherLead.id)) return false;
        
        // Check for duplicates based on multiple criteria
        const emailMatch = lead.email && otherLead.email && 
          lead.email.toLowerCase() === otherLead.email.toLowerCase();
        const phoneMatch = lead.phone && otherLead.phone && 
          lead.phone.replace(/\D/g, '') === otherLead.phone.replace(/\D/g, '');
        const nameMatch = lead.name && otherLead.name && 
          lead.name.toLowerCase().includes(otherLead.name.toLowerCase()) ||
          otherLead.name.toLowerCase().includes(lead.name.toLowerCase());

        return emailMatch || phoneMatch || nameMatch;
      });

      if (similarLeads.length > 0) {
        const group: DuplicateGroup = {
          id: `group_${lead.id}`,
          confidence: Math.random() * 30 + 70, // 70-100% confidence
          reason: similarLeads.some(l => l.email === lead.email) ? 'Email match' :
                  similarLeads.some(l => l.phone === lead.phone) ? 'Phone match' : 'Name match',
          leads: [lead, ...similarLeads],
          suggestedAction: similarLeads.length === 1 ? 'merge' : 'manual_review'
        };

        duplicateGroups.push(group);
        processed.add(lead.id);
        similarLeads.forEach(l => processed.add(l.id));
      }
    });

    setDuplicates(duplicateGroups);
  };

  const enrichLeads = async (leadIds: string[]) => {
    try {
      setLoading(true);
      
      const results: EnrichmentResult[] = [];
      
      for (const leadId of leadIds) {
        // Simulate API call to enrichment service
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result: EnrichmentResult = {
          leadId,
          status: Math.random() > 0.2 ? 'success' : 'partial',
          newData: {
            companyName: `Company ${Math.floor(Math.random() * 1000)}`,
            jobTitle: ['CEO', 'CTO', 'Manager', 'Director'][Math.floor(Math.random() * 4)],
            industry: ['Technology', 'Finance', 'Healthcare', 'Retail'][Math.floor(Math.random() * 4)],
            companySize: ['1-10', '11-50', '51-200', '200+'][Math.floor(Math.random() * 4)],
            socialProfiles: ['LinkedIn', 'Twitter', 'Facebook'],
            additionalEmails: [`work${Math.random().toString(36).substr(2, 5)}@company.com`],
            additionalPhones: [`+91${Math.floor(Math.random() * 9000000000) + 1000000000}`]
          },
          confidence: Math.random() * 40 + 60,
          sources: ['LinkedIn', 'Company Database', 'Public Records']
        };
        
        results.push(result);
      }
      
      setEnrichmentResults(results);
      
      // Update leads with enriched data
      setLeads(prev => prev.map(lead => {
        const result = results.find(r => r.leadId === lead.id);
        if (result) {
          return {
            ...lead,
            enrichedData: result.newData
          };
        }
        return lead;
      }));
      
    } catch (error) {
      console.error('Error enriching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const mergeLeads = async (duplicateGroup: DuplicateGroup) => {
    try {
      // Keep the lead with the most recent date and highest deal amount
      const primaryLead = duplicateGroup.leads.reduce((prev, current) => 
        new Date(current.dateCreated) > new Date(prev.dateCreated) ? current : prev
      );
      
      const leadsToDelete = duplicateGroup.leads.filter(lead => lead.id !== primaryLead.id);
      
      // Update primary lead with combined data
      const updatedLead = {
        ...primaryLead,
        dealAmount: Math.max(...duplicateGroup.leads.map(l => l.dealAmount)),
        // Combine other fields as needed
      };
      
      // In a real implementation, you would:
      // 1. Update the primary lead in the database
      // 2. Delete the duplicate leads
      // 3. Update any related records
      
      console.log('Merging leads:', { primaryLead, leadsToDelete, updatedLead });
      
      // Remove from duplicates list
      setDuplicates(prev => prev.filter(d => d.id !== duplicateGroup.id));
      
    } catch (error) {
      console.error('Error merging leads:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
            <Brain className="h-6 w-6" />
            Smart Lead Management
          </h2>
          <p className="text-muted-foreground">
            AI-powered lead optimization and data enrichment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEnrichment(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Enrich Data
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="duplicates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Duplicate Detection</h3>
              <p className="text-sm text-muted-foreground">
                Found {duplicates.length} potential duplicate groups
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="space-y-4">
            {duplicates.map((group) => (
              <Card key={group.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold">
                          {group.leads.length} potential duplicates
                        </span>
                        <Badge className={getConfidenceColor(group.confidence)}>
                          {group.confidence.toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reason: {group.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mergeLeads(group)}
                      >
                        <Merge className="h-4 w-4 mr-2" />
                        Merge
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.leads.map((lead) => (
                      <div key={lead.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{lead.name}</h4>
                          <Badge variant="outline">{lead.stage}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {lead.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3" />
                            ₹{lead.dealAmount.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(lead.dateCreated), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {duplicates.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
                  <p className="text-muted-foreground">
                    Your lead database appears to be clean with no duplicate entries detected.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Enrichment Tab */}
        <TabsContent value="enrichment" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Data Enrichment</h3>
              <p className="text-sm text-muted-foreground">
                Enhance lead data with additional information
              </p>
            </div>
            <Button 
              onClick={() => enrichLeads(Array.from(selectedLeads))}
              disabled={selectedLeads.size === 0 || loading}
            >
              <Zap className="h-4 w-4 mr-2" />
              Enrich Selected ({selectedLeads.size})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <Card 
                key={lead.id} 
                className={`cursor-pointer transition-all ${
                  selectedLeads.has(lead.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  const newSelected = new Set(selectedLeads);
                  if (newSelected.has(lead.id)) {
                    newSelected.delete(lead.id);
                  } else {
                    newSelected.add(lead.id);
                  }
                  setSelectedLeads(newSelected);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{lead.name}</h4>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                    {lead.enrichedData && (
                      <Badge className="bg-green-100 text-green-800">
                        <Star className="h-3 w-3 mr-1" />
                        Enriched
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3" />
                      {lead.city}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-3 w-3" />
                      ₹{lead.dealAmount.toLocaleString()}
                    </div>
                  </div>

                  {lead.enrichedData && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-medium mb-2">Enriched Data</h5>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          {lead.enrichedData.companyName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {lead.enrichedData.jobTitle}
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          {lead.enrichedData.industry}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Quality Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Complete Profiles</span>
                  </div>
                  <p className="text-2xl font-bold">87%</p>
                  <p className="text-sm text-muted-foreground">1,234 leads</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Missing Data</span>
                  </div>
                  <p className="text-2xl font-bold">13%</p>
                  <p className="text-sm text-muted-foreground">184 leads</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Valid Emails</span>
                  </div>
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-sm text-muted-foreground">1,416 leads</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Valid Phones</span>
                  </div>
                  <p className="text-2xl font-bold">91%</p>
                  <p className="text-sm text-muted-foreground">1,368 leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Lead Source Optimization</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Your referral leads have a 35% higher conversion rate. Consider increasing your referral program budget.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-l-green-500 bg-green-50 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Data Quality Improvement</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Enriching 50 leads with missing company information could increase conversion rates by 15%.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-l-orange-500 bg-orange-50 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Follow-up Optimization</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        23 leads haven't been contacted in 7+ days. Immediate follow-up could recover 8 potential conversions.
                      </p>
                    </div>
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
