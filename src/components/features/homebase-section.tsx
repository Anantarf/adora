import { type homebase as Homebase } from "@prisma/client";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/fade-in";

interface HomebaseSectionProps {
  homebases: Homebase[];
}

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
    <section className="py-10">
      <div className="container mx-auto px-4">
        <FadeIn direction="up">
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl md:text-4xl text-white uppercase tracking-widest mb-3">Homebase</h2>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
              Pilih homebase terdekat dengan Anda dan mulai bergabung.
            </p>
          </div>
        </FadeIn>

        {sorted.length === 0 ? (
          <FadeIn direction="up" className="text-center py-16">
            <p className="text-white/40 text-sm font-medium">Belum ada homebase yang terdaftar.</p>
            <p className="text-white/30 text-xs mt-2 uppercase tracking-widest">Hubungi Admin untuk informasi homebase terkini.</p>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto" delay={0.2}>
            {sorted.map((homebase) => (
              <StaggerItem
                key={homebase.id}
                className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-primary-soft hover:border-primary/50 transition-all duration-300 flex flex-col group"
              >
                {/* Image slot */}
                <div className="w-full aspect-video sm:aspect-[16/7] bg-page-dark relative flex items-center justify-center border-b border-white/10 overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors z-10" />
                  <span className="text-white/30 text-xs font-bold uppercase tracking-widest z-20 px-4 text-center">
                    Slot Foto {displayName(homebase.name)}
                  </span>
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col gap-3">
                  {/* Homebase name — tanpa "(Pusat)" dll */}
                  <h3 className="font-heading text-2xl md:text-3xl font-bold text-white group-hover:text-primary transition-colors uppercase tracking-widest leading-tight">
                    {displayName(homebase.name)}
                  </h3>

                  {/* Nama lapangan/GOR (dari field description) */}
                  {homebase.description && (
                    <p className="text-primary text-sm font-bold uppercase tracking-widest">
                      {homebase.description}
                    </p>
                  )}

                  {/* Alamat */}
                  <div className="flex items-start gap-2 text-white/70 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                    <span>{homebase.address}</span>
                  </div>

                  {/* Telepon */}
                  {homebase.phone && (
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                      <span>{formatPhone(homebase.phone)}</span>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-4">
                    <Link
                      href={`/register?homebase=${homebase.id}`}
                      className="inline-flex cursor-pointer bg-primary hover:bg-primary/90 text-black px-6 py-2.5 rounded-full font-bold transition-all text-[10px] uppercase tracking-widest hover:scale-105"
                    >
                      Daftar di Sini
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
