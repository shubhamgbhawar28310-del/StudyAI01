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
            AI-Powered Study Planning
          </div>

          {/* Main Headline */}
     <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-snug sm:leading-tight lg:leading-[1.1] tracking-tight text-neutral-900 dark:text-neutral-100 mb-6 animate-slide-up relative">
  <span className="relative inline-block">
    {/* Subtle shifted glow */}
    <span
      className="absolute inset-0 bg-gradient-to-r from-blue-500/60 to-violet-500/60 blur-[100px] opacity-20 translate-y-6"
      aria-hidden="true"
    ></span>
    {/* Gradient text */}
    <span className="relative bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent animate-gradient-move">
      Focus on learning.
    </span>
  </span>{" "}
  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
    Let Aivy handle the rest
  </span>
</h1>



          {/* Sub-headline */}
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            All your notes, schedule, and study tools in one smart workspace - so you can stop organizing and start learning.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              className="ai-gradient text-white font-semibold px-8 py-4 text-lg ai-glow-soft hover:ai-glow transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Explore Features
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="font-semibold px-8 py-4 text-lg border-2 hover:bg-muted transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() => {
                const demoVideo = document.getElementById('demo-video');
                demoVideo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              See How It Works
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-muted-foreground text-sm animate-slide-up" style={{ animationDelay: '0.6s' }}>
            Free to start • No credit card required • Trusted by students worldwide
          </p>
        </div>

        {/* Hero Visual - Feature Preview Dashboard */}
        <div id="demo-video" className="mt-16 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="relative">
            <div className="absolute inset-0 ai-gradient rounded-2xl opacity-20 blur-2xl transform scale-105"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-border overflow-hidden ai-glow-soft">
              {/* Video Preview */}
              <div className="aspect-video bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 relative overflow-hidden">
                <video 
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/placeholder.svg"
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                  <source src="/demo-video.webm" type="video/webm" />
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