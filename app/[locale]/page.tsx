import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PdfToolPage } from '@/app/page';
import {
  getAlternateLanguages,
  getCopy,
  getLocaleKeywords,
  getLocalePath,
  isSupportedLocale,
  localeLanguageTags,
  supportedLocales,
  type Locale,
} from '@/lib/i18n';
import { siteMetadata } from '@/lib/siteMetadata';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isSupportedLocale(localeParam)) {
    return {};
  }

  const pageCopy = getCopy(localeParam);
  const path = getLocalePath(localeParam);

  return {
    title: pageCopy.appTitle,
    description: pageCopy.appSubtitle,
    keywords: getLocaleKeywords(localeParam),
    alternates: {
      canonical: path,
      languages: getAlternateLanguages(),
    },
    openGraph: {
      url: path,
      title: pageCopy.appTitle,
      description: pageCopy.appSubtitle,
      locale: localeLanguageTags[localeParam].replace('-', '_'),
      siteName: siteMetadata.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageCopy.appTitle,
      description: pageCopy.appSubtitle,
    },
  };
}

function getLocaleConfig(locale: Locale) {
  if (locale === 'ko') {
    return {
      showKoreanPresets: true,
      defaultSelectedAgency: 'ecourt',
      defaultMaxSizeMB: 20,
      defaultMaxPages: null,
    };
  }

  return {
    showKoreanPresets: false,
    defaultSelectedAgency: null,
    defaultMaxSizeMB: 10,
    defaultMaxPages: null,
  };
}

function getStructuredData(locale: Locale) {
  const pageCopy = getCopy(locale);
  const pageUrl = `${siteMetadata.url}${getLocalePath(locale)}`;
  const webApplicationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteMetadata.name,
    url: pageUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    inLanguage: localeLanguageTags[locale],
    description: pageCopy.appSubtitle,
    isAccessibleForFree: true,
    featureList: [
      'PDF file validation',
      'PDF page count check',
      'N-up PDF layout',
      'Browser-based PDF compression',
      'Reduce PDF file size',
      'Make PDF files smaller',
      'Compress PDF to a target size',
      'General PDF file size reduction',
      'Local PDF processing without file upload',
    ],
    sameAs: siteMetadata.githubUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: localeLanguageTags[locale],
    mainEntity: [
      [pageCopy.faqUploadQuestion, pageCopy.faqUploadAnswer],
      [pageCopy.faqGeneralQuestion, pageCopy.faqGeneralAnswer],
      [pageCopy.faqTargetQuestion, pageCopy.faqTargetAnswer],
      [pageCopy.faqPrintQuestion, pageCopy.faqPrintAnswer],
    ].map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };

  return [webApplicationStructuredData, faqStructuredData];
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;

  if (!isSupportedLocale(localeParam)) {
    notFound();
  }

  const config = getLocaleConfig(localeParam);

  return (
    <>
      <script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getStructuredData(localeParam)) }}
      />
      <PdfToolPage
        locale={localeParam}
        showKoreanPresets={config.showKoreanPresets}
        defaultSelectedAgency={config.defaultSelectedAgency}
        defaultMaxSizeMB={config.defaultMaxSizeMB}
        defaultMaxPages={config.defaultMaxPages}
      />
    </>
  );
}
