import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '@env';

export async function generateRecipe(ingredients, preferences) {
    const { timeAvailable, isVegan, mealType } = preferences;

    // Construct the prompt
    const prompt = `Generate a recipe based on the following:
  - Ingredients available: ${ingredients.join(', ')}
  - Time available: ${timeAvailable} minutes
  - Dietary preference: ${isVegan ? 'Vegan' : 'No specific dietary restrictions'}
  - Meal type: ${mealType}
  
  Please format the response with:
  1. Recipe name
  2. Ingredients list with measurements
  3. Step-by-step instructions
  4. Estimated preparation time
  5. Nutritional information (approximate)`;

    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.errors?.[0]?.message || 'Failed to generate recipe');
        }

        return data.result?.response || 'Could not generate a recipe with the given information.';
    } catch (error) {
        console.error('Error generating recipe:', error);
        throw error;
    }
}
