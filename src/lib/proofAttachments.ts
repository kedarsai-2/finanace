export interface ProofAttachments {
  imageUrl?: string;
  imageName?: string;
  documentUrl?: string;
  documentName?: string;
  additionalDocumentUrl?: string;
  additionalDocumentName?: string;
}

const JSON_PREFIX = "proofv2:";

function isBrowserBtoa() {
  return typeof window !== "undefined" && typeof window.btoa === "function";
}

function isBrowserAtob() {
  return typeof window !== "undefined" && typeof window.atob === "function";
}

function toBase64(value: string) {
  if (isBrowserBtoa()) return window.btoa(unescape(encodeURIComponent(value)));
  return value;
}

function fromBase64(value: string) {
  if (isBrowserAtob()) return decodeURIComponent(escape(window.atob(value)));
  return value;
}

export function parseProofAttachments(proofDataUrl?: string, proofName?: string): ProofAttachments {
  const raw = (proofDataUrl ?? "").trim();
  if (!raw) return {};

  if (!raw.startsWith(JSON_PREFIX)) {
    return { imageUrl: raw, imageName: proofName };
  }

  try {
    const json = fromBase64(raw.slice(JSON_PREFIX.length));
    const parsed = JSON.parse(json) as ProofAttachments;
    return {
      imageUrl: parsed.imageUrl,
      imageName: parsed.imageName,
      documentUrl: parsed.documentUrl,
      documentName: parsed.documentName,
      additionalDocumentUrl: parsed.additionalDocumentUrl,
      additionalDocumentName: parsed.additionalDocumentName,
    };
  } catch {
    // Graceful fallback for corrupted payloads.
    return { imageUrl: raw, imageName: proofName };
  }
}

export function stringifyProofAttachments(attachments: ProofAttachments): {
  proofDataUrl?: string;
  proofName?: string;
} {
  const hasImage = !!attachments.imageUrl;
  const hasDocument = !!attachments.documentUrl;
  const hasAdditionalDocument = !!attachments.additionalDocumentUrl;
  if (!hasImage && !hasDocument && !hasAdditionalDocument) {
    return { proofDataUrl: undefined, proofName: undefined };
  }

  // Preserve legacy shape when only image exists.
  if (hasImage && !hasDocument && !hasAdditionalDocument) {
    return {
      proofDataUrl: attachments.imageUrl,
      proofName: attachments.imageName,
    };
  }

  const payload: ProofAttachments = {
    imageUrl: attachments.imageUrl,
    imageName: attachments.imageName,
    documentUrl: attachments.documentUrl,
    documentName: attachments.documentName,
    additionalDocumentUrl: attachments.additionalDocumentUrl,
    additionalDocumentName: attachments.additionalDocumentName,
  };
  return {
    proofDataUrl: `${JSON_PREFIX}${toBase64(JSON.stringify(payload))}`,
    proofName:
      attachments.imageName ??
      attachments.documentName ??
      attachments.additionalDocumentName ??
      "attachments",
  };
}

export function hasAnyProof(proofDataUrl?: string, proofName?: string) {
  const parsed = parseProofAttachments(proofDataUrl, proofName);
  return !!parsed.imageUrl || !!parsed.documentUrl || !!parsed.additionalDocumentUrl;
}

export function primaryProofUrl(proofDataUrl?: string, proofName?: string) {
  const parsed = parseProofAttachments(proofDataUrl, proofName);
  return parsed.imageUrl ?? parsed.documentUrl ?? parsed.additionalDocumentUrl;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Failed to read file"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
