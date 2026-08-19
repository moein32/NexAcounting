import { create } from 'zustand';
import { BusinessInfo, UserProfile } from '../types';

interface AppState {
  currentBusiness: BusinessInfo;
  currentUser: UserProfile;
  businesses: BusinessInfo[];
  
  setCurrentBusiness: (business: BusinessInfo) => void;
  updateCurrentUser: (user: Partial<UserProfile>) => void;
}

const defaultUser: UserProfile = {
  id: 'usr_1',
  name: 'علی محمدی',
  role: 'مدیر ارشد مالی',
  email: 'ali.mohammadi@nexjib.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
};

const defaultBusinesses: BusinessInfo[] = [
  {
    id: 'biz_1',
    name: 'شرکت فناوری نوین پرداز (سهامی خاص)',
    code: 'NX-9042',
    currency: 'تومان',
    taxId: '10320847120',
    fiscalYear: '۱۴۰۳',
  },
  {
    id: 'biz_2',
    name: 'بازرگانی پارس گستر',
    code: 'NX-1102',
    currency: 'تومان',
    fiscalYear: '۱۴۰۳',
  },
];

export const useAppStore = create<AppState>((set) => ({
  currentBusiness: defaultBusinesses[0],
  currentUser: defaultUser,
  businesses: defaultBusinesses,

  setCurrentBusiness: (business) => set({ currentBusiness: business }),
  updateCurrentUser: (userUpdate) =>
    set((state) => ({
      currentUser: { ...state.currentUser, ...userUpdate },
    })),
}));
