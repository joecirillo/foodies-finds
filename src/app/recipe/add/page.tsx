import type { Metadata } from "next"
import { AddRecipe } from "./add-recipe"

export const metadata: Metadata = {
  title: "New Recipe",
}

const NewRecipePage = () => <AddRecipe />

export default NewRecipePage
