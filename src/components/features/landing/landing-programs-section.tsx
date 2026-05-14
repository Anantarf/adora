import Image from "next/image";
import { Zap } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { PROGRAMS } from "@/lib/constants/programs";

export function LandingProgramsSection() {
  return (
    <section id="program" className="pt-10 pb-16 md:pt-16 md:pb-24 bg-page-dark scroll-mt-20 relative -mt-10 z-10">
      <div className="container mx-auto px-4">
        <FadeIn direction="up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
              <h2 className="font-heading font-black text-2xl md:text-4xl text-white uppercase tracking-widest italic">PROGRAM KELAS</h2>
            </div>
            <p className="text-white/60 max-w-2xl mx-auto font-medium text-xs md:text-base px-4">Pelatihan berbasis usia untuk memaksimalkan potensi, fisik, dan mental pemain.</p>
          </div>
        </FadeIn>

        <StaggerContainer className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto" delay={0.2}>
          {PROGRAMS.map(({ label, ages, desc, image }) => (
            <StaggerItem key={label} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-md relative group">
              <div className="absolute inset-0 bg-brand-purple rounded-card transform translate-x-1.5 translate-y-1.5 sm:translate-x-3 sm:translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform z-0"></div>

              <div className="relative z-10 bg-surface-dark border-2 border-white/10 group-hover:border-brand-yellow rounded-card transition-all flex flex-col overflow-hidden shadow-xl w-full aspect-16/10 sm:aspect-4/3 block">
                <div className="absolute inset-0 bg-black">
                  {image ? (
                    <Image
                      src={image}
                      alt={`Program Latihan Basket ${label} Adora Basketball Club Depok - ${ages}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={50}
                      priority={label === "KU‑8" || label === "KU‑12"}
                      className="object-cover transition-all duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 pattern-halftone opacity-30 z-0"></div>
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-white/20 font-heading font-black text-lg uppercase tracking-widest text-center italic">FOTO {label}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent z-10"></div>

                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 skew-box bg-brand-yellow text-black px-2 py-0.5 sm:px-3 sm:py-1 shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] border border-black">
                  <span className="unskew-content block font-heading font-black text-[10px] sm:text-xs tracking-widest italic">{ages}</span>
                </div>

                <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-end z-20">
                  <h3 className="font-heading font-black text-lg sm:text-2xl text-white tracking-widest mb-0.5 sm:mb-1 uppercase italic group-hover:text-brand-yellow transition-colors drop-shadow-lg leading-tight">{label}</h3>
                  <p className="text-white/70 text-[10px] sm:text-sm leading-tight font-medium drop-shadow-md">{desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
