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

const corsMiddleware = cors();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

// Handler de la fonction serverless
module.exports = async (req, res) => {
  corsMiddleware(req, res, () => {
    if (req.method === 'GET') {
      if (req.url === '/mathys') {
        connection.query('SELECT * FROM message_serveur', (err, results) => {
          if (err) {
            console.error('Erreur SQL lors de la récupération des données :', err.code, err.sqlMessage);
            return res.status(500).send('Erreur lors de la récupération des données.');
          }
          res.json(results);
        });
      } else {
        res.status(404).send('Route non trouvée.');
      }
    } else if (req.method === 'POST') {
      if (req.url === '/messages') {
        jsonParser(req, res, () => {
          const { message } = req.body;
          if (!message) {
            return res.status(400).send('Le message est requis');
          }

          const query = 'INSERT INTO message_serveur (message) VALUES (?)';
          connection.query(query, [message], (err, result) => {
            if (err) {
              console.error('Erreur SQL lors de l\'insertion du message :', err.code, err.sqlMessage);
              return res.status(500).send('Erreur lors de l\'insertion du message');
            }
            res.status(201).send('Message inséré avec succès');
          });
        });
      } else {
        res.status(404).send('Route non trouvée.');
      }
    } else {
      res.status(405).send('Méthode non autorisée.');
    }
  });
};