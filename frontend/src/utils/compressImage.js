/**
 * Resize and compress an image file before upload to stay within server/proxy limits.
 */
export const compressImage = (file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82, maxBytes = 900 * 1024 } = {}) => {
    if (!file?.type?.startsWith('image/')) {
        return Promise.reject(new Error('Please select a valid image file.'));
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;
            const scale = Math.min(1, maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not process image'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            const outputName = (file.name || 'image.jpg').replace(/\.[^.]+$/, '') + '.jpg';

            const tryQuality = (q) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Image compression failed'));
                        return;
                    }
                    if (blob.size <= maxBytes || q <= 0.5) {
                        resolve(new File([blob], outputName, { type: 'image/jpeg' }));
                        return;
                    }
                    tryQuality(q - 0.1);
                }, 'image/jpeg', q);
            };

            if (scale === 1 && file.size <= maxBytes && /jpe?g$/i.test(file.name || '')) {
                resolve(file);
                return;
            }

            tryQuality(quality);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Could not read image file'));
        };

        img.src = objectUrl;
    });
};
