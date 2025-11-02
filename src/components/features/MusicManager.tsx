import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Upload, Play } from 'lucide-react';
import { MusicUpload } from './MusicUpload';
import { SimpleMusicPlayer } from './SimpleMusicPlayer';
import { Song } from '@/services/musicService';

interface MusicManagerProps {
  className?: string;
}

export function MusicManager({ className }: MusicManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = (songs: Song[]) => {
    // Trigger refresh of the music player
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-6 h-6" />
            Music Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="player" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="player" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Music Player
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Music
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="player" className="mt-4">
              <SimpleMusicPlayer refreshTrigger={refreshTrigger} />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-4">
              <MusicUpload onUploadComplete={handleUploadComplete} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}