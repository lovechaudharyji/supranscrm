"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, PhoneOff, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function DispositionSection({ lead, updateLead, refreshLead }: any) {
  const [action, setAction] = useState<"dispose" | "connected">("connected");
  const [disposeStep, setDisposeStep] = useState(1);
  const [disposeReason, setDisposeReason] = useState("");
  const [disposeRemark, setDisposeRemark] = useState("");
  const [connectedStep, setConnectedStep] = useState(1);
  const [interest, setInterest] = useState("");
  const [discovery, setDiscovery] = useState("");
  const [purchaseTimeline, setPurchaseTimeline] = useState("");
  const [stageUpdate, setStageUpdate] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [connectedRemark, setConnectedRemark] = useState("");

  const resetDispose = () => {
    setDisposeStep(1);
    setDisposeReason("");
    setDisposeRemark("");
  };

  const resetConnected = () => {
    setConnectedStep(1);
    setInterest("");
    setDiscovery("");
    setPurchaseTimeline("");
    setStageUpdate("");
    setSelectedTag("");
    setConnectedRemark("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl">
            {action === "connected" ? "Call Connected Disposition" : "Call Not Connected"}
          </CardTitle>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAction("connected");
                resetDispose();
              }}
              variant={action === "connected" ? "default" : "outline"}
              className="gap-2"
            >
              <PhoneCall className="h-4 w-4" />
              Connected
            </Button>

            <Button
              onClick={() => {
                setAction("dispose");
                resetConnected();
              }}
              variant={action === "dispose" ? "destructive" : "outline"}
              className="gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              Not Connected
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* DISPOSE LEAD FLOW */}
        {action === "dispose" && (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center">
                  <Badge
                    variant={disposeStep >= step ? "default" : "outline"}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    {step}
                  </Badge>
                  {step < 2 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        disposeStep > step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Reason */}
            {disposeStep === 1 && (
              <div className="space-y-4">
                <Label className="text-2xl font-bold">Reason for Not Connecting</Label>
                <RadioGroup value={disposeReason} onValueChange={setDisposeReason} className="flex flex-wrap gap-4">
                  {["Did not pick", "Busy", "User disconnected", "Switch off"].map((reason) => (
                    <div key={reason} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason} id={reason} />
                      <Label htmlFor={reason} className="cursor-pointer">
                        {reason}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Remarks */}
            {disposeStep === 2 && (
              <div className="space-y-4">
                <Label htmlFor="dispose-remark" className="text-2xl font-bold">Additional Remarks</Label>
                <Textarea
                  id="dispose-remark"
                  rows={4}
                  value={disposeRemark}
                  onChange={(e) => setDisposeRemark(e.target.value)}
                  placeholder="Add any additional notes..."
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  disposeStep === 1
                    ? setAction("connected")
                    : setDisposeStep(disposeStep - 1)
                }
              >
                {disposeStep === 1 ? "Cancel" : <><ChevronLeft className="h-4 w-4 mr-2" /> Back</>}
              </Button>

              {disposeStep < 2 ? (
                <Button
                  disabled={!disposeReason}
                  onClick={() => setDisposeStep(2)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    const ok = await updateLead({
                      call_remark: disposeRemark || disposeReason,
                      stage: "Contact Attempted",
                      lead_tag: "Not Connected",
                    });
                    if (ok) {
                      toast.success("Lead updated successfully");
                      resetDispose();
                      setAction("connected");
                      await refreshLead();
                    }
                  }}
                >
                  Submit
                </Button>
              )}
            </div>
          </>
        )}

        {/* CONNECTED LEAD FLOW */}
        {action === "connected" && (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center flex-shrink-0">
                  <Badge
                    variant={connectedStep >= step ? "default" : "outline"}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    {step}
                  </Badge>
                  {step < 6 && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${
                        connectedStep > step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Interest Level */}
            {connectedStep === 1 && (
              <div className="space-y-4">
                <Label className="text-2xl font-bold">Customer Interest Level</Label>
                <RadioGroup value={interest} onValueChange={setInterest} className="flex flex-wrap gap-4">
                  {["Very Interested", "Moderately Interested", "Not Interested"].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={opt} />
                      <Label htmlFor={opt} className="cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Discovery Source */}
            {connectedStep === 2 && (
              <div className="space-y-4">
                <Label className="text-2xl font-bold">How did they discover us?</Label>
                <RadioGroup value={discovery} onValueChange={setDiscovery} className="flex flex-wrap gap-4">
                  {["Referral", "Social Media", "Online Search", "Other"].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={opt} />
                      <Label htmlFor={opt} className="cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Purchase Timeline */}
            {connectedStep === 3 && (
              <div className="space-y-4">
                <Label htmlFor="timeline" className="text-2xl font-bold">Purchase Timeline</Label>
                <RadioGroup value={purchaseTimeline} onValueChange={setPurchaseTimeline} className="flex flex-wrap gap-4">
                  {[
                    { value: "Immediate", label: "Immediate (Within 1 week)" },
                    { value: "1 Month", label: "Within 1 Month" },
                    { value: "3 Months", label: "Within 3 Months" },
                    { value: "6 Months", label: "Within 6 Months" },
                    { value: "Not Sure", label: "Not Sure" }
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 4: WhatsApp Follow-up */}
            {connectedStep === 4 && (
              <div className="space-y-4 text-center">
                <Label className="text-2xl font-bold">Send Follow-up Message</Label>
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${lead.mobile}?text=${encodeURIComponent(
                        `Hi ${lead.name}, thanks for your interest in our services!`
                      )}`,
                      "_blank"
                    )
                  }
                >
                  <PhoneCall className="h-4 w-4" />
                  Send WhatsApp Message
                </Button>
              </div>
            )}

            {/* Step 5: Update Stage */}
            {connectedStep === 5 && (
              <div className="space-y-4">
                <Label htmlFor="stage" className="text-2xl font-bold">Update Lead Stage</Label>
                <RadioGroup value={stageUpdate} onValueChange={setStageUpdate} className="flex flex-wrap gap-4">
                  {[
                    "New", "Assigned", "Contact Attempted", "Connected", 
                    "Qualified", "Converted", "Closed – Lost"
                  ].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <RadioGroupItem value={stage} id={stage} />
                      <Label htmlFor={stage} className="cursor-pointer">{stage}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 6: Tag & Remarks */}
            {connectedStep === 6 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-2xl font-bold">Lead Classification</Label>
                  <RadioGroup value={selectedTag} onValueChange={setSelectedTag} className="mt-2 flex flex-wrap gap-4">
                    {["High Priority", "Long-term", "Enterprise"].map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <RadioGroupItem value={tag} id={tag} />
                        <Label htmlFor={tag} className="cursor-pointer">{tag}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="connected-remark" className="text-2xl font-bold">Call Notes</Label>
                  <Textarea
                    id="connected-remark"
                    rows={4}
                    value={connectedRemark}
                    onChange={(e) => setConnectedRemark(e.target.value)}
                    placeholder="Add notes from the call..."
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  connectedStep === 1
                    ? setAction("connected")
                    : setConnectedStep(connectedStep - 1)
                }
              >
                {connectedStep === 1 ? "Cancel" : <><ChevronLeft className="h-4 w-4 mr-2" /> Back</>}
              </Button>

              {connectedStep < 6 ? (
                <Button onClick={() => setConnectedStep(connectedStep + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    const ok = await updateLead({
                      stage: stageUpdate || "Connected",
                      source: discovery || lead.source || null,
                      call_remark: connectedRemark || interest || null,
                      lead_tag: selectedTag || null,
                    });
                    if (ok) {
                      toast.success("Lead updated successfully");
                      resetConnected();
                      await refreshLead();
                    }
                  }}
                >
                  Submit
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
