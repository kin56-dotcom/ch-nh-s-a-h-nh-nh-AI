import React, { useState, useCallback } from 'react';
import type { ImageState } from '../types';
import { fileToDataUrl } from '../utils/fileUtils';
import { UploadCloudIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (image: ImageState) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await fileToDataUrl(file);
        onImageUpload({ file, dataUrl });
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Đã xảy ra lỗi khi xử lý ảnh của bạn. Vui lòng thử lại.");
      }
    } else {
        alert("Vui lòng tải lên một tệp ảnh hợp lệ (ví dụ: PNG, JPG, WEBP).");
    }
  }, [onImageUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-2xl text-center">
        <label
            htmlFor="file-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center transition-colors duration-200 ${isDragging ? 'border-indigo-400 bg-gray-800/50' : 'border-gray-600 hover:border-gray-500'}`}
        >
            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-4 block text-lg font-semibold text-white">Tải ảnh lên</span>
            <span className="mt-1 block text-sm text-gray-400">Kéo và thả hoặc nhấp để chọn tệp</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
        </label>
        <p className="mt-6 text-sm text-gray-500">Tách đối tượng, xóa nền hoặc chỉnh sửa ảnh của bạn bằng một câu lệnh văn bản đơn giản.</p>
    </div>
  );
};

export default ImageUploader;