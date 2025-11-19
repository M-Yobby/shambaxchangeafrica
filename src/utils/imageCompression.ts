/**
 * IMAGE COMPRESSION UTILITY
 * 
 * Compresses images before upload to reduce file sizes and improve performance.
 * Essential for social media feeds where many images are loaded at once.
 * 
 * KEY FEATURES:
 * 1. Maintains aspect ratio during resize
 * 2. Converts all images to JPEG format (optimal compression)
 * 3. Configurable quality and dimensions
 * 4. Returns video files unchanged (no video compression)
 * 
 * COMPRESSION STRATEGY:
 * - Max dimensions: 1920x1920px (sufficient for high-quality display)
 * - Quality: 80% JPEG (good balance of size vs quality)
 * - Aspect ratio: Always preserved
 * - Format: Converts PNG, WebP, etc. to JPEG
 * 
 * PERFORMANCE BENEFITS:
 * - Reduces upload time (smaller file sizes)
 * - Faster page loads (less data to download)
 * - Lower bandwidth costs
 * - Better mobile experience
 * 
 * USAGE:
 * ```typescript
 * const compressedFile = await compressImage(originalFile);
 * // Upload compressedFile to storage
 * ```
 * 
 * WHY COMPRESSION MATTERS:
 * Without compression, a 5MB photo from a modern phone could:
 * - Take 10+ seconds to upload on slow connections
 * - Consume excessive mobile data
 * - Slow down feed scrolling
 * - Increase storage costs
 * 
 * With compression, that same photo becomes ~200KB while maintaining
 * excellent visual quality for web display.
 */

/**
 * Compresses an image file to reduce size while maintaining quality
 * 
 * @param file - Original image file to compress
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @param quality - JPEG quality 0-1 (default: 0.8 = 80%)
 * @returns Compressed image file
 * 
 * PROCESS:
 * 1. Check file type (skip videos)
 * 2. Read file as data URL
 * 3. Load image into Image element
 * 4. Calculate new dimensions (maintain aspect ratio)
 * 5. Draw resized image to canvas
 * 6. Convert canvas to JPEG blob with quality setting
 * 7. Create new File from compressed blob
 * 8. Return compressed file
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  // VIDEO FILES: Return unchanged (no compression needed)
  // Video compression is complex and handled by specialized services
  if (file.type.startsWith('video/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    // Step 1: Read file as data URL for Image loading
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      // Step 2: Create Image element to load file
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Step 3: Create canvas for image manipulation
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Step 4: Calculate new dimensions while maintaining aspect ratio
        // Resize logic: Scale down if either dimension exceeds max
        if (width > height) {
          // Landscape: Width is limiting factor
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          // Portrait or square: Height is limiting factor
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Set canvas dimensions to new size
        canvas.width = width;
        canvas.height = height;

        // Step 5: Get canvas context and draw resized image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image at new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Step 6: Convert canvas to compressed JPEG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Step 7: Create new File from compressed blob
            // Always JPEG format for best compression
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Force JPEG (optimal compression)
              lastModified: Date.now(),
            });

            // Step 8: Return compressed file
            resolve(compressedFile);
          },
          'image/jpeg', // Output format
          quality // Compression quality (0.8 = 80%)
        );
      };
      
      // Error handlers
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};
