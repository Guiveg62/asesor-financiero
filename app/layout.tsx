import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asesor Financiero",
  description: "Diagnóstico financiero personal — sistema sueco.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
