import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "flaming-bites",
          resource_type: "image",
          public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

async function uploadToLocal(buffer: Buffer, mimetype: string): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const ext = mimetype.split("/")[1] === "jpeg" ? "jpg" : mimetype.split("/")[1];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  console.warn(
    "[upload] Cloudinary credentials not configured — falling back to local storage."
  );
  return `/uploads/${filename}`;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP, or GIF images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be smaller than 10 MB" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const hasCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  try {
    const url = hasCloudinary
      ? await uploadToCloudinary(buffer, file.type, file.name)
      : await uploadToLocal(buffer, file.type);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] Error:", err);
    // If Cloudinary failed, try local fallback
    if (hasCloudinary) {
      try {
        const url = await uploadToLocal(buffer, file.type);
        return NextResponse.json({ url });
      } catch {
        // intentional
      }
    }
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
