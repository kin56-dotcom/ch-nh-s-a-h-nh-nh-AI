import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
      <div className="w-12 h-12 border-4 border-t-indigo-400 border-r-indigo-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-semibold text-white">Đang tạo ảnh của bạn...</p>
    </div>
  );
};

export default Spinner;