import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface DiscountValidationResult {
  valid: boolean;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  code?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { code, priceId } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "Please enter a discount code.",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const supabase = await createServerSupabaseClient();

    const { data: discount, error } = await supabase
      .from("discount_codes")
      .select(
        "id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, is_active, applicable_products"
      )
      .eq("code", normalizedCode)
      .maybeSingle();

    if (error) {
      console.error("[discount/validate] Query error:", error);
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "Something went wrong. Please try again.",
      });
    }

    if (!discount) {
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "Invalid discount code.",
      });
    }

    if (!discount.is_active) {
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "This discount code is no longer active.",
      });
    }

    const now = new Date();

    if (new Date(discount.valid_from) > now) {
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "This discount code is not yet valid.",
      });
    }

    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "This discount code has expired.",
      });
    }

    if (
      discount.max_uses !== null &&
      discount.current_uses >= discount.max_uses
    ) {
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "This discount code has reached its usage limit.",
      });
    }

    // Check applicable products
    if (
      priceId &&
      discount.applicable_products &&
      discount.applicable_products.length > 0 &&
      !discount.applicable_products.includes(priceId)
    ) {
      return NextResponse.json<DiscountValidationResult>({
        valid: false,
        message: "This discount code does not apply to the selected product.",
      });
    }

    return NextResponse.json<DiscountValidationResult>({
      valid: true,
      discountType: discount.discount_type as "percentage" | "fixed",
      discountValue: discount.discount_value,
      code: discount.code,
      message:
        discount.discount_type === "percentage"
          ? `${discount.discount_value}% off applied!`
          : `$${discount.discount_value} off applied!`,
    });
  } catch (err) {
    console.error("[discount/validate] Error:", err);
    return NextResponse.json<DiscountValidationResult>({
      valid: false,
      message: "Something went wrong. Please try again.",
    });
  }
}
