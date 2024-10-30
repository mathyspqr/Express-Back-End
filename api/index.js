const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Utiliser le port défini par Vercel

const dbConfig = {
  host: '2.tcp.eu.ngrok.io', // Remplacez par l'adresse IP de votre serveur MySQL
  port: '16071',
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

app.use(express.json());
app.use(cors());

// Route de test
app.get('/mathys', (req, res) => {
  console.log('Requête reçue sur la route /');
  res.send('Hello World! Test de connexion à la base de données.', res);
});

// Récupérer les utilisateurs
app.get('/users', (req, res) => {
  console.log('Requête reçue sur la route /users');
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs :', err);
      return res.status(500).send('Erreur lors de la récupération des utilisateurs.');
    }
    console.log('Utilisateurs récupérés :', results);
    res.json(results);
  });
});

// Récupérer les messages du serveur
app.get('/mathys', (req, res) => {
  console.log('Requête reçue sur la route /mathys');
  connection.query('SELECT * FROM message_serveur', (err, results) => {
    if (err) {
      // Log de l'erreur détaillé
      console.error('Erreur SQL lors de la récupération des données de epsiwis :', err.code, err.sqlMessage);
      return res.status(500).send('Erreur lors de la récupération des données de epsiwis.');
    }
    console.log('Messages récupérés :', results);
    res.json(results);
  });
});


// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
