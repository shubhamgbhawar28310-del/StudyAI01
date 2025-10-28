const multer = require('multer');
const documentService = require('../services/documentService');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // Increase limit to 50MB to handle larger files
  },
  fileFilter: (req, file, cb) => {
    // Accept a wider range of file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.ms-powerpoint',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    // Also check file extensions as fallback
    const allowedExtensions = ['.pdf', '.pptx', '.docx', '.doc', '.ppt', '.xls', '.xlsx', '.txt', '.md', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Supported types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, MD, JPG, PNG, GIF, BMP, WEBP'));
    }
  }
});

const uploadMiddleware = upload.single('file'); // Changed from 'document' to 'file' to match frontend

const documentController = {
  // Upload and analyze document
  uploadDocument: async (req, res) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.log('Multer error:', err.message);
        return res.status(400).json({ error: err.message });
      }

      try {
        if (!req.file) {
          console.log('No file uploaded in request');
          return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Processing file:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        // Extract text from the document
        const extractedText = await documentService.extractTextFromFile(req.file);
        
        console.log('Extraction completed, text length:', extractedText.length);
        
        // Return the extracted text
        res.status(200).json({
          success: true,
          filename: req.file.originalname,
          filetype: req.file.mimetype,
          extractedText: extractedText
        });
      } catch (error) {
        console.error('Error processing document:', error);
        // Return a more user-friendly error message
        const errorMessage = error.message || 'Failed to process document';
        res.status(500).json({ 
          success: false,
          error: 'Failed to process document', 
          details: errorMessage 
        });
      }
    });
  },

  // Analyze text directly
  analyzeText: async (req, res) => {
    try {
      const { content, title } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Analyze the text using document service
      const analysis = await documentService.analyzeText(content, title);
      
      res.status(200).json({
        success: true,
        analysis: analysis
      });
    } catch (error) {
      console.error('Error analyzing text:', error);
      res.status(500).json({ error: 'Failed to analyze text', details: error.message });
    }
  },

  // Generate study materials
  generateMaterials: async (req, res) => {
    try {
      const { content, materialType } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Generate study materials using document service
      const materials = await documentService.generateStudyMaterials(content, materialType);
      
      res.status(200).json({
        success: true,
        materials: materials
      });
    } catch (error) {
      console.error('Error generating materials:', error);
      res.status(500).json({ error: 'Failed to generate materials', details: error.message });
    }
  }
};

module.exports = documentController;