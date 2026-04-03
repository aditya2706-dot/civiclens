/**
 * Dual-purpose image compression utility.
 * 
 * GEMINI quality: 800px max, 0.65 quality → ~50-80 KB (enough for AI vision analysis)
 * STORAGE quality: 600px max, 0.55 quality → ~25-45 KB (saved to DB for display)
 * 
 * Raw phone camera: 4-10 MB → We compress to under 100 KB total.
 */

export async function compressImage(
    file: Blob,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.65
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Maintain aspect ratio within max bounds
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Fill white background first (avoids black background on PNG->JPEG conversion)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Image loading failed'));
        };
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Compress image specifically for Gemini AI vision analysis.
 * Gemini needs enough detail to identify objects but doesn't need full print quality.
 * Target: ~50-80 KB
 */
export async function compressForAI(file: Blob): Promise<Blob> {
    return compressImage(file, 800, 800, 0.65);
}

/**
 * Compress image for database storage/display in app.
 * Smaller than AI version since it's just for showing a thumbnail.
 * Target: ~25-45 KB
 */
export async function compressForStorage(file: Blob): Promise<Blob> {
    return compressImage(file, 600, 600, 0.55);
}

/**
 * Helper to convert Blob to Base64 data-only string (no data: prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Convert blob to full data URL for storage (includes data:image/jpeg;base64, prefix)
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
