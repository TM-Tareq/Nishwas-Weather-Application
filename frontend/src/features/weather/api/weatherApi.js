import axios from 'axios';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';
const API_KEY = import.meta.env.VITE_OWM_API_KEY;

export const fetchCurrentWeather = async ({ lat, lon }) => {
  const response = await axios.get(`${OWM_BASE}/weather`, {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'en' },
  });
  return response.data;
};

export const fetchAirQuality = async ({ lat, lon }) => {
  const response = await axios.get(`${OWM_BASE}/air_pollution`, {
    params: { lat, lon, appid: API_KEY },
  });
  return response.data;
};

export const fetchCitySearch = async (query) => {
  const response = await axios.get(`${GEO_BASE}/direct`, {
    params: { q: query, limit: 5, appid: API_KEY },
  });
  return response.data;
};

export const fetchForecast = async ({ lat, lon }) => {
  const response = await axios.get(`${OWM_BASE}/forecast`, {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'en' },
  });
  return response.data;
};

export const fetchAqiForecast = async ({ lat, lon }) => {
  const response = await axios.get(`${OWM_BASE}/air_pollution/forecast`, {
    params: { lat, lon, appid: API_KEY },
  });
  return response.data;
};
