import type { Metadata } from "next";
import "./globals.css";
import ReactQueryProvider from "@/context/ReactQuery";

export const metadata: Metadata = {
  title: "Oree · Admin Console",
  description: "Internal super-admin console for the Oree platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
