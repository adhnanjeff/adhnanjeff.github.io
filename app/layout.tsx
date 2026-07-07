import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces, Roboto_Flex } from "next/font/google";
import { DEFAULT_MODE, MODE_COOKIE } from "@/lib/mode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

// Variable font with width + optical-size axes, powers the interactive
// TextPressure hero (font-variation-settings 'wght' + 'wdth').
const robotoFlex = Roboto_Flex({
  variable: "--font-flex",
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth", "opsz"],
});

export const metadata: Metadata = {
  title: "Adhnan Jeff, Software Engineer",
  description:
    "Two ways of knowing me: Engineer Mode (a real terminal) or Story Mode (an editorial site). Backend & distributed systems, Java/Spring Boot, .NET, Kafka, AWS.",
  metadataBase: new URL("https://adhnanjeff.github.io"),
  openGraph: {
    title: "Adhnan Jeff, Software Engineer",
    description: "Two ways of knowing me, Engineer Mode or Story Mode.",
    type: "website",
  },
};

// No server on GitHub Pages, so the persisted mode is applied to <html> by a
// tiny script that runs before first paint (reads the cookie synchronously),
// keeping the mode-scoped styles correct with no theme flash.
const NO_FLASH = `(function(){try{var m=document.cookie.match(/(?:^|; )${MODE_COOKIE}=([^;]*)/);var mode=(m&&m[1]==='engineer')?'engineer':'${DEFAULT_MODE}';var r=document.documentElement;r.classList.remove('mode-engineer','mode-story');r.classList.add('mode-'+mode);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`mode-${DEFAULT_MODE} ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${robotoFlex.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
        {children}
      </body>
    </html>
  );
}
