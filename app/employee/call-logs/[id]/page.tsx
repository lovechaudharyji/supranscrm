"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, Mail, MapPin, Calendar, Clock, 
  ChevronLeft, User, PhoneCall, PhoneOff, PhoneMissed
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CallLog {
  whalesync_postgres_id: string;
  client_name?: string;
  client_number?: string;
  duration?: number;
  call_date?: string;
  sentiment?: string;
  call_type?: string;
  service?: string;
  ai_call_summary?: string;
  leads?: {
    services?: string;
  };
}

export default function CallLogDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params?.id as string;

  const [call, setCall] = useState<CallLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCallDetails = async () => {
    if (!callId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("Calls")
      .select(`
        *,
        leads:leads (
          services
        )
      `)
      .eq("whalesync_postgres_id", callId)
      .single();

    if (error) {
      console.error("Error fetching call:", error);
    } else {
      setCall(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCallDetails();
  }, [callId]);

  const getCallTypeIcon = (callType?: string) => {
    switch (callType?.toLowerCase()) {
      case "incoming":
        return <PhoneCall className="h-5 w-5" />;
      case "outgoing":
        return <PhoneCall className="h-5 w-5" />;
      case "missed":
        return <PhoneMissed className="h-5 w-5" />;
      default:
        return <Phone className="h-5 w-5" />;
    }
  };

  const getCallTypeColor = (callType?: string) => {
    switch (callType?.toLowerCase()) {
      case "incoming":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "outgoing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "missed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "interested":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "neutral":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "not interested":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "-";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
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

  if (!call) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-lg font-medium mb-4">Call log not found</p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const service = call.service || call.leads?.services;

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6">
        <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Call Header Card */}
        <Card className="bg-gradient-to-t from-primary/5 to-card shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                {getCallTypeIcon(call.call_type)}
                <div>
                  <h1 className="text-3xl font-bold">{call.client_name || "Unknown Caller"}</h1>
                  <p className="text-muted-foreground">{call.client_number || "No number"}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {call.call_type && (
                    <Badge className={getCallTypeColor(call.call_type)}>
                      {call.call_type}
                    </Badge>
                  )}
                  {call.sentiment && (
                    <Badge className={getSentimentColor(call.sentiment)}>
                      {call.sentiment}
                    </Badge>
                  )}
                  {service && (
                    <Badge variant="outline" className="gap-1">
                      {service}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(call.duration)}</span>
                  </div>
                  {call.call_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(call.call_date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2"
                  onClick={() => window.location.href = `tel:${call.client_number}`}
                  disabled={!call.client_number}
                >
                  <Phone className="h-4 w-4" />
                  Call Back
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Call Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Call Type</p>
                  <p className="text-sm font-medium mt-1">{call.call_type || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Duration</p>
                  <p className="text-sm font-medium mt-1">{formatDuration(call.duration)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Sentiment</p>
                  <p className="text-sm font-medium mt-1">{call.sentiment || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Service</p>
                  <p className="text-sm font-medium mt-1">{service || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Call Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {call.ai_call_summary ? (
                <div>
                  <p className="text-sm">{call.ai_call_summary}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No call summary available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
