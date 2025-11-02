import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Music, 
  X, 
  CheckCircle, 
  AlertCircle,
  File,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadMusicFiles, UploadProgress, Song } from '@/services/musicService';
import { useToast } from '@/hooks/use-toast';

interface MusicUploadProps {
  onUploadComplete?: (songs: Song[]) => void;
  className?: string;
}

export function MusicUpload({ onUploadComplete, className }: MusicUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

    if (validFiles.length + selectedFiles.length > 10) {
      toast({
        title: 'Too Many Files',
        description: 'Maximum 10 files allowed at once',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress([]);

    try {
      const uploadedSongs = await uploadMusicFiles(selectedFiles, setUploadProgress);
      
      const successCount = uploadedSongs.length;
      const failCount = selectedFiles.length - successCount;

      if (successCount > 0) {
        toast({
          title: 'Upload Complete',
          description: `${successCount} song${successCount > 1 ? 's' : ''} uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
        
        onUploadComplete?.(uploadedSongs);
        setSelectedFiles([]);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Upload Music
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="space-y-2">
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
            className="w-full h-20 border-dashed border-2 hover:border-blue-500 transition-colors"
            disabled={isUploading}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6" />
              <span>Choose Music Files</span>
              <span className="text-xs text-muted-foreground">
                MP3, WAV, OGG • Max 50MB each • Up to 10 files
              </span>
            </div>
          </Button>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFiles([])}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                  <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && uploadProgress.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Upload Progress</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(progress.status)}
                    <span className="text-sm flex-1 truncate">{progress.fileName}</span>
                    <Badge variant={
                      progress.status === 'completed' ? 'default' :
                      progress.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {progress.status}
                    </Badge>
                  </div>
                  
                  {progress.status !== 'error' && (
                    <Progress value={progress.progress} className="h-1" />
                  )}
                  
                  {progress.error && (
                    <p className="text-xs text-red-500 ml-6">{progress.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
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
        )}
      </CardContent>
    </Card>
  );
}