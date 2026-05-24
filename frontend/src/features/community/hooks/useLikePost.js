import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost } from '../api/communityApi';

const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: likePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityFeed'] }),
  });
};

export default useLikePost;
