import { apiFetch, ApiError } from "@/lib/api";
import { API_BASE_URL } from "@/lib/flags";
import { getJwt } from "@/lib/auth";

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
};

type CloudinaryUploadResponse = {
  secureUrl: string;
  originalFilename: string;
};

async function uploadViaBackend(
  file: File,
  resourceType: "image" | "raw" | "auto",
): Promise<CloudinaryUploadResponse> {
  const token = getJwt();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const query = new URLSearchParams({ resourceType });
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/cloudinary/upload?${query.toString()}`, {
    method: "POST",
    headers,
    body,
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new ApiError(text || res.statusText, res.status, text);
  }
  const data = text ? (JSON.parse(text) as CloudinaryUploadResponse) : null;
  if (!data?.secureUrl) {
    throw new Error("Image upload failed. Please verify Cloudinary credentials.");
  }
  return data;
}

async function uploadViaSignedClient(
  file: File,
  resourceType: "image" | "raw" | "auto",
): Promise<CloudinaryUploadResponse> {
  const signed = await apiFetch<CloudinarySignatureResponse>("/api/cloudinary/signature", {
    method: "POST",
  });

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", signed.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/${resourceType}/upload`,
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

export async function uploadImageToCloudinary(file: File): Promise<{
  secureUrl: string;
  originalFilename: string;
}> {
  try {
    return await uploadViaBackend(file, "image");
  } catch {
    return uploadViaSignedClient(file, "image");
  }
}

export async function uploadFileToCloudinary(
  file: File,
  resourceType: "image" | "raw" | "auto" = "auto",
): Promise<{
  secureUrl: string;
  originalFilename: string;
}> {
  try {
    return await uploadViaBackend(file, resourceType);
  } catch {
    return uploadViaSignedClient(file, resourceType);
  }
}
