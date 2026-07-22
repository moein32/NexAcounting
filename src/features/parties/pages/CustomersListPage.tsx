import React from 'react';
import { PartiesListPage } from './PartiesListPage';

export function CustomersListPage() {
  return (
    <PartiesListPage
      fixedRoleFilter="customer"
      pageTitle="دفتر مشتریان"
      pageDescription="مدیریت، خریدارها، سقف اعتبار و سوابق مشتریان حقیقی و حقوقی"
    />
  );
}
