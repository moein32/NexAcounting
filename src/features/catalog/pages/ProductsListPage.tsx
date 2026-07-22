import React from 'react';
import { ItemsListPage } from './ItemsListPage';

export function ProductsListPage() {
  return (
    <ItemsListPage
      forcedType="product"
      titleOverride="مدیریت کالاهای فیزیکی"
      subtitleOverride="فهرست کامل کالاهای فیزیکی قابل انبارداری، قیمت‌گذاری و سفارش‌دهی"
    />
  );
}
