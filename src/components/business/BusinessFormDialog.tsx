import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Business } from "@/types/business";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Business | null;
  onSave: (b: Business) => void;
}

const empty = { name: "", gstNumber: "", city: "", state: "", logoUrl: "" };

export function BusinessFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        gstNumber: initial?.gstNumber ?? "",
        city: initial?.city ?? "",
        state: initial?.state ?? "",
        logoUrl: initial?.logoUrl ?? "",
      });
    }
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) return;
    onSave({
      id: initial?.id ?? `b_${Date.now()}`,
      name: form.name.trim(),
      gstNumber: form.gstNumber.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      logoUrl: form.logoUrl.trim() || undefined,
      hasData: initial?.hasData,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit business" : "Add business"}</DialogTitle>
          <DialogDescription>
            Manage details for this business profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Business name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Pvt Ltd"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gst">GST number</Label>
            <Input
              id="gst"
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              placeholder="29ABCDE1234F2Z5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initial ? "Save changes" : "Add business"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
