const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@faisal.yl6wev4.mongodb.net/?retryWrites=true&w=majority&appName=Faisal`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const database = client.db("savorlyDB");
    const recipesCollection = database.collection("recipes");

    // Health check
    app.get('/', (req, res) => res.send('Savorly Server is getting Hotter.'));

    // Get all recipes
    app.get('/recipes', async (req, res) => {
      try {
        const recipes = await recipesCollection.find().toArray();
        res.status(200).json(recipes);
      } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve recipes', error: err.message });
      }
    });

    // Get top 6 recipes by like count
    app.get('/recipes/top', async (req, res) => {
      try {
        const topRecipes = await recipesCollection
          .find()
          .sort({ likeCount: -1 })
          .limit(6)
          .toArray();
        res.status(200).json(topRecipes);
      } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve top recipes', error: err.message });
      }
    });

