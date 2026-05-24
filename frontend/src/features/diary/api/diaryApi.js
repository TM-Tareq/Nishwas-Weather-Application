import axios from '@/lib/axios';

export const logEntry = async (data) => {
  const res = await axios.post('/diary/log', data);
  return res.data;
};

export const fetchMyDiary = async () => {
  const res = await axios.get('/diary/history');
  return res.data;
};

export const fetchTodayEntry = async () => {
  const res = await axios.get('/diary/today');
  return res.data;
};
