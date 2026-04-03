# Witchmaker – Gestionale campagne GDR

Applicazione Next.js per gestire campagne di giochi di ruolo: **Dungeons & Dragons** e **Daggerheart**.

## Funzionalità

- **Login/registrazione** (NextAuth con credentials)
- **Campagne**: creazione come **Master**, invito **Player** tramite email
- **Due giochi**: DnD e Daggerheart (scelta in creazione campagna)
- **Note** di campagna (tutti possono leggere e creare)
- **Sessioni**:
  - Sondaggio disponibilità: il Master propone più date, i giocatori rispondono "Posso" / "No"
  - Conferma data: il Master sceglie una data e la salva come prossima sessione
- **Personaggi**: i Player aggiungono personaggi con statistiche (DnD: Forza, Destrezza, ecc.; Daggerheart: Cuore, Spirito, Rischio) e note
- **Asset** (solo Master): immagini, NPC, luoghi (titolo, descrizione, URL immagine)
- **Messaggi privati**: Master ↔ singolo Player, Player → Master
- **UI responsive** (mobile e desktop)

## Avvio

1. **Variabili d'ambiente**  
   Copia `.env.example` in `.env` e imposta `NEXTAUTH_SECRET` in produzione (es. `openssl rand -base64 32`).  
   Se vedi l'errore *decryption operation failed*, il cookie di sessione è stato creato con un altro segreto: apri DevTools → Application → Cookies → elimina `next-auth.session-token` per localhost e accedi di nuovo.

2. **Database (PostgreSQL / Vercel Postgres)**  
   - **Produzione**: collega Vercel Postgres dal [Dashboard Vercel](https://vercel.com/dashboard) → Storage → Create Database → Postgres. Copia le variabili in `.env` (o vengono iniettate in deploy).  
   - **Locale**: imposta `DATABASE_URL` con la connection string del database (stesso Vercel Postgres o un Postgres locale).

   Poi:

   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Dev server**

   ```bash
   npm run dev
   ```

   Apri [http://localhost:3000](http://localhost:3000). Registrati, accedi e crea una campagna. Da "Inviti" invia l’email al giocatore; il giocatore si registra (con quella email) e apre il link invito (o va su `/campaigns/[id]/join`) per unirsi.

## Script

- `npm run dev` – sviluppo
- `npm run build` – build produzione
- `npm run start` – avvio in produzione
- `npm run db:generate` – genera Prisma Client
- `npm run db:push` – sincronizza schema DB
- `npm run db:studio` – Prisma Studio

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Prisma (PostgreSQL / Vercel Postgres)
- [@neondatabase/serverless](https://github.com/neondatabase/serverless) – client SQL raw per query one-shot/edge (opzionale, in `src/lib/neon.ts`)
- NextAuth (credentials)
- date-fns, zod
