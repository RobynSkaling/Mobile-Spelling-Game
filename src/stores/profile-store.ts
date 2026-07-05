import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  id: string;
  name: string;
  avatar: string;
}

interface ProfileState {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (profile) => {
    set({ profile });
    AsyncStorage.setItem('profile', JSON.stringify(profile));
  },
  clearProfile: () => {
    set({ profile: null });
    AsyncStorage.removeItem('profile');
  },
}));
