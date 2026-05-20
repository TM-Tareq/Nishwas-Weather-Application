import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProfileStore = create(
  persist(
    (set) => ({
      healthProfile: 'general',
      occupation: 'indoor',
      setHealthProfile: (v) => set({ healthProfile: v }),
      setOccupation: (v) => set({ occupation: v }),
    }),
    { name: 'nishwas-profile' }
  )
);

export default useProfileStore;
