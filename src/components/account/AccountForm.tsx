import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAccounts } from "@/hooks/useAccounts";
import { useBusinesses } from "@/hooks/useBusinesses";
import {
  ACCOUNT_TYPE_LABEL,
  type Account,
  type AccountType,
} from "@/types/account";

const schema = z.object({
  name: z.string().trim().min(1, "Account name is required"),
  type: z.enum(["cash", "bank", "upi"]),
  openingBalance: z.coerce.number().default(0),
  accountNumber: z.string().trim().optional(),
  ifsc: z.string().trim().optional(),
  upiId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  account?: Account;
  mode: "create" | "edit";
}

export function AccountForm({ account, mode }: Props) {
  const navigate = useNavigate();
  const { activeId } = useBusinesses();
  const { upsert } = useAccounts(activeId, []);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "bank",
      openingBalance: account?.openingBalance ?? 0,
      accountNumber: account?.accountNumber ?? "",
      ifsc: account?.ifsc ?? "",
      upiId: account?.upiId ?? "",
      notes: account?.notes ?? "",
    },
  });

  const type = form.watch("type");

  const onSubmit = (values: FormValues) => {
    if (!activeId) {
      toast.error("Select a business first");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Account = {
        id: account?.id ?? `acc_${Date.now()}`,
        businessId: account?.businessId ?? activeId,
        name: values.name,
        type: values.type as AccountType,
        openingBalance: Number(values.openingBalance) || 0,
        accountNumber: values.accountNumber || undefined,
        ifsc: values.ifsc || undefined,
        upiId: values.upiId || undefined,
        notes: values.notes || undefined,
        createdAt: account?.createdAt ?? new Date().toISOString(),
      };
      upsert(payload);
      toast.success(mode === "create" ? "Account added" : "Account updated");
      navigate({ to: "/accounts" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Account details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Account name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. HDFC Current ****1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {ACCOUNT_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" className="text-right tabular-nums" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === "bank" && (
              <>
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account number</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ifsc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
            {type === "upi" && (
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <Label>UPI ID</Label>
                    <FormControl>
                      <Input placeholder="name@bank" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/accounts" })}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            <Save className="h-4 w-4" /> Save account
          </Button>
        </div>
      </form>
    </Form>
  );
}
