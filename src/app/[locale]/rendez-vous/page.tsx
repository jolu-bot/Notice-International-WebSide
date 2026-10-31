import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent, getSettings } from '@/lib/content';
import { href, isLocale } from '@/lib/i18n';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/sections/Sections';
import { AppointmentForm } from '@/components/forms/AppointmentForm';
import { JsonLd } from '@/components/ui/JsonLd';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(await getContent(locale), locale, 'appointment', 'appointment');
}

export default async function AppointmentPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [c, s] = await Promise.all([getContent(locale), getSettings()]);
  const p = c.appointmentPage;
  return (
    <>
      <PageHero kicker={p.kicker} title={p.title} lead={p.lead} crumbs={[{ label: c.nav.home, href: href(locale, 'home') }, { label: c.nav.appointment }]} />
      <section className="section theme-light pt-[clamp(3rem,6vw,5rem)]">
        <div className="wrap">
          <div className="card p-6 md:p-12" data-reveal>
            <AppointmentForm locale={locale} t={c.forms} p={p} hours={{ slots: s.hours.slots, saturdaySlots: s.hours.saturdaySlots }}
              whatsapp={s.contact.whatsapp[1]?.number ?? s.contact.whatsapp[0]?.number ?? ''}
              address={`${s.address.street}, ${s.address.district}, ${s.address.city}, ${s.address.country}`} />
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: c.nav.home, path: href(locale, 'home') }, { name: c.nav.appointment, path: href(locale, 'appointment') }])} />
    </>
  );
}
