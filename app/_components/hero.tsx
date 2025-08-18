import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import heroImage from "../_assets/hero-interview.jpg"; 
import Image from "next/image";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 animated-bg">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary border border-accent/20 mb-8">
              <Sparkles className="w-4 h-4 text-accent mr-2" />
              <span className="text-sm font-medium">AI-Powered Interview Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Master Your
              <span className="gradient-text"> Interview Skills</span>
              <br />
              with AI & Experts
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Practice with AI mock interviews tailored to your resume, or connect with real interviewers 
              for live coding sessions, whiteboard challenges, and comprehensive feedback.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className="btn-hero group">
                Start AI Interview
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button className="btn-hero-outline group">
                <Play className="mr-2 w-4 h-4" />
                Watch Demo
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center lg:justify-start space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                No credit card required
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-accent rounded-full mr-2"></div>
                Free AI mock interviews
              </div>
            </div>
          </div>
          
          {/* Right Content - Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-[var(--shadow-hero)]">
              <Image
                src={heroImage} 
                alt="AI-powered interview platform interface"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-hero-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-xl font-semibold shadow-lg">
              AI Powered
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card border border-border px-4 py-2 rounded-xl shadow-lg">
              <div className="text-sm font-medium">95% Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;