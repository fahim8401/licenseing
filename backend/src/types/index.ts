export interface License {
  id: number;
  name: string | null;
  license_key: string;
  active: boolean;
  created_at: Date;
  expires_at: Date | null;
}

export interface AllowedIP {
  id: number;
  license_id: number;
  ip_cidr: string;
  note: string | null;
  created_at: Date;
}

export interface AuthLog {
  id: number;
  license_key: string | null;
  request_ip: string | null;
  machine_identifier: string | null;
  result: string;
  raw_request: Record<string, unknown>;
  created_at: Date;
}

export interface AuthCheckRequest {
  license_key: string;
  public_ip: string;
  machine_id: string;
}

export interface AuthCheckResponse {
  allowed: boolean;
  message: string;
}

export interface CreateLicenseRequest {
  name?: string;
  license_key?: string;
  expires_at?: string;
}

export interface AddIPRequest {
  ip_cidr: string;
  note?: string;
}

export type ApiRole = 'admin' | 'installer';

export interface MikroTikConfig {
  enabled: boolean;
  host: string;
  user: string;
  pass: string;
  port: number;
  interface: string;
  publicNatIp: string;
  addressList: string;
}
