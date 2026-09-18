import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = await prisma.checkupPackage.findUnique({
    where: { id: params.id },
    include: { hospital: true },
  });
  if (!pkg) return { title: 'Package Not Found' };
  return { title: `${pkg.name} - ${pkg.hospital.name}` };
}

export default async function PackageDetailPage({ params }: Props) {
  const pkg = await prisma.checkupPackage.findUnique({
    where: { id: params.id },
    include: { hospital: true },
  });

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

      {/* Sign in prompt for details */}
      <div className="bg-muted p-6 rounded-lg text-center">
        <p className="text-muted-foreground mb-2">Sign in to see provider contact details and submit inquiries.</p>
        <a href="/login" className="text-primary hover:underline font-medium">Sign In with Google →</a>
      </div>
    </div>
  );
}