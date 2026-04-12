# RSVP Platform

A fully configurable, self-hostable RSVP platform for any event — weddings, corporate retreats, birthday parties, reunions, and more. Built with a modern, production-grade tech stack including Next.js, Supabase, Docker, GitHub Actions CI/CD, and Grafana observability.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Guest management](#guest-management)
- [Access control](#access-control)
- [RSVP flow](#rsvp-flow)
- [Admin dashboard](#admin-dashboard)
- [Email blasts](#email-blasts)
- [Observability](#observability)
- [CI/CD pipeline](#cicd-pipeline)
- [Deploying to Railway](#deploying-to-railway)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Open source notes](#open-source-notes)
- [Future milestones](#future-milestones)
- [License](#license)

---

## Features

### Guest experience

- Name-based lookup against a pre-loaded invite list
- Group RSVP support — couples and families respond together in a single flow
- Conditional form logic — attending yes/no drives what questions appear
- Tag-gated secondary event questions — only eligible guests see secondary event options
- Configurable access control — public, password-protected, or token-based entry
- Configurable redo policy — allow or deny changes after initial submission
- Mobile-friendly, clean UI driven entirely by config

### Admin experience

- Password-protected admin dashboard
- Real-time guest list with response status, dietary info, song requests, and notes
- Filter guests by response status — all, responded, pending
- Delete individual RSVPs
- Tag-based email blasts via Resend
- Grafana dashboards for app health and guest response tracking

### Developer experience

- Fully config-driven — customize every label, question, and event detail without touching code
- Docker and Docker Compose for consistent local development
- GitHub Actions CI/CD — lint, type check, build, and deploy on every push
- Prometheus metrics with Grafana Alloy scraping and forwarding to Grafana Cloud
- PostgreSQL dashboards in Grafana via Supabase direct connection
- Row Level Security on all Supabase tables
- MIT licensed and open source

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Email | Resend |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Container registry | Docker Hub |
| Hosting | Railway |
| Observability | Grafana Cloud, Grafana Alloy, Prometheus |

---

## Architecture

The platform consists of two Railway services and one GitHub Actions pipeline:

- The app service runs the Next.js frontend and API routes
- The Alloy service scrapes metrics from the app and forwards to Grafana Cloud
- GitHub Actions builds and pushes a new Docker image on every merge to main
- Railway detects the new image and auto-redeploys

Data flow for guests: name lookup hits the Supabase guests table, the app checks group membership and routes to either a group or solo RSVP form, responses are written to the `responses` and `event_responses` tables, and the guest is marked as responded.

Data flow for admins: the dashboard reads from Supabase using the service role key which bypasses Row Level Security. Email blasts are sent via the Resend API to guests filtered by tag.

---

## Prerequisites

Before getting started make sure you have accounts and access to the following:

- Node.js 20 or higher — nodejs.org or via Homebrew with brew install node
- Docker Desktop — docker.com/products/docker-desktop
- GitHub account — github.com
- Supabase account — supabase.com
- Resend account — resend.com
- Railway account — railway.app
- Grafana Cloud account — grafana.com
- Docker Hub account — hub.docker.com

---

## Local development

### 1. Clone the repo

    git clone https://github.com/yourusername/rsvp-platform.git
    cd rsvp-platform

### 2. Set up Supabase

1. Create a new Supabase project at supabase.com
2. Go to SQL Editor and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_unique_constraints.sql`
3. Run the seed data from `supabase/seed/001_seed_data.sql`
4. Replace the seed data with your own guest list before deploying
5. Go to Project Settings then API and note your project URL, anon key, and service role key
6. Go to Project Settings then Database then Connection pooling and note your pooler host, port (`6543`), and user (format: `postgres.yourprojectref`)

### 3. Configure environment variables

Copy the example files and fill in your values:

    cp app/.env.example app/.env.local
    cp .env.example .env

📣 *Important Note*: Do not add quotes around values in `.env` files. Docker and Next.js read them as plain strings and quotes will be treated as part of the value.

### 4. Configure your event

Open `app/config.json` and customize for your event. Use `app/config.example.json` as a reference. See the [Configuration](#configuration) section for full details.

### 5. Run with Docker Compose

    docker compose up --build

This starts two containers: the app on port `3000` and Grafana Alloy for metrics scraping.

### 6. Run without Docker

    cd app
    npm install
    npm run dev

Visit `http://localhost:3000/rsvp` for the guest RSVP flow and `http://localhost:3000/admin` for the admin dashboard.

---

## Configuration

All event details, form labels, questions, and behavior are driven by `app/config.json`. No code changes are needed to customize the platform for your event.

### Config fields

| Field | Description |
|---|---|
| event.name | Displayed as the site title |
| event.date | Your event date |
| event.location | Your event location |
| primaryEvent.name | Name of the main event |
| primaryEvent.acceptLabel | Accept button text |
| primaryEvent.declineLabel | Decline button text |
| secondaryEvent.enabled | Show or hide secondary event questions |
| secondaryEvent.tag | Tag name that gates secondary event eligibility |
| secondaryEvent.question | Question shown to eligible guests |
| form.lookupTitle | Title on the name lookup page |
| form.lookupSubtitle | Subtitle on the name lookup page |
| form.lookupButton | Lookup button label |
| form.notFoundMessage | Error message when name is not found |
| form.dietaryLabel | Dietary restrictions question label |
| form.songLabel | Song request question label |
| form.noteLabel | Note question label for attending guests |
| form.declineNoteLabel | Note question label for declining guests |
| form.submitButton | Submit button label |
| secondaryForm.mealLabel | Meal preference question label |
| secondaryForm.shuttleLabel | Shuttle checkbox label |
| confirmation.title | Confirmation page heading |
| confirmation.message | Confirmation page message |
| access.type | Access control mode: none, password, or token |
| rsvp.allowChanges | Whether guests can resubmit and overwrite their response |

---

## Guest management

### Data model

The database consists of seven tables:

- `groups` — families or couples who RSVP together
- `guests` — individual invitees linked to a group
- `tags — labels` used for eligibility and email targeting
- `guest_tags` — many-to-many join between guests and tags
- `events` — primary and secondary events
- `responses` — one row per guest for the primary event
- `event_responses` — one row per guest per secondary event

### Adding guests

Edit `supabase/seed/001_seed_data.sql` before running it. Each guest needs a unique `UUID` for `id`, a `first_name` and `last_name`, an optional email address for email blasts, a `group_id` linking them to a group, and tags assigned via the `guest_tags table`.

**Note:** UUID format: use only hex characters (0-9 and a-f). Example: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

### Groups

Guests in the same group RSVP together in a single flow. When any group member looks up their name, all group members appear on the same form. A group of one behaves identically to a solo guest. Guests without a `group_id` are routed to the individual flow automatically.

### Tags

Tags control two things:

1. Secondary event eligibility — only guests tagged with the value in `secondaryEvent.tag` see the secondary event question
2. Email blast targeting — select one or more tags in the admin dashboard to send emails to a specific subset of guests

---

## Access control

Three access modes are available via the `access.type` field in `config.json`.

### None

Anyone with the URL can access the RSVP form. Suitable for internal events or when the URL is not publicly shared/hosted.

    "access": { "type": "none" }

### Password

Guests are redirected to a password entry page before accessing the RSVP form. To configure, set `RSVP_ACCESS_PASSWORD` in your environment variables.

    "access": { "type": "password" }

### Token

A secret token is embedded in the URL. Guests arriving without a valid token see a not-found page. Ideal for linking from an existing website where you control the entry point.

    "access": { "type": "token" }


To configure, set `RSVP_ACCESS_TOKEN` in your environment variables. Generate a secure token with:

    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Your invite link would look like:

    https://yourdomain.com/rsvp?token=your-token-here

Once a guest arrives with a valid token a session cookie is set for 7 days and they will not need the token again on the same device.

---

## RSVP flow

The full guest flow works as follows:

1. Guest visits `/rsvp` and enters their first and last name
2. If not found, an error message is shown
3. If found and `has_responded` is `true` **and** `allowChanges` is `false`, the guest is redirected to the `responded` page
4. If the guest belongs to a group, all group members appear together on one form
5. If the guest is solo, they see an individual form
6. Attending = NO path: guest leaves a note (optional) and submits — done
7. Attending = YES path: guest answers primary questions (dietary, song, note)
8. If eligible for the secondary event the secondary event question appears
9. Secondary event NO: guest submits — done
10. Secondary event YES: guest answers additional questions — done
11. On submit, responses are written to the database using `upsert` so resubmissions (if enabled) overwrite existing data

---

## Admin dashboard

The admin dashboard is accessible at `/admin` and is protected by a password set via `ADMIN_PASSWORD`. The session cookie expires after 24 hours.

### Features

- Summary stats showing total guests, responded, attending, and pending counts
- Full guest list sorted by last name with attending status badges
- Response details including dietary restrictions, song requests, notes, etc
- Tag badges on each guest card
- Filter by all, responded, or pending
- Delete individual RSVPs which resets `has_responded` to false
- Email blast composer with tag-based filtering

### Security notes

- The service role key is used for admin operations and bypasses Row Level Security
- The service role key is server-side only and is never exposed to the browser
- All admin API routes are server-side Next.js route handlers
- The proxy file (proxy.ts) protects all `/admin` routes except `/admin/login`

---

## Email blasts

Email blasts are sent via Resend from the admin dashboard.

### Setup

1. Create a Resend account at resend.com
2. Add and verify your sending domain in Resend under Domains
3. Generate an API key in Resend under API Keys
4. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in your environment variables

### Sending a blast

1. Go to the admin dashboard and scroll to the Email blast section
2. Optionally select one or more tags to target a subset of guests
3. If no tags are selected the email goes to all guests with an email address
4. Enter a subject and message
5. Click Send email blast
6. The result shows how many emails were sent successfully and how many failed

### Notes

- Only guests with an email address in the database will receive emails
- The free Resend tier allows 3,000 emails per month
- Email addresses in the seed data use example.com placeholders — replace with real addresses before deploying

---

## Observability

The platform includes a full observability stack powered by Grafana Cloud.

### Metrics

Custom Prometheus metrics are exposed at `/api/metrics`:

| Metric | Type | Description |
|---|---|---|
| `rsvp_submissions_total` | Counter | Total RSVP submissions labeled by attending (yes or no) |
| `rsvp_guest_lookups_total` | Counter | Total guest lookups labeled by result (found or not_found) |
| `nodejs_heap_size_used_bytes` | Gauge | Node.js heap memory usage |
| `process_cpu_seconds_total` | Counter | Total CPU time |

### Grafana Alloy

Grafana Alloy runs as a separate service and scrapes `/api/metrics` every 30 seconds, forwarding metrics to Grafana Cloud in the correct format. Locally, Alloy scrapes the app container directly over Docker's internal network. In production, Alloy scrapes the public Railway URL over `HTTPS`.

### Data sources

Two data sources are configured in Grafana Cloud:

1. Prometheus (Mimir) — app health metrics and custom RSVP counters
2. PostgreSQL — live guest data direct from Supabase via the connection pooler

### Suggested dashboard panels

- Total RSVPs submitted (Stat, Prometheus)
- Attending vs declined breakdown (Pie chart, Prometheus)
- Guest lookup results (Bar chart, Prometheus)
- Heap memory usage over time (Time series, Prometheus)
- App uptime (Stat, Prometheus)
- Full guest RSVP status table (Table, PostgreSQL)
- Response summary counts (Stat, PostgreSQL)

### Notes

- The `/api/metrics` endpoint is publicly accessible — this is required for Alloy to scrape it
- No sensitive guest data is exposed via the metrics endpoint — only aggregate counts

---

## CI/CD pipeline

### CI — runs on every push to any branch

1. Checkout code
2. Install Node.js 20
3. Install dependencies with `npm ci`
4. Run `ESLint`
5. Run TypeScript type check with `tsc --noEmit`

### CD — runs on merge to main only

1. Checkout code
2. Set up Docker Buildx
3. Login to Docker Hub using GitHub secrets
4. Build Docker image with `NEXT_PUBLIC_` variables baked in as build args
5. Push image to Docker Hub tagged as latest
6. Railway detects the new image and auto-redeploys

### GitHub secrets required

Add these in your GitHub repo under Settings then Secrets and variables then Actions:

- `DOCKERHUB_USERNAME` — your Docker Hub username
- `DOCKERHUB_TOKEN` — a Docker Hub access token with read and write permissions
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `NEXT_PUBLIC_SITE_URL` — your public production URL

### Important note on `NEXT_PUBLIC_` variables

Variables prefixed with `NEXT_PUBLIC_` are baked into the browser JavaScript bundle at build time, not injected at runtime. This means they must be passed as Docker build args in `deploy.yml`, they must be set as GitHub secrets, and if you change their values, you must trigger a new build for the change to take effect.

Server-side variables such as `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` are injected at runtime by Railway and do not need to be GitHub secrets.

---

## Deploying to Railway

### App service

1. Go to railway.app and create a new project
2. Click New Service then Docker Image
3. Enter your Docker Hub image in the format `yourdockerhubusername/rsvp-platform:latest`
4. Go to Variables and add all app environment variables with their actual values
5. Go to Settings then Networking then Generate Domain
6. Copy your Railway URL and update `NEXT_PUBLIC_SITE_URL` in GitHub secrets
7. Trigger a rebuild with `git commit --allow-empty -m "ci: set production URL"` and git push

### Alloy service

1. Click New Service then GitHub Repo
2. Select your `rsvp-platform` repo
3. Set Root Directory to `alloy`
4. Railway will build from `alloy/Dockerfile` automatically
5. Go to Variables and add the five Alloy environment variables with their actual values

### Auto-deployment

Railway watches your Docker Hub image for updates. When GitHub Actions pushes a new image Railway automatically redeploys with no manual steps required.

### Custom domain

1. Go to your app service then Settings then Networking
2. Click Custom Domain and enter your domain
3. Add the DNS record Railway provides to your domain registrar or DNS settings
4. Update `NEXT_PUBLIC_SITE_URL` in GitHub secrets to your custom domain
5. Trigger a rebuild so the new URL is baked into the browser bundle

---

## Environment variables

### App service variables

| Variable | Description | Required | Build arg |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your public site URL | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | No |
| `ADMIN_PASSWORD` | Admin dashboard password | Yes | No |
| `RSVP_ACCESS_TYPE` | Access mode: none, password, or token | Yes | No |
| `RSVP_ACCESS_TOKEN` | Token for token-based access | If token mode | No |
| `RSVP_ACCESS_PASSWORD` | Password for password-based access | If password mode | No |
| `RESEND_API_KEY` | Resend API key | Yes | No |
| `RESEND_FROM_EMAIL` | Verified sending email address | Yes | No |

### Alloy service variables

| Variable | Description | Required |
|---|---|---|
| `APP_HOST` | App hostname without protocol (e.g. yourapp.up.railway.app) | Yes |
| `SCRAPE_SCHEME` | http for local development, https for production | Yes |
| `GRAFANA_PROMETHEUS_URL` | Grafana Cloud Prometheus base URL without trailing slash | Yes |
| `GRAFANA_PROMETHEUS_USER` | Grafana Cloud Prometheus numeric user ID | Yes |
| `GRAFANA_PROMETHEUS_TOKEN` | Grafana Cloud API token | Yes |

---

## Database migrations

Run these SQL files in order in the Supabase SQL Editor when setting up a new project:

1. `supabase/migrations/001_initial_schema.sql` — creates all tables
2. `supabase/migrations/002_rls_policies.sql` — enables Row Level Security and adds policies
3. `supabase/migrations/003_unique_constraints.sql` — adds unique constraints for upsert support

Then run `supabase/seed/001_seed_data.sql` to populate example data. Replace the seed data with your own guest list before going live.

---

## Open source notes

This project is designed to be forked and customized for any event. A few things to keep in mind:

- All event-specific content lives in `app/config.json` — no code changes needed for basic customization
- All secrets live in environment variables — never commit `.env` or `.env.local` files. They are included in `.gitignore`, so by default they should not be published.
- The `proxy.ts` file handles authentication routing — do not rename it to middleware.ts as Next.js behavior differs
- UUID values in seed data must use only hex characters (0-9 and a-f)
- The `GRAFANA_PROMETHEUS_URL` must not include a trailing slash or the path `/api/prom/push` — the code appends the path automatically
- `NEXT_PUBLIC_` variables are build-time only — changes require a new Docker build to take effect
- The `/api/metrics` endpoint is intentionally public to allow Grafana Alloy to scrape it

---

## Future milestones

The following features are planned for a future release:

- Visual theme editor in the admin dashboard — color pickers, font selectors, and image uploads so non-technical deployers can customize the look and feel without touching config files
- SMS blasts via Twilio — send text message updates to guests using the same tag-based targeting as email blasts
- Pre-fill existing responses on resubmission — when `allowChanges` is true show the guest their existing answers pre-populated in the form

---

## License

MIT
