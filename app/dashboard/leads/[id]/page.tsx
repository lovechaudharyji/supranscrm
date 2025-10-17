"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Phone, Mail, MapPin, Briefcase, Calendar, 
  DollarSign, User, ChevronLeft, Building2, Tag,
  MessageCircle, Clock
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import DispositionSection from "@/components/leadsdetailscomponent/DispositionSection";
import CallHistory from "@/components/leadsdetailscomponent/CallHistory";

interface Lead {
  whalesync_postgres_id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  city: string | null;
  services: string | null;
  source: string | null;
  stage: string | null;
  deal_amount: number | null;
  client_budget: string | null;
  follow_up_date: string | null;
  expected_closing: string | null;
  any_other_interests: string | null;
  call_notes: string | null;
  lead_tag: string | null;
  call_remark: string | null;
  date_and_time: string | null;
  assigned_to?: {
    whalesync_postgres_id: string;
    full_name: string;
    profile_photo: string;
  } | null;
  calls?: any[];
}

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("Leads")
      .select(`
        whalesync_postgres_id, name, email, mobile, city, services, source, stage,
        deal_amount, client_budget, follow_up_date, expected_closing,
        any_other_interests, call_notes, lead_tag, call_remark, date_and_time,
        assigned_to (whalesync_postgres_id, full_name, profile_photo),
        calls (whalesync_postgres_id, call_type, call_date, duration, ai_call_summary, sentiment)
      `)
      .eq("whalesync_postgres_id", leadId)
      .single();

    if (error) {
      console.error("Error fetching lead:", error);
    } else {
      setLead(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

  const updateLead = async (payload: any) => {
    if (!lead) return false;
    
    const { error } = await supabase
      .from("Leads")
      .update(payload)
      .eq("whalesync_postgres_id", lead.whalesync_postgres_id);
    
    if (error) {
      console.error("Update failed:", error.message);
      return false;
    }
    
    await fetchLeadDetails();
    return true;
  };

  const getStageColor = (stage?: string | null) => {
    switch (stage?.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "connected":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "converted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "contact attempted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto animate-spin border-2 border-muted border-t-primary rounded-full"></div>
              <p className="mt-4 text-muted-foreground">Loading lead details...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!lead) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium">Lead not found</p>
              <Button onClick={() => router.push("/dashboard/leads")} className="mt-4">
                Back to Leads
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const initials = lead.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <SiteHeader title="Lead Details" />

          {/* Main Content */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-2 overflow-auto">
            {/* Back Button */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/leads")}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Leads
              </Button>
            </div>
            {/* Lead Header Card */}
            <Card className="bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    {lead.assigned_to?.profile_photo && (
                      <AvatarImage src={lead.assigned_to.profile_photo} alt={lead.name || "Lead"} />
                    )}
                    <AvatarFallback className="text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-bold">{lead.name}</h1>
                      {lead.stage && (
                        <Badge className={getStageColor(lead.stage)}>
                          {lead.stage}
                        </Badge>
                      )}
                      {lead.lead_tag && (
                        <Badge variant="outline" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {lead.lead_tag}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {lead.mobile && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{lead.mobile}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      )}
                      {lead.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{lead.city}</span>
                        </div>
                      )}
                    </div>

                    {lead.assigned_to && (
                      <div className="text-sm text-muted-foreground">
                        Assigned to: <span className="font-medium text-foreground">{lead.assigned_to.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-2"
                      onClick={() => window.location.href = `tel:${lead.mobile}`}
                      disabled={!lead.mobile}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(`https://wa.me/${lead.mobile}`, "_blank")}
                      disabled={!lead.mobile}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Lead Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact & Service Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact & Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Service</p>
                      <p className="text-sm font-medium mt-1">{lead.services || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Source</p>
                      <p className="text-sm font-medium mt-1">{lead.source || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Date Added</p>
                      <p className="text-sm font-medium mt-1">
                        {lead.date_and_time ? new Date(lead.date_and_time).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Follow Up Date</p>
                      <p className="text-sm font-medium mt-1">
                        {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Deal Amount</p>
                      <p className="text-sm font-medium mt-1">
                        {lead.deal_amount ? `₹${lead.deal_amount.toLocaleString()}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Client Budget</p>
                      <p className="text-sm font-medium mt-1">{lead.client_budget || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Expected Closing</p>
                      <p className="text-sm font-medium mt-1">
                        {lead.expected_closing ? new Date(lead.expected_closing).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            {(lead.any_other_interests || lead.call_notes) && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead.any_other_interests && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Other Interests</p>
                      <p className="text-sm mt-1">{lead.any_other_interests}</p>
                    </div>
                  )}
                  {lead.call_notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Call Notes</p>
                      <p className="text-sm mt-1">{lead.call_notes}</p>
                    </div>
                  )}
                  {lead.call_remark && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Call Remark</p>
                      <p className="text-sm mt-1">{lead.call_remark}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Disposition Section */}
            <DispositionSection
              lead={lead}
              updateLead={updateLead}
              refreshLead={fetchLeadDetails}
              fireToast={() => {}}
            />

            {/* Call History */}
            {lead.calls && lead.calls.length > 0 && (
              <CallHistory calls={lead.calls} />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

