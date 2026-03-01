# Aivy - AI-Powered Study Assistant

A comprehensive study management platform with AI assistance, featuring task management, flashcards, pomodoro timer, and more.

## 🚀 Features

### Core Features
- 📝 **Task Management** - Create, organize, and track study tasks
- 🎴 **Flashcards** - Generate and study flashcards with spaced repetition
- ⏱️ **Pomodoro Timer** - Focus sessions with built-in timer
- 📅 **Study Scheduler** - Plan and organize study sessions
- 📚 **Materials Manager** - Upload and manage study materials
- 📊 **Progress Tracking** - Monitor your study progress and achievements
- 🤖 **AI Assistant** - Get study help with Google Gemini AI

### Authentication & Data Sync ✨ NEW
- 🔐 **User Authentication** - Secure login with email/password or Google OAuth
- ☁️ **Cloud Sync** - Automatic data synchronization to Supabase
- 💾 **Persistent Data** - Your data is never lost on refresh or logout
- 🔄 **Real-time Sync** - Changes sync instantly across devices
- 📱 **Offline Support** - Works offline with localStorage backup
- 👤 **User Isolation** - Each user has their own private dataset

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **State Management**: React Context + Reducers
- **Routing**: React Router v6

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studyai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_AI_API_KEY=your-google-ai-api-key
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase database**
   
   Aivy requires a PostgreSQL database to function properly.
   
   1. Access the [Supabase Dashboard](https://app.supabase.com) and create/select your project.
   2. Navigate to the **SQL Editor**.
   3. Run the migrations sequentially:
      - `supabase/migrations/create_user_data_tables.sql`
      - `supabase/migrations/create_user_preferences_table.sql`
   4. Verify that tables like `tasks`, `materials`, `flashcards`, etc. were created.
   5. Configure Authentication in the Supabase dashboard to enable email/password signups.

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📱 Usage

1. **Sign Up** - Create an account at `/signup`
2. **Login** - Access your dashboard at `/login`
3. **Dashboard** - Manage tasks, materials, and study sessions
4. **AI Assistant** - Get study help and generate flashcards
5. **Track Progress** - Monitor your achievements and stats

## 🏗️ Project Structure

```
studyai/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, StudyPlanner)
│   ├── pages/            # Page components
│   ├── services/         # API and sync services
│   ├── lib/              # Utilities and configurations
│   └── hooks/            # Custom React hooks
├── supabase/
│   └── migrations/       # Database migration files
├── public/               # Static assets
└── ...config files
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User data is isolated by `user_id`
- Secure authentication with Supabase Auth
- Environment variables for sensitive data

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
