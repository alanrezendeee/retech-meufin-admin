-- ============================================================================
-- MANIFESTO CANÔNICO DE PERMISSIONS — MeuFin (application retechfin)
-- Gerado da auditoria de 2026-07-02: todos os subjects referenciados no
-- front (rotas guarded + itens de menu). Idempotente: pode rodar quantas
-- vezes quiser (ON CONFLICT DO NOTHING) — só insere o que faltar.
--
-- Banco: retechauth-db (Railway). application_id do MeuFin:
--   e3c4e138-b672-4ca3-b11d-5c1c04e7af67
--
-- IMPORTANTE: inserir a permission NÃO dá acesso a ninguém — o acesso vem
-- do vínculo em role_permissions (tela Grupos & Permissões do admin).
-- ============================================================================

WITH manifest(subject, action, description) AS (
  VALUES
    -- Home (rota index /dashboard — SEM ela o usuário loga e vê acesso negado)
    ('retechfin.dashboard',   'view',   'Home do painel'),

    -- Financeiro
    ('finance.dashboard',     'view',   'Dashboard financeira'),
    ('finance.payables',      'view',   'Contas do Dia (a pagar/receber)'),
    ('finance.payables',      'manage', 'Liquidar lançamentos e anexar comprovantes'),
    ('finance.income',        'view',   'Receitas'),
    ('finance.income',        'manage', 'Gerenciar receitas'),
    ('finance.expenses',      'view',   'Despesas'),
    ('finance.expenses',      'manage', 'Gerenciar despesas'),
    ('finance.sources',       'view',   'Fontes de receita'),
    ('finance.sources',       'manage', 'Gerenciar fontes de receita'),
    ('finance.cards',         'view',   'Cartões de crédito'),
    ('finance.cards',         'manage', 'Gerenciar cartões'),
    ('finance.invoices',      'view',   'Faturas (import por PDF)'),
    ('finance.invoices',      'manage', 'Importar e confirmar faturas'),
    ('finance.accounts',      'view',   'Contas (corrente/poupança/carteira)'),
    ('finance.accounts',      'manage', 'Gerenciar contas'),

    -- Saúde Familiar
    ('health.dashboard',      'view',   'Dashboard de saúde'),
    ('health.family_members', 'view',   'Membros da família (inclui documentos pessoais)'),
    ('health.family_members', 'manage', 'Gerenciar membros e documentos'),
    ('health.labs',           'view',   'Laboratórios'),
    ('health.labs',           'manage', 'Gerenciar laboratórios'),
    ('health.markers',        'view',   'Catálogo de exames (marcadores)'),
    ('health.markers',        'manage', 'Gerenciar marcadores'),
    ('health.results',        'view',   'Resultados de exames'),
    ('health.results',        'manage', 'Gerenciar resultados'),
    ('health.documents',      'view',   'Documentos de saúde (item futuro do menu)'),

    -- Administração (IAM)
    ('admin.users',           'view',   'Ver usuários'),
    ('admin.users',           'manage', 'Gerenciar usuários'),
    ('admin.roles',           'view',   'Ver grupos e permissões'),
    ('admin.roles',           'manage', 'Gerenciar grupos'),
    ('admin.permissions',     'view',   'Ver catálogo de permissões'),
    ('admin.permissions',     'manage', 'Gerenciar catálogo de permissões'),

    -- Placeholders do menu legado (itens "em breve"; inserir é inofensivo)
    ('retechfin.transactions','view',   'Transações (em breve)'),
    ('retechfin.accounts',    'view',   'Contas legado (em breve)'),
    ('retechfin.categories',  'view',   'Categorias (em breve)'),
    ('retechfin.cards',       'view',   'Cartões legado (em breve)'),
    ('retechfin.goals',       'view',   'Metas (em breve)'),
    ('retechfin.settings',    'view',   'Configurações (em breve)')
)
INSERT INTO permissions (id, application_id, subject, action, description, active)
SELECT gen_random_uuid(), 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67', m.subject, m.action, m.description, true
FROM manifest m
ON CONFLICT (application_id, subject, action) DO NOTHING;

-- ============================================================================
-- CONFERÊNCIA 1: o que AINDA falta no banco vs o manifesto (deve retornar 0 linhas)
-- ============================================================================
-- WITH manifest(subject, action) AS (VALUES
--   ('retechfin.dashboard','view'),('finance.dashboard','view'),('finance.payables','view'),
--   ('finance.payables','manage'),('finance.income','view'),('finance.income','manage'),
--   ('finance.expenses','view'),('finance.expenses','manage'),('finance.sources','view'),
--   ('finance.sources','manage'),('finance.cards','view'),('finance.cards','manage'),
--   ('finance.invoices','view'),('finance.invoices','manage'),('finance.accounts','view'),
--   ('finance.accounts','manage'),('health.dashboard','view'),('health.family_members','view'),
--   ('health.family_members','manage'),('health.labs','view'),('health.labs','manage'),
--   ('health.markers','view'),('health.markers','manage'),('health.results','view'),
--   ('health.results','manage'),('health.documents','view'),('admin.users','view'),
--   ('admin.users','manage'),('admin.roles','view'),('admin.roles','manage'),
--   ('admin.permissions','view'),('admin.permissions','manage')
-- )
-- SELECT m.* FROM manifest m
-- LEFT JOIN permissions p ON p.application_id = 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67'
--   AND p.subject = m.subject AND p.action = m.action AND p.active
-- WHERE p.id IS NULL;

-- ============================================================================
-- CONFERÊNCIA 2: permissions órfãs no banco que o front NÃO referencia
-- (candidatas a desativar — revisar antes)
-- ============================================================================
-- SELECT subject, action FROM permissions
-- WHERE application_id = 'e3c4e138-b672-4ca3-b11d-5c1c04e7af67' AND active
--   AND subject NOT IN (
--     'retechfin.dashboard','retechfin.transactions','retechfin.accounts','retechfin.categories',
--     'retechfin.cards','retechfin.goals','retechfin.settings',
--     'finance.dashboard','finance.payables','finance.income','finance.expenses','finance.sources',
--     'finance.cards','finance.invoices','finance.accounts',
--     'health.dashboard','health.family_members','health.labs','health.markers','health.results','health.documents',
--     'admin.users','admin.roles','admin.permissions'
--   )
-- ORDER BY subject, action;
