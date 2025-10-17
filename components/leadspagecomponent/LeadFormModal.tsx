"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

interface LeadFormModalProps {
  lead: any;
  onClose: () => void;
  onSave: () => void;
}

export default function LeadFormModal({
  lead,
  onClose,
  onSave,
}: LeadFormModalProps) {
  const [form, setForm] = useState({
    name: lead?.name || "",
    mobile: lead?.mobile || "",
    email: lead?.email || "",
    city: lead?.city || "",
    services: lead?.services || "",
    stage: lead?.stage || "",
    source: lead?.source || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (lead?.whalesync_postgres_id) {
        // UPDATE EXISTING LEAD
        const { error } = await supabase
          .from("Leads")
          .update({
            name: form.name,
            mobile: form.mobile,
            email: form.email,
            city: form.city,
            services: form.services,
            stage: form.stage,
            source: form.source,
          })
          .eq("whalesync_postgres_id", lead.whalesync_postgres_id);

        if (error) throw error;
      } else {
        // ADD NEW LEAD
        const { data, error } = await supabase
          .from("Leads")
          .insert([
            {
              name: form.name,
              mobile: form.mobile,
              email: form.email,
              city: form.city,
              services: form.services,
              stage: form.stage,
              source: form.source,
              date_and_time: new Date().toISOString(),
              assignment_status: "Unassigned",
            },
          ])
          .select();

        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("❌ Error saving lead:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the lead."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border p-6 rounded-lg shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-foreground">
          {lead?.whalesync_postgres_id ? "Edit Lead" : "New Lead"}
        </h2>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </p>
        )}

        <Input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Input
          placeholder="Mobile"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          required
        />

        <Input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div>
          <label className="block mb-1 text-sm font-medium text-foreground">
            Services
          </label>
          <Select
            value={form.services}
            onValueChange={(v) => setForm({ ...form, services: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Brand Development">Brand Development</SelectItem>
              <SelectItem value="Video Call">Video Call</SelectItem>
              <SelectItem value="Canton Fair">Canton Fair</SelectItem>
              <SelectItem value="USA LLC Formation">
                USA LLC Formation
              </SelectItem>
              <SelectItem value="Dropshipping">Dropshipping</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-foreground">
            Stage
          </label>
          <Select
            value={form.stage}
            onValueChange={(v) => setForm({ ...form, stage: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Connected">Connected</SelectItem>
              <SelectItem value="Contact Attempted">
                Contact Attempted
              </SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="In Discussion / Nurturing">
                In Discussion / Nurturing
              </SelectItem>
              <SelectItem value="New">New</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />

        <Input
          placeholder="Source"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

