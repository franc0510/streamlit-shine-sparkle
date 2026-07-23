import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const CSV_URL =
  "https://raw.githubusercontent.com/franc0510/streamlit-shine-sparkle/main/schedule_with_probs.csv";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    // simple split — the source CSV does not use quoted commas
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

export default defineTool({
  name: "list_upcoming_matches",
  title: "List upcoming LoL matches",
  description:
    "List upcoming League of Legends matches with PredictEsport win probabilities. Returns tournament, date, teams, and BO1 win probabilities for each side.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .default(10)
      .describe("Maximum number of matches to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ limit }) => {
    const capped = Math.min(Math.max(limit ?? 10, 1), 50);
    const res = await fetch(`${CSV_URL}?t=${Date.now()}`);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Failed to fetch schedule: ${res.status}` }],
        isError: true,
      };
    }
    const rows = parseCsv(await res.text()).slice(0, capped);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { matches: rows },
    };
  },
});
