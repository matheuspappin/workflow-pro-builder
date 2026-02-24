-- Relax service_order_items constraint to allow manual items without product/service ID
ALTER TABLE service_order_items DROP CONSTRAINT IF EXISTS chk_item_reference;
