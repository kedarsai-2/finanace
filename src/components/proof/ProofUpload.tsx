import { Upload, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

const MAX_PROOF_BYTES = 2 * 1024 * 1024; // 2 MB

interface Props {
  label?: string;
  required?: boolean;
  proofDataUrl?: string;
  proofName?: string;
  onChange: (proof: { proofDataUrl?: string; proofName?: string }) => void;
  disabled?: boolean;
  /** Optional id used to scope the file input + label association. */
  id?: string;
}

/**
 * Reusable proof image uploader. Uploads to Cloudinary and stores secure URL.
 * Shared by Invoices / Purchases / Payments / Expenses.
 */
export function ProofUpload({
  label = "Proof",
  required = false,
  proofDataUrl,
  proofName,
  onChange,
  disabled,
  id,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) {
      onChange({ proofDataUrl: undefined, proofName: undefined });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Proof must be an image");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Proof image must be under 2 MB");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadImageToCloudinary(file);
      onChange({
        proofDataUrl: uploaded.secureUrl,
        proofName: uploaded.originalFilename,
      });
      toast.success("Proof image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload proof image";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label htmlFor={id}>
        {label} {required ? "*" : "(optional)"}
      </Label>
      {proofDataUrl ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
          <img src={proofDataUrl} alt="proof" className="h-9 w-9 rounded object-cover" />
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {proofName ?? "Proof image"}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => handleFile(null)}
            disabled={disabled || uploading}
            aria-label="Remove proof"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted/40",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          {required ? "Upload proof image (required)" : "Upload proof image"}
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      {uploading && (
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading image to Cloudinary...
        </div>
      )}
    </div>
  );
}
