import React from 'react';

export function Base64Test() {
  const testBase64 = () => {
    try {
      // Test string
      const testString = "This is a test file for verifying file upload and preview functionality in StudyAI.";
      const encoded = btoa(testString);
      const decoded = atob(encoded);
      
      console.log('Original:', testString);
      console.log('Encoded:', encoded);
      console.log('Decoded:', decoded);
      console.log('Match:', testString === decoded);
      
      // Test creating blob
      const byteString = atob(encoded);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      console.log('Blob URL:', url);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      alert('Base64 test completed successfully! Check console for details.');
    } catch (error) {
      console.error('Base64 test failed:', error);
      alert('Base64 test failed! Check console for details.');
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <h3 className="text-lg font-semibold mb-2">Base64 Test</h3>
      <button 
        onClick={testBase64}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Run Base64 Test
      </button>
    </div>
  );
}