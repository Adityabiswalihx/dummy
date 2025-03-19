export function getMimeTypeFromBase64(base64String: string): string {
  let mimeType;
  // start of try catch block -->
  try {
    let buffer = Buffer.from(base64String, 'base64');
    // checking the index from pdf header
    const pdfHeaderIndex = buffer.indexOf('%PDF-');

    if (pdfHeaderIndex > 0) {
      console.log(`Extra Header Index found before PDF header ${pdfHeaderIndex}. Slicing Buffer`);
      buffer = buffer.slice(pdfHeaderIndex);
    } 

    const detectedTypes = magic(buffer);
    if (Array.isArray(detectedTypes)) {
      if (detectedTypes?.length > 0) {
        mimeType = detectedTypes[0].mime;
      }
    }
    console.log('Mime Type Fetched for watermarked pdf', mimeType);
    return mimeType;
  } catch (error: any) {
    console.error(`Error Detecting mime type: ${error}`);
    return 'application/pdf'
  }
}
