# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** open a public GitHub issue
2. Email the maintainer directly with details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Security Measures

### Code Quality

- **Zero-warning policy**: No escape hatches (`eslint-disable`, `@ts-ignore`)
- **TypeScript strict mode**: All code type-checked
- **Dependency scanning**: Automated vulnerability checks
- **Pre-commit hooks**: Enforce quality gates before commits

### Data Handling

- **Client-side storage**: IndexedDB for log data (browser local storage)
- **No sensitive data**: Logs should not contain secrets, tokens, or PII
- **CORS**: API enforces CORS policies
- **Input validation**: All API inputs validated with Zod schemas

### Authentication & Authorization

**Phase 1a**: No authentication (public tool)

**Future phases** (TBD):
- Optional API key for BT-Servant integration
- Rate limiting on API endpoints
- HTTPS only for production deployments

### Dependency Management

- **pnpm**: Lockfile ensures reproducible builds
- **Renovate/Dependabot**: Automated dependency updates
- **npm audit**: Regular vulnerability scans

### Deployment

- **Fly.io**: Production deployments on secure infrastructure
- **Docker**: Isolated containers with minimal attack surface
- **HTTPS**: All production traffic encrypted
- **Health checks**: Continuous monitoring

## Best Practices for Contributors

1. **Never commit**:
   - API keys, tokens, or secrets
   - `.env` files with real credentials
   - Hardcoded passwords or sensitive data

2. **Use environment variables**:
   ```typescript
   // ❌ Bad
   const apiKey = "sk-1234567890";

   // ✅ Good
   const apiKey = process.env.API_KEY;
   ```

3. **Validate all inputs**:
   ```typescript
   import { z } from "zod";

   const LogEntrySchema = z.object({
     timestamp: z.string(),
     level: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]),
   });
   ```

4. **Sanitize user inputs**:
   - Escape HTML when rendering user-provided content
   - Validate file uploads (size, type, content)
   - Rate limit API requests

5. **Keep dependencies updated**:
   - Run `pnpm update` regularly
   - Review and merge automated dependency PRs
   - Check for security advisories

## Known Limitations

### Phase 1a (Current)

- **No authentication**: Anyone can access the tool
- **Client-side only**: Logs stored in browser (not backed up)
- **No rate limiting**: Open to abuse
- **No audit logs**: No tracking of who viewed what

These will be addressed in future phases as needed.

## Security Headers

Production deployments include:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Regular Security Audits

- **Monthly**: Review dependencies for vulnerabilities
- **Quarterly**: Manual code review of security-critical paths
- **Per-release**: Automated security scans in CI/CD

## Compliance

This tool is designed for internal engineering use and does not handle:
- Personal Identifiable Information (PII)
- Financial data
- Health information (HIPAA)
- Payment data (PCI-DSS)

If you plan to use this tool for regulated data, consult your compliance team first.
