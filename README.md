# VAMO — Build & Grow Your Startup

Vamo is a Lovable-style builder where non-technical founders iterate on their startup UI and business progress in parallel. Instead of toggling between UI and code, users toggle between:

- **UI Preview** — what they've built
- **Business Panel** — valuation, why they built the company, progress, traction signals

The product rewards real project progress with **pineapples** (an in-app currency redeemable for Uber Eats credits), and optionally lets founders list their project for sale or receive instant offers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | OpenAI API (gpt-4o-mini) |
| Hosting | Vercel |

## No Service Role Key

**Confirmed: No service role key is used anywhere in the codebase.** All data access goes through the anon key + user JWT + RLS policies. Admin operations use RLS policies that check `profiles.is_admin = true` via a `SECURITY DEFINER` function to avoid recursion.

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd vamo
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** to get your project URL and anon key
3. Go to the **SQL Editor** in Supabase Dashboard
4. Run each migration file **in order** from `supabase/migrations/`:
   - `001_profiles.sql` — Profiles table, RLS policies, and auto-create trigger
   - `002_projects.sql` — Projects table with owner CRUD and public view policies
   - `003_messages.sql` — Messages table for chat
   - `004_activity_events.sql` — Immutable activity timeline
   - `005_reward_ledger.sql` — Idempotent reward ledger
   - `006_redemptions.sql` — Pineapple redemptions
   - `007_listings.sql` — Marketplace listings
   - `008_offers.sql` — AI-generated offers
   - `009_analytics_events.sql` — Analytics event tracking
   - `010_missing_policies.sql` — Admin and owner update policies
   - `011_redeem_rpc.sql` — Atomic redemption RPC function
   - `012_fix_rls_recursion.sql` — Fix admin RLS infinite recursion with SECURITY DEFINER
   - `013_update_policy.sql` — Activity events admin policy update
   - `014_activity_events_nullable_project.sql` — Allow null project_id for non-project events

All tables have **Row Level Security (RLS) enabled**. The migrations create all necessary RLS policies.

**Alternative: Using the Supabase CLI**

If you prefer running migrations from the terminal:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Your project ref is in your Supabase URL: `https://YOUR_PROJECT_REF.supabase.co`

### 4. Auth Configuration

In your Supabase dashboard:

1. Go to **Authentication > Settings**
2. Under **Email Auth**, ensure "Enable Email Signup" is enabled
3. Optionally disable "Confirm Email" for faster development testing
4. (Optional) For Google OAuth: Go to **Authentication > Providers > Google** and configure with your Google Cloud credentials. Set the redirect URL to `https://your-domain.com/auth/callback`

### 5. Make Yourself Admin

1. Sign up through the app
2. In Supabase Dashboard, go to **Table Editor > profiles**
3. Find your row and set `is_admin` to `true`

### 6. Run the App

```bash
npm run dev
```

Visit `http://localhost:3000`

## Architecture

### Key Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/login` | Login page | No |
| `/signup` | Signup page | No |
| `/projects` | Project list | Yes |
| `/projects/new` | Create project | Yes |
| `/builder/[id]` | 3-panel builder workspace | Yes |
| `/wallet` | Pineapple wallet & redemptions | Yes |
| `/marketplace` | Public marketplace listings | No |
| `/admin` | Admin dashboard | Yes (admin only) |

### API Routes

| Route | Description |
|-------|-------------|
| `POST /api/chat` | AI chat with intent extraction, reward awarding, and business updates |
| `POST /api/rewards` | Pineapple reward engine (idempotent, rate-limited) |
| `POST /api/redeem` | Atomic pineapple redemption via RPC |
| `POST /api/offer` | AI-powered instant offer generation |

### Reward System

| Event | Pineapples |
|-------|-----------|
| Send a prompt | 1 |
| Tag a prompt (feature/customer/revenue) | +1 bonus |
| Link LinkedIn | 5 |
| Link GitHub | 5 |
| Link Website | 3 |
| Feature shipped (AI-detected) | 3 |
| Customer added (AI-detected) | 5 |
| Revenue logged (AI-detected) | 10 |

- All events tracked in `reward_ledger` with `idempotency_key` UNIQUE constraint
- Rate limited: max 60 rewarded prompts per project per hour
- Balance integrity maintained through atomic RPC and ledger audit trail

### Builder Workspace

The workspace uses a 3-panel layout mirroring Lovable's builder interface:
- **Left panel (~300px):** Builder Chat for logging progress updates
- **Center panel (flexible):** UI Preview with iframe, device toggle, and fallback states
- **Right panel (~360px):** Business Panel with valuation, progress score, traction signals, linked assets, and activity timeline

**Responsive behavior:**
- **Desktop (≥1280px):** All three panels visible side by side
- **Tablet (768–1279px):** Center + Right panels visible; Chat slides out from a floating button (Sheet)
- **Mobile (<768px):** Tab-based navigation between Chat, Preview, and Business

## Deployment

```bash
vercel deploy
```

Set environment variables in the Vercel dashboard before deploying.

## Limitations

- Redemption fulfillment is manual (admin marks as fulfilled in admin panel)
- Screenshot upload for listings uses URL input rather than file upload
- Google OAuth requires configuring the Google provider in Supabase Authentication settings
- AI-generated listing descriptions are best-effort and may need manual editing
