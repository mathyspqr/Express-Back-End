// Importation des modules nécessaires
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

// Création de l'application Express
const app = express();
const port = 3000;

// Configuration de la connexion à la base de données
const dbConfig = {
  host: '192.168.1.123', // Remplacez par l'adresse IP de votre serveur MySQL
  user: 'mathys', // Remplacez par votre nom d'utilisateur MySQL
  password: 'TiTi60340..', // Remplacez par votre mot de passe MySQL
  database: 'mathys', // Remplacez par le nom de votre base de données
};

// Créer une connexion à la base de données
const connection = mysql.createConnection(dbConfig);

// Tester la connexion à la base de données
connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    process.exit(1); // Arrêter le processus en cas d'erreur
  }
  console.log('Connecté à la base de données avec l\'ID', connection.threadId);
});

// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Middleware pour gérer les CORS
app.use(cors());

// Route de test
app.get('/', (req, res) => {
  res.send('Hello World! Test de connexion à la base de données.');
});

// Route pour récupérer tous les utilisateurs
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
        console.error('Erreur SQL:', err); // Affiche l'erreur dans la console
        return res.status(500).send('Erreur lors de la récupération des données de epsiwis.');
      }
      res.json(results);
    });
});


app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
