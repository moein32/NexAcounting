import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { itemService } from './itemService';
import { partyService } from './partyService';
import { inventoryService } from './inventoryService';
import {
  Document,
  DocumentItem,
  DocumentType,
  DocumentStatus,
  PaymentStatus,
  DocumentEvent,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentNumberSequence,
} from '../types/document';

const STORAGE_KEYS = {
  DOCUMENTS: 'nex_demo_documents_data',
  ITEMS: 'nex_demo_document_items_data',
  EVENTS: 'nex_demo_document_events_data',
  SEQUENCES: 'nex_demo_document_sequences_data',
};

// Initial realistic Iranian demo data
const INITIAL_DEMO_DOCUMENTS: Document[] = [
  {
    id: 'doc_1',
    business_id: 'demo_biz_1',
    document_type: 'sales_invoice',
    document_number: 'SI-10001',
    party_id: 'party_1', // پتروشیمی آریا پارس
    warehouse_id: 'wh_1', // انبار مرکزی
    document_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    due_date: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
    status: 'confirmed',
    payment_status: 'partially_paid',
    currency: 'تومان',
    notes: 'تحویل درب انبار خریدار - تسویه ۳۰ روزه',
    internal_notes: 'مشتری معتبر خوش‌حساب',
    subtotal: 120000000,
    discount_total: 6000000,
    tax_total: 11400000,
    shipping_total: 500000,
    grand_total: 125900000,
    created_by: 'demo_user_1',
    confirmed_by: 'demo_user_1',
    confirmed_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    party_display_name: 'شرکت پتروشیمی آریا پارس',
    warehouse_name: 'انبار مرکزی',
  },
  {
    id: 'doc_2',
    business_id: 'demo_biz_1',
    document_type: 'sales_quote',
    document_number: 'SQ-10001',
    party_id: 'party_2', // صنایع فولاد البرز
    warehouse_id: 'wh_1',
    document_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    status: 'draft',
    payment_status: 'not_applicable',
    currency: 'تومان',
    notes: 'اعتبار پیش‌فاکتور ۷ روز کاری می‌باشد.',
    subtotal: 45000000,
    discount_total: 0,
    tax_total: 4500000,
    shipping_total: 0,
    grand_total: 49500000,
    created_by: 'demo_user_1',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    party_display_name: 'شرکت صنایع فولاد البرز',
    warehouse_name: 'انبار مرکزی',
  },
  {
    id: 'doc_3',
    business_id: 'demo_biz_1',
    document_type: 'purchase_invoice',
    document_number: 'PI-10001',
    party_id: 'party_2', // صنایع فولاد البرز
    warehouse_id: 'wh_2', // انبار مواد اولیه
    document_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    due_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    status: 'confirmed',
    payment_status: 'paid',
    currency: 'تومان',
    notes: 'خرید مواد اولیه تولید ورق فلزی',
    subtotal: 80000000,
    discount_total: 2000000,
    tax_total: 7800000,
    shipping_total: 1200000,
    grand_total: 87000000,
    created_by: 'demo_user_1',
    confirmed_by: 'demo_user_1',
    confirmed_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    party_display_name: 'شرکت صنایع فولاد البرز',
    warehouse_name: 'انبار مواد اولیه',
  }
];

const INITIAL_DEMO_ITEMS: DocumentItem[] = [
  {
    id: 'di_1',
    document_id: 'doc_1',
    item_id: 'item_1',
    description: 'پروفیل یو‌پی‌وی‌سی سفید ۵ کاناله - درجه یک',
    quantity: 40,
    unit_price: 3000000, // 3 million toman each
    discount_percent: 5,
    discount_amount: 6000000,
    tax_percent: 10,
    tax_amount: 11400000,
    line_subtotal: 120000000,
    line_total: 125400000,
    unit_id: 'u_1',
    warehouse_id: 'wh_1',
  },
  {
    id: 'di_2',
    document_id: 'doc_2',
    item_id: 'item_2',
    description: 'یراق‌آلات دوحالته ترکیه‌ای اکو',
    quantity: 15,
    unit_price: 3000000,
    discount_percent: 0,
    discount_amount: 0,
    tax_percent: 10,
    tax_amount: 4500000,
    line_subtotal: 45000000,
    line_total: 49500000,
    unit_id: 'u_1',
    warehouse_id: 'wh_1',
  },
  {
    id: 'di_3',
    document_id: 'doc_3',
    item_id: 'item_1',
    description: 'تهیه و تامین مواد پایه تولید آلومینیوم آلیاژی',
    quantity: 50,
    unit_price: 1600000,
    discount_percent: 2.5,
    discount_amount: 2000000,
    tax_percent: 10,
    tax_amount: 7800000,
    line_subtotal: 80000000,
    line_total: 85800000,
    unit_id: 'u_1',
    warehouse_id: 'wh_2',
  }
];

const INITIAL_DEMO_EVENTS: DocumentEvent[] = [
  {
    id: 'ev_1',
    business_id: 'demo_biz_1',
    document_id: 'doc_1',
    event_type: 'create',
    description: 'پیش‌نویس فاکتور فروش SI-10001 ایجاد گردید.',
    created_by: 'demo_user_1',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000 - 3600000).toISOString(),
    user_name: 'علی محمدی (دمو)',
  },
  {
    id: 'ev_2',
    business_id: 'demo_biz_1',
    document_id: 'doc_1',
    event_type: 'confirm',
    description: 'فاکتور فروش SI-10001 تایید و اسناد خروج کالا صادر گردید.',
    created_by: 'demo_user_1',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    user_name: 'علی محمدی (دمو)',
  },
  {
    id: 'ev_3',
    business_id: 'demo_biz_1',
    document_id: 'doc_2',
    event_type: 'create',
    description: 'پیش‌فاکتور فروش SQ-10001 ایجاد گردید.',
    created_by: 'demo_user_1',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    user_name: 'علی محمدی (دمو)',
  }
];

const INITIAL_SEQUENCES: DocumentNumberSequence[] = [
  { id: 'seq_1', business_id: 'demo_biz_1', document_type: 'sales_quote', prefix: 'SQ', next_value: 2 },
  { id: 'seq_2', business_id: 'demo_biz_1', document_type: 'sales_order', prefix: 'SO', next_value: 1 },
  { id: 'seq_3', business_id: 'demo_biz_1', document_type: 'sales_invoice', prefix: 'SI', next_value: 2 },
  { id: 'seq_4', business_id: 'demo_biz_1', document_type: 'sales_return', prefix: 'SR', next_value: 1 },
  { id: 'seq_5', business_id: 'demo_biz_1', document_type: 'purchase_order', prefix: 'PO', next_value: 1 },
  { id: 'seq_6', business_id: 'demo_biz_1', document_type: 'purchase_invoice', prefix: 'PI', next_value: 2 },
  { id: 'seq_7', business_id: 'demo_biz_1', document_type: 'purchase_return', prefix: 'PR', next_value: 1 },
];

import { db } from '../lib/sqlite';
import { DocumentRepository } from '../repositories';
import { CostEngine } from './costEngine';
import { AccountingEngine } from './accountingEngine';

// LocalStorage helpers
function getFromStorage<T>(key: string, initial: T[]): T[] {
  try {
    if (key === STORAGE_KEYS.DOCUMENTS) {
      const list = db.queryAll('documents') as unknown as T[];
      if (list.length === 0) {
        setToStorage(STORAGE_KEYS.DOCUMENTS, initial);
        return initial;
      }
      return list;
    }
    if (key === STORAGE_KEYS.ITEMS) {
      const list = db.queryAll('document_items') as unknown as T[];
      if (list.length === 0) {
        setToStorage(STORAGE_KEYS.ITEMS, initial);
        return initial;
      }
      return list;
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function setToStorage<T>(key: string, data: T[]): void {
  try {
    if (key === STORAGE_KEYS.DOCUMENTS) {
      (data as unknown as any[]).forEach((doc) => {
        const existing = db.queryById('documents', doc.id);
        if (existing) {
          db.updateRecord('documents', doc.id, doc);
        } else {
          db.insertRecord('documents', doc);
        }
      });
      return;
    }
    if (key === STORAGE_KEYS.ITEMS) {
      (data as unknown as any[]).forEach((item) => {
        const existing = db.queryById('document_items', item.id);
        if (existing) {
          db.updateRecord('document_items', item.id, item);
        } else {
          db.insertRecord('document_items', item);
        }
      });
      return;
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

export const documentService = {
  // --- CALCULATION HELPER (Backend recalculation rule enforcement) ---
  calculateLineTotals(
    quantity: number,
    unitPrice: number,
    discountPercent: number = 0,
    taxPercent: number = 0
  ) {
    const line_subtotal = Number(quantity) * Number(unitPrice);
    const discount_amount = line_subtotal * (Number(discountPercent) / 100);
    const taxable = line_subtotal - discount_amount;
    const tax_amount = taxable * (Number(taxPercent) / 100);
    const line_total = taxable + tax_amount;

    return {
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      discount_percent: Number(discountPercent),
      discount_amount,
      tax_percent: Number(taxPercent),
      tax_amount,
      line_subtotal,
      line_total,
    };
  },

  calculateDocumentTotals(items: Partial<DocumentItem>[], shippingTotal: number = 0) {
    let subtotal = 0;
    let discount_total = 0;
    let tax_total = 0;

    const computedItems = items.map((it) => {
      const computed = this.calculateLineTotals(
        it.quantity || 0,
        it.unit_price || 0,
        it.discount_percent || 0,
        it.tax_percent || 0
      );
      subtotal += computed.line_subtotal;
      discount_total += computed.discount_amount;
      tax_total += computed.tax_amount;

      return {
        ...it,
        ...computed,
      } as DocumentItem;
    });

    const grand_total = subtotal - discount_total + tax_total + Number(shippingTotal);

    return {
      subtotal,
      discount_total,
      tax_total,
      shipping_total: Number(shippingTotal),
      grand_total,
      items: computedItems,
    };
  },

  // --- READS ---
  async getDocuments(
    businessId: string,
    filters?: {
      document_type?: DocumentType;
      status?: DocumentStatus;
      party_id?: string;
      search?: string;
      limit?: number;
    }
  ): Promise<Document[]> {
    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
      const partiesResult = await partyService.getParties(businessId);
      const parties = partiesResult.data || [];
      const warehousesResponse = await inventoryService.getWarehouses(businessId);
      const warehouses = warehousesResponse || [];

      let bizDocs = docs.filter((d) => d.business_id === businessId);

      if (filters?.document_type) {
        bizDocs = bizDocs.filter((d) => d.document_type === filters.document_type);
      }
      if (filters?.status) {
        bizDocs = bizDocs.filter((d) => d.status === filters.status);
      }
      if (filters?.party_id) {
        bizDocs = bizDocs.filter((d) => d.party_id === filters.party_id);
      }

      let enriched = bizDocs.map((d) => {
        const party = parties.find((p) => p.id === d.party_id);
        const wh = warehouses.find((w) => w.id === d.warehouse_id);

        return {
          ...d,
          party_display_name: party?.display_name || 'بدون شخص',
          warehouse_name: wh?.name || 'انبار نامشخص',
        };
      });

      if (filters?.search?.trim()) {
        const query = filters.search.trim().toLowerCase();
        enriched = enriched.filter(
          (d) =>
            d.document_number.toLowerCase().includes(query) ||
            d.party_display_name?.toLowerCase().includes(query) ||
            d.notes?.toLowerCase().includes(query)
        );
      }

      // Sort descending by date
      enriched.sort((a, b) => b.document_date.localeCompare(a.document_date));

      if (filters?.limit) {
        enriched = enriched.slice(0, filters.limit);
      }

      return enriched;
    }

    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          party:parties (display_name, company_name),
          warehouse:warehouses (name),
          reference:documents (document_number)
        `)
        .eq('business_id', businessId);

      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.party_id) {
        query = query.eq('party_id', filters.party_id);
      }

      query = query.order('document_date', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      let list = (data || []).map((d: any) => ({
        ...d,
        party_display_name: d.party?.display_name || d.party?.company_name || 'بدون شخص',
        warehouse_name: d.warehouse?.name || 'انبار نامشخص',
        reference_document_number: d.reference?.document_number,
      })) as Document[];

      if (filters?.search?.trim()) {
        const searchVal = filters.search.trim().toLowerCase();
        list = list.filter(
          (d) =>
            d.document_number.toLowerCase().includes(searchVal) ||
            d.party_display_name?.toLowerCase().includes(searchVal) ||
            d.notes?.toLowerCase().includes(searchVal)
        );
      }

      return list;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در دریافت اسناد');
    }
  },

  async getDocumentById(businessId: string, id: string): Promise<Document> {
    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
      const docItems = getFromStorage<DocumentItem>(STORAGE_KEYS.ITEMS, INITIAL_DEMO_ITEMS);
      const partiesResponse = await partyService.getParties(businessId);
      const parties = partiesResponse.data || [];
      const warehousesResponse = await inventoryService.getWarehouses(businessId);
      const warehouses = warehousesResponse || [];
      const catalogItemsResponse = await itemService.getItems(businessId);
      const catalogItems = catalogItemsResponse.data || [];

      let doc = docs.find((d) => d.id === id && d.business_id === businessId);
      if (!doc) {
        doc = DocumentRepository.getById(id) as unknown as Document;
      }
      if (!doc) throw new Error('سند یافت نشد');

      const party = parties.find((p) => p.id === doc.party_id);
      const wh = warehouses.find((w) => w.id === doc.warehouse_id);

      let rawItems: any[] = docItems.filter((it) => it.document_id === id);
      if (rawItems.length === 0) {
        rawItems = DocumentRepository.getItems(id) as any[];
      }

      const activeItems: DocumentItem[] = rawItems.map((it: any) => {
        const catalogItem = catalogItems.find((ci) => ci.id === it.item_id);
        const name = catalogItem?.name || it.item_name || it.productName || it.description || 'کالای نامشخص';
        const code = catalogItem?.code || it.item_code || '';
        const unit = catalogItem?.unit?.name || it.unit_name || 'عدد';
        const subtotalVal = Number(it.line_subtotal || it.line_total || (it.quantity * it.unit_price) || 0);
        return {
          ...it,
          item_name: name,
          productName: name,
          item_code: code,
          unit_name: unit,
          quantity: Number(it.quantity || 0),
          unit_price: Number(it.unit_price || 0),
          unitPrice: Number(it.unit_price || 0),
          discount_amount: Number(it.discount_amount || 0),
          tax_amount: Number(it.tax_amount || 0),
          line_subtotal: subtotalVal,
          line_total: Number(it.line_total || subtotalVal || 0),
          total: Number(it.line_total || subtotalVal || 0),
        };
      });

      return {
        ...doc,
        party_display_name: party?.display_name || 'بدون شخص',
        warehouse_name: wh?.name || 'انبار نامشخص',
        items: activeItems,
      };
    }

    try {
      const { data: d, error: docError } = await supabase
        .from('documents')
        .select(`
          *,
          party:parties (display_name, company_name),
          warehouse:warehouses (name),
          reference:documents (document_number)
        `)
        .eq('id', id)
        .eq('business_id', businessId)
        .single();

      if (docError || !d) throw new Error('سند مورد نظر یافت نشد.');

      const { data: itemsData, error: itemsError } = await supabase
        .from('document_items')
        .select(`
          *,
          item:items (name, code, unit:units (name))
        `)
        .eq('document_id', id);

      if (itemsError) throw itemsError;

      const enrichedItems = (itemsData || []).map((it: any) => ({
        ...it,
        item_name: it.item?.name || 'کالای نامشخص',
        item_code: it.item?.code || '',
        unit_name: it.item?.unit?.name || 'عدد',
      })) as DocumentItem[];

      return {
        ...d,
        party_display_name: d.party?.display_name || d.party?.company_name || 'بدون شخص',
        warehouse_name: d.warehouse?.name || 'انبار نامشخص',
        reference_document_number: d.reference?.document_number,
        items: enrichedItems,
      } as Document;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در دریافت جزئیات سند');
    }
  },

  // --- WRITES (CRUD) ---
  async createDocument(
    businessId: string,
    input: CreateDocumentInput,
    currentUserId?: string
  ): Promise<Document> {
    const { subtotal, discount_total, tax_total, grand_total, items } = this.calculateDocumentTotals(
      input.items,
      input.shipping_total || 0
    );

    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
      const docItems = getFromStorage<DocumentItem>(STORAGE_KEYS.ITEMS, INITIAL_DEMO_ITEMS);
      const sequences = getFromStorage<DocumentNumberSequence>(STORAGE_KEYS.SEQUENCES, INITIAL_SEQUENCES);

      // Generate sequence number
      let seq = sequences.find((s) => s.business_id === businessId && s.document_type === input.document_type);
      if (!seq) {
        const prefixes: Record<string, string> = {
          sales_quote: 'SQ',
          sales_order: 'SO',
          sales_invoice: 'SI',
          sales_return: 'SR',
          purchase_order: 'PO',
          purchase_invoice: 'PI',
          purchase_return: 'PR',
        };
        seq = {
          id: `seq_${Date.now()}`,
          business_id: businessId,
          document_type: input.document_type,
          prefix: prefixes[input.document_type] || 'DOC',
          next_value: 1,
        };
        sequences.push(seq);
      }

      const formattedNumber = `${seq.prefix}-${seq.next_value + 10000}`;
      seq.next_value += 1;
      setToStorage(STORAGE_KEYS.SEQUENCES, sequences);

      const docId = `doc_${Date.now()}`;
      const newDoc: Document = {
        id: docId,
        business_id: businessId,
        document_type: input.document_type,
        document_number: formattedNumber,
        party_id: input.party_id,
        warehouse_id: input.warehouse_id,
        reference_document_id: input.reference_document_id,
        document_date: input.document_date || new Date().toISOString(),
        due_date: input.due_date,
        status: 'draft',
        payment_status: input.document_type.includes('invoice') ? 'unpaid' : 'not_applicable',
        currency: input.currency || 'تومان',
        notes: input.notes,
        internal_notes: input.internal_notes,
        subtotal,
        discount_total,
        tax_total,
        shipping_total: input.shipping_total || 0,
        grand_total,
        created_by: currentUserId || 'demo_user_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add lines
      const addedItems = items.map((it, idx) => ({
        ...it,
        id: `di_${Date.now()}_${idx}`,
        document_id: docId,
        warehouse_id: it.warehouse_id || input.warehouse_id,
      }));

      docs.push(newDoc);
      setToStorage(STORAGE_KEYS.DOCUMENTS, docs);
      setToStorage(STORAGE_KEYS.ITEMS, [...docItems, ...addedItems]);

      // Log event
      await this.createDocumentEvent(
        businessId,
        docId,
        'create',
        `سند پیش‌نویس به شماره ${formattedNumber} ثبت گردید.`,
        null,
        currentUserId || 'demo_user_1'
      );

      return {
        ...newDoc,
        items: addedItems,
      };
    }

    try {
      // Get atomic document number via RPC function
      const { data: docNum, error: rpcError } = await supabase.rpc('get_next_document_number', {
        b_id: businessId,
        doc_type: input.document_type,
      });

      if (rpcError) throw rpcError;

      const { data: d, error: docInsertErr } = await supabase
        .from('documents')
        .insert({
          business_id: businessId,
          document_type: input.document_type,
          document_number: docNum,
          party_id: input.party_id,
          warehouse_id: input.warehouse_id,
          reference_document_id: input.reference_document_id,
          document_date: input.document_date || new Date().toISOString(),
          due_date: input.due_date,
          status: 'draft',
          payment_status: input.document_type.includes('invoice') ? 'unpaid' : 'not_applicable',
          currency: input.currency || 'تومان',
          notes: input.notes,
          internal_notes: input.internal_notes,
          subtotal,
          discount_total,
          tax_total,
          shipping_total: input.shipping_total || 0,
          grand_total,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (docInsertErr || !d) throw docInsertErr;

      // Bulk insert items
      if (items.length > 0) {
        const itemRows = items.map((it) => ({
          document_id: d.id,
          item_id: it.item_id,
          description: it.description || null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount_percent: it.discount_percent,
          discount_amount: it.discount_amount,
          tax_percent: it.tax_percent,
          tax_amount: it.tax_amount,
          line_subtotal: it.line_subtotal,
          line_total: it.line_total,
          unit_id: it.unit_id || null,
          warehouse_id: it.warehouse_id || input.warehouse_id,
        }));

        const { error: linesErr } = await supabase.from('document_items').insert(itemRows);
        if (linesErr) throw linesErr;
      }

      await this.createDocumentEvent(
        businessId,
        d.id,
        'create',
        `سند پیش‌نویس به شماره ${docNum} ایجاد گردید.`,
        null,
        currentUserId
      );

      return d as Document;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در تعریف فاکتور/سند جدید');
    }
  },

  async updateDocument(
    businessId: string,
    id: string,
    input: UpdateDocumentInput,
    currentUserId?: string
  ): Promise<Document> {
    // Fetch original doc first
    const original = await this.getDocumentById(businessId, id);
    if (original.status !== 'draft') {
      throw new Error('تنها اسناد در وضعیت پیش‌نویس قابل ویرایش هستند.');
    }

    let subtotal = original.subtotal;
    let discount_total = original.discount_total;
    let tax_total = original.tax_total;
    let grand_total = original.grand_total;
    let items = original.items || [];

    if (input.items) {
      const computed = this.calculateDocumentTotals(input.items, input.shipping_total ?? original.shipping_total);
      subtotal = computed.subtotal;
      discount_total = computed.discount_total;
      tax_total = computed.tax_total;
      grand_total = computed.grand_total;
      items = computed.items;
    } else if (input.shipping_total !== undefined) {
      const computed = this.calculateDocumentTotals(items, input.shipping_total);
      subtotal = computed.subtotal;
      discount_total = computed.discount_total;
      tax_total = computed.tax_total;
      grand_total = computed.grand_total;
      items = computed.items;
    }

    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
      const docItems = getFromStorage<DocumentItem>(STORAGE_KEYS.ITEMS, INITIAL_DEMO_ITEMS);

      const docIndex = docs.findIndex((d) => d.id === id && d.business_id === businessId);
      if (docIndex < 0) throw new Error('سند یافت نشد');

      const updatedDoc: Document = {
        ...docs[docIndex],
        party_id: input.party_id !== undefined ? input.party_id : original.party_id,
        warehouse_id: input.warehouse_id !== undefined ? input.warehouse_id : original.warehouse_id,
        document_date: input.document_date !== undefined ? input.document_date! : original.document_date,
        due_date: input.due_date !== undefined ? input.due_date : original.due_date,
        currency: input.currency !== undefined ? input.currency! : original.currency,
        notes: input.notes !== undefined ? input.notes : original.notes,
        internal_notes: input.internal_notes !== undefined ? input.internal_notes : original.internal_notes,
        shipping_total: input.shipping_total !== undefined ? input.shipping_total : original.shipping_total,
        subtotal,
        discount_total,
        tax_total,
        grand_total,
        updated_at: new Date().toISOString(),
      };

      docs[docIndex] = updatedDoc;
      setToStorage(STORAGE_KEYS.DOCUMENTS, docs);

      if (input.items) {
        // Delete original items, insert new ones
        const otherItems = docItems.filter((it) => it.document_id !== id);
        const addedItems = items.map((it, idx) => ({
          ...it,
          id: `di_${Date.now()}_update_${idx}`,
          document_id: id,
          warehouse_id: it.warehouse_id || updatedDoc.warehouse_id,
        }));
        setToStorage(STORAGE_KEYS.ITEMS, [...otherItems, ...addedItems]);
        updatedDoc.items = addedItems;
      }

      await this.createDocumentEvent(
        businessId,
        id,
        'update',
        `سند پیش‌نویس شماره ${original.document_number} ویرایش گردید.`,
        null,
        currentUserId || 'demo_user_1'
      );

      return updatedDoc;
    }

    try {
      const { data: d, error: updateErr } = await supabase
        .from('documents')
        .update({
          party_id: input.party_id !== undefined ? input.party_id : original.party_id,
          warehouse_id: input.warehouse_id !== undefined ? input.warehouse_id : original.warehouse_id,
          document_date: input.document_date !== undefined ? input.document_date : original.document_date,
          due_date: input.due_date !== undefined ? input.due_date : original.due_date,
          currency: input.currency !== undefined ? input.currency : original.currency,
          notes: input.notes !== undefined ? input.notes : original.notes,
          internal_notes: input.internal_notes !== undefined ? input.internal_notes : original.internal_notes,
          shipping_total: input.shipping_total !== undefined ? input.shipping_total : original.shipping_total,
          subtotal,
          discount_total,
          tax_total,
          grand_total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      if (input.items) {
        // Delete lines and bulk-insert
        const { error: delErr } = await supabase.from('document_items').delete().eq('document_id', id);
        if (delErr) throw delErr;

        const itemRows = items.map((it) => ({
          document_id: id,
          item_id: it.item_id,
          description: it.description || null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount_percent: it.discount_percent,
          discount_amount: it.discount_amount,
          tax_percent: it.tax_percent,
          tax_amount: it.tax_amount,
          line_subtotal: it.line_subtotal,
          line_total: it.line_total,
          unit_id: it.unit_id || null,
          warehouse_id: it.warehouse_id || d.warehouse_id,
        }));

        const { error: linesErr } = await supabase.from('document_items').insert(itemRows);
        if (linesErr) throw linesErr;
      }

      await this.createDocumentEvent(
        businessId,
        id,
        'update',
        `سند پیش‌نویس شماره ${original.document_number} به‌روزرسانی شد.`,
        null,
        currentUserId
      );

      return d as Document;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در به‌روزرسانی سند');
    }
  },

  async deleteDocument(businessId: string, id: string, currentUserId?: string): Promise<boolean> {
    const original = await this.getDocumentById(businessId, id);
    if (original.status !== 'draft') {
      throw new Error('تنها اسناد در وضعیت پیش‌نویس قابل حذف هستند.');
    }

    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
      const docItems = getFromStorage<DocumentItem>(STORAGE_KEYS.ITEMS, INITIAL_DEMO_ITEMS);

      const filteredDocs = docs.filter((d) => !(d.id === id && d.business_id === businessId));
      const filteredItems = docItems.filter((it) => it.document_id !== id);

      setToStorage(STORAGE_KEYS.DOCUMENTS, filteredDocs);
      setToStorage(STORAGE_KEYS.ITEMS, filteredItems);

      return true;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در حذف سند');
    }
  },

  // --- CONFIRMATION (Atomics, Recalcs, and Inventory integration) ---
  async confirmDocument(businessId: string, id: string, currentUserId?: string): Promise<boolean> {
    const doc = await this.getDocumentById(businessId, id);
    if (doc.status !== 'draft') {
      throw new Error('تنها اسناد در وضعیت پیش‌نویس قابل تایید نهایی هستند.');
    }

    if (!doc.items || doc.items.length === 0) {
      throw new Error('سند فاقد ردیف است. ابتدا ردیف‌های کالا/خدمات را ثبت کنید.');
    }

    // Determine Inventory Transaction requirement
    // Stock IN: purchase_invoice, sales_return
    // Stock OUT: sales_invoice, purchase_return
    let needsInventory = false;
    let inventoryDocType: 'receipt' | 'issue' | null = null;

    if (doc.document_type === 'sales_invoice' || doc.document_type === 'purchase_return') {
      needsInventory = true;
      inventoryDocType = 'issue';
    } else if (doc.document_type === 'purchase_invoice' || doc.document_type === 'sales_return') {
      needsInventory = true;
      inventoryDocType = 'receipt';
    }

    if (needsInventory && inventoryDocType) {
      let activeWarehouseId = doc.warehouse_id;

      if (!activeWarehouseId) {
        try {
          const warehouses = await inventoryService.getWarehouses(businessId);
          const defaultWh = warehouses.find((w) => w.is_default) || warehouses[0];
          if (defaultWh) {
            activeWarehouseId = defaultWh.id;
            doc.warehouse_id = defaultWh.id;
            doc.warehouse_name = defaultWh.name;
          }
        } catch (e) {
          console.error('Failed to auto-resolve warehouse:', e);
        }
      }

      if (!activeWarehouseId) {
        throw new Error('جهت صدور سند انبار، مشخص نمودن انبار مبدا/مقصد الزامی است.');
      }

      // Filter products that require inventory tracking
      const catalogItemsRes = await itemService.getItems(businessId).catch(() => ({ data: [] }));
      const catalogItems = catalogItemsRes.data || [];
      const productLines = doc.items.filter((it) => {
        if (!it.quantity || it.quantity <= 0) return false;
        const catItem = catalogItems.find((ci) => ci.id === it.item_id);
        if (catItem && (catItem.track_inventory === false || catItem.item_type === 'service')) {
          return false;
        }
        return true;
      });

      if (productLines.length > 0) {
        // Map to inventory format
        const invItems = productLines.map((it) => ({
          item_id: it.item_id,
          quantity: it.quantity,
          unit_cost: it.unit_price, // cost for stock tracking
          description: it.description || `مرتبط با سند ${doc.document_number}`,
        }));

        try {
          // 1. Create Draft Inventory Document
          const invDoc = await inventoryService.createInventoryDocument(businessId, {
            document_number: `${inventoryDocType === 'receipt' ? 'IN' : 'OUT'}-AUTO-${doc.document_number}`,
            document_type: inventoryDocType,
            warehouse_id: activeWarehouseId,
            description: `سند انبار خودکار فاکتور ${doc.document_number}`,
            document_date: doc.document_date,
            items: invItems,
          }, currentUserId);

          // 2. Atomically Confirm Inventory Document (Checks balances, updates quantities, registers transactions)
          await inventoryService.confirmInventoryDocument(businessId, invDoc.id, currentUserId);

          // Track reference inside document notes/metadata if needed
        } catch (invErr: any) {
          console.error('Inventory Sync Error:', invErr);
          throw new Error(`خطا در همگام‌سازی انبار: ${invErr.message || 'انجام نشد. عملیات تأیید فاکتور متوقف گردید.'}`);
        }
      }
    }

    // Now update Document Status to Confirmed
    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
      const docIdx = docs.findIndex((d) => d.id === id && d.business_id === businessId);
      if (docIdx >= 0) {
        docs[docIdx].status = 'confirmed';
        docs[docIdx].confirmed_by = currentUserId || 'demo_user_1';
        docs[docIdx].confirmed_at = new Date().toISOString();
        setToStorage(STORAGE_KEYS.DOCUMENTS, docs);
      }

      // Trigger CostEngine and AccountingEngine
      db.beginTransaction();
      try {
        const fullDoc = await this.getDocumentById(businessId, id);
        
        if (fullDoc.document_type === 'purchase_invoice') {
          // Process cost layers
          CostEngine.handlePurchase(businessId, fullDoc);
          // Post ledger entry
          AccountingEngine.postPurchaseInvoice(businessId, {
            id: fullDoc.id,
            date: fullDoc.document_date,
            party_id: fullDoc.party_id,
            grand_total: fullDoc.grand_total,
            is_cash: fullDoc.is_cash,
            number: fullDoc.document_number,
          });
        } else if (fullDoc.document_type === 'sales_invoice') {
          // Process COGS, consume layers, post COGS entries & accounting
          CostEngine.handleSale(businessId, fullDoc);
          // Post main ledger entry
          AccountingEngine.postSalesInvoice(businessId, {
            id: fullDoc.id,
            date: fullDoc.document_date,
            party_id: fullDoc.party_id,
            grand_total: fullDoc.grand_total,
            is_cash: fullDoc.is_cash,
            number: fullDoc.document_number,
          });
        } else if (fullDoc.document_type === 'sales_return') {
          // Restore cost layers
          CostEngine.handleSalesReturn(businessId, fullDoc);
          // Post sales return ledger entry
          AccountingEngine.postSalesReturn(businessId, {
            id: fullDoc.id,
            date: fullDoc.document_date,
            party_id: fullDoc.party_id,
            grand_total: fullDoc.grand_total,
            is_cash: fullDoc.is_cash,
            number: fullDoc.document_number,
          });
        } else if (fullDoc.document_type === 'purchase_return') {
          // Reduce cost layers
          CostEngine.handlePurchaseReturn(businessId, fullDoc);
          // Post purchase return ledger entry
          AccountingEngine.postPurchaseReturn(businessId, {
            id: fullDoc.id,
            date: fullDoc.document_date,
            party_id: fullDoc.party_id,
            grand_total: fullDoc.grand_total,
            is_cash: fullDoc.is_cash,
            number: fullDoc.document_number,
          });
        }
        db.commit();
      } catch (err: any) {
        db.rollback();
        console.error('Cost/Accounting Confirmation Error:', err);
        throw new Error(`خطا در صدور اسناد مالی و بهای تمام‌شده: ${err.message}`);
      }

      await this.createDocumentEvent(
        businessId,
        id,
        'confirm',
        `سند شماره ${doc.document_number} تایید نهایی گردید و اثرات مالی و انبارداری آن اعمال شد.`,
        null,
        currentUserId || 'demo_user_1'
      );

      return true;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'confirmed',
          confirmed_by: currentUserId,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;

      await this.createDocumentEvent(
        businessId,
        id,
        'confirm',
        `سند شماره ${doc.document_number} تأیید نهایی گردید.`,
        null,
        currentUserId
      );

      return true;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در ثبت نهایی سند');
    }
  },

  // --- CANCELLATION ---
  async cancelDocument(businessId: string, id: string, currentUserId?: string): Promise<boolean> {
    const doc = await this.getDocumentById(businessId, id);
    if (doc.status === 'cancelled') {
      throw new Error('این سند پیش از این باطل گردیده است.');
    }

    // Reversing inventory if it was confirmed!
    if (doc.status === 'confirmed') {
      let needsInventory = false;
      let inventoryDocPrefix = '';
      if (doc.document_type === 'sales_invoice' || doc.document_type === 'purchase_return') {
        needsInventory = true;
        inventoryDocPrefix = 'OUT-AUTO-';
      } else if (doc.document_type === 'purchase_invoice' || doc.document_type === 'sales_return') {
        needsInventory = true;
        inventoryDocPrefix = 'IN-AUTO-';
      }

      if (needsInventory) {
        try {
          // Find the corresponding inventory document and cancel it!
          const invDocsResponse = await inventoryService.getInventoryDocuments(businessId);
          const invDocs = invDocsResponse || [];
          const targetNum = `${inventoryDocPrefix}${doc.document_number}`;
          const invDoc = invDocs.find((d) => d.document_number === targetNum && d.status === 'confirmed');

          if (invDoc) {
            await inventoryService.cancelInventoryDocument(businessId, invDoc.id, currentUserId);
          }
        } catch (invErr: any) {
          console.error('Inventory Reversal Error during Cancellation:', invErr);
          throw new Error(`خطا در برگشت موجودی انبار: ${invErr.message || 'برگشت انجام نشد.'}`);
        }
      }
    }

    if (!isSupabaseConfigured()) {
      // Reverse financial and costing implications first within a strict transaction
      db.beginTransaction();
      try {
        if (doc.status === 'confirmed') {
          // Reverse cost layers and COGS journal
          CostEngine.handleCancellation(businessId, doc);

          // Reverse main invoice accounting entry
          const allEntries = db.queryAll<any>('journal_entries');
          const mainEntry = allEntries.find((e) => e.reference_id === id && e.status === 'posted');
          if (mainEntry) {
            AccountingEngine.reverseEntry(mainEntry.id, businessId);
          }
        }
        db.commit();
      } catch (err: any) {
        db.rollback();
        console.error('Cancellation Cost/Accounting Reversal Error:', err);
        throw new Error(`خطا در برگشت اثرات مالی و بهای تمام‌شده: ${err.message || 'عملیات متوقف شد.'}`);
      }

      const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
      const docIdx = docs.findIndex((d) => d.id === id && d.business_id === businessId);
      if (docIdx >= 0) {
        docs[docIdx].status = 'cancelled';
        docs[docIdx].cancelled_by = currentUserId || 'demo_user_1';
        docs[docIdx].cancelled_at = new Date().toISOString();
        setToStorage(STORAGE_KEYS.DOCUMENTS, docs);
      }

      await this.createDocumentEvent(
        businessId,
        id,
        'cancel',
        `سند شماره ${doc.document_number} ابطال گردید و اثرات انبارداری/مالی آن برگشت خورد.`,
        null,
        currentUserId || 'demo_user_1'
      );

      return true;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'cancelled',
          cancelled_by: currentUserId,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', businessId);

      if (error) throw error;

      await this.createDocumentEvent(
        businessId,
        id,
        'cancel',
        `سند شماره ${doc.document_number} ابطال شد.`,
        null,
        currentUserId
      );

      return true;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در ابطال سند');
    }
  },

  // --- CONVERSION FLOWS (Quotes to Orders, Orders to Invoices) ---
  async convertDocument(
    businessId: string,
    id: string,
    targetType: DocumentType,
    currentUserId?: string
  ): Promise<Document> {
    const source = await this.getDocumentById(businessId, id);

    // Validation rules
    if (source.status !== 'confirmed' && source.status !== 'draft') {
      // In Iranian workflows, you can convert drafts or confirmed, let's allow confirmed as standard practice
    }

    if (source.document_type === 'sales_quote' && targetType !== 'sales_order' && targetType !== 'sales_invoice') {
      throw new Error('پیش‌فاکتور تنها به سفارش فروش یا فاکتور فروش قابل تبدیل است.');
    }
    if (source.document_type === 'sales_order' && targetType !== 'sales_invoice') {
      throw new Error('سفارش فروش تنها به فاکتور فروش قابل تبدیل است.');
    }
    if (source.document_type === 'purchase_order' && targetType !== 'purchase_invoice') {
      throw new Error('سفارش خرید تنها به فاکتور خرید قابل تبدیل است.');
    }

    // Prepare items
    const itemsInput = (source.items || []).map((it) => ({
      item_id: it.item_id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      discount_percent: it.discount_percent,
      tax_percent: it.tax_percent,
      unit_id: it.unit_id,
      warehouse_id: it.warehouse_id,
    }));

    // Create the target document as a DRAFT
    const target = await this.createDocument(
      businessId,
      {
        document_type: targetType,
        party_id: source.party_id,
        warehouse_id: source.warehouse_id,
        reference_document_id: source.id,
        currency: source.currency,
        notes: `صادر شده عطف به ${this.getDocTypeNameFarsi(source.document_type)} به شماره ${source.document_number}. \n${source.notes || ''}`,
        internal_notes: source.internal_notes,
        shipping_total: source.shipping_total,
        items: itemsInput,
      },
      currentUserId
    );

    // Update status of source to completed if it's confirmed
    if (source.status === 'confirmed') {
      if (!isSupabaseConfigured()) {
        const docs = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS, INITIAL_DEMO_DOCUMENTS);
        const sourceIdx = docs.findIndex((d) => d.id === source.id);
        if (sourceIdx >= 0) {
          docs[sourceIdx].status = 'completed';
          setToStorage(STORAGE_KEYS.DOCUMENTS, docs);
        }
      } else {
        await supabase
          .from('documents')
          .update({ status: 'completed' })
          .eq('id', source.id);
      }

      await this.createDocumentEvent(
        businessId,
        source.id,
        'complete',
        `این سند به ${this.getDocTypeNameFarsi(targetType)} شماره ${target.document_number} تبدیل و نهایی شد.`,
        { target_document_id: target.id },
        currentUserId
      );
    }

    // Add linkage log in target as well
    await this.createDocumentEvent(
      businessId,
      target.id,
      'link',
      `این سند عطف به ${this.getDocTypeNameFarsi(source.document_type)} شماره ${source.document_number} صادر گردید.`,
      { source_document_id: source.id },
      currentUserId
    );

    return target;
  },

  // --- EVENTS & AUDIT ---
  async getDocumentEvents(businessId: string, documentId: string): Promise<DocumentEvent[]> {
    if (!isSupabaseConfigured()) {
      const events = getFromStorage<DocumentEvent>(STORAGE_KEYS.EVENTS, INITIAL_DEMO_EVENTS);
      return events
        .filter((ev) => ev.document_id === documentId && ev.business_id === businessId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    try {
      const { data, error } = await supabase
        .from('document_events')
        .select(`
          *,
          profile:profiles (full_name)
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((ev: any) => ({
        ...ev,
        user_name: ev.profile?.full_name || 'کاربر سیستم',
      })) as DocumentEvent[];
    } catch (err: any) {
      console.error(err);
      return [];
    }
  },

  async createDocumentEvent(
    businessId: string,
    documentId: string,
    eventType: string,
    description: string,
    metadata?: any,
    currentUserId?: string
  ): Promise<DocumentEvent> {
    const newEvent: DocumentEvent = {
      id: `ev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      business_id: businessId,
      document_id: documentId,
      event_type: eventType,
      description,
      metadata,
      created_by: currentUserId || 'demo_user_1',
      created_at: new Date().toISOString(),
      user_name: 'کاربر سیستم',
    };

    if (!isSupabaseConfigured()) {
      const events = getFromStorage<DocumentEvent>(STORAGE_KEYS.EVENTS, INITIAL_DEMO_EVENTS);
      events.push(newEvent);
      setToStorage(STORAGE_KEYS.EVENTS, events);
      return newEvent;
    }

    try {
      const { data, error } = await supabase
        .from('document_events')
        .insert({
          business_id: businessId,
          document_id: documentId,
          event_type: eventType,
          description,
          metadata,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DocumentEvent;
    } catch (err: any) {
      console.error('Failed to write doc event:', err);
      return newEvent;
    }
  },

  // --- UTILS ---
  getDocTypeNameFarsi(type: DocumentType): string {
    const names: Record<DocumentType, string> = {
      sales_quote: 'پیش‌فاکتور فروش',
      sales_order: 'سفارش فروش',
      sales_invoice: 'فاکتور فروش',
      sales_return: 'برگشت از فروش',
      purchase_order: 'سفارش خرید',
      purchase_invoice: 'فاکتور خرید',
      purchase_return: 'برگشت از خرید',
    };
    return names[type] || 'سند تجاری';
  },

  getDocStatusColor(status: DocumentStatus): { bg: string; text: string; label: string } {
    const config: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', label: 'پیش‌نویس' },
      confirmed: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'تایید نهایی' },
      completed: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', label: 'تبدیل شده / کامل' },
      cancelled: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', label: 'ابطال شده' },
    };
    return config[status] || { bg: 'bg-zinc-100', text: 'text-zinc-600', label: status };
  },

  getPaymentStatusColor(status: PaymentStatus): { bg: string; text: string; label: string } {
    const config: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
      unpaid: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', label: 'پرداخت نشده' },
      partially_paid: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', label: 'پرداخت جزئی' },
      paid: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'تسویه کامل' },
      not_applicable: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', label: 'فاقد اثر مالی' },
    };
    return config[status] || { bg: 'bg-zinc-100', text: 'text-zinc-600', label: status };
  }
};
