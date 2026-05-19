import { useState, useEffect } from 'react';

// Dhaka default — Bangladesh-focused fallback
const DHAKA = { lat: 23.8103, lon: 90.4125 };

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(DHAKA);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setIsLoading(false);
      },
      () => {
        // Permission denied or error — fall back to Dhaka
        setError('Location access denied. Showing Dhaka weather.');
        setLocation(DHAKA);
        setIsLoading(false);
      }
    );
  }, []);

  return { location, isLoading, error };
};

export default useGeolocation;
