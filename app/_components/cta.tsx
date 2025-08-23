"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const CTA = () => {
  const benefits = [
    "Free AI mock interviews",
    "Expert interviewer network",
    "Live coding & whiteboard tools",
    "Detailed performance analytics",
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500"></div>
          
          {/* Content */}
          <div className="relative px-8 py-16 text-center text-white">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Ace Your Next Interview?
            </h2>
            
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of professionals who've improved their interview skills 
              and landed their dream jobs with Intervie.
            </p>
            
            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center justify-center sm:justify-start">
                  <CheckCircle className="w-5 h-5 mr-3 text-white" />
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl group shadow-lg">
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 rounded-xl transition-all duration-300">
                Book Expert Session
              </Button>
            </div>
            
            <p className="text-white/70 text-sm mt-6">
              No credit card required • Cancel anytime • 14-day free trial
            </p>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>
      </div>
    </section>
  );
};

export default CTA;