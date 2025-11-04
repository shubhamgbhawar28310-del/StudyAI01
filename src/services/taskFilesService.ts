import { supabase } from '@/lib/supabase';

export interface TaskFile {
  id: string;
  user_id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path?: string;
  storage_type: 'local' | 'supabase';
  file_data?: string; // Base64 encoded data
  created_at: string;
  updated_at: string;
}

export interface TaskNote {
  id: string;
  user_id: string;
  task_id: string;
  title?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Upload a file for a task (stores as base64 in database)
 * Also automatically adds the file to Materials Manager for universal access
 */
export const uploadTaskFile = async (
  userId: string,
  taskId: string,
  file: File,
  addToMaterials?: (material: any) => string
): Promise<TaskFile | null> => {
  try {
    // Read file as base64
    const fileData = await readFileAsBase64(file);

    // Insert into database
    const { data, error } = await supabase
      .from('task_files')
      .insert({
        user_id: userId,
        task_id: taskId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: `local/${userId}/tasks/${taskId}/${file.name}`,
        storage_type: 'local',
        file_data: fileData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Also add to Materials Manager if function is provided
    if (addToMaterials && data) {
      try {
        // Determine material type from file type
        let materialType: 'note' | 'pdf' | 'image' | 'document' | 'presentation' | 'link' | 'other' = 'other';
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        
        if (file.type.startsWith('image/')) {
          materialType = 'image';
        } else if (file.type === 'application/pdf' || fileExtension === 'pdf') {
          materialType = 'pdf';
        } else if (file.type.includes('presentation') || file.type.includes('powerpoint') ||
                  ['ppt', 'pptx'].includes(fileExtension)) {
          materialType = 'presentation';
        } else if (file.type.includes('word') || file.type.includes('document') ||
                  ['doc', 'docx'].includes(fileExtension)) {
          materialType = 'document';
        } else if (file.type.startsWith('text/') || ['txt', 'md'].includes(fileExtension)) {
          materialType = 'note';
        }

        // Extract base64 content from data URL
        const base64Content = fileData.split(',')[1] || '';

        // Add to materials with task reference
        addToMaterials({
          title: file.name,
          description: `Uploaded from task on ${new Date().toLocaleDateString()}`,
          type: materialType,
          fileName: file.name,
          fileSize: file.size,
          content: base64Content,
          tags: ['task-upload', `task-${taskId}`],
          taskId: taskId // Link back to the task
        });

        console.log(`File "${file.name}" added to Materials Manager`);
      } catch (materialError) {
        console.error('Error adding file to Materials Manager:', materialError);
        // Don't fail the upload if materials addition fails
      }
    }

    return data;
  } catch (error) {
    console.error('Upload task file error:', error);
    return null;
  }
};

/**
 * Get all files for a specific task
 */
export const getTaskFiles = async (taskId: string): Promise<TaskFile[]> => {
  try {
    const { data, error } = await supabase
      .from('task_files')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get task files error:', error);
    return [];
  }
};

/**
 * Get file data (base64) for viewing/downloading
 */
export const getTaskFileData = async (fileId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('task_files')
      .select('file_data, file_type')
      .eq('id', fileId)
      .single();

    if (error || !data) {
      console.error('Error fetching file data:', error);
      return null;
    }

    return data.file_data;
  } catch (error) {
    console.error('Get task file data error:', error);
    return null;
  }
};

/**
 * Delete a task file
 */
export const deleteTaskFile = async (fileId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('task_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete task file error:', error);
    return false;
  }
};

/**
 * Delete all files for a task (called when task is deleted)
 */
export const deleteAllTaskFiles = async (taskId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('task_files')
      .delete()
      .eq('task_id', taskId);

    if (error) {
      console.error('Error deleting task files:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete all task files error:', error);
    return false;
  }
};

/**
 * Create a note for a task
 */
export const createTaskNote = async (
  userId: string,
  taskId: string,
  title: string,
  content: string
): Promise<TaskNote | null> => {
  try {
    const { data, error } = await supabase
      .from('task_notes')
      .insert({
        user_id: userId,
        task_id: taskId,
        title: title || null,
        content: content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Create task note error:', error);
    return null;
  }
};

/**
 * Get all notes for a specific task
 */
export const getTaskNotes = async (taskId: string): Promise<TaskNote[]> => {
  try {
    const { data, error } = await supabase
      .from('task_notes')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task notes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get task notes error:', error);
    return [];
  }
};

/**
 * Update a task note
 */
export const updateTaskNote = async (
  noteId: string,
  title: string,
  content: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('task_notes')
      .update({
        title: title || null,
        content: content,
      })
      .eq('id', noteId);

    if (error) {
      console.error('Error updating note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update task note error:', error);
    return false;
  }
};

/**
 * Delete a task note
 */
export const deleteTaskNote = async (noteId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('task_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete task note error:', error);
    return false;
  }
};

/**
 * Delete all notes for a task (called when task is deleted)
 */
export const deleteAllTaskNotes = async (taskId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('task_notes')
      .delete()
      .eq('task_id', taskId);

    if (error) {
      console.error('Error deleting task notes:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete all task notes error:', error);
    return false;
  }
};

/**
 * Helper: Read file as base64
 */
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Helper: Download file from base64 data
 */
export const downloadFile = (base64Data: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Helper: Get file icon based on file type
 */
export const getFileIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
  if (fileType.includes('text')) return '📃';
  return '📎';
};

/**
 * Helper: Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
