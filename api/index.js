const http = require('http');
const url = require('url');
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'votre_base_de_donnees'
});

connection.connect();

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'POST') {
    if (req.url.startsWith('/messages/') && req.url.endsWith('/commentaires')) {
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

server.listen(3000, () => {
  console.log('Serveur en écoute sur le port 3000');
});