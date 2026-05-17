import { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface ImageUploadProps {
  onImagesAdded: (images: UploadedImage[]) => void;
}

export function ImageUpload({ onImagesAdded }: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateAndProcessFiles = useCallback(
    (files: FileList) => {
      setUploadError(null);
      const validImages: UploadedImage[] = [];
      const maxSizeMB = 5;
      const maxSize = maxSizeMB * 1024 * 1024;
      let totalSize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          const msg = `Invalid file type: ${file.name}. Only JPG, PNG, WebP allowed.`;
          setUploadError(msg);
          useNotificationStore.getState().notify({
            category: 'validation',
            severity: 'warning',
            title: 'Unsupported file type',
            message: msg,
            actions: [{ kind: 'dismiss' }],
            details: `name=${file.name} type=${file.type}`,
            dedupeKey: `upload.invalid_type:${file.name}`,
            source: 'ImageUpload',
          });
          continue;
        }

        // Check file size
        if (file.size > maxSize) {
          const msg = `${file.name} exceeds ${maxSizeMB}MB. Try a smaller file.`;
          setUploadError(msg);
          useNotificationStore.getState().notify({
            category: 'client',
            severity: 'warning',
            title: 'File too large',
            message: msg,
            actions: [{ kind: 'dismiss' }],
            details: `name=${file.name} size=${file.size} max=${maxSize}`,
            dedupeKey: `upload.too_large:${file.name}`,
            source: 'ImageUpload',
          });
          continue;
        }

        totalSize += file.size;
        if (totalSize > maxSize) {
          const msg = `Total upload size exceeds ${maxSizeMB}MB. Remove some files and try again.`;
          setUploadError(msg);
          useNotificationStore.getState().notify({
            category: 'client',
            severity: 'warning',
            title: 'Total size too large',
            message: msg,
            actions: [{ kind: 'dismiss' }],
            details: `totalSize=${totalSize} max=${maxSize}`,
            dedupeKey: 'upload.total_too_large',
            source: 'ImageUpload',
          });
          break;
        }

        // Create preview
        const preview = URL.createObjectURL(file);
        validImages.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview,
        });
      }

      if (validImages.length > 0) {
        onImagesAdded(validImages);
      }
    },
    [onImagesAdded]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      validateAndProcessFiles(e.dataTransfer.files);
    },
    [validateAndProcessFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        validateAndProcessFiles(e.target.files);
      }
    },
    [validateAndProcessFiles]
  );

  return (
    <div className="space-y-3">
      <label
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`block px-6 py-12 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5'
        }`}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <Upload size={32} className="text-[var(--muted-foreground)]" />
          <div className="text-center">
            <p className="font-medium text-[var(--foreground)]">
              Drag images here or click to select
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              JPG, PNG, WebP — max 10 images
            </p>
          </div>
        </div>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </label>

      {uploadError && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-600">{uploadError}</p>
        </div>
      )}
    </div>
  );
}
