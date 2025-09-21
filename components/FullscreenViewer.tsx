import React, { useState, useEffect, useCallback } from 'react';
import ThreeDViewer from './ThreeDViewer';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, MinusIcon } from './icons/ActionIcons';

interface FullscreenViewerProps {
  images: string[];
  initialIndex: number;
  onClose: (lastIndex: number) => void;
}

const MIN_ZOOM_FOV = 30;
const MAX_ZOOM_FOV = 100;
const ZOOM_STEP = 10;
const INITIAL_FOV = 30;

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomFov, setZoomFov] = useState(INITIAL_FOV);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);
  
  const handleClose = useCallback(() => {
    onClose(currentIndex);
  }, [onClose, currentIndex]);

  const handleZoomIn = useCallback(() => {
    setZoomFov(prev => Math.max(MIN_ZOOM_FOV, prev - ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomFov(prev => Math.min(MAX_ZOOM_FOV, prev + ZOOM_STEP));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
       if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      }
      if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
      // Note: Left/Right arrows are intentionally not used for image navigation
      // to avoid conflicting with the 3D viewer's camera controls.
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, handleZoomIn, handleZoomOut]);

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen Image Viewer"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Main content: Viewer */}
        <div className="w-full h-full flex items-center justify-center">
            <ThreeDViewer imageUrl={images[currentIndex]} zoomFov={zoomFov} />
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close fullscreen view"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Prev Button */}
        {images.length > 1 && (
            <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/70 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Previous image"
            >
            <ChevronLeftIcon className="w-8 h-8" />
            </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
            <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/70 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Next image"
            >
            <ChevronRightIcon className="w-8 h-8" />
            </button>
        )}
        
        {/* Zoom Controls */}
        <div className="absolute right-4 bottom-16 flex flex-col bg-black/40 rounded-lg shadow-lg">
            <button
              onClick={handleZoomIn}
              disabled={zoomFov <= MIN_ZOOM_FOV}
              className="p-2 text-white hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white rounded-t-lg"
              aria-label="Zoom in"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
            <div className="h-px bg-white/20"></div> {/* Separator */}
            <button
              onClick={handleZoomOut}
              disabled={zoomFov >= MAX_ZOOM_FOV}
              className="p-2 text-white hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white rounded-b-lg"
              aria-label="Zoom out"
            >
              <MinusIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full tabular-nums">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenViewer;