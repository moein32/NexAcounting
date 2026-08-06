import { NavItem } from '../types';

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    title: 'داشبورد',
    path: '/dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    title: 'فروش',
    path: '/sales',
    iconName: 'ShoppingCart',
    children: [
      { title: 'همه فاکتورهای فروش', path: '/sales/invoices' },
      { title: 'پیش‌فاکتورها', path: '/sales/quotations' },
      { title: 'برگشت از فروش', path: '/sales/returns' },
    ],
  },
  {
    title: 'خرید',
    path: '/purchases',
    iconName: 'ShoppingBag',
    children: [
      { title: 'فاکتورهای خرید', path: '/purchases/invoices' },
      { title: 'برگشت از خرید', path: '/purchases/returns' },
    ],
  },
  {
    title: 'طرف‌های حساب',
    path: '/parties',
    iconName: 'Users',
    children: [
      { title: 'همه طرف‌های حساب', path: '/parties' },
      { title: 'دفتر مشتریان', path: '/parties/customers' },
      { title: 'دفتر تأمین‌کنندگان', path: '/parties/suppliers' },
      { title: 'ثبت طرف حساب جدید', path: '/parties/new' },
    ],
  },
  {
    title: 'کالا و خدمات',
    path: '/items',
    iconName: 'Package',
    children: [
      { title: 'همه کالاها و خدمات', path: '/items' },
      { title: 'لیست کالاها', path: '/items/products' },
      { title: 'لیست خدمات', path: '/items/services' },
      { title: 'تعریف کالا / خدمت جدید', path: '/items/new' },
      { title: 'دسته‌بندی کالا و خدمات', path: '/items/categories' },
      { title: 'واحدهای اندازه‌گیری', path: '/items/units' },
      { title: 'لیست‌های قیمت', path: '/items/price-lists' },
    ],
  },
  {
    title: 'انبارداری',
    path: '/inventory',
    iconName: 'Warehouse',
    children: [
      { title: 'داشبورد انبار', path: '/inventory' },
      { title: 'مدیریت انبارها', path: '/inventory/warehouses' },
      { title: 'گردش کالا (کاردکس)', path: '/inventory/transactions' },
      { title: 'کمبود موجودی', path: '/inventory/low-stock' },
      { title: 'انبارگردانی', path: '/inventory/stock-count' },
    ],
  },
  {
    title: 'خزانه و صندوق',
    path: '/treasury',
    iconName: 'Landmark',
    children: [
      { title: 'دریافت‌ها', path: '/treasury/receipts' },
      { title: 'پرداخت‌ها', path: '/treasury/payments' },
      { title: 'حساب‌های بانکی و صندوق', path: '/treasury/accounts' },
    ],
  },
  {
    title: 'مدیریت چک‌ها',
    path: '/checks',
    iconName: 'CreditCard',
    children: [
      { title: 'چک‌های دریافتی', path: '/checks/received' },
      { title: 'چک‌های پرداختی', path: '/checks/issued' },
    ],
  },
  {
    title: 'حسابداری دوبل',
    path: '/accounting',
    iconName: 'Calculator',
    children: [
      { title: 'کدینگ و درخت حساب‌ها', path: '/accounting/chart' },
      { title: 'دفتر روزنامه', path: '/accounting/journal' },
      { title: 'دفتر کل', path: '/accounting/ledger' },
    ],
  },
  {
    title: 'گزارش‌های مالی',
    path: '/reports',
    iconName: 'BarChart3',
  },
  {
    title: 'مرکز ورودی و خروجی',
    path: '/export-center',
    iconName: 'Database',
  },
  {
    title: 'تنظیمات سیستم',
    path: '/settings',
    iconName: 'Settings',
  },
];

export const BOTTOM_NAV_ITEMS = [
  { title: 'خانه', path: '/dashboard', iconName: 'Home' },
  { title: 'فروش', path: '/sales', iconName: 'ShoppingCart' },
  { title: 'فاکتور جدید', path: '/sales/invoices', iconName: 'FilePlus', isPrimary: true },
  { title: 'خزانه', path: '/treasury', iconName: 'Landmark' },
  { title: 'بیشتر', path: '/settings', iconName: 'Menu' },
];
