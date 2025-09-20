import React from 'react';
import type { AnchorType, AnchorValue } from '../types';
import { UploadIcon, WorldIcon, DefaultIcon } from './icons/InputIcons';
import Tooltip from './Tooltip';

declare global {
  interface Window {
    google: any;
    initPlacesAutocomplete?: () => void;
  }
}
interface AnchorInputProps {
  anchorType: AnchorType;
  setAnchorType: (type: AnchorType) => void;
  anchorValue: AnchorValue;
  setAnchorValue: (value: AnchorValue) => void;
  maxLength: number;
}

const defaultOptions = ['A cozy desk', 'The inside of a car', 'A trusty backpack'];

const famousPlaces = [
  'Utsav Chowk, Kharghar',
  'Eiffel Tower, Paris',
  'Statue of Liberty, New York',
  'The Colosseum, Rome',
  'Great Wall of China',
  'Taj Mahal, Agra',
  'Sydney Opera House',
  'Pyramids of Giza',
  'Machu Picchu, Peru',
  'Burj Khalifa, Dubai',
  'Times Square, New York',
  'Buckingham Palace, London',
  'Golden Gate Bridge, San Francisco',
  'Christ the Redeemer, Rio de Janeiro',
  'Mount Fuji, Japan',
  'Stonehenge, UK',
  'Niagara Falls',
  'The Louvre Museum, Paris',
  'Red Square, Moscow',
  'Petra, Jordan',
];

const AnchorInput: React.FC<AnchorInputProps> = ({ anchorType, setAnchorType, anchorValue, setAnchorValue, maxLength }) => {
  const placeInputRef = React.useRef<HTMLInputElement>(null);
  const isAutocompleteInitialized = React.useRef(false);
  
  const mapsApiKey = process.env.MAPS_API_KEY;

  React.useEffect(() => {
    if (anchorType !== 'place' || !mapsApiKey) {
      isAutocompleteInitialized.current = false;
      return;
    }

    const initAutocomplete = () => {
      if (!placeInputRef.current || !window.google || isAutocompleteInitialized.current) {
        return;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        placeInputRef.current,
        { 
          types: ['geocode', 'establishment'],
          fields: ['name', 'formatted_address'] 
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place) {
          setAnchorValue(place.name || place.formatted_address || '');
        }
      });
      isAutocompleteInitialized.current = true;
    };

    if (!window.google?.maps?.places) {
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        window.initPlacesAutocomplete = initAutocomplete;
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places&callback=initPlacesAutocomplete`;
        document.head.appendChild(script);
      }
    } else {
      initAutocomplete();
    }

    return () => {
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => container.remove());
    };
  }, [anchorType, setAnchorValue, mapsApiKey]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnchorValue(e.target.files[0]);
    }
  };

  const handleTabClick = (type: AnchorType) => {
    setAnchorType(type);
    if (type === 'place') {
      setAnchorValue(mapsApiKey ? '' : famousPlaces[0]);
    }
    else if (type === 'default') setAnchorValue(defaultOptions[0]);
    else if (type === 'upload') setAnchorValue(null);
  }

  const tabClass = (type: AnchorType) => 
    `w-full flex-1 py-2.5 px-3 text-sm font-medium text-center rounded-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        anchorType === type 
          ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
          : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
        <div className="relative group flex-1">
          <button onClick={() => handleTabClick('default')} className={tabClass('default')}><DefaultIcon className="w-5 h-5"/>Defaults</button>
          <Tooltip text="Use a common, pre-defined object as an anchor." position="bottom" />
        </div>
        <div className="relative group flex-1">
          <button onClick={() => handleTabClick('place')} className={tabClass('place')}>
            <WorldIcon className="w-5 h-5"/>Real Place
          </button>
          <Tooltip text="Use a real-world location from Google Maps as an anchor." position="bottom" />
        </div>
        <div className="relative group flex-1">
          <button onClick={() => handleTabClick('upload')} className={tabClass('upload')}><UploadIcon className="w-5 h-5"/>Upload</button>
          <Tooltip text="Upload your own image to use as an anchor." position="bottom" />
        </div>
      </div>

      <div className="pt-2">
        {anchorType === 'default' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {defaultOptions.map(opt => (
              <button 
                key={opt}
                onClick={() => setAnchorValue(opt)}
                className={`p-3 rounded-lg text-sm transition-all duration-200 text-center border ${anchorValue === opt ? 'bg-blue-600 text-white font-semibold border-blue-600' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {anchorType === 'place' && (
          <div className="space-y-1">
            {mapsApiKey ? (
              <>
                <input
                  ref={placeInputRef}
                  type="text"
                  value={typeof anchorValue === 'string' ? anchorValue : ''}
                  onChange={(e) => setAnchorValue(e.target.value)}
                  placeholder="e.g., The Eiffel Tower"
                  maxLength={maxLength}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                />
                 <div className="text-right text-sm text-gray-500 pr-1">
                  {typeof anchorValue === 'string' ? anchorValue.length : 0} / {maxLength}
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-lg text-center mb-3">
                  As Google Maps API is not enabled on this project, using a limited list of famous places.
                </div>
                <select
                  value={typeof anchorValue === 'string' ? anchorValue : ''}
                  onChange={(e) => setAnchorValue(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {famousPlaces.map(place => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {anchorType === 'upload' && (
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors duration-300 bg-gray-50 hover:bg-blue-50">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadIcon className="w-8 h-8 text-gray-400"/>
              <p className="text-gray-600">
                {anchorValue instanceof File ? <span className="font-semibold text-blue-600">{anchorValue.name}</span> : 'Click or drag to upload an image'}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnchorInput;