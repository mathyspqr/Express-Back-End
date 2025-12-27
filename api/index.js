const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const corsMiddleware = cors({
  origin: ["http://localhost:3000", "https://fullapp-js.mathys-portfolio.fr"],
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Récupère l'utilisateur depuis le token Supabase
function getSupabaseUserClient(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}



// Fallback JSON parser (utile en serverless si req.body vide)
function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);

    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      // ✅ Normalise /api prefix (Vercel)
      const rawUrl = req.url || "/";
      const path = rawUrl.startsWith("/api") ? rawUrl.slice(4) || "/" : rawUrl;

      // ✅ Preflight CORS
      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }

      // 🔎 Health check
      if (req.method === "GET" && path === "/health") {
        return res.status(200).json({ ok: true });
      }

      // ✅ GET /mathys => liste des messages
      if (req.method === "GET" && path === "/mathys") {
        const { data, error } = await supabaseAdmin
          .from("messages")
          .select("id, message, user_id, created_at")
          .order("created_at", { ascending: true });

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }

      // ✅ POST /insert-message { message }
 // ✅ POST /insert-message { message }
if (req.method === "POST" && path === "/insert-message") {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const supabaseUser = getSupabaseUserClient(req);
  if (!supabaseUser) return res.status(401).json({ error: "Token manquant" });

  const body = await readJsonBody(req);
  const { message } = body || {};
  if (!message) return res.status(400).json({ error: "message requis" });

  // ✅ IMPORTANT : insert avec le client user → auth.uid() fonctionne
  const { error } = await supabaseUser.from("messages").insert({
    message,
    user_id: user.id,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ message: "Message inséré avec succès." });
}


      // ✅ GET /messages/:id/commentaires
      if (req.method === "GET" && /^\/messages\/\d+\/commentaires$/.test(path)) {
        const messageId = Number(path.split("/")[2]);

        const { data, error } = await supabaseAdmin
          .from("comments")
          .select("id, message_id, commentaire, user_id, created_at")
          .eq("message_id", messageId)
          .order("created_at", { ascending: true });

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }

      // ✅ POST /messages/:id/commentaires { commentaire }
      if (req.method === "POST" && /^\/messages\/\d+\/commentaires$/.test(path)) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const messageId = Number(path.split("/")[2]);
        const body = await readJsonBody(req);
        const { commentaire } = body || {};
        if (!commentaire) return res.status(400).json({ error: "commentaire requis" });

        const { error } = await supabaseAdmin.from("comments").insert({
          message_id: messageId,
          commentaire,
          user_id: user.id,
        });

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ message: "Commentaire inséré avec succès." });
      }

      // ✅ GET /likes/:userId (optionnel)
      if (req.method === "GET" && path.startsWith("/likes/")) {
        const userId = path.split("/")[2];

        const { data, error } = await supabaseAdmin
          .from("likes")
          .select("user_id, message_id, created_at")
          .eq("user_id", userId);

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }

      // ✅ POST /like-message/:userId/:messageId  (on ignore userId et on prend celui du token)
      if (req.method === "POST" && path.startsWith("/like-message/")) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const messageId = Number(path.split("/")[3]);

        const { error } = await supabaseAdmin.from("likes").insert({
          user_id: user.id,
          message_id: messageId,
        });

        if (error) return res.status(400).json({ error: error.message });
        return res.status(201).json({ message: "Like ajouté avec succès." });
      }

      // ✅ POST /unlike-message/:userId/:messageId
      if (req.method === "POST" && path.startsWith("/unlike-message/")) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const messageId = Number(path.split("/")[3]);

        const { error } = await supabaseAdmin
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("message_id", messageId);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ message: "Like supprimé avec succès." });
      }

      // ✅ DELETE /delete-message/:id (supprime seulement ses messages)
      if (req.method === "DELETE" && path.startsWith("/delete-message/")) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const id = Number(path.split("/")[2]);

        const { error } = await supabaseAdmin
          .from("messages")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ message: "Message supprimé avec succès." });
      }

      return res.status(404).json({ error: "Route non trouvée.", path });
    } catch (e) {
      return res.status(500).json({ error: "Erreur serveur", details: String(e) });
    }
  });
};
