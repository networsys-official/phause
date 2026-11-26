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
    { title: "A clearer programme workflow", desc: "Bring employee preparation, templates, campaigns, tracking, reports and training administration into one connected process." },
    { title: "More controlled campaign planning", desc: "Choose eligible recipients, target a department segment or use a sample percentage, and review the settings before delivery." },
    { title: "More useful reporting conversations", desc: "Use campaign metrics and risk indicators to identify patterns and explain the next awareness step to stakeholders." },
    { title: "Follow-through that supports learning", desc: "Keep training modules, enrolments and completion records connected to your wider awareness activity." },
  ];
}

export function getDefaultHomeServices() {
  return [
    { title: "Employee Management", desc: "Organise employee records and review eligibility and consent before simulation activity." },
    { title: "Phishing Templates", desc: "Use saved templates or create and preview a message for a learning objective." },
    { title: "Campaign Management", desc: "Configure the audience, delivery method and schedule in a structured workflow." },
    { title: "Reporting and Risk Insights", desc: "Review recorded campaign activity and use findings to plan follow-up awareness." },
  ];
}

export function getDefaultHomeOffers() {
  return [];
}

export function getDefaultHomeSteps() {
  return [
    { title: "Prepare", desc: "Set up employee records and confirm which employees are authorised and eligible." },
    { title: "Choose", desc: "Select a saved template or create a message that matches the learning objective." },
    { title: "Configure", desc: "Choose the target audience and delivery approach, then review the campaign settings." },
    { title: "Learn", desc: "Review campaign activity and use reports and training records to plan the next step." },
  ];
}
