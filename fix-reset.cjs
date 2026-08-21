const fs = require('fs');

const path = 'src/services/testEnvironmentService.ts';
const content = fs.readFileSync(path, 'utf8');

const regex = /async resetTestData\(targetBusinessId: string\): Promise<\{ deletedCount: number \}> \{[\s\S]*?^  \},/m;

const replacement = `async resetTestData(targetBusinessId: string): Promise<{ deletedCount: number }> {
    db.beginTransaction();
    try {
      let deletedCount = 0;

      // Identify parent records for this business
      const docs = db.queryByBusiness<any>('documents', targetBusinessId) || [];
      const docIds = new Set(docs.map((d) => d.id));
      
      const invDocs = db.queryByBusiness<any>('inventory_documents', targetBusinessId) || [];
      const invDocIds = new Set(invDocs.map((d) => d.id));

      const journals = db.queryByBusiness<any>('journal_entries', targetBusinessId) || [];
      const journalIds = new Set(journals.map((j) => j.id));

      const costLayers = db.queryByBusiness<any>('inventory_cost_layers', targetBusinessId) || [];
      const costLayerIds = new Set(costLayers.map((l) => l.id));

      const docItems = db.queryAll<any>('document_items').filter(di => docIds.has(di.document_id));
      const docItemIds = new Set(docItems.map(di => di.id));

      const receipts = db.queryByBusiness<any>('receipts', targetBusinessId) || [];
      const receiptIds = new Set(receipts.map(r => r.id));

      const payments = db.queryByBusiness<any>('payments', targetBusinessId) || [];
      const paymentIds = new Set(payments.map(p => p.id));

      // 1. Delete child records based on actual schema dependencies first
      const childTables: { table: keyof DBState; check: (r: any) => boolean }[] = [
        { table: 'document_items', check: (r) => docIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'inventory_document_items', check: (r) => invDocIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'inventory_transactions', check: (r) => docIds.has(r.document_id) || invDocIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'journal_lines', check: (r) => journalIds.has(r.journal_id) || r.business_id === targetBusinessId },
        { table: 'inventory_cost_movements', check: (r) => costLayerIds.has(r.layer_id) || docItemIds.has(r.document_item_id) || r.business_id === targetBusinessId },
        { table: 'cogs_entries', check: (r) => docIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'treasury_transactions', check: (r) => receiptIds.has(r.reference_id) || paymentIds.has(r.reference_id) || r.business_id === targetBusinessId },
        { table: 'checks', check: (r) => receiptIds.has(r.receipt_id) || paymentIds.has(r.payment_id) || r.business_id === targetBusinessId },
      ];

      for (const { table, check } of childTables) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table);
        const toDelete = records.filter(check);
        for (const row of toDelete) {
          db.deleteRecord(table, row.id || row.business_id);
          deletedCount++;
        }
      }

      // 2. Delete business-scoped records
      const businessTables: (keyof DBState)[] = [
        'parties', 'items', 'categories', 'units', 'warehouses', 'cash_accounts',
        'documents', 'inventory_documents', 'receipts', 'payments', 
        'journal_entries', 'accounting_periods', 'inventory_cost_layers',
        'inventory_revaluation_logs', 'inventory_balances',
        'notifications', 'notification_preferences'
      ];

      for (const table of businessTables) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table);
        const toDelete = records.filter((r) => r.business_id === targetBusinessId);
        for (const row of toDelete) {
          db.deleteRecord(table, row.id || row.business_id);
          deletedCount++;
        }
      }
      
      // 3. Delete settings
      const allSettings = db.queryAll<any>('settings');
      const testSettings = allSettings.filter((s) => s.key.startsWith(targetBusinessId + '_'));
      for (const s of testSettings) {
        db.deleteRecord('settings', s.key);
        deletedCount++;
      }

      // 4. Delete the Business itself
      db.deleteRecord('businesses', targetBusinessId);
      deletedCount++;

      // ==========================================
      // 5. VERY IMPORTANT — POST RESET VERIFICATION
      // ==========================================
      const allTablesToCheck = [
        'parties', 'items', 'categories', 'units', 'warehouses', 'inventory_balances',
        'inventory_transactions', 'documents', 'document_items', 'inventory_documents',
        'inventory_document_items', 'cash_accounts', 'treasury_transactions', 'receipts',
        'payments', 'checks', 'accounting_periods', 'journal_entries', 'journal_lines',
        'inventory_cost_layers', 'inventory_cost_movements', 'cogs_entries',
        'inventory_revaluation_logs', 'notifications', 'notification_preferences'
      ] as const;

      for (const table of allTablesToCheck) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table);
        const leftover = records.find(r => r.business_id === targetBusinessId);
        if (leftover) {
          throw new Error(\`Reset Verification Failed: Orphaned test record found in table '\${table}' (ID: \${leftover.id || leftover.business_id})\`);
        }
      }

      const leftoverBiz = db.queryById('businesses', targetBusinessId);
      if (leftoverBiz) {
        throw new Error(\`Reset Verification Failed: Test Business record was not deleted\`);
      }

      // ==========================================
      // 6. ORPHAN CHECK
      // ==========================================
      const checkOrphans = [
        { table: 'document_items', field: 'document_id', ids: docIds },
        { table: 'inventory_document_items', field: 'document_id', ids: invDocIds },
        { table: 'inventory_transactions', field: 'document_id', ids: docIds },
        { table: 'inventory_transactions', field: 'document_id', ids: invDocIds },
        { table: 'journal_lines', field: 'journal_id', ids: journalIds },
        { table: 'cogs_entries', field: 'document_id', ids: docIds },
        { table: 'inventory_cost_movements', field: 'layer_id', ids: costLayerIds },
        { table: 'inventory_cost_movements', field: 'document_item_id', ids: docItemIds }
      ];

      for (const { table, field, ids } of checkOrphans) {
        if (!(table in db.getState())) continue;
        if (ids.size === 0) continue;
        const records = db.queryAll<any>(table);
        const orphan = records.find(r => ids.has(r[field]));
        if (orphan) {
           throw new Error(\`Orphan Check Failed: Found orphaned test record in '\${table}' referencing deleted parent (Field: \${field}, ID: \${orphan[field]})\`);
        }
      }

      db.commit();
      return { deletedCount };
    } catch (error) {
      db.rollback();
      throw error;
    }
  },`;

const newContent = content.replace(regex, replacement);

if (content === newContent) {
  console.log('NO MATCH FOUND!');
  process.exit(1);
}

fs.writeFileSync(path, newContent, 'utf8');
console.log('REPLACEMENT SUCCESSFUL!');
