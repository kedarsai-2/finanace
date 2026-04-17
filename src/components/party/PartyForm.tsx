import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormSection } from "@/components/business/FormSection";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties } from "@/hooks/useParties";
import { INDIAN_STATES, type Business } from "@/types/business";
import type { Party } from "@/types/party";
import { partyFormSchema, type PartyFormValues } from "@/lib/partySchema";
import { emptyToUndef } from "@/lib/businessSchema";
import { cn } from "@/lib/utils";

interface Props {
  mode: "new" | "edit";
  partyId?: string;
}

const TYPE_HINT: Record<PartyFormValues["type"], string> = {
  customer: "Used in sales invoices.",
  supplier: "Used in purchase bills.",
  both: "Available in invoices and purchases.",
};

export function PartyForm({ mode, partyId }: Props) {
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const { allParties, upsert, hydrated } = useParties();
  const activeBusiness: Business | undefined = businesses.find((b) => b.id === activeId);

  const existing = useMemo(
    () => (partyId ? allParties.find((p) => p.id === partyId) : undefined),
    [partyId, allParties],
  );

  const [submitting, setSubmitting] = useState(false);

  const defaults: PartyFormValues = useMemo(() => {
    const opening = existing?.openingBalance ?? 0;
    return {
      name: existing?.name ?? "",
      type: existing?.type ?? "customer",
      mobile: existing?.mobile ?? "",
      email: existing?.email ?? "",
      address: {
        line1: existing?.address?.line1 ?? "",
        city: existing?.address?.city ?? existing?.city ?? "",
        state: existing?.address?.state ?? existing?.state ?? "",
        pincode: existing?.address?.pincode ?? "",
      },
      gstNumber: existing?.gstNumber ?? "",
      panNumber: existing?.panNumber ?? "",
      creditLimit: existing?.creditLimit,
      paymentTermsDays: existing?.paymentTermsDays,
      openingAmount: Math.abs(opening),
      balanceSide: opening < 0 ? "payable" : "receivable",
    };
  }, [existing]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const errMsg = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;

  const onSubmit = handleSubmit(
    (values) => {
      if (!activeId) {
        toast.error("Select an active business first");
        return;
      }
      setSubmitting(true);
      try {
        const opening =
          values.openingAmount > 0
            ? values.balanceSide === "payable"
              ? -values.openingAmount
              : values.openingAmount
            : 0;

        const address = {
          line1: emptyToUndef(values.address.line1),
          city: emptyToUndef(values.address.city),
          state: emptyToUndef(values.address.state),
          pincode: emptyToUndef(values.address.pincode),
        };

        const party: Party = {
          id: existing?.id ?? `p_${Date.now()}`,
          businessId: existing?.businessId ?? activeId,
          name: values.name.trim(),
          type: values.type,
          mobile: emptyToUndef(values.mobile) ?? "",
          email: emptyToUndef(values.email),
          address,
          city: address.city,
          state: address.state,
          gstNumber: emptyToUndef(values.gstNumber)?.toUpperCase(),
          panNumber: emptyToUndef(values.panNumber)?.toUpperCase(),
          creditLimit: values.creditLimit && values.creditLimit > 0 ? values.creditLimit : undefined,
          paymentTermsDays:
            values.paymentTermsDays && values.paymentTermsDays > 0
              ? values.paymentTermsDays
              : undefined,
          openingBalance: opening || undefined,
          balance: opening,
        };
        upsert(party);
        toast.success(mode === "edit" ? "Party updated" : "Party added");
        navigate({ to: "/parties", search: { q: "", type: "all" } });
      } catch {
        toast.error("Could not save party");
      } finally {
        setSubmitting(false);
      }
    },
    () => toast.error("Please fix the highlighted fields"),
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-16">
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link to="/parties" search={{ q: "", type: "all" }} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {mode === "edit" ? "Edit Party" : "Add Party"}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/parties", search: { q: "", type: "all" } })}
            >
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting || !hydrated} className="gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </header>

      <form className="mx-auto max-w-3xl space-y-6 px-6 py-8" onSubmit={onSubmit}>
        <FormSection step={1} title="Basic Info" description="Who are you transacting with?">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Party name *</Label>
              <Input
                id="name"
                placeholder="e.g. Acme Industries"
                aria-invalid={!!errors.name}
                {...register("name")}
                className={cn(errors.name && "border-destructive")}
              />
              {errMsg(errors.name?.message)}
            </div>
            <div>
              <Label htmlFor="type">Party type *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {TYPE_HINT[field.value]}
                    </p>
                  </>
                )}
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile number</Label>
              <Input
                id="mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                aria-invalid={!!errors.mobile}
                {...register("mobile")}
                className={cn(errors.mobile && "border-destructive")}
              />
              {errMsg(errors.mobile?.message)}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@party.com"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={cn(errors.email && "border-destructive")}
              />
              {errMsg(errors.email?.message)}
            </div>
          </div>
        </FormSection>

        <FormSection step={2} title="Address">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="line1">Address line 1</Label>
              <Input id="line1" placeholder="Street, building" {...register("address.line1")} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("address.city")} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Controller
                control={control}
                name="address.state"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                inputMode="numeric"
                maxLength={6}
                aria-invalid={!!errors.address?.pincode}
                {...register("address.pincode")}
                className={cn(errors.address?.pincode && "border-destructive")}
              />
              {errMsg(errors.address?.pincode?.message)}
            </div>
          </div>
        </FormSection>

        <FormSection step={3} title="Tax Details" description="Optional. Required only for GST invoicing.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gstNumber">GST number</Label>
              <Input
                id="gstNumber"
                placeholder="29ABCDE1234F2Z5"
                style={{ textTransform: "uppercase" }}
                aria-invalid={!!errors.gstNumber}
                {...register("gstNumber")}
                className={cn(errors.gstNumber && "border-destructive")}
              />
              {errMsg(errors.gstNumber?.message)}
            </div>
            <div>
              <Label htmlFor="panNumber">PAN number</Label>
              <Input
                id="panNumber"
                placeholder="ABCDE1234F"
                style={{ textTransform: "uppercase" }}
                aria-invalid={!!errors.panNumber}
                {...register("panNumber")}
                className={cn(errors.panNumber && "border-destructive")}
              />
              {errMsg(errors.panNumber?.message)}
            </div>
          </div>
        </FormSection>

        <FormSection step={4} title="Credit Settings">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="creditLimit">Credit limit</Label>
              <Input
                id="creditLimit"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                aria-invalid={!!errors.creditLimit}
                {...register("creditLimit", {
                  setValueAs: (v) =>
                    v === "" || v === null ? undefined : Number(v),
                })}
                className={cn(errors.creditLimit && "border-destructive")}
              />
              {errMsg(errors.creditLimit?.message)}
            </div>
            <div>
              <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
              <Input
                id="paymentTermsDays"
                type="number"
                min={0}
                max={365}
                placeholder="e.g. 30"
                aria-invalid={!!errors.paymentTermsDays}
                {...register("paymentTermsDays", {
                  setValueAs: (v) =>
                    v === "" || v === null ? undefined : Number(v),
                })}
                className={cn(errors.paymentTermsDays && "border-destructive")}
              />
              {errMsg(errors.paymentTermsDays?.message)}
            </div>
          </div>
        </FormSection>

        <FormSection
          step={5}
          title="Opening Balance"
          description="Creates an initial ledger entry for this party."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <Label htmlFor="openingAmount">Amount</Label>
              <Input
                id="openingAmount"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                aria-invalid={!!errors.openingAmount}
                {...register("openingAmount", { valueAsNumber: true })}
                className={cn(errors.openingAmount && "border-destructive")}
              />
              {errMsg(errors.openingAmount?.message)}
            </div>
            <div>
              <Label>Balance type</Label>
              <Controller
                control={control}
                name="balanceSide"
                render={({ field }) => (
                  <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1">
                    {(["receivable", "payable"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => field.onChange(side)}
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
                          field.value === side
                            ? side === "receivable"
                              ? "bg-success/10 text-success shadow-sm"
                              : "bg-destructive/10 text-destructive shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:hidden">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/parties", search: { q: "", type: "all" } })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
