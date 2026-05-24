import { useQuery } from '@tanstack/react-query';
import { fetchMyDiary } from '../api/diaryApi';

export const useMyDiary = () =>
  useQuery({
    queryKey: ['diary', 'history'],
    queryFn: fetchMyDiary,
  });
