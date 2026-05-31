import { listRecipes, getRecipe } from "@/lib/api"
import { pickRandom } from "@/lib/utils/random"

export async function GET() {
  try {
    const recipes = await listRecipes()
    const picked = pickRandom(recipes)
    if (!picked) return Response.json({ error: "No recipes found" }, { status: 404 })
    const recipe = await getRecipe(picked.id)
    return Response.json(recipe)
  } catch {
    return Response.json({ error: "Failed to fetch recipe" }, { status: 500 })
  }
}
