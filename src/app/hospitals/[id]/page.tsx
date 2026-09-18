import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PackageCard } from '@/components/package-card';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hospital = await prisma.hospital.findUnique({ where: { id: params.id } });
  if (!hospital) return { title: 'Hospital Not Found' };
  return { title: hospital.name };
}

export default async function HospitalDetailPage({ params }: Props) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: params.id },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!hospital) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
      {hospital.nameCn && <p className="text-muted-foreground mb-4">{hospital.nameCn}</p>}
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
          />
        ))}
      </div>
      {hospital.packages.length === 0 && (
        <p className="text-muted-foreground">No packages currently listed.</p>
      )}
    </div>
  );
}