/*
Master ordered list of study modules for the CI/CD & Containers Course. Drives
the dashboard, nav order, prev/next links on lesson pages, and the interview
drill question pool.
type: 'lesson' — loads data/lessons/<id>.js into lesson.html?id=<id>
type: 'drill'  — special page (href used directly)

This is the direct sequel to linux_course: that course's closing lesson
(linux-in-containers-preview) demystified a container as "just a process"
restricted by namespaces (what it can see) and cgroups (what it can use).
This course starts exactly there and builds up through Docker, Kubernetes,
and CI/CD pipelines to the point of actually shipping a real application.

Scope is deliberately lean: exactly what you need to go from "I've heard of
Docker" to "I can containerize an app, run it locally with Compose, deploy it
to a real Kubernetes cluster, and wire a CI/CD pipeline that builds, tests,
and ships it automatically on every push." Every lesson teaches essentials
first; lessons with real depth to spare also carry an optional `deepDive`
section, unlocked site-wide via the Essentials/Full Depth switch in the
header (see js/app.js).
*/
window.SCHEDULE = [
  // ── Part 0: From Process to Pipeline ─────────────────────────────────
  { id: 'why-containers-and-pipelines', title: 'From "Just a Process" to a Shippable Pipeline: Why This Course Exists', category: 'Part 0 — From Process to Pipeline', timeMin: 25, type: 'lesson' },
  { id: 'installing-docker', title: 'Installing Docker & Your First Container', category: 'Part 0 — From Process to Pipeline', timeMin: 25, type: 'lesson' },

  // ── Part 1: Docker Fundamentals ──────────────────────────────────────
  { id: 'images-vs-containers', title: 'Images vs. Containers: A Class and Its Instances', category: 'Part 1 — Docker Fundamentals', timeMin: 30, type: 'lesson' },
  { id: 'the-dockerfile', title: 'The Dockerfile: Scripting an Image, Layer by Layer', category: 'Part 1 — Docker Fundamentals', timeMin: 40, type: 'lesson' },
  { id: 'docker-cli-essentials', title: 'The Docker CLI: run, ps, logs, exec, stop & rm', category: 'Part 1 — Docker Fundamentals', timeMin: 35, type: 'lesson' },

  // ── Part 2: Building Good Images ─────────────────────────────────────
  { id: 'dockerfile-best-practices', title: 'Layer Caching & Multi-Stage Builds: Small, Fast, Reproducible Images', category: 'Part 2 — Building Good Images', timeMin: 40, type: 'lesson' },
  { id: 'environment-config-and-secrets', title: 'Config In, Secrets Out: Env Vars, Build Args & What Never Belongs in an Image', category: 'Part 2 — Building Good Images', timeMin: 35, type: 'lesson' },
  { id: 'image-registries', title: 'Registries & Tags: Pushing, Pulling & Versioning Images', category: 'Part 2 — Building Good Images', timeMin: 30, type: 'lesson' },

  // ── Part 3: Multi-Container Apps ─────────────────────────────────────
  { id: 'docker-networking', title: 'Docker Networking: How Containers Find Each Other', category: 'Part 3 — Multi-Container Apps', timeMin: 35, type: 'lesson' },
  { id: 'volumes-and-persistence', title: 'Volumes: Making Data Outlive the Container', category: 'Part 3 — Multi-Container Apps', timeMin: 30, type: 'lesson' },
  { id: 'docker-compose-essentials', title: 'Docker Compose: Your Whole Stack, One File, One Command', category: 'Part 3 — Multi-Container Apps', timeMin: 40, type: 'lesson' },

  // ── Part 4: Kubernetes Fundamentals ──────────────────────────────────
  { id: 'why-kubernetes', title: 'Why Kubernetes: The Problem Compose Cannot Solve', category: 'Part 4 — Kubernetes Fundamentals', timeMin: 35, type: 'lesson' },
  { id: 'pods-and-the-api-server', title: 'Pods & the API Server: Kubernetes\'s Declarative Core', category: 'Part 4 — Kubernetes Fundamentals', timeMin: 40, type: 'lesson' },
  { id: 'deployments-and-services', title: 'Deployments & Services: Self-Healing Replicas With a Stable Address', category: 'Part 4 — Kubernetes Fundamentals', timeMin: 45, type: 'lesson' },

  // ── Part 5: Kubernetes in Practice ───────────────────────────────────
  { id: 'configmaps-and-secrets-k8s', title: 'ConfigMaps & Secrets: Configuration Kubernetes\'s Way', category: 'Part 5 — Kubernetes in Practice', timeMin: 35, type: 'lesson' },
  { id: 'storage-in-kubernetes', title: 'Storage in Kubernetes: PersistentVolumes & Claims', category: 'Part 5 — Kubernetes in Practice', timeMin: 35, type: 'lesson' },
  { id: 'kubectl-and-troubleshooting', title: 'kubectl & Troubleshooting: describe, logs, exec & the Debugging Loop', category: 'Part 5 — Kubernetes in Practice', timeMin: 40, type: 'lesson' },

  // ── Part 6: CI/CD Pipelines ───────────────────────────────────────────
  { id: 'ci-cd-concepts', title: 'CI/CD Concepts: What Actually Happens Between "git push" and "It Is Live"', category: 'Part 6 — CI/CD Pipelines', timeMin: 30, type: 'lesson' },
  { id: 'github-actions-fundamentals', title: 'GitHub Actions: Workflows, Jobs, Steps & Triggers', category: 'Part 6 — CI/CD Pipelines', timeMin: 40, type: 'lesson' },
  { id: 'building-a-deploy-pipeline', title: 'Build, Push, Deploy: Wiring a Pipeline From Commit to Cluster', category: 'Part 6 — CI/CD Pipelines', timeMin: 45, type: 'lesson' },

  // ── Part 7: Shipping It & Capstone ───────────────────────────────────
  { id: 'rolling-updates-and-observability', title: 'Rolling Updates, Rollbacks & Health Checks: Deploying Without Downtime', category: 'Part 7 — Shipping It & Capstone', timeMin: 40, type: 'lesson' },
  { id: 'capstone-ship-it', title: 'Capstone: Dockerize, Compose, Deploy & Automate a Real App End to End', category: 'Part 7 — Shipping It & Capstone', timeMin: 60, type: 'lesson' },
];

/* Category → accent color, used for dashboard group headings, module-card
   left borders, and the lesson-page category pill. Eight distinct hues on
   the dark background, one per Part. */
window.CATEGORY_COLORS = {
  'Part 0 — From Process to Pipeline': '#4fd1c5',
  'Part 1 — Docker Fundamentals': '#63b3ed',
  'Part 2 — Building Good Images': '#9f7aea',
  'Part 3 — Multi-Container Apps': '#ecc94b',
  'Part 4 — Kubernetes Fundamentals': '#68d391',
  'Part 5 — Kubernetes in Practice': '#fc8181',
  'Part 6 — CI/CD Pipelines': '#f6ad55',
  'Part 7 — Shipping It & Capstone': '#ed64a6',
};
