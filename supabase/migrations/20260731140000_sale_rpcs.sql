CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  p_recorded_by uuid,
  p_notes text,
  p_transaction_at timestamp with time zone,
  p_items jsonb
) RETURNS public.transactions AS $$
DECLARE
  v_transaction public.transactions;
  v_total_amount numeric := 0;
  v_total_profit numeric := 0;
  v_item jsonb;
BEGIN
  -- Calculate totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total_amount := v_total_amount + ((v_item->>'selling_price')::numeric * (v_item->>'quantity')::integer);
    v_total_profit := v_total_profit + (((v_item->>'selling_price')::numeric - (v_item->>'product_hpp')::numeric) * (v_item->>'quantity')::integer);
  END LOOP;

  -- Insert transaction
  INSERT INTO public.transactions (
    type,
    total_amount,
    total_profit,
    notes,
    recorded_by,
    transaction_at
  ) VALUES (
    'penjualan',
    v_total_amount,
    v_total_profit,
    p_notes,
    p_recorded_by,
    COALESCE(p_transaction_at, now())
  ) RETURNING * INTO v_transaction;

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.transaction_items (
      transaction_id,
      product_id,
      product_name,
      product_hpp,
      selling_price,
      quantity
    ) VALUES (
      v_transaction.id,
      NULLIF(v_item->>'product_id', '')::uuid,
      v_item->>'product_name',
      (v_item->>'product_hpp')::numeric,
      (v_item->>'selling_price')::numeric,
      (v_item->>'quantity')::integer
    );
  END LOOP;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.update_sale_transaction(
  p_transaction_id uuid,
  p_notes text,
  p_transaction_at timestamp with time zone,
  p_items jsonb
) RETURNS public.transactions AS $$
DECLARE
  v_transaction public.transactions;
  v_total_amount numeric := 0;
  v_total_profit numeric := 0;
  v_item jsonb;
BEGIN
  -- Calculate totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total_amount := v_total_amount + ((v_item->>'selling_price')::numeric * (v_item->>'quantity')::integer);
    v_total_profit := v_total_profit + (((v_item->>'selling_price')::numeric - (v_item->>'product_hpp')::numeric) * (v_item->>'quantity')::integer);
  END LOOP;

  -- Update transaction
  UPDATE public.transactions
  SET 
    total_amount = v_total_amount,
    total_profit = v_total_profit,
    notes = p_notes,
    transaction_at = COALESCE(p_transaction_at, transaction_at),
    updated_at = now()
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  -- Delete existing items
  DELETE FROM public.transaction_items WHERE transaction_id = p_transaction_id;

  -- Insert new items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.transaction_items (
      transaction_id,
      product_id,
      product_name,
      product_hpp,
      selling_price,
      quantity
    ) VALUES (
      v_transaction.id,
      NULLIF(v_item->>'product_id', '')::uuid,
      v_item->>'product_name',
      (v_item->>'product_hpp')::numeric,
      (v_item->>'selling_price')::numeric,
      (v_item->>'quantity')::integer
    );
  END LOOP;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
