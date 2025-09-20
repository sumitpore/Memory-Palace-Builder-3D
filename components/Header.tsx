import React from 'react';
import Tooltip from './Tooltip';

const BrainIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.75a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 01-.75-.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.858 16.932a8.963 8.963 0 01-3.716 0c-1.063.456-2.26.234-3.088-.592s-1.05-2.025-.592-3.088c.456-1.063 1.48-1.78 2.642-1.94 1.162-.16 2.382.16 3.328.744s1.733 1.48 1.94 2.642c.16 1.162-.16 2.382-.744 3.328z" />
    </svg>
);

const CollectionIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

interface HeaderProps {
  palaceCount: number;
  onToggleMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ palaceCount, onToggleMenu }) => {
  return (
    <div className="relative">
      <header className="text-center">
        <div className="inline-flex items-center justify-center gap-3">
          <BrainIcon className="w-10 h-10 text-blue-600"/>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            MemoryPalace Builder
          </h1>
        </div>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Turn any place, object, or photo into a powerful mnemonic device.
        </p>
      </header>
      
      {palaceCount > 0 && (
        <div className="absolute top-0 right-0">
          <div className="relative group">
            <button
              id="saved-palaces-button"
              onClick={onToggleMenu}
              className="relative p-3 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label={`View my ${palaceCount} saved palaces`}
            >
              <CollectionIcon className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {palaceCount}
              </span>
            </button>
            <Tooltip text={`View your ${palaceCount} saved palaces`} position="bottom" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
