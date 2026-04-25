import { apiFetch } from "@/lib/api";

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
};

export async function uploadImageToCloudinary(file: File): Promise<{
  secureUrl: string;
  originalFilename: string;
}> {
  const signed = await apiFetch<CloudinarySignatureResponse>("/api/cloudinary/signature", {
    method: "POST",
  });

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", signed.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,
    {
      method: "POST",
      body,
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.secure_url) {
    const message =
      data?.error?.message || "Image upload failed. Please verify Cloudinary credentials.";
    throw new Error(message);
  }

  return {
    secureUrl: String(data.secure_url),
    originalFilename: file.name,
  };
}
