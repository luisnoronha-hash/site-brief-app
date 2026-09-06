import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brokerProfileSchema } from "@/lib/validations";
import { getObjectBuffer, deleteObject } from "@/lib/storage";
import { readImageDimensions } from "@/lib/image-dimensions";

const MIN_HEADSHOT_SIZE = 600;
const MIN_LOGO_WIDTH = 1000;

/**
 * Uploads go straight from the browser to S3 via a signed URL, so this is the
 * first point the server ever sees the bytes. Returns an error message if the
 * image fails validation, deleting the rejected object so it doesn't linger in
 * the bucket; returns null if it's fine.
 */
async function validateUploadedImage(
  key: string,
  minWidth: number,
  minHeight: number,
  label: string
): Promise<string | null> {
  let buffer: Buffer;
  try {
    buffer = await getObjectBuffer(key);
  } catch {
    return `Could not read the uploaded ${label}. Please try uploading it again.`;
  }

  const dimensions = readImageDimensions(buffer);
  if (!dimensions) {
    await deleteObject(key).catch(() => {});
    return `The ${label} doesn't look like a valid JPG or PNG. Please try a different file.`;
  }

  if (dimensions.width < minWidth || dimensions.height < minHeight) {
    await deleteObject(key).catch(() => {});
    return `The ${label} is ${dimensions.width}×${dimensions.height}px, below the ${minWidth}×${minHeight}px minimum.`;
  }

  return null;
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = brokerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await prisma.brokerProfile.findUnique({ where: { userId: session.user.id } });

  if (data.headshotKey && data.headshotKey !== existing?.headshotKey) {
    const error = await validateUploadedImage(
      data.headshotKey,
      MIN_HEADSHOT_SIZE,
      MIN_HEADSHOT_SIZE,
      "headshot"
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  if (data.logoKey && data.logoKey !== existing?.logoKey) {
    const error = await validateUploadedImage(data.logoKey, MIN_LOGO_WIDTH, 1, "brokerage logo");
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const profile = await prisma.brokerProfile.upsert({
    where: { userId: session.user.id },
    update: {
      fullName: data.fullName,
      licenseNumber: data.licenseNumber,
      brokerage: data.brokerage,
      officeAddress: data.officeAddress,
      phone: data.phone,
      email: data.email,
      website: data.website || null,
      reportLanguage: data.reportLanguage,
      ...(data.headshotKey !== undefined ? { headshotKey: data.headshotKey } : {}),
      ...(data.logoKey !== undefined ? { logoKey: data.logoKey } : {}),
    },
    create: {
      userId: session.user.id,
      fullName: data.fullName,
      licenseNumber: data.licenseNumber,
      brokerage: data.brokerage,
      officeAddress: data.officeAddress,
      phone: data.phone,
      email: data.email,
      website: data.website || null,
      reportLanguage: data.reportLanguage,
      headshotKey: data.headshotKey ?? null,
      logoKey: data.logoKey ?? null,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale: data.reportLanguage },
  });

  return NextResponse.json({ ok: true, profile });
}
