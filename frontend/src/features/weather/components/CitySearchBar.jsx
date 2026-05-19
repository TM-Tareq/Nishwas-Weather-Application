import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { fetchCitySearch } from '../api/weatherApi';

const CitySearchBar = ({ onCitySelect }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Search only when query is at least 2 characters
  const { data: results, isLoading } = useQuery({
    queryKey: ['citySearch', query],
    queryFn: () => fetchCitySearch(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    onCitySelect({ lat: city.lat, lon: city.lon, name: city.name, country: city.country });
    setQuery(`${city.name}, ${city.country}`);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Search city..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {showDropdown && results && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {results.map((city, index) => (
            <li key={index}>
              <button
                onClick={() => handleSelect(city)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-brand-50 transition-colors"
              >
                <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{city.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{city.state ? `${city.state}, ` : ''}{city.country}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && query.length >= 2 && results && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3">
          <p className="text-sm text-gray-500">No cities found.</p>
        </div>
      )}
    </div>
  );
};

export default CitySearchBar;
