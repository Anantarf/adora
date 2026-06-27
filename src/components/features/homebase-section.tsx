import { type homebase as Homebase } from "@prisma/client";
import Image from "next/image";
import { ExternalLink, MapPin, Zap } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";

interface HomebaseSectionProps {
  homebases: Homebase[];
}

/** Mapping homebase display name to image path and map query */
const HOMEBASE_LOOKUP: Record<string, { image: string; mapsQuery: string }> = {
  "ADORA Gandul": {
    image: "/images/homebases/homecourt.JPG",
    mapsQuery: "Homecourt Cinere, Depok"
  },
  "ADORA Cibubur": {
    image: "/images/homebases/cibubur.jpg",
    mapsQuery: "GOR Cileungsi"
  },
};

/** Strip parenthetical suffix: "ADORA Gandul (Pusat)" → "ADORA Gandul" */
function displayName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*$/, "").trim();
}

export function HomebaseSection({ homebases }: HomebaseSectionProps) {
  const rank = (n: string) => (n.toLowerCase().includes("gandul") || n.toLowerCase().includes("pusat") ? 0 : 1);
  const sorted = [...homebases].sort((a, b) => rank(a.name) - rank(b.name));

  return (
    <section id="homebase" className="pt-12 pb-16 md:pb-24 relative overflow-hidden bg-page-dark scroll-mt-20 z-20">
      {/* Background Ornament */}

      <div className="container mx-auto px-4 relative z-10">
        <FadeIn direction="up">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-brand-orange fill-brand-orange" />
              <h2 className="text-h2 text-white uppercase text-balance">HOMEBASE</h2>
            </div>
            <p className="text-white/70 text-body-lg max-w-2xl mx-auto text-pretty">Pilih lokasi latihan terdekat dan jadilah bagian dari kami.</p>
          </div>
        </FadeIn>

        {sorted.length === 0 ? (
          <FadeIn direction="up" className="text-center py-16">
            <p className="text-brand-orange text-h3 uppercase">Belum ada homebase yang terdaftar.</p>
            <p className="text-white/60 text-body mt-2">Hubungi Admin untuk informasi lebih lanjut.</p>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto" delay={0.2}>
            {sorted.map((homebase) => {
              const name = displayName(homebase.name);
              const lookup = HOMEBASE_LOOKUP[name] || { image: "", mapsQuery: homebase.address || name };
              const imageUrl = lookup.image;

              return (
                <StaggerItem key={homebase.id} className="relative group h-full">
                  {/* Pop-out Shadow Box */}
                  <div className="absolute inset-0 bg-brand-yellow rounded-2xl transform translate-x-2 translate-y-2 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-300 z-0 opacity-0 group-hover:opacity-100"></div>

                  <div className="relative z-10 border-2 border-white/10 group-hover:border-brand-yellow rounded-2xl overflow-hidden shadow-xl transition-all duration-300 block w-full aspect-photo bg-surface-dark">
                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={75}
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 pattern-halftone opacity-30 z-0" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white/20 text-h3 uppercase text-center px-4">FOTO {name}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Gradient Overlay for Text Readability (Lighter) */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/84 via-black/14 to-transparent z-10" />

                    {/* Overlay Text Content */}
                    <div className="absolute inset-0 p-5 lg:p-6 flex flex-col justify-end z-20">
                      <h3 className="text-h3 text-white group-hover:text-brand-yellow transition-colors uppercase leading-tight drop-shadow-lg mb-1 md:mb-2 text-balance">
                        {displayName(homebase.name)}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-white/85 text-body drop-shadow-md mb-2">
                          <MapPin className="w-4 h-4 shrink-0 text-brand-orange mt-0.5" />
                          <span className="leading-relaxed line-clamp-2">{homebase.address}</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lookup.mapsQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Buka rute ke ${lookup.mapsQuery} di Google Maps`}
                          className="inline-flex items-center gap-1.5 text-[10px] min-h-10 md:text-[11px] font-black uppercase tracking-wide md:tracking-widest text-brand-yellow hover:text-white transition-colors group/link"
                        >
                          Buka di Google Maps
                          <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
