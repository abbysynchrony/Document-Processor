# Document Processor Vulnerability Testing Tool Documentation

## 📚 Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Vulnerabilities Overview](#vulnerabilities-overview)
4. [Detailed Vulnerability Analysis](#detailed-vulnerability-analysis)
5. [Practical Exploitation Guide](#practical-exploitation-guide)
6. [Security Testing Setup](#security-testing-setup)
7. [Best Practices & Mitigations](#best-practices--mitigations)
8. [Troubleshooting](#troubleshooting)
9. [References & Resources](#references--resources)

## Introduction

### 🎯 Purpose
The Document Processor is an intentionally vulnerable web application designed for educational purposes in security testing and vulnerability assessment. This tool provides a safe environment to learn about and practice exploiting common web application vulnerabilities, particularly focusing on file processing and data transformation pipelines.

### 🎓 Learning Objectives
- Understand common web application vulnerabilities
- Learn practical exploitation techniques
- Develop skills in vulnerability assessment
- Practice using security testing tools
- Learn defensive programming practices

### 🛠️ Technology Stack
- **Frontend:** React.js with Tailwind CSS
- **Backend:** Node.js with Express.js
- **Templating Engine:** Handlebars
- **PDF Generation:** pdfkit
- **Database:** MongoDB Atlas
- **File Parsing:** xml2js, libxmljs2, JSON.parse
- **Security Tools:** Burp Suite, Wireshark

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Burp Suite Professional/Community Edition
- Wireshark
- Git

### Installation Steps
1. Clone the repository:
```bash
git clone <repository-url>
cd document-processor
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Configure environment variables:
```env
PORT=5001
MONGODB_URI=<your_mongodb_uri>
NODE_ENV=development
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

5. Start the application:
```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm start
```

## Vulnerabilities Overview

### 1. XML External Entity (XXE) Injection
- **CWE:** 611
- **OWASP:** A04:2021
- **Risk Level:** Critical
- **Description:** Allows attackers to read arbitrary files on the server through XML entity resolution
- **Impact:** Information disclosure, server-side request forgery

### 2. XML Denial of Service (XXE Bomb)
- **CWE:** 400
- **OWASP:** A05:2021
- **Risk Level:** High
- **Description:** Causes server resource exhaustion through recursive entity expansion
- **Impact:** Service disruption, system crash

### 3. Directory Traversal
- **CWE:** 22
- **OWASP:** A05:2021
- **Risk Level:** High
- **Description:** Allows unauthorized access to files outside intended directory
- **Impact:** Information disclosure, unauthorized file access

### 4. Server-Side Template Injection (SSTI)
- **CWE:** 94
- **OWASP:** A03:2021
- **Risk Level:** Critical
- **Description:** Allows injection of malicious template code
- **Impact:** Remote code execution, information disclosure

### 5. Template Injection via Context
- **CWE:** 95
- **OWASP:** A03:2021
- **Risk Level:** High
- **Description:** Manipulation of template context to execute arbitrary code
- **Impact:** Remote code execution, data manipulation

### 6. Prototype Pollution
- **CWE:** 1321
- **OWASP:** A08:2021
- **Risk Level:** High
- **Description:** Manipulation of JavaScript object prototypes
- **Impact:** Application logic bypass, data manipulation

### 7. Insufficient Logging & Monitoring
- **CWE:** 778
- **OWASP:** A09:2021
- **Risk Level:** Medium
- **Description:** Lack of proper security event logging
- **Impact:** Delayed attack detection, forensic challenges

## Detailed Vulnerability Analysis

### XML External Entity (XXE) Injection

#### How It Works
1. The application uses xml2js for XML parsing
2. External entity resolution is enabled by default
3. User-supplied XML is processed without proper sanitization

#### Example Payload
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE data [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<data>
  <content>&xxe;</content>
</data>
```

#### Why It's Dangerous
- Can read sensitive files on the server
- May lead to server-side request forgery
- Can expose internal network information

### XML Denial of Service (XXE Bomb)

#### How It Works
1. Exploits recursive entity expansion
2. Creates exponential memory consumption
3. Bypasses input size limits

#### Example Payload
```xml
<!DOCTYPE lolz [
  <!ENTITY a "ha">
  <!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">
  <!ENTITY c "&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;">
  <!ENTITY d "&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;">
  <!ENTITY e "&d;&d;&d;&d;&d;&d;&d;&d;&d;&d;">
]>
<root><content>&e;</content></root>
```

#### Why It's Dangerous
- Causes server resource exhaustion
- Can lead to system crashes
- Difficult to detect and prevent

## Practical Exploitation Guide

### Setting Up Burp Suite
1. Install Burp Suite
2. Configure browser proxy settings
3. Install Burp's CA certificate
4. Enable intercept mode

### Using Wireshark
1. Install Wireshark
2. Select appropriate network interface
3. Apply filters for HTTP/HTTPS traffic
4. Capture and analyze packets

### Exploitation Workflow
1. Identify target vulnerability
2. Prepare appropriate payload
3. Intercept request using Burp Suite
4. Modify and send payload
5. Analyze response
6. Document findings

## Security Testing Setup

### Required Tools
- Burp Suite Professional/Community
- Wireshark
- Postman (optional)
- Custom scripts (provided in repository)

### Environment Configuration
1. Set up development environment
2. Configure security tools
3. Prepare test data
4. Set up monitoring

## Best Practices & Mitigations

### XXE Prevention
- Disable external entity resolution
- Use secure XML parsers
- Implement input validation
- Apply proper content-type restrictions

### DoS Protection
- Implement request size limits
- Use secure XML parsers
- Monitor system resources
- Implement rate limiting

### Directory Traversal Prevention
- Validate file paths
- Use proper access controls
- Implement path sanitization
- Use secure file handling

### SSTI Mitigation
- Use secure templating engines
- Implement proper input validation
- Apply context escaping
- Use sandboxed environments

## Troubleshooting

### Common Issues
1. Connection problems
2. Tool configuration issues
3. Payload execution failures
4. Environment setup problems

### Solutions
1. Check network connectivity
2. Verify tool configurations
3. Validate payload format
4. Review environment setup

## References & Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Database](https://cwe.mitre.org/)
- [Handlebars Security](https://handlebarsjs.com/guide/#security)

### Tools
- [Burp Suite Documentation](https://portswigger.net/burp/documentation)
- [Wireshark Documentation](https://www.wireshark.org/docs/)
- [Node.js Security](https://nodejs.org/en/security/)

### Learning Resources
- OWASP Web Security Testing Guide
- PortSwigger Web Security Academy
- Node.js Security Best Practices

## Contributing
We welcome contributions to improve this tool. Please follow our contribution guidelines and submit pull requests for review.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 