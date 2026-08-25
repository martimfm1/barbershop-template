import { createAdminClient } from '@/lib/supabase/admin';

type PublicCustomerProfile = {
  id: string;
  birthDate: string | null;
};

export function normalizePublicBookingPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('351') && digits.length === 12) digits = digits.slice(3);
  return digits;
}

export async function findPublicBookingCustomer(input: {
  barbershopId: string;
  email: string;
  phone: string;
}): Promise<PublicCustomerProfile | null> {
  const admin = createAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPhone = normalizePublicBookingPhone(input.phone);

  if (!normalizedEmail || normalizedPhone.length < 7) return null;

  const { data, error } = await admin
    .from('users')
    .select('id,birth_date,num_phone')
    .eq('barbershop_id', input.barbershopId)
    .eq('role', 'client')
    .eq('email', normalizedEmail)
    .limit(20);

  if (error) throw error;

  const match = (data ?? []).find(
    (user) =>
      normalizePublicBookingPhone(String(user.num_phone ?? '')) ===
      normalizedPhone,
  );

  if (!match) return null;

  return {
    id: match.id,
    birthDate: match.birth_date ?? null,
  };
}
