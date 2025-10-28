import { useState } from 'react'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { ThemeProvider } from '@/components/theme-provider'

export default function TestDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  
  return (
    <ThemeProvider defaultTheme="light" storageKey="studyai-theme">
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-auto bg-white">
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              StudyAI Dashboard Test
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              If you can see this, the app is working! 🎉
            </p>
            
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <strong>Current Tab:</strong> {activeTab}
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-2">Card 1</h2>
                <p className="text-gray-600">This is a test card</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-2">Card 2</h2>
                <p className="text-gray-600">Another test card</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-2">Card 3</h2>
                <p className="text-gray-600">Third test card</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}