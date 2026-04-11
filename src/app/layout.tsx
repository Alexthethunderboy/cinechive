import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, BottomNav, NotificationCenterProvider } from "@/components/layout/Navigation";
import MeshGradient from "@/components/ui/MeshGradient";
import QueryProvider from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from 'sonner';
import { SiteTour } from "@/components/onboarding/SiteTour";

export const metadata: Metadata = {
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
    url: "https://cinechive.app",
    siteName: "CineChive",
    title: "CineChive | Cinematic Library",
    description: "Exquisite curation for Movies, TV, and Cinema.",
    images: [
      {
        url: "https://cinechive.app/og-default.png", // Using a placeholder/canonical path
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
    images: ["https://cinechive.app/og-default.png"],
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
    <html lang="en" className="dark">
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
              position="top-center" 
              toastOptions={{
                className: "glass border-white/10 bg-black/80 text-white font-heading italic",
              }} 
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

