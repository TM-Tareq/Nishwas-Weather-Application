import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../api/communityApi';

const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityFeed'] }),
  });
};

export default useCreatePost;
