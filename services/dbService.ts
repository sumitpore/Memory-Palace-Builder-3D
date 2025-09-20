import type { SavedMemoryPalace } from '../types';

const DB_NAME = 'MemoryPalaceDB';
const STORE_NAME = 'palaces';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", (event.target as IDBOpenDBRequest).error);
      reject('Error opening database. Please ensure your browser supports IndexedDB and is not in private/incognito mode.');
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const savePalace = async (palace: SavedMemoryPalace): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put(palace);
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error("Error saving palace:", (event.target as IDBRequest).error);
      reject('Could not save the palace to the database.');
    };
  });
};

export const getSavedPalaces = async (): Promise<SavedMemoryPalace[]> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const sortedPalaces = request.result.sort((a, b) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
      resolve(sortedPalaces);
    };
    request.onerror = (event) => {
      console.error("Error fetching palaces:", (event.target as IDBRequest).error);
      reject('Could not retrieve saved palaces from the database.');
    };
  });
};

export const deletePalace = async (id: number): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error("Error deleting palace:", (event.target as IDBRequest).error);
      reject('Could not delete the palace from the database.');
    };
  });
};
