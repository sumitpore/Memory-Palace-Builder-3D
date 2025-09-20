import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { AnchorType, MemoryPalace, AnchorValue, SavedMemoryPalace } from './types';
import Header from './components/Header';
import AnchorInput from './components/AnchorInput';
import Loader from './components/Loader';
import MemoryPalaceDisplay from './components/MemoryPalaceDisplay';
import SavedPalaces from './components/SavedPalaces';
import MemorizationInput from './components/MemorizationInput';
import { generateMemoryPalace, regeneratePalace } from './services/geminiService';
import { fileToDataUrl, dataURLtoFile } from './utils/fileUtils';
import { getSavedPalaces, savePalace, deletePalace as dbDeletePalace } from './services/dbService';

const MAX_LIST_LENGTH = 5000;
const MAX_ANCHOR_LENGTH = 500;

const App: React.FC = () => {
  const [anchorType, setAnchorType] = useState<AnchorType>('default');
  const [anchorValue, setAnchorValue] = useState<AnchorValue>('A cozy desk');
  const [memorizationList, setMemorizationList] = useState<string>('Red\nGreen\nBlue');
  const [memoryPalace, setMemoryPalace] = useState<(MemoryPalace | SavedMemoryPalace) | null>(null);
  const [savedPalaces, setSavedPalaces] = useState<SavedMemoryPalace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [isPalaceMenuOpen, setIsPalaceMenuOpen] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPalaces = async () => {
      try {
        const storedPalaces = await getSavedPalaces();
        if (storedPalaces) {
          setSavedPalaces(storedPalaces);
        }
      } catch (error) {
        console.error("Failed to load saved palaces from IndexedDB", error);
        setError("Could not load saved palaces. Your browser might not support this feature or may be in private mode.");
      }
    };
    loadPalaces();
  }, []);

  useEffect(() => {
    if (memoryPalace && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [memoryPalace]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    const listItems = memorizationList.split('\n').filter(item => item.trim() !== '');

    if (!anchorValue || listItems.length === 0) {
      setError('Please provide an anchor and a list of items to memorize.');
      return;
    }
    if (memorizationList.length > MAX_LIST_LENGTH) {
      setError(`The list is too long. Please keep it under ${MAX_LIST_LENGTH} characters.`);
      return;
    }
    if (anchorType !== 'upload' && typeof anchorValue === 'string' && anchorValue.length > MAX_ANCHOR_LENGTH) {
      setError(`The anchor description is too long. Please keep it under ${MAX_ANCHOR_LENGTH} characters.`);
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setIsLoading(true);
    setMemoryPalace(null);
    setJustSaved(false);

    try {
      const valueToSend = typeof anchorValue === 'string' ? anchorValue.trim() : anchorValue;
      const result = await generateMemoryPalace(anchorType, valueToSend, listItems);
      setMemoryPalace(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  }, [anchorType, anchorValue, memorizationList]);

  const handleSavePalace = useCallback(async () => {
    if (memoryPalace && 'imageGenerations' in memoryPalace && !('id' in memoryPalace)) {
      try {
        let originalAnchorData: string;

        if (anchorType === 'upload' && anchorValue instanceof File) {
          originalAnchorData = await fileToDataUrl(anchorValue);
        } else {
          originalAnchorData = anchorValue as string;
        }

        const newSavedPalace: SavedMemoryPalace = {
          ...(memoryPalace as MemoryPalace),
          id: Date.now(),
          savedAt: new Date().toISOString(),
          anchorType: anchorType,
          originalAnchor: originalAnchorData,
        };
        
        await savePalace(newSavedPalace);
        setSavedPalaces(prev => [newSavedPalace, ...prev]);
        setMemoryPalace(newSavedPalace); 
        setJustSaved(true);
      } catch (err) {
        console.error("Failed to save palace:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while saving.");
      }
    }
  }, [memoryPalace, anchorType, anchorValue]);

  const handleRegenerateImages = useCallback(async (editPrompt: string, selectedImageIndex: number, activeGenerationIndex: number) => {
    if (!memoryPalace || !('imageGenerations' in memoryPalace) || !editPrompt.trim() || !memorizationList.trim()) {
      setError("Cannot regenerate without a palace, an image, an edit prompt, and a list of items.");
      return;
    }
    
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }

    setIsRegenerating(true);
    setError(null);
    setJustSaved(false);

    try {
      const baseImageUrl = memoryPalace.imageGenerations[activeGenerationIndex][selectedImageIndex];
      const listItems = memorizationList.split('\n').filter(item => item.trim() !== '');
      
      const regenerationResult = await regeneratePalace(baseImageUrl, editPrompt.trim(), listItems);

      setMemoryPalace(prev => {
        if (!prev) return null;
        
        const newGeneration = regenerationResult.imageGenerations?.[0];
        if (!newGeneration) return prev; // Safety check if image generation fails

        const newGenerations = [...prev.imageGenerations, newGeneration];

        const updatedPalace: MemoryPalace = {
          title: regenerationResult.title ?? prev.title,
          imageGenerations: newGenerations,
          scenes: regenerationResult.scenes ?? prev.scenes,
          quickRecap: regenerationResult.quickRecap ?? prev.quickRecap,
          imagePrompt: regenerationResult.imagePrompt ?? prev.imagePrompt,
        };
        return updatedPalace;
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during regeneration.');
    } finally {
      setIsRegenerating(false);
    }
  }, [memoryPalace, memorizationList]);

  const handleLoadPalace = useCallback((palaceToLoad: SavedMemoryPalace) => {
    setMemoryPalace(palaceToLoad);
    setJustSaved(false);

    // Sync form state with the loaded palace for better UX and state consistency
    const listFromPalace = palaceToLoad.quickRecap.map(item => item.item.replace(/\*\*/g, '')).join('\n');
    setMemorizationList(listFromPalace);
    setAnchorType(palaceToLoad.anchorType);

    if (palaceToLoad.anchorType === 'upload') {
      try {
        // Create a File object from the data URL to display its name in the UI.
        const fileName = `saved-anchor-${palaceToLoad.id}.png`;
        const file = dataURLtoFile(palaceToLoad.originalAnchor, fileName);
        setAnchorValue(file);
      } catch (error) {
        console.error("Failed to restore anchor image from saved data:", error);
        setAnchorValue(null);
      }
    } else {
      setAnchorValue(palaceToLoad.originalAnchor);
    }
  }, []);

  const handleLoadPalaceAndClose = useCallback((palaceToLoad: SavedMemoryPalace) => {
    handleLoadPalace(palaceToLoad);
    setIsPalaceMenuOpen(false);
  }, [handleLoadPalace]);

  const handleDeletePalace = async (idToDelete: number) => {
    if (window.confirm('Are you sure you want to delete this memory palace? This action cannot be undone.')) {
      try {
        await dbDeletePalace(idToDelete);
        setSavedPalaces(prev => prev.filter(p => p.id !== idToDelete));
        if (memoryPalace && 'id' in memoryPalace && memoryPalace.id === idToDelete) {
          setMemoryPalace(null);
        }
      } catch (err) {
          console.error("Failed to delete palace", err);
          setError(err instanceof Error ? err.message : "Failed to delete palace.");
      }
    }
  };
  
  const handleUpdateTitle = useCallback(async (newTitle: string) => {
    if (!memoryPalace || !newTitle.trim()) return;

    const updatedPalace = { ...memoryPalace, title: newTitle };
    setMemoryPalace(updatedPalace);

    if ('id' in updatedPalace) {
      try {
        await savePalace(updatedPalace);
        setSavedPalaces(prev => 
          prev.map(p => p.id === updatedPalace.id ? updatedPalace : p)
        );
      } catch (err) {
        console.error("Failed to update palace title:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while updating the title.");
        setMemoryPalace(memoryPalace); // Revert optimistic update on error
      }
    }
  }, [memoryPalace]);

  return (
    <>
      {isPalaceMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsPalaceMenuOpen(false)}
            aria-hidden="true"
          />
          <SavedPalaces
            palaces={savedPalaces}
            onLoad={handleLoadPalaceAndClose}
            onDelete={handleDeletePalace}
          />
        </>
      )}
      <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col items-center w-full p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-2xl mx-auto">
          <Header
            palaceCount={savedPalaces.length}
            onToggleMenu={() => setIsPalaceMenuOpen(prev => !prev)}
          />
          <main className="mt-10 space-y-10">
            <div className="space-y-8 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold text-lg">1</div>
                  <h2 className="text-xl font-semibold text-gray-900">Choose Your Palace Anchor</h2>
                </div>
                <AnchorInput 
                  anchorType={anchorType} 
                  setAnchorType={setAnchorType}
                  anchorValue={anchorValue}
                  setAnchorValue={setAnchorValue}
                  maxLength={MAX_ANCHOR_LENGTH}
                />
              </div>
              <hr className="border-gray-200" />
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold text-lg">2</div>
                  <h2 className="text-xl font-semibold text-gray-900">List Items to Memorize</h2>
                </div>
                <MemorizationInput
                  list={memorizationList}
                  onListChange={setMemorizationList}
                  maxLength={MAX_LIST_LENGTH}
                />
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={isLoading || isRegenerating}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Building...
                  </>
                ) : (
                  'Build My Memory Palace'
                )}
              </button>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500 max-w-lg mx-auto">
                <p>
                    <strong>Privacy & Security:</strong> Your anchor and list are sent to Google's Generative AI for processing. Avoid entering sensitive data. Saved palaces are stored locally and securely in your browser.
                </p>
            </div>
            
            <div ref={resultsRef}>
              {isLoading && <Loader />}
              {error && <div className="mt-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-center">{error}</div>}
              {memoryPalace && (
                <MemoryPalaceDisplay
                  palace={memoryPalace}
                  onSavePalace={handleSavePalace}
                  isJustSaved={justSaved}
                  isSaveable={'imageGenerations' in memoryPalace && !('id' in memoryPalace)}
                  onRegenerateImages={handleRegenerateImages}
                  isRegenerating={isRegenerating}
                  onUpdateTitle={handleUpdateTitle}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;