# Arquitetura de Microsserviços

## Introdução
Em contraste com uma arquitetura monolítica, onde toda a aplicação está contida em uma única base de código implantada de uma só vez, a arquitetura de **Microsserviços** divide a aplicação em um conjunto de pequenos serviços autônomos e fracamente acoplados.

## Vantagens e Desvantagens

### Vantagens
- **Escalabilidade independente**: Permite escalar horizontalmente apenas os serviços sob maior estresse de carga.
- **Isolamento de falhas**: Uma falha crítica no serviço de notificações não derruba o serviço de checkout.
- **Flexibilidade tecnológica**: Cada serviço pode ser construído com a stack mais adequada (ex: IA em Python, API em Node.js, processamento de alta concorrência em Go).
- **Implantação independente**: Equipes menores entregam atualizações em seus microsserviços sem depender do cronograma de outros times.

### Desvantagens
- **Complexidade operacional**: Monitorar logs distribuídos, deploy de dezenas de serviços e orquestração de containers (Kubernetes).
- **Consistência de dados**: Garantir consistência entre múltiplos bancos de dados independentes é desafiador.
- **Overhead de rede**: A comunicação inter-serviços adiciona latência.

## Comunicação Inter-Serviços

### 1. Síncrona (REST, gRPC)
O serviço chamador envia uma requisição e aguarda ativamente a resposta. É acoplada e pode criar gargalos de latência.
- **gRPC**: Usa Protocol Buffers sobre HTTP/2, oferecendo chamadas de procedimento remoto extremamente rápidas e tipadas, perfeitas para redes internas de microsserviços.

### 2. Assíncrona (Message Brokers)
O serviço chamador publica um evento em um intermediário de mensagens (Message Broker) e prossegue com sua execução. Os serviços interessados assinam e consomem o evento em seu próprio ritmo.
- **Brokers Comuns**: **RabbitMQ** (focado em filas e roteamento complexo) e **Apache Kafka** (plataforma de streaming de eventos distribuídos de alta vazão).

## Padrões Importantes

### Banco de Dados por Serviço (Database-per-Service)
Cada microsserviço deve possuir e gerenciar seu próprio banco de dados de forma privada. Nenhum serviço externo pode acessar o banco diretamente, apenas através das APIs expostas.

### Padrão Saga (Saga Pattern)
Usado para gerenciar transações distribuídas que abrangem múltiplos microsserviços sem recorrer a transações de duas fases (2PC). Uma Saga é uma sequência de transações locais. Se uma transação local falhar, a Saga executa **transações compensatórias** para desfazer os efeitos das transações anteriores.
- **Orquestrada**: Um coordenador central gerencia as chamadas e decisões.
- **Coreografada**: Cada serviço reage a eventos e decide dar o próximo passo de forma descentralizada.
