# 🐍 StudyAI Python Backend

Flask backend service for document processing (PDF, PPTX, DOCX extraction).

## 🎯 Purpose

This backend handles:
- PDF text extraction
- PowerPoint (PPTX) text extraction
- Word document (DOCX) text extraction
- File upload and processing
- Text chunking for large documents

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- pip

### Installation

1. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment**
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server**
   ```bash
   python app.py
   ```

Server will start on `http://localhost:5000`

## 📦 Dependencies

- `flask` - Web framework
- `flask-cors` - CORS support
- `pypdf2` - PDF text extraction
- `pdfplumber` - Advanced PDF processing
- `python-pptx` - PowerPoint text extraction
- `python-docx` - Word document processing
- `pillow` - Image processing
- `gunicorn` - Production WSGI server
- `chardet` - Character encoding detection

## 🌐 API Endpoints

### Health Check
```
GET /health
```
Returns server status.

**Response:**
```json
{
  "status": "OK",
  "message": "Python Document Processing Backend is running"
}
```

### Upload Document
```
POST /api/documents/upload
```
Upload and extract text from documents.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF, PPTX, DOCX)

**Response:**
```json
{
  "success": true,
  "filename": "document.pdf",
  "extractedText": "...",
  "processingTime": "1.23 seconds",
  "total_chunks": 1,
  "total_characters": 5000
}
```

### Analyze Text
```
POST /api/documents/analyze-text
```
Analyze text content.

**Request:**
```json
{
  "content": "Text to analyze",
  "title": "Document Title"
}
```

## 🚀 Deployment

### Deploy to Render

1. **Go to [Render.com](https://render.com)**
2. **Create New Web Service**
3. **Configure:**
   - Root Directory: `python-backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
4. **Deploy**

The `render.yaml` file is already configured for deployment.

### Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Create New Project from GitHub**
3. **Set root directory to `python-backend`**
4. **Deploy**

The `Procfile` is already configured for deployment.

### Environment Variables (Optional)

- `FLASK_ENV` - Set to `production` for production deployment
- `PORT` - Port number (auto-set by hosting platforms)

## 🔧 Configuration Files

- `requirements.txt` - Python dependencies
- `render.yaml` - Render deployment configuration
- `Procfile` - Railway/Heroku deployment configuration
- `runtime.txt` - Python version specification

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

### Test Document Upload
```bash
curl -X POST -F "file=@test.pdf" http://localhost:5000/api/documents/upload
```

## 📁 Project Structure

```
python-backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── render.yaml           # Render deployment config
├── Procfile              # Railway deployment config
├── runtime.txt           # Python version
├── src/
│   └── services/
│       └── document_service.py  # Document processing logic
└── README.md             # This file
```

## 🐛 Troubleshooting

### Import Errors
```bash
pip install -r requirements.txt
```

### Port Already in Use
Change port in `app.py` or kill the process using port 5000.

### CORS Errors
CORS is enabled for all origins by default. Update `app.py` to restrict origins in production.

### File Processing Errors
- Ensure file is not password-protected
- Check file is not corrupted
- Verify file format is supported (PDF, PPTX, DOCX)

## 🔒 Security Notes

- File size limited to 50MB
- Temporary files are automatically cleaned up
- CORS should be restricted to your frontend domain in production

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Gunicorn Documentation](https://gunicorn.org/)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)

## 🤝 Integration with Frontend

The frontend (`src/services/api.ts`) calls this backend via the `VITE_API_URL` environment variable.

**Local:** `http://localhost:5000/api`
**Production:** `https://your-backend.onrender.com/api`

Make sure to update `VITE_API_URL` in Vercel environment variables after deployment.
