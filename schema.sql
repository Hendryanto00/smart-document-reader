CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  vendor TEXT,
  doc_date TEXT,
  total REAL,
  currency TEXT,
  line_items TEXT,
  field_confidence TEXT,
  warnings TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_vendor ON documents(vendor);
CREATE INDEX IF NOT EXISTS idx_documents_doc_date ON documents(doc_date);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
