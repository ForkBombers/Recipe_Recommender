import React, { Component } from "react";
import { Tabs, Tab, TabList, TabPanel, TabPanels, Box } from "@chakra-ui/react";

import Form from "./components/Form.js";
import Header from "./components/Header";
import recipeDB from "./apis/recipeDB";
import RecipeList from "./components/RecipeList";
import AddRecipe from "./components/AddRecipe.js";
import RecipeLoading from "./components/RecipeLoading.js";
import Nav from "./components/Navbar.js";
import SearchByRecipe from "./components/SearchByRecipe.js";
import Login from "./components/Login.js";
import UserProfile from "./components/UserProfile.js";

// Main component of the project
class App extends Component {
  // constructor for the App Component
  constructor() {
    super();

    this.state = {
      cuisine: "",
      ingredients: new Set(),
      recipeList: [],
      recipeByNameList: [],
      email: "",
      flag: false,
      isLoading: false,
      isLoggedIn: false,
      isProfileView: false,
      userData: {}
    };
  }

  handleBookMarks = () => {
    this.setState({ isProfileView: true });
  };

  handleProfileView = () => {
    this.setState({ isProfileView: false });
  };

  handleSignup = async (userName, password) => {
    try {
      const response = await recipeDB.post("/recipes/signup", {
        userName,
        password
      });

      if (response.data.success) {
        alert("Successfully signed up!");
        this.setState({
          isLoggedIn: true,
          userData: response.data.user
        });
        localStorage.setItem("userName", response.data.user.userName);
      } else {
        alert("User already exists");
      }
    } catch (err) {
      console.log(err);
    }
  };

  handleLogin = async (userName, password) => {
    try {
      const response = await recipeDB.get("/recipes/login", {
        params: { userName, password }
      });

      if (response.data.success) {
        this.setState({
          isLoggedIn: true,
          userData: response.data.user
        });
        localStorage.setItem("userName", response.data.user.userName);
        alert("Successfully logged in!");
      } else {
        console.log("Credentials are incorrect");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Function to get the user input from the Form component on Submit action
  handleSubmit = async (formDict) => {
    this.setState({ isLoading: true });

    const { ingredient, cuisine, email_id, flag } = formDict;
    this.setState({
      ingredients: ingredient,
      cuisine,
      email: email_id,
      flag
    });

    const items = Array.from(ingredient);
    this.getRecipeDetails(items, cuisine, email_id, flag);
  };

  handleRecipesByName = async (recipeName) => {
    this.setState({ isLoading: true });
    try {
      const res = await recipeDB.get("/recipes/getRecipeByName", {
        params: { recipeName }
      });
      this.setState({
        recipeByNameList: res.data.recipes,
        isLoading: false
      });
    } catch (err) {
      console.log(err);
      this.setState({ isLoading: false });
    }
  };

  getRecipeDetails = async (ingredient, cuis, mail, flag) => {
    try {
      const response = await recipeDB.get("/recipes", {
        params: { CleanedIngredients: ingredient, Cuisine: cuis, Email: mail, Flag: flag }
      });
      this.setState({
        recipeList: response.data.recipes,
        isLoading: false
      });
    } catch (err) {
      console.log(err);
      this.setState({ isLoading: false });
    }
  };

  handleLogout = () => {
    this.setState({ isLoggedIn: false });
  };

  render() {
    return (
      <div>
        <Nav handleLogout={this.handleLogout} handleBookMarks={this.handleBookMarks} user={this.state.userData} />
        {this.state.isLoggedIn ? (
          <>
            {this.state.isProfileView ? (
              <UserProfile handleProfileView={this.handleProfileView} user={this.state.userData} />
            ) : (
              <Tabs variant='soft-rounded' colorScheme='green'>
                <TabList ml={10}>
                  <Tab>Search Recipe</Tab>
                  <Tab>Add Recipe</Tab>
                  <Tab>Search Recipe By Name</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Box display="flex">
                      <Form sendFormData={this.handleSubmit} />
                      {this.state.isLoading ? <RecipeLoading /> : <RecipeList recipes={this.state.recipeList} />}
                    </Box>
                  </TabPanel>
                  <TabPanel>
                    <AddRecipe />
                  </TabPanel>
                  <TabPanel>
                    <SearchByRecipe sendRecipeData={this.handleRecipesByName} />
                    {this.state.isLoading ? <RecipeLoading /> : <RecipeList recipes={this.state.recipeByNameList} />}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </>
        ) : (
          <Login handleSignup={this.handleSignup} handleLogin={this.handleLogin} />
        )}
      </div>
    );
  }
}

export default App;
