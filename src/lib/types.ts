export type DocumentStatus = 'processing' | 'review' | 'saved' | 'failed';

export interface LineItem {
  description: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number | null;
}

export interface FieldConfidence {
  vendor?: number;
  date?: number;
  total?: number;
  currency?: number;
  line_items?: number;
}

export interface ExtractionResult {
  vendor: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  line_items: LineItem[];
  confidence: FieldConfidence;
  warnings: string[];
  is_financial_document: boolean;
}

export interface DocumentRow {
  id: string;
  file_key: string;
  file_name: string;
  mime_type: string;
  status: DocumentStatus;
  vendor: string | null;
  doc_date: string | null;
  total: number | null;
  currency: string | null;
  line_items: string | null;
  field_confidence: string | null;
  warnings: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentView extends Omit<DocumentRow, 'line_items' | 'field_confidence' | 'warnings'> {
  line_items: LineItem[];
  field_confidence: FieldConfidence;
  warnings: string[];
}
