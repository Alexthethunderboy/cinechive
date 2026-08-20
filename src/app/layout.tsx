import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, BottomNav, NotificationCenterProvider } from "@/components/layout/Navigation";
import MeshGradient from "@/components/ui/MeshGradient";
import QueryProvider from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from 'sonner';
import { SiteTour } from "@/components/onboarding/SiteTour";

export const metadata: Metadata = {
  metadataBase: new URL("https://cinechive.vercel.app"),
  title: {
    default: "CineChive | Cinematic Library",
    template: "%s | CineChive"
  },
  description: "Exquisite curation, deep metadata, and shared frequencies for Movies, TV, and Cinema.",
  keywords: ["Cinema", "Curation", "Film Registry", "Movie Collection", "TV Tracker", "Anime Library"],
  authors: [{ name: "CineChive Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CineChive",
    title: "CineChive | Cinematic Library",
    description: "Exquisite curation for Movies, TV, and Cinema.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "CineChive Cinematic Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CineChive | Cinematic Library",
    description: "Exquisite curation for Movies, TV, and Cinema.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="antialiased selection:bg-vibe-violet/30 selection:text-white h-dvh min-h-dvh overflow-hidden">
        <QueryProvider>
          <AuthProvider>
            <NotificationCenterProvider>
              <div className="flex h-full">
                <Sidebar />

                <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-28 md:pb-0">
                  <MeshGradient />
                  
                  <div className="relative z-10 w-full">
                    {children}
                  </div>
                </main>

                <BottomNav />
              </div>
              <SiteTour />
            </NotificationCenterProvider>
            <Toaster
              theme="dark"
              position="top-center"
              closeButton
              expand
              visibleToasts={4}
              gap={10}
              duration={4500}
              mobileOffset={{ top: 16, left: 12, right: 12 }}
              toastOptions={{
                unstyled: true,
                classNames: {
                  toast: 'group flex w-full items-start gap-3 rounded-2xl border border-white/12 bg-zinc-950/95 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl',
                  title: 'text-sm font-bold leading-5 tracking-tight text-white',
                  description: 'mt-0.5 text-xs leading-5 text-zinc-400',
                  icon: 'mt-0.5 shrink-0',
                  closeButton: 'ml-auto flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white',
                  success: 'border-emerald-400/20',
                  error: 'border-red-400/25',
                  warning: 'border-amber-400/25',
                  info: 'border-cyan-400/20',
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
