import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties } from "@/hooks/useParties";
import { GST_REGEX, MOBILE_REGEX } from "@/types/business";
import type { Party } from "@/types/party";

interface QuickAddPartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the party is created. The newly created party is provided so the parent can auto-select it. */
  onCreated?: (party: Party) => void;
}

interface FormState {
  name: string;
  mobile: string;
  gstNumber: string;
}

interface FormErrors {
  name?: string;
  mobile?: string;
  gstNumber?: string;
}

const EMPTY: FormState = {
  name: "",
  mobile: "",
  gstNumber: "",
};

export function QuickAddPartyDialog({ open, onOpenChange, onCreated }: QuickAddPartyDialogProps) {
  const { activeId } = useBusinesses();
  const { upsert } = useParties(activeId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setForm(EMPTY);
    setErrors({});
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Party name is required";
    if (form.mobile && !MOBILE_REGEX.test(form.mobile.trim())) {
      next.mobile = "Enter a valid 10-digit mobile";
    }
    if (form.gstNumber && !GST_REGEX.test(form.gstNumber.trim().toUpperCase())) {
      next.gstNumber = "Invalid GST format (e.g. 29ABCDE1234F2Z5)";
    }
    return next;
  };

  const handleSave = () => {
    if (!activeId || activeId === "__all__") {
      toast.error("Select an active business first");
      return;
    }
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    (async () => {
      try {
        const party: Party = {
          id: "",
          businessId: activeId,
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          gstNumber: form.gstNumber.trim().toUpperCase() || undefined,
          balance: 0,
        };
        const saved = await upsert(party);
        toast.success(`${saved.name} added`);
        onCreated?.(saved);
        handleOpenChange(false);
      } catch {
        toast.error("Could not save party");
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Quick add party</DialogTitle>
              <DialogDescription>Create a new party and use it instantly.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field label="Party name" required error={errors.name}>
            <Input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Industries"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </Field>

          <Field label="Mobile" error={errors.mobile}>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
              placeholder="10-digit number"
            />
          </Field>

          <Field label="GST number" error={errors.gstNumber}>
            <Input
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
              placeholder="Optional"
              className="font-mono uppercase"
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            Save & Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
