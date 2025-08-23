"use client";
import { Bot, Users, Code, Video, MessageSquare, FileText } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Mock Interviews",
      description: "Practice with AI interviewers that adapt to your resume and target role. Get instant feedback and improve your responses.",
      gradient: "from-blue-600 to-purple-600",
    },
    {
      icon: Users,
      title: "Expert Interviewers",
      description: "Connect with industry professionals for realistic interview experiences and personalized guidance.",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      icon: Code,
      title: "Live Coding Platform",
      description: "Code in real-time with collaborative editors, multiple language support, and instant execution.",
      gradient: "from-purple-600 to-cyan-500",
    },
    {
      icon: Video,
      title: "Video Interviews",
      description: "High-quality video calls with screen sharing, recording capabilities, and seamless connectivity.",
      gradient: "from-indigo-600 to-blue-600",
    },
    {
      icon: MessageSquare,
      title: "Interactive Whiteboard",
      description: "Solve system design problems and algorithms on a shared digital whiteboard with your interviewer.",
      gradient: "from-teal-500 to-purple-600",
    },
    {
      icon: FileText,
      title: "Resume Analysis",
      description: "AI analyzes your resume to create targeted questions and identify areas for improvement.",
      gradient: "from-cyan-500 to-indigo-600",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> Ace Your Interviews</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From AI-powered practice sessions to live expert interviews, we provide 
            comprehensive tools to boost your interview confidence and success rate.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="group bg-card border border-border rounded-2xl p-8 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;