import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Aivy</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: November 2025</p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              Aivy ("we", "our", or "us") operates the website{' '}
              <a 
                href="https://aivyapp.vercel.app" 
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://aivyapp.vercel.app
              </a>{' '}
              (the "Service"). This Privacy Policy explains how we collect, use, and protect 
              information when you use our platform and its features such as Study Planner, 
              AI Assistant, NoteIQ, and Google Calendar Sync.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
              </div>
            </div>
            <p className="text-gray-700 mb-4">We may collect the following types of information:</p>
            <ul className="space-y-3 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Account Information:</strong>
                  <span className="text-gray-700"> Email address and name when you sign in using Google or any authentication method.</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Usage Data:</strong>
                  <span className="text-gray-700"> Pages visited, session duration, and interactions with Aivy tools (used only to improve performance).</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <div>
                  <strong className="text-gray-900">Calendar Data (if you enable Google Calendar Sync):</strong>
                  <span className="text-gray-700"> When you connect your Google account, Aivy requests permission to view and create events in your Google Calendar to synchronize your study sessions. We never access, store, or share any calendar data outside your account.</span>
                </div>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">2. How We Use the Information</h2>
              </div>
            </div>
            <p className="text-gray-700 mb-4">We use the collected data to:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span className="text-gray-700">Provide and maintain Aivy's features.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span className="text-gray-700">Sync study sessions with your Google Calendar (only when you explicitly enable it).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span className="text-gray-700">Improve our product functionality and user experience.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">3. Data Storage and Security</h2>
              </div>
            </div>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-gray-700">All user data is stored securely on Supabase servers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-gray-700">We do not share your data with third parties.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-gray-700">OAuth tokens (for Google Calendar) are encrypted and used only for synchronization.</span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Google API Services Disclosure</h2>
            <p className="text-gray-700 leading-relaxed">
              Aivy's use and transfer to any other app of information received from Google APIs 
              will adhere to{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                className="text-blue-600 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 mb-4">You can:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">Disconnect Google Calendar access anytime from your Aivy account settings.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">Request data deletion by contacting us at the email below.</span>
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy occasionally. The latest version will always be 
              posted on this page.
            </p>
          </section>

          {/* Section 7 - Contact */}
          <section className="border-t border-gray-200 pt-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">7. Contact Us</h2>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy, contact:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p className="text-gray-900">
                <strong>Developer:</strong> Kishan Prajapati
              </p>
              <p className="text-gray-900">
                <strong>Email:</strong>{' '}
                <a 
                  href="mailto:kishanindrachandprajapati2006@gmail.com" 
                  className="text-blue-600 hover:underline"
                >
                  kishanindrachandprajapati2006@gmail.com
                </a>
              </p>
              <p className="text-gray-900">
                <strong>Website:</strong>{' '}
                <a 
                  href="https://aivyapp.vercel.app" 
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://aivyapp.vercel.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p>© 2025 Aivy. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
