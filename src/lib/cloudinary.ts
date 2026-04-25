const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER?.trim();

export function hasCloudinaryConfig(): boolean {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

export async function uploadImageToCloudinary(file: File): Promise<{
  secureUrl: string;
  originalFilename: string;
}> {
  if (!hasCloudinaryConfig()) {
    throw new Error(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET!);
  if (CLOUDINARY_FOLDER) body.append("folder", CLOUDINARY_FOLDER);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME!)}/image/upload`,
    {
      method: "POST",
      body,
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.secure_url) {
    const message =
      data?.error?.message ||
      "Image upload failed. Please verify Cloudinary settings and upload preset permissions.";
    throw new Error(message);
  }

  return {
    secureUrl: String(data.secure_url),
    originalFilename: file.name,
  };
}
