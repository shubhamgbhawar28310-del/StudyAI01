# StudyAI - Full-Featured AI Study Assistant

A comprehensive AI-powered study assistant similar to ChatGPT, with advanced document analysis, study planning, and interactive learning features.

## 🚀 Features

### Core Capabilities
- **AI Chat Assistant**: Natural conversations with an AI tutor (like ChatGPT)
- **Document Analysis**: Upload PDFs, images, notes for comprehensive analysis
- **Study Plan Generation**: Create personalized, editable study plans
- **Smart Content Processing**: OCR for images, PDF parsing, text extraction
- **Flashcard Generation**: Automatic flashcard creation from any content
- **Practice Questions**: Generate quizzes and practice problems
- **Progress Tracking**: Monitor your learning journey
- **Task Management**: Organize and track study tasks
- **Schedule Integration**: Plan study sessions with calendar integration

### Document Processing
- PDF analysis and text extraction
- Image OCR (handwritten notes, diagrams)
- Support for Word docs, text files, code files
- CSV/JSON data analysis
- Automatic topic identification
- Key point extraction
- Smart summarization

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key (or alternative AI provider)

## 🛠️ Installation

### 1. Clone the Repository
```bash
cd "C:\Users\KISHAN PRAJAPATI\studyAI0"
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ..
npm install
```

### 4. Configure Environment Variables

#### Backend Configuration
Edit `backend/.env` file:
```env
# IMPORTANT: Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Other settings (optional)
PORT=3001
NODE_ENV=development
```

#### Frontend Configuration (Optional)
Create `.env` in root directory:
```env
VITE_API_URL=http://localhost:3001/api
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm start
```
The backend will run on `http://localhost:3001`

### Start Frontend (in new terminal)
```bash
cd "C:\Users\KISHAN PRAJAPATI\studyAI0"
npm run dev
```
The frontend will run on `http://localhost:5173`

## 📖 Usage Guide

### 1. Basic Chat
- Open the app in your browser
- Start typing questions or requests
- The AI will respond like ChatGPT

### 2. Document Upload & Analysis
- Click the upload button
- Select PDF, image, or text file
- Get comprehensive analysis including:
  - Main topics and concepts
  - Key learning points
  - Study recommendations
  - Auto-generated flashcards
  - Practice questions

### 3. Study Plan Generation
- Type: "Create a study plan for [topic]"
- Specify duration and level
- Get a detailed plan with:
  - Daily schedules
  - Learning objectives
  - Resources
  - Milestones

### 4. Edit & Implement Plans
- Plans are fully editable
- Click "Edit" to modify any section
- Click "Implement" to:
  - Add tasks to your list
  - Schedule study sessions
  - Set reminders

### 5. Practice & Review
- Generate flashcards from any content
- Create practice quizzes
- Track your progress
- Get personalized recommendations

## 🎯 Example Commands

```text
"Create a 4-week study plan for calculus"
"Analyze this PDF and create flashcards"
"Generate 10 practice questions on photosynthesis"
"Summarize my uploaded notes"
"Help me understand quantum mechanics"
"Create a schedule for exam preparation"
```

## 🔧 API Endpoints

### Chat Endpoints
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history/:userId` - Get conversation history
- `POST /api/chat/generate-plan` - Generate study plan
- `POST /api/chat/edit` - Edit content
- `POST /api/chat/flashcards` - Generate flashcards

### Document Endpoints
- `POST /api/documents/upload` - Upload and analyze document
- `POST /api/documents/analyze-text` - Analyze text directly
- `POST /api/documents/generate-materials` - Generate study materials

### Study Endpoints
- `POST /api/study/plan/create` - Create study plan
- `GET /api/study/plan/:planId` - Get specific plan
- `PUT /api/study/plan/:planId` - Update plan
- `POST /api/study/plan/:planId/implement` - Implement plan
- `POST /api/study/practice/generate` - Generate practice questions

## 🤖 AI Providers

### OpenAI (Default)
1. Get API key from https://platform.openai.com/api-keys
2. Add to `backend/.env`

### Alternative: Ollama (Local AI)
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Update `backend/.env`:
```env
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
```

### Alternative: Google Gemini
1. Get API key from Google AI Studio
2. Update `backend/.env`:
```env
GOOGLE_API_KEY=your-google-api-key
```

## 📁 Project Structure

```
studyAI0/
├── backend/
│   ├── server.js           # Express server
│   ├── services/
│   │   ├── aiService.js    # AI integration
│   │   └── documentProcessor.js # Document processing
│   ├── routes/
│   │   ├── chat.js         # Chat endpoints
│   │   ├── documents.js    # Document endpoints
│   │   └── study.js        # Study endpoints
│   ├── db/
│   │   └── database.js     # SQLite database
│   └── uploads/            # Uploaded files
├── src/
│   ├── components/
│   │   └── features/
│   │       └── AIAssistant.tsx # Main AI component
│   ├── services/
│   │   └── api.ts          # API service
│   └── App.tsx
└── package.json
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify all dependencies are installed
- Check `.env` file configuration

### AI responses not working
- Verify OpenAI API key is correct
- Check API key has credits
- Try using mock responses (automatic fallback)

### File upload issues
- Check file size (max 10MB by default)
- Verify file type is supported
- Check `uploads` folder permissions

### Database errors
- Delete `backend/db/studyai.db` to reset
- Backend will recreate database on start

## 🚦 Testing

### Quick Test
1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Open browser to `http://localhost:5173`
4. Try: "Hello, can you help me study?"
5. Upload a PDF or image
6. Generate a study plan

### API Testing
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test chat (with mock response)
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

## 📝 License

MIT License - Feel free to use for educational purposes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Tips

1. **API Key**: Get a free OpenAI API key with $5 credits for testing
2. **Mock Mode**: The app works without API key using mock responses
3. **Local AI**: Use Ollama for completely free, offline AI
4. **Customization**: Modify system prompts in `aiService.js` for different behaviors

## 🎓 Educational Use

This project is perfect for:
- Learning full-stack development
- Understanding AI integration
- Building study tools
- Portfolio projects

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments
3. Test with mock responses first
4. Verify API keys and environment

---

**Ready to revolutionize your studying? Start the app and begin learning smarter!** 🚀📚