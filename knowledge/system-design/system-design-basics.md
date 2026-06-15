# Fundamentos de System Design

## Escalabilidade: Vertical vs Horizontal

### Escalabilidade Vertical (Scale Up)
Consiste em adicionar mais poder computacional (mais CPU, memória RAM ou SSD) a um único servidor.
- **Prós**: Simples de gerenciar, sem mudanças de arquitetura.
- **Contras**: Possui um limite de hardware físico (teto de hardware) e representa um ponto único de falha (Single Point of Failure - SPOF).

### Escalabilidade Horizontal (Scale Out)
Consiste em adicionar mais servidores ao pool de recursos, dividindo a carga de requisições.
- **Prós**: Praticamente sem limite de escala, alta tolerância a falhas.
- **Contras**: Requer um balanceador de carga (Load Balancer), código stateless (sem salvar estado na máquina) e maior complexidade de rede.

## Mecanismos de Caching
O Cache armazena temporariamente dados de acesso frequente para reduzir o tempo de resposta e poupar o banco de dados principal.
- **Client Cache**: Salvo no navegador do usuário.
- **CDN (Content Delivery Network)**: Cache de arquivos estáticos (HTML, JS, CSS, imagens) distribuído geograficamente perto do usuário (ex: Cloudflare).
- **Application Cache / Distributed Cache**: Caching em memória na camada de aplicação (ex: **Redis** ou **Memcached**).

## Bancos de Dados: SQL vs NoSQL

| Característica | SQL (Relacional) | NoSQL (Não-Relacional) |
| :--- | :--- | :--- |
| **Estrutura** | Esquema tabular rígido (tabelas/colunas) | Esquemas flexíveis (documentos, chave-valor, grafos) |
| **Garantias** | Transações ACID estritas | Teorema BASE (Consistência Eventual) |
| **Escala** | Principalmente Vertical (Sharding é complexo) | Horizontal por design (Fácil particionamento) |
| **Casos de Uso**| Finanças, ERPs, dados estruturados complexos | Big Data, Logs, Catálogos, Mensagens, Tempo Real |

## Teorema CAP
Em qualquer sistema distribuído, você só pode garantir 2 de 3 propriedades simultaneamente:
1. **Consistency (Consistência)**: Toda leitura retorna a escrita mais recente ou um erro.
2. **Availability (Disponibilidade)**: Toda requisição recebe uma resposta que não seja de erro (sem garantia de dados atualizados).
3. **Partition Tolerance (Tolerância a Partições)**: O sistema continua operando mesmo que mensagens de rede sejam perdidas entre nós.

*Nota*: Em redes reais, a tolerância a partições (P) é obrigatória. Logo, sistemas distribuídos precisam escolher entre Consistência (CP) ou Disponibilidade (AP).
