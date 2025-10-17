"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ExportButton({ data }: { data: any[] }) {
  const exportCSV = () => {
    const headers = [
      "date_and_time",
      "stage",
      "name",
      "mobile",
      "email",
      "services",
      "city",
      "source",
      "assigned_to",
    ];
    const rows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            if (h === "assigned_to")
              return `"${row.assigned_to?.full_name || ""}"`;
            const v = row[h];
            return typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v || "";
          })
          .join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={exportCSV} className="h-10 gap-2">
      <Download className="h-4 w-4" />
      <span>Export</span>
    </Button>
  );
}

