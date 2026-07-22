import React from 'react';
import { ItemsListPage } from './ItemsListPage';

export function ServicesListPage() {
  return (
    <ItemsListPage
      forcedType="service"
      titleOverride="مدیریت خدمات"
      subtitleOverride="فهرست خدمات و سرویس‌های قابل ارائه (بدون کنترل موجودی انبار)"
    />
  );
}
