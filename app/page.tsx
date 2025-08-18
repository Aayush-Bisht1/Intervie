import { Button } from "@/components/ui/button";
import Image from "next/image";
import Navbar from "./_components/navbar";
import Hero from "./_components/hero";
import Features from "./_components/features";
import HowItWorks from "./_components/how-it-works";
import CTA from "./_components/cta";
import Footer from "./_components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
