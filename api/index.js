const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Utiliser le port défini par Vercel

const dbConfig = {
  host: '192.168.1.123', // Remplacez par l'adresse IP de votre serveur MySQL
  user: 'mathys',
  password: 'TiTi60340..',
  database: 'mathys',
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connecté à la base de données avec l\'ID', connection.threadId);
});

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World! Test de connexion à la base de données.');
});

app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return res.status(500).send('Erreur lors de la récupération des utilisateurs.');
    }
    res.json(results);
  });
});

app.get('/mathys', (req, res) => {
  connection.query('SELECT * FROM message_serveur', (err, results) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).send('Erreur lors de la récupération des données de epsiwis.');
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
