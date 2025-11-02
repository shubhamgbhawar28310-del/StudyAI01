import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  Loader2,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Song, getAllSongs, deleteSong } from '@/services/musicService';
import { useToast } from '@/hooks/use-toast';

interface SimpleMusicPlayerProps {
  className?: string;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export function SimpleMusicPlayer({ className, refreshTrigger }: SimpleMusicPlayerProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const currentSong = songs[currentSongIndex];

  // Load songs on component mount and when refreshTrigger changes
  useEffect(() => {
    loadSongs();
  }, [refreshTrigger]);

  // Update audio source when song changes
  useEffect(() => {
    if (audioRef.current && currentSong?.public_url) {
      audioRef.current.src = currentSong.public_url;
      audioRef.current.load();
      setCurrentTime(0);
      setIsLoading(true);
    }
  }, [currentSong]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleNext();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleError = () => {
      setIsLoading(false);
      toast({
        title: 'Playback Error',
        description: 'Failed to load audio file',
        variant: 'destructive'
      });
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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
        description: 'Failed to load songs',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !currentSong) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      toast({
        title: 'Playback Error',
        description: 'Failed to play audio',
        variant: 'destructive'
      });
    }
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      // If more than 3 seconds played, restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      // Go to previous track
      const newIndex = currentSongIndex > 0 ? currentSongIndex - 1 : songs.length - 1;
      setCurrentSongIndex(newIndex);
    }
  };

  const handleNext = () => {
    const nextIndex = currentSongIndex < songs.length - 1 ? currentSongIndex + 1 : 0;
    setCurrentSongIndex(nextIndex);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(false);
  };

  const handleDeleteSong = async (songId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this song?')) {
      return;
    }

    try {
      const success = await deleteSong(songId);
      if (success) {
        toast({
          title: 'Song Deleted',
          description: 'Song has been removed successfully'
        });
        await loadSongs();
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete song',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the song',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoadingSongs) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Loading music library...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (songs.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Music Player
            </span>
            <Button variant="ghost" size="sm" onClick={loadSongs}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Music className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No music available</p>
            <p className="text-sm">Upload some music files to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Music Player
          </span>
          <Button variant="ghost" size="sm" onClick={loadSongs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Song Info */}
        {currentSong && (
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{currentSong.title}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {currentSong.artist || 'Unknown Artist'}
              </p>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {formatFileSize(currentSong.file_size)}
            </Badge>
          </div>
        )}

        {/* Progress Bar */}
        {currentSong && (
          <div className="space-y-2">
            <Slider
              value={[duration ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePrevious}
            disabled={!currentSong}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={togglePlay}
            disabled={isLoading || !currentSong}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-1" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNext}
            disabled={!currentSong}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleMute}>
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1 max-w-32"
          />
          
          <span className="text-sm text-muted-foreground min-w-0">
            {Math.round(isMuted ? 0 : volume * 100)}%
          </span>
        </div>

        {/* Song List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Library ({songs.length} songs)</h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {songs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => handleSongSelect(index)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                  index === currentSongIndex && "bg-muted"
                )}
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(song.file_size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteSong(song.id, e)}
                    className="w-6 h-6 p-0 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <audio ref={audioRef} preload="metadata" />
      </CardContent>
    </Card>
  );
}