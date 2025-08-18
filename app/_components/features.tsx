import { Bot, Users, Code, Video, MessageSquare, FileText } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Mock Interviews",
      description: "Practice with AI interviewers that adapt to your resume and target role. Get instant feedback and improve your responses.",
      gradient: "from-hero-primary to-hero-secondary",
    },
    {
      icon: Users,
      title: "Expert Interviewers",
      description: "Connect with industry professionals for realistic interview experiences and personalized guidance.",
      gradient: "from-accent to-hero-accent",
    },
    {
      icon: Code,
      title: "Live Coding Platform",
      description: "Code in real-time with collaborative editors, multiple language support, and instant execution.",
      gradient: "from-hero-secondary to-accent",
    },
    {
      icon: Video,
      title: "Video Interviews",
      description: "High-quality video calls with screen sharing, recording capabilities, and seamless connectivity.",
      gradient: "from-primary to-hero-primary",
    },
    {
      icon: MessageSquare,
      title: "Interactive Whiteboard",
      description: "Solve system design problems and algorithms on a shared digital whiteboard with your interviewer.",
      gradient: "from-hero-accent to-hero-secondary",
    },
    {
      icon: FileText,
      title: "Resume Analysis",
      description: "AI analyzes your resume to create targeted questions and identify areas for improvement.",
      gradient: "from-accent to-primary",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="gradient-text"> Ace Your Interviews</span>
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
                className="feature-card group"
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