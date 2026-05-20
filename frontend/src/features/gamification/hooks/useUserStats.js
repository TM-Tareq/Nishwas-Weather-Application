import { useQuery } from '@tanstack/react-query';
import { fetchMyStats } from '../api/statsApi';

const useUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: fetchMyStats,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });
};

export default useUserStats;
