import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfileTool from "./tools/get-my-profile";
import listReviewsTool from "./tools/list-reviews";
import submitReviewTool from "./tools/submit-review";
import listUpcomingMatchesTool from "./tools/list-upcoming-matches";

const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "predictesport-mcp",
  title: "PredictEsport MCP",
  version: "0.1.0",
  instructions:
    "PredictEsport tools. Use `list_upcoming_matches` for upcoming League of Legends matches with ML win probabilities, `get_my_profile` to check the signed-in user's premium status, `list_reviews` to read approved public reviews, and `submit_review` to submit a new review pending moderation.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfileTool,
    listReviewsTool,
    submitReviewTool,
    listUpcomingMatchesTool,
  ],
});
