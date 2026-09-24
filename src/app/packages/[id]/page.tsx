import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EscortServiceButton } from '@/components/escort-service-button';
import { HospitalImage } from '@/components/hospital-image';
import { ProviderContact } from '@/components/provider-contact';
import type { Metadata } from 'next';

// ISR: cache for 1 hour to minimize Neon reads; contact details are
// handled client-side by ProviderContact so this page stays static.
export const revalidate = 3600;

// Pre-render all existing packages at build time; new ones are cached on demand.
export async function generateStaticParams() {
  try {
    if (!prisma) return [];
    const pkgs = await prisma.checkupPackage.findMany({ select: { id: true } });
    return pkgs.map((p) => ({ id: p.id }));
  } catch {
    return [];
  }
}

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    if (!prisma) return { title: 'Checkup Package' };
    const pkg = await prisma.checkupPackage.findUnique({
      where: { id: params.id },
      include: { hospital: true },
    });
    if (!pkg) return { title: 'Package Not Found' };
    return { title: `${pkg.name} - ${pkg.hospital.name}` };
  } catch {
    return { title: 'Checkup Package' };
  }
}

export default async function PackageDetailPage({ params }: Props) {
  let pkg;
  try {
    if (!prisma) { pkg = null; }
    else {
    pkg = await prisma.checkupPackage.findUnique({
      where: { id: params.id },
      include: { hospital: true },
    });
    }
  } catch {
    pkg = null;
  }

  if (!pkg) notFound();

  const items = pkg.items as string[] | null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <a href={`/hospitals/${pkg.hospital.id}`} className="text-sm text-primary hover:underline mb-4 inline-block">
        ← Back to {pkg.hospital.name}
      </a>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{pkg.name}</h1>
          <p className="text-muted-foreground">{pkg.hospital.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">${Number(pkg.price).toLocaleString()}</p>
          {pkg.duration && <p className="text-sm text-muted-foreground">{pkg.duration}</p>}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg text-yellow-500">{'★'.repeat(Math.round(Number(pkg.avgRating)))}</span>
        <span className="text-muted-foreground">{Number(pkg.avgRating).toFixed(1)}</span>
        <span className="text-muted-foreground">· {pkg.reviewCount} reviews</span>
      </div>

      {/* Tags */}
      <div className="flex gap-1 flex-wrap mb-6">
        {pkg.tags.map((tag) => (
          <span key={tag} className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground capitalize">{tag}</span>
        ))}
      </div>

      {/* Description */}
      {pkg.description && <p className="text-muted-foreground mb-6">{pkg.description}</p>}

      {/* Checkup Items */}
      {items && items.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">What&apos;s Included</h2>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Translator notice */}
      {pkg.includesTranslator && (
        <div className="bg-accent p-4 rounded-lg mb-6">
          <p className="text-sm font-medium">Translator service included ✓</p>
          <p className="text-xs text-muted-foreground mt-1">English-speaking staff or translator arranged for this package.</p>
        </div>
      )}

      {/* Hospital / Provider information */}
      <div className="border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">About the Provider</h2>
        {pkg.hospital.imageUrl && <HospitalImage src={pkg.hospital.imageUrl} alt={pkg.hospital.name} />}
        <p className="font-medium">{pkg.hospital.name}</p>
        {pkg.hospital.nameCn && <p className="text-sm text-muted-foreground">{pkg.hospital.nameCn}</p>}
        <p className="text-sm text-muted-foreground mt-2">📍 {pkg.hospital.address}</p>
        <p className="text-sm text-muted-foreground mt-3">{pkg.hospital.description}</p>
        <ProviderContact
          phone={pkg.hospital.phone}
          email={pkg.hospital.email}
          website={pkg.hospital.website}
        />
      </div>

      {/* Medical escort service CTA */}
      <div className="mb-6">
        <EscortServiceButton packageId={pkg.id} packageName={pkg.name} hospitalName={pkg.hospital.name} />
      </div>
    </div>
  );
}