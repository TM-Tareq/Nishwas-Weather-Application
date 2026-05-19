import { useQuery } from '@tanstack/react-query';
import { fetchCurrentWeather } from '../api/weatherApi';

const useWeather = (location) => {
  return useQuery({
    queryKey: ['weather', location?.lat, location?.lon],
    queryFn: () => fetchCurrentWeather(location),
    enabled: !!location,
  });
};

export default useWeather;
