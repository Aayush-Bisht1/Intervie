"use client";
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-cyan-200 mb-8">
              <Sparkles className="w-4 h-4 text-cyan-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Interview Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900">
              Master Your
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> Interview Skills</span>
              <br />
              with AI & Experts
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Practice with AI mock interviews tailored to your resume, or connect with real interviewers 
              for live coding sessions, whiteboard challenges, and comprehensive feedback.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                Start AI Interview
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button className="border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-600 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300">
                <Play className="mr-2 w-4 h-4" />
                Watch Demo
              </Button>
            </div>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                No credit card required
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Free AI mock interviews
              </div>
            </div>
          </div>
          
          {/* Right Content - Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
              <Image
                src={heroImage} 
                alt="AI-powered interview platform interface"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg">
              AI Powered
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-xl shadow-lg">
              <div className="text-sm font-medium text-gray-900">95% Success Rate</div>
            </div>
            
          </div>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm mb-8">Trusted by professionals from</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">Google</div>
            <div className="text-2xl font-bold text-gray-400">Microsoft</div>
            <div className="text-2xl font-bold text-gray-400">Amazon</div>
            <div className="text-2xl font-bold text-gray-400">Meta</div>
            <div className="text-2xl font-bold text-gray-400">Apple</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;