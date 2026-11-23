# Docker and VPS Deployment

Pushes to `main` run the existing lint, test, and build checks. After those pass, GitHub Actions connects to the VPS over SSH, updates the checkout, applies Prisma migrations, and rebuilds/restarts the Compose services. Pull requests and pushes to other branches do not deploy.

## VPS Setup

1. Install Docker Engine with the Compose plugin and Git on the VPS. Allow SSH and configure a reverse proxy such as Nginx with HTTPS; the app binds to `127.0.0.1:3000` by default and is not exposed directly to the internet.
2. Create a deployment directory owned by the SSH deployment user, then clone this public repository into it:

   ```sh
   sudo mkdir -p /opt/phause
   sudo chown "$USER":"$USER" /opt/phause
   git clone https://github.com/networsys-official/phause.git /opt/phause
   cd /opt/phause
   ```

3. Create the production environment file and set strong, unique values. The database password in `DATABASE_URL` must match `POSTGRES_PASSWORD`; use a URL-safe password or URL-encode special characters. Generate secrets with `openssl rand -hex 32`.

   ```sh
   cp .env.production.example .env.production
   chmod 600 .env.production
   nano .env.production
   ```

   Set `NEXT_PUBLIC_PLANS_API_URL` to the full HTTPS plans endpoint. The subscription page tries this endpoint directly, so it appears in DevTools Network; if the API rejects browser cross-origin requests, the page retries through the app's same-origin `/api/plans` route. This public URL is bundled during the Docker build, so changing it requires rebuilding the app image.

4. Add the public half of a dedicated SSH key to the deployment user's `~/.ssh/authorized_keys`. The private half is added to GitHub Actions secrets. The user must be able to run Docker commands without an interactive sudo prompt.
5. Copy the VPS host key entry from a trusted source into the `VPS_KNOWN_HOSTS` GitHub secret. Do not disable SSH host-key checking.

## GitHub Actions Secrets

In the repository's **Settings → Secrets and variables → Actions**, add:

- `VPS_HOST`: VPS hostname or IP address.
- `VPS_USER`: SSH deployment user.
- `VPS_SSH_KEY`: private key for that user.
- `VPS_KNOWN_HOSTS`: verified `known_hosts` entry for the VPS.
- `VPS_DEPLOY_PATH`: absolute path to the cloned repository, such as `/opt/phause`.
- `VPS_SSH_PORT`: optional SSH port; defaults to `22`.

The first deployment happens on the next successful push to `main`. The deploy workflow preserves `.env.production` and the named PostgreSQL data volume across updates. Back up the database volume separately; deployment is not a backup strategy.

To inspect the deployment on the VPS, run `docker compose --env-file .env.production ps` and `docker compose --env-file .env.production logs -f app` from the deployment directory.