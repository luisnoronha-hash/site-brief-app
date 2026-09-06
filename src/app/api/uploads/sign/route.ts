import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildObjectKey, getUploadUrl } from "@/lib/s3";

const ALLOWED_PREFIXES = ["headshots", "logos", "order-uploads"] as const;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILENAME_LENGTH = 200;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, prefix } = await req.json();

  if (
    typeof filename !== "string" ||
    !filename ||
    filename.length > MAX_FILENAME_LENGTH ||
    typeof contentType !== "string" ||
    !ALLOWED_TYPES.includes(contentType) ||
    !ALLOWED_PREFIXES.includes(prefix)
  ) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const key = buildObjectKey(`${prefix}/${session.user.id}`, filename);
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ key, uploadUrl });
}
