const mysql = require('mysql');
const cors = require('cors');
const session = require('express-session');

const dbConfig = {
  host: '5.tcp.eu.ngrok.io',
  port: '19144',
  user: 'mathys',
  password: 'TiTi60340..',
  database: 'mathys',
};

// Créer une connexion à la base de données
const connection = mysql.createConnection(dbConfig);

// Tester la connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connecté à la base de données avec l\'ID', connection.threadId);
});

// Middleware pour gérer CORS
const corsMiddleware = cors({
  origin: 'http://localhost:3000', // Remplacez par l'URL de votre frontend
  credentials: true,
});

// Configurer les sessions
const sessionMiddleware = session({
  secret: 'mySuperSecretKey12345!@#$', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
});

// Handler de la fonction serverless
module.exports = async (req, res) => {
  corsMiddleware(req, res, () => {
    sessionMiddleware(req, res, () => {
      if (req.method === 'GET') {
        if (req.url === '/mathys') {
          connection.query('SELECT * FROM message_serveur', (err, results) => {
            if (err) {
              console.error('Erreur SQL lors de la récupération des données :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
            }
            res.json(results);
          });
        } else if (req.url.startsWith('/messages/') && req.url.endsWith('/commentaires')) {
          const messageId = req.url.split('/')[2];
          connection.query('SELECT * FROM commentaire WHERE message_id = ?', [messageId], (err, results) => {
            if (err) {
              console.error('Erreur SQL lors de la récupération des commentaires :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de la récupération des commentaires.' });
            }
            res.json(results);
          });
        } else if (req.url === '/session') {
          if (req.session.user) {
            res.send(`Utilisateur connecté : ${req.session.user.username}`);
          } else {
            res.status(401).json({ error: 'Aucun utilisateur connecté' });
          }
        } else {
          res.status(404).json({ error: 'Route non trouvée.' });
        }
      } else if (req.method === 'POST') {
        if (req.url === '/insert-message') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const message = JSON.parse(body).message;
              connection.query('INSERT INTO message_serveur (message) VALUES (?)', [message], (err, results) => {
                if (err) {
                  console.error('Erreur SQL lors de l\'insertion des données :', err.code, err.sqlMessage);
                  return res.status(500).json({ error: 'Erreur lors de l\'insertion des données.' });
                }
                res.status(201).json({ message: 'Message inséré avec succès.' });
              });
            } catch (e) {
              res.status(400).json({ error: 'Données JSON invalides.' });
            }
          });
        } else if (req.url.startsWith('/messages/') && req.url.endsWith('/commentaires')) {
          const messageId = req.url.split('/')[2];
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const commentaire = JSON.parse(body).commentaire;
              connection.query('INSERT INTO commentaire (message_id, commentaire) VALUES (?, ?)', [messageId, commentaire], (err, results) => {
                if (err) {
                  console.error('Erreur SQL lors de l\'insertion du commentaire :', err.code, err.sqlMessage);
                  return res.status(500).json({ error: 'Erreur lors de l\'insertion du commentaire.' });
                }
                res.status(201).json({ message: 'Commentaire inséré avec succès.' });
              });
            } catch (e) {
              res.status(400).json({ error: 'Données JSON invalides.' });
            }
          });
        } else if (req.url.startsWith('/like-message/')) {
          const messageId = req.url.split('/')[2];
          const userId = req.session.user.id; // Assurez-vous que l'utilisateur est connecté et que son ID est stocké dans la session
          connection.query('SELECT * FROM likes WHERE user_id = ? AND message_id = ?', [userId, messageId], (err, results) => {
            if (err) {
              console.error('Erreur SQL lors de la vérification du like :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de la vérification du like.' });
            }
            if (results.length > 0) {
              // L'utilisateur a déjà liké ce message, donc on retire le like
              connection.query('DELETE FROM likes WHERE user_id = ? AND message_id = ?', [userId, messageId], (err, results) => {
                if (err) {
                  console.error('Erreur SQL lors de la suppression du like :', err.code, err.sqlMessage);
                  return res.status(500).json({ error: 'Erreur lors de la suppression du like.' });
                }
                connection.query('UPDATE message_serveur SET likes = likes - 1 WHERE id = ?', [messageId], (err, results) => {
                  if (err) {
                    console.error('Erreur SQL lors de la décrémentation des likes :', err.code, err.sqlMessage);
                    return res.status(500).json({ error: 'Erreur lors de la décrémentation des likes.' });
                  }
                  res.status(200).json({ message: 'Like retiré avec succès.' });
                });
              });
            } else {
              // L'utilisateur n'a pas encore liké ce message, donc on ajoute le like
              connection.query('INSERT INTO likes (user_id, message_id) VALUES (?, ?)', [userId, messageId], (err, results) => {
                if (err) {
                  console.error('Erreur SQL lors de l\'ajout du like :', err.code, err.sqlMessage);
                  return res.status(500).json({ error: 'Erreur lors de l\'ajout du like.' });
                }
                connection.query('UPDATE message_serveur SET likes = likes + 1 WHERE id = ?', [messageId], (err, results) => {
                  if (err) {
                    console.error('Erreur SQL lors de l\'incrémentation des likes :', err.code, err.sqlMessage);
                    return res.status(500).json({ error: 'Erreur lors de l\'incrémentation des likes.' });
                  }
                  res.status(200).json({ message: 'Like ajouté avec succès.' });
                });
              });
            }
          });
        } else if (req.url === '/register') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { username, email, password } = JSON.parse(body);
              const createdAt = new Date();
              console.log('Received registration data:', { username, email, password, createdAt }); // Log received data
              connection.query('INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, ?)', [username, email, password, createdAt], (err, results) => {
                if (err) {
                  console.error('Erreur SQL lors de l\'enregistrement de l\'utilisateur :', err.code, err.sqlMessage);
                  return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'utilisateur.', details: err.sqlMessage });
                }
                res.status(201).json({ message: 'Utilisateur enregistré avec succès.' });
              });
            } catch (e) {
              res.status(400).json({ error: 'Données JSON invalides.' });
            }
          });
        } else if (req.url === '/login') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { username, password } = JSON.parse(body);
              connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
                if (err) {
                  console.error('Erreur SQL lors de la connexion de l\'utilisateur :', err.code, err.sqlMessage);
                  return res.status(500).json({ error: 'Erreur lors de la connexion de l\'utilisateur.' });
                }
                if (results.length > 0) {
                  req.session.user = { id: results[0].id, username };
                  res.status(200).json({ message: 'Connexion réussie.' });
                } else {
                  res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
                }
              });
            } catch (e) {
              res.status(400).json({ error: 'Données JSON invalides.' });
            }
          });
        } else {
          res.status(404).json({ error: 'Route non trouvée.' });
        }
      } else if (req.method === 'DELETE') {
        const urlParts = req.url.split('/');
        const id = urlParts[urlParts.length - 1];
      
        if (urlParts[1] === 'delete-message' && id) {
          connection.query('DELETE FROM message_serveur WHERE id = ?', [id], (err, results) => {
            if (err) {
              console.error('Erreur SQL lors de la suppression des données :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de la suppression des données.' });
            }
            res.status(200).json({ message: 'Message supprimé avec succès.' });
          });
        } else {
          res.status(404).json({ error: 'Route non trouvée.' });
        }
      } else {
        res.status(404).json({ error: 'Route non trouvée.' });
      }
    });
  });
};