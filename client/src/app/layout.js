import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import ToastProvider from "../../components/providers/ToastProvider";
import SessionErrorProvider from "../../components/providers/SessionErrorProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SGA - Sistema de Gestión Administrativa",
  description: "Sistema de Gestión Administrativa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true}>
        <SessionErrorProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionErrorProvider>
      </body>
    </html>
  );
}
