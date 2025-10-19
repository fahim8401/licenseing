export interface License {
  id: number;
  name: string | null;
  license_key: string;
  active: boolean;
  created_at: string;
  expires_at: string | null;
  allowed_ips?: AllowedIP[];
}

export interface AllowedIP {
  id: number;
  license_id: number;
  ip_cidr: string;
  note: string | null;
  created_at: string;
}

export interface AuthLog {
  id: number;
  license_key: string | null;
  request_ip: string | null;
  machine_identifier: string | null;
  result: string;
  raw_request: Record<string, unknown>;
  created_at: string;
}

export interface LogsResponse {
  logs: AuthLog[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface LogStats {
  total: number;
  last24Hours: Record<string, number>;
}
