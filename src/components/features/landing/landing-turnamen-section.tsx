import { Trophy } from "lucide-react";
import { AutoFadeCarousel } from "@/components/ui/auto-fade-carousel";
import { FadeIn } from "@/components/animations/fade-in";
import { CONTACT } from "@/lib/constants/contact";

export function LandingTurnamenSection() {
  return (
    <section id="turnamen" className="relative pt-10 pb-14 md:pt-16 md:pb-24 bg-brand-purple scroll-mt-20 clip-diagonal z-30 -mt-10">
      <div className="absolute inset-0 pattern-halftone opacity-20 pointer-events-none overflow-hidden"></div>

      <div className="container mx-auto px-4 relative z-10">
        <FadeIn direction="up">
          <div className="grid lg:grid-cols-2 gap-5 lg:gap-8 items-center bg-black/40 backdrop-blur-md border border-white/10 p-4 sm:p-5 md:p-10 rounded-card-lg shadow-2xl">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 md:gap-8">
              <div className="w-full">
                <div className="inline-block skew-box bg-brand-yellow px-4 py-1 mb-3 md:mb-4 border-b-4 border-r-4 border-black">
                  <span className="unskew-content block font-heading font-black uppercase text-black text-xs tracking-widest">EVENT & TURNAMEN</span>
                </div>
                <h3 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white uppercase tracking-widest mb-2 md:mb-3 italic drop-shadow-lg wrap-break-word">
                  Adora Sports <br />
                  <span className="text-brand-orange pr-2">Entertainment</span>
                </h3>
                <p className="text-white/80 text-xs md:text-base leading-relaxed mb-4 md:mb-6 font-medium">Dua turnamen resmi yang kami selenggarakan setiap tahun sebagai wadah kompetisi usia dini terbaik di Depok.</p>
                <ul className="text-left space-y-2 md:space-y-3 text-sm md:text-base text-white">
                  <li className="flex items-start gap-3 md:gap-4 bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10 hover:border-brand-orange transition-colors">
                    <div className="bg-brand-orange p-3 rounded-xl shrink-0 text-black">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <strong className="text-brand-yellow font-black text-xl tracking-widest uppercase block mb-1">ASBC</strong>
                      <span className="text-white/70">Adora Student Basketball Championship (ASBC), turnamen antar pelajar sekolah.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 md:gap-4 bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10 hover:border-brand-orange transition-colors">
                    <div className="bg-brand-orange p-3 rounded-xl shrink-0 text-black">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <strong className="text-brand-yellow font-black text-xl tracking-widest uppercase block mb-1">ABCC</strong>
                      <span className="text-white/70">Adora Basketball Club Championship (ABCC), kompetisi seru antar klub basket.</span>
                    </div>
                  </li>
                </ul>
              </div>

              <a
                href={`https://instagram.com/${CONTACT.asbc_instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex skew-box items-center gap-2 bg-transparent border-4 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-black px-6 py-3 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 shadow-[4px_4px_0px_#000]"
              >
                <span className="unskew-content flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  INFO TURNAMEN
                </span>
              </a>
            </div>

            <div className="w-full relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-orange/20 blur-xl animate-pulse z-0"></div>
              <div className="relative z-10 border-4 border-black shadow-[6px_6px_0px_#CCFF00] sm:shadow-[12px_12px_0px_#CCFF00] rounded-card overflow-hidden bg-black">
                <AutoFadeCarousel images={["/images/tournaments/asbcnew1.JPG", "/images/tournaments/asbcnew2.JPG", "/images/tournaments/asbcnew3.jpg", "/images/tournaments/asbc4.jpg", "/images/tournaments/asbc5.jpg"]} />
              </div>

              <a
                href={`https://instagram.com/${CONTACT.asbc_instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex lg:hidden mt-4 mx-auto skew-box items-center gap-2 bg-transparent border-4 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-black px-6 py-3 font-black uppercase tracking-widest text-xs transition-all shadow-[4px_4px_0px_#000]"
              >
                <span className="unskew-content flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  INFO TURNAMEN
                </span>
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
