const pdfParse = require('pdf-parse');
const { parseOfficeFile } = require('officeparser');

const documentService = {
  // Extract text from file based on file type
  extractTextFromFile: async (file) => {
    try {
      const fileType = file.mimetype;
      const fileBuffer = file.buffer;
      const fileName = file.originalname;

      console.log(`Processing file: ${fileName} (${fileType})`);

      // Handle PDF files
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await documentService.extractPdfText(fileBuffer);
      }
      
      // Handle PPTX files
      if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
          fileName.endsWith('.pptx')) {
        return await documentService.extractPptxText(fileBuffer, fileName);
      }
      
      // Handle DOCX files
      if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileName.endsWith('.docx')) {
        return await documentService.extractDocxText(fileBuffer);
      }
      
      // Handle legacy DOC files
      if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        return `This is a legacy Microsoft Word document (.doc). Text extraction for this format requires specialized processing. File name: ${fileName}`;
      }
      
      // Handle PPT files
      if (fileType === 'application/vnd.ms-powerpoint' || fileName.endsWith('.ppt')) {
        return `This is a legacy Microsoft PowerPoint document (.ppt). Text extraction for this format requires specialized processing. File name: ${fileName}`;
      }
      
      // Handle XLS files
      if (fileType === 'application/vnd.ms-excel' || fileName.endsWith('.xls')) {
        return `This is a legacy Microsoft Excel document (.xls). Text extraction for this format requires specialized processing. File name: ${fileName}`;
      }
      
      // Handle XLSX files
      if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          fileName.endsWith('.xlsx')) {
        return `This is a Microsoft Excel document (.xlsx). Text extraction for this format requires specialized processing. File name: ${fileName}`;
      }
      
      // Handle text files
      if (fileType === 'text/plain' || fileType === 'text/markdown' || 
          fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        return fileBuffer.toString('utf8');
      }
      
      // Handle image files
      if (fileType.startsWith('image/')) {
        return `This is an image file (${fileType}). Text extraction from images requires OCR processing. File name: ${fileName}`;
      }
      
      // If we can't process the file type, return a placeholder
      return `File type ${fileType} not supported for text extraction. File name: ${fileName}`;
    } catch (error) {
      console.error('Error extracting text from file:', error);
      // Return a user-friendly error message instead of throwing
      return `Error extracting text from file: ${fileName}. Details: ${error.message || 'Unknown error'}`;
    }
  },

  // Extract text from PDF file
  extractPdfText: async (buffer) => {
    try {
      console.log('Extracting text from PDF...');
      const data = await pdfParse(buffer);
      console.log(`Successfully extracted ${data.text.length} characters from PDF`);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      // Return a user-friendly error message instead of throwing
      return `Error extracting text from PDF. The file may be corrupted or password-protected. Details: ${error.message || 'Unknown error'}`;
    }
  },

  // Extract text from PPTX file
  extractPptxText: async (buffer, filename) => {
    try {
      console.log('Extracting text from PPTX...');
      
      // Save buffer to temporary file for officeparser
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.join(__dirname, '../../temp');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${filename}`);
      fs.writeFileSync(tempFilePath, buffer);
      
      try {
        // Use officeparser to extract text
        console.log('Calling officeparser with file:', tempFilePath);
        const extractedText = await require('officeparser').parseOfficeAsync(tempFilePath);
        console.log('Officeparser returned text length:', extractedText ? extractedText.length : 0);
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log(`Successfully extracted ${extractedText.trim().length} characters from PPTX`);
          return extractedText.trim();
        } else {
          console.log('No text content found in PPTX file');
          return `No text content found in ${filename}. This presentation file may contain only images or other non-text elements.`;
        }
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error parsing PPTX:', error);
      // Try to provide more specific error information
      if (error.message && error.message.includes('password')) {
        return `Cannot extract text from ${filename} - file is password protected.`;
      } else if (error.message && error.message.includes('corrupt')) {
        return `Cannot extract text from ${filename} - file appears to be corrupted.`;
      } else {
        return `Error extracting text from ${filename}: ${error.message || 'Unknown error'}`;
      }
    }
  },

  // Extract text from DOCX file
  extractDocxText: async (buffer) => {
    try {
      console.log('Extracting text from DOCX...');
      
      // Save buffer to temporary file for officeparser
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.join(__dirname, '../../temp');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `temp_${Date.now()}_document.docx`);
      fs.writeFileSync(tempFilePath, buffer);
      
      try {
        // Use officeparser to extract text
        console.log('Calling officeparser with file:', tempFilePath);
        const extractedText = await require('officeparser').parseOfficeAsync(tempFilePath);
        console.log('Officeparser returned text length:', extractedText ? extractedText.length : 0);
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log(`Successfully extracted ${extractedText.trim().length} characters from DOCX`);
          return extractedText.trim();
        } else {
          console.log('No text content found in DOCX file');
          return `No text content found in document. This file may contain only images or other non-text elements.`;
        }
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      // Try to provide more specific error information
      if (error.message && error.message.includes('password')) {
        return `Cannot extract text from document - file is password protected.`;
      } else if (error.message && error.message.includes('corrupt')) {
        return `Cannot extract text from document - file appears to be corrupted.`;
      } else {
        return `Error extracting text from document: ${error.message || 'Unknown error'}`;
      }
    }
  },

  // Analyze text content
  analyzeText: async (content, title = 'Document') => {
    // This would typically call an AI service to analyze the text
    // For now, we'll return a simple analysis
    return {
      title: title,
      wordCount: content.split(/\s+/).length,
      characterCount: content.length,
      summary: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      mainTopics: ['Topic 1', 'Topic 2', 'Topic 3'] // This would be AI-generated
    };
  },

  // Generate study materials from text
  generateStudyMaterials: async (content, materialType = 'notes') => {
    // This would typically call an AI service to generate materials
    // For now, we'll return a placeholder
    return {
      type: materialType,
      content: `Generated ${materialType} from document content`,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = documentService;