import React from 'react';

export function BinaryFileTest() {
  const testBinaryFile = () => {
    try {
      // Create a simple binary file (simulating an image)
      const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const binaryString = String.fromCharCode.apply(null, Array.from(binaryData));
      const base64 = btoa(binaryString);
      
      console.log('Binary data:', binaryData);
      console.log('Binary string:', binaryString);
      console.log('Base64 encoded:', base64);
      
      // Test decoding
      const decodedBinaryString = atob(base64);
      const decodedBinaryData = new Uint8Array(decodedBinaryString.length);
      for (let i = 0; i < decodedBinaryString.length; i++) {
        decodedBinaryData[i] = decodedBinaryString.charCodeAt(i);
      }
      
      console.log('Decoded binary string:', decodedBinaryString);
      console.log('Decoded binary data:', decodedBinaryData);
      
      // Test creating blob
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      
      console.log('Blob URL:', url);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      alert('Binary file test completed successfully! Check console for details.');
    } catch (error) {
      console.error('Binary file test failed:', error);
      alert('Binary file test failed! Check console for details.');
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <h3 className="text-lg font-semibold mb-2">Binary File Test</h3>
      <button 
        onClick={testBinaryFile}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        Run Binary File Test
      </button>
    </div>
  );
}