"use client";

import { AnnouncementBanner } from "@/components/announcement-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBanner isAdmin={true} />
      {children}
    </>
  );
}

