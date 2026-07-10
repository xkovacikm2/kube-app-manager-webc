# Kube App Manager WebC

Small Lit application launcher that renders a homepage grid and a collapsible left drawer from an apps manifest, then opens the selected app inside the shell with an iframe.

## Features

- Responsive launcher grid with 6 / 3 / 1 columns across large, medium, and smallest viewports.
- Collapsed-by-default drawer with a Home action and optional expanded labels.
- Shared manifest source for both drawer and tile rendering.
- Development mode uses a static manifest fixture.
- Production mode fetches `/apps` from a real backend through the container's nginx proxy.
- Docker image build and GitHub Actions CI for tests, app build, image build, and Docker Hub publish.

## Development

Install dependencies and start the Vite dev server:

```sh
npm ci
npm run dev
```

Development loads app data from [public/dev-apps.json](/workspaces/kube-app-manager-webc/public/dev-apps.json).

## Testing

Run the automated tests:

```sh
npm test
```

Build the production bundle locally:

```sh
npm run build
```

## Production Backend Contract

Production does not use the static development manifest. The frontend fetches `/apps`, and the container's nginx config proxies that request to a real backend endpoint defined by `APPS_BACKEND_URL`.

Set `APPS_BACKEND_URL` to the full manifest endpoint exposed by your backend, for example:

```text
https://backend.example.com/apps
```

If `APPS_BACKEND_URL` is missing, the container exits on startup.

## Docker

Build the image:

```sh
docker build -t hocikto19/kube-app-manager-webc:local .
```

Run it against a real backend endpoint:

```sh
docker run --rm -p 8080:80 \
  -e APPS_BACKEND_URL=https://backend.example.com/apps \
  hocikto19/kube-app-manager-webc:local
```

The application will then be available at `http://localhost:8080` and nginx will proxy `/apps` to the configured backend endpoint.

## GitHub Actions

The workflow in [.github/workflows/ci.yml](/workspaces/kube-app-manager-webc/.github/workflows/ci.yml) does the following:

- Runs `npm ci`, `npm test`, and `npm run build` on pull requests and pushes.
- Builds the Docker image on pull requests and pushes.
- Pushes Docker image tags for `hocikto19/kube-app-manager-webc` on pushes to `main`.

Required repository secret:

- `DOCKER_PAT`: Docker Hub personal access token for the `hocikto19` account.

## Helm

The Helm chart lives in [helm/kube-app-manager-webc](/workspaces/kube-app-manager-webc/helm/kube-app-manager-webc).

The main values you will set are:

- `ingress.host`: the public host where Traefik should route the app.
- `appsBackendUrl`: the real backend `/apps` endpoint. If you leave this empty, the chart derives `https://<ingress.host>/apps` automatically so the backend stays aligned with the host.

Example install:

```sh
helm upgrade --install kube-app-manager-webc helm/kube-app-manager-webc \
  --set ingress.host=kovko.top \
  --set appsBackendUrl=https://kovko.top/apps
```

## Important Files

- [src/app-shell.ts](/workspaces/kube-app-manager-webc/src/app-shell.ts): main Lit shell component.
- [src/apps-manifest.ts](/workspaces/kube-app-manager-webc/src/apps-manifest.ts): manifest path selection, loading, and validation.
- [public/dev-apps.json](/workspaces/kube-app-manager-webc/public/dev-apps.json): development fixture manifest.
- [nginx/default.conf.template](/workspaces/kube-app-manager-webc/nginx/default.conf.template): production nginx template with backend proxy.
- [docker-entrypoint.d/40-require-apps-backend-url.sh](/workspaces/kube-app-manager-webc/docker-entrypoint.d/40-require-apps-backend-url.sh): startup guard requiring a real backend endpoint.
- [helm/kube-app-manager-webc](/workspaces/kube-app-manager-webc/helm/kube-app-manager-webc): Helm chart with Deployment, Service, and Traefik Ingress.