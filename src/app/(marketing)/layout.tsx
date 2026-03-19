import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollRestoration } from "@/components/ScrollRestoration";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollRestoration />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
