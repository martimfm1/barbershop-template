# Silentra Release Gate

## Obrigatório antes de merge para `main`

```text
P0
├── install --frozen-lockfile
├── typecheck
├── lint
├── build
├── smoke
├── security audit
└── plan contracts

P1
├── multi-tenant isolation
├── booking concurrency
├── reviews anti-abuse
├── plan quotas
├── Stripe webhook/idempotency
├── rate limiting
└── Storage isolation

P2
├── email deliverability
├── monitoring
├── backups / restore
├── mobile
├── accessibility
├── performance
├── SEO
└── GDPR/legal
```

A release só pode ser marcada como Production Ready quando os P0/P1 têm evidência de execução em staging.
