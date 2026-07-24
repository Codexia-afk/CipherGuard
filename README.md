
# CipherGuard — Password Security Lab

CipherGuard is a privacy-first password auditing and generation tool built to demonstrate how human password choices translate into real security risk. It combines entropy estimation, attack-speed simulation, policy compliance, predictable-pattern detection, and cryptographically secure password generation in a modern cybersecurity dashboard.

The entire analysis runs inside the browser. Passwords are never uploaded, logged, stored, or sent to an API.

## The Problem

Most password meters only show a colored bar. They rarely explain:

- Why a password is weak
- How common patterns reduce effective strength
- How attack speed changes the outcome
- Which security policy the password satisfies
- What the user should do next

CipherGuard turns a basic strength checker into an educational security lab that makes these factors visible and actionable.

## Key Features

### Password Security Audit

- Live composite score from 0–100
- Estimated entropy in bits
- Character-set size calculation
- Brute-force time estimation
- Five-level risk classification
- Clear remediation advice

### Local Threat Intelligence

- Common-password watchlist detection
- Repeated-character detection
- Keyboard and sequential-pattern detection
- Year and date-like token detection
- Common `word + number + symbol` structure detection
- Character-diversity analysis

### Attack Simulation

Compare password resistance under three models:

- Online throttled login: 100 guesses/second
- Offline fast hash attack: 10 billion guesses/second
- GPU cluster attack: 1 trillion guesses/second

### Policy Profiles

- Modern standard: 12+ characters
- Enterprise strict: 16+ characters
- NIST-inspired: 8+ characters with screening against weak patterns

### Secure Password Generator

- Configurable length from 8–64 characters
- Optional uppercase, lowercase, number, and symbol sets
- Option to remove visually ambiguous characters
- Mandatory inclusion from every selected character group
- Web Crypto API randomness
- Rejection sampling to avoid modulo bias
- One-click copy and immediate strength telemetry

## Privacy and Security Design

CipherGuard has no backend and makes no network request for password analysis. The password only exists in the current browser tab. The generator uses `crypto.getRandomValues()` rather than `Math.random()`.

> Use sample passwords when demonstrating the project. A password meter is an educational estimate and should never be treated as proof that a real credential is safe.

## Technology Stack

- HTML5
- Modern CSS
- Vanilla JavaScript
- Web Crypto API

No framework, package installation, database, or build step is required.

## Run Locally

Open `index.html` directly in a modern browser, or start a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How the Score Works

1. CipherGuard estimates the theoretical search space from password length and detected character sets.
2. It converts that search space into approximate entropy bits.
3. It applies penalties for human patterns such as common passwords, sequences, repetitions, and years.
4. It combines adjusted entropy with eight policy checks to create a 0–100 score.
5. It estimates brute-force time using the attack rate selected by the user.

This model is intentionally transparent and educational. Real cracking time also depends on hash type, salting, hardware, rate limiting, breach context, attacker dictionaries, and MFA.

## Project Structure

```text
Password Analyzer/
├── index.html    # Application structure and accessible UI
├── style.css     # Black-and-green cybersecurity interface
├── script.js     # Analysis engine, generator, and interactions
└── README.md     # Project documentation
```

## Future Implementations

- Integrate the Have I Been Pwned k-anonymity API without exposing full passwords
- Add a larger downloadable offline breached-password dataset
- Use a mature estimator such as zxcvbn for deeper dictionary and spatial matching
- Add Argon2, bcrypt, scrypt, and PBKDF2 attack-model comparisons
- Explain hash, salt, pepper, rate limiting, and MFA through interactive demos
- Add passphrase generation using cryptographically selected word lists
- Export a redacted audit report for security-awareness training
- Add multilingual support and enhanced screen-reader announcements
- Package the tool as an installable offline Progressive Web App
- Add unit, accessibility, and cross-browser automated tests

## Responsible Use

CipherGuard is designed for security education, awareness demonstrations, hackathons, and defensive research. It does not attempt to recover passwords, access accounts, or perform attacks against external systems.

## License

Add the license of your choice before public distribution.
