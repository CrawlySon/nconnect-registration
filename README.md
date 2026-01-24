# nConnect26 Registračný Systém

Webová aplikácia pre registráciu účastníkov na konferenciu nConnect26.

## 🚀 Funkcie

- **Registrácia účastníkov** - jednoduchý formulár pre novú registráciu
- **Výber prednášok** - prehľadný program rozdelený podľa časov a stage
- **Validácia konfliktov** - automatická kontrola časových konfliktov
- **Kapacitné limity** - sledovanie obsadenosti prednášok
- **Email notifikácie** - potvrdenia pri každej zmene
- **Admin rozhranie** - správa prednášok a export dát

## 📋 Požiadavky

- Node.js 18+
- Účet na [Supabase](https://supabase.com) (free tier stačí)
- Účet na [Vercel](https://vercel.com) (free tier stačí)
- Účet na [Resend](https://resend.com) (free tier - 3000 emailov/mesiac)

## 🛠️ Inštalácia

### 1. Supabase Setup

1. Vytvor nový projekt na [supabase.com](https://supabase.com)
2. Choď do **SQL Editor**
3. Skopíruj a spusti obsah súboru `database/schema.sql`
4. V **Project Settings > API** nájdeš:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

### 2. Resend Setup

1. Vytvor účet na [resend.com](https://resend.com)
2. V **API Keys** vytvor nový kľúč → RESEND_API_KEY
3. V **Domains** môžeš pridať vlastnú doménu (voliteľné)

### 3. Environment Variables

Vytvor súbor `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_xxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Lokálny vývoj

```bash
# Inštalácia závislostí
npm install

# Spustenie dev servera
npm run dev
```

Aplikácia beží na http://localhost:3000

### 5. Nasadenie na Vercel

1. Push kód na GitHub
2. Na [vercel.com](https://vercel.com) importuj repozitár
3. Pridaj environment variables (rovnaké ako v `.env.local`, ale s produkčným URL)
4. Deploy!

## 📁 Štruktúra projektu

```
src/
├── app/
│   ├── page.tsx          # Hlavná stránka (registrácia)
│   ├── login/            # Prihlásenie existujúcich účastníkov
│   ├── sessions/         # Výber prednášok
│   ├── admin/            # Admin rozhranie
│   └── api/              # API endpointy
├── components/           # React komponenty
├── lib/                  # Utility funkcie
│   ├── supabase/         # Supabase klienty
│   ├── email.ts          # Email funkcie
│   └── utils.ts          # Pomocné funkcie
└── types/                # TypeScript typy
```

## 🔐 Admin rozhranie

Admin dashboard je dostupný na `/admin`. 

⚠️ **TODO pre produkciu**: Pridať autentifikáciu pre admin sekciu!

## 📧 Email notifikácie

Systém posiela emaily pri:
- Novej registrácii
- Prihlásení na prednášku
- Odhlásení z prednášky

## 🎨 Customizácia

- **Farby**: `tailwind.config.js` - sekcia `colors.nconnect`
- **Logo/branding**: `src/app/layout.tsx`
- **Email šablóny**: `src/lib/email.ts`

## 📊 Export dát

Admin môže exportovať všetky registrácie do CSV cez `/api/admin/export`

## 🐛 Troubleshooting

### "Nepodarilo sa načítať dáta"
- Skontroluj Supabase credentials v `.env.local`
- Skontroluj, či je spustený SQL schema

### Emaily neprichádzajú
- Skontroluj Resend API key
- Skontroluj spam folder
- V Resend dashboarde skontroluj logy

### Kapacita sa neaktualizuje
- Supabase service role key musí mať práva na update

## 📝 License

MIT

---

Vytvorené pre **nConnect26** konferenciu 🎉
