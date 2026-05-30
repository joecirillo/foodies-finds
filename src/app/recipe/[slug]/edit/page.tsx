import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRecipe } from "@/lib/api"
import { EditRecipeForm } from "./EditRecipeForm"
import type { Recipe } from "@/types/recipe"

export const metadata: Metadata = {
  title: "Edit Recipe",
}

const EditRecipePage = async (props: PageProps<"/recipe/[slug]/edit">) => {
  const { slug } = await props.params

  let recipe: Recipe
  try {
    recipe = await getRecipe(slug)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === "404") notFound()
    throw err
  }

  return <EditRecipeForm recipe={recipe} />
}

export default EditRecipePage
