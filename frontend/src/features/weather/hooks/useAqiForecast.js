import { useQuery } from '@tanstack/react-query';
import { fetchAqiForecast } from '../api/weatherApi';

const useAqiForecast = (location) => {
  return useQuery({
    queryKey: ['aqiForecast', location?.lat, location?.lon],
    queryFn: () => fetchAqiForecast(location),
    enabled: !!location,
    staleTime: 1000 * 60 * 30,
  });
};

export default useAqiForecast;
