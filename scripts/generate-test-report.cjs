const fs = require("fs");

const inputPath = "test-results.json";
const outputPath = "frontend-test-report.html";

const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const files = (report.testResults || []).map((file) => ({
  name: file.name,
  status: file.status,
  assertions: (file.assertionResults || []).map((a) => ({
    title: a.fullName || a.title,
    status: a.status,
    duration: a.duration || 0,
    failureMessages: a.failureMessages || [],
  })),
}));

const total = report.numTotalTests || 0;
const passed = report.numPassedTests || 0;
const failed = report.numFailedTests || 0;
const skipped = report.numPendingTests || 0;
const startedAt = report.startTime ? new Date(report.startTime).toLocaleString() : "";

const fileSections = files
  .map((f) => {
    const tests = f.assertions
      .map(
        (t) =>
          `<li><b>${String(t.status).toUpperCase()}</b> - ${t.title} (${t.duration}ms)${
            t.failureMessages.length ? `<pre>${t.failureMessages.join("\n")}</pre>` : ""
          }</li>`,
      )
      .join("");
    return `<h3>${f.name} - ${f.status}</h3><ul>${tests}</ul>`;
  })
  .join("");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Frontend Unit Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    .kpi { display: flex; gap: 16px; margin-bottom: 16px; }
    .card { padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; }
    pre { background: #f7f7f7; padding: 10px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Frontend Unit Test Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Run started: ${startedAt}</p>
  <div class="kpi">
    <div class="card">Total: ${total}</div>
    <div class="card">Passed: ${passed}</div>
    <div class="card">Failed: ${failed}</div>
    <div class="card">Skipped: ${skipped}</div>
  </div>
  <hr />
  ${fileSections}
</body>
</html>`;

fs.writeFileSync(outputPath, html);
console.log(`Wrote ${outputPath}`);
