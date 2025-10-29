import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How does the AI analyze my study materials?",
    answer: "Our AI uses advanced natural language processing to extract text from PDFs, images, and documents. It then categorizes content by topics, identifies key concepts, and creates structured summaries to help you understand and organize your materials effectively."
  },
  {
    question: "Can I customize my study schedule?",
    answer: "Absolutely! While our AI creates an optimized schedule based on your materials and deadlines, you can easily adjust timing, mark topics by difficulty level, and set your preferred study hours. The AI learns from your preferences to improve future recommendations."
  },
  {
    question: "What file formats are supported for upload?",
    answer: "We support a wide range of formats including PDF, DOC, DOCX, JPG, PNG, TXT, and many more. Our AI can extract text from images and handwritten notes, making it easy to digitize all your study materials in one place."
  },
  {
    question: "How does the gamification system work?",
    answer: "You earn XP points for completing study sessions, maintaining streaks, and achieving goals. The system tracks your progress and rewards consistency, helping you stay motivated throughout your learning journey. You can view your achievements and compare progress over time."
  },
  {
    question: "Is my data secure and private?",
    answer: "Yes, we take data security seriously. All your files and personal information are encrypted and stored securely. We never share your study materials or personal data with third parties. You can delete your data at any time."
  },
  {
    question: "Can I use this for team or group study?",
    answer: "Currently, our platform is designed for individual study planning. However, we're working on collaborative features that will allow study groups to share materials and coordinate schedules. This feature will be available in a future update."
  }
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-ai-soft/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about AI Study Planner and how it can transform your learning experience.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-ai-soft/50 transition-colors duration-200"
                >
                  <span className="text-lg font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                      openIndex === index && "transform rotate-180"
                    )}
                  />
                </button>
                
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-5">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              Didn't find the answer you're looking for?{" "}
              <a
                href="#contact"
                className="font-medium text-primary hover:text-primary/80 transition-colors duration-200 underline underline-offset-2"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;