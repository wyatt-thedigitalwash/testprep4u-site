// SCORM 2004 Runtime API (API_1484_11) for the student dashboard.
// Implements the full CMI data model that Articulate Rise 360 uses.
// Supports resume via initial data, server-save callbacks on Commit/Terminate,
// and proper total_time accumulation across sessions.

export interface ScormData {
  [key: string]: string;
}

export interface ScormSessionSummary {
  completionStatus: string;
  successStatus: string;
  scoreRaw: string;
  scoreScaled: string;
  scoreMin: string;
  scoreMax: string;
  location: string;
  sessionTime: string;
  totalTime: string;
  suspendData: string;
  totalInteractions: number;
  allData: ScormData;
}

export interface ScormAPIOptions {
  /** Previously saved CMI data (from module_progress.cmi_data) for resume */
  initialData?: ScormData;
  /** Supabase user ID */
  learnerId?: string;
  /** Display name in "Last, First" format */
  learnerName?: string;
  /** Called on every Commit() — use for intermediate server saves */
  onCommit?: (summary: ScormSessionSummary) => void;
  /** Called on Terminate() — use for final server save */
  onTerminate?: (summary: ScormSessionSummary) => void;
}

// Default CMI data model values (SCORM 2004 3rd Edition)
const CMI_DEFAULTS: ScormData = {
  "cmi.completion_status": "unknown",
  "cmi.completion_threshold": "",
  "cmi.credit": "credit",
  "cmi.entry": "ab-initio",
  "cmi.exit": "",
  "cmi.launch_data": "",
  "cmi.learner_id": "",
  "cmi.learner_name": "",
  "cmi.location": "",
  "cmi.max_time_allowed": "",
  "cmi.mode": "normal",
  "cmi.progress_measure": "",
  "cmi.scaled_passing_score": "0.7",
  "cmi.score.raw": "",
  "cmi.score.min": "",
  "cmi.score.max": "",
  "cmi.score.scaled": "",
  "cmi.session_time": "",
  "cmi.success_status": "unknown",
  "cmi.suspend_data": "",
  "cmi.time_limit_action": "",
  "cmi.total_time": "PT0S",
  "cmi.interactions._count": "0",
  "cmi.objectives._count": "0",
};

// Read-only elements that SetValue should reject
const READ_ONLY = new Set([
  "cmi.completion_threshold",
  "cmi.credit",
  "cmi.entry",
  "cmi.launch_data",
  "cmi.learner_id",
  "cmi.learner_name",
  "cmi.max_time_allowed",
  "cmi.mode",
  "cmi.scaled_passing_score",
  "cmi.time_limit_action",
  "cmi.total_time",
  "cmi.interactions._count",
  "cmi.objectives._count",
]);

// Write-only elements that GetValue should reject
const WRITE_ONLY = new Set([
  "cmi.exit",
  "cmi.session_time",
]);

/** Parse ISO 8601 duration (PTxHxMxS) to total seconds */
function parseDuration(iso: string): number {
  if (!iso) return 0;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseFloat(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

/** Convert seconds to ISO 8601 duration (PTxHxMxS) */
function toDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round((totalSeconds % 60) * 100) / 100;
  let result = "PT";
  if (h > 0) result += `${h}H`;
  if (m > 0) result += `${m}M`;
  if (s > 0 || result === "PT") result += `${s}S`;
  return result;
}

export class ScormAPI {
  private data: ScormData;
  private initialized = false;
  private terminated = false;
  private lastError = "0";
  private interactionCount = 0;
  private previousTotalSeconds = 0;
  private onCommit?: (summary: ScormSessionSummary) => void;
  private onTerminate?: (summary: ScormSessionSummary) => void;

  constructor(options: ScormAPIOptions = {}) {
    const { initialData, learnerId, learnerName, onCommit, onTerminate } = options;

    this.onCommit = onCommit;
    this.onTerminate = onTerminate;

    // Start from defaults
    this.data = { ...CMI_DEFAULTS };

    // Apply saved CMI data for resume
    if (initialData && Object.keys(initialData).length > 0) {
      // Merge saved data on top of defaults
      for (const [key, value] of Object.entries(initialData)) {
        this.data[key] = value;
      }

      // Track previous total_time for accumulation on Terminate
      this.previousTotalSeconds = parseDuration(
        this.data["cmi.total_time"] || "PT0S"
      );

      // Set entry to "resume" if previous session was suspended
      if (this.data["cmi.exit"] === "suspend") {
        this.data["cmi.entry"] = "resume";
      } else if (
        this.data["cmi.completion_status"] !== "completed" &&
        this.data["cmi.completion_status"] !== "unknown"
      ) {
        // Content was started but not suspended — still resuming
        this.data["cmi.entry"] = "resume";
      }

      // Reset session_time for the new session
      this.data["cmi.session_time"] = "";
      // Reset exit for the new session
      this.data["cmi.exit"] = "";

      // Restore interaction count
      const countStr = this.data["cmi.interactions._count"] || "0";
      this.interactionCount = parseInt(countStr, 10) || 0;

      console.log(
        "%c[SCORM API] Resuming session — loaded saved CMI data",
        "color: #447FF0; font-weight: bold",
        `(entry: ${this.data["cmi.entry"]}, total_time: ${this.data["cmi.total_time"]})`
      );
    } else {
      console.log(
        "%c[SCORM API] New session — no saved data",
        "color: #447FF0; font-weight: bold"
      );
    }

    // Set real learner info
    if (learnerId) this.data["cmi.learner_id"] = learnerId;
    if (learnerName) this.data["cmi.learner_name"] = learnerName;
  }

  Initialize(_param: string): string {
    console.log(
      "%c[SCORM API] Initialize(\"\")",
      "color: #447FF0; font-weight: bold"
    );

    if (this.initialized) {
      this.lastError = "103"; // Already Initialized
      console.warn("[SCORM API] Already initialized");
      return "false";
    }

    this.initialized = true;
    this.terminated = false;
    this.lastError = "0";
    return "true";
  }

  Terminate(_param: string): string {
    console.log(
      "%c[SCORM API] Terminate(\"\")",
      "color: #447FF0; font-weight: bold"
    );

    if (!this.initialized) {
      this.lastError = "112"; // Termination Before Initialization
      return "false";
    }
    if (this.terminated) {
      this.lastError = "113"; // Termination After Termination
      return "false";
    }

    // Accumulate total_time = previous total + this session
    const sessionSeconds = parseDuration(
      this.data["cmi.session_time"] || "PT0S"
    );
    const newTotalSeconds = this.previousTotalSeconds + sessionSeconds;
    this.data["cmi.total_time"] = toDuration(newTotalSeconds);

    console.log(
      `%c[SCORM API] Total time updated: ${this.data["cmi.total_time"]} (session: ${this.data["cmi.session_time"]})`,
      "color: #10b981; font-weight: bold"
    );

    this.terminated = true;
    this.lastError = "0";

    // Fire terminate callback for server save
    if (this.onTerminate) {
      this.onTerminate(this.getSessionSummary());
    }

    return "true";
  }

  GetValue(element: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = this.terminated ? "123" : "122";
      return "";
    }

    // Check write-only
    if (WRITE_ONLY.has(element)) {
      this.lastError = "405"; // Data Model Element Is Write Only
      console.log(
        `%c[SCORM API] GetValue("${element}") → WRITE-ONLY`,
        "color: #ef4444"
      );
      return "";
    }

    const value = this.data[element] ?? "";
    this.lastError = "0";

    console.log(
      `%c[SCORM API] GetValue("${element}") → "${value.length > 100 ? value.slice(0, 100) + "…" : value}"`,
      "color: #10b981"
    );

    return value;
  }

  SetValue(element: string, value: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = this.terminated ? "133" : "132";
      return "false";
    }

    // Check read-only
    if (READ_ONLY.has(element)) {
      this.lastError = "404"; // Data Model Element Is Read Only
      console.log(
        `%c[SCORM API] SetValue("${element}", "${value}") → READ-ONLY`,
        "color: #ef4444"
      );
      return "false";
    }

    this.data[element] = value;
    this.lastError = "0";

    // Track interaction count
    if (element.match(/^cmi\.interactions\.\d+\./)) {
      const idx = parseInt(element.split(".")[2], 10);
      if (idx >= this.interactionCount) {
        this.interactionCount = idx + 1;
        this.data["cmi.interactions._count"] = String(this.interactionCount);
      }
    }

    // Track objective count
    if (element.match(/^cmi\.objectives\.\d+\./)) {
      const idx = parseInt(element.split(".")[2], 10);
      const currentCount = parseInt(this.data["cmi.objectives._count"] || "0", 10);
      if (idx >= currentCount) {
        this.data["cmi.objectives._count"] = String(idx + 1);
      }
    }

    // Color-coded logging — highlight important values
    const isKey = [
      "cmi.completion_status",
      "cmi.success_status",
      "cmi.score.raw",
      "cmi.score.scaled",
      "cmi.location",
      "cmi.exit",
      "cmi.session_time",
    ].includes(element);

    const isSuspendData = element === "cmi.suspend_data";

    if (isSuspendData) {
      console.log(
        `%c[SCORM API] SetValue("cmi.suspend_data", "[${value.length} chars]")`,
        "color: #8b5cf6"
      );
    } else {
      console.log(
        `%c[SCORM API] SetValue("${element}", "${value}")`,
        isKey
          ? "color: #f59e0b; font-weight: bold"
          : "color: #64748b"
      );
    }

    return "true";
  }

  Commit(_param: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = this.terminated ? "143" : "142";
      return "false";
    }

    console.log(
      "%c[SCORM API] Commit(\"\")",
      "color: #447FF0"
    );

    this.lastError = "0";

    // Fire commit callback for intermediate server save
    if (this.onCommit) {
      this.onCommit(this.getSessionSummary());
    }

    return "true";
  }

  GetLastError(): string {
    return this.lastError;
  }

  GetErrorString(errorCode: string): string {
    const errors: Record<string, string> = {
      "0": "No Error",
      "101": "General Exception",
      "102": "General Initialization Failure",
      "103": "Already Initialized",
      "104": "Content Instance Terminated",
      "111": "General Termination Failure",
      "112": "Termination Before Initialization",
      "113": "Termination After Termination",
      "122": "Retrieve Data Before Initialization",
      "123": "Retrieve Data After Termination",
      "132": "Store Data Before Initialization",
      "133": "Store Data After Termination",
      "142": "Commit Before Initialization",
      "143": "Commit After Termination",
      "201": "General Argument Error",
      "301": "General Get Failure",
      "351": "General Set Failure",
      "391": "General Commit Failure",
      "401": "Undefined Data Model Element",
      "402": "Unimplemented Data Model Element",
      "403": "Data Model Element Value Not Initialized",
      "404": "Data Model Element Is Read Only",
      "405": "Data Model Element Is Write Only",
      "406": "Data Model Element Type Mismatch",
      "407": "Data Model Element Value Out Of Range",
      "408": "Data Model Dependency Not Established",
    };
    return errors[errorCode] || "Unknown Error";
  }

  GetDiagnostic(_errorCode: string): string {
    return "";
  }

  /** Get a snapshot of the current session state for saving/display */
  getSessionSummary(): ScormSessionSummary {
    return {
      completionStatus: this.data["cmi.completion_status"] || "unknown",
      successStatus: this.data["cmi.success_status"] || "unknown",
      scoreRaw: this.data["cmi.score.raw"] || "",
      scoreScaled: this.data["cmi.score.scaled"] || "",
      scoreMin: this.data["cmi.score.min"] || "",
      scoreMax: this.data["cmi.score.max"] || "",
      location: this.data["cmi.location"] || "",
      sessionTime: this.data["cmi.session_time"] || "",
      totalTime: this.data["cmi.total_time"] || "PT0S",
      suspendData: this.data["cmi.suspend_data"] || "",
      totalInteractions: this.interactionCount,
      allData: { ...this.data },
    };
  }
}
