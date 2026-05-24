import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProfileStore = create(
  persist(
    (set) => ({
      healthProfile: 'general',
      occupation: 'indoor',
      photoUrl: null,
      aqiThreshold: 3,
      setHealthProfile: (v) => set({ healthProfile: v }),
      setOccupation: (v) => set({ occupation: v }),
      setPhotoUrl: (url) => set({ photoUrl: url }),
      setAqiThreshold: (v) => set({ aqiThreshold: v }),
    }),
    { name: 'nishwas-profile' }
  )
);

export default useProfileStore;
