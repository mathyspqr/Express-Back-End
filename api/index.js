const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const corsMiddleware = cors({
  origin: ["http://localhost:3000", "https://fullapp-js.mathys-portfolio.fr"],
  credentials: true,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Récupère l'utilisateur depuis le token Supabase
async function getUserFromReq(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

module.exports = async (req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      // 🔎 Health check
      if (req.method === "GET" && req.url === "/health") {
        return res.status(200).json({ ok: true });
      }

      // ✅ GET /mathys => liste des messages
      if (req.method === "GET" && req.url === "/mathys") {
        const { data, error } = await supabaseAdmin
          .from("messages")
          .select("id, message, user_id, created_at")
          .order("created_at", { ascending: true });

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }

      // ✅ POST /insert-message { message }
      if (req.method === "POST" && req.url === "/insert-message") {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const { message } = req.body || {};
        if (!message) return res.status(400).json({ error: "message requis" });

        const { error } = await supabaseAdmin.from("messages").insert({
          message,
          user_id: user.id,
        });

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ message: "Message inséré avec succès." });
      }

      // ✅ GET /messages/:id/commentaires
      if (req.method === "GET" && /^\/messages\/\d+\/commentaires$/.test(req.url)) {
        const messageId = Number(req.url.split("/")[2]);

        const { data, error } = await supabaseAdmin
          .from("comments")
          .select("id, message_id, commentaire, user_id, created_at")
          .eq("message_id", messageId)
          .order("created_at", { ascending: true });

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }

      // ✅ POST /messages/:id/commentaires { commentaire }
      if (req.method === "POST" && /^\/messages\/\d+\/commentaires$/.test(req.url)) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const messageId = Number(req.url.split("/")[2]);
        const { commentaire } = req.body || {};
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
      if (req.method === "GET" && req.url.startsWith("/likes/")) {
        const userId = req.url.split("/")[2];

        const { data, error } = await supabaseAdmin
          .from("likes")
          .select("user_id, message_id, created_at")
          .eq("user_id", userId);

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }

      // ✅ POST /like-message/:userId/:messageId  (on ignore userId et on prend celui du token)
      if (req.method === "POST" && req.url.startsWith("/like-message/")) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const messageId = Number(req.url.split("/")[3]);

        const { error } = await supabaseAdmin.from("likes").insert({
          user_id: user.id,
          message_id: messageId,
        });

        if (error) return res.status(400).json({ error: error.message });
        return res.status(201).json({ message: "Like ajouté avec succès." });
      }

      // ✅ POST /unlike-message/:userId/:messageId
      if (req.method === "POST" && req.url.startsWith("/unlike-message/")) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const messageId = Number(req.url.split("/")[3]);

        const { error } = await supabaseAdmin
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("message_id", messageId);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ message: "Like supprimé avec succès." });
      }

      // ✅ DELETE /delete-message/:id (supprime seulement ses messages)
      if (req.method === "DELETE" && req.url.startsWith("/delete-message/")) {
        const user = await getUserFromReq(req);
        if (!user) return res.status(401).json({ error: "Non authentifié" });

        const id = Number(req.url.split("/")[2]);

        const { error } = await supabaseAdmin
          .from("messages")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ message: "Message supprimé avec succès." });
      }

      return res.status(404).json({ error: "Route non trouvée." });
    } catch (e) {
      return res.status(500).json({ error: "Erreur serveur", details: String(e) });
    }
  });
};
