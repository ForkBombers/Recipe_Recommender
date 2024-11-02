import mongodb from "mongodb";
import nodemailer from "nodemailer";
import password from "./mail_param.js";

const pass = password.password;
const GMAIL = process.env.GMAIL;

const ObjectId = mongodb.ObjectId;
let recipes;
let ingredients;
let users;

// Function to connect to the database
export default class RecipesDAO {
  static async injectDB(conn) {
    if (recipes) {
      return;
    }
    try {
      recipes = await conn.db(process.env.RECIPES_NS).collection("recipe");
      ingredients = await conn.db(process.env.RECIPES_NS).collection("ingredient_list");
      users = await conn.db(process.env.RECIPES_NS).collection("user");
    } catch (e) {
      console.error(`Unable to establish a collection handle in recipesDAO: ${e}`);
    }
  }

  // Function to get a user
  static async getUser({ filters = null } = {}) {
    let query;
    let cursor;

    if (filters) {
      query = { "userName": filters.userName };
      cursor = await users.findOne(query);
      if (cursor && cursor.userName) {
        if (cursor.password === filters.password) {
          return { success: true, user: cursor };
        } else {
          return { success: false };
        }
      } else {
        return { success: false };
      }
    }
  }

  // Function to add a user
  static async addUser({ data = null } = {}) {
    let query;
    let cursor;

    if (data) {
      query = { "userName": data.userName };
      cursor = await users.findOne(query);
      if (cursor) {
        return { success: false }; // User already exists
      } else {
        await users.insertOne(data);
        return { success: true }; // User added successfully
      }
    }
  }

  // Function to get bookmarks
  static async getBookmarks(userName) {
    let query = { "userName": userName };
    try {
      let cursor = await users.findOne(query);
      if (cursor && cursor.userName) {
        return cursor.bookmarks || []; // Return bookmarks or an empty array
      } else {
        return { bookmarks: [] };
      }
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }

  // Function to get recipe by name
  static async getRecipeByName({ filters = null } = {}) {
    let query;

    if (filters && "recipeName" in filters) {
      const words = filters["recipeName"].split(" ");
      const regexPattern = words.map(word => `(?=.*\\b${word}\\b)`).join('');
      query = { "TranslatedRecipeName": { $regex: new RegExp(regexPattern, "i") } };
      
      try {
        const recipesList = await recipes
          .find(query)
          .collation({ locale: "en", strength: 2 })
          .toArray();
        return { recipesList };
      } catch (e) {
        console.error(`Unable to issue find command, ${e}`);
        return { recipesList: [], totalNumRecipes: 0 };
      }
    }
  }

  // Function to get the recipe list
  static async getRecipes({ filters = null, page = 0, recipesPerPage = 10 } = {}) {
    let query = {};
    
    if (filters && "CleanedIngredients" in filters) {
      const ingredientsRegex = filters["CleanedIngredients"].map(ingredient => `(?=.*${ingredient})`).join('');
      query["Cleaned-Ingredients"] = { $regex: new RegExp(ingredientsRegex, "i") };
      query["Cuisine"] = filters["Cuisine"];
    }

    let cursor;

    try {
      cursor = await recipes.find(query).collation({ locale: "en", strength: 2 });
      const displayCursor = cursor.limit(recipesPerPage);
      const recipesList = await displayCursor.toArray();
      const totalNumRecipes = await recipes.countDocuments(query);

      // Sending email with recipe recommendations if required
      if (filters && filters.Flag === "true") {
        const email = filters["Email"];
        const str_mail = recipesList.map((recipe, index) => 
          `Recipe ${index + 1}: \n${recipe["TranslatedRecipeName"]}\nYoutube Link: https://www.youtube.com/results?search_query=${recipe["TranslatedRecipeName"].replace(/ /g, "+")}\n\n`
        ).join("");

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: GMAIL,
            pass: pass,
          },
        });

        const mailOptions = {
          from: GMAIL,
          to: email,
          subject: "Recommended Recipes! Enjoy your meal!!",
          text: str_mail,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }

      return { recipesList, totalNumRecipes };
    } catch (e) {
      console.error(`Unable to convert cursor to array or problem counting documents, ${e}`);
      return { recipesList: [], totalNumRecipes: 0 };
    }
  }

  // Function to get the list of cuisines
  static async getCuisines() {
    try {
      const cuisines = await recipes.distinct("Cuisine");
      return cuisines;
    } catch (e) {
      console.error(`Unable to get cuisines, ${e}`);
      return [];
    }
  }

  // Function to add a recipe
  static async addRecipe(recipe) {
    let inputRecipe = {
      TranslatedRecipeName: recipe["recipeName"],
      TotalTimeInMins: recipe["cookingTime"],
      "Diet-type": recipe["dietType"],
      "Recipe-rating": recipe["recipeRating"],
      Cuisine: recipe["cuisine"],
      "image-url": recipe["imageURL"],
      URL: recipe["recipeURL"],
      TranslatedInstructions: recipe["instructions"],
      "Cleaned-Ingredients": recipe["ingredients"].join("%"),
      Restaurant: recipe["restaurants"].join("%"),
      "Restaurant-Location": recipe["locations"].join("%"),
    };

    try {
      const response = await recipes.insertOne(inputRecipe);
      return response;
    } catch (e) {
      console.error(`Unable to add recipe, ${e}`);
      return { error: e };
    }
  }

  // Function to add recipe to user profile
  static async addRecipeToProfile(userName, recipe) {
    try {
      const response = await users.updateOne(
        { userName: userName },
        { $push: { bookmarks: recipe } }
      );
      return response;
    } catch (e) {
      console.log(`Unable to add recipe to profile, ${e}`);
      return { error: e };
    }
  }

  // Function to get ingredients
  static async getIngredients() {
    try {
      const response = await ingredients.distinct('item_name');
      return response;
    } catch (e) {
      console.error(`Unable to get ingredients, ${e}`);
      return [];
    }
  }
}
