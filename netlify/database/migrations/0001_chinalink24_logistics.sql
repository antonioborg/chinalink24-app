CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'warehouse', 'customs', 'client')),
  customer_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  contact_email TEXT,
  destination_country TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD CONSTRAINT users_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  destination_country TEXT NOT NULL,
  expected_parcel_count INTEGER NOT NULL DEFAULT 1 CHECK (expected_parcel_count > 0),
  status TEXT NOT NULL DEFAULT 'Draft',
  closed_for_packing_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  courier_tracking_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Tracking number submitted',
  actual_weight_kg NUMERIC(10, 2),
  width_cm NUMERIC(10, 2),
  height_cm NUMERIC(10, 2),
  length_cm NUMERIC(10, 2),
  photo_url TEXT,
  warehouse_notes TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'payment_proof', 'customs', 'manifest', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'Uploaded',
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  proof_document_id UUID REFERENCES documents(id),
  status TEXT NOT NULL DEFAULT 'Pending proof',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS containments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  containment_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Open',
  width_cm NUMERIC(10, 2) NOT NULL DEFAULT 60,
  height_cm NUMERIC(10, 2) NOT NULL DEFAULT 50,
  length_cm NUMERIC(10, 2) NOT NULL DEFAULT 90,
  total_weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  label_printed_at TIMESTAMPTZ,
  reopened_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS containment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  containment_id UUID NOT NULL REFERENCES containments(id) ON DELETE CASCADE,
  parcel_id UUID NOT NULL REFERENCES parcels(id),
  packed_by UUID REFERENCES users(id),
  packed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (containment_id, parcel_id)
);

CREATE TABLE IF NOT EXISTS shipping_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_number TEXT NOT NULL UNIQUE,
  route TEXT,
  origin_port TEXT,
  destination_port TEXT,
  destination_country TEXT,
  status TEXT NOT NULL DEFAULT 'Created',
  eta DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS container_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_container_id UUID NOT NULL REFERENCES shipping_containers(id) ON DELETE CASCADE,
  containment_id UUID NOT NULL REFERENCES containments(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shipping_container_id, containment_id)
);

CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
  containment_id UUID REFERENCES containments(id) ON DELETE CASCADE,
  shipping_container_id UUID REFERENCES shipping_containers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_parcels_customer_id ON parcels(customer_id);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(courier_tracking_number);
CREATE INDEX IF NOT EXISTS idx_containments_customer_id ON containments(customer_id);
CREATE INDEX IF NOT EXISTS idx_containment_items_parcel_id ON containment_items(parcel_id);
CREATE INDEX IF NOT EXISTS idx_container_assignments_containment_id ON container_assignments(containment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_customer_id ON tracking_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
