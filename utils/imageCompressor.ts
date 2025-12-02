
export const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const maxWidth = 1280; // Standard HD width
    const maxHeight = 1280;
    const quality = 0.7; // 70% quality (excellent balance)

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            resolve(event.target?.result as string); // Fallback to original
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP (smaller than JPEG)
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
