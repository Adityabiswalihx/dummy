import magic from 'magic-bytes.js';

export function getMimeTypeFromBase64(base64String: string): string {
  let mimeType;

  try {
    let buffer = Buffer.from(base64String, 'base64');

    // Find where the '%PDF-' header starts in the buffer
    const pdfHeaderIndex = buffer.indexOf('%PDF-');

    if (pdfHeaderIndex === -1) {
      console.warn('❌ PDF header not found. The file may not be a valid PDF.');
      // If you want to return a default MIME type
      return 'application/octet-stream';
    }

    if (pdfHeaderIndex > 0) {
      console.log(`⚠️ Extra data found before PDF header at byte ${pdfHeaderIndex}. Slicing buffer.`);
      // Slice the buffer to ignore garbage before %PDF-
      buffer = buffer.slice(pdfHeaderIndex);
    } else {
      console.log('✅ PDF header found at the beginning of the buffer.');
    }

    const detectedTypes = magic(buffer);

    if (Array.isArray(detectedTypes) && detectedTypes.length > 0) {
      mimeType = detectedTypes[0].mime;
      console.log('✅ Detected MIME type:', mimeType);
    } else {
      console.warn('⚠️ Unable to detect MIME type. Defaulting to application/pdf');
      mimeType = 'application/pdf';
    }

    return mimeType;
  } catch (error) {
    console.error('❌ Error detecting MIME type:', error);
    // Fallback MIME type
    return 'application/pdf';
  }
}
