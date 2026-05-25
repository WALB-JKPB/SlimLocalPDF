import type { Metadata } from "next";
import Script from "next/script";
import { ADSENSE_CLIENT_ID } from "@/lib/ads";
import { analyticsConfig } from "@/lib/analytics";
import { siteMetadata } from "@/lib/siteMetadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.url),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.name}`,
  },
  description: siteMetadata.description,
  applicationName: siteMetadata.name,
  authors: [{ name: siteMetadata.creator, url: siteMetadata.githubUrl }],
  creator: siteMetadata.creator,
  publisher: siteMetadata.publisher,
  keywords: siteMetadata.keywords,
  referrer: 'origin-when-cross-origin',
  classification: 'PDF utility',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: siteMetadata.locale,
    siteName: siteMetadata.name,
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'SlimLocalPDF',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'productivity',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsEnabled = analyticsConfig.enabled && Boolean(analyticsConfig.measurementId);

  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {analyticsEnabled && (
          <>
            <Script
              id="google-analytics-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.measurementId}`}
            />
            <Script
              id="google-analytics-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${analyticsConfig.measurementId}', {
                    anonymize_ip: true
                  });
                `,
              }}
            />
          </>
        )}
        {children}
      </body>
    </html>
  );
}
