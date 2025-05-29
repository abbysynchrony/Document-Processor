# DocumentProcessor Project - 3 Week Task Plan

**Start Date:** Tuesday, May 20, 2025  
**Work Days:** Wednesday–Friday (Week 1), Monday–Friday (Weeks 2–3)  
**Total Weeks:** 3  
**Total Work Days:** 13

---

## Week 1: Project Setup & Basic Functionality (May 20–23)

### Goals:
- Scaffold the frontend and backend
- Set up basic project structure and user upload flow
- Deploy initial backend + database connection

### Daily Tasks:

**Tuesday, May 20 – Project Initialization**
- [X] Initialize GitHub repo with `/frontend` and `/backend` directories
- [X] Set up Create-React-App with Tailwind CSS in `/frontend`
- [X] Set up Node.js + Express server in `/backend`
- [X] Install dependencies: `express`, `xml2js`, `pdfkit`, `handlebars`, `mongodb`, etc.

**Wednesday, May 21 – Upload Handling and DB Setup**
- [X] Set up MongoDB Atlas and connect backend
- [X] Create `/upload` endpoint to accept XML and JSON
- [X] Store uploaded files in `/uploads`
- [X] Log metadata to MongoDB

**Thursday, May 22 – Template and PDF Rendering**
- [X] Create basic Handlebars template
- [X] Generate PDF using `pdfkit` from parsed data
- [X] Return generated PDF as response

---

## Week 2: Vulnerability Integration & Testing (May 26–30)

### Goals:
- Introduce intentional vulnerabilities
- Begin offensive testing
- Start rotating team roles

### Daily Tasks:

**Monday, May 26 – Introduce XML & JSON Vulnerabilities**
- [X] Inject XXE vulnerability using `xml2js` (unrestricted parsing)
- [X] Allow large/recursive XML (for DoS simulation)
- [X] Add JSON deserialization vulnerability (`JSON.parse` with unsafe inputs)

**Tuesday, May 27 – JSON Testing and Documentation**
- [X] Create malformed JSON payloads for deserialization attacks
- [X] Peer-review the insecure code
- [X] Begin documenting vulnerabilities in GitHub Issues
**Wednesday, May 28 – Templating and Path Vulnerabilities**
- [X] Start integrating SSTI via Handlebars templates
- [X] Create export path vulnerability (`../../etc/passwd` case)
- [X] Test Handlebars with dangerous expressions like `{{#with "constructor"}}`

**Thursday, May 29 – Offensive Testing with Security Tools**
- [ ] Start offensive testing using:
  - Burp Suite
  - OWASP ZAP
  - Wireshark
- [ ] Record test results and exploit payloads

**Friday, May 30 – Logging Vulnerability Observations**
- [ ] Create a test plan for each vulnerability
- [ ] Start incident log for all observed attacks
- [ ] Rotate team roles: Parser → Template → Forensics

---

## Week 3: Remediation, Deployment, & Final Report (June 2–6)

### Goals:
- Harden system
- Finalize deployment
- Write and submit the incident response report

### Daily Tasks:


**Wednesday, June 4 – Logging and Frontend Deployment**
- [ ] Deploy frontend on GitHub Pages

**Thursday, June 5 – Final Backend Deployment and Testing**
- [ ] Deploy backend and MongoDB via Railway.app
- [ ] Perform full system test (upload → parse → generate PDF)

**Friday, June 6 – Final Report and Live Demo**
- [ ] Finalize and submit the incident response report
- [ ] Clean up GitHub Issues with links to remediated PRs
- [ ] Present live demo (GitHub Pages URL + Railway backend)

---

## Tools & Resources

- Node.js, Express.js, MongoDB Atlas, Railway.app
- Tailwind CSS, React, Handlebars, pdfkit
- OWASP ZAP, Burp Suite, Wireshark
- CWE & OWASP Top 10 references
