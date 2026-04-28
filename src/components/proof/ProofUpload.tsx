import { Upload, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import {
  fileToDataUrl,
  parseProofAttachments,
  stringifyProofAttachments,
  type ProofAttachments,
} from "@/lib/proofAttachments";
import { cn } from "@/lib/utils";

const MAX_PROOF_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

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
  const attachments = parseProofAttachments(proofDataUrl, proofName);

  const emit = (next: ProofAttachments) => {
    onChange(stringifyProofAttachments(next));
  };

  const handleImage = async (file: File | null) => {
    if (!file) {
      emit({ ...attachments, imageUrl: undefined, imageName: undefined });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Image attachment must be an image file");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Image attachment must be under 2 MB");
      return;
    }
    setUploading(true);
    try {
      let imageUrl: string;
      let imageName: string;
      try {
        const uploaded = await uploadFileToCloudinary(file, "image");
        imageUrl = uploaded.secureUrl;
        imageName = uploaded.originalFilename;
      } catch {
        // Mobile/offline fallback: keep attachment locally when Cloudinary is unreachable.
        imageUrl = await fileToDataUrl(file);
        imageName = file.name;
        toast.warning("Cloud upload unavailable. Image stored locally.");
      }
      emit({
        ...attachments,
        imageUrl,
        imageName,
      });
      toast.success("Image attachment uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image attachment";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDocument = async (file: File | null) => {
    if (!file) {
      emit({ ...attachments, documentUrl: undefined, documentName: undefined });
      return;
    }
    const isAllowedDoc =
      ACCEPTED_DOC_TYPES.includes(file.type) || /\.(pdf|doc|docx|xls|xlsx|txt)$/i.test(file.name);
    if (!isAllowedDoc) {
      toast.error("Document must be PDF, DOC, DOCX, XLS, XLSX or TXT");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Document attachment must be under 2 MB");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      emit({
        ...attachments,
        documentUrl: dataUrl,
        documentName: file.name,
      });
      toast.success("Document stored in database");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload document attachment";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleAdditionalDocument = async (file: File | null) => {
    if (!file) {
      emit({
        ...attachments,
        additionalDocumentUrl: undefined,
        additionalDocumentName: undefined,
      });
      return;
    }
    const isAllowedDoc =
      ACCEPTED_DOC_TYPES.includes(file.type) || /\.(pdf|doc|docx|xls|xlsx|txt)$/i.test(file.name);
    if (!isAllowedDoc) {
      toast.error("Document must be PDF, DOC, DOCX, XLS, XLSX or TXT");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Document attachment must be under 2 MB");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      emit({
        ...attachments,
        additionalDocumentUrl: dataUrl,
        additionalDocumentName: file.name,
      });
      toast.success("Additional document stored in database");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload additional document";
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
      <div className="space-y-2">
        {attachments.imageUrl ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
            <img src={attachments.imageUrl} alt="proof" className="h-9 w-9 rounded object-cover" />
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {attachments.imageName ?? "Proof image"}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleImage(null)}
              disabled={disabled || uploading}
              aria-label="Remove image proof"
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
            Upload image
            <input
              id={id}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
        {attachments.documentUrl ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Document 1
            </span>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {attachments.documentName ?? "Attachment document"}
            </span>
            <a
              href={attachments.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              View
            </a>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleDocument(null)}
              disabled={disabled || uploading}
              aria-label="Remove document proof"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <label
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted/40",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload document 1
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => handleDocument(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
        {attachments.additionalDocumentUrl ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Document 2
            </span>
            <span className="flex-1 truncate text-xs text-muted-foreground">
              {attachments.additionalDocumentName ?? "Additional document"}
            </span>
            <a
              href={attachments.additionalDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              View
            </a>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleAdditionalDocument(null)}
              disabled={disabled || uploading}
              aria-label="Remove additional document proof"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <label
            className={cn(
              "flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted/40",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload document 2
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => handleAdditionalDocument(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
      {uploading && (
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading attachment to Cloudinary...
        </div>
      )}
    </div>
  );
}
