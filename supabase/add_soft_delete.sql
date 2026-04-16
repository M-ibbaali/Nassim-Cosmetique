-- Add soft delete support to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update the sale creation function to ensure we only sell active products
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
  v_total_revenue numeric(10,2) := 0;
  v_total_cost numeric(10,2) := 0;
  v_item    jsonb;
  v_stock   integer;
  v_purchase_price numeric(10,2);
  v_is_active boolean;
BEGIN
  -- Validate stock and active status for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock_quantity, purchase_price, is_active 
    INTO v_stock, v_purchase_price, v_is_active
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
    END IF;

    IF NOT v_is_active THEN
      RAISE EXCEPTION 'Product % is archived and cannot be sold', v_item->>'product_id';
    END IF;

    IF v_stock < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_id';
    END IF;
  END LOOP;

  -- Create sale record
  INSERT INTO public.sales (notes, created_by, total_revenue, total_cost, total_profit)
  VALUES (p_notes, p_user_id, 0, 0, 0)
  RETURNING id INTO v_sale_id;

  -- Insert items and reduce stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT purchase_price INTO v_purchase_price 
    FROM public.products WHERE id = (v_item->>'product_id')::uuid;

    INSERT INTO public.sale_items (
      sale_id, 
      product_id, 
      quantity, 
      price, 
      purchase_price_snapshot,
      selling_price_snapshot
    )
    VALUES (
      v_sale_id, 
      (v_item->>'product_id')::uuid, 
      (v_item->>'quantity')::integer, 
      (v_item->>'price')::numeric,
      v_purchase_price,
      (v_item->>'price')::numeric
    );

    -- Reduce stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer,
        updated_at = now()
    WHERE id = (v_item->>'product_id')::uuid;

    -- Update running totals
    v_total_revenue := v_total_revenue + ((v_item->>'quantity')::integer * (v_item->>'price')::numeric);
    v_total_cost := v_total_cost + ((v_item->>'quantity')::integer * v_purchase_price);
  END LOOP;

  -- Update final sale totals
  UPDATE public.sales
  SET total_revenue = v_total_revenue,
      total_cost = v_total_cost,
      total_profit = v_total_revenue - v_total_cost
  WHERE id = v_sale_id;

  RETURN v_sale_id;
END;
$$;
