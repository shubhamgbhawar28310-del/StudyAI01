import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Bot, TrendingUp, Calendar } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Recommendations",
    description: "Get personalized study plans and insights based on your learning patterns and goals."
  },
  {
    icon: Calendar,
    title: "Smart Study Scheduling",
    description: "Organize your tasks and create optimal study schedules that adapt to your lifestyle."
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "Monitor your learning journey with detailed analytics and milestone tracking in real-time."
  }
];

export const FeatureCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="relative h-full ai-gradient flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-8 w-full max-w-lg mx-auto">
        {/* Icon Section */}
        <div className="flex justify-center items-center h-20 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Icon
                key={index}
                className={`w-16 h-16 ai-glow absolute transition-all duration-500 ${
                  index === currentSlide
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95"
                }`}
              />
            );
          })}
        </div>

        {/* Text Content */}
        <div className="space-y-4 min-h-[160px] flex flex-col justify-center">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`transition-all duration-500 ${
                index === currentSlide
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-4 absolute"
              }`}
            >
              <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-white/90 text-base leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white scale-110" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};