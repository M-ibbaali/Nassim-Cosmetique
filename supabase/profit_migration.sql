-- ============================================================
-- PROFIT TRACKING UPGRADE MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. PRODUCTS: Add Purchase Price
ALTER TABLE public.products 
ADD COLUMN purchase_price NUMERIC(10,2) DEFAULT 0 CHECK (purchase_price >= 0);

-- Rename existing 'price' to 'selling_price' for clarity
ALTER TABLE public.products 
RENAME COLUMN price TO selling_price;

-- 2. SALE ITEMS: Add Snapshots
ALTER TABLE public.sale_items 
ADD COLUMN purchase_price_snapshot NUMERIC(10,2) DEFAULT 0 CHECK (purchase_price_snapshot >= 0),
ADD COLUMN selling_price_snapshot NUMERIC(10,2) DEFAULT 0 CHECK (selling_price_snapshot >= 0);

-- 3. SALES: Add Profit Totals
ALTER TABLE public.sales 
ADD COLUMN total_revenue NUMERIC(10,2) DEFAULT 0,
ADD COLUMN total_cost    NUMERIC(10,2) DEFAULT 0,
ADD COLUMN total_profit  NUMERIC(10,2) DEFAULT 0;

-- 4. REFACTOR: RPC create_sale_atomic
CREATE OR REPLACE FUNCTION public.create_sale_atomic(
  p_notes text,
  p_user_id uuid,
  p_items jsonb  -- [{ product_id, quantity, price }]
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
  -- Validate stock for all items first
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock_quantity, purchase_price, selling_price INTO v_curr_p
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF v_curr_p.stock_quantity IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
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
    -- Get current prices for snapshot
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
      (v_item->>'price')::numeric, -- Price from frontend (selling price at time of cart)
      v_curr_p.purchase_price,
      v_curr_p.selling_price
    );

    -- Update cumulative totals
    v_total_revenue := v_total_revenue + ((v_item->>'quantity')::integer * (v_item->>'price')::numeric);
    v_total_cost    := v_total_cost    + ((v_item->>'quantity')::integer * v_curr_p.purchase_price);

    -- Reduce stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  v_total_profit := v_total_revenue - v_total_cost;

  -- Final update for sale record
  UPDATE public.sales 
  SET 
    total_revenue = v_total_revenue,
    total_cost = v_total_cost,
    total_profit = v_total_profit,
    total = v_total_revenue -- sync legacy field
  WHERE id = v_sale_id;

  RETURN v_sale_id;
END;
$$;

-- 5. ANALYTICS VIEWS
CREATE OR REPLACE VIEW public.v_product_profit_analysis AS
  SELECT
    p.id,
    p.name,
    p.stock_quantity as remaining_stock,
    COALESCE(SUM(si.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(si.quantity * si.selling_price_snapshot), 0) as total_revenue,
    COALESCE(SUM(si.quantity * si.purchase_price_snapshot), 0) as total_cost,
    COALESCE(SUM(si.quantity * (si.selling_price_snapshot - si.purchase_price_snapshot)), 0) as total_profit
  FROM public.products p
  LEFT JOIN public.sale_items si ON si.product_id = p.id
  GROUP BY p.id, p.name, p.stock_quantity;

CREATE OR REPLACE VIEW public.v_profit_margin_overview AS
  SELECT
    COALESCE(SUM(total_revenue), 0) as total_revenue,
    COALESCE(SUM(total_cost), 0) as total_cost,
    COALESCE(SUM(total_profit), 0) as total_profit,
    CASE 
      WHEN SUM(total_revenue) > 0 THEN (SUM(total_profit) / SUM(total_revenue)) * 100 
      ELSE 0 
    END as avg_profit_margin
  FROM public.sales;

CREATE OR REPLACE VIEW public.v_profit_trend_daily AS
  SELECT
    created_at::date as day,
    SUM(total_revenue) as revenue,
    SUM(total_cost) as cost,
    SUM(total_profit) as profit
  FROM public.sales
  GROUP BY day
  ORDER BY day ASC;
