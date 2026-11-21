---
layout: ../layouts/Docs.astro
title: "infra-TAK"
description: "Deploy and manage the whole TAK stack from a browser. No more SSH."
---

infra-TAK is a single web console that deploys and manages TAK infrastructure on one
server. Upload your TAK Server installer package, set a password, and drive the rest from the
browser — identity, certificates, SSL, video, automation and health monitoring included.

**No more SSH. No more editing XML by hand. No more running scripts and hoping.**

<div class="btn-row">
  <a class="btn btn-primary" href="https://github.com/takwerx/infra-TAK">View on GitHub</a>
  <a class="btn btn-ghost" href="https://github.com/takwerx/infra-TAK/releases">Latest release</a>
</div>

## Watch the install

<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/YtcSL4vQ8AM" loading="lazy" title="infra-TAK installation" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe></div>

## What it deploys

- **TAK Server** — upload your installer package, configure, deploy, manage CoreConfig from the browser
- **Federation Hub** — on this machine or a remote VPS, with SSO, certificates and monitoring
- **Authentik** — identity provider with automated LDAP configuration for TAK Server auth
- **TAK Portal** — user and certificate management, auto-wired to Authentik and TAK Server
- **Caddy SSL** — Let's Encrypt certificates and reverse proxy
- **CloudTAK** — browser-based TAK client
- **MediaMTX** or **TAK Video Restreamer** — real-time video (RTSP, RTSPS, SRT, HLS, RTMP, KLV)
- **Node-RED** — flow-based automation behind Authentik forward auth
- **Email Relay** — outbound email for notifications and alerts
- **[ATLAS](/atlas-mdm/)** — self-hosted device management (MDM) for Android devices that run ATAK
- **Guard Dog** — health monitoring and auto-recovery across the whole stack

## Install

Clone the repo and run the installer as root. It detects your OS, package manager and
architecture, installs what it needs, asks you to set an admin password, and starts the
console.

```bash
# Ensure git is installed (Ubuntu usually has it; bare RHEL/Rocky cloud images often don't)
command -v git >/dev/null 2>&1 || sudo apt-get install -y git 2>/dev/null || sudo dnf install -y git

git clone --depth 1 https://github.com/takwerx/infra-TAK.git
cd infra-TAK
sudo ./start.sh
```

Then open the URL it prints and log in. That is the whole install.

To follow the latest work before it reaches a tagged release, clone the `dev` branch
instead:

```bash
git clone --depth 1 -b dev https://github.com/takwerx/infra-TAK.git
```

### Updating

Use **Update Now** in the console, or pull and restart:

```bash
sudo systemctl restart takwerx-console
```

Your password and configuration live in the install directory's `.config/`, so updates
leave them alone.

## Requirements

| | |
|---|---|
| **Platform** | Ubuntu 22.04 LTS, Rocky Linux / RHEL 9, or ARM64 |
| **Access** | Root |
| **RAM** | 8 GB+ for TAK Server; more for the full stack |
| **Disk** | 50 GB+ recommended (a full deployment sits around 26 GB before data) |
| **Storage** | SSD-backed — slow disk I/O causes build timeouts and unreliable boots |
| **CPU** | 4 cores minimum for TAK Server; more for the full stack |
| **TAK Server** | Your own installer package from [tak.gov](https://tak.gov) |

A fresh install is strongly recommended. Test your VPS disk speed before deploying —
the repo README has the exact commands.

## Where to get help

Read the [full README](https://github.com/takwerx/infra-TAK#readme) for deployment order,
port tiers, recovery procedures and the changelog. Found a bug or want a feature? Open an
[issue](https://github.com/takwerx/infra-TAK/issues).
