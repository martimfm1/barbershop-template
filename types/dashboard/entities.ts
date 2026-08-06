/** Core records returned by the dashboard data layer. */
export interface Client {
  id: string;
  name_complete: string;
  num_phone: string;
  email?: string;
  style_notes?: string;
}

export interface Service {
  id: string;
  name: string;
  price: string;
  duration: string | number;
  min_duration?: string | number;
}

export interface Professional {
  id: string;
  name: string;
  commission_percentage?: number;
  active?: boolean;
}

export interface Appointment {
  id: string;
  date_hour: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  manual_name?: string | null;
  manual_phone?: string | null;
  value_products?: number;
  description_products?: string;
  payment_method?: "mbway" | "card" | string;
  client_id?: string | null;
  service_id?: string | null;
  professional_id?: string | null;
  users?: { name_complete: string; num_phone: string; style_notes?: string };
  services?: { name: string; price: number };
  professionals?: { name: string };
}
