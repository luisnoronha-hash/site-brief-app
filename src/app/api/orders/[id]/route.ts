import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { files: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.userId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deliverable = order.files.find((f) => f.kind === "deliverable");
  const downloadUrl = deliverable ? await getDownloadUrl(deliverable.key, 900, `${order.address}.pdf`) : null;

  return NextResponse.json({ order, downloadUrl });
}
