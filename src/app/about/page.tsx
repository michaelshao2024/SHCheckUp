import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import { EscortRequestButton } from '@/components/escort-request-button';

export const metadata: Metadata = {
  title: 'About SanEnSheng & Our Medical Escort Service',
  description:
    'SanEnSheng (优联智康) helps overseas visitors arrange health checkups in Shanghai. Learn about our brand and how our medical escort service guides you through your hospital visit.',
  alternates: { canonical: '/about' },
};

const ABOUT_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      name: 'About SanEnSheng & Our Medical Escort Service',
      url: `${SITE_URL}/about`,
      inLanguage: 'en',
    },
    {
      '@type': 'MedicalBusiness',
      name: 'SanEnSheng Medical Escort Service',
      alternateName: '优联智康陪诊服务',
      url: `${SITE_URL}/about`,
      description:
        'English-speaking medical escort service in Shanghai: hotel pickup, guidance through registration and hospital departments, and return transfer for international visitors. Escorts handle non-medical communication only.',
      areaServed: { '@type': 'City', name: 'Shanghai' },
      availableLanguage: ['en', 'zh'],
      parentOrganization: { '@type': 'Organization', name: 'Shanghai HealthFinder', alternateName: 'SanEnSheng 优联智康', url: SITE_URL },
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_JSON_LD) }} />
      {/* Hero */}
      <section className="border-b border-border bg-muted/40">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
          <Link href="/" className="inline-block text-sm text-primary hover:underline mb-6">
            ← Back to home
          </Link>
          <p className="text-xs font-semibold tracking-widest text-primary mb-3">
            SANENSHENG · 优联智康
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mb-5">
            A trusted local partner for your health checkup in Shanghai
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            SanEnSheng (优联智康) helps overseas visitors and expatriates arrange
            medical checkups at Shanghai&apos;s leading hospitals — and stands beside
            you on the day, so you never navigate an unfamiliar hospital alone.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-16">
        {/* The brand */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Who we are</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span className="font-medium text-foreground">SanEnSheng (优联智康)</span> is
              a Shanghai-based service dedicated to making world-class Chinese
              healthcare accessible to people who do not speak the language or know
              the system. We began with a simple observation: a health checkup abroad
              should feel reassuring, not confusing.
            </p>
            <p>
              Through {SITE_NAME}, we help you compare checkup packages across Shanghai
              hospitals in plain English — real prices in Chinese yuan (¥), what each
              package includes, expected duration, and whether English-language service
              and reports are available. When you are ready, our medical escort service
              takes care of the rest.
            </p>
          </div>
        </section>

        {/* What we believe */}
        <section>
          <h2 className="text-2xl font-bold mb-6">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold mb-2">Transparency</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Clear prices and honest descriptions. No hidden markups on hospital
                fees, and you only pay for our escort service after we confirm
                availability.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold mb-2">Privacy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your consultations stay between you and your physician. We handle
                logistics — never your private medical conversations.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-6">
              <h3 className="font-semibold mb-2">Respect for medicine</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We are not doctors. Diagnoses and report explanations always come from
                the hospital&apos;s own licensed physicians.
              </p>
            </div>
          </div>
        </section>

        {/* The escort service */}
        <section id="escort-service" className="scroll-mt-16">
          <p className="text-xs font-semibold tracking-widest text-primary mb-2">
            MEDICAL ESCORT SERVICE
          </p>
          <h2 className="text-2xl font-bold mb-4">
            A local guide, from your hotel door and back
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            A checkup at a large Chinese hospital involves registration desks,
            unfamiliar departments, Chinese-language forms and long queues. Our
            escort walks the entire path with you — so you can focus on your health,
            not the paperwork.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="text-primary shrink-0 font-bold">—</span>
              <span>
                <span className="font-medium text-foreground">Hotel pickup and drop-off.</span>{' '}
                Door to door, on time for your appointment.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0 font-bold">—</span>
              <span>
                <span className="font-medium text-foreground">Appointment &amp; paperwork prepared in advance.</span>{' '}
                Registration and forms are arranged before you arrive.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0 font-bold">—</span>
              <span>
                <span className="font-medium text-foreground">Guidance between departments.</span>{' '}
                Your escort handles non-medical communication — directions,
                scheduling, payments and logistics.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary shrink-0 font-bold">—</span>
              <span>
                <span className="font-medium text-foreground">Results walkthrough where available.</span>{' '}
                We arrange a review with the hospital&apos;s own physicians.
              </span>
            </li>
          </ul>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold mb-6">How it works</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <li className="rounded-xl border border-border bg-white p-6">
              <span className="inline-flex w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold items-center justify-center mb-3">
                1
              </span>
              <p className="font-medium mb-1">Tell us your plan</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pick any checkup package and submit the escort request form — it takes
                two minutes.
              </p>
            </li>
            <li className="rounded-xl border border-border bg-white p-6">
              <span className="inline-flex w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold items-center justify-center mb-3">
                2
              </span>
              <p className="font-medium mb-1">We confirm by email</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You receive the date, hospital details, and your escort&apos;s name and
                phone number.
              </p>
            </li>
            <li className="rounded-xl border border-border bg-white p-6">
              <span className="inline-flex w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold items-center justify-center mb-3">
                3
              </span>
              <p className="font-medium mb-1">Hotel pickup on the day</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your escort meets you, guides you through every step, and brings you
                back.
              </p>
            </li>
          </ol>
        </section>

        {/* Boundaries / trust */}
        <section className="rounded-xl border border-border bg-muted/40 p-6 space-y-3 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">
            The boundaries we keep
          </h2>
          <p>
            <span className="font-medium text-foreground">Your privacy:</span> we do not
            sit in on private consultations with doctors or nurses, and we do not
            translate medical conversations — those stay between you and your physician.
          </p>
          <p>
            <span className="font-medium text-foreground">We are not doctors:</span> we do
            not interpret medical reports. Report explanation is always done by the
            hospital&apos;s licensed physicians.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to plan your hospital visit?</h2>
          <p className="text-muted-foreground mb-6">
            Request a medical escort in minutes — you only pay after we confirm availability.
          </p>
          <EscortRequestButton label="Request Medical Escort Service →" />
        </section>
      </div>
    </div>
  );
}
