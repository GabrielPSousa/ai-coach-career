# Indexação no PostgreSQL

## Introdução
Os índices são estruturas auxiliares de busca usadas para acelerar a recuperação de dados em um banco de dados relacional. Sem um índice, o PostgreSQL precisa realizar um escaneamento completo na tabela (*Sequential Scan*), o que se torna extremamente lento à medida que a tabela cresce.

## Tipos de Índices no PostgreSQL

### 1. B-Tree (Binary Tree)
O tipo de índice padrão e mais utilizado. Ele organiza os dados em uma árvore balanceada altamente eficiente para consultas baseadas em comparações de igualdade e intervalos.
- **Operadores suportados**: `<`, `<=`, `=`, `>=`, `>`.
- **Ideal para**: Chaves primárias, colunas únicas, IDs de chaves estrangeiras, datas e campos numéricos comuns.

### 2. GIN (Generalized Inverted Index)
Um índice invertido projetado para manipular valores que contêm múltiplos sub-valores dentro de uma única linha.
- **Ideal para**: Pesquisa de texto completo (Full-Text Search), colunas do tipo array, e documentos JSONB (`@>` operador de busca).

### 3. Hash
Armazena uma hash hashable do valor indexado. Suporta apenas comparações de igualdade simples (`=`). Geralmente é superado pelo B-Tree hoje em dia, mas consome menos espaço.

### 4. BRIN (Block Range Index)
Ideal para tabelas massivas de séries temporais ou sequenciais, onde os dados físicos estão naturalmente ordenados. Armazena apenas o menor e maior valor de blocos adjacentes.
- **Vantagem**: Ocupa uma fração minúscula de espaço em disco comparado ao B-Tree.

## Estratégias Avançadas de Indexação

### Índices Parciais
Indexa apenas um subconjunto de linhas que satisfaz uma condição constante. Isso economiza muito espaço e melhora a velocidade do índice.
```sql
-- Indexar apenas usuários ativos
create index idx_users_active_email on users(email) where active = true;
```

### Índices Baseados em Expressões
Útil para consultas que usam funções na cláusula `where`, o que normalmente invalidaria o uso de um índice B-Tree comum.
```sql
-- Indexar por e-mail transformado em minúsculas
create index idx_users_lower_email on users(lower(email));
```

## Analisando Performance com EXPLAIN ANALYZE
Para verificar se uma consulta está fazendo uso adequado dos seus índices, execute a query precedida por `EXPLAIN ANALYZE`:
```sql
explain analyze select * from users where email = 'user@example.com';
```
- procure por **Index Scan** ou **Bitmap Index Scan** (indica uso de índice).
- Evite **Seq Scan** (indica leitura linear de toda a tabela em disco).
