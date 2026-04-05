import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/features/AdminSidebar"
import { AuthGuard } from "@/components/providers/auth-guard"

// The layout that strictly bounds all internal admin pages (/dashboard/*)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="flex relative w-full flex-col min-h-[100dvh] bg-background selection:bg-primary/20">

          <header className="flex h-[3.75rem] w-full shrink-0 items-center justify-between border-b border-border/60 px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-30 transition-all relative">
            <div className="flex items-center gap-2 z-10">
              <SidebarTrigger className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all rounded-md" />
            </div>
            
            {/* Centered Top Nav Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max">
               <h1 className="text-lg md:text-xl lg:text-2xl text-gradient uppercase italic leading-tight font-black">
                  Adora <span className="tracking-widest ml-0.5">Basketball Club</span>
               </h1>
            </div>

            <div className="w-9 h-9 placeholder z-10" />
          </header>
          <div className="w-full flex-1 mx-auto max-w-[1500px] px-4 py-4 sm:px-6 md:px-8 md:pt-6 md:pb-10 lg:px-10 lg:pt-6 lg:pb-12">
            <div className="w-full animate-in fade-in zoom-in-[0.98] duration-200 ease-out fill-mode-both">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
