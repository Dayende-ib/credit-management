-- Add document status and reject reason
alter table loan_documents
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists reject_reason text;

-- Add 'additional' document type to the enum
alter type document_type add value if not exists 'additional';
