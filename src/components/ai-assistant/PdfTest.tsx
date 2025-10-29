import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const PdfTest: React.FC = () => {
  const [result, setResult] = useState<string>('');

  const testPdfProcessing = async () => {
    try {
      setResult('Testing PDF processing...');
      
      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
      
      setResult('PDF.js library loaded successfully!');
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Processing Test</h1>
      <Button onClick={testPdfProcessing}>Test PDF Processing</Button>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <pre>{result}</pre>
      </div>
    </div>
  );
};

export default PdfTest;