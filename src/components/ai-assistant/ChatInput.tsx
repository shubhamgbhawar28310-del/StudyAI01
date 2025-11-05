import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Paperclip, 
  Send, 
  Mic, 
  XCircle, 
  Upload, 
  Image, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  File 
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Attachment } from '@/components/ai-assistant/types'

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

interface ChatInputProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void
  disabled: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isListening, setIsListening] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // File type options for the dropdown
  const fileTypeOptions = [
    {
      label: 'Images',
      icon: <Image className="w-4 h-4" />,
      accept: 'image/*',
      description: 'JPG, PNG, GIF, WebP'
    },
    {
      label: 'Documents',
      icon: <FileText className="w-4 h-4" />,
      accept: '.pdf,.doc,.docx,.txt,.ppt,.pptx',
      description: 'PDF, Word, PowerPoint, Text files'
    },
    {
      label: 'Spreadsheets',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      accept: '.xlsx,.xls,.csv',
      description: 'Excel, CSV files'
    },
    {
      label: 'All Files',
      icon: <Paperclip className="w-4 h-4" />,
      accept: '*/*',
      description: 'Any file type'
    }
  ]

  const handleSendMessage = () => {
    if ((text.trim() || attachments.length > 0) && !disabled) {
      // If we have attachments but no text, provide a default prompt
      let finalText = text.trim();
      if (attachments.length > 0 && !finalText) {
        finalText = "Please analyze the attached file(s) and provide a summary of the main topics and key points.";
      }
      
      onSendMessage(finalText, attachments)
      setText('')
      setAttachments([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Helper function to get file type icon
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="w-4 h-4" />
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="w-4 h-4" />
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="w-4 h-4" />
    if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) return <FileText className="w-4 h-4" />
    if (fileType.startsWith('video/')) return <FileVideo className="w-4 h-4" />
    if (fileType.startsWith('audio/')) return <FileAudio className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) {
      console.log('No files selected')
      return
    }

    console.log(`Selected ${files.length} files:`, Array.from(files).map(f => ({ name: f.name, type: f.type, size: f.size })))

    // Store the actual File objects in the attachments
    // We'll send these to the backend for processing
    const fileAttachments: Attachment[] = Array.from(files).map((file: File) => ({
      name: file.name,
      type: file.type,
      file: file, // Store the actual File object
      content: '', // Will be populated when we send to backend
    }))

    console.log(`Creating ${fileAttachments.length} file attachments:`, fileAttachments.map(a => a.name))
    setAttachments(prev => [...prev, ...fileAttachments])

    if(fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        setText(prevText => prevText + finalTranscript)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      console.warn("Speech Recognition not supported in this browser.")
    }
  }, [])

  useEffect(() => {
    setupSpeechRecognition()
    return () => {
      recognitionRef.current?.abort()
    }
  }, [setupSpeechRecognition])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
    setIsListening(!isListening)
  }

  const handleFileTypeSelect = (accept: string) => {
    console.log(`File type selected: ${accept}`)
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept
      console.log(`File input accept set to: ${fileInputRef.current.accept}`)
      fileInputRef.current.click()
    } else {
      console.error('File input ref is null')
    }
  }

  return (
    <div className="relative">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Attachments ({attachments.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttachments([])}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border text-sm">
                {getFileTypeIcon(file.type)}
                <span className="max-w-32 truncate font-medium">{file.name}</span>
                <button 
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== index))} 
                  className="text-muted-foreground hover:text-destructive ml-1"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <div className="flex items-end gap-2 p-4 border border-border rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {fileTypeOptions.map((option, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleFileTypeSelect(option.accept)}
                  className="flex items-center gap-3 p-3"
                >
                  {option.icon}
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleFileTypeSelect('*/*')}
                className="flex items-center gap-3 p-3"
              >
                <Upload className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium">Browse Files</span>
                  <span className="text-xs text-muted-foreground">Select any file type</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-h-[24px] max-h-32">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Aivy..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none placeholder-muted-foreground text-sm leading-6"
              rows={1}
              disabled={disabled}
              style={{
                height: 'auto',
                minHeight: '24px',
                maxHeight: '128px'
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              disabled={disabled}
              className={`h-8 w-8 p-0 ${isListening ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={disabled || (!text.trim() && attachments.length === 0)}
              size="sm"
              className="h-8 w-8 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}