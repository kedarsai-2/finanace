import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export function LogoUpload({ value, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Image must be under 2MB");
        return;
      }
      setUploading(true);
      try {
        const uploaded = await uploadImageToCloudinary(file);
        onChange(uploaded.secureUrl);
        toast.success("Logo uploaded");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload logo";
        toast.error(message);
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  return (
    <div className="flex items-start gap-5">
      <div
        className={cn(
          "relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/30 transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
        onDragOver={(e) => {
          if (uploading) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (uploading) return;
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        {value ? (
          <img src={value} alt="Logo preview" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">Business logo</p>
        <p className="text-xs text-muted-foreground">Drag & drop or upload. PNG / JPG up to 2MB.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
              disabled={uploading}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
