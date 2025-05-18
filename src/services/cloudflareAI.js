import { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } from '@env';

// Servicio para interactuar con CloudflareAI para la generación de recetas

/**
 * Genera una receta basada en los ingredientes y preferencias proporcionados.
 * 
 * @param {string[]} ingredients - Array con los nombres de los ingredientes disponibles
 * @param {Object} preferences - Preferencias para la generación de la receta
 * @param {string} preferences.timeAvailable - Tiempo disponible en minutos (e.g. "30")
 * @param {boolean} preferences.isVegan - Si la receta debe ser vegana
 * @param {string} preferences.mealType - Tipo de comida (breakfast, lunch, dinner, snack, dessert)
 * @returns {Promise<string>} La receta generada por la IA
 */
export async function generateRecipe(ingredients, preferences) {
    try {
        // Aquí simulamos la generación de una receta con formato Markdown
        // En una implementación real, esto se conectaría a Cloudflare AI u otro servicio

        await new Promise(resolve => setTimeout(resolve, 3000)); // Simular tiempo de procesamiento

        const { timeAvailable, isVegan, mealType } = preferences;

        const dietType = isVegan ? "vegana" : "normal";
        let mealTypeES = "";

        switch (mealType) {
            case "breakfast": mealTypeES = "desayuno"; break;
            case "lunch": mealTypeES = "almuerzo"; break;
            case "dinner": mealTypeES = "cena"; break;
            case "snack": mealTypeES = "merienda"; break;
            case "dessert": mealTypeES = "postre"; break;
            default: mealTypeES = "comida";
        }

        // Crear nombre aleatorio para la receta basado en los ingredientes principales
        const mainIngredients = ingredients.slice(0, Math.min(3, ingredients.length));
        let recipeName = "";

        if (mainIngredients.length > 0) {
            const randomQualifier = ["Delicioso", "Exquisito", "Sabroso", "Aromático", "Cremoso", "Crujiente"][Math.floor(Math.random() * 6)];
            recipeName = `${randomQualifier} ${mainIngredients[0]}`;
            if (mainIngredients.length > 1) {
                recipeName += ` con ${mainIngredients[1]}`;
            }
            if (mainIngredients.length > 2) {
                recipeName += ` y ${mainIngredients[2]}`;
            }
        }

        // Generar la receta en formato Markdown
        return `# ${recipeName}

Una receta ${dietType} perfecta para ${mealTypeES}, lista en aproximadamente ${timeAvailable} minutos.

## Ingredientes

${ingredients.map(ingredient => `* ${ingredient}`).join('\n')}

## Preparación

1. Preparar todos los ingredientes, lavar y cortar las verduras.
2. En una sartén grande, calentar un poco de aceite a fuego medio.
3. Añadir los ingredientes principales y saltear durante 5 minutos.
4. Incorporar el resto de ingredientes y cocinar por ${Math.floor(parseInt(timeAvailable) / 3)} minutos más.
5. Sazonar al gusto con sal, pimienta y especias de tu elección.
6. Servir caliente y ¡disfrutar!

## Consejos

* Esta receta puede conservarse en refrigerador hasta por 3 días.
* Puedes sustituir ingredientes según tus preferencias personales.
* Acompañar con una ensalada fresca para un plato completo.
`;
    } catch (error) {
        console.error("Error al generar la receta:", error);
        throw new Error("No se pudo generar la receta. Inténtalo de nuevo.");
    }
}
