import express from "express";
import cors from "cors";
import recipes from "./api/recipes.route.js";
import mongodb from "mongodb";
import RecipesDAO from "./dao/recipesDAO.js"; // Import your DAO
import dotenv from "dotenv"; // For environment variables

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to the database
const MongoClient = mongodb.MongoClient;

(async () => {
  try {
    const client = await MongoClient.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await RecipesDAO.injectDB(client);
    console.log("Database connection established successfully");
  } catch (e) {
    console.error(`Unable to connect to database: ${e}`);
    process.exit(1);
  }
})();

// API Routes
app.use("/api/v1/recipes", recipes);

// Error handling for invalid routes
app.use("*", (req, res) => res.status(404).json({ error: "not found" }));

// General error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
