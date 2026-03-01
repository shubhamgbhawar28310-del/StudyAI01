import { GoogleGenAI, Type } from '@google/genai';
import { ChatMessage, StudyPlan, Flashcard, Notes, Author, Attachment, Quiz, ConceptMap, ELI5 } from '@/components/ai-assistant/types';
import { documentAPI } from '@/services/api';

// AI Service using Google Gemini - Fixed configuration
const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY ;
const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.0-flash';

const studyPlanSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'A catchy title for the study plan.' },
        items: {
            type: Type.ARRAY,
            description: 'The list of study sessions.',
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: 'The day of the week or date.' },
                    topic: { type: Type.STRING, description: 'The main subject or topic for the day.' },
                    tasks: {
                        type: Type.ARRAY,
                        description: 'A list of specific tasks or sub-topics to cover.',
                        items: { type: Type.STRING }
                    },
                    duration: { type: Type.STRING, description: 'Estimated time for the session, e.g., "2 hours".' }
                },
                required: ['day', 'topic', 'tasks', 'duration']
            }
        }
    },
    required: ['title', 'items']
};

const flashcardsSchema = {
    type: Type.ARRAY,
    description: "An array of flashcard objects.",
    items: {
        type: Type.OBJECT,
        properties: {
            front: { type: Type.STRING, description: "The question or term on the front of the flashcard." },
            back: { type: Type.STRING, description: "The answer or definition on the back of the flashcard." }
        },
        required: ['front', 'back']
    }
};

const notesSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'The main title of the notes.' },
        summary: { type: Type.STRING, description: 'A brief, one or two-sentence summary of the topic.' },
        items: {
            type: Type.ARRAY,
            description: 'The list of key points or sections.',
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: { type: Type.STRING, description: 'The heading for a specific section or key idea.' },
                    points: {
                        type: Type.ARRAY,
                        description: 'A list of bullet points under the heading.',
                        items: { type: Type.STRING }
                    }
                },
                required: ['heading', 'points']
            }
        }
    },
    required: ['title', 'summary', 'items']
};

const quizQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING, description: 'The question text. Make it clear, concise, and educational.' },
        type: { type: Type.STRING, enum: ['multiple_choice', 'true_false', 'short_answer'], description: 'The type of question.' },
        options: {
            type: Type.ARRAY,
            description: 'A list of possible answers for multiple-choice questions. Include 3-4 plausible options.',
            items: { type: Type.STRING }
        },
        answer: { type: Type.STRING, description: 'The correct answer. For multiple choice, this must be one of the options.' },
        explanation: { type: Type.STRING, description: 'A brief, clear explanation for why the answer is correct. Help the student understand the concept.' }
    },
    required: ['question', 'type', 'answer']
};

const quizSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'An engaging title for the quiz that reflects its content.' },
        questions: {
            type: Type.ARRAY,
            description: 'A list of quiz questions.',
            items: quizQuestionSchema
        }
    },
    required: ['title', 'questions']
};

const conceptMapNodeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: 'A unique identifier for the node.' },
        topic: { type: Type.STRING, description: 'The main topic or concept of this node.' },
        summary: { type: Type.STRING, description: 'A brief summary of the topic.' },
        children: {
            type: Type.ARRAY,
            description: 'A list of child nodes connected to this one.',
            items: { '$ref': '#/definitions/node' } // Self-referencing for recursion
        }
    },
    required: ['id', 'topic', 'summary', 'children']
};

const conceptMapSchema = {
    definitions: {
        node: conceptMapNodeSchema
    },
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'The title of the concept map.' },
        root: conceptMapNodeSchema
    },
    required: ['title', 'root']
};

const eli5Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The complex topic being explained." },
        explanation: { type: Type.STRING, description: "The main explanation, broken down into very simple terms." },
        analogy: { type: Type.STRING, description: "A simple analogy to help understanding." }
    },
    required: ['title', 'explanation', 'analogy']
};

const buildPromptParts = async (prompt: string, attachments: Attachment[]): Promise<any[]> => {
  const parts: any[] = [];

  let fileContext = '';
  for (const file of attachments) {
    // Add file metadata and content
    fileContext += `\n\n--- FILE: ${file.name} (${file.type}) ---\n`;
    
    // For PDF and PPTX files, we now have proper text extraction from the backend
    if (file.extractedText) {
      // Check if the extracted text is meaningful content or just placeholder text
      const isPlaceholderText = (
        file.extractedText.includes("This is a presentation file") ||
        file.extractedText.includes("This is a PDF document") ||
        file.extractedText.includes("This is a spreadsheet file") ||
        file.extractedText.includes("This file type doesn't have text") ||
        file.extractedText.includes("requires server-side text extraction") ||
        file.extractedText.includes("Error extracting text")
      );
      
      if (!isPlaceholderText) {
        // If we have actual extracted text, include it
        fileContext += `CONTENT:\n${file.extractedText}\n`;
      } else {
        // If we have placeholder text, provide better context
        if (file.type.includes('presentation') || file.type.includes('powerpoint') || 
            file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
          fileContext += `This is a presentation file (PPT/PPTX). While detailed text extraction may not be available, please analyze this file assuming it contains educational content organized in slides. Provide insights on what topics might be covered based on the filename and file type.\n`;
        } else if (file.type.includes('spreadsheet') || file.type.includes('excel') ||
                  file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
          fileContext += `This is a spreadsheet file (XLS/XLSX). While detailed data extraction may not be available, please analyze this file assuming it contains tabular data or charts. Provide insights on what type of data might be present based on the filename and file type.\n`;
        } else if (file.type === 'application/pdf') {
          fileContext += `This is a PDF document. While detailed text extraction may not be available, please analyze this file assuming it contains educational content. Provide insights on what topics might be covered based on the filename and file type.\n`;
        } else if (file.extractedText.includes("Error extracting text")) {
          fileContext += `There was an error extracting text from this file: ${file.extractedText}\n`;
        } else {
          fileContext += `This file type doesn't have text that can be directly extracted. Please provide analysis based on the file type and name.\n`;
        }
      }
    } else if (file.type.startsWith('image/')) {
      // For images, we'll add them separately as inline data
      continue; // Skip adding to text context
    } else {
      // For other file types without extracted text, provide better context
      if (file.type.includes('presentation') || file.type.includes('powerpoint') || 
          file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
        fileContext += `This is a presentation file (PPT/PPTX). While detailed text extraction may not be available, please analyze this file assuming it contains educational content organized in slides. Provide insights on what topics might be covered based on the filename and file type.\n`;
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel') ||
                file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        fileContext += `This is a spreadsheet file (XLS/XLSX). While detailed data extraction may not be available, please analyze this file assuming it contains tabular data or charts. Provide insights on what type of data might be present based on the filename and file type.\n`;
      } else if (file.type === 'application/pdf') {
        fileContext += `This is a PDF document. While detailed text extraction may not be available, please analyze this file assuming it contains educational content. Provide insights on what topics might be covered based on the filename and file type.\n`;
      } else {
        fileContext += `This file type doesn't have text that can be directly extracted. Please provide analysis based on the file type and name.\n`;
      }
    }
    fileContext += `--- END OF FILE: ${file.name} ---\n`;
  }
  
  if (fileContext) {
    parts.push({ text: `File Analysis Context:\n${fileContext.trim()}\n\nUser Question: ${prompt}` });
  } else {
    parts.push({ text: prompt });
  }
  
  // Then add image parts
  for (const file of attachments) {
    if (file.type.startsWith('image/')) {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.content,
        },
      });
    }
  }
  return parts;
};

const generateWithSchema = async <T,>(prompt: string, schema: any, systemInstruction: string, attachments: Attachment[] = []): Promise<T> => {
  try {
    console.log("=== DEBUG: generateWithSchema called ===");
    console.log("Prompt:", prompt);
    console.log("Attachments count:", attachments.length);
    
    // Process attachments to extract text for PDF and PPTX files
    const processedAttachments = await Promise.all(attachments.map(async (attachment) => {
      console.log("=== DEBUG: Processing attachment in generateWithSchema ===");
      console.log("Attachment name:", attachment.name);
      console.log("Attachment type:", attachment.type);
      
      // Always process PDF, PPTX, and DOCX files, regardless of placeholder text
      const isProcessableFile = (
        attachment.type === 'application/pdf' || 
        attachment.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        attachment.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        attachment.type === 'application/msword' ||
        attachment.type === 'application/vnd.ms-powerpoint' ||
        attachment.type === 'application/vnd.ms-excel' ||
        attachment.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        attachment.name?.endsWith('.pdf') || 
        attachment.name?.endsWith('.pptx') ||
        attachment.name?.endsWith('.docx') ||
        attachment.name?.endsWith('.doc') ||
        attachment.name?.endsWith('.ppt') ||
        attachment.name?.endsWith('.xls') ||
        attachment.name?.endsWith('.xlsx')
      );
      
      console.log("Is processable file:", isProcessableFile);
      
      if (isProcessableFile) {
        console.log("Sending file to backend for processing...");
        
        try {
          // Use the File object if available, otherwise convert base64 content back to a Blob
          let fileToUpload: File;
          
          if (attachment.file) {
            // Use the actual File object
            fileToUpload = attachment.file;
            console.log("Using File object directly");
          } else if (attachment.content) {
            // Convert base64 content back to a Blob for upload
            console.log("Converting base64 content to Blob");
            // Handle potential errors in base64 conversion
            try {
              const byteString = atob(attachment.content);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              
              const blob = new Blob([ab], { type: attachment.type });
              fileToUpload = new File([blob], attachment.name, { type: attachment.type });
            } catch (conversionError) {
              console.error("Error converting base64 to Blob:", conversionError);
              // Return the original attachment if conversion fails
              return attachment;
            }
          } else {
            console.log("No file data available, returning original attachment");
            return attachment;
          }
          
          // Upload to backend for text extraction
          console.log("Uploading file to backend...");
          const result = await documentAPI.uploadDocument(fileToUpload);
          console.log("Backend response:", result);
          
          // Check if extraction was successful (based on backend response structure)
          if (result.success && result.extractedText) {
            // Return the attachment with extracted text
            return {
              ...attachment,
              extractedText: result.extractedText
            };
          } else if (result.extractedText) {
            // Even if not explicitly marked as success, if we have text, use it
            return {
              ...attachment,
              extractedText: result.extractedText
            };
          } else {
            // If extraction failed, provide a meaningful error message
            return {
              ...attachment,
              extractedText: `Failed to extract text from ${attachment.name}. Error: ${result.details || result.error || 'Unknown error'}`
            };
          }
        } catch (error) {
          console.error(`Error processing file ${attachment.name}:`, error);
          // Return the original attachment with an error message
          return {
            ...attachment,
            extractedText: `Error processing ${attachment.name}: ${(error as Error).message}`
          };
        }
      }
      
      // Return non-document files as-is
      console.log("Not processing file, returning as-is");
      return attachment;
    }));
    
    const parts = await buildPromptParts(prompt, processedAttachments);
    
    console.log("=== DEBUG: Sending to AI model with schema ===");
    console.log("Parts:", JSON.stringify(parts, null, 2));
    
    // Fixed: Use the correct method for the @google/genai package
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });
    
    console.log("=== DEBUG: AI response with schema received ===");
    console.log("Response text length:", response.text.length);
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error("=== DEBUG: Error in generateWithSchema ===", error);
    // Return a more user-friendly error instead of throwing
    throw new Error(`Failed to generate structured content from AI: ${(error as Error).message}`);
  }
};

const generateWithMarkdown = async (prompt: string, systemInstruction: string, attachments: Attachment[] = []): Promise<string> => {
  try {
    console.log("=== DEBUG: generateWithMarkdown called ===");
    console.log("Prompt:", prompt);
    console.log("Attachments count:", attachments.length);
    
    // Process attachments to extract text for PDF and PPTX files
    const processedAttachments = await Promise.all(attachments.map(async (attachment) => {
      console.log("=== DEBUG: Processing attachment in generateWithMarkdown ===");
      console.log("Attachment name:", attachment.name);
      console.log("Attachment type:", attachment.type);
      
      // Always process PDF, PPTX, and DOCX files, regardless of placeholder text
      const isProcessableFile = (
        attachment.type === 'application/pdf' || 
        attachment.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        attachment.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        attachment.type === 'application/msword' ||
        attachment.type === 'application/vnd.ms-powerpoint' ||
        attachment.type === 'application/vnd.ms-excel' ||
        attachment.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        attachment.name?.endsWith('.pdf') || 
        attachment.name?.endsWith('.pptx') ||
        attachment.name?.endsWith('.docx') ||
        attachment.name?.endsWith('.doc') ||
        attachment.name?.endsWith('.ppt') ||
        attachment.name?.endsWith('.xls') ||
        attachment.name?.endsWith('.xlsx')
      );
      
      console.log("Is processable file:", isProcessableFile);
      
      if (isProcessableFile) {
        console.log("Sending file to backend for processing...");
        
        try {
          // Use the File object if available, otherwise convert base64 content back to a Blob
          let fileToUpload: File;
          
          if (attachment.file) {
            // Use the actual File object
            fileToUpload = attachment.file;
            console.log("Using File object directly");
          } else if (attachment.content) {
            // Convert base64 content back to a Blob for upload
            console.log("Converting base64 content to Blob");
            // Handle potential errors in base64 conversion
            try {
              const byteString = atob(attachment.content);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              
              const blob = new Blob([ab], { type: attachment.type });
              fileToUpload = new File([blob], attachment.name, { type: attachment.type });
            } catch (conversionError) {
              console.error("Error converting base64 to Blob:", conversionError);
              // Return the original attachment if conversion fails
              return attachment;
            }
          } else {
            console.log("No file data available, returning original attachment");
            return attachment;
          }
          
          // Upload to backend for text extraction
          console.log("Uploading file to backend...");
          const result = await documentAPI.uploadDocument(fileToUpload);
          console.log("Backend response:", result);
          
          // Check if extraction was successful (based on backend response structure)
          if (result.success && result.extractedText) {
            // Return the attachment with extracted text
            return {
              ...attachment,
              extractedText: result.extractedText
            };
          } else if (result.extractedText) {
            // Even if not explicitly marked as success, if we have text, use it
            return {
              ...attachment,
              extractedText: result.extractedText
            };
          } else {
            // If extraction failed, provide a meaningful error message
            return {
              ...attachment,
              extractedText: `Failed to extract text from ${attachment.name}. Error: ${result.details || result.error || 'Unknown error'}`
            };
          }
        } catch (error) {
          console.error(`Error processing file ${attachment.name}:`, error);
          // Return the original attachment with an error message
          return {
            ...attachment,
            extractedText: `Error processing ${attachment.name}: ${(error as Error).message}`
          };
        }
      }
      
      // Return non-document files as-is
      console.log("Not processing file, returning as-is");
      return attachment;
    }));
    
    const parts = await buildPromptParts(prompt, processedAttachments);
    
    console.log("=== DEBUG: Sending to AI model with markdown ===");
    console.log("Parts:", JSON.stringify(parts, null, 2));
    
    // Fixed: Use the correct method for the @google/genai package
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'text/plain',
      }
    });
    
    console.log("=== DEBUG: AI response with markdown received ===");
    console.log("Response text length:", response.text.length);
    
    return response.text;
  } catch (error) {
    console.error("=== DEBUG: Error in generateWithMarkdown ===", error);
    // Return a more user-friendly error instead of throwing
    throw new Error(`Failed to generate content from AI: ${(error as Error).message}`);
  }
};

export const generateNotes = async (prompt: string, attachments: Attachment[] = []): Promise<any> => {
    const systemInstruction = "You are an expert summarizer and note-taker. Generate clear, concise, and well-organized notes on the user's topic or provided file(s). Use headings and bullet points for readability. When working with file attachments:\n\n1. Identify the main topics and key points\n2. Organize information in a logical structure\n3. Use clear headings and subheadings\n4. Create bullet points for important details\n5. For presentation files, summarize the content slide by slide if possible\n6. For spreadsheet files, focus on key data points and trends\n7. Highlight important concepts that would be useful for studying\n8. Keep the language clear and educational\n\nIMPORTANT: Return your response in clean markdown format with headings (##), bullet points (-), and paragraphs. DO NOT wrap your response in JSON format or use any JSON keys like 'title', 'summary', 'items'. Format your response like this:\n\n## Main Topic Title\n\n**Summary:**\nBrief summary of the topic.\n\n### Subtopic 1\n- Key point 1\n- Key point 2\n\n### Subtopic 2\n- Key point 1\n- Key point 2";
    const markdownResponse = await generateWithMarkdown(prompt, systemInstruction, attachments);
    // Return clean markdown text directly for chat responses
    return markdownResponse;
};

export const generateStudyPlan = async (prompt: string, attachments: Attachment[] = []): Promise<any> => {
    const systemInstruction = "You are an expert academic planner. Create a detailed, actionable study plan based on the user's request and any provided files. Ensure the plan is well-structured and logical.\n\nIMPORTANT: Return your response in clean markdown format with headings (##), bullet points (-), and paragraphs. DO NOT wrap your response in JSON format or use any JSON keys like 'title', 'summary', 'items'. Format your response like this:\n\n## Study Plan Title\n\n### Day 1: Topic Name\n- Task 1\n- Task 2\n- Duration: X hours\n\n### Day 2: Topic Name\n- Task 1\n- Task 2\n- Duration: X hours";
    const markdownResponse = await generateWithMarkdown(prompt, systemInstruction, attachments);
    // Return clean markdown text directly for chat responses
    return markdownResponse;
};

export const generateFlashcards = async (prompt: string, attachments: Attachment[] = []): Promise<any> => {
    const systemInstruction = "You are a helpful study assistant. Create a set of flashcards based on the user's topic and any provided files. Each card should have a clear front (question/term) and back (answer/definition).\n\nIMPORTANT: Return your response in clean markdown format with headings (##), bullet points (-), and paragraphs. DO NOT wrap your response in JSON format or use any JSON keys like 'front', 'back'. Format your response like this:\n\n## Flashcards: Topic Name\n\n### Card 1\n**Question:** What is photosynthesis?\n**Answer:** Photosynthesis is the process by which plants convert light energy into chemical energy.\n\n### Card 2\n**Question:** What are the main parts of a cell?\n**Answer:** The main parts of a cell include the nucleus, cytoplasm, and cell membrane.";
    const markdownResponse = await generateWithMarkdown(prompt, systemInstruction, attachments);
    // Return clean markdown text directly for chat responses
    return markdownResponse;
};

export const generateQuiz = async (prompt: string, attachments: Attachment[] = []): Promise<any> => {
    const systemInstruction = `You are a teacher creating a quiz. Generate a quiz with various question types (multiple choice, true/false, short answer) based on the user's request and provided materials. Ensure questions are clear and answers are correct. Make the quiz engaging and educational, with explanations that help students understand the concepts.

CRITICAL FORMATTING REQUIREMENTS:
1. Use EXACTLY this format for each question:

Question 1: [Question text here]
A) Option 1
B) Option 2  
C) Option 3
D) Option 4

**Answer:** [Correct option letter and text]
**Explanation:** [Detailed explanation]

2. For True/False questions:

Question 2: [Question text here] (True/False)

**Answer:** True (or False)
**Explanation:** [Detailed explanation]

3. For Short Answer questions:

Question 3: [Question text here]

**Answer:** [Expected answer]
**Explanation:** [Detailed explanation]

IMPORTANT RULES:
- Start each question with "Question [number]:"
- Use A), B), C), D) for multiple choice options
- Always include **Answer:** and **Explanation:** sections
- Make sure answers are clearly marked with ** formatting
- Create 3-5 questions per quiz
- Vary question difficulty from basic to advanced
- Include plausible distractors for multiple choice

When working with file attachments, focus on the main topics and key concepts from the content.`;
    
    const markdownResponse = await generateWithMarkdown(prompt, systemInstruction, attachments);
    // Return clean markdown text directly for chat responses
    return markdownResponse;
};

export const generateConceptMap = async (prompt: string, attachments: Attachment[] = []): Promise<any> => {
    const systemInstruction = "You are an expert in visual learning. Create a hierarchical concept map from the user's request or text. The map should have a central root topic and branch out into related sub-topics with brief summaries.\n\nIMPORTANT: Return your response in clean markdown format with headings (##), bullet points (-), and paragraphs. DO NOT wrap your response in JSON format or use any JSON keys. Format your response like this:\n\n## Concept Map: Main Topic\n\n- **Main Topic**\n  - Subtopic 1: Brief description\n    - Sub-subtopic 1.1: Brief description\n    - Sub-subtopic 1.2: Brief description\n  - Subtopic 2: Brief description\n    - Sub-subtopic 2.1: Brief description";
    const markdownResponse = await generateWithMarkdown(prompt, systemInstruction, attachments);
    // Return clean markdown text directly for chat responses
    return markdownResponse;
};

export const generateELI5 = async (prompt: string, attachments: Attachment[] = []): Promise<any> => {
    const systemInstruction = "You are an expert at simplifying complex topics. Explain the user's request as if you were talking to a curious 5-year-old. Use a simple analogy.\n\nIMPORTANT: Return your response in clean markdown format with headings (##), bullet points (-), and paragraphs. DO NOT wrap your response in JSON format or use any JSON keys like 'title', 'explanation', 'analogy'. Format your response like this:\n\n## Complex Topic Explained Simply\n\n**Explanation:**\nSimple explanation using everyday language.\n\n**Analogy:**\nSimple analogy a 5-year-old can understand.";
    const markdownResponse = await generateWithMarkdown(prompt, systemInstruction, attachments);
    // Return clean markdown text directly for chat responses
    return markdownResponse;
};

export const generateChatResponse = async (prompt: string, history: ChatMessage[]): Promise<string> => {
    try {
        // Limited history to keep context concise
        const recentHistory = history.slice(-6).map(msg => ({
            role: msg.author === Author.USER ? 'user' : 'model',
            parts: [{ text: msg.content.map(c => {
                if (typeof c.value === 'string') {
                    return c.value;
                }
                return `[AI generated content: ${c.type}]`;
            }).join('\n') }]
        }));

        // Fixed: Use the correct method for the @google/genai package
        const chat = ai.chats.create({
            model: model,
            history: recentHistory,
            config: {
                systemInstruction: "You are Aivy, an intelligent educational AI assistant similar to Gemini or ChatGPT. Your role is to help students learn effectively by providing clear, structured, and comprehensive explanations.\n\n🎯 **Core Behavior:**\n- When users ask to EXPLAIN, TEACH, or request EXAMPLES → Provide detailed educational content with:\n  • Clear explanations with proper context\n  • Code examples (when relevant) with comments\n  • Step-by-step breakdowns\n  • Study tips and learning strategies\n  • Helpful resources (GeeksforGeeks, VisuAlgo, YouTube channels, etc.)\n  • Real-world applications\n\n- NEVER generate quizzes unless explicitly asked with phrases like \"quiz me\", \"test me\", \"create a quiz\", \"practice questions\"\n- Words like \"test\", \"exam\", \"study\" in context of learning should trigger EXPLANATIONS, not quizzes\n\n📚 **Response Format:**\n- Use proper markdown with headings (##, ###)\n- Include emojis for visual appeal (📌, ✅, 💡, 🔍, etc.)\n- Use bullet points for lists\n- Use code blocks with language tags for code\n- Use tables when comparing concepts\n- Keep paragraphs short and readable\n- Add \"Key Takeaways\" or \"Summary\" sections\n\n🎓 **Educational Focus:**\n- Explain WHY and HOW, not just WHAT\n- Provide multiple perspectives when helpful\n- Include common mistakes to avoid\n- Suggest practice exercises (but don't create quiz unless asked)\n- Link concepts to real-world scenarios\n\nIMPORTANT: Always return clean, human-readable markdown. NO JSON format. NO curly braces wrapping. Use proper markdown suitable for UI rendering."
            }
        });

        const response = await chat.sendMessage({ message: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating chat response:", error);
        // Return a user-friendly error message instead of throwing
        return `I'm having trouble generating a response right now. Please try again later. Error: ${(error as Error).message}`;
    }
};

export const analyzeFiles = async (prompt: string, attachments: Attachment[]): Promise<string> => {
  if (attachments.length === 0) {
    throw new Error("analyzeFiles requires at least one attachment.");
  }
  
  console.log("=== DEBUG: analyzeFiles called ===");
  console.log("Prompt:", prompt);
  console.log("Attachments count:", attachments.length);
  console.log("Attachments:", JSON.stringify(attachments, null, 2));
  
  try {
    // Process attachments to extract text for PDF, PPTX, and DOCX files
    const processedAttachments = await Promise.all(attachments.map(async (attachment) => {
      console.log("=== DEBUG: Processing attachment ===");
      console.log("Attachment name:", attachment.name);
      console.log("Attachment type:", attachment.type);
      console.log("Attachment content length:", attachment.content?.length || 0);
      console.log("Attachment extractedText:", attachment.extractedText);
      console.log("Attachment has file object:", !!attachment.file);
      
      // If we already have extracted text, don't re-upload
      if (attachment.extractedText && !attachment.extractedText.includes('Error') && !attachment.extractedText.includes('Failed')) {
        console.log("Already have extracted text, skipping upload");
        return attachment;
      }
      
      // Always process supported document files, regardless of placeholder text
      const isProcessableFile = (
        attachment.type === 'application/pdf' || 
        attachment.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        attachment.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        attachment.type === 'application/msword' ||
        attachment.type === 'application/vnd.ms-powerpoint' ||
        attachment.type === 'application/vnd.ms-excel' ||
        attachment.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        attachment.name?.endsWith('.pdf') || 
        attachment.name?.endsWith('.pptx') ||
        attachment.name?.endsWith('.docx') ||
        attachment.name?.endsWith('.doc') ||
        attachment.name?.endsWith('.ppt') ||
        attachment.name?.endsWith('.xls') ||
        attachment.name?.endsWith('.xlsx')
      );
      
      console.log("Is processable file:", isProcessableFile);
      
      if (isProcessableFile) {
        console.log("Sending file to backend for processing...");
        
        try {
          // Use the File object if available, otherwise convert base64 content back to a Blob
          let fileToUpload: File;
          
          if (attachment.file) {
            // Use the actual File object
            fileToUpload = attachment.file;
            console.log("Using File object directly");
          } else if (attachment.content) {
            // Convert base64 content back to a Blob for upload
            console.log("Converting base64 content to Blob");
            // Handle potential errors in base64 conversion
            try {
              const byteString = atob(attachment.content);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              
              const blob = new Blob([ab], { type: attachment.type });
              fileToUpload = new File([blob], attachment.name, { type: attachment.type });
            } catch (conversionError) {
              console.error("Error converting base64 to Blob:", conversionError);
              // Return the original attachment if conversion fails
              return attachment;
            }
          } else {
            console.log("No file data available, returning original attachment");
            return attachment;
          }
          
          // Upload to backend for text extraction
          console.log("Uploading file to backend...");
          const result = await documentAPI.uploadDocument(fileToUpload);
          console.log("Backend response:", result);
          
          // Check if extraction was successful (based on backend response structure)
          if (result.success && result.extractedText) {
            // Return the attachment with extracted text
            return {
              ...attachment,
              extractedText: result.extractedText
            };
          } else if (result.extractedText) {
            // Even if not explicitly marked as success, if we have text, use it
            return {
              ...attachment,
              extractedText: result.extractedText
            };
          } else {
            // If extraction failed, provide a meaningful error message
            return {
              ...attachment,
              extractedText: `Failed to extract text from ${attachment.name}. Error: ${result.details || result.error || 'Unknown error'}`
            };
          }
        } catch (error) {
          console.error(`Error processing file ${attachment.name}:`, error);
          // Return the original attachment with an error message
          return {
            ...attachment,
            extractedText: `Error processing ${attachment.name}: ${(error as Error).message}`
          };
        }
      }
      
      // Return non-document files as-is
      console.log("Not processing file, returning as-is");
      return attachment;
    }));
    
    console.log("=== DEBUG: All attachments processed ===");
    console.log("Processed attachments:", JSON.stringify(processedAttachments, null, 2));
    
    // Improve the default prompt for better analysis
    const improvedPrompt = prompt || "Please provide a comprehensive analysis of the uploaded file(s). Include a summary of the main topics, key points, and any important details. If this is a presentation, describe the slides and their content. If this is a spreadsheet, explain the data structure and key information.";
    
    const parts = await buildPromptParts(improvedPrompt, processedAttachments);
    
    console.log("=== DEBUG: Sending to AI model ===");
    console.log("Parts:", JSON.stringify(parts, null, 2));
    
    // Fixed: Use the correct method for the @google/genai package
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction: "You are an expert document analyzer and study assistant. Your task is to provide comprehensive, accurate, and helpful analysis of uploaded files. Follow these guidelines:\n\n1. For documents with extracted text, provide a clear summary of main topics and key points\n2. For presentations (PPT/PPTX), analyze slide titles, content, and speaker notes\n3. For word processing documents (DOCX), analyze headings, paragraphs, and tables\n4. For spreadsheets (XLS/XLSX), explain the data structure and key information\n5. For PDF documents, analyze the extracted text content thoroughly\n6. For images, analyze any visible text or educational content\n7. Always provide actionable insights for studying\n8. Be thorough but concise\n9. Focus on educational value\n10. If text extraction failed, clearly state this and provide general guidance based on the file type\n11. Structure your response with clear headings and bullet points for better readability\n\nIMPORTANT: Always return your response in clean, human-readable markdown format with proper headings (##), bullet points (-), and short paragraphs. DO NOT return JSON format or wrap your response in curly braces. Use markdown formatting suitable for UI rendering."
      }
    });
    
    console.log("=== DEBUG: AI response received ===");
    console.log("Response text length:", response.text.length);
    
    return response.text;
  } catch (error) {
    console.error("=== DEBUG: Error in analyzeFiles ===", error);
    // Return a user-friendly error message instead of throwing
    return `I'm having trouble analyzing the provided files right now. Please try again later. Error: ${(error as Error).message}`;
  }
};

export const generateChatTitle = async (prompt: string): Promise<string> => {
    try {
        // Fixed: Use the correct method for the @google/genai package
        const response = await ai.models.generateContent({
            model: model,
            contents: `Generate a very short, concise title (5 words max) for a chat that starts with this user prompt. Just return the title, nothing else. Prompt: "${prompt}"`,
        });
        return response.text.trim().replace(/["']/g, ""); // Remove quotes from title
    } catch (error) {
        console.error("Error generating chat title:", error);
        return "New Chat"; // Fallback title
    }
};