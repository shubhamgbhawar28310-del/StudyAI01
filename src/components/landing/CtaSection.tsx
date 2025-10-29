import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 ai-gradient opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 ai-gradient rounded-full opacity-10 blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 ai-gradient rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 ai-gradient rounded-2xl mb-8 ai-glow-soft">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Ready to Study{" "}
            <span className="ai-gradient-text">Smarter?</span>
          </h2>
          
          {/* Sub-headline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students transforming the way they learn with AI-powered study planning.
          </p>
          
          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="ai-gradient text-white font-semibold px-8 py-4 text-lg ai-glow-soft hover:ai-glow transition-all duration-300 transform hover:scale-105 group">
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;