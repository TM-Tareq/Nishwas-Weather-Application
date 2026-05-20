import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postCheckIn } from '../api/statsApi';

// Calls check-in once per app session (backend is idempotent — won't double-award)
const useCheckIn = () => {
  const queryClient = useQueryClient();
  const attempted = useRef(false);

  const { mutate } = useMutation({
    mutationFn: postCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    mutate();
  }, [mutate]);
};

export default useCheckIn;
