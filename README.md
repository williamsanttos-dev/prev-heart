# 🫀 PrevHeart API

API desenvolvida em **NestJS** para o projeto **PrevHeart**, um aplicativo mobile de monitoramento de saúde voltado para **idosos e cuidadores**.  
O sistema permite **vínculo entre usuários**, **notificações push**, **autenticação JWT** e **gerenciamento de dispositivos**.

---

## 🚀 Visão Geral

O objetivo do projeto é fornecer uma solução que facilite o **acompanhamento remoto de idosos** por parte de cuidadores e familiares.  
O app possibilita:
- Registro e login de usuários (cuidador/idoso)
- Persistência de sessão no dispositivo mobile
- Envio de **notificações push** via API do **Expo**
- Vínculo entre cuidador e idoso
- Registro de dispositivos móveis
- (Em desenvolvimento) Integração via **WebSockets** para leitura de sinais de BPM provenientes de uma API externa

---

## 🧩 Tecnologias

**Backend**
- [NestJS](https://nestjs.com/) — framework Node.js modular e escalável  
- [TypeScript](https://www.typescriptlang.org/) — tipagem estática e segurança no código  
- [Prisma ORM](https://www.prisma.io/) — abstração de banco de dados  
- [PostgreSQL](https://www.postgresql.org/) — persistência de dados  
- [JWT (JSON Web Token)](https://jwt.io/) — autenticação e controle de sessão  
- [Expo Push API](https://docs.expo.dev/push-notifications/overview/) — envio de notificações  
- [Swagger](https://swagger.io/) — documentação da API

---

## ⚙️ Como Rodar Localmente

### Pré-requisitos
- Docker

### Passos

```bash
# Clone o repositório
git clone https://github.com/williamsanttos-dev/prev-heart.git

# Acesse o diretório do backend
cd prev-heart/backend

# Inicie o container
docker compose up --build -d

# para acompanhar os logs da aplicação
docker logs -f backend_prev_heart

# Crie um arquivo .env com base no .env.example
# e configure as variáveis de ambiente
```

A API será executada em:
👉 http://localhost:3000

## Documentação da API

A documentação completa dos endpoints está disponível via Swagger:

🔗 http://localhost:3000/api/docs

## 🧭 Próximos passos / Roadmap

- Implementar WebSockets para receber sinais de BPM de API externa.
- Melhorar sistema de autenticação (refresh token, revogação).
- Adicionar testes de integração e cobertura completa.
- Monitoramento, logging e métricas (ex: Sentry, Prometheus).

## 💻 Frontend

O frontend deste projeto foi desenvolvido em **React Native**, e está disponível em:

👉 [Repositório do app mobile](https://github.com/williamsanttos-dev/prev-heart-app)
