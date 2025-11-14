import { create } from 'zustand';

interface UpgradeModalStore {
  isOpen: boolean;
  reason: 'limit_reached' | 'manual' | 'feature_locked';
  lockedFeature?: string;
  openModal: (reason?: 'limit_reached' | 'manual' | 'feature_locked', lockedFeature?: string) => void;
  closeModal: () => void;
}

export const useUpgradeModalStore = create<UpgradeModalStore>((set) => ({
  isOpen: false,
  reason: 'manual',
  lockedFeature: undefined,
  openModal: (reason = 'manual', lockedFeature) =>
    set({ isOpen: true, reason, lockedFeature }),
  closeModal: () =>
    set({ isOpen: false, lockedFeature: undefined }),
}));
