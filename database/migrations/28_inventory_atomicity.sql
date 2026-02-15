-- 1. Adicionar user_id para auditoria em inventory_transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_transactions' AND column_name = 'user_id') THEN
        ALTER TABLE inventory_transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Função RPC para processar venda com atomicidade (Database Transaction)
CREATE OR REPLACE FUNCTION process_sale_transaction(
  p_studio_id UUID,
  p_items JSONB,
  p_reason TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões do criador (necessário se o user não tiver permissão direta de update em tudo)
AS $$
DECLARE
  item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_price DECIMAL;
  v_current_qty INTEGER;
BEGIN
  -- Validar input
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No items provided');
  END IF;

  -- Loop nos itens
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::UUID;
    v_qty := (item->>'qty')::INTEGER;
    
    -- Trata preço (pode vir como número ou string)
    v_price := COALESCE((item->>'price')::DECIMAL, 0);

    -- 1. Verificar e Bloquear Produto (FOR UPDATE para evitar race condition)
    SELECT quantity INTO v_current_qty
    FROM products
    WHERE id = v_product_id AND studio_id = p_studio_id
    FOR UPDATE;

    IF v_current_qty IS NULL THEN
      RAISE EXCEPTION 'Product % not found or does not belong to studio', v_product_id;
    END IF;

    -- 2. Atualizar Quantidade
    UPDATE products
    SET quantity = quantity - v_qty
    WHERE id = v_product_id;

    -- 3. Inserir Transação
    INSERT INTO inventory_transactions (
      studio_id,
      product_id,
      type,
      quantity,
      unit_price,
      total_value,
      reason,
      user_id
    ) VALUES (
      p_studio_id,
      v_product_id,
      'sale',
      v_qty,
      v_price,
      (v_qty * v_price),
      p_reason,
      p_user_id
    );
  END LOOP;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, o rollback é automático na função, mas podemos retornar o erro formatado
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;
