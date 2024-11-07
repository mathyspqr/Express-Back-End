const mysql = require('mysql');
const cors = require('cors');

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
const corsMiddleware = cors();

// Handler de la fonction serverless
module.exports = async (req, res) => {const mysql = require('mysql');
  const cors = require('cors');
  const session = require('express-session');
  const bcrypt = require('bcrypt');
  const express = require('express');
  const app = express();
  
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
  app.use(cors());
  app.use(express.json());
  app.use(session({
    secret: 'votre_secret_de_session',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Utilisez secure: true en production avec HTTPS
  }));
  
  // Route pour s'inscrire
  app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de l\'inscription :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
      }
      res.status(201).json({ message: 'Inscription réussie.' });
    });
  });
  
  // Route pour se connecter
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de la connexion :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de la connexion.' });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
      }
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' });
      }
      req.session.userId = user.id;
      res.status(200).json({ message: 'Connexion réussie.' });
    });
  });
  
  // Route pour vérifier la session
  app.get('/session', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Non connecté.' });
    }
    res.status(200).json({ message: 'Connecté.', userId: req.session.userId });
  });
  
  // Autres routes existantes
  app.get('/mathys', (req, res) => {
    connection.query('SELECT * FROM message_serveur', (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de la récupération des données :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de la récupération des données.' });
      }
      res.json(results);
    });
  });
  
  app.post('/insert-message', (req, res) => {
    const { message } = req.body;
    connection.query('INSERT INTO message_serveur (message) VALUES (?)', [message], (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de l\'insertion des données :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de l\'insertion des données.' });
      }
      res.status(201).json({ message: 'Message inséré avec succès.' });
    });
  });
  
  app.post('/messages/:id/commentaires', (req, res) => {
    const messageId = req.params.id;
    const { commentaire } = req.body;
    connection.query('INSERT INTO commentaire (message_id, commentaire) VALUES (?, ?)', [messageId, commentaire], (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de l\'insertion du commentaire :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de l\'insertion du commentaire.' });
      }
      res.status(201).json({ message: 'Commentaire inséré avec succès.' });
    });
  });
  
  app.post('/like-message/:id', (req, res) => {
    const messageId = req.params.id;
    connection.query('UPDATE message_serveur SET likes = likes + 1 WHERE id = ?', [messageId], (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de l\'incrémentation des likes :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de l\'incrémentation des likes.' });
      }
      res.status(200).json({ message: 'Like ajouté avec succès.' });
    });
  });
  
  app.post('/unlike-message/:id', (req, res) => {
    const messageId = req.params.id;
    connection.query('UPDATE message_serveur SET likes = likes - 1 WHERE id = ?', [messageId], (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de la décrémentation des likes :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de la décrémentation des likes.' });
      }
      res.status(200).json({ message: 'Like retiré avec succès.' });
    });
  });
  
  app.delete('/delete-message/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM message_serveur WHERE id = ?', [id], (err, results) => {
      if (err) {
        console.error('Erreur SQL lors de la suppression des données :', err.code, err.sqlMessage);
        return res.status(500).json({ error: 'Erreur lors de la suppression des données.' });
      }
      res.status(200).json({ message: 'Message supprimé avec succès.' });
    });
  });
  
  // Démarrer le serveur
  app.listen(3000, () => {
    console.log('Serveur en écoute sur le port 3000');
  });
  corsMiddleware(req, res, () => {
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
        connection.query('UPDATE message_serveur SET likes = likes + 1 WHERE id = ?', [messageId], (err, results) => {
          if (err) {
            console.error('Erreur SQL lors de l\'incrémentation des likes :', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Erreur lors de l\'incrémentation des likes.' });
          }
          res.status(200).json({ message: 'Like ajouté avec succès.' });
        });
      } else if (req.url.startsWith('/unlike-message/')) {
        const messageId = req.url.split('/')[2];
        connection.query('UPDATE message_serveur SET likes = likes - 1 WHERE id = ?', [messageId], (err, results) => {
          if (err) {
            console.error('Erreur SQL lors de la décrémentation des likes :', err.code, err.sqlMessage);
            return res.status(500).json({ error: 'Erreur lors de la décrémentation des likes.' });
          }
          res.status(200).json({ message: 'Like retiré avec succès.' });
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