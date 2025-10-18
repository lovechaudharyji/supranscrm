"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  DollarSign,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

interface LeadScore {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  dealAmount: number;
  dateCreated: string;
  totalScore: number;
  scoreBreakdown: {
    demographic: number;
    behavioral: number;
    engagement: number;
    intent: number;
    timing: number;
  };
  probability: number;
  priority: 'High' | 'Medium' | 'Low';
  lastActivity: string;
  nextAction: string;
  riskFactors: string[];
  opportunities: string[];
}

interface ScoringRule {
  id: string;
  name: string;
  category: string;
  weight: number;
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    points: number;
  }>;
}

const DEFAULT_SCORING_RULES: ScoringRule[] = [
  {
    id: '1',
    name: 'High Value Service',
    category: 'Demographic',
    weight: 20,
    enabled: true,
    conditions: [
      { field: 'services', operator: 'contains', value: 'USA LLC Formation', points: 25 },
      { field: 'services', operator: 'contains', value: 'Brand Development', points: 20 },
      { field: 'services', operator: 'contains', value: 'Dropshipping', points: 15 }
    ]
  },
  {
    id: '2',
    name: 'Geographic Location',
    category: 'Demographic',
    weight: 15,
    enabled: true,
    conditions: [
      { field: 'city', operator: 'equals', value: 'Delhi', points: 20 },
      { field: 'city', operator: 'equals', value: 'Mumbai', points: 18 },
      { field: 'city', operator: 'equals', value: 'Bangalore', points: 15 }
    ]
  },
  {
    id: '3',
    name: 'Lead Source Quality',
    category: 'Behavioral',
    weight: 25,
    enabled: true,
    conditions: [
      { field: 'source', operator: 'equals', value: 'Referral', points: 30 },
      { field: 'source', operator: 'equals', value: 'Website', points: 20 },
      { field: 'source', operator: 'equals', value: 'Social Media', points: 15 },
      { field: 'source', operator: 'equals', value: 'Cold Call', points: 10 }
    ]
  },
  {
    id: '4',
    name: 'Engagement Level',
    category: 'Engagement',
    weight: 20,
    enabled: true,
    conditions: [
      { field: 'followUpDay', operator: 'not_null', value: null, points: 15 },
      { field: 'assigned_to', operator: 'not_null', value: null, points: 10 }
    ]
  },
  {
    id: '5',
    name: 'Deal Amount',
    category: 'Intent',
    weight: 20,
    enabled: true,
    conditions: [
      { field: 'deal_amount', operator: 'greater_than', value: 100000, points: 25 },
      { field: 'deal_amount', operator: 'greater_than', value: 50000, points: 15 },
      { field: 'deal_amount', operator: 'greater_than', value: 25000, points: 10 }
    ]
  }
];

export function LeadScoringSystem() {
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>(DEFAULT_SCORING_RULES);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);
  const [showRules, setShowRules] = useState(false);

  const calculateLeadScore = (lead: any): LeadScore => {
    let totalScore = 0;
    const scoreBreakdown = {
      demographic: 0,
      behavioral: 0,
      engagement: 0,
      intent: 0,
      timing: 0
    };

    // Apply scoring rules
    scoringRules.forEach(rule => {
      if (!rule.enabled) return;

      rule.conditions.forEach(condition => {
        let conditionMet = false;
        const fieldValue = lead[condition.field];

        switch (condition.operator) {
          case 'equals':
            conditionMet = fieldValue === condition.value;
            break;
          case 'contains':
            conditionMet = fieldValue && fieldValue.toString().toLowerCase().includes(condition.value.toLowerCase());
            break;
          case 'greater_than':
            conditionMet = parseFloat(fieldValue) > condition.value;
            break;
          case 'not_null':
            conditionMet = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
            break;
        }

        if (conditionMet) {
          const points = condition.points * (rule.weight / 100);
          totalScore += points;

          // Categorize points
          switch (rule.category) {
            case 'Demographic':
              scoreBreakdown.demographic += points;
              break;
            case 'Behavioral':
              scoreBreakdown.behavioral += points;
              break;
            case 'Engagement':
              scoreBreakdown.engagement += points;
              break;
            case 'Intent':
              scoreBreakdown.intent += points;
              break;
            case 'Timing':
              scoreBreakdown.timing += points;
              break;
          }
        }
      });
    });

    // Calculate probability based on score
    const probability = Math.min(95, Math.max(5, (totalScore / 100) * 100));
    
    // Determine priority
    let priority: 'High' | 'Medium' | 'Low' = 'Low';
    if (totalScore >= 70) priority = 'High';
    else if (totalScore >= 40) priority = 'Medium';

    // Generate risk factors and opportunities
    const riskFactors: string[] = [];
    const opportunities: string[] = [];

    if (totalScore < 30) {
      riskFactors.push('Low engagement score');
      riskFactors.push('Limited demographic data');
    }
    if (lead.stage === 'Not Connected') {
      riskFactors.push('No initial contact made');
    }
    if (!lead.assigned_to) {
      riskFactors.push('No assigned sales rep');
    }

    if (totalScore >= 70) {
      opportunities.push('High conversion probability');
      opportunities.push('Premium service interest');
    }
    if (lead.source === 'Referral') {
      opportunities.push('Warm lead from referral');
    }
    if (parseFloat(lead.deal_amount) > 100000) {
      opportunities.push('High-value opportunity');
    }

    return {
      id: lead.whalesync_postgres_id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      stage: lead.stage,
      dealAmount: parseFloat(lead.deal_amount) || 0,
      dateCreated: lead.date_and_time,
      totalScore: Math.round(totalScore),
      scoreBreakdown,
      probability: Math.round(probability),
      priority,
      lastActivity: lead.date_and_time,
      nextAction: totalScore >= 70 ? 'Immediate follow-up' : 
                  totalScore >= 40 ? 'Schedule call' : 'Nurture sequence',
      riskFactors,
      opportunities
    };
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const { data: leadsData, error } = await supabase
        .from('Leads')
        .select('*')
        .order('date_and_time', { ascending: false })
        .limit(50);

      if (error) throw error;

      const scoredLeads = leadsData?.map(calculateLeadScore) || [];
      setLeads(scoredLeads.sort((a, b) => b.totalScore - a.totalScore));
      
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [scoringRules]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
            <Brain className="h-6 w-6" />
            AI-Powered Lead Scoring
          </h2>
          <p className="text-muted-foreground">
            Intelligent lead prioritization based on multiple factors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRules(!showRules)}>
            <Settings className="h-4 w-4 mr-2" />
            Scoring Rules
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Scoring Rules Panel */}
      {showRules && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Scoring Rules Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scoringRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">{rule.category} • Weight: {rule.weight}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScoringRules(prev => 
                          prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r)
                        );
                      }}
                    >
                      {rule.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map((lead) => (
          <Card 
            key={lead.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedLead?.id === lead.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedLead(lead)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{lead.name}</h3>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
                </div>
                <Badge className={getPriorityColor(lead.priority)}>
                  {lead.priority} Priority
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lead Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(lead.totalScore)}`}>
                    {lead.totalScore}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      lead.totalScore >= 70 ? 'bg-green-500' :
                      lead.totalScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${lead.totalScore}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Probability</span>
                  <span className="text-sm font-medium">{lead.probability}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Source</span>
                  <Badge variant="outline">{lead.source}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stage</span>
                  <Badge variant="secondary">{lead.stage}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deal Amount</span>
                  <span className="text-sm font-medium">₹{lead.dealAmount.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-blue-600">{lead.nextAction}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lead Score Analysis - {selectedLead.name}</span>
              <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold">Score Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Demographic Factors</span>
                    <span className="text-sm font-medium">{selectedLead.scoreBreakdown.demographic.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Behavioral Patterns</span>
                    <span className="text-sm font-medium">{selectedLead.scoreBreakdown.behavioral.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engagement Level</span>
                    <span className="text-sm font-medium">{selectedLead.scoreBreakdown.engagement.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Purchase Intent</span>
                    <span className="text-sm font-medium">{selectedLead.scoreBreakdown.intent.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Timing Factors</span>
                    <span className="text-sm font-medium">{selectedLead.scoreBreakdown.timing.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Risk Factors & Opportunities */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Risk Factors</h4>
                  <div className="space-y-1">
                    {selectedLead.riskFactors.map((risk, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Opportunities</h4>
                  <div className="space-y-1">
                    {selectedLead.opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {opportunity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
