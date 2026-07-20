# Example: Acceptance Tests — Login System Requirements

A self-contained example of generating Given/When/Then acceptance tests from a
plain-text requirements list, with coverage stats.

## Input

Paste into the **Text** source panel:

```
Login system requirements for a B2B SaaS dashboard.

Functional:
- User can log in with email + password
- User can log in with Google OAuth
- After 5 failed password attempts, account is locked for 15 minutes
- Password reset via email link, link expires in 30 minutes
- Session expires after 8 hours of inactivity
- MFA via TOTP (Google Authenticator / 1Password) optional, can be enforced per-org

Non-functional:
- Login API must respond in < 800ms P95
- All login attempts (success + failure) logged with IP + user-agent
- Passwords must never appear in logs, error messages, or analytics events
```

## Configuration

| Field            | Value                                                |
| ---------------- | ---------------------------------------------------- |
| Source           | Text                                                 |
| Doc type         | `FRD` (functional requirements are the explicit ask) |
| Provider mode    | `free`                                               |
| Council depth    | 2-round debate                                       |
| Output format    | Markdown                                             |

## Expected Output

The pipeline produces an **FRD** plus an **Acceptance Tests** artifact
accessible via the **Tests** tab and `GET /api/acceptance-tests`. Each test is a
structured Given/When/Then:

```gherkin
Scenario: Successful email + password login
  Given a registered user with email "alice@acme.com" and a valid password
  When they POST /api/login with those credentials
  Then the response status is 200
  And the response body contains access_token and refresh_token
  And the audit log records a "login.success" event with IP and user-agent
```

```gherkin
Scenario: Account lockout after 5 failed attempts
  Given a registered user with email "bob@acme.com"
  When they POST /api/login with an incorrect password 5 times in succession
  Then the 5th response status is 423 (Locked)
  And subsequent attempts within 15 minutes return 423 without checking the password
  And the audit log records a "login.locked" event
```

```gherkin
Scenario: Password reset link expiry (31 min old token)
  Given a user requested a password reset 31 minutes ago
  When they POST /api/password/reset with the expired token and a new password
  Then the response status is 410 (Gone)
  And the user must request a new reset link
```

Test inventory: 6 happy-path · 9 error-path · 5 security · 2 performance · 4 audit
= **26 tests covering 9 requirements = 100%**, with 0 requirements lacking a
happy + error scenario. The non-functional "passwords never in logs" rule also
produces a negative test:

```gherkin
Scenario: Password never leaks into audit log
  Given a failed login attempt with password "hunter2"
  When the audit log entry is inspected
  Then it must not contain "hunter2" or any field named "password"
```

## Explanation

- **FRD** is forced — the source is explicitly a functional-spec list; the FRD
  template (Functional, Non-functional, Acceptance criteria, Test cases) maps
  1:1 to the brief.
- **free mode** suffices — the source is short (<1 KB) so the Understand stage
  runs on Groq's 32K free-tier window. Runtime: ~40s, $0.
- The **Acceptance Tests** stage (one of the 29 pipeline stages) runs after
  Generate; it uses the `qaLead` role's output to derive tests directly from the
  requirements table, ensuring every requirement ID has a happy + error scenario.
- Coverage stats are mechanical: the completeness validator counts unique
  requirement IDs in the FRD vs. those referenced in test scenarios. Below 100%
  surfaces as a red badge in the Tests tab.
- Tests export as Gherkin `.feature` files or a single Markdown bundle.
