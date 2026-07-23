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

## Automação de publicação via GitHub Actions (recomendado)

Essa é a forma mais simples e com menos peças de deixar a publicação automática rodando sem depender do seu computador nem de nenhum serviço de hospedagem — usa só o próprio GitHub, que já está configurado neste repositório.

Como funciona:

- Os posts agendados ficam no arquivo [`content/scheduled-posts.json`](./content/scheduled-posts.json) (um item por post: imagem, legenda, data/hora agendada, status).
- Um workflow do GitHub Actions ([`.github/workflows/publish-instagram.yml`](./.github/workflows/publish-instagram.yml)) roda a cada 15 minutos, verifica quais posts já venceram e publica cada um via Instagram Graph API. O próprio workflow atualiza o status no JSON e commita de volta (`PUBLISHED` ou `FAILED`, com o motivo do erro).
- Não precisa de banco de dados nem de servidor web rodando — só o GitHub.

Passo a passo pra ativar:

1. **Cadastrar os secrets**: no repositório no GitHub, vá em **Settings → Secrets and variables → Actions → New repository secret** e adicione:
   - `META_ACCESS_TOKEN`
   - `IG_USER_ID`

   (mesmos valores usados na Vercel; ficam criptografados e nunca são exibidos de novo, e são automaticamente mascarados nos logs do workflow).

2. **Tornar o repositório público**: a Instagram Graph API busca a imagem por URL pública, e o workflow usa `raw.githubusercontent.com` pra isso — que só funciona em repositórios públicos. Como o conteúdo aqui é material de marketing que vai para o Instagram público de qualquer forma (não há lógica de negócio proprietária no código), isso normalmente não é um problema — mas é uma decisão sua, então avise antes de eu seguir se preferir tornar público (Settings → General → Danger Zone → Change visibility) ou se prefere usar outro serviço de hospedagem de imagem (ex.: Cloudinary/imgbb) mantendo o repo privado — nesse segundo caso é só me avisar que ajusto o script.

3. **Agendar um novo post**: edite `content/scheduled-posts.json` adicionando um novo item (ou peça pra mim), aponte `imagePath`/`captionPath` para os arquivos do post e defina `scheduledFor`. Ao commitar, o próximo ciclo do workflow (até 15 min) publica automaticamente.

4. **Rodar manualmente**: na aba **Actions** do GitHub, escolha o workflow "Publicar posts agendados no Instagram" → **Run workflow**, pra testar sem esperar o cron.

## Deploy na Vercel (opcional — só pra ter a telinha de agendamento)

Esse caminho continua aqui pra quem quiser uma interface web pra agendar posts clicando (em vez de editar o JSON direto). Não é mais necessário pra automação em si — isso já é resolvido pelo GitHub Actions acima, que funciona independente da Vercel. Passo a passo:

1. **Criar conta na [Vercel](https://vercel.com)** (dá pra entrar direto com a conta do GitHub).

2. **Importar o repositório**: no dashboard da Vercel, "Add New" → "Project" → selecione `CristianoFrota/instagram-gestor-solu-es` → escolha a branch (`claude/gestorsolucoes-instagram-improvements-ofn2pc` ou a branch principal depois de mesclado).

3. **Provisionar o banco Postgres**: dentro do projeto na Vercel, aba "Storage" → "Create Database" → Postgres (Neon). A Vercel já injeta a variável `DATABASE_URL` automaticamente no projeto — não precisa copiar/colar.

4. **Configurar as demais variáveis de ambiente** (aba "Settings" → "Environment Variables" do projeto na Vercel):
   - `META_ACCESS_TOKEN`
   - `IG_USER_ID`
   - `CRON_SECRET`

5. **Deploy**: a Vercel builda e publica automaticamente a cada push na branch conectada. O comando de build já roda `prisma migrate deploy` sozinho, aplicando as tabelas no banco (a migration inicial já está commitada no repositório em `prisma/migrations/`) — nenhum comando manual é necessário.

6. **Cron automático**: o `vercel.json` já configura um Cron Job chamando `/api/cron/publish` a cada 15 minutos. A Vercel autentica essa chamada automaticamente com o valor de `CRON_SECRET` — não precisa configurar nada além do passo 4.

Se no futuro o schema do banco mudar (novos campos, por exemplo), aí sim é preciso gerar uma nova migration a partir de um computador com o projeto clonado (`npx prisma migrate dev --name <nome>`) e commitar o resultado — mas isso não é necessário para o setup inicial.

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
