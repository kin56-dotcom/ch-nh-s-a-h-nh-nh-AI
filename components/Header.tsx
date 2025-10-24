import React from 'react';
import { EditIcon } from './Icons';

interface HeaderProps {
    onReset?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="w-full p-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
            <EditIcon className="w-7 h-7 text-indigo-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-100">Trình chỉnh sửa ảnh AI</h1>
        </div>
        {onReset && (
             <button
                onClick={onReset}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
            >
                Làm lại từ đầu
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;