-- Habilitar a extensão pgvector para trabalhar com embeddings vetoriais
create extension if not exists vector;

-- 1. Tabela de Usuários (simplificada para o MVP, compatível com Auth futuro)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inserir um usuário default para o MVP para que o fluxo funcione sem autenticação obrigatória inicialmente
insert into users (id, email)
values ('00000000-0000-0000-0000-000000000000', 'user@example.com')
on conflict (email) do nothing;

-- 2. Tabela de Currículos (Resumes)
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  content text not null,
  raw_text text, -- Conteúdo original extraído para referência
  metadata jsonb, -- Dados estruturados extraídos pelo Agent 1 (skills, seniority, strengths, weaknesses)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Vagas (Jobs)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  company text,
  description text not null,
  skills_required text[],
  skills_preferred text[],
  match_result jsonb, -- Resultado calculado pelo Agent 2 (score, matching_skills, missing_skills, recommendations)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Documentos de Conhecimento (Knowledge Documents)
create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null, -- ex: 'react/react-hooks.md'
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabela de Chunks de Conhecimento (Knowledge Chunks com Embeddings)
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references knowledge_documents(id) on delete cascade not null,
  content text not null,
  embedding vector(1536) not null, -- OpenAI text-embedding-3-small ou text-embedding-ada-002
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar índice de busca vetorial para melhorar a performance das consultas (HNSW ou IVFFlat)
-- Usamos cosseno (<=>) que é ideal para embeddings de texto
create index if not exists knowledge_chunks_embedding_idx 
on knowledge_chunks 
using hnsw (embedding vector_cosine_ops);

-- 6. Função RPC para Busca Vetorial (RAG)
create or replace function match_knowledge_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  document_title text,
  similarity float
)
language sql stable
as $$
  select
    kc.id,
    kc.document_id,
    kc.content,
    kd.title as document_title,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  join knowledge_documents kd on kc.document_id = kd.id
  where 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;
