const mysql = require('mysql');
const cors = require('cors');
// const session = require('express-session');

const dbConfig = {
  host: '88.179.9.2',    
  user: 'mathys',        
  password: 'TiTi60340.',
  database: 'mathys',   
  port: 3306      
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
  origin: ['http://localhost:3000', 'https://fullapp-js.mathys-portfolio.fr'], // Ajoutez votre domaine de production ici
  credentials: true,
});

// Configurer les sessions
// const sessionMiddleware = session({
//   secret: 'mySuperSecretKey12345!@#$', 
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: false }
// });

// Handler de la fonction serverless
module.exports = async (req, res) => {
  corsMiddleware(req, res, () => {
    // sessionMiddleware(req, res, () => {
      // console.log('Session:', req.session); // Ajoutez ce log pour vérifier l'état de la session
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
        } else if (req.url.startsWith('/likes/')) {
          const urlParts = req.url.split('/');
          const userId = urlParts[2];
          connection.query('SELECT * FROM likes WHERE user_id = ?', [userId], (err, results) => {
            if (err) {
              console.error('Erreur SQL lors de la récupération des likes :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de la récupération des likes.' });
            }
            res.json(results);
          });
        } else if (req.url === '/session') {
          // if (req.session.user) {
          //   res.send(`Utilisateur connecté : ${req.session.user.username}`);
          // } else {
          //   res.status(401).json({ error: 'Aucun utilisateur connecté' });
          // }
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
          const parts = req.url.split('/');
          const userId = parts[2];
          const messageId = parts[3];
        
          connection.query('INSERT INTO likes (user_id, message_id) VALUES (?, ?)', [userId, messageId], (err, results) => {
            if (err) {
              console.error('Erreur SQL lors de l\'ajout du like :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de l\'ajout du like.' });
            }
            res.status(201).json({ message: 'Like ajouté avec succès.' });
          });
        }
        else if (req.url.startsWith('/unlike-message/')) {
          const parts = req.url.split('/');
          const userId = parts[2];
          const messageId = parts[3];
        
          connection.query('DELETE FROM likes WHERE user_id = ? AND message_id = ?', [userId, messageId], (err, results) => {
            if (err) {
              console.error('Erreur SQL lors de la suppression du like :', err.code, err.sqlMessage);
              return res.status(500).json({ error: 'Erreur lors de la suppression du like.' });
            }
            res.status(200).json({ message: 'Like supprimé avec succès.' });
          });
        }
        else if (req.url === '/register') {
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
              const requestData = JSON.parse(body);
              const { username, password } = requestData;
              connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
                if (err) {
                  console.error('Erreur SQL lors de la connexion de l\'utilisateur :', err.code, err.sqlMessage);
                  return res.status(500).json({ error: 'Erreur lors de la connexion de l\'utilisateur.' });
                }
                if (results.length > 0) {
                  res.status(200).json({ message: 'Connexion réussie.', user: results[0], requestData });
                } else {
                  res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
                }
              });
            } catch (e) {
              res.status(400).json({ error: 'Données JSON invalides.' });
            }
          });
        }else {
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
    // });
  });
};