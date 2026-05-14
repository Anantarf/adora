import { getPublicHomebases } from "@/actions/homebase";
import { Metadata } from "next";
import { HomebaseSection } from "@/components/features/homebase-section";
import { GallerySection } from "@/components/features/gallery-section";
import { LandingHeader } from "@/components/features/landing-header";
import { CONTACT } from "@/lib/constants/contact";
import { PROGRAMS } from "@/lib/constants/programs";
import { getAcademicYear } from "@/lib/utils";
import { LandingHeroSection } from "@/components/features/landing/landing-hero-section";
import { LandingProgramsSection } from "@/components/features/landing/landing-programs-section";
import { LandingTurnamenSection } from "@/components/features/landing/landing-turnamen-section";
import { LandingCtaSection } from "@/components/features/landing/landing-cta-section";
import { LandingFooter } from "@/components/features/landing/landing-footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Klub Basket Depok | ADORA Basketball Club",
  description: "ADORA Basketball Club adalah klub basket Depok untuk usia 7–18 tahun. Program latihan modern, pembinaan karakter, dan jalur kompetisi resmi untuk pemain muda.",
  alternates: {
    canonical: "https://adorabbc.com",
  },
  openGraph: {
    title: "Klub Basket Depok | ADORA Basketball Club",
    description: "ADORA Basketball Club membina pemain muda Depok usia 7–18 tahun melalui latihan modern, karakter kuat, dan kompetisi resmi.",
    url: "https://adorabbc.com",
    siteName: "ADORA Basketball",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klub Basket Depok | ADORA Basketball Club",
    description: "ADORA Basketball Club membina pemain muda Depok usia 7–18 tahun melalui latihan modern, karakter kuat, dan kompetisi resmi.",
  },
};

export default async function LandingPage() {
  const homebases = await getPublicHomebases();
  const registrationYearText = getAcademicYear();

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: "ADORA Basketball Club",
    image: "https://adorabbc.com/logo-new.svg",
    description: "Klub bola basket Depok untuk usia 7–18 tahun. Membentuk pemain muda berkarakter melalui pelatihan modern.",
    url: "https://adorabbc.com",
    telephone: `+${CONTACT.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.address,
      addressLocality: "Depok",
      addressRegion: "Jawa Barat",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -6.3456, // Approx Cinere
      longitude: 106.789,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Program Latihan Basket",
      itemListElement: PROGRAMS.map((p, i) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `Program Basket ${p.label}`,
          description: p.desc,
        },
        position: i + 1,
      })),
    },
  };

  return (
    <main className="min-h-screen bg-page-dark text-white relative overflow-x-hidden pt-18">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />
      <LandingHeroSection registrationYearText={registrationYearText} />
      <LandingProgramsSection />
      <HomebaseSection homebases={homebases} />
      <LandingTurnamenSection />
      <GallerySection />
      <LandingCtaSection />
      <LandingFooter />
    </main>
  );
}
