"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Phone, Mail, MapPin, Briefcase, Calendar as CalendarIcon, 
  DollarSign, User, ChevronLeft, Building2, Tag,
  MessageCircle, Clock, Edit2, Save, X, CalendarDays
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
  current_business_turnover: string | null;
  date_and_time: string | null;
  follow_up_day: string | null;
  follow_up_date: string | null;
  call_remark: string | null;
  assigned_to?: {
    whalesync_postgres_id: string;
    full_name: string;
    profile_photo: string;
  } | null;
}

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("Leads")
      .select(`
        whalesync_postgres_id, name, email, mobile, city, services, source, stage,
        deal_amount, client_budget, current_business_turnover, date_and_time, follow_up_day, follow_up_date, call_remark, assigned_to,
        assigned_to (whalesync_postgres_id, full_name, profile_photo)
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

  const handleEdit = () => {
    if (lead) {
      setEditData({
        services: lead.services,
        source: lead.source,
        follow_up_day: lead.follow_up_day,
        follow_up_date: lead.follow_up_date,
        call_remark: lead.call_remark,
        deal_amount: lead.deal_amount,
        client_budget: lead.client_budget,
        current_business_turnover: lead.current_business_turnover,
      });
      // Initialize calendar date if follow_up_date exists
      if (lead.follow_up_date) {
        setFollowUpDate(new Date(lead.follow_up_date));
      } else {
        setFollowUpDate(undefined);
      }
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!lead) return;
    
    // Include the selected follow-up date in the update
    const updateData = {
      ...editData,
      follow_up_date: followUpDate ? followUpDate.toISOString() : null,
    };
    
    const success = await updateLead(updateData);
    if (success) {
      setIsEditing(false);
      setEditData({});
      setFollowUpDate(undefined);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setFollowUpDate(undefined);
  };

  const getStageColor = (stage?: string | null) => {
    switch (stage?.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "not connected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "follow up required":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "converted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "lost":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
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
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 overflow-auto">
            {/* Lead Header Card */}
            <Card className="bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader className="pt-0 pb-2">
                {/* Back Button - Above Photo */}
                <div className="flex items-center mb-0">
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
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
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

            {/* Disposition Section */}
            <DispositionSection
              lead={lead}
              updateLead={updateLead}
              refreshLead={fetchLeadDetails}
              fireToast={() => {}}
            />

            {/* Lead Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact & Service Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact & Service Information
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Service</p>
                      {isEditing ? (
                        <Select value={editData.services || ""} onValueChange={(value) => setEditData({...editData, services: value})}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Brand Development">Brand Development</SelectItem>
                            <SelectItem value="Canton Fair">Canton Fair</SelectItem>
                            <SelectItem value="Video Call">Video Call</SelectItem>
                            <SelectItem value="USA LLC Formation">USA LLC Formation</SelectItem>
                            <SelectItem value="Dropshipping">Dropshipping</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium mt-1">{lead.services || "-"}</p>
                      )}
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
                      <p className="text-xs font-medium text-muted-foreground uppercase">Follow Up Timeline</p>
                      <p className="text-sm font-medium mt-1">{lead.follow_up_day || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Follow Up Date</p>
                      {isEditing ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="mt-1 w-full justify-start text-left font-normal"
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {followUpDate ? format(followUpDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={followUpDate}
                              onSelect={setFollowUpDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <p className="text-sm font-medium mt-1">
                          {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Interest Level</p>
                      <p className="text-sm font-medium mt-1">{lead.call_remark || "-"}</p>
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
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Current Business Turnover</p>
                      <p className="text-sm font-medium mt-1">{lead.current_business_turnover || "-"}</p>
                    </div>
                    <div>
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

