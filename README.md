# AI Career Coach

O **AI Career Coach** é uma plataforma web moderna e interativa que utiliza Inteligência Artificial de última geração, **RAG (Retrieval-Augmented Generation)**, e um banco de dados vetorial para auxiliar desenvolvedores de software a impulsionarem suas carreiras técnicos.

A plataforma permite que os usuários façam análises profundas de seus currículos, comparem perfis com vagas do mercado, criem cronogramas de estudo semanais hiper-personalizados baseados em seções de conteúdo recuperadas de forma semântica, e realizem simulações de entrevistas técnicas interativas com feedback em tempo real.

---

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS v4, TypeScript, Lucide Icons.
- **IA & RAG**: Vercel AI SDK v4/v6, OpenAI (GPT-4o para agentes, `text-embedding-3-small` para busca vetorial).
- **Banco de Dados**: Supabase PostgreSQL, extensão `pgvector` para indexação e busca por similaridade cosseno (HNSW).
- **Parsers de Arquivos**: `pdf-parse` (extração de PDFs) e `mammoth` (extração de documentos DOCX/Word).

---

## ⚙️ Arquitetura dos Agentes de IA

A aplicação é orquestrada por **4 Agentes Especializados** que interagem entre si através de APIs estruturadas:

1. **Agent 1 - Resume Analyzer**: Lê o currículo bruto em texto, infere a senioridade (Junior, Pleno, Sênior, Especialista), lista as competências encontradas, e resume os pontos fortes e gaps técnicos do candidato.
2. **Agent 2 - Job Matcher**: Compara as experiências do candidato com os requisitos de uma vaga de emprego informada, calculando um Score de Compatibilidade (0% a 100%), mapeando as competências atendidas, habilidades ausentes (gaps) e sugerindo recomendações práticas de adequação.
3. **Agent 3 - Learning Planner (RAG)**: Executa um pipeline de RAG para as principais habilidades ausentes identificadas. Busca seções conceituais no banco de dados via busca vetorial e cria uma trilha semanal de estudos contextualizada e referenciada nas fontes locais.
4. **Agent 4 - Interview Simulator (RAG Chat)**: Conduz uma simulação de entrevista técnica interativa em tempo real com fluxo de Chat Streaming de alta performance. Ele faz perguntas técnicas desafiadoras baseadas no conteúdo e critérios da base de conhecimento recuperada e gera uma nota e scorecard detalhado ao fim do processo.

---

## 📂 Estrutura do Projeto

```text
├── knowledge/                # Arquivos Markdown da Base de Conhecimento RAG
│   ├── aws/                  # Conceitos de Cloud e Application Load Balancer
│   ├── behavioral/           # Preparação comportamental (Método STAR)
│   ├── nodejs/               # Tópicos de backend (Rate Limiting, etc.)
│   ├── postgresql/           # Otimização de bancos de dados (Indexação)
│   ├── react/                # Desenvolvimento Frontend (Hooks, Next Rendering)
│   └── system-design/        # Fundamentos de arquitetura e Microsserviços
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ingest/       # Endpoint de Ingestão de Conhecimento
│   │   │   ├── interview/    # Streaming de Chat do Simulador de Entrevista
│   │   │   ├── job/          # Endpoint do Comparador de Vagas
│   │   │   ├── learning-plan/# Endpoint de geração do plano de estudos RAG
│   │   │   └── resume/       # Endpoint de parsing e análise de currículo
│   │   ├── globals.css       # Configurações globais de estilos (Tailwind CSS v4)
│   │   ├── layout.tsx        # Layout mestre com metadados
│   │   └── page.tsx          # Interface Visual do Painel Interativo (Dashboard)
│   └── lib/
│       ├── agents.ts         # Orquestração e prompts de sistema dos 4 Agentes de IA
│       ├── file-parser.ts    # Extrator de texto unificado (PDF, DOCX, TXT)
│       ├── ingestion.ts      # Serviço de Chunking e vetorização OpenAI Embeddings
│       ├── supabase.ts       # Inicialização dos clientes Supabase (Public & Admin)
│       └── vector-search.ts  # Utilitário de busca vetorial pgvector
├── .env.example              # Exemplo de configuração de chaves
├── supabase_schema.sql       # Script SQL para criação das tabelas e funções RPC no Supabase
└── package.json              # Script e dependências do projeto
```

---

## 🛠️ Como Configurar o Projeto

### 1. Banco de Dados (Supabase)

1. Acesse seu painel do **Supabase** e crie um novo projeto.
2. Abra o **SQL Editor** do projeto.
3. Copie todo o conteúdo do arquivo `supabase_schema.sql` deste repositório e cole-o no SQL Editor do Supabase.
4. Execute o script. Ele habilitará a extensão `pgvector`, criará as tabelas necessárias (`users`, `resumes`, `jobs`, `knowledge_documents`, `knowledge_chunks`), criará os índices HNSW e definirá a função de busca por similaridade cosseno (`match_knowledge_chunks`).

### 2. Configurando as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (ou copie o `.env.example`) e configure as seguintes chaves de API:

```bash
# Supabase - Acesse Project Settings > API no Supabase
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica-do-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-privada-do-supabase  # Necessária para a ingestão de conhecimento

# OpenAI API - Necessária para orquestração de Agentes e Embeddings
OPENAI_API_KEY=sua-chave-da-openai-api
GOOGLE_GENERATIVE_AI_API_KEY=sua-chave-da-google-api
```

---

## 🚀 Executando a Aplicação

Instale as dependências e inicie o servidor de desenvolvimento:

```bash
# 1. Instalar dependências (com a flag para contornar peer-dependencies do React 19)
npm install --legacy-peer-deps

# 2. Executar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para interagir com a plataforma!

### 📥 Passo Importante: Ingerindo e Sincronizando a Base de Conhecimento RAG

Assim que a aplicação iniciar e estiver devidamente conectada ao Supabase e OpenAI, clique no botão **"Sincronizar RAG"** no canto superior direito do cabeçalho da plataforma (ou acesse a rota `/api/ingest` diretamente no seu navegador). 

Esse processo irá ler todos os arquivos markdown da pasta `knowledge/`, dividi-los em parágrafos temáticos, gerar os vetores conceituais de 1536 dimensões via OpenAI Embeddings e salvá-los no Supabase de forma totalmente automatizada. O processo é **idempotente** (pode ser executado várias vezes sem duplicar dados).

---

## 🏆 Critérios de Sucesso Atendidos

- [x] **Upload e Parsing de Currículos Funcional** (PDF, DOCX e Texto Bruto).
- [x] **Busca Vetorial & RAG Funcional** no Supabase utilizando `pgvector`.
- [x] **Trilha de Estudos Inteligente** e contextualizada nas referências encontradas por RAG.
- [x] **Simulador de Entrevista de Alta Performance** utilizando streaming de chat ao vivo.
- [x] **Design Visual Premium** e adaptável com Tailwind CSS v4.
- [x] **Zero Erros de Compilação ou Tipagem** em builds de produção do Next.js 15.
