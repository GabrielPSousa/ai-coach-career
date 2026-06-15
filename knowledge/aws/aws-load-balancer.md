# AWS Elastic Load Balancing (ELB)

## Introdução
O Elastic Load Balancing (ELB) distribui automaticamente o tráfego de entrada de aplicativos entre vários destinos, como instâncias EC2, contêineres ECS, funções Lambda e endereços IP. Ele garante alta disponibilidade, tolerância a falhas e escalabilidade de forma transparente.

## Principais Tipos de Load Balancers

### 1. Application Load Balancer (ALB)
Opera na **Camada 7 (Aplicação)** do modelo OSI. Ele toma decisões de roteamento com base no conteúdo da requisição HTTP/HTTPS.
- **Recursos Principais**:
  - Roteamento baseado em caminhos URL (ex: `/api/*` vai para o Target Group de APIs, `/static/*` vai para outro).
  - Roteamento baseado em hostnames (ex: `app.example.com` vs `blog.example.com`).
  - Suporte nativo a WebSockets, HTTP/2 e gRPC.
  - Terminação SSL/TLS simplificada com AWS Certificate Manager (ACM).
  - Integração nativa com AWS WAF (Web Application Firewall) para segurança.

### 2. Network Load Balancer (NLB)
Opera na **Camada 4 (Transporte)** do modelo OSI. É projetado para lidar com milhões de requisições por segundo com latência ultrabaixa.
- **Recursos Principais**:
  - Encaminha tráfego TCP, UDP e TLS para os destinos.
  - Atribui um único endereço IP estático ou Elastic IP por Zona de Disponibilidade, ideal para integrações que exigem whitelist de IPs rígida.
  - Capaz de suportar picos extremos de tráfego repentinos.

### 3. Gateway Load Balancer (GWLB)
Ajuda a implantar, dimensionar e gerenciar appliances virtuais de terceiros (como firewalls, sistemas de prevenção de intrusão - IPS e firewalls de inspeção profunda de pacotes). Opera na Camada 3 (Rede).

## Target Groups (Grupos de Destino)
Um Target Group é usado para registrar destinos para onde o Load Balancer roteará as requisições. 
- Cada target group possui **Health Checks** (verificações de integridade). Se um destino falhar no health check (ex: retornar erro 500 ou não responder a um ping HTTP), o Load Balancer para de encaminhar tráfego para ele até que ele se recupere.

## Integração com Auto Scaling
O Load Balancer trabalha em conjunto com o **AWS Auto Scaling Group (ASG)**. Quando o tráfego aumenta e novas instâncias EC2 são criadas pelo ASG, elas se registram automaticamente no Target Group associado ao Load Balancer, recebendo tráfego instantaneamente.
