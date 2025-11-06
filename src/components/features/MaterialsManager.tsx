import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useStudyPlanner } from '@/contexts/StudyPlannerContext'
import { useAuth } from '@/contexts/AuthContext'
import { materialStorageService } from '@/services/materialStorageService'
import { useToast } from '@/hooks/use-toast'
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
  Minimize2,
  Loader2,
  CheckCircle2,
  XCircle,
  Cloud,
  CloudOff
} from 'lucide-react'

interface MaterialsManagerProps {
  showHeader?: boolean
  maxMaterials?: number
  showFilters?: boolean
  compactMode?: boolean
  onMaterialSelect?: (materialId: string) => void
}

export function MaterialsManager({ 
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
  
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Log materials state for debugging
  useEffect(() => {
    console.log('Materials in state:', state.materials.length, state.materials)
  }, [state.materials])

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

  const getUploadStatusIcon = (status?: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'uploaded':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <CloudOff className="h-4 w-4 text-orange-500" />
      default:
        return <Cloud className="h-4 w-4 text-gray-400" />
    }
  }

  const determineFileType = (file: File): 'note' | 'pdf' | 'image' | 'document' | 'presentation' | 'link' | 'other' => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    
    if (file.type.startsWith('image/')) return 'image'
    if (file.type === 'application/pdf' || fileExtension === 'pdf') return 'pdf'
    if (file.type.includes('presentation') || ['ppt', 'pptx'].includes(fileExtension)) return 'presentation'
    if (file.type.includes('word') || file.type.includes('document') || ['doc', 'docx'].includes(fileExtension)) return 'document'
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || ['xls', 'xlsx'].includes(fileExtension)) return 'document'
    if (file.type.startsWith('text/') || ['txt', 'md'].includes(fileExtension)) return 'note'
    
    return 'other'
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to upload files',
        variant: 'destructive'
      })
      return
    }

    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    const files = Array.from(event.target.files)
    
    if (files.length > 10) {
      toast({
        title: 'Too Many Files',
        description: 'Please upload 10 files or fewer at a time',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (const file of files) {
      try {
        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: `${file.name} exceeds 50MB limit`,
            variant: 'destructive'
          })
          errorCount++
          continue
        }

        const fileType = determineFileType(file)
        
        console.log('Adding material for file:', file.name)
        
        // Add material with pending status - this returns the material ID
        const materialId = addMaterial({
          title: file.name,
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
          type: fileType,
          fileName: file.name,
          fileSize: file.size,
          tags: ['uploaded'],
          uploadStatus: 'uploading',
          uploadProgress: 0
        })

        console.log('Material added with ID:', materialId)
        console.log('Current materials count:', state.materials.length)

        // Track upload progress
        setUploadingFiles(prev => new Map(prev).set(materialId, 0))

        // Upload to Supabase Storage using the same materialId
        const { url, path } = await materialStorageService.uploadFile(
          user.id,
          materialId,
          file,
          (progress) => {
            setUploadingFiles(prev => new Map(prev).set(materialId, progress))
          }
        )

        console.log('Upload complete, updating material:', materialId, path)

        // Get the material immediately after upload (don't wait for state update)
        // We know it exists because we just added it
        const materialToUpdate = {
          id: materialId,
          title: file.name,
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
          type: fileType,
          fileName: file.name,
          fileSize: file.size,
          tags: ['uploaded'],
          filePath: path,
          supabaseUrl: url,
          uploadStatus: 'uploaded' as const,
          uploadProgress: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Update material with Supabase URL and success status
        updateMaterial(materialToUpdate)
        console.log('Material updated with file path:', materialId)

        // Remove from uploading tracking
        setUploadingFiles(prev => {
          const newMap = new Map(prev)
          newMap.delete(materialId)
          return newMap
        })

        successCount++
      } catch (error) {
        console.error('Error uploading file:', error)
        errorCount++
        
        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive'
        })
      }
    }

    setIsProcessing(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Show summary toast
    if (successCount > 0) {
      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      })
    }
  }

  const handleViewMaterial = async (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (!material || !material.filePath) {
      toast({
        title: 'File Not Available',
        description: 'This file is not available for viewing',
        variant: 'destructive'
      })
      return
    }

    try {
      // Download file from Supabase
      const blob = await materialStorageService.downloadFile(material.filePath)
      const url = URL.createObjectURL(blob)
      
      // Open in new window
      window.open(url, '_blank')
      
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      console.error('Error viewing file:', error)
      toast({
        title: 'View Failed',
        description: 'Failed to open file for viewing',
        variant: 'destructive'
      })
    }
  }

  const handleDownloadMaterial = async (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (!material || !material.filePath) {
      toast({
        title: 'File Not Available',
        description: 'This file is not available for download',
        variant: 'destructive'
      })
      return
    }

    try {
      // Download file from Supabase
      const blob = await materialStorageService.downloadFile(material.filePath)
      const url = URL.createObjectURL(blob)
      
      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = material.fileName || material.title
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Download Started',
        description: `Downloading ${material.title}`,
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to download file',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId)
    if (!material) return

    const confirmed = window.confirm(`Are you sure you want to delete "${material.title}"?`)
    if (!confirmed) return

    try {
      // Delete from Supabase Storage if file exists
      if (material.filePath) {
        await materialStorageService.deleteFile(material.filePath)
      }

      // Delete metadata
      deleteMaterial(materialId)

      toast({
        title: 'File Deleted',
        description: `${material.title} has been deleted`,
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file',
        variant: 'destructive'
      })
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
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 transition-transform"
            disabled={isProcessing || !user}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.ppt,.pptx,.xls,.xlsx,.gif,.bmp,.webp,.svg,.md"
        onChange={handleFileUpload}
        className="hidden"
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
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Upload your first material to get started'}
              </p>
              {!maxMaterials && user && (
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Material
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
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(material.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">{material.title}</h4>
                          <Badge className={getTypeBadgeColor(material.type)}>
                            {material.type}
                          </Badge>
                          {material.uploadStatus && (
                            <div className="flex items-center gap-1">
                              {getUploadStatusIcon(material.uploadStatus)}
                              {material.uploadStatus === 'uploading' && material.uploadProgress !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {material.uploadProgress}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {material.description && !compactMode && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {material.description}
                          </p>
                        )}
                        
                        {material.fileSize && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(material.fileSize)}
                          </p>
                        )}
                        
                        {material.tags && material.tags.length > 0 && !compactMode && (
                          <div className="flex gap-1 flex-wrap">
                            {material.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMaterial(material.id)}
                          disabled={material.uploadStatus === 'uploading' || !material.filePath}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadMaterial(material.id)}
                          disabled={material.uploadStatus === 'uploading' || !material.filePath}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.id)}
                          disabled={material.uploadStatus === 'uploading'}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
