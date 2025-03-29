import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "config/material-tailwind-theme-provider";
import ReactQueryClientProvider from "config/ReactQueryClientProvider";
import RecoilProvider from "config/RecoilProvider";
import MainLayout from "components/layouts/main-layout";
import Auth from "components/auth";
import { createServerSupabaseClient } from "utils/supabase/server";
import AuthProvider from "config/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instagram clone",
  description: "nextjs supabase Instagram clone",
  openGraph: {
    images: [
      {
        url: "https://inflearn-nextjs-supabase-instagram-clone.vercel.app/images/inflearngram.png",
        alt: "inflearngram",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css"
          integrity="sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className}>
        <RecoilProvider>
          <ReactQueryClientProvider>
            <ThemeProvider>
              <AuthProvider accessToken={session?.access_token}>
                {session?.user ? <MainLayout>{children}</MainLayout> : <Auth />}
              </AuthProvider>
            </ThemeProvider>
          </ReactQueryClientProvider>
        </RecoilProvider>
      </body>
    </html>
  );
}
