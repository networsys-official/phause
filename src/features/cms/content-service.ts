import { prisma } from "@/infrastructure/database/prisma";
import { slugToHref } from "@/features/cms/cms-service";
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
    "Phause helps organisations run authorised phishing simulations, understand employee interactions and strengthen security awareness through reporting and follow-up training.",
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
  { slug: "supportPhone", key: "supportPhone", value: "", status: "PUBLISHED" },
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
      title: "Phause | Phishing Simulation & Security Awareness",
      description:
        "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with practical training follow-through.",
      keywords: ["phishing simulation", "security awareness", "employee training", "phause"],
      canonical: "https://phause.com/",
    },
    blocks: [
      {
        type: "hero",
        order: 0,
        props: {
          eyebrow: "PHISHING SIMULATION & SECURITY AWARENESS",
          title: "Turn phishing awareness into measurable security readiness.",
          description:
            "Phishing is a people problem as much as a technology problem. Phause helps your organisation run authorised simulations, understand employee interactions and plan useful follow-up learning.",
          ctaPrimary: "Create an Account",
          ctaSecondary: "Explore the Platform",
          ctaPrimaryHref: "/register",
          ctaSecondaryHref: "/services",
        },
      },
      {
        type: "stats",
        order: 1,
        props: {
          items: [
            { value: "Authorised", label: "Responsible exercises" },
            { value: "Connected", label: "Campaign Activity" },
            { value: "Practical", label: "Follow-up learning" },
            { value: "Structured", label: "Programme workflow" },
          ],
        },
      },
      {
        type: "homePhilosophy",
        order: 2,
        props: {
          title: "Security is not a product. It's a mindset.",
          subtitle: "Three core principles guide everything we build, ship, and defend.",
          items: [],
        },
      },
      {
        type: "homeReasons",
        order: 3,
        props: {
          title: "Why the teams behind security awareness choose Phause",
          subtitle: "A practical platform for planning, understanding and improving phishing-awareness programmes.",
          items: [
            { id: "home-reason-1", icon: "shield", title: "A clearer programme workflow", description: "Bring employee preparation, templates, campaigns, tracking, reports and training administration into one connected process." },
            { id: "home-reason-2", icon: "target", title: "More controlled campaign planning", description: "Choose eligible recipients, target a department segment or use a sample percentage. Schedule a campaign or configure it for immediate delivery." },
            { id: "home-reason-3", icon: "users", title: "Human Security Expertise", description: "Security teams and specialists help organisations interpret findings and plan follow-up action." },
            { id: "home-reason-4", icon: "chart", title: "More useful reporting conversations", description: "Use campaign metrics and risk indicators to identify patterns, discuss improvement areas and explain the next step to stakeholders." },
          ],
        },
      },
      {
        type: "homeServices",
        order: 4,
        props: {
          title: "From employee preparation to programme insight",
          subtitle: "Essential parts of a phishing-awareness programme in one connected workspace.",
          items: [
            { id: "home-service-1", icon: "users", title: "Employee Management", description: "Organise employee records and review eligibility and consent before adding employees to a simulation." },
            { id: "home-service-2", icon: "mail", title: "Phishing Templates", description: "Work with saved templates or create a message, then preview it before use in a campaign." },
            { id: "home-service-3", icon: "campaign", title: "Campaign Management", description: "Select the audience, configure delivery and review campaign settings before dispatch." },
            { id: "home-service-4", icon: "chart", title: "Reporting and Risk Insights", description: "Review recorded interactions and use campaign reports and risk indicators to plan follow-up." },
            { id: "home-service-5", icon: "training", title: "Training Administration", description: "Manage training modules, enrolments and completion records." },
          ],
        },
      },
      {
        type: "homeProcess",
        order: 6,
        props: {
          title: "Plan. Simulate. Learn. Improve.",
          subtitle: "A practical phishing-awareness programme cycle.",
          items: [
            { id: "home-process-1", icon: "users", title: "Prepare", description: "Set up employee records and confirm who is authorised and eligible for the exercise." },
            { id: "home-process-2", icon: "mail", title: "Choose", description: "Select a saved template or create a message that matches the learning objective." },
            { id: "home-process-3", icon: "workflow", title: "Configure", description: "Choose the target audience, delivery method and schedule, then review the settings." },
            { id: "home-process-4", icon: "chart", title: "Learn", description: "Review campaign activity and use reports and training records to plan the next step." },
          ],
        },
      },
      {
        type: "homeCta",
        order: 7,
        props: {
          title: "Turn phishing awareness into measurable security readiness.",
          description: "Create an account to plan authorised simulations and organise follow-up awareness activity.",
          buttonText: "Create an Account",
        },
      },
      {
        type: "faq",
        order: 8,
        props: {
          items: [
            { question: "What does Phause help organisations do?", answer: "Phause helps teams plan authorised phishing simulations, track campaign interactions and organise reporting and follow-up learning." },
            { question: "How should campaign results be used?", answer: "Campaign activity should be interpreted in context and used to identify relevant awareness topics, not as a complete measure of employee knowledge." },
            { question: "How can a programme stay responsible?", answer: "Use appropriate organisational authorisation, define the scope and audience, protect employee-level results and communicate learning constructively." },
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
            { id: "about-capability-compliance", icon: "award", title: "Responsible Programme Administration", description: "Organise authorised simulations and follow-up learning through a clear, practical programme workflow." },
          ],
        },
      },
      {
        type: "aboutValues",
        order: 2,
        props: {
          items: [
            { id: "about-value-purpose", icon: "eye", title: "Purposeful Practice", description: "Phishing simulations should support a clear learning objective and appropriate organisational authorisation." },
            { id: "about-value-context", icon: "chart", title: "Context for Campaign Activity", description: "Interaction events and campaign metrics should be interpreted carefully rather than treated as a complete measure of employee knowledge." },
            { id: "about-value-learning", icon: "users", title: "Constructive Follow-Through", description: "Campaign findings should guide relevant awareness activity, training and future programme improvements." },
            { id: "about-value-responsibility", icon: "lock", title: "Responsible Use", description: "Employee-level results should be handled confidentially and used to support improvement, not embarrassment." },
          ],
        },
      },
      {
        type: "aboutCommitments",
        order: 3,
        props: {
          items: [
            { id: "about-commitment-programme", icon: "target", title: "Responsible Programme Design", description: "We support clear scopes, appropriate organisational authorisation and constructive use of campaign findings." },
            { id: "about-commitment-learning", icon: "users", title: "Practical Follow-Through", description: "We connect campaign results with relevant learning and future programme improvements." },
            { id: "about-commitment-privacy", icon: "lock", title: "Careful Handling of Results", description: "Employee-level activity should be reviewed confidentially and used to support improvement rather than embarrassment." },
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
            "Use the enquiry form to tell the Phause team what you would like to discuss.",
          ctaPrimary: "Send Enquiry",
          ctaPrimaryHref: "/contact",
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
          badgeText: "Plans & Pricing",
          eyebrow: "Plans & Pricing",
          title: "Choose the right space for your awareness programme.",
          highlightedWord: "awareness",
          subtitle: "Compare the plans available to your account and choose an option that fits the way your team intends to run its programme.",
          description: "Compare employee, campaign and reporting capacity across the current plans.",
          ctaText: "Explore plans",
        },
      },
      {
        type: "subscriptionFeatures",
        order: 1,
        props: {
          items: [
            { icon: "badge", title: "Phishing programme reporting", displayOrder: 0 },
            { icon: "users", title: "Employee and campaign management", displayOrder: 1 },
            { icon: "training", title: "Training administration", displayOrder: 2 },
            { icon: "headset", title: "Product guidance", displayOrder: 3 },
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
      include: { items: { where: { deletedAt: null }, orderBy: { position: "asc" }, include: { page: true } } },
    });

    if (navigation) {
      type VisibleNavigationItem = { id: string; label: string; href: string; position: number; pageId: string | null; pageTitle: string | null };
      const visibleItems: VisibleNavigationItem[] = navigation.items.flatMap((item): VisibleNavigationItem[] => {
        if (item.pageId) {
          if (item.page?.status !== "PUBLISHED" || item.page.deletedAt) return [];
          return [{ id: item.id, label: item.label, href: slugToHref(item.page.slug), position: item.position, pageId: item.pageId, pageTitle: item.page.title }];
        }
        if (item.status !== "PUBLISHED") return [];
        return [{ id: item.id, label: item.label, href: item.href, position: item.position, pageId: null, pageTitle: null }];
      });

      const dedupedVisibleItems: VisibleNavigationItem[] = [];
      const seenPageIds = new Set<string>();
      const seenHrefs = new Set<string>();
      for (const item of visibleItems.sort((left, right) => left.position - right.position)) {
        if (item.pageId && seenPageIds.has(item.pageId)) continue;
        if (seenHrefs.has(item.href)) continue;
        if (item.pageId) seenPageIds.add(item.pageId);
        seenHrefs.add(item.href);
        dedupedVisibleItems.push(item);
      }

      const requiredItems = defaultNavigation.items.map((item) => ({ ...item, href: slugToHref(item.href) }));
      const mergedItems = requiredItems.map((required) => {
        const existing = dedupedVisibleItems.find((item) => item.href === required.href);
        return existing ? { ...required, label: existing.label, position: existing.position, id: existing.id, pageId: existing.pageId, pageTitle: existing.pageTitle } : required;
      });
      const extras = dedupedVisibleItems.filter((item) => !requiredItems.some((required) => required.href === item.href));

      return {
        key: navigation.key,
        label: navigation.label,
        items: [...mergedItems, ...extras].sort((a, b) => a.position - b.position),
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
      include: { links: { where: { deletedAt: null }, orderBy: { position: "asc" }, include: { page: true } } },
    });

    if (footer) {
      type VisibleFooterLink = { id: string; label: string; href: string; position: number; type: string; pageId: string | null; pageTitle: string | null };
      const links: VisibleFooterLink[] = footer.links.flatMap((link): VisibleFooterLink[] => {
        if (link.pageId) {
          if (link.page?.status !== "PUBLISHED" || link.page.deletedAt) return [];
          return [{ id: link.id, label: link.label, href: slugToHref(link.page.slug), position: link.position, type: link.type, pageId: link.pageId, pageTitle: link.page.title }];
        }
        if (link.status !== "PUBLISHED") return [];
        return [{ id: link.id, label: link.label, href: link.href, position: link.position, type: link.type, pageId: null, pageTitle: null }];
      });
      return {
        title: footer.title,
        description: footer.description ?? defaultFooter.description,
        copyright: footer.copyright ?? defaultFooter.copyright,
        links,
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
