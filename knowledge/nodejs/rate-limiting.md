# Rate Limiting em APIs Node.js

## O que é Rate Limiting?
Rate Limiting (Limitação de Taxa) é uma técnica usada para controlar a taxa de requisições enviadas ou recebidas por uma API ou servidor. É fundamental para proteger recursos contra ataques de negação de serviço (DDoS), abuso de API, web scraping excessivo e para garantir equidade de uso do sistema entre os usuários.

## Algoritmos Comuns de Rate Limiting

### 1. Token Bucket (Balde de Tokens)
- Cada cliente tem um "balde" que armazena uma quantidade máxima de tokens.
- Cada requisição consome um token.
- Os tokens são repostos a uma taxa constante (ex: 5 tokens por minuto).
- Se o balde estiver vazio, as requisições adicionais são rejeitadas (HTTP 429 - Too Many Requests).
- **Vantagem**: Permite picos repentinos de tráfego (bursts).

### 2. Leaky Bucket (Balde Furado)
- As requisições entram em uma fila e são processadas a uma velocidade constante.
- Se a fila transbordar, as novas requisições são imediatamente rejeitadas.
- **Vantagem**: Garante um fluxo constante e suavizado de saída, perfeito para evitar sobrecarga no banco de dados.

### 3. Fixed Window (Janela Fixa)
- Divide o tempo em intervalos fixos (ex: das 10h00 às 10h01).
- Cada janela tem um limite máximo de requisições.
- **Problema**: Pode permitir o dobro do limite se as requisições ocorrerem na transição das janelas (borda da janela).

### 4. Sliding Window Counter (Contador de Janela Deslizante)
- Mede o número de requisições feitas na janela deslizante exata anterior ao momento atual.
- Evita os problemas de borda da Janela Fixa.

## Como Implementar em Node.js / Next.js
No Node.js, comumente utiliza-se bibliotecas como `express-rate-limit` ou armazenamento em memória compartilhada como o **Redis** ou **Upstash** para ambientes serverless (onde o estado local não persiste entre chamadas).

```typescript
// Exemplo conceitual de Rate Limiting simples por IP no Next.js Route Handler usando Redis/Upstash
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const ip = request.ip || "127.0.0.1";
  
  // Exemplo de verificação com Redis
  // const limitResult = await redis.incr(ip);
  // if (limitResult > 100) return new NextResponse("Too Many Requests", { status: 429 });
  
  return NextResponse.next();
}
```
