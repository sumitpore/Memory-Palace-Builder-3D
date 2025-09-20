import React from 'react';
import type { SavedMemoryPalace } from '../types';
import { ViewIcon, DeleteIcon } from './icons/ActionIcons';

interface SavedPalacesProps {
  palaces: SavedMemoryPalace[];
  onLoad: (palace: SavedMemoryPalace) => void;
  onDelete: (id: number) => void;
}

const SavedPalaces: React.FC<SavedPalacesProps> = ({ palaces, onLoad, onDelete }) => {
  return (
    <div 
      className="absolute top-20 right-4 sm:right-6 lg:right-10 z-40 w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl animate-fade-in-down"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="saved-palaces-button"
    >
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Saved Palaces</h2>
      </div>
      
      {palaces.length === 0 ? (
        <p className="text-center text-gray-500 p-6">You have no saved palaces.</p>
      ) : (
        <ul className="divide-y divide-gray-100 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {palaces.map((palace) => (
            <li key={palace.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{palace.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Saved: {new Date(palace.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => onLoad(palace)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-center text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:outline-none focus:ring-blue-300 transition-colors"
                    aria-label={`View ${palace.title}`}
                  >
                    <ViewIcon className="w-4 h-4" /> View
                  </button>
                  <button
                    onClick={() => onDelete(palace.id)}
                    className="inline-flex items-center justify-center p-2 text-sm font-medium text-gray-500 bg-white rounded-md border border-gray-300 hover:bg-gray-100 hover:text-red-600 focus:z-10 focus:ring-2 focus:ring-red-500 focus:text-red-600 transition-colors"
                    aria-label={`Delete ${palace.title}`}
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedPalaces;