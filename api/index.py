import os
import sys
import tempfile
import time
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add the parent directory to the path to import from python-backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python-backend'))

from src.services.document_service import DocumentService

# Create Flask app
application = Flask(__name__)
CORS(application)

# Initialize document service
document_service = DocumentService()

@application.route('/health', methods=['GET'])
@application.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "Python Document Processing Backend is running"})

@application.route('/api/documents/upload', methods=['POST'])
def upload_document():
    temp_file_path = None
    start_time = time.time()
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        # Check file size (limit to 50MB)
        file_size_mb = 0
        file.seek(0, os.SEEK_END)
        file_size_mb = file.tell() / (1024 * 1024)
        file.seek(0)  # Reset file pointer
        
        print(f"Processing file: {file.filename}, size: {file_size_mb:.2f} MB")
        
        # Increase limit for Vercel with more memory
        max_file_size = 100  # 100MB for larger presentations
        if file_size_mb > max_file_size:
            return jsonify({
                'success': False,
                'filename': file.filename,
                'error': f'File size ({file_size_mb:.1f}MB) exceeds the maximum allowed size ({max_file_size}MB)'
            }), 413  # 413 Payload Too Large
        
        # Save file to temporary location
        with tempfile.NamedTemporaryFile(delete=False) as temp:
            temp_file_path = temp.name
            file.save(temp_file_path)
        
        try:
            # Extract text from the file
            extracted_text = document_service.extract_text_from_file(temp_file_path, file.filename)
            
            # Check if text is too large, chunk it if necessary
            chunks = document_service.chunk_text(extracted_text)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            print(f"Processed {file.filename} in {processing_time:.2f} seconds, extracted {len(extracted_text)} characters")
            
            # If extracted text is too short, it might indicate an error
            if len(extracted_text) < 20 and file_size_mb > 0.1:
                print(f"Warning: Very little text extracted from {file.filename}")
            
            # Return the extracted text (or first chunk if multiple)
            response = {
                'success': True,
                'filename': file.filename,
                'extractedText': chunks[0] if chunks else "",
                'processingTime': f"{processing_time:.2f} seconds",
                'total_chunks': len(chunks),
                'total_characters': len(extracted_text) if extracted_text else 0
            }
            
            # If multiple chunks, include chunk info
            if len(chunks) > 1:
                response['chunked'] = True
                response['chunk_sizes'] = [len(chunk) for chunk in chunks]
            
            return jsonify(response)
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        print(f"Error processing document: {str(e)}")
        traceback.print_exc()
        
        # Clean up temporary file if it exists
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
        # Return a user-friendly error message
        error_message = str(e)
        error_type = "unknown"
        
        if "password" in error_message.lower() or "encrypted" in error_message.lower():
            error_type = "password_protected"
            user_message = "This file is password-protected. Please provide an unprotected version."
            return jsonify({
                'success': False,
                'filename': file.filename if 'file' in locals() else "unknown",
                'error': user_message,
                'error_type': error_type,
                'technical_details': error_message
            }), 400
        elif "corrupted" in error_message.lower() or "invalid" in error_message.lower():
            error_type = "corrupted"
            user_message = "This file appears to be corrupted or in an invalid format."
            return jsonify({
                'success': False,
                'filename': file.filename if 'file' in locals() else "unknown",
                'error': user_message,
                'error_type': error_type,
                'technical_details': error_message
            }), 400
        else:
            # Generic error
            user_message = "There was an error processing your file. Please try again or use a different file."
            return jsonify({
                'success': False,
                'error': user_message,
                'error_type': error_type,
                'technical_details': error_message,
                'filename': file.filename if 'file' in locals() else "unknown"
            }), 500

@application.route('/api/documents/analyze-text', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        content = data.get('content', '')
        title = data.get('title', 'Document')
        
        if not content:
            return jsonify({"error": "Content is required"}), 400
        
        # Analyze the text
        analysis = document_service.analyze_text(content, title)
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({"error": "Failed to analyze text", "details": str(e)}), 500

# Vercel expects 'app' or 'application' as the WSGI handler
app = application
