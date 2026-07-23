# Gestorsoluções — Instagram

Ferramentas para melhorar o Instagram (@gestorsolucoes) da Gestorsoluções: estratégia de marketing, um Claude Skill para gerar conteúdo on-brand e um app para agendar/publicar posts automaticamente via Instagram Graph API.

## Conteúdo do repositório

- **`docs/marketing-strategy.md`** — estratégia de marketing: benchmark de concorrentes (Saipos, Consumer, Grupo Casa Magalhães, Solução Sistemas), pilares de conteúdo, funil de leads e calendário editorial.
- **`.claude/skills/instagram-marketing-gestorsolucoes/`** — Claude Skill com a voz de marca e diretrizes de copy, para gerar legendas/roteiros consistentes com a estratégia.
- **App Next.js** (`src/app`, `src/components`, `src/lib`) — interface para agendar posts (imagem + legenda + data) e um endpoint de cron que publica automaticamente os posts cujo horário chegou, usando a [Instagram Graph API](https://developers.facebook.com/docs/instagram-platform/content-publishing).

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha os valores (nunca commite o `.env`):

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` — string de conexão de um banco Postgres (veja "Deploy na Vercel" abaixo para provisionar um gratuito).
   - `META_ACCESS_TOKEN` — token de acesso de longa duração de uma conta comercial do Instagram, gerado no [Meta for Developers](https://developers.facebook.com/).
   - `IG_USER_ID` — ID da conta comercial do Instagram (Instagram Business Account ID).
   - `CRON_SECRET` — valor aleatório forte, usado para autenticar chamadas ao endpoint `/api/cron/publish`.

3. Crie e aplique a migration inicial (primeira vez que conectar a um banco novo):

   ```bash
   npx prisma migrate dev --name init
   ```

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000) para agendar posts.

## Deploy na Vercel (pra rodar sem depender do seu computador)

O objetivo é ter a publicação automática rodando 24h sem precisar deixar nenhuma máquina ligada. Passo a passo:

1. **Criar conta na [Vercel](https://vercel.com)** (dá pra entrar direto com a conta do GitHub).

2. **Importar o repositório**: no dashboard da Vercel, "Add New" → "Project" → selecione `CristianoFrota/instagram-gestor-solu-es` → escolha a branch (`claude/gestorsolucoes-instagram-improvements-ofn2pc` ou a branch principal depois de mesclado).

3. **Provisionar o banco Postgres**: dentro do projeto na Vercel, aba "Storage" → "Create Database" → Postgres (Neon). A Vercel já injeta a variável `DATABASE_URL` automaticamente no projeto — não precisa copiar/colar.

4. **Configurar as demais variáveis de ambiente** (aba "Settings" → "Environment Variables" do projeto na Vercel):
   - `META_ACCESS_TOKEN`
   - `IG_USER_ID`
   - `CRON_SECRET`

5. **Gerar a migration inicial contra o banco real** (só na primeira vez, a partir do seu computador):

   ```bash
   vercel env pull .env   # baixa as variáveis reais do projeto na Vercel, incluindo DATABASE_URL
   npx prisma migrate dev --name init
   git add prisma/migrations
   git commit -m "Adiciona migration inicial do banco de producao"
   git push
   ```

   Isso cria os arquivos de migration e já aplica no banco real. Deploys seguintes na Vercel rodam `prisma migrate deploy` automaticamente (já configurado no `package.json`), então novas mudanças de schema só precisam desse mesmo processo.

6. **Deploy**: a Vercel builda e publica automaticamente a cada push na branch conectada.

7. **Cron automático**: o `vercel.json` já configura um Cron Job chamando `/api/cron/publish` a cada 15 minutos. A Vercel autentica essa chamada automaticamente com o valor de `CRON_SECRET` — não precisa configurar nada além do passo 4.

A partir daqui, agendar um post pela tela (`/`) é suficiente — a publicação acontece sozinha no horário certo, mesmo com o computador desligado.

## Publicação automática

O endpoint `POST`/`GET` `/api/cron/publish` busca posts com status `SCHEDULED` cuja data já chegou e publica cada um via Instagram Graph API (duas etapas: cria o container de mídia e depois publica). Ele exige o cabeçalho `Authorization: Bearer <CRON_SECRET>`.

Em produção na Vercel, o `vercel.json` já configura um Cron Job que chama esse endpoint a cada 15 minutos (a Vercel injeta a autenticação automaticamente a partir da env var `CRON_SECRET`).

Para chamar manualmente:

```bash
curl -X POST http://localhost:3000/api/cron/publish \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Importante**: a imagem enviada precisa estar acessível publicamente por URL — a Graph API não aceita upload direto de arquivo local nesta implementação.

## Segurança

- Nunca commitar tokens de acesso reais (`META_ACCESS_TOKEN`) ou segredos no repositório. Use sempre `.env` (já ignorado pelo git) ou variáveis de ambiente do provedor de deploy.
- Se um token for exposto acidentalmente (ex.: colado em um chat ou commit), revogue-o imediatamente no Meta for Developers e gere um novo.
