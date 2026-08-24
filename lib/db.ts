import { createClient as createBrowserClient } from '@/lib/supabase/client';

export const supabase = createBrowserClient();

type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns?: string) => any;
    insert: (values: unknown[]) => any;
    update: (values: Record<string, unknown>) => any;
    delete: () => any;
  };
};

export interface DbResult<T> {
  data: T | null;
  error: Error | null;
}

export interface ListRecordFilters {
  [column: string]: unknown;
}

export interface ListRecordOptions {
  select?: string;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
}

function normalizeError(operation: string, error: unknown): Error {
  if (error instanceof Error) {
    console.error(`[db] ${operation} failed:`, error.message);
    return error;
  }

  const errorMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : JSON.stringify(error);

  const detailedError = new Error(
    `Database operation failed (${operation}): ${errorMessage}`,
  );
  console.error(`[db] ${operation} failed:`, detailedError.message);
  return detailedError;
}

function toResult<T>(data: T | null, error: unknown): DbResult<T> {
  if (error) {
    return { data: null, error: normalizeError('db operation', error) };
  }

  return { data, error: null };
}

function applyFilters(query: any, filters: ListRecordFilters = {}) {
  let result = query;

  Object.entries(filters).forEach(([column, value]) => {
    result = result.eq(column, value);
  });

  return result;
}

export async function getRecordById<T>(
  supabase: SupabaseClientLike,
  table: string,
  id: string,
): Promise<DbResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return toResult<T>(data as T | null, error);
}

export async function listRecords<T>(
  supabase: SupabaseClientLike,
  table: string,
  filters: ListRecordFilters = {},
  options: ListRecordOptions = {},
): Promise<DbResult<T[]>> {
  let query = supabase.from(table).select(options.select ?? '*');

  query = applyFilters(query, filters);

  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const response = options.single
    ? await query.single()
    : options.maybeSingle
      ? await query.maybeSingle()
      : await query;

  return toResult<T[]>(response.data as T[] | null, response.error);
}

export async function insertRecord<T>(
  supabase: SupabaseClientLike,
  table: string,
  data: Partial<T>,
): Promise<DbResult<T>> {
  const { data: insertedData, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .maybeSingle();

  return toResult<T>(insertedData as T | null, error);
}

export async function updateRecord<T>(
  supabase: SupabaseClientLike,
  table: string,
  id: string,
  data: Partial<T>,
): Promise<DbResult<T>> {
  const { data: updatedData, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (!error && !updatedData) {
    return {
      data: null,
      error: new Error(
        `Nenhum registo encontrado com o ID ${id} para atualizar (ou sem permissões RLS).`,
      ),
    };
  }

  return toResult<T>(updatedData as T | null, error);
}

export async function deleteRecord(
  supabase: SupabaseClientLike,
  table: string,
  id: string,
): Promise<DbResult<null>> {
  const { error } = await supabase.from(table).delete().eq('id', id);

  return toResult<null>(null, error);
}

export async function getUserBarbershopId(
  supabase: SupabaseClientLike,
  userId: string,
) {
  const { data, error } = await supabase
    .from('users')
    .select('barbershop_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    normalizeError('getUserBarbershopId', error);
    return null;
  }

  return data;
}
