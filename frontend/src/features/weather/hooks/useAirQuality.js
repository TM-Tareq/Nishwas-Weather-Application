import { useQuery } from '@tanstack/react-query';
import { fetchAirQuality } from '../api/weatherApi';

const useAirQuality = (location) => {
  return useQuery({
    queryKey: ['airQuality', location?.lat, location?.lon],
    queryFn: () => fetchAirQuality(location),
    enabled: !!location,
  });
};

export default useAirQuality;
