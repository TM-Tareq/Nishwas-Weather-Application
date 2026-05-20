import axiosInstance from '@/lib/axios';

export const postCheckIn    = ()     => axiosInstance.post('/stats/checkin').then(r => r.data);
export const fetchMyStats   = ()     => axiosInstance.get('/stats/me').then(r => r.data);
export const fetchLeaderboard = ()   => axiosInstance.get('/stats/leaderboard').then(r => r.data);
