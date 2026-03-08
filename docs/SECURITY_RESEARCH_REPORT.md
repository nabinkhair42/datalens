# Security Research Report: Web-Based Database Visualization Tool

## Executive Summary

Building a web-based database visualization tool where users enter credentials to connect and manage their databases presents significant security challenges. This report covers credential security, SQL injection prevention, network security, multi-tenancy, compliance requirements, attack vectors, and technical challenges based on industry best practices and current research.

---

## Table of Contents

1. [Credential Security](#1-credential-security)
2. [SQL Injection & Query Safety](#2-sql-injection--query-safety)
3. [Network Security](#3-network-security)
4. [Multi-Tenancy Security](#4-multi-tenancy-security)
5. [Compliance & Regulations](#5-compliance--regulations)
6. [Common Attack Vectors](#6-common-attack-vectors)
7. [Technical Challenges & Solutions](#7-technical-challenges--solutions)
8. [Security Checklist](#8-security-checklist)
9. [References](#9-references)

---

## 1. Credential Security

### 1.1 Encryption at Rest

**Best Practices:**
- Use **AES-256 encryption** for all stored credentials
- Implement **TLS 1.3** with Perfect Forward Secrecy for data in transit
- Never store encryption keys alongside the data they protect
- Rotate encryption keys every 90 days following [NIST recommendations](https://www.ibm.com/think/topics/database-security)

**Key Management Services (KMS):**
- Use dedicated KMS solutions: AWS KMS, Google Cloud KMS, Azure Key Vault, or HashiCorp Vault
- Centralize and secure the lifecycle of encryption keys
- Generate, store, distribute, rotate, and destroy keys following NIST policies

### 1.2 Envelope Encryption Pattern

Envelope encryption with key wrapping is ideal for avoiding mass re-encryption when rotating keys:

```
┌─────────────────────────────────────────────────────────┐
│  Data Encryption Key (DEK) encrypts the credential      │
│  Key Encryption Key (KEK) encrypts the DEK              │
│  Master Key encrypts the KEK                            │
└─────────────────────────────────────────────────────────┘
```

Benefits:
- Rotate KEKs without re-encrypting all data
- Maintain at least 2 key versions during rotation (decrypt with old, encrypt with new)
- [HashiCorp Vault Transit engine](https://developer.hashicorp.com/vault/tutorials/encryption-as-a-service) provides encryption-as-a-service

### 1.3 HashiCorp Vault Integration

[Vault](https://www.vaultproject.io/) provides comprehensive credential management:

- **Dynamic Credentials**: Generate unique credentials per session with automatic expiration
- **Automatic Rotation**: Eliminate long-standing shared credentials
- **15-minute Token Lifetime**: Authentication tokens expire automatically
- **Audit Logging**: Complete trail of all secret access
- **Transit Secrets Engine**: Encrypt data without storing it in Vault

### 1.4 Zero-Knowledge Architecture

A [zero-knowledge architecture](https://bitwarden.com/resources/zero-knowledge-encryption/) ensures the service provider cannot access user credentials:

**Implementation:**
1. **Client-Side Encryption**: Encrypt credentials in the browser before transmission
2. **Key Derivation**: Use PBKDF2-SHA256 with 310,000+ iterations
3. **User-Controlled Keys**: Encryption keys derived from user's master password
4. **Server Storage**: Store only encrypted ciphertext

**Benefits:**
- Even database breaches expose only encrypted data
- Legal compulsion cannot produce plaintext
- Simplifies compliance (provider becomes encrypted storage, not data processor)

**Trade-offs:**
- Cannot perform password recovery (user loses key = data loss)
- Server-side search/indexing of credentials impossible
- Higher client-side computational requirements

### 1.5 Session-Only vs Persistent Storage

| Approach | Pros | Cons |
|----------|------|------|
| **Session-Only** | Credentials never persist; minimal attack surface | User must re-enter for each session |
| **Encrypted Persistent** | Better UX; quick reconnection | Larger attack surface; key management complexity |
| **Zero-Knowledge Persistent** | User controls encryption; breach-resistant | Password recovery impossible |

**Recommendation:** Default to session-only storage with optional encrypted persistent storage using zero-knowledge architecture.

### 1.6 OAuth/SSO Integration for Cloud Databases

**AWS RDS IAM Authentication:**
- [IAM database authentication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html) for MySQL, MariaDB, PostgreSQL
- 15-minute token lifetime
- No password storage required
- Centralized access management via IAM
- Best for applications with fewer than 200 connections/second

**Azure AD Integration:**
- Managed Identity authentication
- Service Principal authentication
- Certificate-based authentication

**Google Cloud SQL:**
- IAM database authentication
- Cloud SQL Auth Proxy

---

## 2. SQL Injection & Query Safety

### 2.1 Parameterized Queries (Primary Defense)

The most effective prevention is [parameterized queries](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html):

```javascript
// VULNERABLE - String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// SAFE - Parameterized query
const query = 'SELECT * FROM users WHERE id = $1';
const result = await client.query(query, [userId]);
```

### 2.2 Query Allowlisting/Blocklisting

**Blocklist Dangerous Operations:**
- `DROP`, `TRUNCATE`, `DELETE` (without WHERE)
- `ALTER`, `CREATE`, `GRANT`, `REVOKE`
- System functions: `pg_read_file`, `pg_ls_dir`, `lo_export`

**Oracle SQL Firewall:**
[DBMS_SQL_FIREWALL](https://docs.oracle.com/en/database/oracle/oracle-database/23/arpls/dbms_sql_firewall.html) captures SQL activities and creates allow-lists to prevent injection attacks.

**Hasura Allow Lists:**
[GraphQL Engine allow lists](https://hasura.io/docs/2.0/security/allow-list/) restrict execution to pre-approved operations only.

### 2.3 Read-Only Mode Enforcement

**Database-Level:**
```sql
-- PostgreSQL: Create read-only user
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Prevent future table modifications
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

**Connection-Level:**
```sql
-- PostgreSQL: Set session to read-only
SET default_transaction_read_only = on;
```

**Application-Level:**
- Parse queries before execution
- Reject any non-SELECT statements
- Use query AST parsing for accurate detection

### 2.4 Query Sandboxing

**Strategies:**
1. **Statement Timeout**: Kill queries exceeding time limits
   ```sql
   SET statement_timeout = '30s';
   ```

2. **Resource Limits**: Limit memory, CPU per query
3. **Row Limits**: Enforce maximum result set sizes
4. **Query Complexity Analysis**: Reject expensive joins/subqueries

### 2.5 Input Validation Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Client-side validation (UX only)              │
│  Layer 2: API parameter validation                      │
│  Layer 3: Query parsing and analysis                    │
│  Layer 4: Parameterized query execution                 │
│  Layer 5: Database user permissions                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Network Security

### 3.1 SSL/TLS for Database Connections

**SSL Mode Options** (from [DbVisualizer documentation](https://www.dbvis.com/docs/12.0/database-connection-options/security/)):

| Mode | Description | Security Level |
|------|-------------|----------------|
| `disable` | No SSL | None |
| `allow` | Try non-SSL first, then SSL | Low |
| `prefer` | Try SSL first, then non-SSL | Medium |
| `require` | SSL required, no cert verification | Medium-High |
| `verify-ca` | Verify server certificate CA | High |
| `verify-full` | Verify CA + hostname | Highest |

**Best Practice:** Use `verify-full` in production; never use `skip-verify` except in trusted development environments.

### 3.2 SSH Tunneling Implementation

[SSH tunneling](https://tableplus.com/blog/2019/08/ssh-tunnel-secure-database-connection.html) provides encrypted connections through firewalls:

```
┌─────────────────────────────────────────────────────────┐
│  Client → SSH Server (port 22) → Database (port 5432)   │
│  All traffic encrypted through SSH tunnel               │
└─────────────────────────────────────────────────────────┘
```

**Configuration Tips:**
- Use 127.0.0.1 for database host (traffic routes through tunnel)
- Configure SSH Keep-Alive to prevent disconnection
- Support both password and key-based authentication
- Combine with SSL for defense-in-depth

### 3.3 IP Whitelisting Strategies

[IP allowlisting](https://nordlayer.com/blog/ip-whitelisting-for-cloud-security/) restricts database access to known IP addresses:

**Implementation:**
- Maintain whitelist at firewall/security group level
- Use static IPs or VPN for consistent addressing
- Consider [Azure Private Endpoints](https://learn.microsoft.com/en-us/azure/azure-sql/database/firewall-configure) or AWS PrivateLink

**Challenges:**
- Dynamic IPs require VPN solutions
- Labor-intensive maintenance
- Not a replacement for other security measures

### 3.4 Firewall Traversal for On-Premise Databases

**Options:**
1. **SSH Bastion Host**: Tunnel through jump server
2. **VPN Connection**: Site-to-site or client VPN
3. **Reverse Proxy**: Database proxy with outbound connection
4. **Cloud Interconnect**: AWS Direct Connect, Azure ExpressRoute

---

## 4. Multi-Tenancy Security

### 4.1 Isolation Patterns

Based on [AWS SaaS Architecture](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html) and [Azure patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns):

| Pattern | Isolation Level | Cost | Complexity | Best For |
|---------|-----------------|------|------------|----------|
| **Database-per-Tenant (Silo)** | Highest | High | Medium | Healthcare, Finance, Government |
| **Schema-per-Tenant (Bridge)** | High | Medium | Medium | Dozens to hundreds of tenants |
| **Shared with RLS (Pool)** | Medium | Low | High | Thousands of tenants, cost-sensitive |

### 4.2 Database-per-Tenant (Silo)

```
┌─────────────────────────────────────────────────────────┐
│  Tenant A → Database A (separate instance)              │
│  Tenant B → Database B (separate instance)              │
│  Tenant C → Database C (separate instance)              │
└─────────────────────────────────────────────────────────┘
```

**Pros:** Complete physical separation; easy compliance
**Cons:** Resource-intensive; connection pooling complexity

### 4.3 Row-Level Security (RLS)

[PostgreSQL RLS](https://redis.io/blog/data-isolation-multi-tenant-saas/) enforces isolation at the database engine level:

```sql
-- Enable RLS
ALTER TABLE customer_data ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation ON customer_data
    USING (tenant_id = current_setting('app.current_tenant')::int);

-- Set tenant context on each request
SET app.current_tenant = '123';
```

**Risk:** A single missed `WHERE tenant_id = ?` becomes a data leak.

### 4.4 Preventing Cross-Tenant Access

**Mandatory Controls:**
1. Embed tenant context in JWT tokens
2. Validate tenant context on every authorization decision
3. Use separate encryption keys per tenant (cryptographic isolation)
4. Implement query interceptors to inject tenant filters
5. Audit all cross-tenant access attempts

### 4.5 Resource Limits per Tenant

- Connection pool limits per tenant
- Query timeout enforcement
- Result set size limits
- Storage quotas
- API rate limiting

### 4.6 Audit Logging Requirements

**Must Capture:**
- Who accessed what data
- When access occurred
- What operations were performed
- Source IP and user agent
- Success/failure status

**Storage:**
- Immutable, append-only logs
- Separate from application data
- Retained per compliance requirements (7+ years for SOC 2)

---

## 5. Compliance & Regulations

### 5.1 GDPR Implications

**Connection Strings as PII:**
Database connection strings containing usernames may constitute personal data under GDPR if they can identify an individual.

**Data Residency:**
- [GDPR does not mandate strict data localization](https://gdprlocal.com/gdpr-data-residency-requirements/) but creates transfer limitations
- Personal data transfers outside EEA require adequacy decisions or safeguards
- Practical approach: Keep EU customer data in EEA regions

**Requirements:**
- Explicit consent for data processing
- Right to access and delete personal data
- Data breach notification within 72 hours
- Privacy by design and default

**Penalties:** Up to €20 million or 4% of global turnover

### 5.2 SOC 2 Requirements

[SOC 2 compliance](https://www.liquibase.com/resources/guides/soc-2-compliance-for-database-security-trust-services-criteria-best-practices) is essential for SaaS:

**Trust Services Criteria:**
1. **Security** (mandatory): Access controls, encryption, monitoring
2. **Availability**: Uptime commitments, disaster recovery
3. **Processing Integrity**: Data accuracy, completeness
4. **Confidentiality**: Data classification, encryption
5. **Privacy**: PII handling, consent management

**Database-Specific Controls:**
- Multi-factor authentication for database access
- Least privilege access (RBAC)
- [Audit trails](https://hoop.dev/blog/the-essential-guide-to-audit-logging-for-soc-2-compliance/) for all database activities
- Encryption at rest and in transit
- Change management documentation

### 5.3 HIPAA (Healthcare Customers)

**Technical Safeguards:**
- Access controls (unique user identification)
- Audit controls (log all ePHI access)
- Integrity controls (electronic mechanisms to corroborate data integrity)
- Transmission security (encryption of ePHI in transit)

**Business Associate Agreements:** Required with all vendors handling PHI

### 5.4 Data Residency Requirements by Region

| Region | Requirements |
|--------|--------------|
| **EU (GDPR)** | Transfer restrictions; adequacy or safeguards required |
| **China** | Strict localization; critical data must stay in China |
| **Russia** | Personal data of citizens must be stored locally |
| **Brazil (LGPD)** | Similar to GDPR; international transfers with safeguards |
| **USA** | No federal localization; sector-specific rules |

**Implementation:** Offer region-specific hosting; implement geo-fencing for data replication.

---

## 6. Common Attack Vectors

### 6.1 Server-Side Request Forgery (SSRF)

[SSRF attacks](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery) through database connections:

**Attack Scenarios:**
- Connecting to internal services (Redis, Memcached, Elasticsearch)
- Accessing cloud metadata endpoints (169.254.169.254)
- Port scanning internal networks
- Exploiting internal database HTTP interfaces

**Capital One Breach:** SSRF exploit exposed AWS credentials, affecting 140,000 SSNs and 80,000 bank account numbers.

**Mitigations:**
- Validate and sanitize all user-supplied connection parameters
- Implement URL allowlisting
- Block private IP ranges and cloud metadata endpoints
- Restrict outbound protocols (allow only postgres://, mysql://, etc.)
- Network segmentation and egress filtering

### 6.2 Connection String Injection

[Connection string parameter pollution](https://www.geeksforgeeks.org/ethical-hacking/how-a-connection-string-injection-attack-is-performed/) exploits improper parsing:

**Attack:** Injecting parameters like `Password=attacker_password;` into user-controlled inputs

**Example:**
```
User input: localhost;Password=hacked
Result: Server=localhost;Password=hacked;Password=original;
(Some drivers use last occurrence, bypassing authentication)
```

**Mitigations:**
- Use connection string builder classes (ADO.NET `SqlConnectionStringBuilder`)
- Never concatenate user input into connection strings
- Set `Persist Security Info=false` to prevent credential exposure
- Validate all connection parameters against strict allowlists

### 6.3 XSS Through Database Data

[Stored XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) via malicious data displayed from databases:

**Attack Flow:**
1. Attacker stores `<script>...</script>` in database field
2. Application retrieves and displays data without sanitization
3. Script executes in victim's browser

**Mitigations:**
- Never trust database data; treat as tainted
- Apply context-sensitive output encoding:
  - HTML: `&lt;script&gt;`
  - JavaScript: `\x3cscript\x3e`
  - URL: `%3Cscript%3E`
- Implement Content Security Policy (CSP)
- Use sanitization libraries (DOMPurify for client-side)

### 6.4 Denial of Service Through Expensive Queries

**Attack Scenarios:**
- Cartesian joins (missing WHERE clauses)
- Unbounded result sets
- Complex regex patterns
- Recursive CTEs

**Mitigations:**
- [Query timeout enforcement](https://medium.com/@shahharsh172/database-connection-pool-optimization-from-500-errors-to-99-9-uptime-9deb985f5164)
- Connection pool limits per tenant
- Query complexity analysis before execution
- Resource governors at database level
- Rate limiting at API layer

### 6.5 Credential Exfiltration Risks

**Attack Vectors:**
- Memory dumps exposing decrypted credentials
- Log files containing connection strings
- Error messages revealing credentials
- Backup files with unencrypted data

**Mitigations:**
- Zero-knowledge architecture (never decrypt on server)
- Session-only credential storage
- Scrub credentials from logs and error messages
- Encrypt backups with separate keys
- Use hardware security modules (HSM) for key operations

---

## 7. Technical Challenges & Solutions

### 7.1 Handling Massive Result Sets

Based on [streaming vs pagination research](https://medium.com/@sachin.backend.dev/handling-millions-of-records-in-java-streaming-vs-pagination-explained-9345d161f220):

**Pagination Approaches:**

| Method | Pros | Cons |
|--------|------|------|
| **Offset-based** | Simple implementation | Performance degrades with large offsets |
| **Cursor-based** | Consistent performance | Complex implementation; requires ordered data |
| **Keyset pagination** | Most efficient for large datasets | Requires unique, indexed column |

**Streaming:**
- Use database cursors to fetch rows incrementally
- Significant performance improvement (9 seconds vs 137 seconds in exports)
- Reduced memory consumption

**Best Practices:**
- Default page size: 50-100 rows
- Maximum page size: 1000 rows
- Avoid `SELECT *`; select only needed columns
- Index columns used for ordering/filtering
- Consider server-side result caching

### 7.2 Diverse Authentication Methods

| Method | Databases | Implementation |
|--------|-----------|----------------|
| **Username/Password** | All | Store encrypted; use secrets manager |
| **IAM Authentication** | AWS RDS, Azure SQL, GCP Cloud SQL | Short-lived tokens; AWS SDK integration |
| **Kerberos** | SQL Server, PostgreSQL | Ticket-based; requires AD infrastructure |
| **Certificate** | PostgreSQL, MySQL | Client certificate validation |
| **LDAP** | PostgreSQL, MySQL | Directory service integration |
| **OAuth** | BigQuery, Snowflake | Token-based; refresh handling |

### 7.3 Network Latency and Timeout Handling

**Connection Timeout Settings:**
```javascript
const pool = new Pool({
  connectionTimeoutMillis: 5000,   // Wait for connection
  idleTimeoutMillis: 30000,        // Close idle connections
  query_timeout: 60000,            // Per-query timeout
  statement_timeout: 60000,        // Database-side timeout
});
```

**Connection Pool Best Practices:**
- Pool size = (number of cores × 2) + effective spindle count
- Implement circuit breaker pattern for failing connections
- Monitor wait times; alert when consistently above zero
- Ensure `max-lifetime` < database `wait_timeout`

### 7.4 Database Version Compatibility

**Challenge:** Different SQL dialects, features, and limitations across versions.

**Solution:**
- Detect database version on connection
- Maintain feature compatibility matrix
- Abstract queries through database-agnostic layer
- Graceful degradation for unsupported features

### 7.5 Character Encoding Issues

[Encoding vulnerabilities](https://owasp.org/www-project-web-security-testing-guide/latest/6-Appendix/D-Encoded_Injection) can bypass security filters:

**Risks:**
- UTF-7 encoding can bypass XSS filters
- Multi-byte character attacks (Big5, GBK)
- Mojibake leading to data corruption
- MySQL `utf8` vs `utf8mb4` (4-byte character handling)

**Best Practices:**
- Use UTF-8 exclusively throughout the stack
- MySQL: Use `utf8mb4` charset, not `utf8`
- Set explicit encoding in connection strings
- Validate encoding consistency across all layers

### 7.6 Binary Data (BLOB) Handling

[BLOB security considerations](https://cloud.google.com/discover/what-is-binary-large-object-storage):

**Security Risks:**
- HTML smuggling via Blob URLs
- Malware in uploaded files
- XSS through SVG files

**Best Practices:**
- Validate file types (magic bytes, not just extensions)
- Implement Content Security Policy
- Scan uploaded files for malware
- Use separate storage for BLOBs (S3, Azure Blob)
- Apply encryption at rest
- Generate signed URLs with expiration for downloads

---

## 8. Security Checklist

### Pre-Launch Checklist

- [ ] **Credential Storage**
  - [ ] AES-256 encryption for stored credentials
  - [ ] KMS integration for key management
  - [ ] 90-day key rotation policy
  - [ ] Zero-knowledge option available

- [ ] **Authentication**
  - [ ] MFA for administrative access
  - [ ] IAM/OAuth support for cloud databases
  - [ ] Session timeout enforcement
  - [ ] Brute force protection

- [ ] **Query Safety**
  - [ ] Parameterized queries only
  - [ ] Read-only mode enforcement
  - [ ] Query timeout limits
  - [ ] Dangerous operation blocklist

- [ ] **Network Security**
  - [ ] TLS 1.3 for all connections
  - [ ] Certificate verification enabled
  - [ ] SSH tunneling support
  - [ ] IP whitelisting capability

- [ ] **Multi-Tenancy**
  - [ ] Tenant isolation validated
  - [ ] Cross-tenant access prevention
  - [ ] Per-tenant resource limits
  - [ ] Complete audit logging

- [ ] **Compliance**
  - [ ] GDPR data handling procedures
  - [ ] SOC 2 controls documented
  - [ ] Audit log retention (7+ years)
  - [ ] Data residency options

- [ ] **Attack Prevention**
  - [ ] SSRF protection (IP blocklist, protocol whitelist)
  - [ ] Connection string injection prevention
  - [ ] XSS output encoding
  - [ ] DoS query limits

---

## 9. References

### Security Standards & Guidelines
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

### Database Security
- [IBM Database Security Guide](https://www.ibm.com/think/topics/database-security)
- [AWS RDS IAM Authentication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)
- [Azure SQL Firewall Configuration](https://learn.microsoft.com/en-us/azure/azure-sql/database/firewall-configure)
- [Oracle SQL Firewall](https://docs.oracle.com/en/database/oracle/oracle-database/23/arpls/dbms_sql_firewall.html)

### Secrets Management
- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [HashiCorp Vault Key Rotation](https://developer.hashicorp.com/vault/docs/internals/rotation)
- [Zero-Knowledge Encryption (Bitwarden)](https://bitwarden.com/resources/zero-knowledge-encryption/)

### Multi-Tenancy
- [AWS SaaS Architecture Fundamentals](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/tenant-isolation.html)
- [Azure Multi-Tenant Patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns)
- [Redis Data Isolation Guide](https://redis.io/blog/data-isolation-multi-tenant-saas/)

### Compliance
- [SOC 2 for Database Security](https://www.liquibase.com/resources/guides/soc-2-compliance-for-database-security-trust-services-criteria-best-practices)
- [GDPR Data Residency](https://gdprlocal.com/gdpr-data-residency-requirements/)
- [SOC 2 Audit Logging Guide](https://hoop.dev/blog/the-essential-guide-to-audit-logging-for-soc-2-compliance/)

### Token & Session Security
- [Auth0 Token Best Practices](https://auth0.com/docs/secure/tokens/token-best-practices)
- [Curity - Access Token Storage](https://curity.medium.com/best-practices-for-storing-access-tokens-in-the-browser-6b3d515d9814)

### Database Tools Security
- [DBeaver SSH Configuration](https://dbeaver.com/docs/dbeaver/SSH-Configuration/)
- [DbVisualizer Security](https://www.dbvis.com/docs/12.0/database-connection-options/security/)
- [TablePlus SSH Tunnel](https://tableplus.com/blog/2019/08/ssh-tunnel-secure-database-connection.html)

---

*Report generated: March 2026*
*Research conducted using industry publications, security advisories, and compliance frameworks*
