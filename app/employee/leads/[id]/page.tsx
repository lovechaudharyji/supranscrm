"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Phone, Mail, MapPin, Briefcase, Calendar as CalendarIcon, 
  DollarSign, User, ChevronLeft, Building2, Tag,
  MessageCircle, Clock, Edit2, Save, X, CalendarDays
} from "lucide-react";
import DispositionSection from "@/components/leadsdetailscomponent/DispositionSection";
import CallHistory from "@/components/leadsdetailscomponent/CallHistory";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function EmployeeLeadDetailsPage() {
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
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-lg font-medium mb-4">Lead not found</p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const initials = lead.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6">
        <div className="space-y-6">
        {/* Lead Header Card */}
        <Card className="bg-gradient-to-t from-primary/5 to-card shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex flex-col items-center gap-3">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="gap-2 self-start"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <Avatar className="h-20 w-20 border-2 border-border">
                  {lead.assigned_to?.profile_photo && (
                    <AvatarImage src={lead.assigned_to.profile_photo} alt={lead.name || "Lead"} />
                  )}
                  <AvatarFallback className="text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold">{lead.name}</h1>
                  {lead.stage && (
                    <Badge className={getStageColor(lead.stage)}>
                      {lead.stage}
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
                  {isEditing ? (
                    <Select value={editData.source || ""} onValueChange={(value) => setEditData({...editData, source: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Online Search">Online Search</SelectItem>
                        <SelectItem value="Advertisement">Advertisement</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.source || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Date Added</p>
                  <p className="text-sm font-medium mt-1">
                    {lead.date_and_time ? new Date(lead.date_and_time).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Follow Up Timeline</p>
                  {isEditing ? (
                    <Select value={editData.follow_up_day || ""} onValueChange={(value) => setEditData({...editData, follow_up_day: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Within 1 week">Within 1 week</SelectItem>
                        <SelectItem value="Within 1 Month">Within 1 Month</SelectItem>
                        <SelectItem value="Within 3 Months">Within 3 Months</SelectItem>
                        <SelectItem value="Within 6 Months">Within 6 Months</SelectItem>
                        <SelectItem value="Not Sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.follow_up_day || "-"}</p>
                  )}
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
                  {isEditing ? (
                    <Select value={editData.call_remark || ""} onValueChange={(value) => setEditData({...editData, call_remark: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select interest level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Very Interested">Very Interested</SelectItem>
                        <SelectItem value="Moderately Interested">Moderately Interested</SelectItem>
                        <SelectItem value="Not Interested">Not Interested</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.call_remark || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Business Details
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
                  <p className="text-xs font-medium text-muted-foreground uppercase">Deal Amount</p>
                  {isEditing ? (
                    <Select value={editData.deal_amount?.toString() || ""} onValueChange={(value) => setEditData({...editData, deal_amount: parseFloat(value)})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10000">₹10,000</SelectItem>
                        <SelectItem value="25000">₹25,000</SelectItem>
                        <SelectItem value="45000">₹45,000</SelectItem>
                        <SelectItem value="75000">₹75,000</SelectItem>
                        <SelectItem value="100000">₹1,00,000</SelectItem>
                        <SelectItem value="150000">₹1,50,000</SelectItem>
                        <SelectItem value="200000">₹2,00,000</SelectItem>
                        <SelectItem value="500000">₹5,00,000</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {lead.deal_amount ? `₹${lead.deal_amount.toLocaleString()}` : "-"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Client Budget</p>
                  {isEditing ? (
                    <Select value={editData.client_budget || ""} onValueChange={(value) => setEditData({...editData, client_budget: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under ₹10,000">Under ₹10,000</SelectItem>
                        <SelectItem value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</SelectItem>
                        <SelectItem value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</SelectItem>
                        <SelectItem value="₹50,000 - ₹1,00,000">₹50,000 - ₹1,00,000</SelectItem>
                        <SelectItem value="₹1,00,000 - ₹2,50,000">₹1,00,000 - ₹2,50,000</SelectItem>
                        <SelectItem value="Above ₹2,50,000">Above ₹2,50,000</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.client_budget || "-"}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Current Business Turnover</p>
                  {isEditing ? (
                    <Select value={editData.current_business_turnover || ""} onValueChange={(value) => setEditData({...editData, current_business_turnover: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select turnover" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under ₹1 Lakh">Under ₹1 Lakh</SelectItem>
                        <SelectItem value="₹1 Lakh - ₹5 Lakhs">₹1 Lakh - ₹5 Lakhs</SelectItem>
                        <SelectItem value="₹5 Lakhs - ₹10 Lakhs">₹5 Lakhs - ₹10 Lakhs</SelectItem>
                        <SelectItem value="₹10 Lakhs - ₹25 Lakhs">₹10 Lakhs - ₹25 Lakhs</SelectItem>
                        <SelectItem value="₹25 Lakhs - ₹50 Lakhs">₹25 Lakhs - ₹50 Lakhs</SelectItem>
                        <SelectItem value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</SelectItem>
                        <SelectItem value="Above ₹1 Crore">Above ₹1 Crore</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.current_business_turnover || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        </div>
      </div>
    </div>
  );
}




