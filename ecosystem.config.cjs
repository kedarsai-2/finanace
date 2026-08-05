const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const backendEnv = parseEnvFile(path.join(__dirname, "backend/.env"));

if (!backendEnv.JHIPSTER_SECURITY_AUTHENTICATION_JWT_BASE64_SECRET) {
  console.warn(
    "[finance-backend] Missing JHIPSTER_SECURITY_AUTHENTICATION_JWT_BASE64_SECRET in backend/.env",
  );
}

module.exports = {
  apps: [
    {
      name: "finance-backend",
      script: "java",
      args:
        "-Xms512m -Xmx1536m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar target/backend-0.0.1-SNAPSHOT.jar",
      cwd: path.join(__dirname, "backend"),
      interpreter: "none",
      autorestart: true,
      max_restarts: 15,
      min_uptime: 15000,
      kill_timeout: 30000,
      listen_timeout: 30000,
      env: {
        JAVA_TOOL_OPTIONS: "-Dspring.jpa.show-sql=false",
        ...backendEnv,
      },
    },
  ],
};
