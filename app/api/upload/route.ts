import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (staff)
const MAX_SIZE_CUSTOMER = 5 * 1024 * 1024; // 5 MB (payment screenshots from customers)

// The file's first bytes must really be an image — the declared Content-Type alone can be faked.
function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const gif = buf.subarray(0, 4).toString("ascii") === "GIF8";
  const webp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || gif || webp;
}

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

// Staff (menu photos) AND customers (JazzCash / EasyPaisa / bank-transfer screenshots at
// checkout) both use this endpoint. Customers have no account, so for them it is open but
// tightly limited: images only, 5 MB max, and a few uploads per IP.
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  const isStaff = Boolean(session);

  if (!isStaff) {
    const limit = await rateLimit(`upload:${getClientIp(req)}`, 8, 10 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
  }

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
  const maxSize = isStaff ? MAX_SIZE : MAX_SIZE_CUSTOMER;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Image must be smaller than ${maxSize / (1024 * 1024)} MB` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  if (!looksLikeImage(buffer)) {
    return NextResponse.json({ error: "That file is not a valid image." }, { status: 400 });
  }

  const hasCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  // On Vercel the filesystem is read-only/ephemeral, so local storage cannot work there.
  if (!hasCloudinary && process.env.VERCEL) {
    console.error("[upload] CLOUDINARY_* env vars are missing on Vercel — uploads cannot be stored.");
    return NextResponse.json(
      { error: "Image uploads are not configured on the server yet. Please contact the restaurant." },
      { status: 503 }
    );
  }

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
