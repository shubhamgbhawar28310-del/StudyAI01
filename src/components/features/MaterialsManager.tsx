import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { indexedDBStorage, isIndexedDBSupported } from '@/utils/indexedDBStorage'
import { 
  FolderOpen, 
  Plus, 
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
  Link,
  Upload,
  Tag,
  Calendar,
  File,
  AlertCircle,
  RefreshCw,
  Presentation,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react'

// Enhanced Error Boundary Component with better error details
class MaterialsManagerErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { hasError: boolean, error: Error | null, errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('=== MaterialsManagerErrorBoundary caught an error ===')
    console.error('Error object:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('=== MaterialsManagerErrorBoundary error details ===')
    console.error('Error:', error)
    console.error('ErrorInfo:', errorInfo)
    console.error('Component stack:', errorInfo.componentStack)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      console.log('=== Rendering Error Boundary UI ===')
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Materials Manager Error</h3>
              <p className="text-red-700 text-sm">Something went wrong with the materials upload</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg mb-4 max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-500 mb-2">
                <strong>Error Stack:</strong> {this.state.error.stack}
              </p>
            )}
            {this.state.errorInfo && (
              <p className="text-xs text-gray-500 whitespace-pre-wrap">
                <strong>Component Stack:</strong> {this.state.errorInfo.componentStack}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={() => {
                console.log('Refresh button clicked')
                window.location.reload()
              }} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Try Again button clicked')
                this.setState({ hasError: false, error: null, errorInfo: null })
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface MaterialsManagerProps {
  showHeader?: boolean
  maxMaterials?: number
  showFilters?: boolean
  compactMode?: boolean
  onMaterialSelect?: (materialId: string) => void
}

function MaterialsManagerContent({ 
  showHeader = true, 
  maxMaterials, 
  showFilters = true, 
  compactMode = false,
  onMaterialSelect 
}: MaterialsManagerProps) {
  const { 
    state, 
    addMaterial,
    updateMaterial,
    deleteMaterial
  } = useStudyPlanner()
  
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Cache for file URLs to prevent reloading
  const [fileUrlCache, setFileUrlCache] = useState<Map<string, string>>(new Map())

  // Log when component mounts
  useEffect(() => {
    console.log('MaterialsManagerContent mounted')
    console.log('StudyPlanner context state:', {
      hasAddMaterial: !!addMaterial,
      materialsCount: state.materials.length
    })
  }, [])

  const filteredMaterials = state.materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (material.tags && material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    
    const matchesFilter = filter === 'all' || material.type === filter
    
    return matchesSearch && matchesFilter
  }).slice(0, maxMaterials)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />
      case 'image': return <ImageIcon className="h-4 w-4 text-blue-500" />
      case 'document': return <File className="h-4 w-4 text-green-500" />
      case 'presentation': return <Presentation className="h-4 w-4 text-orange-500" />
      case 'note': return <FileText className="h-4 w-4 text-yellow-500" />
      case 'link': return <Link className="h-4 w-4 text-purple-500" />
      default: return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800'
      case 'image': return 'bg-blue-100 text-blue-800'
      case 'document': return 'bg-green-100 text-green-800'
      case 'presentation': return 'bg-orange-100 text-orange-800'
      case 'note': return 'bg-yellow-100 text-yellow-800'
      case 'link': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== DEBUG: MaterialsManager File Upload Started ===')
    console.log('Event object:', event)
    
    // Prevent default behavior
    event.preventDefault()
    
    // Clear previous errors
    setUploadError(null)
    
    try {
      console.log('Checking if addMaterial function is available...')
      // Check if context functions are available
      if (!addMaterial) {
        const errorMsg = 'MaterialsManager: addMaterial function is not available'
        console.error(errorMsg)
        setUploadError('There was an issue with the upload system. Please refresh the page and try again.')
        return
      }
      console.log('addMaterial function is available')
      
      // Check if files were selected
      if (!event.target.files || event.target.files.length === 0) {
        console.log('MaterialsManager: No files selected or dialog cancelled')
        setUploadError('No files were selected. Please try again.')
        return
      }
      
      const files = Array.from(event.target.files)
      console.log('MaterialsManager: Files selected:', files.length)
      
      // Check if too many files are being uploaded at once
      if (files.length > 10) {
        console.log('MaterialsManager: Too many files selected')
        setUploadError('Please upload 10 files or fewer at a time.')
        return
      }
      
      // Set processing state to prevent multiple uploads
      console.log('Setting processing state to true')
      setIsProcessing(true)
      
      // Process files with better error handling
      console.log(`Starting to process ${files.length} files`)
      let successCount = 0
      let errorCount = 0
      
      // Process files with Promise.allSettled to handle all files even if some fail
      const processPromises = files.map((file, index) => 
        processSingleFile(file, index).then(() => {
          successCount++
          console.log(`Successfully processed file ${index + 1}`)
        }).catch((error) => {
          errorCount++
          console.error(`Error processing file ${index + 1} (${file.name}):`, error)
          // Don't throw error to prevent Promise.allSettled from failing
          return Promise.resolve(); // Resolve instead of reject to continue processing
        })
      )
      
      try {
        // Wait for all files to be processed
        await Promise.allSettled(processPromises)
        
        if (errorCount > 0 && successCount > 0) {
          setUploadError(`Partially completed: ${successCount} files uploaded successfully, ${errorCount} files failed.`)
        } else if (errorCount > 0) {
          setUploadError(`Failed to upload ${errorCount} files. Check console for details.`)
        } else if (successCount > 0) {
          setUploadError(`${successCount} files uploaded successfully!`)
        }
      } catch (batchError) {
        console.error('Batch processing error:', batchError)
        setUploadError(`Error during batch processing. ${successCount} files uploaded, ${errorCount} failed.`)
      }
      
      console.log('MaterialsManager: All files processed')
    } catch (error) {
      console.error('MaterialsManager: Unexpected error in handleFileUpload:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setUploadError(`An unexpected error occurred during file upload: ${errorMessage}`)
    } finally {
      console.log('Upload process completed, cleaning up...')
      // Reset processing state
      setIsProcessing(false)
      // Reset the file input value to allow uploading the same file again
      if (fileInputRef.current) {
        console.log('Resetting file input value')
        fileInputRef.current.value = ''
      }
      console.log('=== DEBUG: MaterialsManager File Upload Completed ===')
    }
  }

  const processSingleFile = (file: File, index: number): Promise<void> => {
    console.log(`processSingleFile called for file ${index}:`, file.name)
    return new Promise((resolve, reject) => {
      console.log(`Creating FileReader for file ${index}`)
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          console.log(`FileReader onload event fired for file ${index}`);
          const content = e.target?.result as string | ArrayBuffer;
          console.log(`Raw content type for file ${index}:`, typeof content);
          
          // Check if content exists
          if (!content) {
            console.error(`No content loaded for file ${index}: ${file.name}`);
            reject(new Error(`No content loaded for file ${file.name}`));
            return;
          }
          
          // Extract base64 content for all file types
          let base64Content = '';
          
          // Handle different content types
          if (content instanceof ArrayBuffer) {
            // Convert ArrayBuffer to base64 for binary files
            try {
              const bytes = new Uint8Array(content);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              base64Content = btoa(binary);
              console.log(`Converted ArrayBuffer to base64 for file ${index}, length:`, base64Content.length);
            } catch (conversionError) {
              console.error(`Error converting ArrayBuffer to base64 for file ${index}:`, conversionError);
              // If conversion fails, we'll try to continue with empty content
              base64Content = '';
            }
          } else if (typeof content === 'string' && content.startsWith('data:')) {
            // Extract base64 from data URL
            base64Content = content.split(',')[1] || '';
            console.log(`Extracted base64 content length for file ${index}:`, base64Content.length);
            
            // Special handling for PDF files - ensure proper extraction
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
              console.log(`Special handling for PDF file ${index}`);
              try {
                // Validate the extracted content
                if (base64Content && base64Content.length > 0) {
                  // Try to decode to verify it's valid base64
                  const decoded = atob(base64Content);
                  console.log(`PDF decoded successfully, length: ${decoded.length}`);
                  
                  // For PDFs, we want to keep the original data URL format for viewing
                  // So we'll store the entire data URL for PDFs
                  base64Content = content.split(',')[1] || '';
                  console.log(`PDF base64 content preserved for viewing`);
                }
              } catch (decodeError) {
                console.error(`Error validating PDF content for file ${index}:`, decodeError);
                // If validation fails, log but continue with extracted content
              }
            }
          } else if (typeof content === 'string') {
            // For text files, convert to base64
            try {
              base64Content = btoa(content);
              console.log(`Converted text content to base64 for file ${index}, length:`, base64Content.length);
            } catch (btoaError) {
              console.error(`Error converting text content to base64 for file ${index}:`, btoaError);
              // If btoa fails, try with encodeURIComponent
              try {
                base64Content = btoa(encodeURIComponent(content));
                console.log(`Converted text content to base64 with encodeURIComponent for file ${index}, length:`, base64Content.length);
              } catch (encodeURIComponentError) {
                console.error(`Error converting text content with encodeURIComponent for file ${index}:`, encodeURIComponentError);
                // For binary files, we'll store a placeholder instead of crashing
                base64Content = ''; // Empty content for binary files
                console.log(`Using empty content for binary file ${index}`);
              }
            }
          }
          
          // Determine file type based on MIME type and file extension
          let fileType: 'note' | 'pdf' | 'image' | 'document' | 'presentation' | 'link' | 'other' = 'other';
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
          console.log(`File extension for file ${index}: ${fileExtension}`);
          console.log(`File MIME type for file ${index}: ${file.type}`);
          
          // More robust file type detection with priority order
          if (file.type.startsWith('image/')) {
            fileType = 'image';
            console.log(`Detected as image for file ${index}`);
          } else if (file.type === 'application/pdf' || file.type.includes('pdf') || fileExtension === 'pdf') {
            fileType = 'pdf';
            console.log(`Detected as PDF for file ${index}`);
          } else if (file.type.includes('presentation') || file.type.includes('powerpoint') ||
                    file.type === 'application/vnd.ms-powerpoint' ||
                    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                    fileExtension === 'ppt' || fileExtension === 'pptx') {
            fileType = 'presentation';
            console.log(`Detected as presentation (PowerPoint) for file ${index}`);
          } else if (file.type.includes('word') || file.type.includes('document') || 
                    file.type === 'application/msword' ||
                    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    fileExtension === 'doc' || fileExtension === 'docx') {
            fileType = 'document';
            console.log(`Detected as document (Word) for file ${index}`);
          } else if (file.type.includes('spreadsheet') || file.type.includes('excel') ||
                    file.type === 'application/vnd.ms-excel' ||
                    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    fileExtension === 'xls' || fileExtension === 'xlsx') {
            fileType = 'document';
            console.log(`Detected as document (Excel) for file ${index}`);
          } else if (file.type.startsWith('text/') || fileExtension === 'txt' || fileExtension === 'md') {
            fileType = 'note';
            console.log(`Detected as note for file ${index}`);
          }
          
          // Additional fallback for common file types
          if (fileType === 'other') {
            if (fileExtension === 'pdf') {
              fileType = 'pdf';
              console.log(`Fallback: Detected as PDF for file ${index}`);
            } else if (['ppt', 'pptx'].includes(fileExtension)) {
              fileType = 'presentation';
              console.log(`Fallback: Detected as presentation for file ${index}`);
            } else if (['doc', 'docx', 'xls', 'xlsx'].includes(fileExtension)) {
              fileType = 'document';
              console.log(`Fallback: Detected as document for file ${index}`);
            } else if (['txt', 'md'].includes(fileExtension)) {
              fileType = 'note';
              console.log(`Fallback: Detected as note for file ${index}`);
            } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
              fileType = 'image';
              console.log(`Fallback: Detected as image for file ${index}`);
            }
          }
          
          console.log(`Final file type for file ${index} (${file.name}):`, fileType);
          
          // Validate that we have content for files that require it
          // For PDFs and images, allow upload even with empty content (will be handled in viewing)
          // For other file types, require content
          if (!base64Content) {
            const errorMsg = `MaterialsManager: No content extracted for file ${file.name} (type: ${fileType})`;
            console.error(errorMsg);
            console.error(`Content length: ${base64Content?.length || 0}`);
            
            // Allow PDFs, images, and presentations to proceed even without content
            // They might have content extraction issues but can still be stored
            if (fileType === 'pdf' || fileType === 'image' || fileType === 'presentation') {
              console.warn(`Warning: ${fileType} file ${file.name} has no content, but continuing with upload...`);
            } else if (fileType !== 'other') {
              // For documents and notes, content is required
              reject(new Error(`No content extracted for file ${file.name}`));
              return;
            }
          }
          
          // Check file size limit (100MB for upload, but warn about storage)
          if (file.size > 100 * 1024 * 1024) {
            console.error(`File too large: ${file.name} (${file.size} bytes)`);
            reject(new Error(`File ${file.name} is too large. Maximum size is 100MB.`));
            return;
          }
          
          // Warn about localStorage limitations for files over 3MB
          // localStorage typically has 5-10MB limit, and base64 encoding increases size by ~33%
          const fileSizeMB = file.size / (1024 * 1024);
          if (fileSizeMB > 3) {
            console.warn(`Warning: File ${file.name} is ${fileSizeMB.toFixed(2)}MB. Files over 3MB may not store content due to browser storage limits.`);
          }
          
          console.log(`Attempting to add material for file ${index}:`, {
            title: file.name,
            type: fileType,
            fileSize: file.size
          });
          
          try {
            console.log(`Calling addMaterial for file ${index}`);
            console.log(`Content available: ${!!base64Content}, Length: ${base64Content?.length || 0}`);
            
            const contentSize = base64Content ? base64Content.length : 0;
            const estimatedSizeMB = (contentSize * 0.75) / (1024 * 1024); // base64 is ~33% larger
            console.log(`Estimated file size in storage: ${estimatedSizeMB.toFixed(2)}MB`);
            
            // Create material with metadata first
            const materialId = addMaterial({
              title: file.name,
              description: `Uploaded on ${new Date().toLocaleDateString()}`,
              type: fileType,
              fileName: file.name,
              fileSize: file.size,
              content: '', // Don't store content in localStorage anymore
              tags: ['uploaded']
            });
            
            console.log(`Material metadata added with ID: ${materialId}`);
            
            // Store file content in IndexedDB if available and content exists
            if (base64Content && isIndexedDBSupported()) {
              try {
                await indexedDBStorage.setItem(materialId, base64Content);
                console.log(`File content stored in IndexedDB for material ${materialId}, size: ${estimatedSizeMB.toFixed(2)}MB`);
              } catch (dbError) {
                console.error(`Failed to store content in IndexedDB for ${file.name}:`, dbError);
                // Material metadata is already saved, so we don't reject
                console.warn(`Content for ${file.name} could not be stored, but metadata is saved.`);
              }
            } else if (base64Content) {
              console.warn(`IndexedDB not supported. Content for ${file.name} will not be stored.`);
            }
            
            resolve();
          } catch (error) {
            console.error(`Error adding material for file ${index}:`, error);
            reject(new Error(`Error uploading file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        } catch (error) {
          console.error(`Error processing file ${index}:`, error);
          reject(new Error(`Error processing file ${file.name}`));
        }
      };
      
      reader.onerror = (error) => {
        console.error(`Error reading file ${index} (${file.name}):`, error);
        reject(new Error(`Error reading file ${file.name}`));
      };
      
      // For binary files that might cause issues, we'll try to read as array buffer first
      const isBinaryFile = file.type.includes('word') || file.type.includes('presentation') || 
                          file.type.includes('excel') ||
                          file.name.endsWith('.doc') || file.name.endsWith('.docx') ||
                          file.name.endsWith('.ppt') || file.name.endsWith('.pptx') ||
                          file.name.endsWith('.xls') || file.name.endsWith('.xlsx');
      
      // Images and PDFs should be read as data URLs
      const isImageFile = file.type.startsWith('image/') || 
                         ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(file.name.split('.').pop()?.toLowerCase() || '');
      
      const isPdfFile = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      
      if (isBinaryFile) {
        console.log(`Reading binary file ${index} as ArrayBuffer`);
        reader.readAsArrayBuffer(file);
      } else {
        // Read all other files (including images and PDFs) as data URL to properly handle them
        console.log(`Reading file ${index} as data URL`);
        reader.readAsDataURL(file);
      }
    })
  }

  const handleViewMaterial = async (materialId: string) => {
    console.log('=== handleViewMaterial called ===');
    console.log('Material ID:', materialId);
    
    const material = state.materials.find(m => m.id === materialId)
    if (material) {
      console.log('Material found:', material.title, 'Type:', material.type);
      
      try {
        // Check if we have cached URL
        let blobUrl: string;
        
        if (fileUrlCache.has(materialId)) {
          console.log('Using cached URL for material:', materialId);
          blobUrl = fileUrlCache.get(materialId)!;
        } else {
          // Try to get content from IndexedDB first
          let content = material.content;
          console.log('Initial content length:', content?.length || 0);
          
          if (!content && isIndexedDBSupported()) {
            console.log(`Retrieving content from IndexedDB for material ${materialId}`);
            content = await indexedDBStorage.getItem(materialId) || '';
            console.log('Content retrieved from IndexedDB, length:', content?.length || 0);
          }
          
          if (!content) {
            console.error('No content available for material:', material.title);
            setUploadError(`No content available for ${material.title}. The file may not have been stored properly.`);
            setTimeout(() => setUploadError(null), 5000);
            return;
          }
          
          console.log('Content available, creating blob URL. Type:', material.type);
          
          // Create blob URL from content
          const mimeType = getMimeTypeFromFileName(material.fileName || material.title);
          const byteString = atob(content);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeType });
          blobUrl = URL.createObjectURL(blob);
          
          console.log('Blob URL created:', blobUrl);
          
          // Cache the URL
          setFileUrlCache(prev => new Map(prev).set(materialId, blobUrl));
        }
        
        // Open file in new tab with browser's built-in viewer
        const newWindow = window.open(blobUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log('Popup blocked, showing error');
          setUploadError('Popup blocked. Please allow popups for this site to preview files.');
          setTimeout(() => setUploadError(null), 5000);
        } else {
          console.log('File opened in new tab successfully');
        }
        
      } catch (error) {
        console.error('Error preparing file for preview:', error);
        setUploadError(`Preview not available — please download to view this file.`);
        setTimeout(() => setUploadError(null), 5000);
      }
    }
  }
  
  // Keep old implementation for fallback (images and text files)
  const handleViewMaterialOld = async (materialId: string) => {
    console.log('=== handleViewMaterialOld called ===');
    console.log('Material ID:', materialId);
    
    const material = state.materials.find(m => m.id === materialId)
    if (material) {
      console.log('Material found:', material.title, 'Type:', material.type);
      try {
        // Try to get content from IndexedDB first
        let content = material.content;
        console.log('Initial content length:', content?.length || 0);
        
        if (!content && isIndexedDBSupported()) {
          console.log(`Retrieving content from IndexedDB for material ${materialId}`);
          content = await indexedDBStorage.getItem(materialId) || '';
          console.log('Content retrieved from IndexedDB, length:', content?.length || 0);
        }
        
        if (!content) {
          console.error('No content available for material:', material.title);
          alert(`No content available for ${material.title}. The file may not have been stored properly.`);
          return;
        }
        
        console.log('Content available, proceeding with view. Type:', material.type);
        
        // Update material object with retrieved content for processing
        const materialWithContent = { ...material, content };
        
        // Handle different file types appropriately
        if (materialWithContent.type === 'image') {
          // For images, reconstruct the data URL
          const mimeType = getMimeTypeFromFileName(materialWithContent.fileName || materialWithContent.title)
          const dataUrl = `data:${mimeType};base64,${content}`
          const newWindow = window.open('', '_blank')
          if (newWindow) {
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${material.title}</title>
                  <style>
                    body { 
                      margin: 0; 
                      padding: 20px; 
                      text-align: center; 
                      background: #f5f5f5; 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    }
                    img { 
                      max-width: 100%; 
                      height: auto; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                      border-radius: 4px; 
                      background: white;
                      padding: 10px;
                    }
                    .container { 
                      max-width: 1200px; 
                      margin: 0 auto; 
                      background: white;
                      border-radius: 8px;
                      padding: 20px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header { 
                      margin-bottom: 20px; 
                      text-align: left;
                    }
                    .header h1 {
                      margin: 0 0 5px 0;
                      font-size: 1.5em;
                      color: #333;
                    }
                    .header p {
                      margin: 0;
                      color: #666;
                    }
                    .error {
                      color: #e74c3c;
                      background: #fdf2f2;
                      padding: 15px;
                      border-radius: 4px;
                      margin: 20px 0;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>${material.title}</h1>
                      ${material.description ? `<p><em>${material.description}</em></p>` : ''}
                      <p><small>File size: ${material.fileSize ? formatFileSize(material.fileSize) : 'Unknown'}</small></p>
                    </div>
                    <img src="${dataUrl}" alt="${material.title}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=error>Error loading image. The file may be corrupted or in an unsupported format.</div>'" />
                  </div>
                </body>
              </html>
            `)
            newWindow.document.close()
          } else {
            // If popup is blocked, show download option
            alert('Popup blocked. Showing download option instead.')
            handleDownloadMaterial(materialId)
          }
        }
        // Handle PDF files
        else if (materialWithContent.type === 'pdf') {
          try {
            console.log('Viewing PDF file:', materialWithContent.title);
            console.log('Content length:', content.length);
            console.log('Content starts with:', content.substring(0, 50));
            
            // Create blob from base64 content
            const byteString = atob(content);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            
            console.log('PDF Blob URL created:', blobUrl);
            
            // Open PDF in new window with embedded viewer
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>${materialWithContent.title}</title>
                    <style>
                      body {
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                      }
                      .header {
                        background: #1a73e8;
                        color: white;
                        padding: 12px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      }
                      .header h1 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 500;
                      }
                      .download-btn {
                        background: white;
                        color: #1a73e8;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                      }
                      .download-btn:hover {
                        background: #f0f0f0;
                      }
                      iframe {
                        width: 100%;
                        height: calc(100vh - 50px);
                        border: none;
                      }
                      .loading {
                        text-align: center;
                        padding: 40px;
                        color: #666;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>${materialWithContent.title}</h1>
                      <button class="download-btn" onclick="downloadPDF()">Download PDF</button>
                    </div>
                    <div class="loading">Loading PDF...</div>
                    <iframe id="pdfFrame" src="${blobUrl}" style="display:none;"></iframe>
                    <script>
                      const iframe = document.getElementById('pdfFrame');
                      const loading = document.querySelector('.loading');
                      
                      iframe.onload = function() {
                        loading.style.display = 'none';
                        iframe.style.display = 'block';
                        console.log('PDF loaded successfully');
                      };
                      
                      iframe.onerror = function() {
                        loading.innerHTML = '<p style="color: #e74c3c;">Error loading PDF. <button onclick="downloadPDF()" style="margin-left: 10px; padding: 8px 16px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;">Download Instead</button></p>';
                        console.error('Error loading PDF in iframe');
                      };
                      
                      // Show iframe after a short delay if onload doesn't fire
                      setTimeout(function() {
                        if (loading.style.display !== 'none') {
                          loading.style.display = 'none';
                          iframe.style.display = 'block';
                        }
                      }, 1000);
                      
                      function downloadPDF() {
                        const a = document.createElement('a');
                        a.href = '${blobUrl}';
                        a.download = '${materialWithContent.fileName || materialWithContent.title}';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    </script>
                  </body>
                </html>
              `);
              newWindow.document.close();
              console.log('PDF viewer window created');
            } else {
              console.log('Popup blocked, triggering download');
              // Pop-up blocked, trigger download
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = materialWithContent.fileName || materialWithContent.title;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }
          } catch (error) {
            console.error('Error viewing PDF:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            // If we can't create a blob, show error and offer download
            alert(`Error opening PDF file. You can download it instead. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            handleDownloadMaterial(materialId);
          }
        }
        // Handle document and presentation files (DOC, DOCX, PPT, PPTX, etc.)
        else if (materialWithContent.type === 'document' || materialWithContent.type === 'presentation') {
          // For document files, create blob with proper MIME type
          const mimeType = getMimeTypeFromFileName(materialWithContent.fileName || materialWithContent.title);
          const byteString = atob(content);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          
          console.log('Document/Presentation type:', materialWithContent.type);
          console.log('MIME type:', mimeType);
          console.log('Blob URL created:', blobUrl);
          
          // Create a better preview window with embedded viewer
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            const fileExtension = (materialWithContent.fileName || materialWithContent.title).split('.').pop()?.toLowerCase();
            const isPowerPoint = fileExtension === 'ppt' || fileExtension === 'pptx';
            const isWord = fileExtension === 'doc' || fileExtension === 'docx';
            const isExcel = fileExtension === 'xls' || fileExtension === 'xlsx';
            
            let iconEmoji = '📄';
            let fileTypeLabel = 'Document';
            if (isPowerPoint) {
              iconEmoji = '📊';
              fileTypeLabel = 'PowerPoint Presentation';
            } else if (isWord) {
              iconEmoji = '📝';
              fileTypeLabel = 'Word Document';
            } else if (isExcel) {
              iconEmoji = '📈';
              fileTypeLabel = 'Excel Spreadsheet';
            }
            
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${materialWithContent.title}</title>
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                      background: #f5f5f5;
                    }
                    .header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 20px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header h1 {
                      margin: 0 0 5px 0;
                      font-size: 24px;
                      font-weight: 600;
                    }
                    .header p {
                      margin: 0;
                      opacity: 0.9;
                      font-size: 14px;
                    }
                    .container {
                      max-width: 900px;
                      margin: 40px auto;
                      background: white;
                      border-radius: 12px;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                      overflow: hidden;
                    }
                    .content {
                      padding: 40px;
                      text-align: center;
                    }
                    .icon {
                      font-size: 80px;
                      margin-bottom: 20px;
                    }
                    .message {
                      font-size: 18px;
                      color: #333;
                      margin-bottom: 30px;
                      line-height: 1.6;
                    }
                    .buttons {
                      display: flex;
                      gap: 15px;
                      justify-content: center;
                      flex-wrap: wrap;
                    }
                    .btn {
                      padding: 14px 28px;
                      border: none;
                      border-radius: 8px;
                      font-size: 16px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      text-decoration: none;
                      display: inline-flex;
                      align-items: center;
                      gap: 8px;
                    }
                    .btn-primary {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    }
                    .btn-primary:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                    }
                    .btn-secondary {
                      background: white;
                      color: #667eea;
                      border: 2px solid #667eea;
                    }
                    .btn-secondary:hover {
                      background: #f8f9ff;
                      transform: translateY(-2px);
                    }
                    .info-box {
                      background: #f8f9ff;
                      border-left: 4px solid #667eea;
                      padding: 20px;
                      margin: 30px 0;
                      text-align: left;
                      border-radius: 8px;
                    }
                    .info-box h3 {
                      margin: 0 0 10px 0;
                      color: #667eea;
                      font-size: 16px;
                    }
                    .info-box ul {
                      margin: 10px 0;
                      padding-left: 20px;
                    }
                    .info-box li {
                      margin: 8px 0;
                      color: #555;
                    }
                    .loading {
                      display: none;
                      text-align: center;
                      padding: 20px;
                      color: #667eea;
                    }
                    .spinner {
                      border: 3px solid #f3f3f3;
                      border-top: 3px solid #667eea;
                      border-radius: 50%;
                      width: 40px;
                      height: 40px;
                      animation: spin 1s linear infinite;
                      margin: 0 auto 10px;
                    }
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>${iconEmoji} ${materialWithContent.title}</h1>
                    <p>${fileTypeLabel} • ${materialWithContent.fileSize ? formatFileSize(materialWithContent.fileSize) : 'Unknown size'}</p>
                  </div>
                  
                  <div class="container">
                    <div class="content">
                      <div class="icon">${iconEmoji}</div>
                      <div class="message">
                        <strong>Your ${fileTypeLabel.toLowerCase()} is ready!</strong><br>
                        Download it to view with ${isPowerPoint ? 'PowerPoint, Google Slides, or any presentation app' : isWord ? 'Word, Google Docs, or any document editor' : 'Excel, Google Sheets, or any spreadsheet app'}.
                      </div>
                      
                      <div class="loading" id="loading">
                        <div class="spinner"></div>
                        <p>Preparing download...</p>
                      </div>
                      
                      <div class="buttons" id="buttons">
                        <button class="btn btn-primary" onclick="downloadFile()">
                          ⬇️ Download ${fileTypeLabel}
                        </button>
                        <button class="btn btn-secondary" onclick="window.close()">
                          ✕ Close
                        </button>
                      </div>
                      
                      <div class="info-box">
                        <h3>💡 How to View This File</h3>
                        <ul>
                          <li><strong>Download</strong> the file using the button above</li>
                          <li><strong>Open</strong> with ${isPowerPoint ? 'Microsoft PowerPoint, Google Slides, LibreOffice Impress' : isWord ? 'Microsoft Word, Google Docs, LibreOffice Writer' : 'Microsoft Excel, Google Sheets, LibreOffice Calc'}</li>
                          <li><strong>Or</strong> upload to Google Drive for online viewing</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <script>
                    function downloadFile() {
                      const loading = document.getElementById('loading');
                      const buttons = document.getElementById('buttons');
                      
                      loading.style.display = 'block';
                      buttons.style.display = 'none';
                      
                      const a = document.createElement('a');
                      a.href = '${blobUrl}';
                      a.download = '${materialWithContent.fileName || materialWithContent.title}';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      
                      setTimeout(function() {
                        loading.style.display = 'none';
                        buttons.style.display = 'flex';
                        alert('Download started! Check your downloads folder.');
                      }, 1000);
                    }
                    
                    // Auto-download after 2 seconds
                    setTimeout(function() {
                      downloadFile();
                    }, 2000);
                  </script>
                </body>
              </html>
            `);
            newWindow.document.close();
            console.log('Document preview window created');
          } else {
            console.log('Popup blocked, triggering direct download');
            // Popup blocked, trigger download directly
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = materialWithContent.fileName || materialWithContent.title;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          }
        }
        // Handle text files
        else {
          // For text files, decode base64 content
          let textContent = content;
          try {
            // Try to decode if it's base64
            textContent = atob(content);
          } catch (e) {
            // If decoding fails, use content as-is
            console.log('Content is not base64, using as-is');
          }
          
          const newWindow = window.open('', '_blank')
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${materialWithContent.title}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    pre { white-space: pre-wrap; word-wrap: break-word; background: #f8f8f8; padding: 15px; border-radius: 4px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>${materialWithContent.title}</h1>
                    ${materialWithContent.description ? `<p><em>${materialWithContent.description}</em></p>` : ''}
                    <pre>${textContent}</pre>
                  </div>
                </body>
              </html>
            `)
            newWindow.document.close()
          }
        }
      } catch (error) {
        console.error('Error viewing material:', error)
        alert(`Error opening file: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`)
      }
    }
  }

  const handleDownloadMaterial = async (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (material) {
      try {
        // Try to get content from IndexedDB first
        let content = material.content;
        if (!content && isIndexedDBSupported()) {
          console.log(`Retrieving content from IndexedDB for download ${materialId}`);
          content = await indexedDBStorage.getItem(materialId) || '';
        }
        
        if (!content) {
          alert(`No content available for ${material.title}. Cannot download.`);
          return;
        }
        
        // Determine MIME type based on file extension
        const mimeType = getMimeTypeFromFileName(material.fileName || material.title)
        
        let blob: Blob
        
        // Handle different file types
        if (material.type === 'image' || material.type === 'pdf' || material.type === 'document' || material.type === 'presentation') {
          // For binary files, reconstruct from base64
          const byteString = atob(content)
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
          }
          blob = new Blob([ab], { type: mimeType })
        } else {
          // For text files
          blob = new Blob([content], { type: mimeType })
        }
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = material.fileName || material.title
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading material:', error)
        alert('Error downloading file. Please try again.')
      }
    } else if (material) {
      // Material exists but has no content
      alert(`Cannot download ${material.title} - file content is not available.`);
    }
  }

  // Helper function to get MIME type based on file extension
  const getMimeTypeFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'bmp':
        return 'image/bmp'
      case 'webp':
        return 'image/webp'
      case 'svg':
        return 'image/svg+xml'
      case 'pdf':
        return 'application/pdf'
      case 'doc':
        return 'application/msword'
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      case 'ppt':
        return 'application/vnd.ms-powerpoint'
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      case 'xls':
        return 'application/vnd.ms-excel'
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case 'txt':
        return 'text/plain'
      case 'md':
        return 'text/markdown'
      default:
        // For unknown file types, try to infer from the extension pattern
        if (extension.endsWith('docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        if (extension.endsWith('pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        if (extension.endsWith('xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        if (extension.endsWith('doc')) return 'application/msword'
        if (extension.endsWith('ppt')) return 'application/vnd.ms-powerpoint'
        if (extension.endsWith('xls')) return 'application/vnd.ms-excel'
        // Image fallbacks
        if (extension.endsWith('jpg') || extension.endsWith('jpeg')) return 'image/jpeg'
        if (extension.endsWith('png')) return 'image/png'
        if (extension.endsWith('gif')) return 'image/gif'
        if (extension.endsWith('bmp')) return 'image/bmp'
        if (extension.endsWith('webp')) return 'image/webp'
        if (extension.endsWith('svg')) return 'image/svg+xml'
        return 'application/octet-stream'
    }
  }

  // Helper function to get file extension based on type (for fallback)
  const getFileExtension = (type: string): string => {
    switch (type) {
      case 'image': return 'jpg'
      case 'pdf': return 'pdf'
      case 'document': return 'docx'
      case 'note': return 'txt'
      default: return 'txt'
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const materialTypes = [...new Set(state.materials.map(m => m.type))]

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Materials</h2>
            <p className="text-muted-foreground">Manage your study materials</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                // Test the context functions
                console.log('MaterialsManager: Testing context functions...')
                if (addMaterial) {
                  try {
                    const testId = addMaterial({
                      title: 'Test Material',
                      description: 'Test upload',
                      type: 'note',
                      content: 'Test content',
                      tags: ['test']
                    })
                    console.log('MaterialsManager: Test material added with ID:', testId)
                    // Immediately delete the test material
                    if (deleteMaterial && testId) {
                      deleteMaterial(testId)
                      console.log('MaterialsManager: Test material deleted')
                    }
                  } catch (error) {
                    console.error('MaterialsManager: Context test failed:', error)
                    setUploadError('Context test failed. Please refresh the page.')
                  }
                } else {
                  console.error('MaterialsManager: addMaterial function not available for testing')
                  setUploadError('Upload function not available. Please refresh the page.')
                }
              }}
              variant="outline"
              className="mr-2"
              disabled={isProcessing}
            >
              Test Context
            </Button>
            <Button 
              onClick={() => {
                console.log('MaterialsManager: Upload button clicked')
                if (fileInputRef.current) {
                  console.log('MaterialsManager: Triggering file input click')
                  fileInputRef.current.click()
                } else {
                  // Fallback: try to find the input by ID
                  const fileInput = document.getElementById('material-file-upload') as HTMLInputElement
                  if (fileInput) {
                    console.log('MaterialsManager: Found file input by ID, triggering click')
                    fileInput.click()
                  } else {
                    console.error('MaterialsManager: Unable to trigger file upload')
                    setUploadError('Unable to trigger file upload. Please try refreshing the page.')
                  }
                }
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 transition-transform"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.ppt,.pptx,.xls,.xlsx"
        onChange={handleFileUpload}
        className="hidden"
        style={{ display: 'none' }}
        id="material-file-upload"
      />

      {!compactMode && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Materials</p>
                  <p className="text-2xl font-bold">{state.materials.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {materialTypes.slice(0, 3).map(type => (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {getTypeIcon(type)}
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{type}s</p>
                    <p className="text-2xl font-bold">
                      {state.materials.filter(m => m.type === type).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({state.materials.length})
            </Button>
            {materialTypes.map(type => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
                className="capitalize"
              >
                {type} ({state.materials.filter(m => m.type === type).length})
              </Button>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {compactMode ? 'Recent Materials' : `Your Materials (${filteredMaterials.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No materials found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search' : 'Upload your first material to get started'}
              </p>
              {!maxMaterials && (
                <Button 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                    } else {
                      // Fallback: try to find the input by ID
                      const fileInput = document.getElementById('material-file-upload') as HTMLInputElement
                      if (fileInput) {
                        fileInput.click()
                      } else {
                        setUploadError('Unable to trigger file upload. Please try refreshing the page.')
                      }
                    }
                  }}
                  className="mt-4"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Material
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredMaterials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg transition-all cursor-pointer hover:bg-muted/30"
                    onClick={() => onMaterialSelect?.(material.id)}
                  >
                    <div className="flex items-start gap-4 p-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(material.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{material.title}</h4>
                          <Badge className={getTypeBadgeColor(material.type)}>
                            {material.type}
                          </Badge>
                        </div>
                        
                        {material.description && !compactMode && (
                          <p className="text-sm text-muted-foreground">
                            {material.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {material.fileSize && (
                            <span>Size: {formatFileSize(material.fileSize)}</span>
                          )}
                          {material.subject && (
                            <span>Subject: {material.subject}</span>
                          )}
                          {material.taskIds && material.taskIds.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3 inline" />
                              Linked to {material.taskIds.length} task{material.taskIds.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(material.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {material.taskIds && material.taskIds.length > 0 && !compactMode && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {material.taskIds.slice(0, 3).map(taskId => {
                              const task = state.tasks.find(t => t.id === taskId)
                              return task ? (
                                <Badge key={taskId} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  📋 {task.title}
                                </Badge>
                              ) : null
                            })}
                            {material.taskIds.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{material.taskIds.length - 3} more tasks
                              </span>
                            )}
                          </div>
                        )}

                        {material.tags && material.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {material.tags.slice(0, compactMode ? 3 : 5).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {material.tags.length > (compactMode ? 3 : 5) && (
                              <span className="text-xs text-muted-foreground">
                                +{material.tags.length - (compactMode ? 3 : 5)} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Show view/download buttons if material has content OR fileSize (content might be in IndexedDB) */}
                        {(material.content || material.fileSize) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMaterial(material.id)}
                            className="h-8 w-8 p-0"
                            title="View Material"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {(material.content || material.fileSize) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadMaterial(material.id)}
                            className="h-8 w-8 p-0"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            // Delete from IndexedDB first if content exists there
                            if (isIndexedDBSupported()) {
                              try {
                                await indexedDBStorage.removeItem(material.id);
                                console.log(`Deleted content from IndexedDB for material ${material.id}`);
                              } catch (error) {
                                console.error(`Failed to delete from IndexedDB:`, error);
                              }
                            }
                            // Then delete the material metadata
                            deleteMaterial(material.id);
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                          title="Delete Material"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function MaterialsManager({ 
  showHeader = true, 
  maxMaterials, 
  showFilters = true, 
  compactMode = false,
  onMaterialSelect 
}: MaterialsManagerProps) {
  return (
    <MaterialsManagerErrorBoundary>
      <MaterialsManagerContent 
        showHeader={showHeader}
        maxMaterials={maxMaterials}
        showFilters={showFilters}
        compactMode={compactMode}
        onMaterialSelect={onMaterialSelect}
      />
    </MaterialsManagerErrorBoundary>
  )
}