import { Upload, Calendar, Target, Timer, BarChart3, Zap, MessageSquare, Cloud, Sparkles } from "lucide-react";
const FeaturesSection = () => {
  return <div className="py-20 bg-background">
      {/* Smart Uploads Section */}
      <section id="how-it-works" className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <Upload className="w-4 h-4 mr-2" />
              Smart Uploads
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              AI-Powered Notes
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Stop searching across PDFs and drives. Simply upload your scattered notes—PDFs, 
              images, or docs—and our system automatically extracts the text and organizes 
              everything intelligently.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Automatic text extraction from any format</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Smart categorization and tagging</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Access anywhere, anytime</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Generate summaries and mind maps</span>
              </div>
            </div>
          </div>
          <div className="scroll-reveal">
            <div className="relative">
              <div className="absolute inset-0 ai-gradient rounded-2xl opacity-10 blur-2xl"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-border p-8 ai-glow-soft">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-ai-soft rounded-lg">
                    <Upload className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium">Physics_Notes.pdf</p>
                      <p className="text-sm text-muted-foreground">Extracting content... 95%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[95%] ai-gradient rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-sm font-medium">Topics Found</p>
                      <p className="text-2xl font-bold ai-gradient-text">12</p>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-sm font-medium">Key Concepts</p>
                      <p className="text-2xl font-bold ai-gradient-text">47</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal lg:order-2">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Assistant
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Fully Functional AI Assistant
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Get instant help with anything—just like any AI. Ask questions, brainstorm ideas, solve problems, write content, and more. Plus, it has direct access to all your study materials.</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Complete AI assistant for any task or question</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Write, brainstorm, solve problems, and create content</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Direct access to your uploaded study materials</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Available 24/7 with instant responses</span>
              </div>
            </div>
          </div>
          <div className="scroll-reveal lg:order-1">
            <div className="relative">
              <div className="absolute inset-0 ai-gradient rounded-2xl opacity-10 blur-2xl"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-border p-6 ai-glow-soft">
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-ai-soft rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                      <p className="text-sm">Can you explain Newton's second law?</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="ai-gradient text-white rounded-2xl rounded-tr-sm p-4 max-w-[85%]">
                      <p className="text-sm">Newton's second law states that F = ma. The force acting on an object equals its mass times acceleration. For example, if you push a shopping cart...</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-ai-soft rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                      <p className="text-sm">Can you give me a practice problem?</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                    <span className="text-sm">AI is typing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All-in-One Platform Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="text-center mb-12 scroll-reveal">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
            <Cloud className="w-4 h-4 mr-2" />
            Everything In One Place
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            All Your Study Tools, Unified
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            No more switching between apps. StudyAI brings together notes, schedules, AI assistance, 
            and analytics in one powerful platform accessible from anywhere.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="scroll-reveal bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
            <div className="w-12 h-12 ai-gradient rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Cloud Storage</h3>
            <p className="text-muted-foreground">
              Upload once, access everywhere. Your materials sync across all devices automatically.
            </p>
          </div>
          <div className="scroll-reveal bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
            <div className="w-12 h-12 ai-gradient rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">AI Assistant</h3>
            <p className="text-muted-foreground">
              Chat with AI trained on your materials. Get help instantly, anytime you need it.
            </p>
          </div>
          <div className="scroll-reveal bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
            <div className="w-12 h-12 ai-gradient rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Smart Planning</h3>
            <p className="text-muted-foreground">
              Automated schedules, progress tracking, and gamification all work together seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* Study Planning Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal lg:order-2">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <Calendar className="w-4 h-4 mr-2" />
              Smart Scheduling
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              A Schedule That Works For You
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Schedule + Notes Integration</h3>
                <p className="text-muted-foreground">
                  Link your notes to your plan and let our AI build your schedule based on your topics and deadlines.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Difficulty-based Planning</h3>
                <p className="text-muted-foreground">
                  Mark topics as Easy, Medium, or Hard, and the AI will allocate more time where you need it most.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Gamification</h3>
                <p className="text-muted-foreground">
                  Stay motivated with streaks and XP points for every task you complete.
                </p>
              </div>
            </div>
          </div>
          <div className="scroll-reveal lg:order-1">
            <div className="grid grid-cols-1 gap-4">
              {/* Schedule Card */}
              <div className="bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Today's Study Plan
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-ai-soft rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Physics - Waves</span>
                    </div>
                    <span className="text-sm text-muted-foreground">2h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">Math - Calculus</span>
                    </div>
                    <span className="text-sm text-muted-foreground">1.5h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">History - Review</span>
                    </div>
                    <span className="text-sm text-muted-foreground">45m</span>
                  </div>
                </div>
              </div>
              
              {/* Gamification Card */}
              <div className="bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  Your Progress
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold ai-gradient-text">7</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold ai-gradient-text">1,247</div>
                    <div className="text-sm text-muted-foreground">XP Points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optimization Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <Target className="w-4 h-4 mr-2" />
              Advanced Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Beyond the Plan
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center">
                  <Timer className="w-5 h-5 mr-2 text-primary" />
                  Smart Reminders & Pomodoro
                </h3>
                <p className="text-muted-foreground">
                  Focus with integrated Pomodoro timers linked directly to your study topics.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                  Progress Analytics
                </h3>
                <p className="text-muted-foreground">
                  Track your progress with a personalized dashboard showing daily hours and topic completion.
                </p>
              </div>
            </div>
          </div>
          <div className="scroll-reveal">
            <div className="space-y-4">
              {/* Pomodoro Timer */}
              <div className="bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Focus Session</h3>
                  <Timer className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold ai-gradient-text mb-2">25:00</div>
                  <p className="text-muted-foreground mb-4">Physics - Quantum Mechanics</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="ai-gradient h-2 rounded-full" style={{
                    width: '60%'
                  }}></div>
                  </div>
                </div>
              </div>
              
              {/* Analytics */}
              <div className="bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Week Overview</h3>
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <div key={day} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{day}</div>
                      <div className={`h-8 rounded ${index < 5 ? 'ai-gradient' : 'bg-muted'}`} style={{
                    opacity: index < 5 ? 0.8 : 0.3
                  }}></div>
                    </div>)}
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold ai-gradient-text">28.5</span>
                  <span className="text-muted-foreground ml-1">hours this week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default FeaturesSection;