import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "submit_review",
  title: "Submit a review",
  description:
    "Submit a new PredictEsport review as the signed-in user. The review is created unapproved and must be approved by an admin before appearing publicly.",
  inputSchema: {
    author_name: z.string().trim().min(2).max(100).describe("Display name shown with the review."),
    rating: z.number().int().min(1).max(5).describe("Star rating from 1 to 5."),
    content: z.string().trim().min(5).max(2000).describe("Review text."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  handler: async ({ author_name, rating, content }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("reviews")
      .insert({
        user_id: ctx.getUserId(),
        author_name,
        rating,
        content,
        is_approved: false,
      })
      .select()
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [
        {
          type: "text",
          text: "Review submitted and pending approval.",
        },
      ],
      structuredContent: { review: data },
    };
  },
});
