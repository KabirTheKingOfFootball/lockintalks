import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { buildFAQKnowledgeChunks } from "@/lib/faq/knowledge";

const essayPath = path.join(process.cwd(), "docs", "lockintalks-complete-platform-essay.md");

export function getFAQEssayKnowledge() {
  const essay = getFAQEssayText();

  return {
    essay,
    wordCount: countWords(essay),
    chunks: buildFAQKnowledgeChunks(essay)
  };
}

function getFAQEssayText() {
  if (!existsSync(essayPath)) return "";
  return readFileSync(essayPath, "utf8");
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
