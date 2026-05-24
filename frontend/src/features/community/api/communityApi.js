import axiosInstance from '@/lib/axios';

//  Posts 

export const fetchFeed = () =>
  axiosInstance.get('/community/posts').then((r) => r.data);

export const createPost = (data) =>
  axiosInstance.post('/community/posts', data).then((r) => r.data);

export const likePost = (id) =>
  axiosInstance.post(`/community/posts/${id}/like`).then((r) => r.data);

//  Events 

export const fetchEvents = () =>
  axiosInstance.get('/community/events').then((r) => r.data);

export const createEvent = (data) =>
  axiosInstance.post('/community/events', data).then((r) => r.data);

export const joinEvent = (id) =>
  axiosInstance.post(`/community/events/${id}/join`).then((r) => r.data);
