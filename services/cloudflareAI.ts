export interface RecipePreferences {
  timeAvailable: string;
  isVegan: boolean;
  mealType: string;
}

export async function generateRecipe(
  ingredients: string[],
  preferences: RecipePreferences
): Promise<string> {
  const accountId = process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials not configured');
  }

  const prompt = `Genera una receta detallada en español usando estos ingredientes: ${ingredients.join(', ')}.
Preferencias:
- Tiempo disponible: ${preferences.timeAvailable} minutos
- Vegano: ${preferences.isVegan ? 'Sí' : 'No'}
- Tipo de comida: ${preferences.mealType}

Formato la respuesta en markdown con:
# Título de la receta
## Ingredientes
## Instrucciones paso a paso
## Tiempo de preparación
## Información nutricional aproximada`;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Error generating recipe: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result.response;
}