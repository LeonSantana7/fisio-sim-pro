# FisioSim Pro 🩺🚀

### Ecossistema Clínico para Fisioterapia Intensivista e Ventilação Mecânica

O **FisioSim Pro** é uma plataforma robusta e escalável projetada para auxiliar fisioterapeutas, médicos e estudantes na tomada de decisão clínica rápida e precisa. A aplicação integra ferramentas de cálculo, protocolos baseados em diretrizes internacionais e um simulador de mecânica respiratória em tempo real.

---

## 🏛️ Arquitetura do Sistema

O projeto segue padrões modernos de desenvolvimento para garantir manutenção e escalabilidade:

### 🎮 Backend (Node.js + Fastify) - Padrão MVC
A API foi estruturada utilizando a arquitetura Model-View-Controller:
- **Models/Services**: Encapsulam o acesso a dados via Prisma ORM e a lógica de negócio.
- **Controllers**: Gerenciam o fluxo de requisições, validações de entrada e respostas HTTP.
- **Routes**: Definições limpas de endpoints, desacopladas da lógica de execução.

### 💻 Frontend (React + Vite + TypeScript)
- **UI/UX Premium**: Design moderno com `Lucide React` e CSS personalizado.
- **Módulos Independentes**: Simulador, Protocolos e Calculadoras organizados de forma lógica.
- **Favicon Personalizado**: Identidade visual exclusiva com ícone de estetoscópio.

### 🐳 Infraestrutura (Docker)
- **Centralização**: Banco de dados PostgreSQL e Adminer gerenciados a partir da raiz do projeto.
- **Segurança**: Variáveis de ambiente sensíveis concentradas em arquivos `.env` protegidos pelo `.gitignore`.

---

## 🚀 Guia de Desenvolvimento (Setup Local)

### 1. Requisitos
- Docker Desktop
- Node.js v18+

### 2. Passo a Passo
1. **Clone e Configuração**:
   ```bash
   cp .env.example .env
   ```
2. **Subir Infraestrutura**:
   ```bash
   docker compose up -d
   ```
3. **Backend**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```
4. **Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

### 🧪 Executando Testes
Na pasta `backend`, execute:
- `npm test`: Roda diagnósticos de banco e testes de integração da API.

---

## ️ Tecnologias
- **SGBD**: PostgreSQL 16
- **ORM**: Prisma
- **Server**: Fastify (Node.js)
- **UI**: React 18 / TypeScript
- **Styling**: Vanilla CSS (Modern Design)

---
*FisioSim Pro - A tecnologia a serviço da Fisioterapia.*
