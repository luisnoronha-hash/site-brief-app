import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/storage";
import {
  formatCents,
  formatDollars,
  formatDate,
  PROPERTY_TYPE_LABELS,
  RELATIONSHIP_LABELS,
  DEADLINE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/format";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await requireAgent();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { files: true },
  });

  if (!order || order.userId !== user.id) notFound();

  const deliverable = order.files.find((f) => f.kind === "deliverable");
  const downloadUrl = deliverable ? await getDownloadUrl(deliverable.key, 900, `${order.address}.pdf`) : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-navy">{order.address}</h1>
        <span className={`px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="card mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="label-field">Property type</p>
          <p className="text-navy-800">{PROPERTY_TYPE_LABELS[order.propertyType]}</p>
        </div>
        <div>
          <p className="label-field">Asking price</p>
          <p className="text-navy-800">{formatDollars(order.askingPrice)}</p>
        </div>
        <div>
          <p className="label-field">Relationship</p>
          <p className="text-navy-800">{RELATIONSHIP_LABELS[order.relationship]}</p>
        </div>
        <div>
          <p className="label-field">Deadline</p>
          <p className="text-navy-800">{DEADLINE_LABELS[order.deadlineTier]}</p>
        </div>
        <div>
          <p className="label-field">Submitted</p>
          <p className="text-navy-800">{formatDate(order.submittedAt)}</p>
        </div>
        <div>
          <p className="label-field">Amount</p>
          <p className="text-navy-800">{order.priceCents > 0 ? formatCents(order.priceCents) : "Free"}</p>
        </div>
        {order.mlsNumber && (
          <div>
            <p className="label-field">MLS number</p>
            <p className="text-navy-800">{order.mlsNumber}</p>
          </div>
        )}
        {order.folio && (
          <div>
            <p className="label-field">Folio number</p>
            <p className="text-navy-800">{order.folio}</p>
          </div>
        )}
        {order.notes && (
          <div className="col-span-2">
            <p className="label-field">Notes</p>
            <p className="whitespace-pre-wrap text-navy-800">{order.notes}</p>
          </div>
        )}
      </div>

      {order.files.filter((f) => f.kind === "upload").length > 0 && (
        <div className="card mt-4">
          <p className="label-field">Files you submitted</p>
          <ul className="mt-2 space-y-1 text-sm text-navy-600">
            {order.files
              .filter((f) => f.kind === "upload")
              .map((f) => (
                <li key={f.id}>{f.filename}</li>
              ))}
          </ul>
        </div>
      )}

      <div className="card mt-4">
        {order.status === "delivered" && downloadUrl ? (
          <>
            <p className="font-medium text-navy">Your report is ready.</p>
            <a href={downloadUrl} className="btn-primary mt-4 inline-flex">
              Download report
            </a>
          </>
        ) : (
          <p className="text-sm text-navy-600">
            Your development-potential analysis is being prepared by a Site Brief expert. We&rsquo;ll
            email you as soon as it&rsquo;s ready — no automated report will appear here in the meantime.
          </p>
        )}
      </div>
    </div>
  );
}
