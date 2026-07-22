import React from 'react';
import { PartiesListPage } from './PartiesListPage';

export function SuppliersListPage() {
  return (
    <PartiesListPage
      fixedRoleFilter="supplier"
      pageTitle="دفتر تأمین‌کنندگان"
      pageDescription="مدیریت فروشندگان مواد اولیه، کالا و ارائه دهندگان خدمات تجاری"
    />
  );
}
