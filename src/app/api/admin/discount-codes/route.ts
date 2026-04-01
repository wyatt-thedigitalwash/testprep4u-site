import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return profile?.is_admin ? user : null;
}

/* ── Create discount code + Stripe Coupon + Promotion Code ── */

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const {
    code,
    discount_type,
    discount_value,
    max_uses,
    valid_from,
    valid_until,
    applicable_products,
    is_active,
  } = body;

  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  if (!["percentage", "fixed"].includes(discount_type)) {
    return NextResponse.json(
      { error: "Invalid discount type" },
      { status: 400 }
    );
  }

  if (typeof discount_value !== "number" || discount_value <= 0) {
    return NextResponse.json(
      { error: "Discount value must be positive" },
      { status: 400 }
    );
  }

  if (discount_type === "percentage" && discount_value > 100) {
    return NextResponse.json(
      { error: "Percentage cannot exceed 100" },
      { status: 400 }
    );
  }

  const normalizedCode = code.trim().toUpperCase();
  const stripe = getStripe();

  // 1. Create Stripe Coupon
  let stripeCoupon: Stripe.Coupon;
  try {
    const couponParams: Stripe.CouponCreateParams = {
      id: `DISC_${normalizedCode}`,
      name: `Discount: ${normalizedCode}`,
      duration: "once",
    };

    if (discount_type === "percentage") {
      couponParams.percent_off = discount_value;
    } else {
      couponParams.amount_off = Math.round(discount_value * 100);
      couponParams.currency = "usd";
    }

    if (max_uses != null && typeof max_uses === "number" && max_uses > 0) {
      couponParams.max_redemptions = max_uses;
    }

    if (valid_until) {
      couponParams.redeem_by = Math.floor(
        new Date(valid_until).getTime() / 1000
      );
    }

    stripeCoupon = await stripe.coupons.create(couponParams);
  } catch (err) {
    console.error("[discount-codes] Stripe coupon creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe coupon. The code may already exist in Stripe." },
      { status: 500 }
    );
  }

  // 2. Create Stripe Promotion Code (the user-facing code string)
  let stripePromoCode: Stripe.PromotionCode;
  try {
    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { type: "coupon", coupon: stripeCoupon.id },
      code: normalizedCode,
      active: is_active !== false,
    };

    if (max_uses != null && typeof max_uses === "number" && max_uses > 0) {
      promoParams.max_redemptions = max_uses;
    }

    if (valid_until) {
      promoParams.expires_at = Math.floor(
        new Date(valid_until).getTime() / 1000
      );
    }

    stripePromoCode = await stripe.promotionCodes.create(promoParams);
  } catch (err) {
    console.error("[discount-codes] Stripe promotion code creation failed:", err);
    // Clean up the coupon since promo code failed
    try {
      await stripe.coupons.del(stripeCoupon.id);
    } catch { /* best effort */ }
    return NextResponse.json(
      { error: "Failed to create Stripe promotion code" },
      { status: 500 }
    );
  }

  // 3. Insert into database with Stripe IDs
  const supabase = createAdminClient();

  const insertData: Record<string, unknown> = {
    code: normalizedCode,
    discount_type,
    discount_value,
    is_active: is_active !== false,
    stripe_coupon_id: stripeCoupon.id,
    stripe_promo_code_id: stripePromoCode.id,
  };

  if (max_uses != null && typeof max_uses === "number" && max_uses > 0) {
    insertData.max_uses = max_uses;
  }
  if (valid_from) insertData.valid_from = new Date(valid_from).toISOString();
  if (valid_until)
    insertData.valid_until = new Date(valid_until).toISOString();
  if (Array.isArray(applicable_products) && applicable_products.length > 0) {
    insertData.applicable_products = applicable_products;
  }

  const { error } = await supabase.from("discount_codes").insert(insertData);

  if (error) {
    // Clean up Stripe objects
    try {
      await stripe.coupons.del(stripeCoupon.id);
    } catch { /* best effort */ }

    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return NextResponse.json(
        { error: "A code with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Discount code created." });
}

/* ── Update / toggle / delete ────────────────────────────────── */

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { action, codeId } = body;

  if (!codeId) {
    return NextResponse.json({ error: "Missing codeId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const stripe = getStripe();

  // Fetch current code for Stripe IDs
  const { data: existing } = await supabase
    .from("discount_codes")
    .select("id, code, discount_type, discount_value, stripe_coupon_id, stripe_promo_code_id, is_active")
    .eq("id", codeId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  switch (action) {
    case "update": {
      const update: Record<string, unknown> = {};
      const valueChanged =
        typeof body.discount_value === "number" &&
        body.discount_value > 0 &&
        (body.discount_value !== existing.discount_value ||
          body.discount_type !== existing.discount_type);

      if (typeof body.discount_type === "string")
        update.discount_type = body.discount_type;
      if (typeof body.discount_value === "number" && body.discount_value > 0)
        update.discount_value = body.discount_value;
      if (body.max_uses === null) {
        update.max_uses = null;
      } else if (typeof body.max_uses === "number" && body.max_uses > 0) {
        update.max_uses = body.max_uses;
      }
      if (body.valid_from !== undefined) {
        update.valid_from = body.valid_from
          ? new Date(body.valid_from).toISOString()
          : null;
      }
      if (body.valid_until !== undefined) {
        update.valid_until = body.valid_until
          ? new Date(body.valid_until).toISOString()
          : null;
      }
      if (typeof body.is_active === "boolean")
        update.is_active = body.is_active;

      if (Object.keys(update).length === 0) {
        return NextResponse.json(
          { error: "Nothing to update" },
          { status: 400 }
        );
      }

      // Stripe sync: if discount value/type changed, deactivate old coupon + create new
      if (valueChanged) {
        try {
          // Deactivate old promotion code
          if (existing.stripe_promo_code_id) {
            await stripe.promotionCodes.update(existing.stripe_promo_code_id, {
              active: false,
            });
          }
          // Delete old coupon
          if (existing.stripe_coupon_id) {
            await stripe.coupons.del(existing.stripe_coupon_id);
          }

          // Create new coupon
          const newType = (update.discount_type as string) || existing.discount_type;
          const newValue = (update.discount_value as number) || existing.discount_value;
          const couponParams: Stripe.CouponCreateParams = {
            id: `DISC_${existing.code}_${Date.now()}`,
            name: `Discount: ${existing.code}`,
            duration: "once",
          };
          if (newType === "percentage") {
            couponParams.percent_off = newValue;
          } else {
            couponParams.amount_off = Math.round(newValue * 100);
            couponParams.currency = "usd";
          }
          const newCoupon = await stripe.coupons.create(couponParams);

          // Create new promotion code
          const newPromo = await stripe.promotionCodes.create({
            promotion: { type: "coupon", coupon: newCoupon.id },
            code: existing.code,
            active: (update.is_active as boolean) ?? existing.is_active,
          });

          update.stripe_coupon_id = newCoupon.id;
          update.stripe_promo_code_id = newPromo.id;
        } catch (err) {
          console.error("[discount-codes] Stripe sync on update failed:", err);
          // Continue with DB update even if Stripe sync fails
        }
      } else if (typeof body.is_active === "boolean" && existing.stripe_promo_code_id) {
        // Just toggling active — update Stripe promotion code
        try {
          await stripe.promotionCodes.update(existing.stripe_promo_code_id, {
            active: body.is_active,
          });
        } catch (err) {
          console.error("[discount-codes] Stripe promo code toggle failed:", err);
        }
      }

      const { error } = await supabase
        .from("discount_codes")
        .update(update)
        .eq("id", codeId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Code updated." });
    }

    case "toggle_active": {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          { error: "Missing is_active" },
          { status: 400 }
        );
      }

      // Sync with Stripe
      if (existing.stripe_promo_code_id) {
        try {
          await stripe.promotionCodes.update(existing.stripe_promo_code_id, {
            active: body.is_active,
          });
        } catch (err) {
          console.error("[discount-codes] Stripe promo toggle failed:", err);
        }
      }

      const { error } = await supabase
        .from("discount_codes")
        .update({ is_active: body.is_active })
        .eq("id", codeId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        message: `Code ${body.is_active ? "activated" : "deactivated"}.`,
      });
    }

    case "delete": {
      // Deactivate Stripe promo code and delete coupon
      if (existing.stripe_promo_code_id) {
        try {
          await stripe.promotionCodes.update(existing.stripe_promo_code_id, {
            active: false,
          });
        } catch (err) {
          console.error("[discount-codes] Stripe promo deactivate failed:", err);
        }
      }
      if (existing.stripe_coupon_id) {
        try {
          await stripe.coupons.del(existing.stripe_coupon_id);
        } catch (err) {
          console.error("[discount-codes] Stripe coupon delete failed:", err);
        }
      }

      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", codeId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: "Code deleted." });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
