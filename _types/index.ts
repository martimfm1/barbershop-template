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

export interface AppointmentClientProfile {
  name_complete: string;
  num_phone: string;
  style_notes?: string;
}

export interface AppointmentService {
  name: string;
  price: number;
}

export interface AppointmentProfessional {
  name: string;
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
  users?: AppointmentClientProfile;
  services?: AppointmentService;
  professionals?: AppointmentProfessional;
}

interface BookingFormData {
  clientId?: string;
  name_complete: string;
  num_phone: string;
  email: string;
  service_id: string;
}

export interface BookingFormProps {
  clients: Client[];
  services: Service[];
  professionals: Professional[];
  loading: boolean;
  formData: BookingFormData;
  setFormData: (data: BookingFormData | ((prev: BookingFormData) => BookingFormData)) => void;
  selectedProfessionalId: string;
  setSelectedProfessionalId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export interface BarberShopConfig {
  name: string;
  phone: string;
  address: string;
  opening_time: string;
  closing_time: string;
  closed_days: string;
  allow_online_bookings: boolean;
  auto_reminders: boolean;
  time_limit_cancellation_hours: string;
}

export interface BlockFormData {
  professional_id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

export interface BlockScheduleFormProps {
  professionals: Professional[];
  loading: boolean;
  blockFormData: BlockFormData;
  setBlockFormData: (data: BlockFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export interface ProfessionalsListCardProps {
  professionalsCount: number;
  professionals: Professional[];
  showAddProfessionalForm: boolean;
  setShowAddProfessionalForm: (value: boolean) => void;
  newProfessionalData: { name: string; commission_percentage: number };
  setNewProfessionalData: React.Dispatch<React.SetStateAction<{ name: string; commission_percentage: number }>>;
  handleCreateProfessional: (e: React.FormEvent) => Promise<void> | void;
  setEditingProfessional: (professional: Professional | null) => void;
  handleDeleteProfessional: (id: string) => Promise<void> | void;
  loading: boolean;
}

export interface ClientsListCardProps {
  clientsCount: number;
  filteredClients: Client[];
  searchClientQuery: string;
  setSearchClientQuery: (value: string) => void;
  showAddClientForm: boolean;
  setShowAddClientForm: (value: boolean) => void;
  newClientData: { name_complete: string; num_phone: string; email: string };
  setNewClientData: React.Dispatch<React.SetStateAction<{ name_complete: string; num_phone: string; email: string }>>;
  handleCreateClient: (e: React.FormEvent) => Promise<void> | void;
  // openMessageForClient: (phone: string, name: string) => void;
  setEditingClient: (client: Client | null) => void;
  handleDeleteClient: (clientId: string) => Promise<void> | void;
  loading: boolean;
}

export interface ServicesListCardProps {
  servicesCount: number;
  services: Service[];
  showAddServiceForm: boolean;
  setShowAddServiceForm: (value: boolean) => void;
  newServiceData: { name: string; price: string | number; duration: string | number };
  setNewServiceData: React.Dispatch<React.SetStateAction<{ name: string; price: string | number; duration: string | number }>>;
  handleCreateService: (e: React.FormEvent) => Promise<void> | void;
  setEditingService: (service: Service | null) => void;
  handleDeleteService: (serviceId: string) => Promise<void> | void;
  loading: boolean;
}

export interface ManualMessageFormProps {
  clients: Client[];
  reminderClientId: string;
  setReminderClientId: (val: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (val: string) => void;
  manualMessage: { phone: string; text: string };
  setManualMessage: React.Dispatch<React.SetStateAction<{ phone: string; text: string }>>;
  applyMessageTemplate: (clientId: string, template: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  sendingMessage?: boolean;
}