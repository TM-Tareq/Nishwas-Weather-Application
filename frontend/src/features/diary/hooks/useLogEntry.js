import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logEntry } from '../api/diaryApi';

export const useLogEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diary'] }),
  });
};
