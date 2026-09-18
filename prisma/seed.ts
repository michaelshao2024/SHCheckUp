import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create hospitals
  const hospital1 = await prisma.hospital.create({
    data: {
      name: 'Huashan Hospital',
      nameCn: '复旦大学附属华山医院',
      address: "12 Wulumuqi Middle Road, Jing'an District, Shanghai",
      phone: '+86-21-52889999',
      description: "One of Shanghai's top general hospitals, known for international patient services with English-speaking staff.",
      imageUrl: '/images/huashan.jpg',
    },
  });

  const hospital2 = await prisma.hospital.create({
    data: {
      name: 'Ruijin Hospital',
      nameCn: '上海交通大学医学院附属瑞金医院',
      address: '197 Ruijin Er Road, Huangpu District, Shanghai',
      phone: '+86-21-64370045',
      description: 'A premier teaching hospital offering comprehensive health checkup packages for expatriates.',
      imageUrl: '/images/ruijin.jpg',
    },
  });

  const hospital3 = await prisma.hospital.create({
    data: {
      name: 'Shanghai East International Medical Center',
      nameCn: '上海东方国际医院',
      address: '551 South Pudong Road, Pudong, Shanghai',
      phone: '+86-21-58799999',
      description: 'Dedicated international clinic with multilingual staff and tailored health checkups for foreigners.',
      imageUrl: '/images/east-medical.jpg',
    },
  });

  // Create packages for Huashan
  await prisma.checkupPackage.createMany({
    data: [
      {
        hospitalId: hospital1.id,
        name: 'Basic Health Checkup',
        price: 280,
        duration: '2 hours',
        items: ['Blood pressure', 'Blood test (basic)', 'Urinalysis', 'BMI measurement', 'Doctor consultation'],
        includesTranslator: false,
        tags: ['basic'],
        avgRating: 4.2,
        reviewCount: 0,
      },
      {
        hospitalId: hospital1.id,
        name: 'Comprehensive Health Checkup',
        price: 580,
        duration: '4 hours',
        items: ['Blood test (comprehensive)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Abdominal ultrasound', 'Vision test', 'Hearing test', 'Doctor consultation'],
        includesTranslator: true,
        tags: ['comprehensive'],
        avgRating: 4.5,
        reviewCount: 0,
      },
      {
        hospitalId: hospital1.id,
        name: 'Premium Executive Checkup',
        price: 1200,
        duration: '6 hours',
        items: ['All comprehensive items', 'CT Scan (chest)', 'Stress test ECG', 'Echocardiogram', 'Tumor markers', 'Thyroid function', 'Bone density scan', 'Nutrition consultation'],
        includesTranslator: true,
        tags: ['premium'],
        avgRating: 4.8,
        reviewCount: 0,
      },
    ],
  });

  // Create packages for Ruijin
  await prisma.checkupPackage.createMany({
    data: [
      {
        hospitalId: hospital2.id,
        name: 'Standard Health Check',
        price: 320,
        duration: '3 hours',
        items: ['Blood pressure', 'Blood test (basic)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Doctor consultation'],
        includesTranslator: false,
        tags: ['basic'],
        avgRating: 4.0,
        reviewCount: 0,
      },
      {
        hospitalId: hospital2.id,
        name: 'Comprehensive Health Screen',
        price: 650,
        duration: '5 hours',
        items: ['Blood test (comprehensive)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Abdominal ultrasound', 'Thyroid ultrasound', 'Stress test', 'Ophthalmology check', 'Doctor consultation'],
        includesTranslator: true,
        tags: ['comprehensive'],
        avgRating: 4.3,
        reviewCount: 0,
      },
    ],
  });

  // Create packages for East International
  await prisma.checkupPackage.createMany({
    data: [
      {
        hospitalId: hospital3.id,
        name: 'Expat Basic Checkup',
        price: 250,
        duration: '2 hours',
        items: ['Blood pressure', 'Blood test (basic)', 'Urinalysis', 'BMI', 'Doctor consultation (English)'],
        includesTranslator: false,
        tags: ['basic'],
        avgRating: 4.1,
        reviewCount: 0,
      },
      {
        hospitalId: hospital3.id,
        name: 'Expat Comprehensive Checkup',
        price: 550,
        duration: '4 hours',
        items: ['Blood test (full panel)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Abdominal ultrasound', 'Thyroid panel', 'Vitamin deficiency screening', 'Doctor consultation (English)'],
        includesTranslator: true,
        tags: ['comprehensive'],
        avgRating: 4.6,
        reviewCount: 0,
      },
      {
        hospitalId: hospital3.id,
        name: 'Expat Deluxe Wellness',
        price: 1100,
        duration: 'Full day',
        items: ['All comprehensive items', 'CT Scan (low-dose chest)', 'Cardiac stress test', 'MRI (brain screening)', 'Nutrition consultation', 'Personal health report', 'Follow-up consultation'],
        includesTranslator: true,
        tags: ['premium'],
        avgRating: 4.9,
        reviewCount: 0,
      },
    ],
  });

  // Index data in Meilisearch
  const { meilisearch, PACKAGES_INDEX, HOSPITALS_INDEX, ensureIndexes } = await import('../src/lib/meilisearch');
  await ensureIndexes();

  const hospitals = await prisma.hospital.findMany({ where: { isActive: true } });
  await meilisearch.index(HOSPITALS_INDEX).addDocuments(
    hospitals.map(h => ({ id: h.id, name: h.name, description: h.description, address: h.address, isActive: h.isActive }))
  );

  const packages = await prisma.checkupPackage.findMany({
    where: { isActive: true },
    include: { hospital: true },
  });
  await meilisearch.index(PACKAGES_INDEX).addDocuments(
    packages.map(p => ({
      id: p.id,
      hospitalId: p.hospitalId,
      hospitalName: p.hospital.name,
      name: p.name,
      price: Number(p.price),
      currency: p.currency,
      duration: p.duration,
      description: p.description,
      items: p.items as string[],
      tags: p.tags,
      includesTranslator: p.includesTranslator,
      avgRating: Number(p.avgRating),
      isActive: p.isActive,
    }))
  );

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });