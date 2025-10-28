import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ai-soft to-background pt-20 pb-16 sm:pt-24 sm:pb-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full max-w-4xl">
        <div className="absolute top-20 left-20 w-72 h-72 ai-gradient rounded-full opacity-10 blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 ai-gradient rounded-full opacity-5 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft border border-primary/20 text-primary font-medium text-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            Smart AI Study Planner - Now Available
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight text-foreground mb-6 animate-slide-up">
            Your Notes. Your Plan.{" "}
            <span className="relative inline-block">
              <span className="absolute inset-0 ai-gradient blur-2xl opacity-30"></span>
              <span className="relative ai-gradient-text">Your Success.</span>
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Our AI study planner centralizes your notes and builds a custom study schedule, 
            so you can focus on learning, not organizing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="ai-gradient text-white font-semibold px-8 py-4 text-lg ai-glow-soft hover:ai-glow transition-all duration-300 transform hover:scale-105">
              Start Your Plan with AI
            </Button>
            <Button variant="outline" size="lg" className="font-semibold px-8 py-4 text-lg border-2 hover:bg-muted transition-all duration-300">
              Learn More
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-muted-foreground text-sm animate-slide-up" style={{ animationDelay: '0.6s' }}>
            ✨ 14-day free trial • No credit card required • Join 10,000+ students
          </p>
        </div>

        {/* Hero Visual - Feature Preview Dashboard */}
        <div className="mt-16 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="relative">
            <div className="absolute inset-0 ai-gradient rounded-2xl opacity-20 blur-2xl transform scale-105"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-border overflow-hidden ai-glow-soft">
              {/* Video Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 relative overflow-hidden">
                <video 
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;