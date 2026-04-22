import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormSection } from "@/components/business/FormSection";
import { LogoUpload } from "@/components/business/LogoUpload";
import { useBusinesses } from "@/hooks/useBusinesses";
import { CURRENCIES, INDIAN_STATES, MONTHS, type Business } from "@/types/business";
import { businessFormSchema, type BusinessFormValues } from "@/lib/businessSchema";
import { cn } from "@/lib/utils";
import { USE_BACKEND } from "@/lib/flags";
import { getJwt } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type Mode = "new" | "edit";

interface Props {
  mode: Mode;
  businessId?: string;
}

export function BusinessForm({ mode, businessId }: Props) {
  const navigate = useNavigate();
  const { businesses, upsert, setActiveId, hydrated } = useBusinesses();
  const existing = useMemo(
    () => (businessId ? businesses.find((b) => b.id === businessId) : undefined),
    [businessId, businesses],
  );

  const [submitting, setSubmitting] = useState<"save" | "save-active" | null>(null);

  const defaults: BusinessFormValues = useMemo(
    () => ({
      name: existing?.name ?? "",
      ownerName: existing?.ownerName,
      mobile: existing?.mobile ?? "",
      email: existing?.email,
      billingAddress: existing?.billingAddress ?? {},
      shippingSameAsBilling: existing?.shippingSameAsBilling ?? true,
      shippingAddress: existing?.shippingAddress ?? {},
      gstNumber: existing?.gstNumber,
      panNumber: existing?.panNumber,
      logoUrl: existing?.logoUrl,
      currency: existing?.currency ?? "INR",
      fyStartMonth: existing?.fyStartMonth ?? 4,
    }),
    [existing],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const sameAsBilling = watch("shippingSameAsBilling");
  const logoUrl = watch("logoUrl");

  const onSubmit = (setActive: boolean) =>
    handleSubmit(
      async (values) => {
        setSubmitting(setActive ? "save-active" : "save");
        try {
          const token = getJwt();
          if (USE_BACKEND && !token) {
            toast.error("Please login to continue");
            navigate({ to: "/login" });
            return;
          }
          const billing = values.billingAddress ?? {};

          if (USE_BACKEND) {
            const dto: Record<string, unknown> = {
              id: existing?.id ? parseInt(existing.id, 10) : undefined,
              name: values.name,
              ownerName: values.ownerName || null,
              mobile: values.mobile,
              email: values.email || null,
              logoUrl: values.logoUrl || null,
              gstNumber: values.gstNumber || null,
              panNumber: values.panNumber || null,
              city: billing.city ?? existing?.city ?? "",
              state: billing.state ?? existing?.state ?? "",
              billingLine1: billing.line1 ?? null,
              billingLine2: (billing as { line2?: string }).line2 ?? null,
              billingCity: billing.city ?? null,
              billingState: billing.state ?? null,
              billingPincode: billing.pincode ?? null,
              shippingSameAsBilling: values.shippingSameAsBilling,
              shippingLine1: values.shippingSameAsBilling
                ? (billing.line1 ?? null)
                : (values.shippingAddress?.line1 ?? null),
              shippingLine2: values.shippingSameAsBilling
                ? ((billing as { line2?: string }).line2 ?? null)
                : ((values.shippingAddress as { line2?: string } | undefined)?.line2 ?? null),
              shippingCity: values.shippingSameAsBilling
                ? (billing.city ?? null)
                : (values.shippingAddress?.city ?? null),
              shippingState: values.shippingSameAsBilling
                ? (billing.state ?? null)
                : (values.shippingAddress?.state ?? null),
              shippingPincode: values.shippingSameAsBilling
                ? (billing.pincode ?? null)
                : (values.shippingAddress?.pincode ?? null),
              currency: values.currency || null,
              fyStartMonth: values.fyStartMonth ?? null,
              hasData: existing?.hasData ?? null,
            };
            if (!dto.city || !dto.state) {
              toast.error("Billing city and state are required");
              return;
            }
            if (!existing) delete dto.id;

            const saved = await apiFetch<any>(
              existing ? `/api/businesses/${existing.id}` : "/api/businesses",
              { method: existing ? "PUT" : "POST", body: JSON.stringify(dto) },
            );
            const savedId = String(saved.id);
            if (setActive) setActiveId(savedId);
          } else {
            const business: Business = {
              id: existing?.id ?? `b_${Date.now()}`,
              name: values.name,
              ownerName: values.ownerName,
              mobile: values.mobile,
              email: values.email,
              logoUrl: values.logoUrl,
              gstNumber: values.gstNumber,
              panNumber: values.panNumber,
              billingAddress: billing,
              shippingSameAsBilling: values.shippingSameAsBilling,
              shippingAddress: values.shippingSameAsBilling
                ? billing
                : (values.shippingAddress ?? {}),
              city: billing.city ?? existing?.city ?? "—",
              state: billing.state ?? existing?.state ?? "—",
              currency: values.currency,
              fyStartMonth: values.fyStartMonth,
              hasData: existing?.hasData,
            };
            upsert(business);
            if (setActive) setActiveId(business.id);
          }
          toast.success("Business saved successfully");
          navigate({ to: "/" });
        } catch {
          toast.error("Could not save business");
        } finally {
          setSubmitting(null);
        }
      },
      () => {
        toast.error("Please fix the highlighted fields");
      },
    );

  const errMsg = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link to="/" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {mode === "edit" ? "Editing" : "New"}
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {mode === "edit" ? "Edit Business" : "Add Business"}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" onClick={() => navigate({ to: "/" })}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={onSubmit(false)}
              disabled={submitting !== null || !hydrated}
              className="gap-2"
            >
              {submitting === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
            <Button
              onClick={onSubmit(true)}
              disabled={submitting !== null || !hydrated}
              className="gap-2"
            >
              {submitting === "save-active" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Save & Set Active
            </Button>
          </div>
        </div>
      </header>

      <form className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <FormSection step={1} title="Basic Information" description="Who is this business?">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Business name *</Label>
              <Input
                id="name"
                placeholder="Acme Pvt Ltd"
                aria-invalid={!!errors.name}
                {...register("name")}
                className={cn(errors.name && "border-destructive")}
              />
              {errMsg(errors.name?.message)}
            </div>
            <div>
              <Label htmlFor="ownerName">Owner / contact person</Label>
              <Input id="ownerName" placeholder="Full name" {...register("ownerName")} />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile number *</Label>
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
                placeholder="hello@business.com"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={cn(errors.email && "border-destructive")}
              />
              {errMsg(errors.email?.message)}
            </div>
          </div>
        </FormSection>

        <FormSection step={2} title="Billing Address">
          <AddressFields
            prefix="billingAddress"
            register={register}
            control={control}
            errors={errors.billingAddress as AddressFieldsProps["errors"]}
            onPincode={(p) => {
              // Optional auto-fill hook — wire to a pincode API later.
              if (p.length === 6) {
                // no-op placeholder
              }
            }}
          />
        </FormSection>

        <FormSection step={3} title="Shipping Address">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-3">
            <Controller
              control={control}
              name="shippingSameAsBilling"
              render={({ field }) => (
                <Checkbox
                  id="sameAsBilling"
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(Boolean(c))}
                />
              )}
            />
            <Label htmlFor="sameAsBilling" className="cursor-pointer text-sm font-medium">
              Same as billing address
            </Label>
          </div>
          {!sameAsBilling && (
            <AddressFields
              prefix="shippingAddress"
              register={register}
              control={control}
              errors={errors.shippingAddress as AddressFieldsProps["errors"]}
            />
          )}
        </FormSection>

        <FormSection
          step={4}
          title="Tax & Compliance"
          description="Optional — add later if you don't have these yet."
        >
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

        <FormSection step={5} title="Branding">
          <Controller
            control={control}
            name="logoUrl"
            render={({ field }) => <LogoUpload value={field.value} onChange={field.onChange} />}
          />
          {logoUrl ? null : null}
        </FormSection>

        <FormSection step={6} title="Business Settings">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="currency">Default currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="fyStart">Financial year start</Label>
              <Controller
                control={control}
                name="fyStartMonth"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="fyStart">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:hidden">
          <Button variant="ghost" onClick={() => navigate({ to: "/" })} type="button">
            Cancel
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={onSubmit(false)}
            disabled={submitting !== null}
          >
            {submitting === "save" && <Loader2 className="h-4 w-4 animate-spin" />}
            Save business
          </Button>
          <Button type="button" onClick={onSubmit(true)} disabled={submitting !== null}>
            {submitting === "save-active" && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Set Active
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- helpers ---

interface AddressFieldsProps {
  prefix: "billingAddress" | "shippingAddress";
  register: ReturnType<typeof useForm<BusinessFormValues>>["register"];
  control: ReturnType<typeof useForm<BusinessFormValues>>["control"];
  errors?: { pincode?: { message?: string } };
  onPincode?: (value: string) => void;
}

function AddressFields({ prefix, register, control, errors, onPincode }: AddressFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}.line1`}>Address line 1</Label>
        <Input
          id={`${prefix}.line1`}
          placeholder="Street, building"
          {...register(`${prefix}.line1` as const)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}.line2`}>Address line 2</Label>
        <Input
          id={`${prefix}.line2`}
          placeholder="Area, landmark (optional)"
          {...register(`${prefix}.line2` as const)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}.city`}>City</Label>
        <Input id={`${prefix}.city`} {...register(`${prefix}.city` as const)} />
      </div>
      <div>
        <Label htmlFor={`${prefix}.state`}>State</Label>
        <Controller
          control={control}
          name={`${prefix}.state` as const}
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id={`${prefix}.state`}>
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
        <Label htmlFor={`${prefix}.pincode`}>Pincode</Label>
        <Input
          id={`${prefix}.pincode`}
          inputMode="numeric"
          maxLength={6}
          {...register(`${prefix}.pincode` as const, {
            onChange: (e) => onPincode?.(e.target.value),
          })}
        />
        {errors?.pincode?.message && (
          <p className="mt-1 text-xs text-destructive">{errors.pincode.message}</p>
        )}
      </div>
    </div>
  );
}
