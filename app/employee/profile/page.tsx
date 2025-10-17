"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Building2, Briefcase, CreditCard, FileText,
  IdCard, UserCircle
} from "lucide-react";
import { toast } from "sonner";
import { usePageContext } from "@/contexts/PageContext";

interface EmployeeProfile {
  whalesync_postgres_id: string;
  full_name: string;
  official_email: string;
  official_contact_number?: string;
  personal_email?: string;
  personal_contact_number?: string;
  profile_photo?: string;
  employee_id?: string;
  date_of_joining?: string;
  dob?: string;
  employment_type?: string;
  work_mode?: string;
  status?: string;
  current_address?: string;
  permanent_address?: string;
  pan_number?: string;
  aadhar_number?: string;
  uan_number?: string;
  linkedin_profile?: string;
  emergency_contact_details?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setSubtitle } = usePageContext();

  useEffect(() => {
    setSubtitle("View and manage your profile information");
    loadProfile();
  }, [setSubtitle]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Please log in to view profile");
        return;
      }

      const { data, error } = await supabase
        .from("Employee Directory")
        .select("*")
        .eq("official_email", user.email)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } else {
        setProfile(data);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Profile not found</p>
              <p className="text-sm text-muted-foreground">Please contact your administrator</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-32 w-32 border-4 border-border">
              {profile.profile_photo && (
                <AvatarImage src={profile.profile_photo} alt={profile.full_name} />
              )}
              <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                <p className="text-muted-foreground">{profile.official_email}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {profile.status && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                    {profile.status}
                  </Badge>
                )}
                {profile.employment_type && (
                  <Badge variant="outline">{profile.employment_type}</Badge>
                )}
                {profile.work_mode && (
                  <Badge variant="outline">{profile.work_mode}</Badge>
                )}
              </div>

              {profile.employee_id && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center md:justify-start">
                  <IdCard className="h-4 w-4" />
                  <span>Employee ID: {profile.employee_id}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Official Email</p>
              <p className="text-sm font-medium mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profile.official_email}
              </p>
            </div>
            {profile.official_contact_number && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Official Contact</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profile.official_contact_number}
                </p>
              </div>
            )}
            {profile.personal_email && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Personal Email</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.personal_email}
                </p>
              </div>
            )}
            {profile.personal_contact_number && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Personal Contact</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profile.personal_contact_number}
                </p>
              </div>
            )}
            {profile.linkedin_profile && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">LinkedIn</p>
                <a 
                  href={profile.linkedin_profile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium mt-1 text-primary hover:underline"
                >
                  View LinkedIn Profile
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.date_of_joining && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Date of Joining</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile.date_of_joining).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            {profile.employment_type && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Employment Type</p>
                <p className="text-sm font-medium mt-1">{profile.employment_type}</p>
              </div>
            )}
            {profile.work_mode && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Work Mode</p>
                <p className="text-sm font-medium mt-1">{profile.work_mode}</p>
              </div>
            )}
            {profile.status && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                <Badge className="mt-1">{profile.status}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.dob && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Date of Birth</p>
                <p className="text-sm font-medium mt-1">
                  {new Date(profile.dob).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            {profile.current_address && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Current Address</p>
                <p className="text-sm font-medium mt-1 flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{profile.current_address}</span>
                </p>
              </div>
            )}
            {profile.permanent_address && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Permanent Address</p>
                <p className="text-sm font-medium mt-1 flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{profile.permanent_address}</span>
                </p>
              </div>
            )}
            {profile.emergency_contact_details && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Emergency Contact</p>
                <p className="text-sm font-medium mt-1">{profile.emergency_contact_details}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Government IDs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Government IDs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.pan_number && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">PAN Number</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {profile.pan_number}
                </p>
              </div>
            )}
            {profile.aadhar_number && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Aadhar Number</p>
                <p className="text-sm font-medium mt-1 flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  {profile.aadhar_number}
                </p>
              </div>
            )}
            {profile.uan_number && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">UAN Number</p>
                <p className="text-sm font-medium mt-1">{profile.uan_number}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

