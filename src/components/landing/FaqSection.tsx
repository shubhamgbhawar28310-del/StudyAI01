import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How does the AI analyze my notes?",
    answer: "We use AI to extract text from PDFs, images, and docs—then organize everything by topic and key concepts. Think of it as turning messy notes into clean, searchable knowledge."
  },
  {
    question: "Can I customize my study schedule?",
    answer: "Yes! The AI builds a schedule based on your deadlines and difficulty levels, but you can adjust timing and preferences anytime. It learns from your habits to improve future plans."
  },
  {
    question: "What file formats can I upload?",
    answer: "PDF, DOC, DOCX, JPG, PNG, TXT, and more. We can even extract text from handwritten notes and scanned images."
  },
  {
    question: "How does the streak system work?",
    answer: "Complete study sessions to earn XP and build streaks. It's about consistency, not perfection—small wins add up over time."
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. All files are encrypted and stored securely. We never share your materials or personal data. You can delete everything anytime."
  },
  {
    question: "Who built StudyAI?",
    answer: "A student who spent too many late nights juggling messy notes, endless to-do lists, and burnout. I built StudyAI because I needed it—and realized thousands of others did too. It's not a corporate product. It's built by someone who's been exactly where you are."
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              Questions? We've got answers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about StudyAI and how it helps you study smarter.
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
              Still have questions?{" "}
              <a
                href="#contact"
                className="font-medium text-primary hover:text-primary/80 transition-colors duration-200 underline underline-offset-2"
              >
                Reach out—we're here to help
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;