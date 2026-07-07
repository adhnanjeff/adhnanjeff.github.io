/* ------------------------------------------------------------------ */
/*  SINGLE SOURCE OF TRUTH                                              */
/*  Every project, skill and link lives here once. Engineer Mode and   */
/*  Story Mode both narrate from these same records, never forked.    */
/* ------------------------------------------------------------------ */

export const profile = {
  name: "Adhnan Jeff",
  role: "Associate Software Engineer",
  location: "Bangalore, India",
  quote:
    "Jack of all trades, master of none, but often better than a master at one.",
  /** Story Mode's own creed, the two modes never quote the same line. */
  quoteStory: "Just 1% extra, every day.",
  motto: "Click. Clack. Full-Stackkk.",
  /** Drives the ambient status badge, not currently open to new roles. */
  status: "full-time @ eProductivity Software",
  openToWork: false,
  taglineEngineer:
    "Backend & distributed systems, Java/Spring Boot, .NET, Kafka, AWS. I build systems that stay correct under load.",
  taglineStory:
    "I build the quiet systems people rely on, the kind that just work, so nobody has to think about them.",
  bioStory:
    "I'm a software engineer who likes the unglamorous parts: the ledger that must never lose a cent, the pipeline that can't drop a message, the API two systems quietly depend on. I'm finishing my B.Tech in IT, working full-time on production enterprise software, and building things on the side to keep learning where the real edges are.",
  links: {
    github: "https://github.com/adhnanjeff",
    linkedin: "https://www.linkedin.com/in/adhnan-jeff-706320289/",
    email: "adhnanjeffms@gmail.com",
    resume: "/Resume.pdf",
  },
} as const;

/**
 * Story Mode's narrative take on a project, NOT the architecture diagram.
 * The visitor first *feels* the problem (a playable incident), then watches
 * the story unfold scene by scene. Engineer Mode still owns the real system.
 */
export type ProjectStory = {
  /** Big editorial hook that opens the story. */
  hook: string;
  /** An optional decision the visitor makes before the explanation. */
  incident?: {
    /** Monospace "readout" lines that set the scene. */
    frame: string[];
    /** The question posed to the visitor. */
    prompt: string;
    choices: {
      label: string;
      /** The naïve choice, leads to the "authenticated ≠ trustworthy" lesson. */
      naive?: boolean;
      /** Byte's in-character reaction to this choice. */
      byte: string;
      /** What happens as a result. */
      result: string[];
    }[];
    /** The line revealed once a choice has been made. */
    insight: string;
  };
  /** The storyboard, each scene is a beat in plain language. */
  scenes: { title: string; caption: string }[];
  /** Headline numbers that close the story. */
  outcome: { value: string; label: string }[];
};

export type Project = {
  id: string;
  name: string;
  year: number;
  tag: string; // one-word category shown in listings
  descEngineer: string; // stack, architecture, trade-offs
  descStory: string; // impact, why it matters
  stack: string[];
  note?: string; // badge e.g. "Patent" / "Published"
  hasArchitecture?: boolean; // an interactive system diagram exists (Engineer Mode)
  /** Story Mode's narrative experience (playable incident + storyboard). */
  story?: ProjectStory;
  links?: { live?: string; repo?: string; paper?: string };
};

/** Flagships first. The two with `hasArchitecture` have living diagrams. */
export const projects: Project[] = [
  {
    id: "vehicle-security",
    name: "Real-Time Vehicle Security System",
    year: 2025,
    tag: "distributed",
    descEngineer:
      "Distributed SDV security platform: HMAC-SHA256-signed CAN frames dual-published to a TLS Kafka layer, a multi-layer validator stack (feature/behavioral/contextual/physics/temporal), online ML anomaly detection, a trust-score engine (HIGH→CRITICAL) and an IPS that warns/limits/blocks. 1000+ msgs/sec, 99.7% detection; Kafka + threading ETL cut Mongo writes ~80%, Isolation Forest at sub-100ms.",
    descStory:
      "A safety net for connected cars. It watches the messages a vehicle's own components send to each other, scores how much to trust each one, and can step in the instant something looks like tampering, then warns nearby vehicles.",
    stack: ["Python", "Flask", "Kafka", "MongoDB", "scikit-learn", "React"],
    hasArchitecture: true,
    story: {
      hook: "A signed message can still lie.",
      incident: {
        frame: [
          "INCOMING CAN FRAME",
          "id        0x184",
          "speed     220 km/h",
          "previous   42 km/h",
          "elapsed    50 ms",
        ],
        prompt: "The signature is valid. Do you trust it?",
        choices: [
          {
            label: "Trust it",
            naive: true,
            byte: "“Signature checks out, looks fine to me.”",
            result: [
              "A valid signature only proves who sent it,",
              "not that what it says could be true.",
              "The forged frame slips through, and the car acts on a lie.",
            ],
          },
          {
            label: "Question it",
            byte: "“Wait, no car jumps from 42 to 220 in 50 ms.”",
            result: [
              "✓ temporal anomaly",
              "✓ physics violation",
              "✓ behaviour deviation",
              "trust score   0.91 → 0.24",
            ],
          },
        ],
        insight:
          "That gap between authenticated and trustworthy is what this whole project lives in.",
      },
      scenes: [
        {
          title: "Normality",
          caption:
            "A car is driving. Its parts are constantly talking to each other. Everything looks fine.",
        },
        {
          title: "Disturbance",
          caption: "One message enters the conversation that doesn't belong.",
        },
        {
          title: "Questioning",
          caption:
            "Is it valid? Is it expected? Does it match how this car actually behaves? Does physics agree?",
        },
        {
          title: "Response",
          caption:
            "The car doesn't wait for a human. Trust drops, the threat is isolated, the system protects itself, and warns nearby vehicles.",
        },
        {
          title: "Result",
          caption: "All of it happens before you'd finish reading this sentence.",
        },
      ],
      outcome: [
        { value: "< 100 ms", label: "to detect" },
        { value: "1000+/s", label: "messages watched" },
        { value: "99.7%", label: "detection rate" },
      ],
    },
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "notification-system",
    name: "Distributed Notification System",
    year: 2025,
    tag: "backend",
    descEngineer:
      "Event-driven notification service on Azure Service Bus pub/sub: an ASP.NET (.NET 8) API publishes with auto-retry (max delivery 10 → dead-letter), channel subscriptions (sms/email/push) fan out to horizontally-scaled, idempotent workers, and a Notification DB tracks status/metrics/tenant. CorrelationId is propagated API→Bus→Workers→DB for end-to-end tracing.",
    descStory:
      "The plumbing that gets the right alert to the right person reliably, even when thousands fire at once. It retries what fails, never sends twice, and quietly sets aside anything that just won't deliver.",
    stack: [".NET 8", "Azure Service Bus", "ASP.NET Web API", "Angular"],
    hasArchitecture: true,
    story: {
      hook: "Thousands of messages a second. Not one is allowed to vanish.",
      incident: {
        frame: [
          "OUTBOUND   batch #4471",
          "channels   push · email · sms",
          "status     a worker just died mid-send",
        ],
        prompt: "A worker crashed halfway through a batch. Now what?",
        choices: [
          {
            label: "Resend the batch",
            naive: true,
            byte: "“Just fire them all again?”",
            result: [
              "Everyone who already got theirs gets it a second time.",
              "Trust in the system quietly erodes with every duplicate.",
            ],
          },
          {
            label: "Retry only what failed",
            byte: "“Every message already remembers its own state.”",
            result: [
              "✓ idempotent workers",
              "✓ automatic retry",
              "✓ dead-letter for the undeliverable",
              "not one duplicate goes out",
            ],
          },
        ],
        insight:
          "Reliable doesn't mean 'usually works', it means never twice, never dropped.",
      },
      scenes: [
        {
          title: "Request",
          caption: "A service asks for a notification to go out.",
        },
        {
          title: "Logged first",
          caption: "It's written down as 'pending' before a single message leaves.",
        },
        {
          title: "Sorted",
          caption: "A message bus routes it by channel, SMS, email, push.",
        },
        {
          title: "Delivered",
          caption:
            "Independent workers send it, retrying whatever fails and never sending twice.",
        },
        {
          title: "Accounted for",
          caption:
            "Every outcome is written back, sent, or set aside as undeliverable. Nothing is left unexplained.",
        },
      ],
      outcome: [
        { value: "10×", label: "retries, then dead-letter" },
        { value: "0", label: "duplicate sends" },
        { value: "1 id", label: "traced end to end" },
      ],
    },
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "split-payment",
    name: "Split Payment Settlement System",
    year: 2025,
    tag: "backend",
    descEngineer:
      "Payment-orchestration backend with ACID-compliant ledger entries and automatic rollback on PostgreSQL, cutting reconciliation errors ~70%. RESTful APIs carry end-to-end integration coverage across multi-party settlement flows.",
    descStory:
      "When one payment has to be split between several people, this makes sure every share lands correctly, and never half-lands. Money moves completely, or not at all.",
    stack: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "invoice-assistant",
    name: "Invoice Assistant, Agentic AI",
    year: 2025,
    tag: "ai-agent",
    descEngineer:
      "Agentic chatbot automating timesheet + invoice workflows: tool-based actions for retrieval, computation and automated email dispatch to finance, with user data persisted in PostgreSQL. Built on LangChain over the OpenAI API.",
    descStory:
      "A small assistant for the boring part of getting paid. It tracks hours, keeps invoices up to date, and emails finance for approval, so nobody has to chase paperwork.",
    stack: ["Python", "LangChain", "OpenAI API", "PostgreSQL"],
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "smart-traffic",
    name: "Smart Traffic Management System",
    year: 2024,
    tag: "computer-vision",
    descEngineer:
      "Real-time traffic control: YOLOv8 + SORT for vehicle detection and counting, dynamic signal timing with emergency-vehicle priority, and accident detection wired to Twilio SOS alerts with geocoded location.",
    descStory:
      "Traffic lights that actually watch the road, counting cars, clearing a path for ambulances, and calling for help the moment they detect a crash.",
    stack: ["Flask", "React", "YOLOv8", "SORT", "Twilio"],
    note: "Journal",
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "brand-detection",
    name: "Brand Detection & Analysis",
    year: 2024,
    tag: "computer-vision",
    descEngineer:
      "YOLOv8 trained on a custom dataset for brand detection, wired to real-time camera input to analyse customer–product interaction and surface sales trends for inventory decisions.",
    descStory:
      "A trained eye on the shelf: it sees which products people actually pick up, turning ordinary shelf-watching into a signal for what to stock next.",
    stack: ["React", "PyTorch", "FastAPI", "YOLOv8"],
    note: "Patent",
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "badminton-academy",
    name: "Badminton Coaching & Player Development",
    year: 2024,
    tag: "full-stack",
    descEngineer:
      "Full-stack academy platform, Spring Boot REST + Angular + MySQL, for 200+ active students: enrollment, scheduling and skill tracking, with Amazon S3 for media and document storage.",
    descStory:
      "Real software for a real badminton academy: 200+ students, their coaches, schedules and progress in one place, instead of scattered across notebooks and group chats.",
    stack: ["Java", "Spring Boot", "Angular", "MySQL", "Amazon S3"],
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "meeting-room",
    name: "Meeting Room Booking System",
    year: 2024,
    tag: "full-stack",
    descEngineer:
      "Full-stack room-booking app (.NET + Angular + MySQL): employees view availability, book rooms and manage schedules with real-time conflict resolution.",
    descStory:
      "No more double-booked meeting rooms. Everyone sees what's free, books in a click, and clashes get caught before they happen.",
    stack: ["C#", ".NET", "Angular", "MySQL"],
    links: { repo: "https://github.com/adhnanjeff" },
  },
  {
    id: "accident-zone",
    name: "Accident-Prone Zone Detection & Alert",
    year: 2024,
    tag: "mobile",
    descEngineer:
      "Android app querying large-scale GPS data (AWS DynamoDB) to flag accident-prone zones with proximity alerts within 250m at sub-100ms latency, plus nearest-hospital suggestions via real-time tracking.",
    descStory:
      "An early-warning app for the road: it knows which stretches are dangerous and warns you before you reach them, and points you to the nearest hospital if something goes wrong.",
    stack: ["Java", "Android Studio", "Google Maps API", "DynamoDB"],
    note: "Published, Springer",
    links: {
      repo: "https://github.com/adhnanjeff",
      paper: "https://link.springer.com/chapter/10.1007/978-3-032-02979-9_9",
    },
  },
];

/* --------------------------- skills ------------------------------- */
/* Proficiency drives the knowledge-graph colouring: `core` = the      */
/* stacks I reach for daily; `familiar` = comfortable, still growing.  */

export type Prof = "core" | "familiar";
export type SkillItem = { name: string; prof: Prof };
export type SkillCluster = { key: string; label: string; items: SkillItem[] };

export const skillClusters: SkillCluster[] = [
  {
    key: "languages",
    label: "Languages",
    items: [
      { name: "Java", prof: "core" },
      { name: "C#", prof: "core" },
      { name: "Python", prof: "core" },
      { name: "SQL", prof: "core" },
      { name: "JavaScript", prof: "familiar" },
    ],
  },
  {
    key: "backend",
    label: "Backend & APIs",
    items: [
      { name: "Spring Boot", prof: "core" },
      { name: ".NET / ASP.NET", prof: "core" },
      { name: "REST APIs", prof: "core" },
      { name: "Microservices", prof: "core" },
      { name: "Kafka", prof: "core" },
      { name: "Azure Service Bus", prof: "core" },
      { name: "GraphQL", prof: "familiar" },
    ],
  },
  {
    key: "frontend",
    label: "Frontend",
    items: [
      { name: "Angular", prof: "core" },
      { name: "React", prof: "familiar" },
      { name: "HTML/CSS", prof: "core" },
      { name: "Tailwind CSS", prof: "familiar" },
    ],
  },
  {
    key: "data",
    label: "Data",
    items: [
      { name: "PostgreSQL", prof: "core" },
      { name: "MySQL", prof: "core" },
      { name: "MongoDB", prof: "core" },
      { name: "DynamoDB", prof: "familiar" },
      { name: "Firebase", prof: "familiar" },
    ],
  },
  {
    key: "cloud",
    label: "Cloud & DevOps",
    items: [
      { name: "Docker", prof: "core" },
      { name: "Git / GitHub", prof: "core" },
      { name: "CI/CD", prof: "familiar" },
      { name: "AWS", prof: "familiar" },
      { name: "Postman", prof: "core" },
    ],
  },
  {
    key: "ai",
    label: "AI & Agentic",
    items: [
      { name: "LangChain", prof: "core" },
      { name: "OpenAI SDK", prof: "core" },
      { name: "Claude Code", prof: "core" },
      { name: "CrewAI", prof: "familiar" },
      { name: "n8n", prof: "familiar" },
      { name: "MCP", prof: "familiar" },
    ],
  },
  {
    key: "foundations",
    label: "CS Foundations",
    items: [
      { name: "DSA", prof: "core" },
      { name: "OOP", prof: "core" },
      { name: "System Design", prof: "core" },
      { name: "Distributed Systems", prof: "core" },
      { name: "Database Design", prof: "core" },
    ],
  },
];

/** Flat list view used by the terminal + Story skills section. */
export type SkillGroup = { label: string; items: string[] };
export const skills: SkillGroup[] = skillClusters.map((c) => ({
  label: c.label,
  items: c.items.map((i) => i.name),
}));

/* ------------------------- experience ----------------------------- */

export type Experience = {
  company: string;
  role: string;
  place: string;
  period: string;
  descEngineer: string;
  descStory: string;
};

export const experience: Experience[] = [
  {
    company: "eProductivity Software",
    role: "Associate Software Engineer",
    place: "Bangalore, Karnataka",
    period: "Jul 2026 - Present",
    descEngineer:
      "Converted from intern to full-time after a year on the team. Continuing enterprise API integrations linking Microsoft Dynamics 365 with CorrFusion and server-side business logic for cost-estimation workflows in CBS, now with more ownership over design decisions and code review.",
    descStory:
      "They kept me on. Same problems, the ledger that can't be wrong, the workflow that has to hold up under real use, just with more say in how they get solved.",
  },
  {
    company: "eProductivity Software",
    role: "Software Engineer Intern",
    place: "Bangalore, Karnataka",
    period: "Jul 2025 - Jun 2026",
    descEngineer:
      "Enterprise API integrations linking Microsoft Dynamics 365 with CorrFusion; server-side business logic for cost-estimation workflows in CBS; code reviews and first-principles design discussions on reliability, scalability and correctness of production workflows.",
    descStory:
      "Working on the enterprise software that businesses run on, the part where a wrong number isn't a bug, it's someone's money. Mostly learning how careful real production systems have to be.",
  },
  {
    company: "BlinkingSoft",
    role: "UI/UX, Frontend Developer Intern",
    place: "Coimbatore, Tamil Nadu",
    period: "Jun 2024 - Jul 2024",
    descEngineer:
      "Built a MERN-stack job portal with role-specific flows for seekers and employers; responsive React + Tailwind UI for a seamless cross-device experience.",
    descStory:
      "My first taste of shipping for real users, a job portal where the interface had to feel obvious to two very different kinds of people at once.",
  },
];

/* --------------- positions of responsibility ---------------------- */

export type ResponsibilityRole = { role: string; period: string };
export type Responsibility = { org: string; roles: ResponsibilityRole[] };

export const responsibilities: Responsibility[] = [
  {
    org: "Interact Club",
    roles: [
      { role: "Secretary", period: "2025 - 26" },
      { role: "Joint Secretary", period: "2024 - 25" },
      { role: "Executive Member", period: "2023 - 24" },
    ],
  },
  {
    org: "Grievances Cell, Dept. of IT",
    roles: [{ role: "Student Representative", period: "2024 - Present" }],
  },
];

/* --------------------- certs & achievements ----------------------- */

export type Cert = {
  name: string;
  issuer: string;
  detail?: string;
  group: "anthropic" | "other";
};

export const certifications: Cert[] = [
  { name: "Claude 101", issuer: "Anthropic", group: "anthropic" },
  { name: "Claude Code 101", issuer: "Anthropic", group: "anthropic" },
  { name: "Claude Code in Action", issuer: "Anthropic", group: "anthropic" },
  { name: "Introduction to Agent Skills", issuer: "Anthropic", group: "anthropic" },
  { name: "Introduction to Subagents", issuer: "Anthropic", group: "anthropic" },
  { name: "Introduction to Model Context Protocol", issuer: "Anthropic", group: "anthropic" },
  {
    name: "AI Engineer Agentic Track: The Complete Agent & MCP Course",
    issuer: "Udemy · Ed Donner, Ligency",
    detail: "17 hours",
    group: "other",
  },
  {
    name: "Salesforce Agentblazer",
    issuer: "Salesforce Trailhead",
    detail: "Mountaineer · 22,200+ pts",
    group: "other",
  },
  { name: "Agentic AI Frameworks Deep Dive", issuer: "AWS", group: "other" },
  {
    name: "Software Engineering Virtual Experience",
    issuer: "JPMorgan Chase & Co.",
    group: "other",
  },
  { name: "AWS Cloud Practitioner", issuer: "AWS", detail: "In progress", group: "other" },
];

export const achievements: string[] = [
  "Badminton, Tamil Nadu Sub-Junior State Champion",
  "Badminton, 2× Zonal Runner-up",
  "1st place & team lead, Ideathon 6.0, SREC",
  "290+ problems solved on LeetCode",
];

/** The line that gets a shine in Story Mode's highlights. */
export const marquee = "Tamil Nadu Sub-Junior State Champion";

/** Counted-up figures for Story Mode's "by the numbers" band. */
export const stats: { value: number; suffix?: string; separator?: string; label: string }[] = [
  { value: 290, suffix: "+", label: "LeetCode problems solved" },
  { value: 9, label: "projects shipped" },
  { value: 22200, suffix: "+", separator: ",", label: "Salesforce Trailhead points" },
];

export const education = {
  school: "Sri Ramakrishna Engineering College",
  degree: "B.Tech, Information Technology",
  place: "Coimbatore, Tamil Nadu",
  period: "2022 - 2026",
} as const;
