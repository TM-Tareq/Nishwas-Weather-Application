import { useQuery } from '@tanstack/react-query';
import { fetchFeed } from '../api/communityApi';

const useFeed = () =>
  useQuery({
    queryKey: ['communityFeed'],
    queryFn: fetchFeed,
    staleTime: 60_000,
  });

export default useFeed;
