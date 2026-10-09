import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PackageCard } from '@/components/package-card';
import { HospitalImage } from '@/components/hospital-image';
import { parseHospitalImages } from '@/lib/hospital-images';
import { isAuthed, simpleAddress } from '@/lib/access';
import { SignUpPrompt } from '@/components/sign-up-prompt';
import { JciBadge } from '@/components/jci-badge';
import { SITE_URL } from '@/lib/constants';
import type { Metadata } from 'next';

// Content depends on the caller's session (anonymous vs registered), so this
// page is rendered dynamically per request and never statically cached.
export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    if (!prisma) return { title: 'Hospital' };
    const hospital = await prisma.hospital.findUnique({ where: { id: params.id } });
    if (!hospital) return { title: 'Hospital Not Found' };
    const area = hospital.address ? hospital.address.split(/[,，]/)[0].slice(0, 60) : 'Shanghai';
    const description = `${hospital.name} — health checkup packages at a Shanghai hospital (${area}). Compare prices, duration and English-language services on Shanghai HealthFinder.`;
    return {
      title: hospital.name,
      description,
      alternates: { canonical: `/hospitals/${hospital.id}` },
      openGraph: { title: `${hospital.name} | Shanghai HealthFinder`, description, type: 'article' },
    };
  } catch {
    return { title: 'Hospital' };
  }
}

export default async function HospitalDetailPage({ params }: Props) {
  const authed = await isAuthed();

  let hospital;
  try {
    if (!prisma) { hospital = null; }
    else {
    hospital = await prisma.hospital.findUnique({
      where: { id: params.id },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
      },
    });
    }
  } catch {
    hospital = null;
  }

  if (!hospital || !hospital.isActive) notFound();

  // Structured data for search engines & AI agents. Intentionally limited to
  // the fields anonymous visitors may see (name + area-level address) so it
  // never leaks gated content to crawlers.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Hospital', 'MedicalOrganization'],
        name: hospital.name,
        url: `${SITE_URL}/hospitals/${hospital.id}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: simpleAddress(hospital.address),
          addressLocality: 'Shanghai',
          addressCountry: 'CN',
        },
        medicalSpecialty: 'PreventiveHealth',
        ...(hospital.jciAccredited ? { award: 'JCI Accredited (Joint Commission International)' } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Hospitals', item: `${SITE_URL}/#hospitals` },
          { '@type': 'ListItem', position: 3, name: hospital.name, item: `${SITE_URL}/hospitals/${hospital.id}` },
        ],
      },
    ],
  };

  // Anonymous visitors: name + simple address only, plus a sign-up prompt.
  if (!authed) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
          ← Back to search
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{hospital.name}</h1>
          {hospital.jciAccredited && <JciBadge />}
        </div>
        <p className="text-sm text-muted-foreground mb-8">{simpleAddress(hospital.address)}</p>
        <SignUpPrompt message="Create a free account to see this hospital's full details, contact information, photos and its checkup packages." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
        ← Back to search
      </Link>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold">{hospital.name}</h1>
        {hospital.jciAccredited && <JciBadge />}
      </div>
      {hospital.nameCn && <p className="text-muted-foreground mb-4">{hospital.nameCn}</p>}
      {hospital.imageUrl && (
        <HospitalImage images={parseHospitalImages(hospital.imageUrl)} alt={hospital.name} />
      )}
      <p className="text-sm text-muted-foreground mb-6">{hospital.address}</p>
      {hospital.phone && <p className="text-sm mb-2">Phone: {hospital.phone}</p>}
      <p className="text-muted-foreground mb-8">{hospital.description}</p>

      <h2 className="text-2xl font-semibold mb-4">Checkup Packages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospital.packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            id={pkg.id}
            name={pkg.name}
            price={Number(pkg.price)}
            duration={pkg.duration}
            hospitalName={hospital.name}
            avgRating={Number(pkg.avgRating)}
            tags={pkg.tags}
            pendingUpdate={pkg.pendingUpdate}
          />
        ))}
      </div>
      {hospital.packages.length === 0 && (
        <p className="text-muted-foreground">No packages currently listed.</p>
      )}
    </div>
  );
}
