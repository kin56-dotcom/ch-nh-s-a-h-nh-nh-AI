
import React, { useState } from 'react';
import type { ImageState } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Editor from './components/Editor';

const App: React.FC = () => {
  const [image, setImage] = useState<ImageState | null>(null);

  const handleImageUpload = (uploadedImage: ImageState): void => {
    setImage(uploadedImage);
  };

  const handleReset = (): void => {
    setImage(null);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col antialiased">
      <Header onReset={image ? handleReset : undefined} />
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full h-full max-w-7xl mx-auto flex items-center justify-center">
          {!image ? (
            <ImageUploader onImageUpload={handleImageUpload} />
          ) : (
            <Editor originalImage={image} onImageChange={handleImageUpload} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
