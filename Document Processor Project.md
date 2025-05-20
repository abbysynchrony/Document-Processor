# Project Proposal: DocumentProcessor

## 1. Title & Objective

**Title:** DocumentProcessor

**Objective:**  
Intern teams will build and deploy a web service that accepts user-uploaded XML or JSON “documents,” transforms them via customizable templates, and returns a generated PDF. The project intentionally incorporates multiple processing-layer vulnerabilities for hands-on exploitation and remediation, spanning XML, JSON, templating, and service-level security risks.

## 2. Technical Requirements & Specifications

**Frontend:**
- React (Create-React-App)
- Tailwind CSS for styling
- JavaScript (ES6)

**Backend:**
- Node.js with Express.js
- XML Parsing: `xml2js` library
- JSON Handling: native `JSON.parse()` and `safe-parse` middleware
- Templating & PDF Generation: Handlebars for templates + `pdfkit` to render PDFs
- File Storage: Server filesystem (under `/uploads`)

**Database:**
- MongoDB (free-tier Atlas) to store metadata (upload records, user info)

**Authentication:**
- JSON Web Tokens (JWT) with `express-jwt`
- User registration/login with bcrypt-hashed passwords

**Deployment:**
- Frontend: GitHub Pages
- Backend & Database: Railway.app (Node.js service + MongoDB addon)

**Version Control & CI/CD:**
- GitHub repo with `/frontend` and `/backend` folders
- GitHub Actions for linting, tests, and auto-deploy on merge to `main`

## 3. Intentional Vulnerabilities

| # | Vulnerability                                | OWASP A-Risk                            | CWE ID | Other Category |
|---|----------------------------------------------|-----------------------------------------|--------|----------------|
| 1 | XML External Entity (XXE)                    | A04: Insecure Design                    | CWE-611 | —              |
| 2 | Insecure Deserialization of JSON             | A08: Software & Data Integrity Failures | CWE-502 | —              |
| 3 | Directory Traversal in export path           | A05: Security Misconfiguration          | CWE-22  | —              |
| 4 | Denial of Service via large/recursive XML    | A05: Security Misconfiguration          | CWE-400 | DoS            |
| 5 | Server-Side Template Injection (SSTI)        | A03: Injection                          | CWE-94  | —              |
| 6 | Template-injection via unsanitized inputs    | A03: Injection                          | CWE-95  | —              |
| 7 | Insufficient Logging & Monitoring            | A09: Security Logging & Monitoring Failures | CWE-778 | —         |

## 4. Learning Outcomes & Badge Alignment

- **Cryptography & Secure Coding (Level 1):**  
  Safely parse untrusted XML/JSON, disable dangerous parser features (XXE), implement input validation.

- **Software Integrity & Injection (Level 2):**  
  Demonstrate SSTI and injection via templates; apply strict sanitization and sandboxing.

- **Security Misconfiguration (Level 1):**  
  Recognize directory traversal and disable access outside `/uploads`; enforce safe filesystem APIs.

- **Denial of Service (Level 2):**  
  Craft and defend against large or recursive payload attacks; configure parser limits.

- **Logging & Monitoring (Level 2):**  
  Integrate structured logging of transformations; set up alerts for parsing failures or repeated errors.

- **Incident Response & Forensics (Level 2):**  
  Capture exploit traffic with Wireshark/Burp, analyze attacker payloads, and draft a remediation report outlining root cause and fixes.

## 5. Implementation Timeline

| Week | Activities |
|------|------------|
| 1 | • Scaffold frontend and backend repos  <br> • Set up MongoDB Atlas and Express server <br> • Build file-upload endpoint and basic PDF template route |
| 2 | • Introduce XXE & DoS via unconstrained xml2js parsing <br> • Implement insecure JSON deserialization <br> • Peer review insecure code patterns |
| 3 | • Add SSTI in Handlebars templates <br> • Create directory-traversal exploit via export path <br> • Conduct attack labs: XXE, SSTI, traversal, DoS |
| 4 | • Remediate: disable external entities, enforce parser limits, sanitize template inputs, restrict filesystem paths <br> • Deploy frontend & backend <br> • Final incident report & live demo |

## 6. Required Resources & Tools

- **Dev Tools:** Node.js, npm, Create-React-App, Tailwind CLI, Handlebars, pdfkit, xml2js  
- **Database & Hosting:** MongoDB Atlas (free tier), Railway.app  
- **Security Tools:** Burp Suite Community, OWASP ZAP, Wireshark, custom scripts for generating large XML payloads  
- **References:** OWASP Top 10 guide, CWE documentation on XXE/CWE-611 & SSTI/CWE-94, Handlebars security best practices

## 7. Testing & Validation Methods

**Offensive Testing:**
- Send crafted XML with external entities; confirm local file disclosure.
- Post deeply nested XML to trigger parser exhaustion (DoS).
- Submit JSON with prototype payloads to break service.
- Supply malicious Handlebars expressions (`{{#with “constructor”}}`) to execute server code.
- Request export of `../../etc/passwd` via directory-traversal paths.

**Defensive Testing:**
- Enable `xml2js` `noent: true` to prevent external entity resolution; verify XXE blocks.
- Enforce `maxDepth` and `maxChars` parser options; confirm DoS payloads fail.
- Use safe JSON parsing library; test prototype pollution payloads.
- Whitelist template variables and escape all user inputs; retest SSTI vectors.
- Restrict file paths to `/uploads` using `path.normalize()` and checks; test traversal attempts.
- Integrate `Winston` or similar logger; simulate transformation errors and verify alerts.

## 8. Ethical & Collaborative Guidelines

- **Containment:** All attacks run only against the team’s own deployed service.  
- **Disclosure:** Document each vulnerability and fix in GitHub Issues; submit pull requests for remediation.  
- **Team Roles:** Rotate roles weekly among “Parser Team” (XML/JSON), “Template Team” (SSTI), and “Forensics Team” (logging/monitoring).  
- **Deliverables:** Weekly commits with vulnerability notes, final live demo URLs (front-end GitHub Pages link; back-end Railway URL), and comprehensive incident response playbook.

