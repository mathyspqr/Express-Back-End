const mysql = require('mysql');
const cors = require('cors');
// const session = require('express-session');

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

// Handler de la fonction serverless
module.exports = async (req, res) => {
  corsMiddleware(req, res, () => {
    if (req.method === 'GET') {
      if (req.url === '/mathys') {
        // Assume userId is extracted from session or token
        const userId = 1; // Utilisateur fictif pour le test
        connection.query('SELECT * FROM message_serveur', (err, messages) => {
          if (err) {
            console.error('Erreur SQL lors de la récupération des données :', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
          }

          const messageIds = messages.map(message => message.id);
          connection.query('SELECT message_id FROM likes WHERE user_id = ? AND message_id IN (?)', [userId, messageIds], (err, likedMessages) => {
            if (err) {
              console.error('Erreur SQL lors de la récupération des likes :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de la récupération des likes.' });
            }

            const likedMessageIds = likedMessages.map(like => like.message_id);

            messages.forEach(message => {
              message.liked = likedMessageIds.includes(message.id);
            });

            res.json(messages);
          });
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
      } else if (req.url.startsWith('/likes/')) {
        const userId = req.url.split('/')[2];
        connection.query('SELECT message_id FROM likes WHERE user_id = ?', [userId], (err, results) => {
          if (err) {
            console.error('Erreur SQL lors de la récupération des likes :', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Erreur lors de la récupération des likes.' });
          }
          res.json(results);
        });
      } else if (req.url === '/session') {
        res.status(404).json({ error: 'Route non trouvée.' });
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
        // if (!req.session.user) {
        //   console.log('Utilisateur non connecté'); // Ajoutez ce log pour vérifier l'état de la session
        //   return res.status(401).json({ error: 'Utilisateur non connecté' });
        // }
        // const userId = req.session.user.id;
        const userId = 2; // Utilisateur fictif pour le test
        connection.query('INSERT INTO likes (user_id, message_id) VALUES (?, ?)', [userId, messageId], (err, results) => {
          if (err) {
            console.error('Erreur SQL lors de l\'ajout du like :', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Erreur lors de l\'ajout du like.' });
          }
          res.status(201).json({ message: 'Like ajouté avec succès.' });
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
            connection.query('INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, ?)', [username, email, password, createdAt], (err, results) => {
              if (err) {
                console.error('Erreur SQL lors de l\'enregistrement de l\'utilisateur :', err.code, err.sqlMessage);
                return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'utilisateur.' });
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
                // req.session.user = { id: results[0].id, username };
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
};