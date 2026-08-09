import { NextResponse } from "next/server";
import { moduleErrorResponse, requireModuleContext } from "@/services/modules/authorization";

export const runtime = "nodejs";
const METHODS = ["cash", "card", "transfer", "other"] as const;

type ItemInput = { productId?: unknown; serviceId?: unknown; description?: unknown; quantity?: unknown; unitPrice?: unknown };

export async function GET() {
  try {
    const { admin, barbershopId } = await requireModuleContext("pos", "pos");
    const { data, error } = await admin.from("pos_transactions").select("*,pos_transaction_items(*)").eq("barbershop_id", barbershopId).order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ transactions: data ?? [] });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "Unable to load POS transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { admin, barbershopId, userId } = await requireModuleContext("pos", "pos");
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const paymentMethod = typeof body?.paymentMethod === "string" ? body.paymentMethod : "";
    const items = Array.isArray(body?.items) ? body.items.slice(0, 100) as ItemInput[] : [];
    if (!METHODS.includes(paymentMethod as (typeof METHODS)[number]) || items.length === 0) return NextResponse.json({ error: "Payment method and at least one item are required" }, { status: 400 });

    const normalized = items.map((item) => {
      const quantity = typeof item.quantity === "number" ? item.quantity : NaN;
      const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : NaN;
      return { productId: typeof item.productId === "string" ? item.productId : null, serviceId: typeof item.serviceId === "string" ? item.serviceId : null, description: typeof item.description === "string" ? item.description.trim().slice(0, 200) : "", quantity, unitPrice };
    });
    if (normalized.some((item) => !item.description || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || (!item.productId && !item.serviceId))) return NextResponse.json({ error: "Invalid POS item" }, { status: 400 });

    const productIds = normalized.map((item) => item.productId).filter((id): id is string => Boolean(id));
    if (productIds.length) {
      const { data: products } = await admin.from("inventory_products").select("id").eq("barbershop_id", barbershopId).in("id", productIds);
      if ((products ?? []).length !== new Set(productIds).size) return NextResponse.json({ error: "Product does not belong to this barbershop" }, { status: 403 });
    }
    const serviceIds = normalized.map((item) => item.serviceId).filter((id): id is string => Boolean(id));
    if (serviceIds.length) {
      const { data: services } = await admin.from("services").select("id,price,name").eq("barbershop_id", barbershopId).in("id", serviceIds);
      if ((services ?? []).length !== new Set(serviceIds).size) return NextResponse.json({ error: "Service does not belong to this barbershop" }, { status: 403 });
    }

    const subtotal = Math.round(normalized.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100;
    const requestedDiscount = typeof body?.discount === "number" && Number.isFinite(body.discount) ? Math.max(0, body.discount) : 0;
    const discount = Math.min(requestedDiscount, subtotal);
    const total = Math.round((subtotal - discount) * 100) / 100;
    const { data: transaction, error: transactionError } = await admin.from("pos_transactions").insert({ barbershop_id: barbershopId, location_id: typeof body?.locationId === "string" ? body.locationId : null, client_id: typeof body?.clientId === "string" ? body.clientId : null, appointment_id: typeof body?.appointmentId === "string" ? body.appointmentId : null, subtotal, discount, total, payment_method: paymentMethod, created_by: userId }).select("*").single();
    if (transactionError || !transaction) throw transactionError ?? new Error("Unable to create transaction");

    const { data: createdItems, error: itemError } = await admin.from("pos_transaction_items").insert(normalized.map((item) => ({ transaction_id: transaction.id, product_id: item.productId, service_id: item.serviceId, description: item.description, quantity: item.quantity, unit_price: item.unitPrice }))).select("*");
    if (itemError) {
      await admin.from("pos_transactions").delete().eq("id", transaction.id).eq("barbershop_id", barbershopId);
      throw itemError;
    }
    return NextResponse.json({ transaction: { ...transaction, items: createdItems ?? [] } }, { status: 201 });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "Unable to create POS transaction" }, { status: 500 });
  }
}
