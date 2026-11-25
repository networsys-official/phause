export function createFallbackItemTitle(prefix: string, index: number) {
  return `${prefix} ${index + 1}`;
}

export function createServiceNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function extractCmsSectionItems(block: Record<string, unknown> | null | undefined, fallback: Array<Record<string, unknown>> = []) {
  if (!block || typeof block !== "object") return fallback;
  const arrayKeys = ["items", "cards", "entries", "list", "rows", "sections", "features", "highlights", "steps", "plans", "metrics", "stats", "faqs", "testimonials", "members", "details", "values", "options", "data", "blocks", "content"];
  const directArray = arrayKeys.map((key) => (Array.isArray((block as Record<string, unknown>)[key]) ? (block as Record<string, unknown>)[key] : null)).find((value): value is Array<Record<string, unknown>> => Array.isArray(value) && value.length > 0);
  if (directArray) return directArray;
  const nestedArray = Object.values(block).find((value): value is Array<Record<string, unknown>> => Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "object" && entry !== null));
  if (nestedArray) return nestedArray;
  const metadataKeys = ["title", "subtitle", "description", "text", "q", "a", "question", "answer", "label", "value", "heading", "caption", "summary", "body", "name", "role"];
  if (Object.keys(block).some((key) => metadataKeys.includes(key))) return [block];
  return fallback;
}

export function getDefaultHomeReasons() {
  return [
    { title: "Lightning-Fast Response", desc: "Sub-50ms automated threat neutralization — the fastest in the industry." },
    { title: "AI-Powered Engine", desc: "Machine learning models trained on 50B+ security events, updated hourly." },
    { title: "Human Security Expertise", desc: "Security teams and specialists help organisations interpret findings and plan follow-up action." },
    { title: "Zero-Downtime Deployment", desc: "Deploy protection without touching a single line of your existing code." },
  ];
}

export function getDefaultHomeServices() {
  return [
    { title: "Threat Detection", desc: "Real-time AI scanning across all endpoints, networks and cloud assets." },
    { title: "Security Audits", desc: "Deep-dive penetration testing and compliance audits by certified experts." },
    { title: "Cloud Protection", desc: "Zero-trust security architecture for AWS, Azure, GCP and hybrid clouds." },
    { title: "Infrastructure Defense", desc: "Harden your servers, APIs and databases against zero-day exploits." },
    { title: "Data Encryption", desc: "End-to-end AES-256 encryption with automated key rotation." },
  ];
}

export function getDefaultHomeOffers() {
  return [
    { title: "Free Security Assessment", desc: "A 360° audit of your infrastructure — completely free, no strings attached." },
    { title: "Dedicated Security Team", desc: "Your own squad of specialists assigned exclusively to your account." },
    { title: "Incident Response SLA", desc: "Guaranteed response to critical incidents in under 15 minutes." },
    { title: "Employee Training", desc: "Phishing simulations and security workshops for your entire team." },
    { title: "Insurance Backed", desc: "$10M cyber insurance coverage included with every enterprise plan." },
  ];
}

export function getDefaultHomeSteps() {
  return [
    { title: "Discover", desc: "We map every asset, vulnerability and attack surface in your environment." },
    { title: "Strategize", desc: "A custom defense blueprint built for your architecture and risk profile." },
    { title: "Deploy", desc: "Protection rolls out in hours — no downtime, no disruption to your team." },
    { title: "Evolve", desc: "Continuous learning and adaptation keeps you ahead of emerging threats." },
  ];
}
