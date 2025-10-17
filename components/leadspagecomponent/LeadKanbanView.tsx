"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import DispositionSection from "@/components/leadsdetailscomponent/DispositionSection";
import CallHistory from "@/components/leadsdetailscomponent/CallHistory";
import { Phone, Mail, MapPin, ChevronLeft, ChevronRight, Tag, DollarSign, Calendar, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function LeadKanbanView({
  data = [],
  onReload,
}: {
  data: any[];
  onReload?: () => void;
}) {
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [leadList, setLeadList] = useState<any[]>([]);
  const [leadIndex, setLeadIndex] = useState<number>(-1);
  const [localData, setLocalData] = useState<any[]>([]);

  const fireToast = () => {
    toast.success("Lead updated successfully!");
  };

  useEffect(() => {
    setLocalData(data);
    setLeadList(data.map((lead) => lead.whalesync_postgres_id));
  }, [data]);

  const stages = [
    "New",
    "In Discussion / Nurturing",
    "Contact Attempted",
    "Connected",
    "Converted",
  ];

  const normalize = (s: string) => s.replace(/\s+/g, "_").toLowerCase();

  const grouped = stages.map((stage) => ({
    stage,
    id: normalize(stage),
    leads: localData.filter(
      (lead) => normalize(lead.stage || "") === normalize(stage)
    ),
  }));

  // 🔹 Fetch lead details
  const fetchLeadDetails = async (leadId: string) => {
    if (!leadId) return;
    setLoadingLead(true);
    const { data, error } = await supabase
      .from("Leads")
      .select(
        `
        whalesync_postgres_id, name, email, mobile, city, services, source, stage,
        deal_amount, client_budget, follow_up_date, expected_closing,
        any_other_interests, call_notes, lead_tag, call_remark,
        assigned_to (whalesync_postgres_id, full_name, profile_photo),
        calls (whalesync_postgres_id, call_type, call_date, duration, ai_call_summary, sentiment)
      `
      )
      .eq("whalesync_postgres_id", leadId)
      .single();

    setLoadingLead(false);
    if (error) {
      console.error("❌ Error fetching lead:", error);
      alert("Failed to fetch lead details. Check console.");
      return;
    }

    setSelectedLead(data);
    setLeadIndex(leadList.indexOf(leadId));
  };

  // 🔹 Update lead
  const updateLead = async (payload: any) => {
    if (!selectedLead) return false;
    const { error } = await supabase
      .from("Leads")
      .update(payload)
      .eq("whalesync_postgres_id", selectedLead.whalesync_postgres_id);
    if (error) {
      alert("Update failed: " + error.message);
      return false;
    }
    fireToast();
    onReload?.();
    fetchLeadDetails(selectedLead.whalesync_postgres_id);
    return true;
  };

  // 🔹 Navigation inside modal
  const handleNavigate = (dir: "prev" | "next") => {
    const newIndex = dir === "prev" ? leadIndex - 1 : leadIndex + 1;
    if (newIndex >= 0 && newIndex < leadList.length) {
      fetchLeadDetails(leadList[newIndex]);
    }
  };

  // 🔹 Drag & Drop handler
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;

    const destStage =
      stages.find((s) => normalize(s) === destination.droppableId) ||
      destination.droppableId;

    // Optimistically update UI
    const updated = localData.map((lead) =>
      lead.whalesync_postgres_id === draggableId
        ? { ...lead, stage: destStage }
        : lead
    );
    setLocalData(updated);

    // Update in Supabase
    const { error } = await supabase
      .from("Leads")
      .update({ stage: destStage })
      .eq("whalesync_postgres_id", draggableId);

    if (error) {
      console.error("❌ Supabase update failed:", error);
      alert("Failed to update lead stage.");
      return;
    }

    fireToast();
    onReload?.();
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

  const initials = selectedLead?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="w-full pb-4">
      {/* 🧩 Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
          {grouped.map((col) => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col rounded-lg p-2 border border-border bg-muted/30"
                >
                  <Card className="shadow-none border-none bg-transparent">
                    <CardHeader className="pb-1 px-2 pt-0 text-center space-y-0">
                      <CardTitle className="text-sm font-semibold mb-0.5">
                        {col.stage}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {col.leads.length} Leads
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2 px-2 pb-2">
                      {col.leads.map((lead, index) => (
                        <Draggable
                          key={lead.whalesync_postgres_id}
                          draggableId={lead.whalesync_postgres_id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() =>
                                fetchLeadDetails(lead.whalesync_postgres_id)
                              }
                              className={`bg-card border border-border rounded-md p-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                                snapshot.isDragging
                                  ? "rotate-1 scale-[1.02] shadow-lg"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {lead.assigned_to?.profile_photo ? (
                                  <img
                                    src={lead.assigned_to.profile_photo}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                    {lead.name?.charAt(0)?.toUpperCase() || "?"}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {lead.name || "Unnamed Lead"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lead.services || "—"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2 flex justify-between items-center gap-2">
                                <p className="text-xs text-muted-foreground truncate flex-1">
                                  {lead.city || "No city"}
                                </p>
                                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                  {lead.assigned_to?.full_name || "Unassigned"}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* 💎 Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  {selectedLead?.assigned_to?.profile_photo && (
                    <AvatarImage src={selectedLead.assigned_to.profile_photo} alt={selectedLead.name || "Lead"} />
                  )}
                  <AvatarFallback className="text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">{selectedLead?.name}</h2>
                    {selectedLead?.stage && (
                      <Badge className={getStageColor(selectedLead.stage)}>
                        {selectedLead.stage}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {selectedLead?.mobile && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedLead.mobile}
                      </div>
                    )}
                    {selectedLead?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedLead.email}
                      </div>
                    )}
                    {selectedLead?.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedLead.city}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleNavigate("prev")}
                  disabled={leadIndex <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleNavigate("next")}
                  disabled={leadIndex >= leadList.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {loadingLead ? (
            <div className="text-center text-muted-foreground py-12 animate-pulse">
              <div className="h-8 w-8 mx-auto mb-4 animate-spin border-2 border-muted border-t-primary rounded-full"></div>
              <p>Loading lead details...</p>
            </div>
          ) : selectedLead ? (
            <div className="space-y-6 mt-4">
              {/* Lead Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Service & Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Service</p>
                      <p className="font-medium">{selectedLead.services || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Source</p>
                      <p className="font-medium">{selectedLead.source || "-"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Deal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Deal Amount</p>
                      <p className="font-medium">
                        {selectedLead.deal_amount ? `₹${selectedLead.deal_amount.toLocaleString()}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Client Budget</p>
                      <p className="font-medium">{selectedLead.client_budget || "-"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Disposition Section */}
              <DispositionSection
                lead={selectedLead}
                updateLead={updateLead}
                refreshLead={() => fetchLeadDetails(selectedLead.whalesync_postgres_id)}
                fireToast={fireToast}
              />

              {/* Call History */}
              {selectedLead.calls && selectedLead.calls.length > 0 && (
                <CallHistory calls={selectedLead.calls} />
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

