(function() {
  const extensionName = "obsidian";

  const extensionRoot = new Extension({
    name: extensionName,
    version: "1.0.0",
    endpoints: ["http://localhost:27124"],
    requiredAPIKeys: [],
    author: "unstrike",
    category: "Productivity",
    dataScope: "line",
    dependencies: [],
    isService: false
  });

  extensionRoot.register_preference(new Preference({
    key: "tasknotes_port",
    label: "TaskNotes API Port",
    type: "int",
    defaultValue: "27124",
    options: null,
    helpText: "Port for TaskNotes HTTP API. Enable in Obsidian → TaskNotes → Integrations → HTTP API. Leave the API auth token blank for local use."
  }));

  // ─── Helpers ────────────────────────────────────────────────

  function baseURL(payload) {
    const port = (payload.userSettings && payload.userSettings.tasknotes_port) || "27124";
    return "http://localhost:" + port;
  }

  function tnCall(base, path, method, body) {
    const bodyStr = body ? JSON.stringify(body) : "";
    const ct = body ? "application/json" : "";
    return callAPI("", base + path, method, bodyStr, ct);
  }

  function parseResponse(result) {
    if (!result.success) return { ok: false, error: result.error || "Network error — is TaskNotes HTTP API enabled?" };
    let data;
    try { data = JSON.parse(result.data); } catch(e) { return { ok: false, error: "Invalid JSON response" }; }
    if (!data.success) return { ok: false, error: data.error || "API error" };
    return { ok: true, data: data.data };
  }

  // ─── obs_task ────────────────────────────────────────────────

  const obs_task = new Command({
    name: "obs_task",
    parameters: [
      new Parameter({type: "string", name: "title", helpText: "Task title", default: ""}),
      new Parameter({type: "string", name: "priority", helpText: "Priority: low | normal | high | urgent", default: "normal", required: false}),
      new Parameter({type: "string", name: "due", helpText: "Due date (YYYY-MM-DD)", default: "", required: false})
    ],
    type: "insert",
    helpText: "Create a task in Obsidian TaskNotes.",
    tutorials: [
      new TutorialCommand({command: "obs_task(Review pentest findings)", description: "Create a normal-priority task"}),
      new TutorialCommand({command: "obs_task(Submit BBP report, high, 2026-03-25)", description: "High-priority task with due date"})
    ],
    extension: extensionRoot
  });

  obs_task.execute = function(payload) {
    const [title, priority, due] = this.getParsedParams(payload);
    if (!title) return new ReturnObject({status: "error", message: "Title required."});

    const body = { title, priority: priority || "normal" };
    if (due) body.due = due;

    const r = parseResponse(tnCall(baseURL(payload), "/api/tasks", "POST", body));
    if (!r.ok) return new ReturnObject({status: "error", message: r.error});

    return new ReturnObject({
      status: "success",
      message: "Task created.",
      payload: "→ Task: " + r.data.title
    });
  };

  // ─── obs_nlp ─────────────────────────────────────────────────

  const obs_nlp = new Command({
    name: "obs_nlp",
    parameters: [
      new Parameter({type: "string", name: "text", helpText: "Natural language task description", default: ""})
    ],
    type: "insert",
    helpText: "Create a task from natural language — date, priority, and context parsed automatically.",
    tutorials: [
      new TutorialCommand({command: "obs_nlp(review pentest report tomorrow high priority)", description: "NLP task with relative date and priority"}),
      new TutorialCommand({command: "obs_nlp(submit BBP finding for ACME next Monday urgent)", description: "Urgent task with relative date"})
    ],
    extension: extensionRoot
  });

  obs_nlp.execute = function(payload) {
    const [text] = this.getParsedParams(payload);
    if (!text) return new ReturnObject({status: "error", message: "Text required."});

    const r = parseResponse(tnCall(baseURL(payload), "/api/nlp/create", "POST", { text }));
    if (!r.ok) return new ReturnObject({status: "error", message: r.error});

    const t = r.data;
    const parts = ["→ Task: " + t.title];
    if (t.priority && t.priority !== "normal") parts.push(t.priority.toUpperCase());
    if (t.due) parts.push("due " + t.due);

    return new ReturnObject({status: "success", message: "Task created.", payload: parts.join(" · ")});
  };

  // ─── obs_tasks ───────────────────────────────────────────────

  const obs_tasks = new Command({
    name: "obs_tasks",
    parameters: [
      new Parameter({type: "string", name: "status", helpText: "Status filter: open | in-progress | done | all", default: "open", required: false})
    ],
    type: "insert",
    helpText: "List tasks from Obsidian TaskNotes, sorted by due date.",
    tutorials: [
      new TutorialCommand({command: "obs_tasks()", description: "List all open tasks"}),
      new TutorialCommand({command: "obs_tasks(in-progress)", description: "List in-progress tasks"}),
      new TutorialCommand({command: "obs_tasks(all)", description: "List all tasks regardless of status"})
    ],
    extension: extensionRoot
  });

  obs_tasks.execute = function(payload) {
    const [status] = this.getParsedParams(payload);
    const filter = (status && status !== "all") ? status : null;

    const query = {
      type: "group",
      id: "root",
      conjunction: "and",
      children: filter
        ? [{ type: "condition", id: "c1", property: "status", operator: "is", value: filter }]
        : [],
      sortKey: "due",
      sortDirection: "asc"
    };

    const r = parseResponse(tnCall(baseURL(payload), "/api/tasks/query", "POST", query));
    if (!r.ok) return new ReturnObject({status: "error", message: r.error});

    const tasks = r.data.tasks || [];
    if (tasks.length === 0) {
      return new ReturnObject({
        status: "success",
        message: "No tasks.",
        payload: "No " + (filter || "open") + " tasks."
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const lines = tasks.map(function(t) {
      const done = (t.status === "done" || t.status === "cancelled");
      const box  = done ? "[x]" : "[ ]";
      const pri  = (t.priority && t.priority !== "normal") ? " [" + t.priority.toUpperCase() + "]" : "";
      const due  = t.due
        ? (t.due < today && !done ? " ⚠ " + t.due : " · " + t.due)
        : "";
      return "- " + box + " " + t.title + pri + due;
    });

    return new ReturnObject({
      status: "success",
      message: tasks.length + " tasks.",
      payload: lines.join("\n")
    });
  };

  // ─── obs_done ────────────────────────────────────────────────

  const obs_done = new Command({
    name: "obs_done",
    parameters: [],
    type: "replaceLine",
    helpText: "Mark the task on the current line as done in Obsidian TaskNotes.",
    tutorials: [
      new TutorialCommand({command: "obs_done()", description: "Toggle task on current line (place cursor on a - [ ] line from obs_tasks)"})
    ],
    extension: extensionRoot
  });

  obs_done.execute = function(payload) {
    const line = (payload.fullText || "").trim();
    // Strip checkbox syntax: "- [ ] Title [HIGH] · 2026-03-20" → "Title"
    const match = line.match(/^-\s+\[.?\]\s+(.+?)(?:\s+\[[A-Z]+\])?(?:\s+[·⚠].+)?$/);
    if (!match) return new ReturnObject({status: "error", message: "Line doesn't look like a task checkbox."});
    const title = match[1].trim();

    // Find task by title
    const query = {
      type: "group", id: "root", conjunction: "and",
      children: [{ type: "condition", id: "c1", property: "title", operator: "is", value: title }]
    };
    const found = parseResponse(tnCall(baseURL(payload), "/api/tasks/query", "POST", query));
    if (!found.ok) return new ReturnObject({status: "error", message: found.error});

    const tasks = found.data.tasks || [];
    if (tasks.length === 0) return new ReturnObject({status: "error", message: "Task not found: " + title});

    const taskId = encodeURIComponent(tasks[0].id || tasks[0].path);
    const toggled = parseResponse(tnCall(baseURL(payload), "/api/tasks/" + taskId + "/toggle-status", "POST", {}));
    if (!toggled.ok) return new ReturnObject({status: "error", message: toggled.error});

    const newStatus = toggled.data.status;
    const newBox = (newStatus === "done" || newStatus === "cancelled") ? "[x]" : "[ ]";
    // Rewrite the line with updated checkbox
    const newLine = line.replace(/^(-\s+\[).?(])/, "$1" + (newBox === "[x]" ? "x" : " ") + "$2");
    return new ReturnObject({status: "success", message: "Status → " + newStatus, payload: newLine});
  };

  // ─── obs_stats ───────────────────────────────────────────────

  const obs_stats = new Command({
    name: "obs_stats",
    parameters: [],
    type: "insert",
    helpText: "Show TaskNotes task statistics.",
    tutorials: [
      new TutorialCommand({command: "obs_stats()", description: "Show task counts"})
    ],
    extension: extensionRoot
  });

  obs_stats.execute = function(payload) {
    const r = parseResponse(tnCall(baseURL(payload), "/api/stats", "GET", null));
    if (!r.ok) return new ReturnObject({status: "error", message: r.error});

    const s = r.data;
    const lines = [
      "Active: " + (s.active || 0) + "  Overdue: " + (s.overdue || 0),
      "Total: " + (s.total || 0) + "  Done: " + (s.completed || 0) + "  Archived: " + (s.archived || 0)
    ];
    return new ReturnObject({status: "success", message: "Stats fetched.", payload: lines.join("\n")});
  };

})();
