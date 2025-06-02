module.exports = {
  ssti: {
    name: "Server-Side Template Injection",
    cwe: "CWE-94",
    owasp: "A03: Injection",
    description: "Executes server-side JavaScript using Handlebars constructor tricks to access environment variables and internals."
  },
  template: {
    name: "Template Injection via Unsanitized Input",
    cwe: "CWE-95",
    owasp: "A03: Injection",
    description: "Renders user-controlled templates, allowing logic injection that can expose process internals and system secrets."
  },
  xxe: {
    name: "XML External Entity (XXE)",
    cwe: "CWE-611",
    owasp: "A04: Insecure Design",
    description: "Parses unsafe XML allowing entity injection to read server-side files like config files or `/etc/hosts`."
  },
  dos: {
    name: "Denial of Service via XML Bomb",
    cwe: "CWE-400",
    owasp: "A05: Security Misconfiguration",
    description: "Uses recursive XML entities to overload the server's CPU and memory, causing it to crash or hang."
  },
  traversal: {
    name: "Path Traversal",
    cwe: "CWE-22",
    owasp: "A05: Security Misconfiguration",
    description: "Bypasses directory restrictions using `../` to access sensitive internal files like `.env` or `config.xml`."
  },
  pollution: {
    name: "Prototype Pollution",
    cwe: "CWE-1321",
    owasp: "A08: Software and Data Integrity Failures",
    description: "Overrides built-in object behavior using `__proto__`, leading to logic tampering and mock admin access."
  },
  logging: {
    name: "Insufficient Logging & Monitoring",
    cwe: "CWE-778",
    owasp: "A09: Security Logging and Monitoring Failures",
    description: "Lack of structured logging or alerts allows attacks to go undetected by administrators."
  }
}; 