'use strict';

function toLowerArray(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map(v => String(v || '').toLowerCase().trim())
    .filter(Boolean);
}

function normalizeFoodList(foodList) {
  if (!Array.isArray(foodList)) return [];
  return foodList
    .map(item => {
      if (typeof item === 'string') return item;
      return item && item.name;
    })
    .map(v => String(v || '').toLowerCase().trim())
    .filter(Boolean);
}

function normalizeDietTypes(value) {
  if (Array.isArray(value)) return value.map(v => String(v || '').toLowerCase());
  if (!value) return [];
  return [String(value).toLowerCase()];
}

function matchesDiet(profileDietType, recipeDietTypes) {
  if (!profileDietType) return true;
  if (recipeDietTypes.length === 0) return false;

  if (profileDietType === 'vegetarian') {
    return recipeDietTypes.includes('vegetarian') || recipeDietTypes.includes('vegan');
  }

  return recipeDietTypes.includes(profileDietType);
}

function affinityScore(recipe, foodList) {
  if (foodList.length === 0) return 0;
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  return ingredients.reduce((score, ingredient) => {
    const ing = String(ingredient || '').toLowerCase();
    if (!ing) return score;
    const hasMatch = foodList.some(food => ing.includes(food) || food.includes(ing));
    return hasMatch ? score + 1 : score;
  }, 0);
}

function applyRules(profile = {}, recipes = []) {
  const dietType = String(profile.dietType || '').toLowerCase() || null;
  const avoidTerms = [
    ...toLowerArray(profile.foodAllergies),
    ...toLowerArray(profile.culturalFoodAvoidances)
  ];
  const cuisinePreference = String(profile.cuisinePreference || '').toLowerCase();
  const foodList = normalizeFoodList(profile.foodList);

  return (Array.isArray(recipes) ? recipes : [])
    .filter(recipe => matchesDiet(dietType, normalizeDietTypes(recipe && recipe.dietType)))
    .filter(recipe => {
      if (avoidTerms.length === 0) return true;
      const haystack = `${recipe && recipe.name ? recipe.name : ''} ${(recipe && Array.isArray(recipe.ingredients) ? recipe.ingredients.join(' ') : '')}`.toLowerCase();
      return avoidTerms.every(term => !haystack.includes(term));
    })
    .filter(recipe => {
      if (!cuisinePreference || cuisinePreference === 'mixed') return true;
      return String(recipe && recipe.cuisine ? recipe.cuisine : '').toLowerCase() === cuisinePreference;
    })
    .map((recipe, index) => ({ recipe, index, affinity: affinityScore(recipe, foodList) }))
    .sort((a, b) => {
      if (b.affinity !== a.affinity) return b.affinity - a.affinity;
      return a.index - b.index;
    })
    .map(entry => entry.recipe);
}

module.exports = { applyRules };
