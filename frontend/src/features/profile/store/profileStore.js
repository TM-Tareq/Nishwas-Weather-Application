import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProfileStore = create(
  persist(
    (set) => ({
      healthProfile: 'general',
      occupation: 'indoor',
      photoUrl: null,
      setHealthProfile: (v) => set({ healthProfile: v }),
      setOccupation: (v) => set({ occupation: v }),
      setPhotoUrl: (url) => set({ photoUrl: url }),
    }),
    { name: 'nishwas-profile' }
  )
);

export default useProfileStore;
