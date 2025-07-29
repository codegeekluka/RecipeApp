import { createContext, useContext } from "react";

const RecipeContext = createContext()

export const useRecipesContext = () => useContext(RecipeContext)

export const RecipeProvider = ({ children }) => {
    const recipes = [
        { id: 1, name: 'Spaghetti Carbonara', image: 'https://leitesculinaria.com/wp-content/uploads/2024/04/spaghetti-carbonara-1-2-768x1152.jpg', description: 'Delicious recipe' },
        { id: 2, name: 'Chicken Tikka Masala', image: 'https://via.placeholder.com/150', description: 'Delicious recipe' },
        { id: 3, name: 'Beef Stroganoff', image: 'https://via.placeholder.com/150', description: 'Delicious recipe' }
      ];

      const value={
        recipes
      }

      return(
        <RecipeContext.Provider value={value} >
          {children}
       </RecipeContext.Provider>

      )


}