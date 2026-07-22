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

   - `DATABASE_URL` — já vem configurado para SQLite local (`file:./dev.db`).
   - `META_ACCESS_TOKEN` — token de acesso de longa duração de uma conta comercial do Instagram, gerado no [Meta for Developers](https://developers.facebook.com/).
   - `IG_USER_ID` — ID da conta comercial do Instagram (Instagram Business Account ID).
   - `CRON_SECRET` — valor aleatório forte, usado para autenticar chamadas ao endpoint `/api/cron/publish`.

3. Crie o banco de dados local:

   ```bash
   npx prisma migrate dev
   ```

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra [http://localhost:3000](http://localhost:3000) para agendar posts.

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
