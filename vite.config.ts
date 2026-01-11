import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Plugin to serve Documents folder from project root
const serveDocuments = () => ({
  name: "serve-documents",
  configureServer(server: any) {
    server.middlewares.use("/Documents", (req: any, res: any, next: any) => {
      const filePath = path.join(process.cwd(), "Documents", req.url || "");
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.setHeader("Content-Type", getContentType(filePath));
        fs.createReadStream(filePath).pipe(res);
      } else {
        next();
      }
    });
  },
});

const getContentType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".csv": "text/csv",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".json": "application/json",
  };
  return types[ext] || "application/octet-stream";
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    serveDocuments(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
