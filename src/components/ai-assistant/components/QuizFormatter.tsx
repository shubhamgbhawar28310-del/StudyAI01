import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface QuizFormatterProps {
  content: string;
}

export const QuizFormatter: React.FC<QuizFormatterProps> = ({ content }) => {
  const [showAnswers, setShowAnswers] = useState(false);

  // Parse quiz content - detect questions and answers
  const parseQuiz = (text: string) => {
    const lines = text.split('\n');
    const questions: Array<{
      question: string;
      options: string[];
      answer: string;
      explanation?: string;
    }> = [];

    let currentQuestion: any = null;
    let currentSection = 'question'; // 'question', 'options', 'answer', 'explanation'

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) return;
      
      // Detect question patterns - more comprehensive
      if (trimmed.match(/^(Question \d+|###\s*Question|\*\*Question|^\d+\.)/i) || 
          trimmed.match(/^\d+\.\s+\*\*.*\*\*$/) ||
          trimmed.match(/^Q\d+/i)) {
        
        // Save previous question
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        
        // Start new question
        let questionText = trimmed
          .replace(/^(Question \d+:|###\s*Question \d+:|###\s*Question:|\*\*Question.*?\*\*:?|^\d+\.|Q\d+:?)/i, '')
          .replace(/^\*\*(.*?)\*\*/, '$1') // Remove bold formatting
          .trim();
          
        currentQuestion = {
          question: questionText,
          options: [],
          answer: '',
          explanation: ''
        };
        currentSection = 'question';
        
      } else if (currentQuestion && trimmed.match(/^[A-D]\)|^[A-D]\.\s|^[a-d]\)|^[a-d]\.\s/)) {
        // Options (A), B), C), D) or A. B. C. D.
        currentQuestion.options.push(trimmed);
        currentSection = 'options';
        
      } else if (trimmed.match(/^\*\*Answer:?\*\*/i) || trimmed.match(/^Answer:?/i)) {
        // Answer section
        currentQuestion.answer = trimmed
          .replace(/^\*\*Answer:?\*\*/i, '')
          .replace(/^Answer:?/i, '')
          .trim();
        currentSection = 'answer';
        
      } else if (trimmed.match(/^\*\*Explanation:?\*\*/i) || trimmed.match(/^Explanation:?/i)) {
        // Explanation section
        currentQuestion.explanation = trimmed
          .replace(/^\*\*Explanation:?\*\*/i, '')
          .replace(/^Explanation:?/i, '')
          .trim();
        currentSection = 'explanation';
        
      } else if (currentQuestion && trimmed.length > 0 && !trimmed.startsWith('#')) {
        // Continue current section
        if (currentSection === 'question' && !currentQuestion.answer) {
          currentQuestion.question += ' ' + trimmed.replace(/^\*\*(.*?)\*\*/, '$1');
        } else if (currentSection === 'answer') {
          currentQuestion.answer += ' ' + trimmed;
        } else if (currentSection === 'explanation') {
          currentQuestion.explanation += ' ' + trimmed;
        }
      }
    });

    // Don't forget the last question
    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  };

  const questions = parseQuiz(content);

  // Debug logging
  console.log('QuizFormatter: Parsed questions:', questions);
  console.log('QuizFormatter: Original content:', content);

  // If no structured quiz detected, return plain markdown
  if (questions.length === 0) {
    return (
      <div className="space-y-2">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Quiz format not recognized. Displaying as plain text. 
            Make sure your quiz follows the expected format with "Question X:" and "**Answer:**" sections.
          </p>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    );
  }

  // Helper function to format inline code in text
  const formatTextWithCode = (text: string) => {
    const parts = text.split(/(`[^`]+`)/);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={i} className="bg-muted px-2 py-0.5 rounded text-sm font-mono">
            {code}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <span>Quiz</span>
        </h3>
        <Button
          onClick={() => setShowAnswers(!showAnswers)}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {showAnswers ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Answers
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Answers
            </>
          )}
        </Button>
      </div>

      {questions.map((q, index) => {
        // Detect question type from options or question text
        const questionType = q.options.length > 0 ? 'Multiple Choice' : 
                            q.question.toLowerCase().includes('true or false') ? 'True/False' :
                            'Short Answer';
        
        return (
          <div key={index} className="border border-border rounded-xl p-5 space-y-4 bg-card shadow-sm hover:shadow-md transition-shadow">
            {/* Question Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span className="text-lg">🧠</span>
                <span>Question {index + 1}: {questionType}</span>
              </div>
              
              {/* Question Text */}
              <div className="text-base font-medium leading-relaxed text-foreground pl-7">
                {formatTextWithCode(q.question)}
              </div>
            </div>

            {/* Options */}
            {q.options.length > 0 && (
              <div className="space-y-2.5 pl-7">
                {q.options.map((option, optIndex) => {
                  const formattedOption = formatTextWithCode(option);
                  return (
                    <div key={optIndex} className="text-sm leading-relaxed flex items-start gap-2">
                      <span className="font-medium text-muted-foreground mt-0.5">•</span>
                      <span className="flex-1">{formattedOption}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Answer Section */}
            {showAnswers && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {/* Correct Answer */}
                  {q.answer ? (
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">✅</span>
                      <div className="flex-1">
                        <span className="font-semibold text-green-600 dark:text-green-400">Correct Answer: </span>
                        <span className="text-sm leading-relaxed">{formatTextWithCode(q.answer)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">❓</span>
                      <div className="flex-1">
                        <span className="font-semibold text-orange-600 dark:text-orange-400">No answer provided</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Explanation */}
                  {q.explanation ? (
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">💡</span>
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">Explanation: </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">
                          {formatTextWithCode(q.explanation)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">📝</span>
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground">No explanation provided</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Debug info in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                      Debug: Answer="{q.answer}", Explanation="{q.explanation}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
