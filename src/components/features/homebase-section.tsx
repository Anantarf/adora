import { type homebase as Homebase } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Zap } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";

interface HomebaseSectionProps {
  homebases: Homebase[];
}

/** Mapping homebase display name to image path */
const HOMEBASE_IMAGES: Record<string, string> = {
  "ADORA Gandul": "/images/homebases/homecourt.JPG",
  "ADORA Cibubur": "/images/homebases/cibubur.jpg",
};

/** Strip parenthetical suffix: "ADORA Gandul (Pusat)" → "ADORA Gandul" */
function displayName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*$/, "").trim();
}

/** Format raw phone to +62 xxx-xxx-xxxx */
function formatPhone(phone: string): string {
  if (phone.startsWith("62")) return `+${phone}`;
  return phone;
}

export function HomebaseSection({ homebases }: HomebaseSectionProps) {
  const rank = (n: string) =>
    n.toLowerCase().includes("gandul") || n.toLowerCase().includes("pusat") ? 0 : 1;
  const sorted = [...homebases].sort((a, b) => rank(a.name) - rank(b.name));

  return (
    <section id="homebase" className="pt-12 pb-24 relative overflow-hidden bg-page-dark scroll-mt-20 z-20">
      {/* Background Ornament */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-orange/5 blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <FadeIn direction="up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-brand-orange fill-brand-orange" />
              <h2 className="font-heading font-black text-3xl md:text-5xl text-white uppercase tracking-widest italic">HOMEBASE</h2>
            </div>
            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto font-medium">
              Pilih lokasi latihan terdekat dan jadilah bagian dari kami.
            </p>
          </div>
        </FadeIn>

        {sorted.length === 0 ? (
          <FadeIn direction="up" className="text-center py-16">
            <p className="text-brand-orange text-lg font-bold uppercase tracking-widest italic">Belum ada homebase yang terdaftar.</p>
            <p className="text-white/60 text-sm mt-2 font-medium">Hubungi Admin untuk informasi lebih lanjut.</p>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto" delay={0.2}>
            {sorted.map((homebase) => {
              const name = displayName(homebase.name);
              const imageUrl = HOMEBASE_IMAGES[name];

              return (
                <StaggerItem
                  key={homebase.id}
                  className="relative group h-full"
                >
                  {/* Pop-out Shadow Box */}
                  <div className="absolute inset-0 bg-brand-yellow rounded-2xl transform translate-x-2 translate-y-2 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-300 z-0 opacity-0 group-hover:opacity-100"></div>

                  <div className="relative z-10 border-2 border-white/10 group-hover:border-brand-yellow rounded-2xl overflow-hidden shadow-xl transition-all duration-300 block w-full aspect-[3/2] bg-surface-dark">
                    
                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 pattern-halftone opacity-30 z-0" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white/20 font-heading font-black text-lg lg:text-xl uppercase tracking-widest text-center italic px-4">
                              FOTO {name}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Gradient Overlay for Text Readability (Lighter) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                    {/* Overlay Text Content */}
                    <div className="absolute inset-0 p-5 lg:p-6 flex flex-col justify-end z-20">
                      {homebase.description && (
                        <div className="mb-2 inline-block bg-brand-orange border-2 border-black text-black px-2.5 py-0.5 rounded self-start shadow-[3px_3px_0px_#000] -rotate-2">
                          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                            📍 {homebase.description}
                          </p>
                        </div>
                      )}

                      <h3 className="font-heading font-black text-xl md:text-2xl text-white group-hover:text-brand-yellow transition-colors uppercase tracking-widest leading-tight italic drop-shadow-lg mb-1 md:mb-2">
                        {displayName(homebase.name)}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-white/80 text-[10px] md:text-xs font-medium drop-shadow-md">
                          <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 text-brand-orange mt-0.5" />
                          <span className="leading-relaxed line-clamp-2">{homebase.address}</span>
                        </div>
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
