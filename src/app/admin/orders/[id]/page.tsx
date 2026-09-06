import { notFound } from "next/navigation";
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
import { AdminOrderActions } from "@/components/AdminOrderActions";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: { include: { brokerProfile: true } }, files: true },
  });
  if (!order) notFound();

  const profile = order.user.brokerProfile;
  const uploadFiles = order.files.filter((f) => f.kind === "upload");
  const uploadUrls = await Promise.all(
    uploadFiles.map(async (f) => ({ ...f, url: await getDownloadUrl(f.key, 900, f.filename) }))
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-navy">{order.address}</h1>
          <span className={`px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="card grid grid-cols-2 gap-4 text-sm">
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
            <p className="label-field">Amount / method</p>
            <p className="text-navy-800">
              {order.priceCents > 0 ? formatCents(order.priceCents) : "Free"} · {order.paymentMethod}
            </p>
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

        <div className="card">
          <p className="label-field">Broker profile</p>
          {profile ? (
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-navy-800">
              <p>{profile.fullName}</p>
              <p>FL License #{profile.licenseNumber}</p>
              <p>{profile.brokerage}</p>
              <p>{profile.officeAddress}</p>
              <p>{profile.phone}</p>
              <p>{profile.email}</p>
              {profile.website && <p>{profile.website}</p>}
              <p>Report language: {profile.reportLanguage}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-red-600">No broker profile on file.</p>
          )}
        </div>

        <div className="card">
          <p className="label-field">Submitted files</p>
          {uploadUrls.length === 0 ? (
            <p className="mt-2 text-sm text-graystone">None.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {uploadUrls.map((f) => (
                <li key={f.id}>
                  <a href={f.url} className="text-navy underline">
                    {f.filename}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <AdminOrderActions
          orderId={order.id}
          userId={order.userId}
          currentStatus={order.status}
          hasPaymentIntent={Boolean(order.stripePaymentIntentId)}
        />
      </div>
    </div>
  );
}
