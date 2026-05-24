import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../api/communityApi';

const useEvents = () =>
  useQuery({
    queryKey: ['communityEvents'],
    queryFn: fetchEvents,
    staleTime: 60_000,
  });

export default useEvents;
