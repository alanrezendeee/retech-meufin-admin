-- Permissions das novas telas do módulo Financeiro (rodar no banco do retech-auth-api).
-- Mesmo padrão do insert do Admin IAM (2026-07-01): application_id do MeuFin.
-- Depois de inserir, vincular aos roles desejados em role_permissions
-- (ou usar a tela Grupos & Permissões do admin, que já faz isso).
--
-- Banco (prod Railway): retechauth-db — maglev.proxy.rlwy.net:50807

INSERT INTO permissions (id, application_id, subject, action, description, active)
VALUES
  (gen_random_uuid(), 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67', 'finance.dashboard', 'view',   'Ver a dashboard financeira', true),
  (gen_random_uuid(), 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67', 'finance.accounts',  'view',   'Ver contas (corrente/poupança/carteira/digital)', true),
  (gen_random_uuid(), 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67', 'finance.accounts',  'manage', 'Gerenciar contas', true),
  (gen_random_uuid(), 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67', 'finance.payables',  'view',   'Ver Contas do Dia (a pagar/receber)', true),
  (gen_random_uuid(), 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67', 'finance.payables',  'manage', 'Liquidar lançamentos e anexar comprovantes', true)
ON CONFLICT (application_id, subject, action) DO NOTHING;
