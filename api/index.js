const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const corsMiddleware = cors({
  origin: ["http://localhost:3000", "https://chatflow.mathysdev.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"],
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserFromReq(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) return null;

  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user ?? null;
}

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
    .select(`
      *,
      profiles!user_id(username, color, avatar_url)
    `)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  const messagesWithUsername = data.map(msg => ({
    ...msg,
    username: msg.profiles?.username || 'Utilisateur',
    user_color: msg.profiles?.color || '#3B82F6',
    avatar_url: msg.profiles?.avatar_url || null,
    image_url: msg.image_url
  }));
  
  return res.json(messagesWithUsername);
}


      // ✅ POST /insert-message { message }
 // ✅ POST /insert-message { message }
if (req.method === "POST" && path === "/insert-message") {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const supabaseUser = getSupabaseUserClient(req);
  if (!supabaseUser) return res.status(401).json({ error: "Token manquant" });

  const body = await readJsonBody(req);
  const { message, image_url } = body || {};
  
  // Message ou image requis (au moins l'un des deux)
  if (!message && !image_url) {
    return res.status(400).json({ error: "message ou image_url requis" });
  }

  const { error } = await supabaseUser.from("messages").insert({
    message: message || "",
    user_id: user.id,
    image_url,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ message: "Message inséré avec succès." });
}


// ✅ GET /messages/:id/commentaires
if (req.method === "GET" && /^\/messages\/\d+\/commentaires$/.test(path)) {
  const messageId = Number(path.split("/")[2]);

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select(`
      *,
      profiles!user_id(username, color, avatar_url)
    `)
    .eq("message_id", messageId)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  const commentsWithUsername = data.map(comment => ({
    ...comment,
    username: comment.profiles?.username || 'Utilisateur',
    user_color: comment.profiles?.color || '#10B981',
    avatar_url: comment.profiles?.avatar_url || null
  }));
  
  return res.json(commentsWithUsername);
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

  // Vérifier d'abord si le message existe et appartient à l'utilisateur
  const { data: existingMessage } = await supabaseAdmin
    .from("messages")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existingMessage) {
    return res.status(404).send("Message introuvable");
  }

  if (existingMessage.user_id !== user.id) {
    return res.status(403).send("Vous n'êtes pas le propriétaire de ce message");
  }

  // Maintenant on peut supprimer
  const { error } = await supabaseAdmin
    .from("messages")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ message: "Message supprimé avec succès." });
}

// ✅ PUT /messages/:id { message }
if (req.method === "PUT" && /^\/messages\/\d+$/.test(path)) {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const id = Number(path.split("/")[2]);
  const body = await readJsonBody(req);
  const { message } = body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message requis" });
  }

  // Vérifier propriétaire
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("messages")
    .select("user_id")
    .eq("id", id)
    .single();

  if (checkError) return res.status(500).json({ error: checkError.message });
  if (!existing) return res.status(404).json({ error: "Message introuvable" });
  if (existing.user_id !== user.id) {
    return res.status(403).json({ error: "Vous n'êtes pas le propriétaire de ce message" });
  }

  // Mettre à jour le message et flag edited=true
  const { error } = await supabaseAdmin
    .from("messages")
    .update({ message: message.trim(), edited: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: "Message mis à jour" });
}

      return res.status(404).json({ error: "Route non trouvée.", path });
    } catch (e) {
      return res.status(500).json({ error: "Erreur serveur", details: String(e) });
    }
  });
};
