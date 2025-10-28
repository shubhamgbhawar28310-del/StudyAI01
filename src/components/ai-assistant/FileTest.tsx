import React, { useState } from 'react';
import { Attachment } from '@/components/ai-assistant/types';

interface FileTestProps {
  onFileTest: (file: Attachment) => void;
}

export function FileTest({ onFileTest }: FileTestProps) {
  const [testFile, setTestFile] = useState<Attachment | null>(null);

  const handleTestFile = () => {
    const mockFile: Attachment = {
      name: 'test-file.txt',
      type: 'text/plain',
      content: btoa('This is a test file for verifying file upload and preview functionality in StudyAI.'),
      extractedText: 'File: test-file.txt (text/plain)'
    };
    setTestFile(mockFile);
    onFileTest(mockFile);
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <h3 className="text-lg font-semibold mb-2">File Handling Test</h3>
      <button 
        onClick={handleTestFile}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test File Preview
      </button>
      {testFile && (
        <div className="mt-4 p-3 bg-white rounded border">
          <p>Test file created successfully!</p>
          <p>Name: {testFile.name}</p>
          <p>Type: {testFile.type}</p>
          <p>Content (base64): {testFile.content.substring(0, 50)}...</p>
        </div>
      )}
    </div>
  );
}