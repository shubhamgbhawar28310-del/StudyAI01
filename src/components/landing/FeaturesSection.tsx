import { Upload, Calendar, Target, Timer, BarChart3, Zap, MessageSquare, Cloud, Sparkles, Music } from "lucide-react";
const FeaturesSection = () => {
  return <div id="features" className="py-20">
      {/* Smart Uploads Section */}
      <section id="how-it-works" className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32 py-16 bg-gradient-to-b from-background to-ai-soft/20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <Upload className="w-4 h-4 mr-2" />
              Smart Uploads
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
              Upload once. Study anywhere.
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Scattered PDFs, scanned notes, Google Docs—upload anything. Our AI extracts the text, 
              organizes by topic, and makes everything searchable. Your notes become clean, structured, 
              and ready for AI.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Upload PDFs, images, or docs—we handle the rest</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Smart categorization by topics and subjects</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Access your notes from any device, anytime</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">AI-generated summaries and concept maps</span>
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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32 py-16 bg-gradient-to-b from-ai-soft/20 to-background">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal lg:order-2">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Assistant
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
              Your AI Tutor — Smart, Fast, and Always Ready
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">Ask anything — from understanding tough topics to writing essays.
Aivy’s assistant gives clear, reliable answers in seconds — powered by advanced AI.
You can even share parts of your notes or questions directly in chat for more personalized help.
Like having a 24/7 tutor who never gets tired.</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Explain any concept clearly and simply</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Generate summaries, examples, or essays instantly</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Share your own text or notes for more tailored answers</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Available 24/7, instant answers</span>
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
          <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
            One workspace for studying smarter
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stop juggling Google Drive, Notion, and calendar apps. Aivy unifies your notes, schedule, 
            AI tutor, and progress tracking in one seamless platform.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="scroll-reveal bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
            <div className="w-12 h-12 ai-gradient rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Cloud Storage</h3>
            <p className="text-muted-foreground">
              Upload once, access anywhere. Your materials sync automatically across all devices.
            </p>
          </div>
          <div className="scroll-reveal bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
            <div className="w-12 h-12 ai-gradient rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">AI Tutor</h3>
            <p className="text-muted-foreground">
              Ask questions, get explanations, and study smarter with AI that knows your notes.
            </p>
          </div>
          <div className="scroll-reveal bg-white rounded-xl shadow-lg border border-border p-6 ai-glow-soft">
            <div className="w-12 h-12 ai-gradient rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Smart Scheduling</h3>
            <p className="text-muted-foreground">
              AI-generated study plans, Pomodoro timers, and streak tracking—all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Study Planning Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32 py-16 bg-gradient-to-b from-ai-soft/20 to-background">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal lg:order-2">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <Calendar className="w-4 h-4 mr-2" />
              Smart Scheduling
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
              AI builds a schedule that adapts to you
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Personalized Study Plans</h3>
                <p className="text-gray-600 leading-relaxed">
                  Link your notes to deadlines. The AI creates a schedule based on your energy, focus time, and what's hardest.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Difficulty-Based Time Allocation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mark topics as Easy, Medium, or Hard—AI gives you more time where you need it most.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Streaks & Motivation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Earn XP for every completed session. Build streaks to stay consistent. Let the AI handle planning—you just show up.
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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <Target className="w-4 h-4 mr-2" />
              Advanced Features
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
              See how far you've come
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center">
                  <Timer className="w-5 h-5 mr-2 text-primary" />
                  Pomodoro Focus Sessions
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Integrated timers linked to your study topics. Stay focused, take breaks, repeat.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                  Progress Dashboard
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Track study hours, topic completion, and streaks. Celebrate consistency, not perfection.
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

      {/* Focus Music Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-ai-soft/20 to-background">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal lg:order-2">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-ai-soft text-primary font-medium text-sm mb-6">
              <Music className="w-4 h-4 mr-2" />
              Focus Music
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-foreground mb-6">
              Get in your zone
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Block distractions with curated focus music and ambient sounds. A floating player keeps your 
              playlist accessible during Pomodoro sessions—so you stay peaceful and productive.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Curated study playlists and ambient sounds</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Floating player that stays with you</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Seamless Pomodoro timer integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 ai-gradient rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </div>
                <span className="text-foreground font-medium">Study peacefully without switching apps</span>
              </div>
            </div>
          </div>
          <div className="scroll-reveal lg:order-1">
            <div className="relative">
              <div className="absolute inset-0 ai-gradient rounded-2xl opacity-10 blur-2xl"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-border p-6 ai-glow-soft">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Music className="w-5 h-5 mr-2 text-primary" />
                    Focus Playlist
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-ai-soft rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 ai-gradient rounded-lg flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Deep Focus Mix</p>
                          <p className="text-xs text-muted-foreground">Ambient • 2h 15m</p>
                        </div>
                      </div>
                      <div className="text-primary">▶</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Music className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Study Instrumental</p>
                          <p className="text-xs text-muted-foreground">Classical • 1h 45m</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Music className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Nature Sounds</p>
                          <p className="text-xs text-muted-foreground">Ambient • 3h 20m</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Now Playing</span>
                      <span className="font-medium">Deep Focus Mix</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default FeaturesSection;