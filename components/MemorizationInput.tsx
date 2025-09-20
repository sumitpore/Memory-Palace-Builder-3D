import React, { useState } from 'react';
import { CloseIcon } from './icons/ActionIcons';
import Tooltip from './Tooltip';

interface MemorizationInputProps {
  list: string;
  onListChange: (newList: string) => void;
  maxLength: number;
}

const SingleItemIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const BulkEditIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);


const MemorizationInput: React.FC<MemorizationInputProps> = ({ list, onListChange, maxLength }) => {
  const [mode, setMode] = useState<'bulk' | 'single'>('bulk');
  const [singleItem, setSingleItem] = useState('');
  const [error, setError] = useState<string | null>(null);

  const items = list.split('\n').filter(item => item.trim() !== '');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedItem = singleItem.trim();
    
    if (!trimmedItem) return;
    
    if (items.map(i => i.toLowerCase()).includes(trimmedItem.toLowerCase())) {
      setError('This item is already in the list.');
      return;
    }
    
    const newList = [...items, trimmedItem].join('\n');
    if (newList.length > maxLength) {
      setError(`The list has exceeded the maximum length of ${maxLength} characters.`);
      return;
    }

    onListChange(newList);
    setSingleItem('');
  };

  const handleRemoveItem = (indexToRemove: number) => {
    const newItems = items.filter((_, index) => index !== indexToRemove);
    onListChange(newItems.join('\n'));
  };

  const tabClass = (tabMode: 'bulk' | 'single') => 
    `w-full flex-1 py-2 px-3 text-sm font-medium text-center rounded-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        mode === tabMode 
          ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
          : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="space-y-3">
      <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
        <div className="relative group flex-1">
          <button onClick={() => setMode('bulk')} className={tabClass('bulk')}>
            <BulkEditIcon className="w-5 h-5" /> Bulk Edit
          </button>
          <Tooltip text="Paste your full list here, with each item on a new line." position="bottom" />
        </div>
        <div className="relative group flex-1">
          <button onClick={() => setMode('single')} className={tabClass('single')}>
            <SingleItemIcon className="w-5 h-5" /> Single Item
          </button>
          <Tooltip text="Add items to your list one by one." position="bottom" />
        </div>
      </div>

      <div>
        {mode === 'bulk' ? (
          <div>
            <textarea
              value={list}
              onChange={(e) => onListChange(e.target.value)}
              placeholder="Enter each item on a new line..."
              rows={6}
              maxLength={maxLength}
              className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-base"
              aria-label="Bulk edit list of items"
            />
            <div className="text-right text-sm text-gray-500 pr-1 mt-1">
              <span>{list.length} / {maxLength} chars</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                type="text"
                value={singleItem}
                onChange={(e) => {
                  setSingleItem(e.target.value);
                  setError(null);
                }}
                placeholder="Add a new item..."
                className="flex-grow p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                aria-label="Add single item to list"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!singleItem.trim()}
                aria-label="Add item"
              >
                Add
              </button>
            </form>
            {error && <p className="text-sm text-red-600 px-1">{error}</p>}
            
            <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-2 min-h-[140px] max-h-[250px] overflow-y-auto">
              {items.length > 0 ? (
                <ul className="space-y-1">
                  {items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200/60 group">
                      <span className="text-gray-800 break-all">{item}</span>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        aria-label={`Remove ${item}`}
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm py-10">
                  Your list is empty. Add items above.
                </div>
              )}
            </div>
             <div className="text-right text-sm text-gray-500 pr-1">
                <span>{list.length} / {maxLength} chars</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemorizationInput;
