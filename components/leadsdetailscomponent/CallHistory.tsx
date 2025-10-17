"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, MessageSquare } from "lucide-react";

export default function CallHistory({ calls }: { calls: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calls && calls.length > 0 ? (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.whalesync_postgres_id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {call.call_type || "Call"}
                    </Badge>
                    {call.sentiment && (
                      <Badge
                        variant={
                          call.sentiment.toLowerCase() === "positive"
                            ? "default"
                            : call.sentiment.toLowerCase() === "negative"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {call.sentiment}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {call.call_date && (
                      <span>{new Date(call.call_date).toLocaleString()}</span>
                    )}
                    {call.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{call.duration}s</span>
                      </div>
                    )}
                  </div>
                </div>

                {call.ai_call_summary && (
                  <div className="flex items-start gap-2 mt-3 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{call.ai_call_summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No call history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
