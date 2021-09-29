import React from 'react';
import Recipe from './Recipe';

const RecipeList = ({recipes}) => {
    
    const renderedRecipes =  recipes.map((recipe) => {
        return <Recipe key={recipe._id} recipe={recipe}/>
    });

    return <table id="resultOuterContainer" > {renderedRecipes}</table>;
};
export default RecipeList;
