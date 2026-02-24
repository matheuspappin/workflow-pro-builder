export type AssetStatus = 'ok' | 'warning' | 'expired' | 'maintenance';

export interface Asset {
  id: string;
  studio_id: string;
  student_id: string | null;
  name: string;
  type: string;
  serial_number: string | null;
  manufacture_date: string | null;
  expiration_date: string | null;
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  status: AssetStatus;
  location: string | null;
  qr_code: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetDTO {
  student_id?: string;
  name: string;
  type?: string;
  serial_number?: string;
  manufacture_date?: string;
  expiration_date?: string;
  last_inspection_date?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAssetDTO extends Partial<CreateAssetDTO> {
  id: string;
  status?: AssetStatus;
}
