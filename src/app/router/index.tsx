import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { NotFoundPage } from '../../components/common/NotFoundPage';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

// Auth Pages
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage';
import { SelectBusinessPage } from '../../features/auth/pages/SelectBusinessPage';

// Pages
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';

// Sales
import { SalesOverviewPage } from '../../features/sales/pages/SalesOverviewPage';
import { SalesInvoicesPage } from '../../features/sales/pages/SalesInvoicesPage';
import { SalesQuotationsPage } from '../../features/sales/pages/SalesQuotationsPage';
import { SalesReturnsPage } from '../../features/sales/pages/SalesReturnsPage';
import { SalesOrdersPage } from '../../features/sales/pages/SalesOrdersPage';
import { SalesCreatePage } from '../../features/sales/pages/SalesCreatePage';
import { SalesDetailPage } from '../../features/sales/pages/SalesDetailPage';

// Purchases
import { PurchasesOverviewPage } from '../../features/purchases/pages/PurchasesOverviewPage';
import { PurchaseInvoicesPage } from '../../features/purchases/pages/PurchaseInvoicesPage';
import { PurchaseReturnsPage } from '../../features/purchases/pages/PurchaseReturnsPage';
import { PurchaseOrdersPage } from '../../features/purchases/pages/PurchaseOrdersPage';
import { PurchaseCreatePage } from '../../features/purchases/pages/PurchaseCreatePage';
import { PurchaseDetailPage } from '../../features/purchases/pages/PurchaseDetailPage';

// Parties
import { PartiesListPage } from '../../features/parties/pages/PartiesListPage';
import { CustomersListPage } from '../../features/parties/pages/CustomersListPage';
import { SuppliersListPage } from '../../features/parties/pages/SuppliersListPage';
import { CreatePartyPage } from '../../features/parties/pages/CreatePartyPage';
import { EditPartyPage } from '../../features/parties/pages/EditPartyPage';
import { PartyDetailPage } from '../../features/parties/pages/PartyDetailPage';

// Catalog & Items Management
import { ProductsListPage } from '../../features/catalog/pages/ProductsListPage';
import { ServicesListPage } from '../../features/catalog/pages/ServicesListPage';
import { CreateItemPage } from '../../features/catalog/pages/CreateItemPage';
import { ItemDetailPage } from '../../features/catalog/pages/ItemDetailPage';
import { EditItemPage } from '../../features/catalog/pages/EditItemPage';
import { CategoriesPage } from '../../features/catalog/pages/CategoriesPage';
import { UnitsPage } from '../../features/catalog/pages/UnitsPage';
import { PriceListsPage } from '../../features/catalog/pages/PriceListsPage';

function ItemsCrashTest() {
  return (
    <div className="p-8">
      <h1>Items Runtime Test</h1>
      <p>Items route is working.</p>
    </div>
  );
}

// Legacy Products & Inventory
import { ProductsPage } from '../../features/products/pages/ProductsPage';
import { InventoryPage } from '../../features/inventory/pages/InventoryPage';
import { WarehousesPage } from '../../features/inventory/pages/WarehousesPage';
import { TransactionsPage } from '../../features/inventory/pages/TransactionsPage';
import { LowStockPage } from '../../features/inventory/pages/LowStockPage';
import { StockCountPage } from '../../features/inventory/pages/StockCountPage';

// Treasury
import { TreasuryOverviewPage } from '../../features/treasury/pages/TreasuryOverviewPage';
import { ReceiptsPage } from '../../features/treasury/pages/ReceiptsPage';
import { PaymentsPage } from '../../features/treasury/pages/PaymentsPage';
import { AccountsPage } from '../../features/treasury/pages/AccountsPage';

// Checks
import { ChecksOverviewPage } from '../../features/checks/pages/ChecksOverviewPage';
import { ChecksReceivedPage } from '../../features/checks/pages/ChecksReceivedPage';
import { ChecksIssuedPage } from '../../features/checks/pages/ChecksIssuedPage';

// Accounting
import { AccountingOverviewPage } from '../../features/accounting/pages/AccountingOverviewPage';
import { ChartOfAccountsPage } from '../../features/accounting/pages/ChartOfAccountsPage';
import { JournalPage } from '../../features/accounting/pages/JournalPage';
import { LedgerPage } from '../../features/accounting/pages/LedgerPage';

// Reports, Export Center & Settings
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { ExportCenterPage } from '../../features/export/pages/ExportCenterPage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Business Selection Route (Protected by Auth, but outside business check) */}
      <Route
        path="/select-business"
        element={
          <ProtectedRoute>
            <SelectBusinessPage />
          </ProtectedRoute>
        }
      />

      {/* Main Application Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Sales */}
        <Route path="/sales" element={<SalesOverviewPage />} />
        <Route path="/sales/invoices" element={<SalesInvoicesPage />} />
        <Route path="/sales/quotations" element={<SalesQuotationsPage />} />
        <Route path="/sales/orders" element={<SalesOrdersPage />} />
        <Route path="/sales/returns" element={<SalesReturnsPage />} />
        <Route path="/sales/new" element={<SalesCreatePage />} />
        <Route path="/sales/:id" element={<SalesDetailPage />} />

        {/* Purchases */}
        <Route path="/purchases" element={<PurchasesOverviewPage />} />
        <Route path="/purchases/invoices" element={<PurchaseInvoicesPage />} />
        <Route path="/purchases/orders" element={<PurchaseOrdersPage />} />
        <Route path="/purchases/returns" element={<PurchaseReturnsPage />} />
        <Route path="/purchases/new" element={<PurchaseCreatePage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailPage />} />

        {/* Parties */}
        <Route path="/parties" element={<PartiesListPage />} />
        <Route path="/parties/customers" element={<CustomersListPage />} />
        <Route path="/parties/suppliers" element={<SuppliersListPage />} />
        <Route path="/parties/new" element={<CreatePartyPage />} />
        <Route path="/parties/:id" element={<PartyDetailPage />} />
        <Route path="/parties/:id/edit" element={<EditPartyPage />} />

        {/* Catalog & Items Management */}
        <Route path="/items" element={<ItemsCrashTest />} />
        <Route path="/items/products" element={<ProductsListPage />} />
        <Route path="/items/services" element={<ServicesListPage />} />
        <Route path="/items/new" element={<CreateItemPage />} />
        <Route path="/items/categories" element={<CategoriesPage />} />
        <Route path="/items/units" element={<UnitsPage />} />
        <Route path="/items/price-lists" element={<PriceListsPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/items/:id/edit" element={<EditItemPage />} />

        {/* Legacy Products & Inventory */}
        <Route path="/products" element={<Navigate to="/items" replace />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/warehouses" element={<WarehousesPage />} />
        <Route path="/inventory/transactions" element={<TransactionsPage />} />
        <Route path="/inventory/low-stock" element={<LowStockPage />} />
        <Route path="/inventory/stock-count" element={<StockCountPage />} />

        {/* Treasury */}
        <Route path="/treasury" element={<TreasuryOverviewPage />} />
        <Route path="/treasury/receipts" element={<ReceiptsPage />} />
        <Route path="/treasury/payments" element={<PaymentsPage />} />
        <Route path="/treasury/accounts" element={<AccountsPage />} />

        {/* Checks */}
        <Route path="/checks" element={<ChecksOverviewPage />} />
        <Route path="/checks/received" element={<ChecksReceivedPage />} />
        <Route path="/checks/issued" element={<ChecksIssuedPage />} />

        {/* Accounting */}
        <Route path="/accounting" element={<AccountingOverviewPage />} />
        <Route path="/accounting/chart" element={<ChartOfAccountsPage />} />
        <Route path="/accounting/journal" element={<JournalPage />} />
        <Route path="/accounting/ledger" element={<LedgerPage />} />

        {/* Reports, Export Center & Settings */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/export-center" element={<ExportCenterPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

