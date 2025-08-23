"use client";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Crown } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started with AI mock interviews",
      icon: Star,
      gradient: "from-gray-500 to-gray-600",
      popular: false,
      features: [
        "3 AI mock interviews per month",
        "Basic feedback reports",
        "Resume upload & analysis",
        "Email support",
        "Interview question bank access",
      ],
      notIncluded: [
        "Live expert interviews",
        "Advanced analytics",
        "Priority support",
      ]
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Ideal for serious job seekers and career growth",
      icon: Zap,
      gradient: "from-blue-600 to-purple-600",
      popular: true,
      features: [
        "Unlimited AI mock interviews",
        "5 live expert interview sessions",
        "Advanced performance analytics",
        "Custom interview scenarios",
        "Live coding environment",
        "Interactive whiteboard",
        "Priority email support",
        "Interview recording & playback",
      ],
      notIncluded: [
        "Dedicated account manager",
      ]
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For teams and organizations with advanced needs",
      icon: Crown,
      gradient: "from-purple-600 to-pink-600",
      popular: false,
      features: [
        "Everything in Pro plan",
        "Unlimited live expert sessions",
        "Team dashboard & management",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "Advanced team analytics",
        "Bulk user management",
      ],
      notIncluded: []
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Success Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div 
                key={index}
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl border-2 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular 
                    ? 'border-blue-500 shadow-xl shadow-blue-500/20' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="flex items-end justify-center mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.notIncluded.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start opacity-50">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded mr-3 mt-0.5 flex-shrink-0"></div>
                      <span className="text-gray-500 line-through">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button 
                  className={`w-full py-4 font-semibold rounded-xl transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {plan.name === 'Free' ? 'Get Started Free' : 
                   plan.name === 'Enterprise' ? 'Contact Sales' : 
                   'Start Pro Trial'}
                </Button>

                {plan.name === 'Pro' && (
                  <p className="text-center text-sm text-gray-600 mt-3">
                    14-day free trial • No credit card required
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Need a custom plan for your organization?
          </p>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
            Contact Sales Team
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;