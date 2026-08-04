# Project Status - Phase 1 Milestone 4 (Tailscale Funnel Internet Deployment Complete)

- **Active Branch**: `feature/internet-deployment`
- **Overall Status**: Phase 1 - Milestone 4 Complete & Physically Verified over Public Internet.
- **Hosting Method**: Tailscale Funnel assigned stable public domain `https://nemo.tail7499c7.ts.net`.
- **Public Origin Architecture**: Unified Node.js server serving Dashboard SPA at `/`, REST API under `/api`, and Socket.io under `/socket.io` on single port 4000.
- **Database Layer**: PostgreSQL support (`dbPool.js`, `001_init_schema.sql`) with `bcryptjs` password hashing and `devStorage` fallback for offline tests.
- **Parent Web Dashboard**: Built for production (`npm run build`), served same-origin at `https://nemo.tail7499c7.ts.net`.
- **Child Android App**: Configured with production public HTTPS domain (`https://nemo.tail7499c7.ts.net`), strict HTTPS enforcement (`cleartextTrafficPermitted="false"`), Android KeyStore AES-256-GCM encryption, and automatic exponential backoff reconnection over mobile data.
- **Physical Verification**: Tested on Samsung Galaxy A12 over public mobile data (parent login, 6-digit code generation, public pairing, active presence, network switching, and remote unpairing).
