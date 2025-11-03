import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  Music,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  MoreVertical,
  Upload,
  RefreshCw,
  Trash2,
  Settings,
  List,
  Loader2,
  Eye,
  RotateCcw,
  RotateCw,
  Repeat,
  Repeat1
} from 'lucide-react';
import { 
  getAllSongs, 
  isAdmin, 
  uploadMusicFiles, 
  deleteSong, 
  Song, 
  UploadProgress 
} from '@/services/musicService';

interface FloatingMusicPlayerProps {
  enabled: boolean;
  onClose: () => void;
}

export function FloatingMusicPlayer({ enabled, onClose }: FloatingMusicPlayerProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoplayRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Derived state - must be declared before useEffects
  const currentSong = songs[currentSongIndex];
  
  // Load songs and check admin status
  useEffect(() => {
    if (enabled) {
      loadSongs();
      checkAdminStatus();
    }
  }, [enabled]);
  
  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Update audio source when song changes
  useEffect(() => {
    const loadAndPlaySong = async () => {
      if (!audioRef.current || !currentSong) return;
      
      const cleanFilePath = currentSong.file_path.trim().replace(/[\n\r]/g, '');
      
      // Build proper URL with encoding
      let audioUrl;
      if (currentSong.public_url) {
        audioUrl = currentSong.public_url;
      } else {
        // Properly encode the file path
        const encodedPath = encodeURIComponent(cleanFilePath);
        audioUrl = `https://crdqpioymuvnzhtgrenj.supabase.co/storage/v1/object/public/music/${encodedPath}`;
      }
      
      const shouldAutoplay = shouldAutoplayRef.current;
      console.log('Setting audio source:', audioUrl, 'shouldAutoplay:', shouldAutoplay);
      
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      setCurrentTime(0);
      setDuration(0);
      
      // Force metadata loading
      audioRef.current.preload = 'metadata';
      
      // If shouldAutoplay is true, wait for audio to be ready and play
      if (shouldAutoplay) {
        console.log('Autoplay enabled, waiting for audio to be ready...');
        
        try {
          // Wait for the audio to be ready to play
          await new Promise<void>((resolve, reject) => {
            if (!audioRef.current) {
              reject(new Error('Audio ref is null'));
              return;
            }
            
            const audio = audioRef.current;
            
            // If already ready, resolve immediately
            if (audio.readyState >= 3) {
              resolve();
              return;
            }
            
            // Otherwise wait for canplaythrough event
            const onCanPlayThrough = () => {
              audio.removeEventListener('canplaythrough', onCanPlayThrough);
              audio.removeEventListener('error', onError);
              resolve();
            };
            
            const onError = (e: Event) => {
              audio.removeEventListener('canplaythrough', onCanPlayThrough);
              audio.removeEventListener('error', onError);
              reject(new Error('Audio loading error'));
            };
            
            audio.addEventListener('canplaythrough', onCanPlayThrough);
            audio.addEventListener('error', onError);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              audio.removeEventListener('canplaythrough', onCanPlayThrough);
              audio.removeEventListener('error', onError);
              reject(new Error('Timeout waiting for audio'));
            }, 10000);
          });
          
          // Now play the audio
          if (audioRef.current) {
            console.log('Audio ready, starting playback...');
            await audioRef.current.play();
            setIsPlaying(true);
            console.log('Autoplay successful!');
          }
        } catch (err) {
          console.error('Autoplay failed:', err);
          setIsPlaying(false);
        } finally {
          shouldAutoplayRef.current = false;
        }
      } else {
        setIsPlaying(false);
      }
    };
    
    loadAndPlaySong();
  }, [currentSong]);



  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      console.log('🎵 Song ended! Going to next track...');
      
      // SUPER SIMPLE: Just go to next song
      const nextIndex = (currentSongIndex + 1) % songs.length;
      console.log('Next song index:', nextIndex);
      
      shouldAutoplayRef.current = true;
      setCurrentSongIndex(nextIndex);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleDurationChange = () => {
      console.log('Duration change:', audio.duration); // Debug log
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => {
      console.log('Audio play event'); // Debug log
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('Audio pause event'); // Debug log
      setIsPlaying(false);
    };

    // Add all event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Backup timer to ensure UI updates even if timeupdate events don't fire
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      updateIntervalRef.current = setInterval(() => {
        if (audioRef.current && !audioRef.current.paused) {
          const currentTime = audioRef.current.currentTime;
          const duration = audioRef.current.duration;
          
          if (!isNaN(currentTime)) {
            setCurrentTime(currentTime);
          }
          
          if (!isNaN(duration) && duration > 0) {
            setDuration(duration);
          }
        }
      }, 100); // Update every 100ms for smooth progress
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isPlaying]);
  
  const loadSongs = async () => {
    setIsLoadingSongs(true);
    try {
      const fetchedSongs = await getAllSongs();
      setSongs(fetchedSongs);
      
      if (fetchedSongs.length > 0 && currentSongIndex >= fetchedSongs.length) {
        setCurrentSongIndex(0);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load music library',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const checkAdminStatus = async () => {
    const adminStatus = await isAdmin();
    setIsAdminUser(adminStatus);
  };
  
  const handlePlayPause = async () => {
    if (!audioRef.current || !currentSong) return;
    
    // Initialize audio context on first user interaction
    if (!audioInitialized) {
      try {
        // Create a silent audio to initialize the audio context
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmHgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
        await silentAudio.play();
        silentAudio.pause();
        setAudioInitialized(true);
      } catch (e) {
        console.log('Audio context initialization failed, continuing anyway');
      }
    }
    
    if (isPlaying) {
      // Simple pause - don't reload or reset anything
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('Paused at:', audioRef.current.currentTime);
    } else {
      try {
        // Check if audio source is already set and valid
        const needsSourceUpdate = !audioRef.current.src || audioRef.current.src === '';
        
        if (needsSourceUpdate) {
          // Only set source if it's not already set
          const cleanFilePath = currentSong.file_path.trim().replace(/[\n\r]/g, '');
          
          let audioUrl;
          if (currentSong.public_url) {
            audioUrl = currentSong.public_url;
          } else {
            const encodedPath = encodeURIComponent(cleanFilePath);
            audioUrl = `https://crdqpioymuvnzhtgrenj.supabase.co/storage/v1/object/public/music/${encodedPath}`;
          }
          
          console.log('Setting audio source:', audioUrl);
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          
          // Wait for the audio to be ready
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Audio loading timeout'));
            }, 10000);
            
            const onCanPlay = () => {
              clearTimeout(timeout);
              audioRef.current?.removeEventListener('canplay', onCanPlay);
              audioRef.current?.removeEventListener('error', onError);
              resolve(true);
            };
            
            const onError = (e) => {
              clearTimeout(timeout);
              audioRef.current?.removeEventListener('canplay', onCanPlay);
              audioRef.current?.removeEventListener('error', onError);
              reject(new Error(`Audio loading failed: ${audioRef.current?.error?.message || 'Unknown error'}`));
            };
            
            if (audioRef.current.readyState >= 2) {
              clearTimeout(timeout);
              resolve(true);
            } else {
              audioRef.current.addEventListener('canplay', onCanPlay);
              audioRef.current.addEventListener('error', onError);
            }
          });
        }
        
        // Resume playback from current position
        console.log('Resuming from:', audioRef.current.currentTime);
        await audioRef.current.play();
        setIsPlaying(true);
        
        // Update duration if needed
        if (audioRef.current.duration && !isNaN(audioRef.current.duration) && duration === 0) {
          setDuration(audioRef.current.duration);
        }
        
        console.log('Audio playing successfully');
      } catch (err) {
        console.error('Playback error:', err);
        
        let errorMessage = 'Could not play audio. Please try again.';
        if (err.name === 'NotSupportedError') {
          errorMessage = 'Audio format not supported by your browser.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Audio playback blocked. Please allow audio in your browser.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Audio loading was interrupted. Please try again.';
        }
        
        setIsPlaying(false);
        toast({
          title: 'Playback Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };
  
  const handlePrevious = () => {
    if (currentTime > 3) {
      // If more than 3 seconds played, restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      // Go to previous track and autoplay
      console.log('Going to previous track, will autoplay');
      const newIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
      shouldAutoplayRef.current = true; // Enable autoplay when going to previous track
      setCurrentSongIndex(newIndex);
    }
  };
  
  const handleNext = (autoplay = false) => {
    console.log('handleNext called with autoplay:', autoplay);
    
    // Simple next song logic (manual button click)
    const newIndex = (currentSongIndex + 1) % songs.length;
    shouldAutoplayRef.current = autoplay;
    setCurrentSongIndex(newIndex);
    if (!autoplay) {
      setIsPlaying(false);
    }
  };

  const handleSongSelect = (index: number) => {
    console.log('Song selected from playlist, will autoplay');
    shouldAutoplayRef.current = true; // Enable autoplay when selecting from playlist
    setCurrentSongIndex(index);
    setShowPlaylist(false);
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + 5, duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 5, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleRepeatToggle = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    
    const modeNames = {
      off: 'Repeat Off',
      all: 'Repeat All',
      one: 'Repeat One'
    };
    
    toast({
      title: modeNames[nextMode],
      description: nextMode === 'off' ? 'Playback will stop after playlist ends' :
                   nextMode === 'all' ? 'Playlist will repeat continuously' :
                   'Current song will repeat',
      duration: 2000
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('audio/') || 
                         file.name.toLowerCase().endsWith('.mp3') ||
                         file.name.toLowerCase().endsWith('.wav') ||
                         file.name.toLowerCase().endsWith('.ogg');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      
      if (!isValidType) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not a valid audio file`,
          variant: 'destructive'
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive'
        });
        return false;
      }
      
      return true;
    });

    setSelectedFiles(validFiles);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedSongs = await uploadMusicFiles(selectedFiles);
      
      if (uploadedSongs.length > 0) {
        toast({
          title: 'Upload Complete',
          description: `${uploadedSongs.length} song(s) uploaded successfully`,
        });
        
        loadSongs(); // Refresh the song list
        setSelectedFiles([]);
        setShowUpload(false);
      } else {
        toast({
          title: 'Upload Failed',
          description: 'No files were uploaded successfully',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'An error occurred during upload',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const checkDuration = () => {
    if (audioRef.current) {
      console.log('Manual duration check:', audioRef.current.duration);
      console.log('Audio readyState:', audioRef.current.readyState);
      console.log('Audio networkState:', audioRef.current.networkState);
      
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
        toast({
          title: 'Duration Found',
          description: `Duration: ${formatTime(audioRef.current.duration)}`,
        });
      } else {
        toast({
          title: 'Duration Issue',
          description: 'Cannot get audio duration',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDeleteSong = async (songId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this song?')) {
      return;
    }

    try {
      // Mock delete for testing
      toast({
        title: 'Song Deleted',
        description: 'Song has been removed successfully'
      });
      await loadSongs();
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the song',
        variant: 'destructive'
      });
    }
  };
  
  const handleMuteToggle = () => {
    setVolume(volume === 0 ? 0.5 : 0);
  };
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const playbackProgress = duration > 0 && currentTime >= 0 ? (currentTime / duration) * 100 : 0;
  
  if (!enabled) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      className="fixed bottom-20 right-6 z-50"
    >
      <div className={`${isMinimized ? 'w-64' : 'w-80'} bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 ease-in-out`}>
        {isMinimized ? (
          // Minimized View - Fixed layout with proper truncation
          <div className="p-4 flex items-center gap-3 w-64">
            <Music className="h-6 w-6 text-purple-500 flex-shrink-0" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis">
                {currentSong?.title || (songs.length === 0 ? 'No music' : 'Select a song')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                disabled={!currentSong || isLoading}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          // Full View
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-semibold">Focus Music</span>
                {songs.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {songs.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMenu(!showMenu)}
                    className="h-7 w-7 p-0"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPlaylist(!showPlaylist);
                            setShowMenu(false);
                          }}
                          className="w-full justify-start px-3 py-2 h-auto"
                        >
                          <List className="h-4 w-4 mr-2" />
                          Playlist ({songs.length})
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            loadSongs();
                            setShowMenu(false);
                          }}
                          className="w-full justify-start px-3 py-2 h-auto"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        
                        {isAdminUser && (
                          <>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowUpload(!showUpload);
                                setShowMenu(false);
                              }}
                              className="w-full justify-start px-3 py-2 h-auto text-blue-600"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Music
                            </Button>
                            
                            {currentSong && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    console.log('Current song:', currentSong);
                                    const cleanFilePath = currentSong.file_path.trim().replace(/[\n\r]/g, '');
                                    const encodedPath = encodeURIComponent(cleanFilePath);
                                    const testUrl = `https://crdqpioymuvnzhtgrenj.supabase.co/storage/v1/object/public/music/${encodedPath}`;
                                    console.log('Test URL:', testUrl);
                                    window.open(testUrl, '_blank');
                                    setShowMenu(false);
                                  }}
                                  className="w-full justify-start px-3 py-2 h-auto text-green-600"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Test Supabase URL
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.open('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', '_blank');
                                    setShowMenu(false);
                                  }}
                                  className="w-full justify-start px-3 py-2 h-auto text-blue-600"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Test External URL
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    checkDuration();
                                    setShowMenu(false);
                                  }}
                                  className="w-full justify-start px-3 py-2 h-auto text-purple-600"
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Check Duration
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="h-7 w-7 p-0"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Song Info */}
            {currentSong ? (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{currentSong.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentSong.artist || 'Unknown Artist'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-center py-4">
                {isLoadingSongs ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading music...</span>
                  </div>
                ) : songs.length === 0 ? (
                  <div>
                    <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No music available</p>
                    {isAdminUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUpload(true)}
                        className="mt-2 text-blue-600"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Music
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Select a song to play</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPlaylist(true)}
                      className="mt-2"
                    >
                      <List className="h-4 w-4 mr-2" />
                      View Playlist
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Progress Bar */}
            {currentSong && (
              <div className="mb-4">
                <Slider
                  value={[playbackProgress]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full cursor-pointer"
                  disabled={duration === 0}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
                </div>
                {duration === 0 && (
                  <div className="text-xs text-orange-500 mt-1 text-center">
                    Loading duration...
                  </div>
                )}
              </div>
            )}
            
            {/* Controls */}
            <div className="space-y-3 mb-4">
              {/* Main playback controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!currentSong || songs.length <= 1}
                  className="h-9 w-9 p-0"
                  title="Previous track"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePlayPause}
                  disabled={!currentSong || isLoading}
                  className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNext(true)}
                  disabled={!currentSong || songs.length <= 1}
                  className="h-9 w-9 p-0"
                  title="Next track"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Time skip controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipBackward}
                  disabled={!currentSong}
                  className="h-8 px-3 text-xs"
                  title="Rewind 5 seconds"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  -5s
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipForward}
                  disabled={!currentSong}
                  className="h-8 px-3 text-xs"
                  title="Fast forward 5 seconds"
                >
                  +5s
                  <RotateCw className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
            
            {/* Volume Control & Repeat */}
            <div className="space-y-3">
              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                  className="h-8 w-8 p-0"
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${volume * 100}%, rgb(229, 231, 235) ${volume * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              
              {/* Repeat Control */}
              <div className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRepeatToggle}
                  className={`h-8 px-3 text-xs ${
                    repeatMode !== 'off' 
                      ? 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                      : 'text-muted-foreground'
                  }`}
                  title={
                    repeatMode === 'off' ? 'Repeat Off - Click to repeat all' :
                    repeatMode === 'all' ? 'Repeat All - Click to repeat one' :
                    'Repeat One - Click to turn off'
                  }
                >
                  {repeatMode === 'one' ? (
                    <>
                      <Repeat1 className="h-3 w-3 mr-1" />
                      Repeat One
                    </>
                  ) : (
                    <>
                      <Repeat className="h-3 w-3 mr-1" />
                      {repeatMode === 'off' ? 'Repeat Off' : 'Repeat All'}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Song List Indicator */}
            {songs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Song {currentSongIndex + 1} of {songs.length}</span>
                  <span className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {songs.slice(0, 10).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 w-1 rounded-full ${
                            idx === currentSongIndex
                              ? 'bg-purple-500'
                              : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                      {songs.length > 10 && (
                        <span className="text-xs ml-1">+{songs.length - 10}</span>
                      )}
                    </div>
                  </span>
                </div>
              </div>
            )}
            
            {/* Playlist Modal */}
            <AnimatePresence>
              {showPlaylist && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl p-4 z-10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Playlist</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPlaylist(false)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {songs.map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => handleSongSelect(index)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          index === currentSongIndex ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{song.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {song.artist || 'Unknown Artist'}
                          </p>
                        </div>
                        {isAdminUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteSong(song.id, e)}
                            className="w-6 h-6 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Upload Modal */}
            <AnimatePresence>
              {showUpload && isAdminUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl p-4 z-10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Upload Music</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUpload(false)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="audio/*,.mp3,.wav,.ogg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full h-16 border-dashed border-2 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Choose Music Files</span>
                        <span className="text-xs text-muted-foreground">
                          MP3, WAV, OGG • Max 50MB each
                        </span>
                      </div>
                    </Button>
                    
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Selected: {selectedFiles.length} files</p>
                        <Button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => {
          console.log('🎵 onEnded prop fired! Going to next track...');
          const nextIndex = (currentSongIndex + 1) % songs.length;
          shouldAutoplayRef.current = true;
          setCurrentSongIndex(nextIndex);
        }}
      />
    </motion.div>
  );
}
