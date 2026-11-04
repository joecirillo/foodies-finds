import type { Metadata } from "next"
import { RecipeForm } from "./recipe-form"

export const metadata: Metadata = {
  title: "New Recipe",
}

const NewRecipePage = () => <RecipeForm />

export default NewRecipePage
