import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Book, 
  Lock, 
  Edit3, 
  Calendar, 
  TrendingUp, 
  Users, 
  Plus, 
  GraduationCap, 
  Lightbulb, 
  Calculator, 
  BookOpen, 
  Paperclip, 
  Mic, 
  ChevronDown, 
  Share2, 
  Bookmark, 
  MoreVertical, 
  HelpCircle, 
  Crown,
  Menu,
  X,
  Trash2,
  Bot,
  Eye,
  Download,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  File,
  XCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ChatMessage as ChatMessageType, Attachment } from '@/components/ai-assistant/types';
import { useAIAssistant } from '@/components/ai-assistant/useAIAssistant';
import { ChatMessageComponent } from '@/components/ai-assistant/ChatMessage';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import './chat-animations.css';

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      prototype: SpeechRecognition
      new (): SpeechRecognition
    }
  }
}

interface StudyAIAssistantProps {
  compactMode?: boolean;
  showHeader?: boolean;
}

export function StudyAIAssistant({ compactMode = false, showHeader = true }: StudyAIAssistantProps) {
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showStudyHelp, setShowStudyHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    processAndAddMessage,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleDeleteAllChats,
    handleRegenerateResponse
  } = useAIAssistant({
    chatSessions,
    setChatSessions,
    currentChatId,
    setCurrentChatId,
    sidebarOpen: true,
    setSidebarOpen: () => {} // Not needed since sidebar is always open
  });

  // Load chat sessions on component mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { getSessions } = await import('@/utils/storageManager');
        const savedSessions = getSessions();
        setChatSessions(savedSessions);
        
        // Set current chat to the most recent one if none selected
        if (!currentChatId && savedSessions.length > 0) {
          const mostRecent = savedSessions.reduce((latest, session) => 
            (session.updatedAt > (latest?.updatedAt || 0) ? session : latest), 
            savedSessions[0]
          );
          setCurrentChatId(mostRecent.id);
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    };
    
    loadSessions();
  }, []);

  // Save chat sessions whenever they change
  useEffect(() => {
    if (chatSessions.length === 0) return;
    
    const saveSessions = async () => {
      try {
        const { saveSessions: saveSessionsToStorage } = await import('@/utils/storageManager');
        const updatedSessions = saveSessionsToStorage(chatSessions);
        
        // Check if sessions were modified during save (e.g., due to cleanup)
        if (updatedSessions.length !== chatSessions.length) {
          setChatSessions(updatedSessions);
          
          // If current chat was removed, select the most recent one
          if (!updatedSessions.some(s => s.id === currentChatId)) {
            setCurrentChatId(updatedSessions[0]?.id || null);
          }
        }
        
        // Check storage usage and show warning if needed
        const { warning } = await import('@/utils/storageManager').then(m => m.getStorageInfo());
        if (warning) {
          console.warn('Warning: Chat storage is nearly full. Some older messages may be removed.');
          // You can show a toast notification here if you have a notification system
        }
      } catch (error) {
        console.error('Error saving chat sessions:', error);
      }
    };
    
    saveSessions();
  }, [chatSessions, currentChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChatId, chatSessions]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(prevText => prevText + finalTranscript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
    
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // Add state for file attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const recentConversations = [
    { title: 'Quantum Physics Fundamen...', time: '2 hours ago' },
    { title: 'Advanced Calculus Problems', time: 'Yesterday' },
    { title: 'Machine Learning Algorithms', time: '3 days ago' },
    { title: 'Organic Chemistry Reactions', time: '1 week ago' }
  ];

  const quickActions = [
    { icon: Calculator, label: 'Solve Problem' },
    { icon: Lightbulb, label: 'Explain Concept' },
    { icon: BookOpen, label: 'Create Quiz' },
    { icon: Book, label: 'Study Guide' }
  ];

  const features = [
    {
      icon: Lightbulb,
      title: 'Get Explanations',
      description: 'Ask for detailed explanations of complex concepts, formulas, and theories across all subjects.',
      examples: ['"Explain quantum entanglement in simple terms"', '"How does photosynthesis work?"']
    },
    {
      icon: Calculator,
      title: 'Solve Problems',
      description: 'Get step-by-step solutions to mathematical problems and scientific equations.',
      examples: ['"Solve this calculus integral"', '"Balance this chemical equation"']
    },
    {
      icon: BookOpen,
      title: 'Study Tips',
      description: 'Receive personalized study strategies and memorization techniques.',
      examples: ['"Best way to memorize periodic table"', '"How to prepare for final exams"']
    }
  ];

  // Modify handleSubmit to include better context for file analysis
  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return;
    
    // If we have attachments but no input, provide a default prompt
    let finalInput = input.trim();
    if (attachments.length > 0 && !finalInput) {
      finalInput = "Please analyze the attached file(s) and provide a summary of the main topics and key points.";
    }
    
    // Send message with attachments
    processAndAddMessage(finalInput, attachments);
    
    // Clear input and attachments after sending
    setInput('');
    setAttachments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log("StudyAIAssistant: Processing", files.length, "files");
    
    const filePromises = Array.from(files).map((file: File) => 
      new Promise<Attachment | null>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            if (!event.target?.result) {
              console.warn(`StudyAIAssistant: No result for file: ${file.name}`);
              return resolve(null);
            }
            
            let content = '';
            // For all files, we need to extract the base64 content from data URL
            if (typeof event.target.result === 'string' && event.target.result.startsWith('data:')) {
              content = event.target.result.split(',')[1] || '';
            } else if (event.target.result instanceof ArrayBuffer) {
              // Convert ArrayBuffer to base64 string
              const uint8Array = new Uint8Array(event.target.result);
              let binary = '';
              uint8Array.forEach((byte) => {
                binary += String.fromCharCode(byte);
              });
              content = btoa(binary);
            } else {
              // For text files
              content = event.target.result as string;
            }
            
            console.log("StudyAIAssistant: Processed file", file.name, "with content length", content.length);
            
            // Generate better extracted text based on file type
            let extractedText = '';
            if (file.type.startsWith('image/')) {
              extractedText = `Image file: ${file.name} (${file.type})\nThis is an image file. For detailed analysis, please ask specific questions about what you expect to see in this image.`;
            } else if (file.type === 'application/pdf') {
              console.log(`StudyAIAssistant: Processing PDF: ${file.name}`);
              // For PDF files, we'll let the backend handle the text extraction
              extractedText = `PDF File: ${file.name} (${file.type})\n\nThis is a PDF document that requires server-side text extraction for detailed analysis.`;
            } else if (file.type.includes('presentation') || file.type.includes('powerpoint') || 
                      file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
              // Handle PowerPoint files with better description
              console.log(`StudyAIAssistant: Processing PowerPoint: ${file.name}`);
              // For PPTX files, we'll let the backend handle the text extraction
              extractedText = `PowerPoint Presentation File: ${file.name} (${file.type})\n\nThis is a presentation file that requires server-side text extraction for detailed analysis.`;
            } else if (file.type.includes('word') || file.type.includes('document') ||
                      file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
              console.log(`StudyAIAssistant: Processing Word Document: ${file.name}`);
              // For DOCX files, we'll let the backend handle the text extraction
              extractedText = `Word Document File: ${file.name} (${file.type})\n\nThis is a word processing document that requires server-side text extraction for detailed analysis.`;
            } else if (file.type.includes('spreadsheet') || file.type.includes('excel') ||
                      file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
              extractedText = `Spreadsheet file: ${file.name} (${file.type})\nThis is a spreadsheet file that may contain data, charts, or tabular information. For detailed analysis, please ask specific questions about the data or topics you expect to find in this spreadsheet.`;
            } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
              // For text files, we can use the content directly
              extractedText = content;
            } else {
              extractedText = `File: ${file.name} (${file.type})\n\nThis file type requires server-side processing for detailed analysis.`;
            }
            
            const attachment: Attachment = {
              name: file.name,
              type: file.type,
              content: content,
              extractedText: extractedText
            };
            
            console.log("StudyAIAssistant: Created attachment for", file.name);
            resolve(attachment);
          } catch(err) {
            console.error(`StudyAIAssistant: Error processing file ${file.name}:`, err);
            resolve(null);
          }
        };

        reader.onerror = (err) => {
          console.error("StudyAIAssistant: FileReader error:", err);
          reject(err);
        };

        // Read files appropriately based on type
        if (file.type === 'application/pdf' || 
            file.type.includes('presentation') || file.type.includes('powerpoint') || 
            file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ||
            file.type.includes('spreadsheet') || file.type.includes('excel') ||
            file.name.endsWith('.xls') || file.name.endsWith('.xlsx') ||
            file.type.includes('word') || file.type.includes('document') ||
            file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
          console.log("StudyAIAssistant: Reading", file.name, "as ArrayBuffer");
          reader.readAsArrayBuffer(file);
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
          console.log("StudyAIAssistant: Reading", file.name, "as text");
          reader.readAsText(file);
        } else {
          console.log("StudyAIAssistant: Reading", file.name, "as data URL");
          reader.readAsDataURL(file);
        }
      })
    );

    try {
      const results = await Promise.all(filePromises);
      const validAttachments = results.filter((att): att is Attachment => att !== null);
      
      console.log("StudyAIAssistant: Processed", validAttachments.length, "valid attachments");
      
      // Add new attachments to existing ones instead of replacing
      setAttachments(prev => [...prev, ...validAttachments]);
      
      // Automatically send a message to analyze the files if we have attachments
      if (validAttachments.length > 0) {
        // Don't automatically send - let the user decide
        // Just update the UI to show the attachments
      }
    } catch(err) {
      console.error('StudyAIAssistant: Failed to process one or more files.', err);
      alert('Error processing files. Please try again.');
    }

    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add function to remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Add function to clear all attachments
  const clearAttachments = () => {
    setAttachments([]);
  };

  // Add function to handle file preview
  const handlePreviewFile = (file: Attachment) => {
    try {
      // Create blob from base64 content
      const byteString = atob(file.content);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      // Handle different file types
      if (file.type.startsWith('image/')) {
        // For images, open in new tab
        window.open(url, '_blank');
      } else if (file.type === 'application/pdf') {
        // For PDFs, open in new tab
        window.open(url, '_blank');
      } else if (file.type.startsWith('text/')) {
        // For text files, read the content and display in a new window
        const reader = new FileReader();
        reader.onload = function() {
          const content = reader.result as string;
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${file.name}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    pre { white-space: pre-wrap; word-wrap: break-word; }
                  </style>
                </head>
                <body>
                  <h1>${file.name}</h1>
                  <pre>${content}</pre>
                </body>
              </html>
            `);
            newWindow.document.close();
          }
        };
        reader.readAsText(blob);
      } else {
        // For other files that can be previewed in browser, try to open
        // If not, the browser will prompt to download
        window.open(url, '_blank');
      }
      
      // Revoke the object URL after a delay to free memory
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Error opening file. The file may be corrupted or in an unsupported format.');
    }
  };

  // Add function to handle file download
  const handleDownloadFile = (file: Attachment) => {
    try {
      // Create blob from base64 content
      const byteString = atob(file.content);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Revoke the object URL to free memory
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  // Helper function to get file type icon
  const getFileTypeIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    if (fileType.includes('word') || fileType.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FileText className="w-4 h-4" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <FileSpreadsheet className="w-4 h-4" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return <FileText className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <FileVideo className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="w-4 h-4" />;
    if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleCalculatorClick = () => {
    // Example functionality for calculator button
    processAndAddMessage("I need help with a calculation. Please provide a math problem to solve.");
  };

  const handleStudyHelpToggle = () => {
    setShowStudyHelp(!showStudyHelp);
  };

  const handleStudyHelpOption = (option: string) => {
    processAndAddMessage(option);
    setShowStudyHelp(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
        className="hidden"
      />
      
      {/* Left Sidebar - Always visible with fixed width and full height */}
      <div className="bg-card text-foreground flex flex-col flex-shrink-0 h-full border-r border-border w-64">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold">StudyAI</h1>
              <p className="text-xs text-muted-foreground">Your Learning Companion</p>
            </div>
          </div>
          <Button 
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 mt-4 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">New Chat</span>
          </Button>
        </div>

        {/* Chat History */}
        <div className="px-4 mt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat History</p>
            {chatSessions.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDeleteAllChats}
                className="p-1 h-6 text-muted-foreground hover:text-red-500"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {chatSessions.length > 0 ? (
              [...chatSessions].reverse().map((session) => (
                <div key={session.id} className="group relative">
                  <Button
                    variant={session.id === currentChatId ? "default" : "ghost"}
                    onClick={() => handleSelectChat(session.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors justify-between h-auto min-h-[44px]",
                      session.id === currentChatId
                        ? "bg-accent text-accent-foreground hover:bg-accent"
                        : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare size={18} className="flex-shrink-0" />
                      <span className="truncate">
                        {session.title}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(session.id);
                      }}
                      className="p-1 h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </Button>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground px-3 py-2 text-center">
                No chat history yet
              </p>
            )}
          </div>
        </div>

        {/* Delete All Chats Button */}
        {chatSessions.length > 0 && (
          <div className="p-4">
            <Button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all chat conversations? This action cannot be undone.')) {
                  handleDeleteAllChats();
                }
              }}
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={18} className="mr-3" />
              <span>Delete All Chats</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Chat Area - Flex layout with proper overflow handling */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Study Assistant</h2>
              <p className="text-sm text-muted-foreground">Ask me anything about your studies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">AI Online</span>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-1">
              <Share2 size={18} />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-1">
              <Bookmark size={18} />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-1">
              <MoreVertical size={18} />
            </Button>
          </div>
        </header>

        {/* Chat Content - Unified conversation window */}
        <div className="flex-1 overflow-y-auto chat-scroll-container bg-background">
          {messages.length > 0 || isLoading ? (
            <div className="space-y-0">
              {messages.map((message: ChatMessageType) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  onRegenerate={message.author !== 'user' ? () => handleRegenerateResponse(message.id) : undefined}
                />
              ))}
              {isLoading && <ChatMessageComponent isLoading={true} />}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-8">
              {/* Welcome Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                  <Bot className="text-white" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Welcome to StudyAI</h1>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  Your intelligent study companion is here to help you learn, understand, and excel in your academic journey.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {features.map((feature, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-3">
                      <feature.icon className="text-foreground" size={20} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                    {feature.examples.map((example, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="block w-full text-left text-sm text-foreground bg-muted hover:bg-accent px-2 py-1.5 rounded-md mb-1.5 transition-colors h-auto min-h-[40px] items-start"
                        onClick={() => processAndAddMessage(example)}
                      >
                        <span className="whitespace-normal break-words">{example}</span>
                      </Button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-3">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-accent text-foreground rounded-md text-sm font-medium transition-colors h-auto min-h-[36px]"
                      onClick={() => {
                        switch(action.label) {
                          case 'Solve Problem':
                            processAndAddMessage("I need help solving a problem. Please provide step-by-step guidance.");
                            break;
                          case 'Explain Concept':
                            processAndAddMessage("Can you explain a concept in detail? Please provide a clear explanation.");
                            break;
                          case 'Create Quiz':
                            processAndAddMessage("Create a quiz with 5 multiple choice questions about a topic of your choice. Include clear questions, answer options A-D, correct answers, and explanations for each question.");
                            break;
                          case 'Study Guide':
                            processAndAddMessage("Please help me create a study guide for better learning.");
                            break;
                          default:
                            processAndAddMessage(`I'd like help with: ${action.label}`);
                        }
                      }}
                    >
                      <action.icon size={14} />
                      <span className="whitespace-normal break-words">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-card border-t border-border px-4 py-3">
          <div className="max-w-4xl mx-auto">
            {/* Attachments Preview - Show attachments before sending */}
            {attachments.length > 0 && (
              <div className="mb-3 p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Attached Files ({attachments.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAttachments}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    title="Remove all attachments"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border text-sm max-w-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileTypeIcon(file.type, file.name)}
                        <span className="truncate font-medium" title={file.name}>{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeAttachment(index)} 
                        className="text-muted-foreground hover:text-destructive ml-1 flex-shrink-0"
                        title="Remove attachment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Files are attached but not sent yet. You can ask questions about them or remove them before sending.
                </div>
              </div>
            )}
            
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="flex items-start gap-3 px-3 py-2.5">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="text-white" size={16} />
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your studies... (e.g., 'Explain photosynthesis', 'Solve this equation: 2x + 5 = 15', 'Help me understand Shakespeare's themes')"
                  className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground resize-none overflow-y-auto"
                  rows={1}
                  style={{
                    minHeight: '20px',
                    maxHeight: '150px',
                    height: 'auto'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 150) + 'px';
                  }}
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleFileSelect}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <Paperclip size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={toggleListening}
                    className={`p-1.5 ${isListening ? 'text-red-500' : 'text-muted-foreground'} hover:text-foreground hover:bg-accent rounded-md transition-colors`}
                  >
                    <Mic size={16} className={isListening ? 'animate-pulse' : ''} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCalculatorClick}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <Calculator size={16} />
                  </Button>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleStudyHelpToggle}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      <span>Study Help</span>
                      <ChevronDown size={14} />
                    </Button>
                    
                    {showStudyHelp && (
                      <div className="absolute bottom-full left-0 mb-1 w-48 bg-card border border-border rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <Button 
                            variant="ghost" 
                            className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent rounded-none h-auto min-h-[32px]"
                            onClick={() => handleStudyHelpOption("I need help with a math problem.")}
                          >
                            <span className="whitespace-normal break-words">Math Problem Solver</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent rounded-none h-auto min-h-[32px]"
                            onClick={() => handleStudyHelpOption("Explain a scientific concept to me.")}
                          >
                            <span className="whitespace-normal break-words">Science Concept Explainer</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent rounded-none h-auto min-h-[32px]"
                            onClick={() => handleStudyHelpOption("Help me write an essay.")}
                          >
                            <span className="whitespace-normal break-words">Essay Writing Assistant</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent rounded-none h-auto min-h-[32px]"
                            onClick={() => handleStudyHelpOption("Create a study schedule for me.")}
                          >
                            <span className="whitespace-normal break-words">Study Schedule Planner</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden md:block">Shift + Enter for new line</span>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || (!input.trim() && attachments.length === 0)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <span>Send</span>
                    <Send size={14} />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <p>StudyAI can make mistakes. Always verify important information.</p>
              <div className="flex items-center gap-3">
                <button className="hover:text-foreground text-xs">Privacy Policy</button>
                <p className="text-xs">Powered by Advanced AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Button - Made smaller and less prominent */}
      <Button className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow transition-colors z-10">
        <HelpCircle size={20} />
      </Button>
    </div>
  );
}
