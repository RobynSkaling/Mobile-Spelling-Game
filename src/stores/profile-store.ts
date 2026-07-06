import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  id: string;
  name: string;
  avatar: string;
}

interface ProfileState {
  profile: Profile | null;
  isHydrated: boolean;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
  loadProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isHydrated: false,
  setProfile: (profile) => {
    set({ profile });
    AsyncStorage.setItem('profile', JSON.stringify(profile));
  },
  clearProfile: () => {
    set({ profile: null });
    AsyncStorage.removeItem('profile');
  },
  loadProfile: async () => {
    const stored = await AsyncStorage.getItem('profile');
    set({ profile: stored ? (JSON.parse(stored) as Profile) : null, isHydrated: true });
  },
}));
