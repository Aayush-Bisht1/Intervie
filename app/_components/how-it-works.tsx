"use client";
import { Upload, Brain, Video, TrendingUp } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload Your Resume",
      description: "Simply upload your resume and select your target role. Our AI analyzes your background instantly.",
      step: "01",
    },
    {
      icon: Brain,
      title: "AI Creates Custom Questions",
      description: "Based on your resume and role, AI generates personalized interview questions and scenarios.",
      step: "02",
    },
    {
      icon: Video,
      title: "Practice or Go Live",
      description: "Start with AI mock interviews or jump into live sessions with expert interviewers.",
      step: "03",
    },
    {
      icon: TrendingUp,
      title: "Get Feedback & Improve",
      description: "Receive detailed feedback, performance metrics, and actionable insights to improve.",
      step: "04",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            How <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Intervie</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From upload to success in just four simple steps. 
            Our streamlined process gets you interview-ready faster than ever.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-accent to-transparent z-0" />
                )}
                
                <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center relative z-10">
                  {/* Step Number */}
                  <div className="text-6xl font-bold text-accent/20 mb-4">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-hero-primary to-hero-secondary flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;