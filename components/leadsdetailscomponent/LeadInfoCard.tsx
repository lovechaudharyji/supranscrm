"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadInfo({ lead }: { lead: any }) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Lead Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground">Name</p>
          <p className="font-medium">{lead.name || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium">{lead.email || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Mobile</p>
          <p className="font-medium">{lead.mobile || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">City</p>
          <p className="font-medium">{lead.city || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Source</p>
          <p className="font-medium">{lead.source || "-"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Stage</p>
          <p className="font-medium">{lead.stage || "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

