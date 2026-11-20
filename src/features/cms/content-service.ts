import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/shared/lib/logger";

const DEFAULT_ADMIN_EMAIL = "phause@gmail.com";
const BOOTSTRAP_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD;

export async function bootstrapAdminUser() {
  const hasSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!BOOTSTRAP_ADMIN_PASSWORD) {
    if (!hasSuperAdmin) {
      logger.warn("No super administrator account exists.");
    }
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });

  if (!existing) {
    const { default: bcrypt } = await import("bcrypt");
    const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12);

    await prisma.user.create({
      data: {
        name: "Phause Admin",
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
  } else if (existing.role !== "SUPER_ADMIN" || existing.status !== "ACTIVE") {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
  }

  logger.info("✅ Default admin ensured");

  const freshSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!freshSuperAdmin) {
    logger.warn("No super administrator account exists.");
  }
}

const defaultNavigation = {
  key: "main",
  label: "Main navigation",
  items: [
    { label: "Home", href: "/", position: 0 },
    { label: "About Us", href: "/about", position: 1 },
    { label: "Services", href: "/services", position: 2 },
    { label: "Blog", href: "/blog", position: 3 },
    { label: "Docs", href: "/docs", position: 4 },
    { label: "Subscription", href: "/subscription", position: 5 },
    { label: "Contact Us", href: "/contact", position: 6 },
  ],
};

const defaultFooter = {
  title: "Phause",
  description:
    "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
  copyright: "Strengthen. Aware. Defend.",
  links: [
    { label: "Home", href: "/", position: 0 },
    { label: "About Us", href: "/about", position: 1 },
    { label: "Services", href: "/services", position: 2 },
    { label: "Blog", href: "/blog", position: 3 },
    { label: "Docs", href: "/docs", position: 4 },
    { label: "FAQ", href: "/faq", position: 5 },
    { label: "Subscription", href: "/subscription", position: 6 },
    { label: "Registration", href: "/registration", position: 7 },
    { label: "Contact Us", href: "/contact", position: 8 },
    { label: "Threat Detection", href: "/#services", position: 9 },
    { label: "Security Audits", href: "/#services", position: 10 },
    { label: "Cloud Protection", href: "/#services", position: 11 },
    { label: "Data Encryption", href: "/#services", position: 12 },
  ],
  socials: [],
};

const defaultBrandMedia = {
  slug: "brand-logo",
  title: "Brand logo",
  filename: "phause-logo.png",
  mimeType: "image/png",
  url: "/logo/phause-logo.png",
  altText: "Phause brand logo",
  caption: "Phause brand logo",
  width: 1200,
  height: 400,
  size: 21432,
  tags: ["brand", "logo"],
  checksum: "brand-logo-phause",
};

const defaultSettings = [
  { slug: "siteName", key: "siteName", value: "Phause", status: "PUBLISHED" },
  { slug: "timezone", key: "timezone", value: "UTC", status: "PUBLISHED" },
  { slug: "publishingMode", key: "publishingMode", value: "Draft + publish", status: "PUBLISHED" },
  { slug: "cmsApiEnabled", key: "cmsApiEnabled", value: "true", status: "PUBLISHED" },
  { slug: "mediaPipelineEnabled", key: "mediaPipelineEnabled", value: "true", status: "PUBLISHED" },
  { slug: "seoSyncEnabled", key: "seoSyncEnabled", value: "true", status: "PUBLISHED" },
  { slug: "supportEmail", key: "supportEmail", value: "hello@phause.com", status: "PUBLISHED" },
  { slug: "supportPhone", key: "supportPhone", value: "+1 (555) 010-PHAUSE", status: "PUBLISHED" },
  { slug: "logoUrl", key: "logoUrl", value: "/logo/phause-logo.png", status: "PUBLISHED" },
] as const;

const defaultForms = [
  {
    slug: "contact-form",
    name: "Contact form",
    status: "PUBLISHED",
    fields: [
      { key: "name", label: "Full Name", type: "text", placeholder: "Jane Cooper", required: true },
      { key: "email", label: "Work Email", type: "email", placeholder: "jane@company.com", required: true },
      { key: "phone", label: "Phone Number", type: "tel", placeholder: "+1 (555) 000-0000" },
      { key: "company", label: "Company", type: "text", placeholder: "Acme Corp" },
      {
        key: "subject",
        label: "Subject",
        type: "select",
        placeholder: "General Enquiry",
        required: true,
        options: [
          "General Enquiry",
          "Platform Demo Request",
          "Pricing & Subscription",
          "Incident / Emergency Support",
          "Partnership Opportunity",
        ],
      },
      { key: "message", label: "Message", type: "textarea", placeholder: "Tell us about your infrastructure, current security stack, and what you're trying to achieve…", required: true },
    ],
  },
  {
    slug: "registration-form",
    name: "Registration form",
    status: "PUBLISHED",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", placeholder: "Your full name", required: true },
      { key: "organisationName", label: "Organisation Name", type: "text", placeholder: "Organisation name" },
      { key: "email", label: "Work Email", type: "email", placeholder: "you@company.com", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "Create a strong password", required: true },
      { key: "region", label: "Region", type: "select", placeholder: "Select your region", options: ["North America", "Europe", "APAC", "Middle East", "Other"] },
    ],
  },
] as const;

const defaultLeads = [] as const;

const defaultPages = [
  {
    slug: "home",
    title: "Home",
    status: "PUBLISHED",
    seo: {
      title: "Phause | Strengthen. Aware. Defend.",
      description:
        "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
      keywords: ["cybersecurity", "threat detection", "cloud protection", "phause"],
      canonical: "https://phause.com/",
    },
    blocks: [
      {
        type: "hero",
        order: 0,
        props: {
          eyebrow: "Strengthen. Aware. Defend.",
          title: "Strengthen. Aware. Defend.",
          description:
            "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
          ctaPrimary: "Get Protected Now",
          ctaSecondary: "Explore Platform",
          ctaPrimaryHref: "/subscription",
          ctaSecondaryHref: "/about",
        },
      },
      {
        type: "stats",
        order: 1,
        props: {
          items: [
            { value: "99.9%", label: "Threat Block Rate" },
            { value: "24/7", label: "Active Monitoring" },
            { value: "<50ms", label: "Response Time" },
            { value: "500+", label: "Companies Protected" },
          ],
        },
      },
      {
        type: "homePhilosophy",
        order: 2,
        props: {
          title: "Security is not a product. It's a mindset.",
          subtitle: "Three core principles guide everything we build, ship, and defend.",
          items: [
            { id: "home-philosophy-1", icon: "shield", title: "Proactive Defense", description: "We don't wait for attacks. We hunt threats before they strike, turning vulnerability into strength." },
            { id: "home-philosophy-2", icon: "eye", title: "Radical Transparency", description: "Real-time visibility into every security event. No hidden logs, no surprises — complete clarity." },
            { id: "home-philosophy-3", icon: "lock", title: "Privacy by Design", description: "Your data is sacred. We build every system with encryption and privacy as the foundation, not an afterthought." },
          ],
        },
      },
      {
        type: "homeReasons",
        order: 3,
        props: {
          title: "Why the world's best teams choose Phause",
          subtitle: "Numbers don't lie. Here's what sets us apart from every other security vendor.",
          items: [
            { id: "home-reason-1", icon: "zap", title: "Lightning-Fast Response", description: "Sub-50ms automated threat neutralization — the fastest in the industry." },
            { id: "home-reason-2", icon: "cpu", title: "AI-Powered Engine", description: "Machine learning models trained on 50B+ security events, updated hourly." },
            { id: "home-reason-3", icon: "users", title: "Human Experts 24/7", description: "Elite security analysts watching over your infrastructure around the clock." },
            { id: "home-reason-4", icon: "code", title: "Zero-Downtime Deployment", description: "Deploy protection without touching a single line of your existing code." },
          ],
        },
      },
      {
        type: "homeServices",
        order: 4,
        props: {
          title: "Complete security, end to end",
          subtitle: "Every layer of your stack covered — from infrastructure to the last byte of data.",
          items: [
            { id: "home-service-1", icon: "radar", title: "Threat Detection", description: "Real-time AI scanning across all endpoints, networks and cloud assets." },
            { id: "home-service-2", icon: "shieldCheck", title: "Security Audits", description: "Deep-dive penetration testing and compliance audits by certified experts." },
            { id: "home-service-3", icon: "cloud", title: "Cloud Protection", description: "Zero-trust security architecture for AWS, Azure, GCP and hybrid clouds." },
            { id: "home-service-4", icon: "server", title: "Infrastructure Defense", description: "Harden your servers, APIs and databases against zero-day exploits." },
            { id: "home-service-5", icon: "lock", title: "Data Encryption", description: "End-to-end AES-256 encryption with automated key rotation." },
            { id: "home-service-6", icon: "eye", title: "SIEM Monitoring", description: "Centralized log intelligence with instant anomaly alerting." },
          ],
        },
      },
      {
        type: "homeOffers",
        order: 5,
        props: {
          title: "More than protection — total peace of mind",
          subtitle: "Everything included in every plan, because security shouldn't be an upsell.",
          items: [
            { id: "home-offer-1", title: "Free Security Assessment", description: "A 360° audit of your infrastructure — completely free, no strings attached." },
            { id: "home-offer-2", title: "Dedicated Security Team", description: "Your own squad of specialists assigned exclusively to your account." },
            { id: "home-offer-3", title: "Compliance Made Easy", description: "GDPR, HIPAA, SOC 2 and ISO — we handle the paperwork, you stay compliant." },
            { id: "home-offer-4", title: "Incident Response SLA", description: "Guaranteed response to critical incidents in under 15 minutes." },
            { id: "home-offer-5", title: "Employee Training", description: "Phishing simulations and security workshops for your entire team." },
            { id: "home-offer-6", title: "Insurance Backed", description: "$10M cyber insurance coverage included with every enterprise plan." },
          ],
        },
      },
      {
        type: "homeProcess",
        order: 6,
        props: {
          title: "From vulnerable to bulletproof in 4 steps",
          subtitle: "A battle-tested methodology refined over thousands of deployments.",
          items: [
            { id: "home-process-1", icon: "eye", title: "Discover", description: "We map every asset, vulnerability and attack surface in your environment." },
            { id: "home-process-2", icon: "workflow", title: "Strategize", description: "A custom defense blueprint built for your architecture and risk profile." },
            { id: "home-process-3", icon: "shield", title: "Deploy", description: "Protection rolls out in hours — no downtime, no disruption to your team." },
            { id: "home-process-4", icon: "rocket", title: "Evolve", description: "Continuous learning and adaptation keeps you ahead of emerging threats." },
          ],
        },
      },
      {
        type: "homeCta",
        order: 7,
        props: {
          title: "Ready to become unhackable?",
          description: "Join 500+ companies that sleep soundly at night. Start your free security assessment today.",
          buttonText: "Start Free Trial",
        },
      },
      {
        type: "faq",
        order: 8,
        props: {
          items: [
            { question: "What does Phause protect?", answer: "Endpoints, cloud workloads, infrastructure, identities, and application surfaces across the modern enterprise." },
            { question: "How fast is response time?", answer: "Sub-50ms automated threat neutralization with human-led escalation and expert monitoring around the clock." },
            { question: "Is implementation disruptive?", answer: "No. We deploy protection without touching a single line of your existing code and keep zero-downtime operations in mind." },
          ],
        },
      },
    ],
  },
  {
    slug: "about",
    title: "About",
    status: "PUBLISHED",
    seo: {
      title: "Phause | Strengthen. Aware. Defend.",
      description:
        "From a two-person research lab to a global cybersecurity force — this is the story, the mission, and the machine behind Phause.",
      keywords: ["about phause", "cybersecurity", "zero trust"],
      canonical: "https://phause.com/about",
    },
    blocks: [
      {
        type: "hero",
        order: 0,
        props: {
          eyebrow: "About Us",
          title: "The Team Behind the Shield",
          aboutTitle: "Born in a War Room. Built for the Digital Battlefield.",
          description:
            "From a two-person research lab to a global cybersecurity force — this is the story, the mission, and the machine behind Phause.",
          ctaPrimary: "Start Free Trial",
        },
      },
      {
        type: "aboutCapabilities",
        order: 1,
        props: {
          items: [
            { id: "about-capability-detection", icon: "shield", title: "Continuous Threat Detection & Hunting", description: "Our distributed detection mesh monitors packets, processes, APIs, and identities in real time across every environment." },
            { id: "about-capability-response", icon: "zap", title: "Automated Incident Response", description: "When a critical threat is detected, we execute a pre-authorized response playbook in under 50 milliseconds." },
            { id: "about-capability-cloud", icon: "cloud", title: "Cloud Security Posture Management", description: "We continuously audit AWS, Azure, and GCP environments against CIS and vendor-specific benchmarks." },
            { id: "about-capability-apps", icon: "code", title: "Application & API Security Testing", description: "We embed security into your software development lifecycle using static and dynamic analysis on every commit." },
            { id: "about-capability-soc", icon: "users", title: "Security Operations Center (SOC) as a Service", description: "Our analysts watch your telemetry around the clock and integrate directly with your existing SIEM and EDR stack." },
            { id: "about-capability-compliance", icon: "award", title: "Compliance & Governance Automation", description: "We automate evidence collection and control mapping for SOC 2, ISO 27001, HIPAA, and GDPR requirements." },
          ],
        },
      },
      {
        type: "aboutValues",
        order: 2,
        props: {
          items: [
            { id: "about-value-speed", icon: "zap", title: "Response Speed That Breaks Records", description: "Our median time-to-containment is 47 milliseconds for automated playbooks and under 15 minutes for human-led incident response." },
            { id: "about-value-ai", icon: "cpu", title: "AI Trained on Real-World Battle Data", description: "Most security AI is trained on lab data. Ours learns from the live telemetry of hundreds of organizations." },
            { id: "about-value-transparency", icon: "eye", title: "Radical Transparency — No Black Boxes", description: "Every detection, automated action, and analyst decision is visible in real time through our client dashboard." },
            { id: "about-value-zero-trust", icon: "lock", title: "Zero-Trust Architecture, Zero Excuses", description: "We practice what we deploy. Phause's internal infrastructure runs on least-privilege principles and hardware-backed key management." },
            { id: "about-value-business", icon: "handshake", title: "We Treat Your Business Like Our Own", description: "Every client gets a named security team, a direct escalation line to senior analysts, and tailored threat briefings." },
            { id: "about-value-scale", icon: "trending", title: "Security That Scales With You", description: "From startups to global enterprises, we deploy the same architecture and the same rigor." },
          ],
        },
      },
      {
        type: "aboutCommitments",
        order: 3,
        props: {
          items: [
            { id: "about-commitment-clients", icon: "target", title: "To Our Clients", description: "We commit to honest risk assessments, transparent pricing and a contractual SLA we have never breached." },
            { id: "about-commitment-team", icon: "users", title: "To Our Team", description: "We commit to sustainable careers, sensible on-call rotations and protected learning time for every engineer." },
            { id: "about-commitment-community", icon: "globe", title: "To the Security Community", description: "We commit to making the internet safer, not just for our paying clients, through open research and reusable detection rules." },
            { id: "about-commitment-future", icon: "lightbulb", title: "To the Future", description: "We commit to anticipating the next decade of threats, including post-quantum cryptography and AI-driven attack vectors." },
          ],
        },
      },
      {
        type: "aboutTimeline",
        order: 4,
        props: {
          items: [
            { id: "about-timeline-2018", year: "2018", title: "The Garage Era", icon: "flag", description: "Two security researchers, one whiteboard, and a rented garage in San Francisco. Phause begins as a weekend project: a lightweight agent that could detect lateral movement inside corporate networks." },
            { id: "about-timeline-2019", year: "2019", title: "First Enterprise Clients & Seed Funding", icon: "rocket", description: "Phause officially incorporates and closes a $4M seed round. We sign our first 10 enterprise clients and grow the team to 15 engineers." },
            { id: "about-timeline-2020", year: "2020", title: "The Pandemic Stress Test", icon: "shield", description: "As the world goes remote, attack surfaces explode. We scale from 50 to 200 clients in nine months while handling a 600% spike in ransomware campaigns. Zero client breaches." },
            { id: "about-timeline-2021", year: "2021", title: "Series A & the AI Breakthrough", icon: "cpu", description: "We raise a $28M Series A and ship Phause Sense, our behavioral ML engine. Detection accuracy jumps 40% while false positives drop by two-thirds." },
            { id: "about-timeline-2022", year: "2022", title: "SOC 2 Type II & Global Expansion", icon: "award", description: "SOC 2 Type II certification achieved with zero exceptions. We cross 300 enterprise clients and expand into APAC with a Singapore data region." },
            { id: "about-timeline-2023", year: "2023", title: "The Compliance Automation Launch", icon: "layers", description: "Phause Comply ships, automating evidence collection for SOC 2, ISO 27001, HIPAA, and PCI DSS. Client audit preparation time drops from months to days." },
            { id: "about-timeline-2024", year: "2024", title: "Series B & the 24/7 SOC", icon: "eye", description: "A $75M Series B funds the launch of our fully managed SOC-as-a-Service with tiered human analysts in three continents." },
            { id: "about-timeline-2025", year: "2025", title: "Zero-Trust Platform Unification", icon: "workflow", description: "We collapse six products into one unified zero-trust platform under a single agent and a single dashboard." },
            { id: "about-timeline-2026", year: "2026", title: "Today — and What's Next", icon: "globe", description: "500+ clients, 40+ countries, 150+ security experts, and 1,250+ projects delivered." },
          ],
        },
      },
    ],
  },
  {
    slug: "services",
    title: "Services",
    status: "PUBLISHED",
    seo: {
      title: "Phause | Cybersecurity Services",
      description: "Security services built for modern teams: threat detection, audits, cloud protection, and strategic guidance.",
      keywords: ["cybersecurity services", "threat detection", "cloud protection"],
      canonical: "https://phause.com/services",
    },
    blocks: [
      {
        type: "servicesHero",
        order: 0,
        props: {
          eyebrow: "Our Services",
          title: "Practical security services for a phishing-aware organisation.",
          description: "Explore security awareness, email assessment and phishing-readiness services designed to help your organisation strengthen its approach to digital threats.",
          ctaPrimary: "Explore Services",
          ctaPrimaryHref: "#services",
          ctaSecondary: "Talk to Our Team",
          ctaSecondaryHref: "/contact",
        },
      },
      {
        type: "servicesFeatures",
        order: 1,
        props: {
          items: [
            { id: "service-phishing-awareness", number: "01", title: "Phishing Awareness & Simulation", description: "Help your employees recognise suspicious emails and understand common phishing techniques.", image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1000&q=85", overview: "Build a stronger security-conscious workforce through awareness initiatives and controlled phishing simulations.", features: ["Phishing awareness programmes", "Simulated phishing exercises", "Employee awareness insights", "Guidance on identifying suspicious messages"], suitableFor: "Organisations looking to improve employee awareness and reduce phishing-related risks.", position: 0 },
            { id: "service-email-security-assessment", number: "02", title: "Email Security Assessment", description: "Review your email security practices and identify areas that may need stronger protection.", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85", overview: "Understand how your organisation approaches email security and identify potential weaknesses in process, configuration and user behaviour.", features: ["Email security posture review", "Identification of potential weaknesses", "Security configuration recommendations", "Practical improvement guidance"], suitableFor: "Businesses that want to review their current email security practices and improve protection.", position: 1 },
            { id: "service-phishing-threat-detection", number: "03", title: "Phishing Threat Detection", description: "Improve visibility into suspicious messages and help your team respond to potential threats.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=85", overview: "Strengthen your organisation's ability to identify and assess suspicious email activity and escalate potential threats efficiently.", features: ["Suspicious email identification guidance", "Threat reporting workflows", "Incident escalation recommendations", "Security response guidance"], suitableFor: "Teams seeking a more structured approach to identifying and reporting suspicious email activity.", position: 2 },
            { id: "service-security-awareness-training", number: "04", title: "Security Awareness Training", description: "Give employees practical knowledge to make safer decisions when handling digital communication.", image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=85", overview: "Help employees understand their role in protecting business information through practical security habits and safe online behaviour.", features: ["Security awareness sessions", "Phishing prevention guidance", "Safe email and browsing practices", "Employee security education"], suitableFor: "Businesses that want to build consistent security awareness across teams.", position: 3 },
            { id: "service-phishing-incident-readiness", number: "05", title: "Phishing Incident Readiness", description: "Prepare your organisation with clear reporting, escalation and response procedures.", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=85", overview: "Establish responsibilities and practical response steps so teams can react quickly when a suspicious message is reported.", features: ["Incident reporting procedures", "Response and escalation planning", "Employee reporting guidance", "Security process recommendations"], suitableFor: "Organisations that want to improve readiness to handle suspected phishing incidents.", position: 4 },
          ],
        },
      },
      {
        type: "servicesProcess",
        order: 2,
        props: {
          items: [
            { id: "process-understand", number: "01", title: "Understand", description: "We begin by understanding your organisation, current security practices and priorities.", position: 0 },
            { id: "process-assess", number: "02", title: "Assess", description: "We review your requirements and identify areas where security improvements may help.", position: 1 },
            { id: "process-recommend", number: "03", title: "Recommend", description: "We outline a practical approach based on your organisation's needs and objectives.", position: 2 },
            { id: "process-improve", number: "04", title: "Improve", description: "We help you move forward with clear actions and a stronger security approach.", position: 3 },
          ],
        },
      },
      {
        type: "servicesAudiences",
        order: 3,
        props: {
          items: [
            { id: "audience-growing-businesses", title: "Growing Businesses", description: "Build stronger email security practices as your organisation grows.", icon: "building", position: 0 },
            { id: "audience-enterprise-teams", title: "Enterprise Teams", description: "Support consistent security awareness across larger teams.", icon: "network", position: 1 },
            { id: "audience-remote-workforces", title: "Remote Workforces", description: "Help distributed employees recognise suspicious communication.", icon: "remote", position: 3 },
            { id: "audience-operations-teams", title: "Operations Teams", description: "Establish practical procedures for reporting potential threats.", icon: "operations", position: 4 },
            { id: "audience-business-leadership", title: "Business Leadership", description: "Understand organisational phishing risks and improvement priorities.", icon: "leadership", position: 5 },
          ],
        },
      },
      {
        type: "servicesBenefits",
        order: 4,
        props: {
          items: [
            { id: "benefit-practical-security-focus", title: "Practical Security Focus", description: "Recommendations centred on real organisational requirements.", icon: "focus", position: 0 },
            { id: "benefit-people-aware-approach", title: "People-Aware Approach", description: "Recognise the important role employees play in phishing prevention.", icon: "approach", position: 1 },
            { id: "benefit-clear-recommendations", title: "Clear Recommendations", description: "Understand potential improvement areas and the next steps to consider.", icon: "recommendations", position: 2 },
            { id: "benefit-connected-approach", title: "Connected Approach", description: "Bring awareness, assessment and response planning together.", icon: "connected", position: 3 },
            { id: "benefit-tailored-engagement", title: "Tailored Engagement", description: "Shape discussions around your organisation's needs and priorities.", icon: "tailored", position: 4 },
            { id: "benefit-ongoing-improvement", title: "Ongoing Improvement", description: "Support a more consistent approach to security awareness over time.", icon: "improvement", position: 5 },
          ],
        },
      },
      {
        type: "servicesStats",
        order: 5,
        props: {
          items: [
            { id: "stat-core-service-pathways", title: "5 core service areas", description: "A connected approach to phishing security", icon: "shield", position: 0 },
            { id: "stat-understand-to-improve", title: "Understand to improve", description: "A clear process built around your needs", icon: "workflow", position: 1 },
            { id: "stat-people-and-technology", title: "People and technology", description: "Consider both in your security approach", icon: "network", position: 2 },
          ],
        },
      },
      {
        type: "servicesFaq",
        order: 6,
        props: {
          items: [
            { id: "faq-service-types", question: "What types of phishing-related services do you offer?", answer: "Phause's service areas include phishing awareness and simulation, email security assessment, phishing threat detection, security awareness training and phishing incident readiness." },
            { id: "faq-beneficiaries", question: "Who can benefit from these services?", answer: "Businesses of different sizes, IT and security teams, operations departments and organisations with remote workforces can explore these services based on their requirements." },
            { id: "faq-combine-services", question: "Can we combine multiple services?", answer: "Yes. You can discuss multiple requirements together so that the proposed approach reflects your organisation's priorities." },
            { id: "faq-engagement-process", question: "How does the engagement process begin?", answer: "Start by contacting the Phause team. Share your organisation's requirements and the team can discuss suitable next steps." },
            { id: "faq-tailored-approach", question: "Are the services tailored to our organisation?", answer: "The requirements and scope can be discussed with the Phause team to understand which approach is appropriate for your organisation." },
          ],
        },
      },
      {
        type: "servicesCta",
        order: 7,
        props: {
          title: "Ready to strengthen your phishing security approach?",
          description: "Tell us about your organisation's requirements. Let's explore the right services and next steps for your team.",
          ctaPrimary: "Talk to Our Team",
          ctaPrimaryHref: "/contact",
          ctaSecondary: "Review Services",
          ctaSecondaryHref: "#services",
        },
      },
    ],
  },
  {
    slug: "blog",
    title: "Blog",
    status: "PUBLISHED",
    seo: {
      title: "Phause | Blog",
      description: "Insights, research notes, and practical guidance from the Phause security team.",
      keywords: ["phause blog", "cybersecurity insights"],
      canonical: "https://phause.com/blog",
    },
    blocks: [
      {
        type: "hero",
        order: 0,
        props: {
          eyebrow: "Insights",
          title: "Security knowledge worth sharing",
          description: "Expert analysis and practical guidance for leaders defending modern digital operations.",
        },
      },
    ],
  },
  {
    slug: "docs",
    title: "Docs",
    status: "PUBLISHED",
    seo: {
      title: "Phause | Documentation",
      description: "Product guides, onboarding notes, and platform documentation for Phause customers.",
      keywords: ["phause docs", "security documentation"],
      canonical: "https://phause.com/docs",
    },
    blocks: [
      {
        type: "hero",
        order: 0,
        props: {
          eyebrow: "Documentation",
          title: "Everything you need to get secure faster",
          description: "Guides, playbooks, and reference materials to help your team launch confidently.",
        },
      },
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    status: "PUBLISHED",
    seo: {
      title: "Phause | FAQ",
      description: "Answers to common questions about Phause services, deployment, and security coverage.",
      keywords: ["phause faq", "security questions"],
      canonical: "https://phause.com/faq",
    },
    blocks: [
      {
        type: "hero",
        order: 0,
        props: {
          eyebrow: "FAQ",
          title: "Questions, answered.",
          description: "Everything teams usually ask before they put Phause between them and the attackers.",
        },
      },
      {
        type: "faq",
        order: 1,
        props: {
          items: [
            { question: "Can I switch plans after subscribing?", answer: "Absolutely. Upgrades take effect instantly and are prorated to the day. Downgrades apply at the start of your next billing cycle, and your historical data is always preserved according to the higher plan's retention window." },
            { question: "What happens after my 14-day trial ends?", answer: "On day 15 we ask for a payment method. If you don't add one, your account gracefully downgrades to Sentinel Free — no data deletion, no service interruption, no awkward sales calls." },
            { question: "Is there a minimum contract length?", answer: "Monthly plans are month-to-month with zero lock-in. Yearly plans are paid upfront with a 20% discount, and you can request a prorated refund within the first 60 days if Phause isn't a fit." },
            { question: "How is per-endpoint pricing counted?", answer: "An endpoint is any device, server, container, or cloud workload running the Phause agent. Ephemeral workloads like CI runners are averaged over the month so burst builds don't inflate your bill." },
            { question: "Do you offer discounts for nonprofits or education?", answer: "Yes. Registered nonprofits, educational institutions, and open-source projects receive 50% off any paid tier, forever. Reach out to our community team to apply." },
            { question: "What makes Sentinel Sovereign different?", answer: "Sovereign is a fully air-gapped deployment of the entire Phause platform — it runs entirely inside your perimeter with zero external telemetry. It includes our post-quantum cryptography migration lab and a dedicated on-site incident response retainer." },
          ],
        },
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    status: "PUBLISHED",
    seo: {
      title: "Phause | Contact",
      description:
        "Whether you're evaluating a platform, planning a migration, or facing an active incident — our team is one message away, around the clock.",
      keywords: ["contact phause", "security support", "incident response"],
      canonical: "https://phause.com/contact",
    },
    blocks: [
      {
        type: "contact",
        order: 0,
        props: {
          title: "Let's Secure Your Future",
          description:
            "Whether you're evaluating a platform, planning a migration, or facing an active incident — our team is one message away, around the clock.",
          ctaPrimary: "Send Enquiry",
          ctaSecondary: "Call Emergency Line",
          ctaPrimaryHref: "/contact",
          ctaSecondaryHref: "tel:+1-555-010-7428",
          details: [
            { label: "Email Us", value: "hello@phause.com\nsupport@phause.com", note: "For demos & partnerships / For existing clients" },
            { label: "Call Us", value: "+1 (555) 010-PHAUSE (USA)\n+91 80 4719 0100 (India)", note: "24/7 emergency line for active incidents" },
            { label: "Headquarters", value: "580 California Street, Floor 12\nSan Francisco, CA 94104, USA", note: "Regional offices in New York, Bangalore & Mumbai" },
            { label: "Working Hours", value: "Mon – Fri: 9:00 AM – 6:00 PM (local)\nSOC & Incident Response: 24/7/365", note: "Global follow-the-sun coverage across 3 continents" },
          ],
        },
      },
    ],
  },
  {
    slug: "subscription",
    title: "Subscription",
    status: "PUBLISHED",
    seo: {
      title: "Phause | Pricing & Plans",
      description:
        "Five tiers. One platform. Zero compromises. Start free, upgrade when you're ready — every plan runs the same battle-tested defense grid.",
      keywords: ["phause pricing", "cybersecurity pricing", "security plans"],
      canonical: "https://phause.com/subscription",
    },
    blocks: [
      {
        type: "hero",
        order: 0,
        props: {
          badgeText: "Pricing & Plans",
          eyebrow: "Pricing & Plans",
          title: "Security that scales with you",
          highlightedWord: "scales",
          subtitle:
            "Five tiers. One platform. Zero compromises. Start free, upgrade when you're ready — every plan runs the same battle-tested defense grid.",
          description:
            "Five tiers. One platform. Zero compromises. Start free, upgrade when you're ready — every plan runs the same battle-tested defense grid.",
          ctaText: "Choose your shield",
        },
      },
      {
        type: "subscriptionFeatures",
        order: 1,
        props: {
          items: [
            { icon: "badge", title: "SOC 2 Type II Certified", displayOrder: 0 },
            { icon: "lock", title: "Zero-Trust Architecture", displayOrder: 1 },
            { icon: "globe", title: "40+ Countries Served", displayOrder: 2 },
            { icon: "headset", title: "24/7 Human Support", displayOrder: 3 },
            { icon: "trend", title: "99.98% Uptime SLA", displayOrder: 4 },
          ],
        },
      },
      {
        type: "subscriptionFaq",
        order: 2,
        props: {
          items: [
            { question: "Can I switch plans after subscribing?", answer: "Yes. Upgrades take effect instantly and downgrades apply at the start of your next billing cycle.", displayOrder: 0 },
            { question: "What happens after my trial ends?", answer: "If no payment method is added, your account can gracefully move to the free tier without data deletion.", displayOrder: 1 },
            { question: "Is there a minimum contract length?", answer: "Monthly plans are month-to-month. Yearly plans include a discount and remain available with flexible terms.", displayOrder: 2 },
          ],
        },
      },
      {
        type: "subscriptionCta",
        order: 3,
        props: {
          heading: "Still unsure? Talk to a human.",
          description: "Our security engineers will map your environment to the right tier in a free 30-minute call.",
          buttonText: "Book a Free Consultation",
          buttonLink: "/contact",
        },
      },
      {
        type: "pricing",
        order: 4,
        props: {
          title: "Choose Your Shield",
          plans: [
            { name: "Starter", price: "$0", description: "For early teams getting started." },
            { name: "Growth", price: "$49", description: "For modern companies scaling securely." },
            { name: "Enterprise", price: "Custom", description: "For global operations with advanced requirements." },
          ],
        },
      },
    ],
  },
  {
    slug: "registration",
    title: "Registration",
    status: "PUBLISHED",
    seo: {
      title: "Create your Phause account",
      description:
        "Create your Phause account. A smarter way to work, powered by AI.",
      keywords: ["register phause", "account creation", "security platform"],
      canonical: "https://phause.com/registration",
    },
    blocks: [
      {
        type: "form",
        order: 0,
        props: {
          title: "Create your Phause account.",
          description: "Enter your details to get started.",
          fields: [
            { label: "Full name", type: "text", placeholder: "Full name" },
            { label: "Organisation name", type: "text", placeholder: "Organisation name" },
            { label: "Work email", type: "email", placeholder: "Work email" },
            { label: "Password", type: "password", placeholder: "Password" },
            { label: "Region", type: "text", placeholder: "Select your region" },
          ],
        },
      },
    ],
  },
] as const;

function toPrismaBlockType(type: string) {
  const map: Record<string, string> = {
    hero: "HERO",
    cta: "CTA",
    ctaButton: "CTA_BUTTON",
    features: "FEATURES",
    services: "SERVICES",
    servicesHero: "SERVICES_HERO",
    servicesFeatures: "SERVICES_FEATURES",
    servicesProcess: "SERVICES_PROCESS",
    servicesAudiences: "SERVICES_AUDIENCES",
    servicesBenefits: "SERVICES_BENEFITS",
    servicesStats: "SERVICES_STATS",
    servicesFaq: "SERVICES_FAQ",
    servicesCta: "SERVICES_CTA",
    testimonials: "TESTIMONIALS",
    gallery: "GALLERY",
    faq: "FAQ",
    stats: "STATS",
    pricing: "PRICING",
    subscriptionFeatures: "SUBSCRIPTION_FEATURES",
    subscriptionFaq: "SUBSCRIPTION_FAQ",
    subscriptionCta: "SUBSCRIPTION_CTA",
    team: "TEAM",
    richText: "RICHTEXT",
    video: "VIDEO",
    contact: "CONTACT",
    form: "FORM",    aboutCapabilities: "ABOUT_CAPABILITIES",
    aboutValues: "ABOUT_VALUES",
    aboutCommitments: "ABOUT_COMMITMENTS",
    aboutTimeline: "ABOUT_TIMELINE",    customSection: "CUSTOM_SECTION",
  };

  if (map[type]) {
    return map[type];
  }

  return type
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toUpperCase();
}

export async function hasDefaultCmsContent() {
  const prismaReady =
    typeof prisma !== "undefined" &&
    typeof (prisma as { page?: { findFirst?: unknown } }).page?.findFirst === "function" &&
    typeof (prisma as { setting?: { findFirst?: unknown } }).setting?.findFirst === "function" &&
    typeof (prisma as { navigation?: { findFirst?: unknown } }).navigation?.findFirst === "function";

  if (!prismaReady) {
    return false;
  }

  try {
    const [homePage, siteSetting, mainNavigation] = await Promise.all([
      prisma.page.findFirst({ where: { slug: "home", deletedAt: null } }),
      prisma.setting.findFirst({ where: { key: defaultSettings[0]?.key ?? "siteName", deletedAt: null } }),
      prisma.navigation.findFirst({ where: { key: defaultNavigation.key, deletedAt: null } }),
    ]);

    return Boolean(homePage && siteSetting && mainNavigation);
  } catch (error) {
    if (isMissingCmsTableError(error)) {
      return false;
    }

    throw error;
  }
}


function normalizeBlockType(type: string) {
  const normalized = type.toString().trim().replace(/[^a-z0-9]+/gi, "").toLowerCase();

  switch (normalized) {
    case "hero":
      return "hero";
    case "cta":
      return "cta";
    case "ctabutton":
      return "ctaButton";
    case "features":
      return "features";
    case "services":
      return "services";
    case "serviceshero":
      return "servicesHero";
    case "servicesfeatures":
      return "servicesFeatures";
    case "servicesprocess":
      return "servicesProcess";
    case "servicesaudiences":
      return "servicesAudiences";
    case "servicesbenefits":
      return "servicesBenefits";
    case "servicesstats":
      return "servicesStats";
    case "servicesfaq":
      return "servicesFaq";
    case "servicescta":
      return "servicesCta";
    case "aboutcapabilities":
      return "aboutCapabilities";
    case "aboutvalues":
      return "aboutValues";
    case "aboutcommitments":
      return "aboutCommitments";
    case "abouttimeline":
      return "aboutTimeline";
    case "testimonials":
      return "testimonials";
    case "gallery":
      return "gallery";
    case "faq":
      return "faq";
    case "stats":
      return "stats";
    case "pricing":
      return "pricing";
    case "subscriptionfeatures":
      return "subscriptionFeatures";
    case "subscriptionfaq":
      return "subscriptionFaq";
    case "subscriptioncta":
      return "subscriptionCta";
    case "team":
      return "team";
    case "contact":
      return "contact";
    case "form":
      return "form";
    case "richtext":
      return "richText";
    case "customsection":
      return "customSection";
    default:
      return normalized;
  }
}

export async function getPageBySlug(slug: string) {
  const page = await prisma.page.findFirst({
    where: { slug, deletedAt: null },
    include: {
      seo: true,
      blocks: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });

  if (page) {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      seo: page.seo ?? undefined,
      blocks: page.blocks.map((block) => ({
        id: block.id,
        type: normalizeBlockType(block.type),
        order: block.order,
        props: block.props as Record<string, unknown>,
      })),
    };
  }

  const fallbackPage = defaultPages.find((entry) => entry.slug === slug);

  if (!fallbackPage) {
    return null;
  }

  return {
    id: `fallback-${fallbackPage.slug}`,
    slug: fallbackPage.slug,
    title: fallbackPage.title,
    status: fallbackPage.status,
    seo: fallbackPage.seo,
    blocks: fallbackPage.blocks.map((block, index) => ({
      id: `fallback-${fallbackPage.slug}-${block.type}-${index}`,
      type: block.type,
      order: block.order ?? index,
      props: block.props as Record<string, unknown>,
    })),
  };
}

function isMissingCmsTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = typeof (error as unknown as { code?: unknown }).code === "string"
    ? (error as unknown as { code: string }).code
    : undefined;
  const message = error.message.toLowerCase();

  return (
    code === "P2021" ||
    code === "P2022" ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("table") ||
    message.includes("model")
  );
}

export async function getNavigationConfig() {
  try {
    const navigation = await prisma.navigation.findFirst({
      where: { key: defaultNavigation.key, deletedAt: null },
      include: { items: { where: { deletedAt: null }, orderBy: { position: "asc" } } },
    });

    if (navigation) {
      const cmsItems = navigation.items.map((item) => ({ label: item.label, href: item.href, position: item.position }));
      const requiredItems = defaultNavigation.items;
      const mergedItems = requiredItems.map((required) => {
        const existing = cmsItems.find((item) => item.href === required.href);
        return existing ? { ...required, label: existing.label, position: required.position } : required;
      });

      return {
        key: navigation.key,
        label: navigation.label,
        items: mergedItems,
      };
    }

    return defaultNavigation;
  } catch (error) {
    if (isMissingCmsTableError(error)) {
      return defaultNavigation;
    }

    throw error;
  }
}

export async function getFooterConfig() {
  try {
    const footer = await prisma.footer.findFirst({
      where: { slug: "main-footer", deletedAt: null },
      include: { links: { where: { deletedAt: null }, orderBy: { position: "asc" } } },
    });

    if (footer) {
      return {
        title: footer.title,
        description: footer.description ?? defaultFooter.description,
        copyright: footer.copyright ?? defaultFooter.copyright,
        links: footer.links.map((link) => ({ label: link.label, href: link.href, position: link.position })),
      };
    }

    return defaultFooter;
  } catch (error) {
    if (isMissingCmsTableError(error)) {
      return defaultFooter;
    }

    throw error;
  }
}
