import type { Metadata } from "next"
import { RecipeForm } from "./RecipeForm"

export const metadata: Metadata = {
  title: "New Recipe",
}

const NewRecipePage = () => <RecipeForm />

export default NewRecipePage
