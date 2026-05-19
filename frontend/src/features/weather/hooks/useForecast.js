import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from '../api/weatherApi';

const useForecast = (location) => {
  return useQuery({
    queryKey: ['forecast', location?.lat, location?.lon],
    queryFn: () => fetchForecast(location),
    enabled: !!location,
  });
};

export default useForecast;
