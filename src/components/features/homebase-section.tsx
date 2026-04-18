import { type homebase as Homebase } from "@prisma/client";
import Link from "next/link";

interface HomebaseSectionProps {
  homebases: Homebase[];
}

export function HomebaseSection({ homebases }: HomebaseSectionProps) {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-4 text-center uppercase tracking-widest">Lokasi Kami</h2>
        <p className="text-center text-foreground/60 mb-16 text-lg">Pilih lokasi yang paling dekat dengan Anda</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {homebases.map((homebase) => (
            <div key={homebase.id} className="bg-card border-2 border-primary p-6 md:p-8 rounded-[16px] shadow-sm hover:bg-white/20 transition-all duration-300 group">
              <h3 className="font-heading text-2xl font-bold text-primary mb-3 group-hover:text-yellow-400 transition wrap-break-word">{homebase.name}</h3>
              <div className="space-y-3 text-foreground/80 mb-6">
                <p className="wrap-break-word">
                  <span className="text-primary font-semibold">📍 Alamat:</span> {homebase.address}
                </p>
                <p className="wrap-break-word">
                  <span className="text-primary font-semibold">📞 Telepon:</span> {homebase.phone}
                </p>
              </div>
              {homebase.description && <p className="text-foreground/60 mb-6 italic wrap-break-word">{homebase.description}</p>}
              <Link href={`/register?homebase=${homebase.id}`} className="inline-block bg-primary text-white px-8 py-3 rounded font-bold hover:bg-primary/80 transition-all duration-300 transform hover:scale-105">
                Daftar di {homebase.name.split("(")[0].trim()}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
