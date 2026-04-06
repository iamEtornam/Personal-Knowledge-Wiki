import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "..", "wiki-config.json");

export interface WikiConfig {
  ownerName: string;
  llmEnabled: boolean;
  llmModel: string;
  llmOllamaUrl: string;
}

const DEFAULT_CONFIG: WikiConfig = {
  ownerName: "",
  llmEnabled: false,
  llmModel: "llama3.2",
  llmOllamaUrl: "http://localhost:11434",
};

export function getWikiConfig(): WikiConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return { ...DEFAULT_CONFIG, ...raw };
    }
  } catch {
    // fall through
  }
  return DEFAULT_CONFIG;
}

export function saveWikiConfig(config: Partial<WikiConfig>): WikiConfig {
  const current = getWikiConfig();
  const merged = { ...current, ...config };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

export function getSiteName(): string {
  const { ownerName } = getWikiConfig();
  if (!ownerName) return "Personal Wiki";
  return `${ownerName}pedia`;
}

export function getOwnerInitial(): string {
  const { ownerName } = getWikiConfig();
  if (!ownerName) return "W";
  return ownerName.charAt(0).toUpperCase();
}
