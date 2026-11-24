import type { Metadata, Viewport } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/lib/theme/theme";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";

const APP_NAME = "PWA Oropeza";
const APP_DESC = "Ecosistema de comercio GestoPago: recargas, pagos y administracion de tu cuenta.";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s`,
  },
  description: APP_DESC,
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESC,
    locale: "es_MX",
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESC,
  },
  // No indexamos la app en buscadores: es una app autenticada.
  robots: { index: false, follow: false, nocache: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1E4FBF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
