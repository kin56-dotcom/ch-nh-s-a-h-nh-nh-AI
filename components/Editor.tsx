import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ImageState } from '../types';
import { editImage } from '../services/geminiService';
import { dataUrlToParts, fileToDataUrl } from '../utils/fileUtils';
import Spinner from './Spinner';
import { ArrowLeftIcon, ArrowRightIcon, DownloadIcon, SparklesIcon, CloseIcon, RefreshIcon, AspectRatioAutoIcon, AspectRatioLandscapeIcon, AspectRatioPortraitIcon } from './Icons';

interface EditorProps {
  originalImage: ImageState;
  onImageChange: (image: ImageState) => void;
}

const presetPrompts = [
    { label: "Tách vật phẩm", prompt: "Identify the main object in this image. Isolate it completely, removing any people, hands, or other secondary objects. The final image should feature only the main object, fully intact, on a pure white background." },
    { label: "Túi xách", prompt: "Precisely isolate the handbag in this image. Remove any person, hands, or other objects holding or near the bag. The final image should show only the handbag, complete and intact, on a pure white background." },
    { label: "Quần", prompt: "Precisely isolate the pants in this image. Remove the person wearing them and any other objects. The final image should show only the pants, laid flat as if for a product photo, on a pure white background." },
    { label: "Áo", prompt: "Precisely isolate the shirt or top garment in this image. Remove the person wearing it and any other objects. The final image should show only the shirt/top, laid flat as if for a product photo, on a pure white background." },
];

const ImagePreviewModal: React.FC<{ imageUrl: string; onClose: () => void; }> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <img src={imageUrl} alt="Xem trước ảnh" className="object-contain w-full h-full max-h-[90vh]" />
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors"
                    aria-label="Đóng xem trước"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const Editor: React.FC<EditorProps> = ({ originalImage, onImageChange }) => {
    const [history, setHistory] = useState<string[]>([originalImage.dataUrl]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [prompt, setPrompt] = useState<string>('');
    const [contextPrompt, setContextPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
    const [aspectRatio, setAspectRatio] = useState<'auto' | 'landscape' | 'portrait'>('auto');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHistory([originalImage.dataUrl]);
        setCurrentIndex(0);
        setPrompt('');
        setContextPrompt('');
        setError(null);
        setIsLoading(false);
    }, [originalImage]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                const dataUrl = await fileToDataUrl(file);
                onImageChange({ file, dataUrl });
            } catch (error) {
                console.error("Error reading file:", error);
                setError("Đã xảy ra lỗi khi xử lý ảnh mới của bạn.");
            }
        }
        if (e.target) {
            e.target.value = '';
        }
    };
    
    const handleChangeImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleGenerate = useCallback(async (activePrompt: string, isContextGeneration: boolean = false) => {
        if (!activePrompt || isLoading) return;
        setIsLoading(true);
        setError(null);

        const currentImage = history[currentIndex];
        const { mimeType, data } = dataUrlToParts(currentImage);

        let finalPrompt = activePrompt;
        if (isContextGeneration) {
            finalPrompt = `Take the primary object from this image, which is isolated on a white background, and place it realistically into the following new scene or context: "${activePrompt}". Ensure the lighting, shadows, and perspective match the new environment. Do not add any logos or watermarks.`;
            if (aspectRatio === 'landscape') {
                finalPrompt += " Ảnh cuối cùng phải có hướng ngang (ví dụ: tỷ lệ 16:9).";
            } else if (aspectRatio === 'portrait') {
                finalPrompt += " Ảnh cuối cùng phải có hướng dọc (ví dụ: tỷ lệ 9:16).";
            }
        }
        
        const numberOfImages = isContextGeneration ? 2 : 1;

        try {
            const newImageDataUrls = await editImage(data, mimeType, finalPrompt, numberOfImages);
            if (newImageDataUrls && newImageDataUrls.length > 0) {
                const newHistory = [...history.slice(0, currentIndex + 1), ...newImageDataUrls];
                setHistory(newHistory);
                setCurrentIndex(currentIndex + 1); // Point to the first of the new images
                setPrompt('');
                setContextPrompt('');
            } else {
                setError("Mô hình không trả về ảnh. Vui lòng thử một câu lệnh khác.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, history, currentIndex, aspectRatio]);

    const handleCustomPromptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGenerate(prompt, false);
    };
    
    const handleContextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGenerate(contextPrompt, true);
    };

    const handlePresetClick = (presetPrompt: string) => {
        handleGenerate(presetPrompt, false);
    };

    const handleNavigation = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCurrentIndex(prev => Math.max(0, prev - 1));
        } else {
            setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
        }
    };
    
    const downloadImage = () => {
        const link = document.createElement('a');
        link.href = history[currentIndex];
        link.download = `edited-image-${currentIndex}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isOriginal = currentIndex === 0;

    return (
        <>
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <h2 className="text-base font-semibold text-gray-200 mb-3">Ảnh gốc</h2>
                        <div className="flex items-center gap-4">
                            <img src={history[0]} alt="Ảnh gốc" className="w-20 h-20 rounded-md object-cover border-2 border-gray-600" />
                            <div className="flex-grow">
                                <p className="text-xs text-gray-400 truncate mb-2" title={originalImage.file.name}>{originalImage.file.name}</p>
                                <button
                                    onClick={handleChangeImageClick}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                                >
                                    <RefreshIcon className="w-4 h-4" />
                                    Thay đổi ảnh
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="sr-only"
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 mb-2">1. Tách đối tượng</h2>
                        <p className="text-sm text-gray-400 mb-4">Bắt đầu bằng cách nhấp vào một danh mục để tách một mục ra khỏi nền trắng.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {presetPrompts.map(p => (
                                <button key={p.label} onClick={() => handlePresetClick(p.prompt)} disabled={isLoading} className="p-3 bg-gray-800 rounded-md text-sm font-medium hover:bg-gray-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 mb-2">2. Thêm bối cảnh mới</h2>
                        <p className="text-sm text-gray-400 mb-4">Sau khi tách, hãy mô tả một cảnh mới để đặt đối tượng của bạn vào. Ví dụ: "trên bàn gỗ" hoặc "bay trong không gian".</p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Chọn kích thước</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setAspectRatio('auto')} 
                                    disabled={isLoading}
                                    className={`p-2 flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${aspectRatio === 'auto' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title="Tự động"
                                >
                                    <AspectRatioAutoIcon className="w-5 h-5" />
                                    <span>Tự động</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setAspectRatio('landscape')} 
                                    disabled={isLoading}
                                    className={`p-2 flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${aspectRatio === 'landscape' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title="Ngang (16:9)"
                                >
                                    <AspectRatioLandscapeIcon className="w-5 h-5" />
                                    <span>Ngang</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setAspectRatio('portrait')}
                                    disabled={isLoading} 
                                    className={`p-2 flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 ${aspectRatio === 'portrait' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title="Dọc (9:16)"
                                >
                                    <AspectRatioPortraitIcon className="w-5 h-5" />
                                    <span>Dọc</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleContextSubmit} className="space-y-4">
                            <textarea
                                value={contextPrompt}
                                onChange={(e) => setContextPrompt(e.target.value)}
                                placeholder="trên một bãi biển vào lúc hoàng hôn..."
                                rows={3}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || !contextPrompt} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-500 transition-colors disabled:bg-teal-600/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500">
                                {isLoading ? 'Đang tạo...' : 'Tạo bối cảnh'}
                                <SparklesIcon className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                    
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 mb-2">Chỉnh sửa chung (Tùy chọn)</h2>
                        <p className="text-sm text-gray-400 mb-4">Mô tả một chỉnh sửa chung cho ảnh hiện tại. Ví dụ: "làm cho màu sắc rực rỡ hơn" hoặc "thay đổi màu của đối tượng thành màu đỏ".</p>
                        <form onSubmit={handleCustomPromptSubmit} className="space-y-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="thêm hiệu ứng cổ điển..."
                                rows={3}
                                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || !prompt} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-indigo-600/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500">
                                {isLoading ? 'Đang tạo...' : 'Tạo Chỉnh sửa'}
                                <SparklesIcon className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-4 bg-red-900/30 p-3 rounded-md">{error}</p>}
                </div>

                <div className="lg:col-span-3 flex flex-col items-center justify-center">
                    <div
                        className="relative w-full aspect-square max-w-xl bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 cursor-pointer group"
                        onClick={() => setIsPreviewOpen(true)}
                        role="button"
                        aria-label="Nhấp để xem trước ảnh"
                    >
                        {isLoading && <Spinner />}
                        <img src={history[currentIndex]} alt={isOriginal ? 'Original' : `Edit ${currentIndex}`} className={`object-contain max-h-full max-w-full transition-all duration-300 ${isLoading ? 'opacity-30' : 'opacity-100'} group-hover:scale-105`} />
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {isOriginal ? 'Gốc' : `Chỉnh sửa ${currentIndex} / ${history.length - 1}`}
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 w-full max-w-xl">
                        <button onClick={() => handleNavigation('prev')} disabled={currentIndex === 0 || isLoading} className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ArrowLeftIcon className="w-5 h-5" /></button>
                        <button onClick={downloadImage} disabled={isLoading} className="flex-grow flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors">
                            <DownloadIcon className="w-4 h-4"/>
                            Tải xuống
                        </button>
                        <button onClick={() => handleNavigation('next')} disabled={currentIndex === history.length - 1 || isLoading} className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ArrowRightIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
            {isPreviewOpen && (
                <ImagePreviewModal imageUrl={history[currentIndex]} onClose={() => setIsPreviewOpen(false)} />
            )}
        </>
    );
};

export default Editor;