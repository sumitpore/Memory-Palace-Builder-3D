import React, { useState, useEffect, useRef } from 'react';
import type { MemoryPalace, SavedMemoryPalace } from '../types';
import { SaveIcon, RegenerateIcon, EditIcon, CubeIcon } from './icons/ActionIcons';
import Tooltip from './Tooltip';
import ThreeDViewer from './ThreeDViewer';
import FullscreenViewer from './FullscreenViewer';

interface MemoryPalaceDisplayProps {
  palace: MemoryPalace | SavedMemoryPalace;
  onSavePalace: () => void;
  isJustSaved: boolean;
  isSaveable: boolean;
  onRegenerateImages: (editPrompt: string, selectedImageIndex: number, activeGenerationIndex: number) => Promise<void>;
  isRegenerating: boolean;
  onUpdateTitle: (newTitle: string) => void;
}

const BoldedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="text-blue-600 font-bold">
            {part.substring(2, part.length - 2)}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

const MAX_EDIT_PROMPT_LENGTH = 500;

const MemoryPalaceDisplay: React.FC<MemoryPalaceDisplayProps> = ({ 
  palace, 
  onSavePalace,
  isJustSaved,
  isSaveable,
  onRegenerateImages,
  isRegenerating,
  onUpdateTitle
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editPrompt, setEditPrompt] = useState('');
  const [activeGenerationIndex, setActiveGenerationIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(palace.title);
  const [editError, setEditError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const prevGenerationsLength = useRef(palace.imageGenerations?.length ?? 0);

  const hasGenerations = 'imageGenerations' in palace && palace.imageGenerations && palace.imageGenerations.length > 0;

  useEffect(() => {
    const currentLength = palace.imageGenerations?.length ?? 0;
    if (hasGenerations && currentLength > prevGenerationsLength.current) {
      // A new generation was added, so we jump to view it.
      const lastGenerationIndex = currentLength - 1;
      setActiveGenerationIndex(lastGenerationIndex);
      setSelectedImageIndex(0);
    }
    // Update the ref for the next render cycle.
    prevGenerationsLength.current = currentLength;
  }, [palace.imageGenerations, hasGenerations]);
  
  useEffect(() => {
    setEditableTitle(palace.title);
  }, [palace.title]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => editInputRef.current?.focus(), 100);
      setEditError(null);
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleThumbnailClick = (index: number) => {
    if (navigator.vibrate) navigator.vibrate(30);
    setSelectedImageIndex(index);
  };

  const handleEditRequest = (index: number) => {
    if (navigator.vibrate) navigator.vibrate(30);
    setSelectedImageIndex(index);
    setIsEditing(true);
  };
  
  const handlePrevGeneration = () => {
    if (activeGenerationIndex > 0) {
      if (navigator.vibrate) navigator.vibrate(30);
      setActiveGenerationIndex(activeGenerationIndex - 1);
      setSelectedImageIndex(0);
    }
  };

  const handleNextGeneration = () => {
    if (hasGenerations && activeGenerationIndex < palace.imageGenerations.length - 1) {
      if (navigator.vibrate) navigator.vibrate(30);
      setActiveGenerationIndex(activeGenerationIndex + 1);
      setSelectedImageIndex(0);
    }
  };

  const handleRegenerate = async () => {
    setEditError(null);
    const trimmedPrompt = editPrompt.trim();
  
    if (!trimmedPrompt || isRegenerating) return;

    if (trimmedPrompt.length > MAX_EDIT_PROMPT_LENGTH) {
      setEditError(`Prompt cannot exceed ${MAX_EDIT_PROMPT_LENGTH} characters.`);
      return;
    }
  
    await onRegenerateImages(trimmedPrompt, selectedImageIndex, activeGenerationIndex);
    setIsEditing(false);
    setEditPrompt('');
  };

  const handleTitleSave = () => {
    const trimmedTitle = editableTitle.trim();
    if (trimmedTitle && trimmedTitle !== palace.title) {
      onUpdateTitle(trimmedTitle);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditableTitle(palace.title);
      setIsEditingTitle(false);
    }
  };

  const handleCloseFullScreen = (lastIndex: number) => {
    setIsFullScreen(false);
    setSelectedImageIndex(lastIndex);
  };

  const currentImageSet = hasGenerations ? palace.imageGenerations[activeGenerationIndex] ?? [] : [];
  const selectedImageUrl = currentImageSet[selectedImageIndex] || '';

  return (
    <>
      <div className="mt-10 space-y-10 animate-fade-in">
        <div className="text-center">
          {isEditingTitle ? (
            <div className="flex justify-center items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-3xl sm:text-4xl font-bold text-gray-900 bg-gray-100 border-2 border-blue-500 rounded-lg p-2 text-center w-full max-w-lg"
                aria-label="Edit palace title"
              />
            </div>
          ) : (
            <div 
              className="group relative inline-flex items-center justify-center gap-3 cursor-pointer p-2"
              onClick={() => setIsEditingTitle(true)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsEditingTitle(true); }}
              role="button"
              aria-label={`Current title: ${palace.title}. Click to edit.`}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {palace.title}
              </h2>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-8 flex items-center h-full">
                <EditIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          )}
        </div>

        <div>
          {hasGenerations && (
            <>
              {palace.imageGenerations.length > 1 && (
                <div className="mb-4 flex items-center justify-center gap-4 text-center">
                  <button
                    onClick={handlePrevGeneration}
                    disabled={activeGenerationIndex === 0}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous image set"
                  >
                    &larr; Previous
                  </button>
                  <div className="text-sm font-medium text-gray-600 tabular-nums">
                    Version {activeGenerationIndex + 1} of {palace.imageGenerations.length}
                  </div>
                  <button
                    onClick={handleNextGeneration}
                    disabled={activeGenerationIndex === palace.imageGenerations.length - 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next image set"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                {selectedImageUrl ? (
                   <img src={selectedImageUrl} alt={`Memory Palace - Version ${activeGenerationIndex + 1}, Variation ${selectedImageIndex + 1}`} className="w-full h-auto aspect-square object-cover bg-gray-200" />
                ) : (
                  <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">Loading image...</p>
                  </div>
                )}

                {!isEditing && (
                  <>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 group">
                      <button
                        onClick={() => setIsFullScreen(true)}
                        className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg text-white font-semibold hover:bg-black hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
                        aria-label="View in 3D"
                      >
                        <CubeIcon className="w-5 h-5" />
                        View in 3D
                      </button>
                      <Tooltip text="Explore this scene in an immersive 3D view." position="top" />
                    </div>

                    <div className="absolute top-4 right-4 group">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-white/80 backdrop-blur-sm p-3 rounded-full text-gray-800 hover:bg-white hover:scale-110 transition-all duration-200 shadow-md"
                        aria-label="Edit this image"
                      >
                        <EditIcon className="w-6 h-6" />
                      </button>
                      <Tooltip text="Suggest changes to this image using a text prompt." position="left" />
                    </div>
                  </>
                )}

                {isEditing && (
                  <div 
                      className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-lg p-4 animate-fade-in-down"
                  >
                    <div className="max-w-xl mx-auto">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-100">Describe your changes:</h4>
                          <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                      </div>
                      <textarea
                          ref={editInputRef}
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="e.g., 'Add a small red car on the desk'"
                          rows={2}
                          maxLength={MAX_EDIT_PROMPT_LENGTH}
                          className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-base text-white"
                          aria-label="Image edit instructions"
                      />
                      <div className="flex justify-between items-center mt-1 px-1">
                          <p className="text-xs text-red-400 flex-grow">{editError || ''}</p>
                          <p className="text-xs text-gray-400">{editPrompt.length} / {MAX_EDIT_PROMPT_LENGTH}</p>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-200 bg-white/10 rounded-md hover:bg-white/20 border border-gray-600 transition-colors">Cancel</button>
                          <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating || !editPrompt.trim()}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                          >
                              {isRegenerating ? (
                                  <>
                                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Working...
                                  </>
                              ) : (
                                  <>
                                      <RegenerateIcon className="w-5 h-5" />
                                      Regenerate
                                  </>
                              )}
                          </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentImageSet.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {currentImageSet.map((url, index) => (
                    <div key={`${activeGenerationIndex}-${index}`} className="relative group">
                      <button
                        onClick={() => handleThumbnailClick(index)}
                        className={`w-full rounded-lg overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                          index === selectedImageIndex ? 'border-blue-600' : 'border-transparent'
                        }`}
                        aria-label={`Select image ${index + 1}`}
                      >
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                      <div className="absolute top-1.5 right-1.5 group/edit opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
                          <button
                            onClick={() => handleEditRequest(index)}
                            className="bg-white/70 backdrop-blur-sm p-1.5 rounded-full text-gray-700 hover:bg-white hover:text-indigo-600"
                            aria-label={`Edit image ${index + 1}`}
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <Tooltip text="Edit this image variation" position="top" groupName="edit" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-8">
          <div>
            <h3 className="text-2xl font-semibold mb-5 text-gray-900">Mnemonic Scenes</h3>
            <ol className="list-none space-y-6 text-gray-700">
              {palace.scenes.map((scene, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold">{index + 1}</div>
                  <div className="flex-grow pt-1">
                    <p className="font-semibold text-gray-800">{scene.locus}</p>
                    <p className="text-gray-600 mt-1">
                      <BoldedText text={scene.description} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h3 className="text-2xl font-semibold mb-5 text-gray-900">Quick Recap</h3>
            <ul className="space-y-4">
              {palace.quickRecap.map((recap, index) => (
                <li key={index} className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-6 h-6 mr-3 mt-0.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  <span className="text-gray-800">
                    <BoldedText text={recap.item} /> 
                    <span className="mx-2 text-gray-400">&rarr;</span>
                    <span className="text-gray-600 italic">{recap.locusHint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4">
          {isSaveable ? (
            <div className="flex justify-center">
              <div className="relative group">
                <button
                  onClick={onSavePalace}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <SaveIcon className="w-5 h-5" />
                  Save to My Palaces
                </button>
                <Tooltip text="Saves this palace to your browser for future use." position="top" />
              </div>
            </div>
          ) : isJustSaved && (
            <div className="text-center p-3 bg-green-100 text-green-800 rounded-lg border border-green-200 font-medium transition-all duration-300 animate-fade-in">
              Palace saved!
            </div>
          )}
        </div>
      </div>
      {isFullScreen && hasGenerations && (
        <FullscreenViewer
          images={currentImageSet}
          initialIndex={selectedImageIndex}
          onClose={handleCloseFullScreen}
        />
      )}
    </>
  );
};

export default MemoryPalaceDisplay;