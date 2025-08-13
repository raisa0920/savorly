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

    // Get recipes for a specific user
    app.get('/my-recipes', async (req, res) => {
      const userEmail = req.query.email;
      if (!userEmail) {
        return res.status(400).json({ success: false, message: "Email query parameter is required" });
      }

      try {
        const userRecipes = await recipesCollection.find({ userEmail }).toArray();
        res.status(200).json(userRecipes);
      } catch (err) {
        res.status(500).json({ success: false, message: "Failed to get user's recipes", error: err.message });
      }
    });

    // Add a new recipe
    app.post('/recipes', async (req, res) => {
      const recipe = req.body;
      try {
        const result = await recipesCollection.insertOne({ ...recipe, likeCount: 0 });
        res.status(201).json({ success: true, message: 'Recipe added successfully', insertedId: result.insertedId });
      } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to add recipe', error: err.message });
      }
    });


    // Like a recipe
    app.patch('/recipes/:id/like', async (req, res) => {
      const recipeId = req.params.id;
      try {
        const result = await recipesCollection.updateOne(
          { _id: new ObjectId(recipeId) },
          { $inc: { likeCount: 1 } }
        );

        if (result.modifiedCount > 0) {
          res.json({ success: true, message: "Like count updated." });
        } else {
          res.status(404).json({ success: false, message: "Recipe not found." });
        }
      } catch (err) {
        res.status(500).json({ success: false, message: "Failed to update like count", error: err.message });
      }
    });

    // Get a recipe by ID
    app.get('/recipes/:id', async (req, res) => {
      const recipeId = req.params.id;
      try {
        const recipe = await recipesCollection.findOne({ _id: new ObjectId(recipeId) });
        if (recipe) {
          res.status(200).json(recipe);
        } else {
          res.status(404).json({ success: false, message: 'Recipe not found' });
        }
      } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve recipe', error: err.message });
      }
    });