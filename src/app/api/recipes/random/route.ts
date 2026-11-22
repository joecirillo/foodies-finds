import { getRandomRecipe } from "@/lib/api"

export async function GET() {
  try {
    const recipe = await getRandomRecipe({ revalidate: 0 })
    if (!recipe) return Response.json({ error: "No recipes found" }, { status: 404 })
    return Response.json(recipe)
  } catch (err) {
    console.error("Failed to fetch random recipe:", err)
    return Response.json({ error: "Failed to fetch recipe" }, { status: 500 })
  }
}
