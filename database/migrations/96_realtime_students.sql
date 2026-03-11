-- Migration 96: Adicionar tabela students à publicação Realtime
-- Permite que o dashboard atualize a contagem de alunos em tempo real quando:
-- - Alunos se vinculam via código de convite (vincular)
-- - Alunos geram QR Code no portal (attendance já estava na publicação)

ALTER PUBLICATION supabase_realtime ADD TABLE students;
