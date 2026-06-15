# Next.js Rendering Patterns (RSC, SSR, SSG, ISR, CSR)

## React Server Components (RSC)
No Next.js (App Router), os componentes por padrão são **React Server Components (RSC)**. Eles são renderizados exclusivamente no servidor.
- **Benefícios**: Menor bundle size enviado ao cliente, acesso direto aos recursos do backend (banco de dados, arquivos locais), melhor segurança (chaves de API seguras) e melhor SEO.
- **Limitações**: Não podem usar hooks de estado (`useState`, `useEffect`) nem interações do navegador (eventos de clique, APIs de window).

### Client Components
Para criar interatividade, adiciona-se a diretiva `"use client"` no topo do arquivo. Eles são pré-renderizados no servidor e hidratados no cliente.

## Estratégias de Renderização

### 1. Static Site Generation (SSG) / Static Rendering
A página é renderizada no momento do build. É excelente para performance e SEO, ideal para blogs, portfólios ou páginas institucionais.
- **Next.js**: Páginas sem dados dinâmicos de requisição são geradas estaticamente por padrão.

### 2. Server-Side Rendering (SSR) / Dynamic Rendering
A página é gerada no servidor a cada requisição do cliente. Útil para dados altamente dinâmicos e personalizados para cada usuário.
- **Next.js**: Para forçar renderização dinâmica, use `headers()`, `cookies()`, parâmetros de busca dinâmicos ou configure `export const dynamic = 'force-dynamic'`.

### 3. Incremental Static Regeneration (ISR)
Permite atualizar páginas estáticas em segundo plano após o build do projeto, sem precisar reconstruir todo o site. É uma mistura perfeita de SSG com SSR.
- **Next.js**: Usando o parâmetro `revalidate` na função fetch ou configurando `export const revalidate = 60` (em segundos).

```tsx
// Exemplo de fetch com ISR (revalida a cada 10 minutos)
async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 600 }
  });
  return res.json();
}
```
