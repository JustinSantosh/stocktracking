const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnvFile() {
  const candidates = [".env.local", ".env"];

  for (const name of candidates) {
    const filePath = path.join(process.cwd(), name);

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const equalsIndex = line.indexOf("=");
      if (equalsIndex === -1) {
        continue;
      }

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }

    return name;
  }

  return null;
}

async function main() {
  const loadedFrom = loadEnvFile();

  if (!loadedFrom) {
    throw new Error("No .env.local or .env file found in the project root.");
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from your env file.");
  }

  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  const ping = await connection.connection.db.admin().ping();

  console.log(
    JSON.stringify(
      {
        ok: true,
        loadedFrom,
        host: connection.connection.host,
        database: connection.connection.name,
        readyState: connection.connection.readyState,
        ping,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("DB_TEST_ERROR");
  console.error(error && error.stack ? error.stack : error);

  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect failures after a failed connection attempt.
  }

  process.exit(1);
});
