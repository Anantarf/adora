import Link from "next/link";
import Image from "next/image";
import { MapPin, MessageCircle, Music2 } from "lucide-react";
import { CONTACT } from "@/lib/constants/contact";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { InstagramIcon } from "@/components/features/landing-header";

export function LandingFooter() {
  return (
    <footer className="border-t-8 border-brand-purple bg-page-dark pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-24 h-24 flex items-center justify-center">
                <Image src="/logo-new.svg" alt="Adora BBC Logo" width={96} height={96} className="w-auto h-auto object-contain" style={{ width: "auto", height: "auto" }} />
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6 font-medium">
              Berdiri sejak 2020, Adora Basketball Club (ADORA BBC) berdedikasi menjadi pusat pembinaan basket terdepan di Depok. Misi kami tidak hanya mencetak atlet berprestasi, tetapi juga membangun karakter anak bangsa yang sportif,
              disiplin, dan tangguh melalui olahraga.
            </p>
            <div className="flex gap-4">
              <a
                href={`https://instagram.com/${CONTACT.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-orange hover:text-black hover:border-black transition-all"
                aria-label="Instagram ADORA BBC"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href={`https://www.tiktok.com/@${CONTACT.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-orange hover:text-black hover:border-black transition-all"
                aria-label="TikTok ADORA BBC"
              >
                <Music2 className="w-5 h-5" />
              </a>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-brand-orange hover:text-black hover:border-black transition-all"
                aria-label="WhatsApp ADORA BBC"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <h4 className="font-heading text-lg font-black uppercase tracking-widest text-brand-yellow mb-6">Navigasi</h4>
            <ul className="space-y-4">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="text-sm text-white/70 hover:text-brand-orange transition-colors font-bold uppercase tracking-wider">
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-sm text-brand-orange hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-2">
                  Login Portal →
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-heading text-lg font-black uppercase tracking-widest text-brand-yellow mb-6">Kontak Kami</h4>
            <ul className="space-y-4 text-sm text-white/70 font-medium">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 w-5 h-5 shrink-0 text-brand-orange" />
                <span>{CONTACT.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 shrink-0 text-brand-orange" />
                <span>
                  +{CONTACT.whatsapp} ({CONTACT.whatsapp_name})
                </span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 shrink-0 text-brand-orange" />
                <span>
                  +{CONTACT.whatsapp_alt} ({CONTACT.whatsapp_alt_name})
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">&copy; {new Date().getFullYear()} ADORA Basketball Club. All rights reserved.</p>
          <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Licensed by PERBASI</p>
        </div>
      </div>
    </footer>
  );
}
