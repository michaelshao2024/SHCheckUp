import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EscortServiceButton } from '@/components/escort-service-button';
import { HospitalImage } from '@/components/hospital-image';
import { ProviderContact } from '@/components/provider-contact';
import { SignUpPrompt } from '@/components/sign-up-prompt';
import { isAuthed } from '@/lib/access';
import { SITE_URL } from '@/lib/constants';
import type { Metadata } from 'next';

// Content depends on the caller's session (anonymous vs registered), so this
// page is rendered dynamically per request and never statically cached.
export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    if (!prisma) return { title: 'Checkup Package' };
    const pkg = await prisma.checkupPackage.findUnique({
      where: { id: params.id },
      include: { hospital: true },
    });
    if (!pkg) return { title: 'Package Not Found' };
    const title = `${pkg.name} - ${pkg.hospital.name}`;
    const description = `${pkg.name} health checkup package at ${pkg.hospital.name}, Shanghai. See what is included, compare with other Shanghai checkup packages, and request our English-speaking medical escort service.`;
    return {
      title,
      description,
      alternates: { canonical: `/packages/${pkg.id}` },
      openGraph: { title: `${title} | Shanghai HealthFinder`, description, type: 'article' },
    };
  } catch {
    return { title: 'Checkup Package' };
  }
}

export default async function PackageDetailPage({ params }: Props) {
  const authed = await isAuthed();

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

  if (!pkg || !pkg.isActive || !pkg.hospital.isActive) notFound();

  // Structured data for search engines & AI agents. Limited to fields visible
  // to anonymous visitors (package name) plus the provider brand — no price,
  // hospital detail or item list leaks to crawlers.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        name: `${pkg.name} — health checkup package in Shanghai`,
        url: `${SITE_URL}/packages/${pkg.id}`,
        about: {
          '@type': 'MedicalProcedure',
          procedureType: 'https://schema.org/PhysicalExam',
          name: pkg.name,
          bodyLocation: 'General health screening',
        },
        provider: {
          '@type': 'Organization',
          name: 'Shanghai HealthFinder (SanEnSheng 优联智康)',
          url: SITE_URL,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Checkup Packages', item: `${SITE_URL}/#hospitals` },
          { '@type': 'ListItem', position: 3, name: pkg.name, item: `${SITE_URL}/packages/${pkg.id}` },
        ],
      },
    ],
  };

  // Anonymous visitors: package name only, plus a sign-up prompt. Price,
  // hospital, items and all other details require a free account.
  if (!authed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
          ← Back to search
        </a>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{pkg.name}</h1>
        <SignUpPrompt message="Create a free account to see this checkup package's price, what's included, the hospital and how to book." />
      </div>
    );
  }

  const items = pkg.items as string[] | null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href={`/hospitals/${pkg.hospital.id}`} className="text-sm text-primary hover:underline mb-4 inline-block">
        ← Back to {pkg.hospital.name}
      </a>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">{pkg.name}</h1>
          {pkg.pendingUpdate && (
            <span className="inline-block px-2 py-0.5 mt-2 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs font-medium">
              Being updated — details may change
            </span>
          )}
          <p className="text-muted-foreground">{pkg.hospital.name}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-2xl sm:text-3xl font-bold text-primary">¥{Number(pkg.price).toLocaleString()}</p>
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

      {/* Source link */}
      {pkg.source && (
        <p className="text-sm mb-6">
          Source:{' '}
          <a href={pkg.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
            {pkg.source}
          </a>
        </p>
      )}

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

      {/* English service badges */}
      {(pkg.englishReport || pkg.englishService) && (
        <div className="flex gap-2 flex-wrap mb-6">
          {pkg.englishReport && (
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">English report available ✓</span>
          )}
          {pkg.englishService && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">Full English service ✓</span>
          )}
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