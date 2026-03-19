// SCORM 2004 Runtime API implementation for demo dashboard.
// Implements the API_1484_11 interface that SCORM content discovers on parent windows.
// Stores CMI data model values in memory with optional localStorage persistence.
// All API calls are logged to console for debugging.

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
  totalInteractions: number;
  allData: ScormData;
}

const STORAGE_KEY = "tp4u_scorm_cmi";

// Default CMI data model values (SCORM 2004)
const CMI_DEFAULTS: ScormData = {
  "cmi.completion_status": "unknown",
  "cmi.completion_threshold": "",
  "cmi.credit": "credit",
  "cmi.entry": "ab-initio",
  "cmi.exit": "",
  "cmi.launch_data": "",
  "cmi.learner_id": "demo-001",
  "cmi.learner_name": "Johnson, Alex",
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

export class ScormAPI {
  private data: ScormData;
  private initialized: boolean = false;
  private terminated: boolean = false;
  private lastError: string = "0";
  private interactionCount: number = 0;

  constructor() {
    // Try to restore from localStorage
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;

    if (stored) {
      try {
        this.data = { ...CMI_DEFAULTS, ...JSON.parse(stored) };
        // If resuming, update entry
        if (this.data["cmi.exit"] === "suspend") {
          this.data["cmi.entry"] = "resume";
        }
      } catch {
        this.data = { ...CMI_DEFAULTS };
      }
    } else {
      this.data = { ...CMI_DEFAULTS };
    }
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

    this.terminated = true;
    this.lastError = "0";

    // Persist to localStorage
    this.persist();

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
      `%c[SCORM API] GetValue("${element}") → "${value}"`,
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

    // Style important values differently
    const isKey = [
      "cmi.completion_status",
      "cmi.success_status",
      "cmi.score.raw",
      "cmi.score.scaled",
      "cmi.location",
    ].includes(element);

    console.log(
      `%c[SCORM API] SetValue("${element}", "${value}")`,
      isKey
        ? "color: #f59e0b; font-weight: bold"
        : "color: #64748b"
    );

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
    this.persist();
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

  // Get a summary of the session for display in the UI
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
      totalInteractions: this.interactionCount,
      allData: { ...this.data },
    };
  }

  // Reset all data (for testing)
  reset(): void {
    this.data = { ...CMI_DEFAULTS };
    this.initialized = false;
    this.terminated = false;
    this.lastError = "0";
    this.interactionCount = 0;
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }
}
