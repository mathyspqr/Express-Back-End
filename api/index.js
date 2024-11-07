const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const dbConfig = {
  host: '5.tcp.eu.ngrok.io',
  port: '19144',
  user: 'mathys',
  password: 'TiTi60340..',
  database: 'mathys',
};

const secretKey = 'votre_clé_secrète'; // Changez ceci par une clé secrète sécurisée

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
const corsMiddleware = cors();

// Handler de la fonction serverless
module.exports = async (req, res) => {
  corsMiddleware(req, res, () => {
    if (req.method === 'POST') {
      if (req.url === '/register') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { username, password } = JSON.parse(body);
            const hashedPassword = await bcrypt.hash(password, 10);
            connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
              if (err) {
                console.error('Erreur SQL lors de l\'inscription :', err.code, err.sqlMessage);
                return res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
              }
              res.status(201).json({ message: 'Utilisateur inscrit avec succès.' });
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
            connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
              if (err) {
                console.error('Erreur SQL lors de la connexion :', err.code, err.sqlMessage);
                return res.status(500).json({ error: 'Erreur lors de la connexion.' });
              }
              if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
                return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
              }
              const token = jwt.sign({ userId: results[0].id }, secretKey, { expiresIn: '1h' });
              res.status(200).json({ message: 'Connexion réussie.', token });
            });
          } catch (e) {
            res.status(400).json({ error: 'Données JSON invalides.' });
          }
        });
      } else if (req.url === '/insert-message') {
        // Code existant pour insérer un message
      } else if (req.url.startsWith('/messages/') && req.url.endsWith('/commentaires')) {
        // Code existant pour insérer un commentaire
      } else if (req.url.startsWith('/like-message/')) {
        // Code existant pour ajouter un like
      } else {
        res.status(404).json({ error: 'Route non trouvée.' });
      }
    } else if (req.method === 'GET') {
      if (req.url === '/session') {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'Token manquant.' });
        }
        try {
          const decoded = jwt.verify(token, secretKey);
          res.status(200).json({ message: 'Session valide.', userId: decoded.userId });
        } catch (e) {
          res.status(401).json({ error: 'Token invalide.' });
        }
      } else if (req.url === '/mathys') {
        // Code existant pour récupérer les messages
      } else if (req.url.startsWith('/messages/') && req.url.endsWith('/commentaires')) {
        // Code existant pour récupérer les commentaires
      } else {
        res.status(404).json({ error: 'Route non trouvée.' });
      }
    } else if (req.method === 'DELETE') {
      // Code existant pour supprimer un message
    } else {
      res.status(404).json({ error: 'Route non trouvée.' });
    }
  });
};