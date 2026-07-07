/* ------------------------------------------------------------------ */
/*  Typed, hand-authored system diagrams, accurate to the project      */
/*  architecture docs. Laid out on a clean lane grid and rendered with  */
/*  orthogonal (right-angle) edge routing, so flows read like a real    */
/*  engineering drawing instead of scattered lines.                     */
/*                                                                      */
/*  x/y are node CENTRES in each graph's own viewBox. `route`/`mid`     */
/*  fine-tune the elbow; `points` is a fully manual waypoint path.      */
/* ------------------------------------------------------------------ */

export type DiagGroup =
  | "source"
  | "security"
  | "transport"
  | "analysis"
  | "ml"
  | "decision"
  | "output"
  | "client"
  | "gateway"
  | "service"
  | "broker"
  | "store";

export type DiagNode = {
  id: string;
  label: string;
  sub?: string;
  group: DiagGroup;
  x: number;
  y: number;
  w?: number; // override width (topics etc. are smaller)
  h?: number;
  detail?: string;
};

export type DiagEdge = {
  from: string;
  to: string;
  kind?: "flow" | "normal";
  label?: string;
  /** force horizontal-first or vertical-first elbow */
  route?: "h" | "v";
  /** override the elbow coordinate (x for "h", y for "v") */
  mid?: number;
  /** fully manual waypoints (absolute, includes start + end) */
  points?: [number, number][];
};

export type SystemGraph = {
  id: string;
  title: string;
  caption: string;
  viewW: number;
  viewH: number;
  nodes: DiagNode[];
  edges: DiagEdge[];
  legend: DiagGroup[];
};

export const NODE_W = 176;
export const NODE_H = 60;

export const GROUP_LABEL: Record<DiagGroup, string> = {
  source: "Vehicle",
  security: "Security",
  transport: "Streaming",
  analysis: "Analysis",
  ml: "ML",
  decision: "Decision",
  output: "Output",
  client: "Clients",
  gateway: "Edge",
  service: "Services",
  broker: "Streaming",
  store: "Data",
};

/* --------------------------- overview ----------------------------- */
const overview: SystemGraph = {
  id: "overview",
  title: "overview",
  caption:
    "A representative slice of the stack, how the services, streaming and stores fit together.",
  viewW: 980,
  viewH: 560,
  legend: ["client", "gateway", "service", "broker", "store"],
  nodes: [
    { id: "web", label: "React Web", sub: "client", group: "client", x: 100, y: 175, detail: "Dashboards & operator UIs." },
    { id: "android", label: "Android App", sub: "client", group: "client", x: 100, y: 385, detail: "On-the-ground clients emitting events." },
    { id: "gateway", label: "API Gateway", sub: "routing · auth", group: "gateway", x: 320, y: 280, detail: "Single entry point: auth, rate-limiting, routing." },
    { id: "springboot", label: "Spring Boot", sub: "settlement", group: "service", x: 540, y: 120, detail: "ACID ledger + settlement logic." },
    { id: "dotnet", label: ".NET 8", sub: "notifications", group: "service", x: 540, y: 280, detail: "Publishes alerts to the bus; tracks delivery." },
    { id: "flask", label: "Flask ETL", sub: "CAN ingest", group: "service", x: 540, y: 440, detail: "Verifies CAN msgs, runs anomaly detection." },
    { id: "kafka", label: "Apache Kafka", sub: "topics", group: "broker", x: 760, y: 280, detail: "Decouples producers from consumers." },
    { id: "postgres", label: "PostgreSQL", sub: "ledger", group: "store", x: 760, y: 120, detail: "ACID source of truth for money." },
    { id: "mongo", label: "MongoDB", sub: "telemetry", group: "store", x: 760, y: 460, detail: "High-write telemetry sink." },
  ],
  edges: [
    { from: "web", to: "gateway", kind: "normal" },
    { from: "android", to: "gateway", kind: "normal" },
    { from: "gateway", to: "springboot", kind: "flow" },
    { from: "gateway", to: "dotnet", kind: "flow" },
    { from: "gateway", to: "flask", kind: "flow" },
    { from: "springboot", to: "postgres", kind: "normal", label: "ledger" },
    { from: "springboot", to: "kafka", kind: "flow", label: "settlement.events", route: "v" },
    { from: "dotnet", to: "kafka", kind: "flow", label: "alerts" },
    { from: "flask", to: "kafka", kind: "flow", label: "can.telemetry", route: "v" },
    { from: "kafka", to: "mongo", kind: "flow", label: "sink" },
  ],
};

/* ------------- vehicle security (SDV CAN), accurate --------------- */
/* Lanes: 150 · 410 · 660 · 1000 · 1290, plus bottom decision chain.   */
const vehicleSecurity: SystemGraph = {
  id: "vehicle-security",
  title: "vehicle-security",
  caption:
    "Secure SDV CAN-bus intrusion detection & digital twin, the full 12-phase flow. Drag to pan, scroll to zoom, hover a node.",
  viewW: 1560,
  viewH: 930,
  legend: ["source", "security", "transport", "analysis", "ml", "decision", "output"],
  nodes: [
    // Phase 1–2
    { id: "ivn", label: "IVN / ECU", sub: "steering·brake·speed", group: "source", x: 150, y: 110, detail: "Phase 1: the in-vehicle network generates CAN signals; the ECU converts them into CAN frames." },
    { id: "mac", label: "MAC Generation", sub: "HMAC-SHA256 · shared key", group: "security", x: 150, y: 290, detail: "Phase 2: every frame is signed, the message becomes CAN Frame + HMAC signature." },
    // Phase 3: dual publishing
    { id: "canbus", label: "In-Vehicle CAN Bus", sub: "signed frames", group: "transport", x: 410, y: 110, detail: "Phase 3A: the signed frame is transmitted over the in-vehicle CAN bus." },
    { id: "kafka", label: "Kafka SDV Layer", sub: "TLS-secured", group: "transport", x: 410, y: 290, detail: "Phase 3B: the same signed message is published to the Kafka SDV messaging layer over TLS." },
    // Kafka topics (compact column)
    { id: "t_tel", label: "vehicle.telemetry", sub: "private", group: "transport", x: 660, y: 90, w: 140, h: 44, detail: "Private telemetry topic." },
    { id: "t_sec", label: "vehicle.security", sub: "private", group: "transport", x: 660, y: 160, w: 140, h: 44, detail: "Private security topic." },
    { id: "t_alert", label: "alerts.system", sub: "public", group: "transport", x: 660, y: 230, w: 140, h: 44, detail: "Public alert topic, critical events broadcast here (Phase 10)." },
    { id: "t_v2v", label: "v2v.alerts", sub: "public", group: "transport", x: 660, y: 300, w: 140, h: 44, detail: "Public V2V alert topic, signed V2V alerts land here (Phase 9)." },
    // Verification
    { id: "verifier", label: "Listener & Verifier", sub: "validates HMAC", group: "security", x: 660, y: 470, detail: "Receives frames from both paths, validates the HMAC signature, rejects tampered frames, forwards authenticated ones." },
    // Phase 4: five validators
    { id: "feat", label: "Feature Extractor", sub: "frequency·delta·jitter", group: "analysis", x: 1000, y: 90, detail: "Phase 4: extracts frequency, delta and jitter features." },
    { id: "behav", label: "Behavioral Analyzer", sub: "control energy", group: "analysis", x: 1000, y: 210, detail: "Detects abnormal control energy." },
    { id: "ctx", label: "Contextual Validator", sub: "signal correlations", group: "analysis", x: 1000, y: 330, detail: "Validates signal correlations." },
    { id: "phys", label: "Physics Validator", sub: "safety limits", group: "analysis", x: 1000, y: 450, detail: "Enforces physical safety limits." },
    { id: "temp", label: "Temporal Extractor", sub: "rate-of-change", group: "analysis", x: 1000, y: 570, detail: "Detects rate-of-change violations." },
    // Phase 5: ML
    { id: "baseline", label: "Baseline Learning", sub: "first-N samples", group: "ml", x: 1290, y: 110, detail: "Phase 5: online baseline learning of normal behaviour from the first N samples." },
    { id: "infer", label: "Anomaly Inference", sub: "vs. baseline", group: "ml", x: 1290, y: 330, detail: "Real-time anomaly inference against the learned baseline." },
    { id: "norm", label: "Score Normalization", sub: "range [0,1]", group: "ml", x: 1290, y: 550, detail: "Normalizes anomaly scores into [0,1]." },
    // Phase 6–8 (bottom chain, right → left)
    { id: "trust", label: "Trust Score", sub: "high·med·low·critical", group: "decision", x: 1290, y: 730, detail: "Phase 6: High >0.8 · Medium 0.6–0.8 · Low 0.4–0.6 · Critical <0.4." },
    { id: "policy", label: "Policy / IPS Engine", sub: "allow·warn·restrict·block", group: "decision", x: 1000, y: 730, detail: "Phase 7: >0.8 allow · 0.6–0.8 warn · 0.4–0.6 restrict · <0.4 block." },
    { id: "mediation", label: "State Mediation", sub: "safe constrained control", group: "decision", x: 710, y: 730, detail: "Phase 8: applies safety-constrained control outputs to the vehicle." },
    { id: "v2v", label: "V2V Alert", sub: "signed → v2v.alerts", group: "output", x: 420, y: 730, detail: "Phase 9–10: on trust <0.4 + confirmed attack, a signed V2V alert is published to v2v.alerts; critical events broadcast via alerts.system." },
    // Phase 11–12
    { id: "storage", label: "Storage & Analytics", sub: "MongoDB·SQLite·local", group: "output", x: 1000, y: 860, detail: "Phase 11: stores trust scores, security logs, telemetry, alerts & analytics." },
    { id: "rest", label: "REST Analytics API", sub: "exposes analytics", group: "output", x: 710, y: 860, detail: "Phase 11: REST APIs expose the analytics." },
    { id: "twin", label: "Digital Twin", sub: "React · OAuth 2.0", group: "output", x: 420, y: 860, detail: "Phase 12: React dashboard (OAuth 2.0) visualizes live telemetry, vehicle state, trust score, alerts & security events." },
  ],
  edges: [
    { from: "ivn", to: "mac", kind: "flow", label: "CAN frames" },
    { from: "mac", to: "canbus", kind: "flow", label: "signed frame" },
    { from: "mac", to: "kafka", kind: "flow", label: "TLS publish" },
    // kafka → topic fan (shared trunk)
    { from: "kafka", to: "t_tel", kind: "normal", route: "h", mid: 544 },
    { from: "kafka", to: "t_sec", kind: "normal", route: "h", mid: 544 },
    { from: "kafka", to: "t_alert", kind: "normal", route: "h", mid: 544 },
    { from: "kafka", to: "t_v2v", kind: "normal", route: "h", mid: 544 },
    // dual paths into the verifier
    { from: "canbus", to: "verifier", kind: "flow", label: "frames", route: "h", mid: 520 },
    { from: "kafka", to: "verifier", kind: "flow", label: "consume", route: "h", mid: 535 },
    // verifier → validator fan (shared trunk)
    { from: "verifier", to: "feat", kind: "flow", label: "verified", route: "h", mid: 830 },
    { from: "verifier", to: "behav", kind: "normal", route: "h", mid: 830 },
    { from: "verifier", to: "ctx", kind: "normal", route: "h", mid: 830 },
    { from: "verifier", to: "phys", kind: "normal", route: "h", mid: 830 },
    { from: "verifier", to: "temp", kind: "normal", route: "h", mid: 830 },
    // validators → inference (shared trunk)
    { from: "feat", to: "infer", kind: "normal", route: "h", mid: 1145 },
    { from: "behav", to: "infer", kind: "normal", route: "h", mid: 1145 },
    { from: "ctx", to: "infer", kind: "normal", route: "h", mid: 1145 },
    { from: "phys", to: "infer", kind: "normal", route: "h", mid: 1145 },
    { from: "temp", to: "infer", kind: "normal", route: "h", mid: 1145 },
    { from: "baseline", to: "infer", kind: "normal", label: "learn" },
    { from: "infer", to: "norm", kind: "flow" },
    { from: "norm", to: "trust", kind: "flow", label: "[0,1]" },
    { from: "trust", to: "policy", kind: "flow" },
    { from: "policy", to: "mediation", kind: "flow", label: "action" },
    { from: "mediation", to: "v2v", kind: "flow", label: "trust<0.4 + IPS" },
    { from: "trust", to: "storage", kind: "normal", label: "scores·logs", route: "h", mid: 1145 },
    { from: "storage", to: "rest", kind: "flow", label: "REST" },
    { from: "rest", to: "twin", kind: "flow", label: "OAuth 2.0" },
  ],
};

/* --------- distributed notification management, accurate ---------- */
/* Lanes: 120 · 360 · 600 · 840 · 1080, results row at y=480.          */
const notification: SystemGraph = {
  id: "notification-system",
  title: "notification-system",
  caption:
    "Distributed notification management, Client → API → Service Bus → subscriptions → workers → DB → admin → dashboard. CorrelationId is traced end-to-end.",
  viewW: 1400,
  viewH: 660,
  legend: ["client", "service", "broker", "store"],
  nodes: [
    { id: "client", label: "Client", sub: "HTTP POST/PUT", group: "client", x: 120, y: 200, detail: "Step 1: a client sends an HTTP POST/PUT to the notification API." },
    { id: "api", label: ".NET Notification API", sub: "validate · metadata", group: "service", x: 360, y: 200, detail: "Step 2: validates the request, creates metadata, stores status = Pending, then publishes to the bus." },
    { id: "bus", label: "Azure Service Bus", sub: "filter · retry ≤10", group: "broker", x: 600, y: 200, detail: "Step 3: filters by channel and routes to subscriptions; automatic retries with MaxDeliveryCount = 10." },
    { id: "sms_sub", label: "sms-sub", sub: "subscription", group: "broker", x: 840, y: 80, w: 150, h: 48, detail: "SMS channel subscription." },
    { id: "email_sub", label: "email-sub", sub: "subscription", group: "broker", x: 840, y: 200, w: 150, h: 48, detail: "Email channel subscription." },
    { id: "push_sub", label: "push-sub", sub: "subscription", group: "broker", x: 840, y: 320, w: 150, h: 48, detail: "Push channel subscription." },
    { id: "sms_w", label: "SMS Workers", sub: "sms_worker_1…n", group: "service", x: 1080, y: 80, detail: "Steps 4–5: an independent, horizontally-scaled pool; idempotent processing." },
    { id: "email_w", label: "Email Workers", sub: "email_worker_1…n", group: "service", x: 1080, y: 200, detail: "Steps 4–5: an independent, horizontally-scaled pool; idempotent processing." },
    { id: "push_w", label: "Push Workers", sub: "push_worker_1…n", group: "service", x: 1080, y: 320, detail: "Steps 4–5: an independent, horizontally-scaled pool; idempotent processing." },
    { id: "dlq", label: "Dead Letter Queue", sub: "> 10 deliveries", group: "store", x: 600, y: 360, detail: "Messages exceeding the retry limit move to the DLQ." },
    { id: "db", label: "Notification DB", sub: "status·metrics·tracing·tenant", group: "store", x: 1080, y: 480, detail: "Step 6: workers write Sent/Failed with metrics, tracing and tenant info; the API wrote Pending on create." },
    { id: "admin", label: "Admin / Analytics API", sub: "read · replay · metrics", group: "service", x: 820, y: 480, detail: "Step 7: read, replay and metrics APIs over the store." },
    { id: "ui", label: "Angular Dashboard", sub: "pending·sent·failed", group: "client", x: 560, y: 480, detail: "Step 8: the dashboard shows pending/sent/failed, metrics and replay info." },
  ],
  edges: [
    { from: "client", to: "api", kind: "flow", label: "POST/PUT" },
    { from: "api", to: "bus", kind: "flow", label: "publish" },
    // bus → subscription fan (shared trunk)
    { from: "bus", to: "sms_sub", kind: "flow", route: "h", mid: 725 },
    { from: "bus", to: "email_sub", kind: "flow", label: "filter by channel" },
    { from: "bus", to: "push_sub", kind: "flow", route: "h", mid: 725 },
    { from: "bus", to: "dlq", kind: "normal", label: "10 fails" },
    { from: "sms_sub", to: "sms_w", kind: "flow" },
    { from: "email_sub", to: "email_w", kind: "flow" },
    { from: "push_sub", to: "push_w", kind: "flow" },
    // workers → DB (shared right-side trunk)
    { from: "sms_w", to: "db", kind: "flow", points: [[1168, 80], [1230, 80], [1230, 480], [1168, 480]] },
    { from: "email_w", to: "db", kind: "flow", label: "sent / failed", points: [[1168, 200], [1230, 200], [1230, 480], [1168, 480]] },
    { from: "push_w", to: "db", kind: "flow", points: [[1168, 320], [1230, 320], [1230, 480], [1168, 480]] },
    // API writes Pending (routed under everything)
    { from: "api", to: "db", kind: "normal", label: "status: pending", points: [[360, 230], [360, 580], [1080, 580], [1080, 510]] },
    { from: "db", to: "admin", kind: "flow", label: "read·replay" },
    { from: "admin", to: "ui", kind: "flow", label: "metrics" },
  ],
};

export const systems: Record<string, SystemGraph> = {
  overview,
  "vehicle-security": vehicleSecurity,
  "notification-system": notification,
};

/** Resolve loose user input (aliases) to a system id. */
export function resolveSystemId(raw?: string): string | null {
  if (!raw) return "overview";
  const q = raw.toLowerCase().trim();
  if (systems[q]) return q;
  if (["vehicle", "can", "car", "security", "sdv"].some((a) => q.includes(a)))
    return "vehicle-security";
  if (["notif", "notification", "bus", "azure"].some((a) => q.includes(a)))
    return "notification-system";
  if (["overview", "stack", "all"].some((a) => q.includes(a))) return "overview";
  return null;
}
