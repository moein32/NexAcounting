export interface MobileNavItem {
  id: string;
  title: string;
  path: string;
  iconName: string;
  isPrimary?: boolean;
  badgeCount?: number;
}

export const MOBILE_BOTTOM_NAV_ITEMS: MobileNavItem[] = [
  {
    id: 'home',
    title: 'خانه',
    path: '/dashboard',
    iconName: 'Home',
  },
  {
    id: 'sales',
    title: 'فروش',
    path: '/sales',
    iconName: 'ShoppingCart',
  },
  {
    id: 'inventory',
    title: 'انبار',
    path: '/inventory',
    iconName: 'Warehouse',
  },
  {
    id: 'treasury',
    title: 'خزانه',
    path: '/treasury',
    iconName: 'Landmark',
  },
  {
    id: 'more',
    title: 'بیشتر',
    path: '#drawer',
    iconName: 'Menu',
  },
];

export const MOBILE_DRAWER_SECTIONS = [
  {
    title: 'عملیات مالی و بازرگانی',
    items: [
      { title: 'داشبورد مدیریتی', path: '/dashboard', iconName: 'LayoutDashboard' },
      { title: 'فروش و فاکتورها', path: '/sales/invoices', iconName: 'ShoppingCart' },
      { title: 'خرید و تامین‌کنندگان', path: '/purchases/invoices', iconName: 'ShoppingBag' },
      { title: 'اشخاص و طرف‌های حساب', path: '/parties', iconName: 'Users' },
      { title: 'کالاها و خدمات', path: '/items', iconName: 'Package' },
      { title: 'انبارداری و گردش کالا', path: '/inventory', iconName: 'Warehouse' },
      { title: 'خزانه، صندوق و بانک', path: '/treasury/receipts', iconName: 'Landmark' },
      { title: 'مدیریت چک‌های صیادی', path: '/checks/received', iconName: 'CreditCard' },
      { title: 'حسابداری دوبل و اسناد', path: '/accounting/journal', iconName: 'Calculator' },
    ],
  },
  {
    title: 'گزارش‌ها و سیستم',
    items: [
      { title: 'گزارش‌های جامع مالی', path: '/reports', iconName: 'BarChart3' },
      { title: 'ورودی و خروجی اکسل/PDF', path: '/export-center', iconName: 'Database' },
      { title: 'تنظیمات و پشتیبان‌گیری', path: '/settings', iconName: 'Settings' },
    ],
  },
];
