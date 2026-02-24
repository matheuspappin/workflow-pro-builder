-- 59. Adicionar role 'finance' à tabela users_internal
-- Permite cadastro de perfis financeiros no ecossistema (extintores, etc.)

ALTER TABLE users_internal DROP CONSTRAINT IF EXISTS users_internal_role_check;
ALTER TABLE users_internal ADD CONSTRAINT users_internal_role_check 
CHECK (role IN ('super_admin', 'admin', 'professional', 'receptionist', 'seller', 'finance'));
