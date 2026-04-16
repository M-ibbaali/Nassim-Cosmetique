-- ============================================================
-- FINAL SYSTEM UPGRADE: PROFIT TRACKING + SOFT DELETION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. EXTEND PRODUCTS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10,2) DEFAULT 0 CHECK (purchase_price >= 0),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Rename 'price' to 'selling_price' if it hasn't been done
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN
        ALTER TABLE public.products RENAME COLUMN price TO selling_price;
    END IF;
END $$;

-- 2. EXTEND SALE ITEMS
ALTER TABLE public.sale_items 
ADD COLUMN IF NOT EXISTS purchase_price_snapshot NUMERIC(10,2) DEFAULT 0 CHECK (purchase_price_snapshot >= 0),
ADD COLUMN IF NOT EXISTS selling_price_snapshot NUMERIC(10,2) DEFAULT 0 CHECK (selling_price_snapshot >= 0);

-- 3. EXTEND SALES
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost    NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_profit  NUMERIC(10,2) DEFAULT 0;

-- 4. ATOMIC SALE CREATION FUNCTION (Enhanced)
CREATE OR REPLACE FUNCTION public.create_sale_atomic(
  p_notes text,
  p_user_id uuid,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_total_revenue NUMERIC(10,2) := 0;
  v_total_cost    NUMERIC(10,2) := 0;
  v_total_profit  NUMERIC(10,2) := 0;
  v_item    jsonb;
  v_stock   integer;
  v_curr_p  record;
BEGIN
  -- Validate stock and active status for all items first
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock_quantity, purchase_price, selling_price, is_active INTO v_curr_p
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF v_curr_p.stock_quantity IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    IF NOT v_curr_p.is_active THEN
       RAISE EXCEPTION 'Product % is archived and cannot be sold', v_item->>'product_id';
    END IF;

    IF v_curr_p.stock_quantity < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_id';
    END IF;
  END LOOP;

  -- Create sale record
  INSERT INTO public.sales (notes, created_by, total_revenue, total_cost, total_profit)
  VALUES (p_notes, p_user_id, 0, 0, 0)
  RETURNING id INTO v_sale_id;

  -- Insert items and reduce stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT purchase_price, selling_price INTO v_curr_p 
    FROM public.products WHERE id = (v_item->>'product_id')::uuid;

    INSERT INTO public.sale_items (
      sale_id, product_id, quantity, price, 
      purchase_price_snapshot, selling_price_snapshot
    )
    VALUES (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price')::numeric,
      v_curr_p.purchase_price,
      (v_item->>'price')::numeric
    );

    -- Reduce stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer,
        updated_at = now()
    WHERE id = (v_item->>'product_id')::uuid;

    -- Update running totals
    v_total_revenue := v_total_revenue + ((v_item->>'quantity')::integer * (v_item->>'price')::numeric);
    v_total_cost := v_total_cost + ((v_item->>'quantity')::integer * v_curr_p.purchase_price);
  END LOOP;

  v_total_profit := v_total_revenue - v_total_cost;

  -- Update final sale totals and legacy sync
  UPDATE public.sales
  SET total_revenue = v_total_revenue,
      total_cost = v_total_cost,
      total_profit = v_total_profit,
      total = v_total_revenue
  WHERE id = v_sale_id;

  RETURN v_sale_id;
END;
$$;

-- 5. ANALYTICS VIEWS (Updated to filter active)
DROP VIEW IF EXISTS public.v_product_profit_analysis CASCADE;
CREATE OR REPLACE VIEW public.v_product_profit_analysis AS
  SELECT
    p.id,
    p.name,
    p.image_url,
    p.stock_quantity as remaining_stock,
    COALESCE(SUM(si.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(si.quantity * si.selling_price_snapshot), 0) as total_revenue,
    COALESCE(SUM(si.quantity * si.purchase_price_snapshot), 0) as total_cost,
    COALESCE(SUM(si.quantity * (si.selling_price_snapshot - si.purchase_price_snapshot)), 0) as total_profit
  FROM public.products p
  LEFT JOIN public.sale_items si ON si.product_id = p.id
  WHERE p.is_active = TRUE
  GROUP BY p.id, p.name, p.image_url, p.stock_quantity;

-- 6. VOID SALE FUNCTION (Restores Stock + Deletes Record)
CREATE OR REPLACE FUNCTION public.void_sale(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item record;
BEGIN
  -- 1. Restore stock levels for each item in the sale
  FOR v_item IN 
    SELECT product_id, quantity 
    FROM public.sale_items 
    WHERE sale_id = p_sale_id
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity + v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id;
  END LOOP;

  -- 2. Delete the sale (CASCADE handles sale_items)
  DELETE FROM public.sales
  WHERE id = p_sale_id;
END;
$$;
