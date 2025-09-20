import React from 'react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  groupName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, position = 'top', groupName }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-3 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-3 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-3 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-3 left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch(position) {
      case 'bottom':
        return 'border-x-transparent border-b-gray-900 -top-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'border-y-transparent border-l-gray-900 -right-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'border-y-transparent border-r-gray-900 -left-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'border-x-transparent border-t-gray-900 -bottom-2 left-1/2 -translate-x-1/2';
    }
  }

  const hoverClass = groupName ? `group-hover/${groupName}:opacity-100` : 'group-hover:opacity-100';

  return (
    <div
      role="tooltip"
      className={`absolute z-20 w-max max-w-xs px-3 py-2 text-sm font-normal text-white bg-gray-900 rounded-lg shadow-sm
                opacity-0 ${hoverClass} transition-opacity duration-300 pointer-events-none
                ${getPositionClasses()}`}
    >
      {text}
      <div className={`absolute w-0 h-0 border-8 ${getArrowClasses()}`} />
    </div>
  );
};

export default Tooltip;