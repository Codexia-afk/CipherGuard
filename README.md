# Password Strength Analyzer

A lightweight, browser-based security utility for checking password strength and generating stronger credentials. The analyzer runs entirely on the user's device, so entered passwords are not stored, logged, or sent to a server.

## Features

- Real-time password strength score from 0 to 100
- Checks for length, uppercase and lowercase letters, numbers, symbols, and spaces
- Estimated brute-force cracking time
- Personalized suggestions for improving weak passwords
- Cryptographically secure password generation using the Web Crypto API
- Password visibility, copy, and clear controls
- Responsive, accessible interface with no framework dependencies

## Run Locally

No installation or build step is required.

1. Clone or download this repository.
2. Open `index.html` in a modern web browser.

For a local development server, run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Web Crypto API

## Future Implementations

- Detect common passwords using a local breached-password dictionary
- Add pattern detection for names, dates, keyboard sequences, and repeated phrases
- Use a more advanced entropy model for strength and crack-time estimates
- Provide customizable password generation options such as length and character sets
- Add passphrase generation with memorable word combinations
- Support offline installation as a Progressive Web App (PWA)
- Add automated tests and cross-browser validation
- Improve accessibility with enhanced keyboard and screen-reader support
- Add optional localization for multiple languages

## Privacy

All analysis is performed locally in the browser. The application does not require an account or backend and does not transmit password data.

## Disclaimer

The score and crack-time estimate are educational approximations. Always use a unique password for every account, enable multi-factor authentication where available, and store credentials in a trusted password manager.
