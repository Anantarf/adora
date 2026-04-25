import { formatFullDate } from "@/lib/date-utils";
import Link from "next/link";
import { ArrowRight, UserPlus, Clock } from "lucide-react";

type RegistrationProps = {
  registrations: {
    id: string;
    playerName: string;
    ageGroup: string;
    createdAt: Date;
    status: string;
  }[];
  isLoading?: boolean;
};

export function RecentRegistrations({ registrations, isLoading }: RegistrationProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col border border-border/50 rounded-xl bg-card/30 overflow-hidden h-full">
        <div className="p-6 border-b border-border/50">
          <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(234, 179, 8, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 179, 8, 0.4);
        }
      `}</style>
      <div className="flex flex-col border border-border/50 rounded-xl bg-card/30 overflow-hidden h-full transition-all duration-300 hover:border-border/80">
      <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card/50">
        <div>
          <h2 className="font-heading text-lg tracking-wider text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            PENDAFTAR BARU
          </h2>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">
            Calon anggota yang menunggu persetujuan
          </p>
        </div>
        
        {registrations.length > 0 && (
          <div className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md">
            {registrations.length} ANTREAN
          </div>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col min-h-[380px]">
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center flex-1 border border-dashed border-border/50 rounded-lg bg-card/20">
            <UserPlus className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Tidak ada pendaftar baru</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Semua pendaftar telah diproses
            </p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50 hover:bg-card/80 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-md mt-0.5">
                    <UserPlus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {reg.playerName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] font-medium tracking-wide bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {reg.ageGroup}
                      </span>
                      <span className="text-[11px] flex items-center gap-1 text-muted-foreground/80">
                        <Clock className="w-3 h-3" />
                        {formatFullDate(reg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/registrations"
                  className="mt-3 sm:mt-0 text-xs font-semibold text-primary/80 hover:text-primary flex items-center gap-1 self-start sm:self-center transition-colors group-hover:translate-x-1 duration-300"
                >
                  Proses <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {registrations.length > 0 && (
        <div className="px-6 pb-6 pt-2">
          <Link
            href="/dashboard/registrations"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase bg-muted/50 hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg transition-all"
          >
            Lihat Semua Pendaftar
          </Link>
        </div>
      )}
      </div>
    </>
  );
}
