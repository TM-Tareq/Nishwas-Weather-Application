import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinEvent } from '../api/communityApi';

const useJoinEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityEvents'] }),
  });
};

export default useJoinEvent;
