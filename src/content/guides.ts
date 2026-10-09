export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string; // meta description
  excerpt: string; // card teaser on the index page
  updatedAt: string; // ISO date
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'shanghai-health-checkup-price-guide',
    title: 'Shanghai Health Checkup Price Guide (2026)',
    description:
      'How much does a health checkup cost in Shanghai? Real package prices from ¥1,500 budget screenings to ¥40,000 premium executive checkups, compared across public international departments and private hospitals.',
    excerpt:
      'Real package prices across Shanghai hospitals — from ¥1,500 budget screenings to ¥40,000 premium executive checkups — and how to choose the right tier.',
    updatedAt: '2026-10-09',
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Health checkup packages in Shanghai range from roughly ¥1,500 for a basic screening at a public hospital international center to about ¥40,000 for a premium executive package at a private international hospital. For a quality-assured, comprehensive checkup — the tier most international visitors choose — expect to pay between ¥6,000 and ¥40,000, with the exact price depending on what the screening includes.',
          'All prices below are in Chinese yuan (CNY) and come from packages currently listed on Shanghai HealthFinder.',
        ],
      },
      {
        heading: 'Budget tier: ¥1,500 – ¥6,000',
        paragraphs: [
          'Basic screening packages at public hospital international health centers. These cover the fundamentals — blood work, urine analysis, chest X-ray, ECG, abdominal ultrasound — and are a good fit if you are young, healthy, and just need a routine annual check or a certificate for administrative purposes.',
        ],
        bullets: [
          'Shanghai Changhai Hospital International Health Checkup Center: ¥1,677 – ¥2,255',
          'SinoUnited Health (曜影医疗): from ¥1,800',
          'Shanghai United Family Hospital (Pudong clinics): from ¥1,500',
        ],
      },
      {
        heading: 'Mid tier: ¥6,000 – ¥15,000',
        paragraphs: [
          'Comprehensive packages at the international departments of top public hospitals and mid-range private providers. These add tumor markers, cardiac screening, thyroid and more detailed imaging, and are the most popular choice for working professionals and long-term expats.',
        ],
        bullets: [
          'Huashan Hospital International Medical Center: from ¥6,000',
          'Shanghai General Hospital IMCC (VIP packages): ¥4,300 – ¥17,600',
          'Ruijin Hospital International Dept: ¥8,512 – ¥14,812',
          'Shanghai Jiahui International Hospital: from ¥9,680',
        ],
      },
      {
        heading: 'Premium tier: ¥15,000 – ¥40,000',
        paragraphs: [
          'Executive and VIP packages at private international hospitals. Expect same-day one-stop screening, advanced imaging (CT, MRI, coronary CTA, painless gastroscopy/colonoscopy), private rooms, English reports, and dedicated coordinators. This is the tier most executives and visitors on tight schedules choose.',
        ],
        bullets: [
          'ParkwayHealth Shanghai (百汇医疗): ¥16,020 – ¥39,750',
          'Shanghai Jiahui International Hospital (premium packages): up to ¥39,750',
          'Huashan Hospital International Medical Center (premium): up to ¥30,000',
        ],
      },
      {
        heading: 'What drives the price',
        paragraphs: [
          'Four factors explain most of the price difference between a ¥2,000 and a ¥40,000 package:',
        ],
        bullets: [
          'Depth of screening — basic blood work vs. advanced imaging (CT/MRI/coronary CTA) and endoscopy',
          'Hospital type — public hospital international departments are typically 30–60% cheaper than private international hospitals for comparable tests',
          'English service level — private hospitals include English reports and English-speaking physicians by default; public international departments vary',
          'Environment and speed — premium packages are usually completed in a single morning in a private wing',
        ],
      },
      {
        heading: 'How to choose',
        paragraphs: [
          'Under 35 and healthy? A budget or mid-tier annual screening is usually enough. Over 40, or with family history of cardiovascular disease or cancer, choose a mid-to-premium package that includes cardiac imaging and tumor marker panels. If you are on a tight schedule or do not speak Chinese, the premium private hospitals — or a public hospital visit with our medical escort service — will save you hours.',
          'Create a free account on Shanghai HealthFinder to see exact package contents and compare prices side by side.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How much does a health checkup cost in Shanghai for foreigners?',
        a: 'Basic screenings start around ¥1,500–¥6,000 at public hospital international centers. Quality-assured comprehensive checkups typically cost ¥6,000–¥40,000 depending on what is included — advanced imaging, endoscopy and English-language premium service push a package toward the top of that range.',
      },
      {
        q: 'Are Shanghai health checkup prices in CNY or USD?',
        a: 'All package prices on Shanghai HealthFinder are listed in Chinese yuan (CNY, ¥). As a rough reference, ¥6,000–¥40,000 is approximately USD 850–5,600 depending on the exchange rate.',
      },
      {
        q: 'Is a more expensive checkup package always better?',
        a: 'Not necessarily. Price mainly reflects screening depth (imaging, endoscopy, tumor markers), hospital type, and service level. A healthy person under 35 often only needs a ¥2,000–¥8,000 package; over-40s or those with family medical history benefit from the added imaging in ¥15,000+ packages.',
      },
      {
        q: 'Do premium Shanghai hospitals provide English reports?',
        a: 'Private international hospitals (e.g. Jiahui, ParkwayHealth, United Family) provide English reports and English-speaking physicians by default. Public hospital international departments usually have English-speaking staff, but report language varies — we flag this as Yes / No / Unknown on every package.',
      },
    ],
  },
  {
    slug: 'best-international-hospitals-shanghai-expats',
    title: 'Best International Hospitals in Shanghai for Foreigners (2026)',
    description:
      'A practical guide to Shanghai hospitals that serve international patients: private international hospitals (Jiahui, ParkwayHealth, United Family, SinoUnited) and public hospital international departments (Huashan, Ruijin, Shanghai General IMCC, Changhai).',
    excerpt:
      'Private international hospitals vs. public hospital international departments — which Shanghai hospitals actually work well for foreigners, and how to choose.',
    updatedAt: '2026-10-09',
    sections: [
      {
        heading: 'Two types of hospitals that work for foreigners',
        paragraphs: [
          'Shanghai has two distinct routes for international patients. Private international hospitals (Jiahui, ParkwayHealth, United Family, SinoUnited) offer a fully English experience, international-standard service and premium pricing. The international departments of top public hospitals (Huashan, Ruijin, Shanghai General IMCC, Changhai) offer access to China’s leading specialists at significantly lower prices, with varying levels of English support.',
          'Both types are listed on Shanghai HealthFinder; below is how they compare in practice.',
        ],
      },
      {
        heading: 'Private international hospitals',
        paragraphs: [
          'Best for: visitors who want a seamless English experience, are on a tight schedule, or hold international insurance (these hospitals direct-bill most major international insurers).',
        ],
        bullets: [
          'Shanghai Jiahui International Hospital (嘉会国际医院) — Shanghai’s flagship private international hospital; 15 checkup packages listed, ¥9,680–¥39,750',
          'ParkwayHealth Shanghai (百汇医疗) — international clinic network; premium packages ¥16,020–¥39,750',
          'Shanghai United Family Hospital (和睦家医院) — long-established expat favorite; packages from ¥1,500–¥13,200 depending on campus',
          'SinoUnited Health (曜影医疗) — modern clinics in Lujiazui and Tianshan; packages ¥1,800–¥5,600',
        ],
      },
      {
        heading: 'Public hospital international departments',
        paragraphs: [
          'Best for: longer-term expats, budget-conscious patients, and anyone who wants China’s top specialists. These departments sit inside China’s highest-ranked public hospitals, with dedicated international wings. English service is generally available; English reports vary by hospital.',
        ],
        bullets: [
          'Huashan Hospital International Medical Center (华山医院国际医疗中心) — one of China’s top hospitals; packages ¥6,000–¥30,000',
          'Shanghai General Hospital IMCC (上海市第一人民医院国际医疗保健中心) — dedicated VIP international center; ¥4,300–¥17,600',
          'Ruijin Hospital International Dept (瑞金医院国际部体检中心) — packages ¥8,512–¥14,812',
          'Shanghai Changhai Hospital International Health Checkup Center — most budget-friendly international center; ¥1,677–¥2,255',
        ],
      },
      {
        heading: 'How to choose between them',
        paragraphs: [
          'Choose a private international hospital if you want guaranteed English end-to-end, international insurance direct billing, and a one-morning premium experience. Choose a public hospital international department if you want the same tests at 30–60% lower cost, or access to a specific top specialist.',
          'Worried about navigating a public hospital in Chinese? That is exactly what our medical escort service is for — an English-speaking escort meets you at your hotel, handles registration and logistics, and guides you through the entire visit.',
        ],
      },
      {
        heading: 'Practical tips for your visit',
        paragraphs: [
          'A few things that make a Shanghai hospital visit go smoothly:',
        ],
        bullets: [
          'Bring your passport — it is the standard ID for international departments',
          'Fast from the previous evening for blood work; most checkups start 8:00–9:00 AM',
          'Book ahead — popular international departments fill up 1–2 weeks out',
          'Check whether the package includes an English report before booking if you need one for insurance',
        ],
      },
    ],
    faqs: [
      {
        q: 'What is the best hospital in Shanghai for foreigners?',
        a: 'For a fully English, premium experience: Jiahui International Hospital, ParkwayHealth or United Family. For top specialists at lower cost: the international departments of public hospitals such as Huashan, Ruijin, or Shanghai General Hospital IMCC. The right choice depends on your budget, insurance and language needs.',
      },
      {
        q: 'Do Shanghai hospitals accept international health insurance?',
        a: 'Private international hospitals (Jiahui, ParkwayHealth, United Family, SinoUnited) direct-bill most major international insurers. Public hospital international departments usually require upfront payment with reimbursement claims afterwards — check with your insurer first.',
      },
      {
        q: 'Do I need to speak Chinese for a hospital visit in Shanghai?',
        a: 'At private international hospitals, no. At public hospital international departments, English-speaking staff are usually available but the experience is not fully English — our medical escort service bridges the gap with an English-speaking escort who handles registration, forms and logistics.',
      },
      {
        q: 'How do I book a checkup at a Shanghai hospital as a foreigner?',
        a: 'Search and compare packages on Shanghai HealthFinder, create a free account to see full details and prices, then submit a booking or escort request — our team confirms the appointment with the hospital, usually within one business day.',
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
