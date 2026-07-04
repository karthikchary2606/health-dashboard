'use strict';

const southIndian = require('../../server/meals/south-indian');
const northIndian = require('../../server/meals/north-indian');

describe('South Indian Meals Data Shape', () => {
  const requiredFields = ['name', 'calories', 'proteinG', 'carbsG', 'fatG', 'estimated'];

  // Flatten the nested meal structure to get all individual meals
  const getAllMeals = (mealsObj) => {
    const meals = [];
    Object.keys(mealsObj).forEach((mealType) => {
      Object.keys(mealsObj[mealType]).forEach((category) => {
        const items = mealsObj[mealType][category];
        meals.push(...items);
      });
    });
    return meals;
  };

  test('All meals should be objects, not strings', () => {
    const meals = getAllMeals(southIndian);
    meals.forEach((meal) => {
      expect(typeof meal).toBe('object');
      expect(meal).not.toBe(null);
    });
  });

  test('Each meal should have required nutritional fields', () => {
    const meals = getAllMeals(southIndian);
    meals.forEach((meal) => {
      requiredFields.forEach((field) => {
        expect(meal).toHaveProperty(field);
      });
    });
  });

  test('Each meal should have name as a non-empty string', () => {
    const meals = getAllMeals(southIndian);
    meals.forEach((meal) => {
      expect(typeof meal.name).toBe('string');
      expect(meal.name.length).toBeGreaterThan(0);
    });
  });

  test('All nutritional values should be positive numbers', () => {
    const meals = getAllMeals(southIndian);
    meals.forEach((meal) => {
      expect(typeof meal.calories).toBe('number');
      expect(meal.calories).toBeGreaterThan(0);
      
      expect(typeof meal.proteinG).toBe('number');
      expect(meal.proteinG).toBeGreaterThanOrEqual(0);
      
      expect(typeof meal.carbsG).toBe('number');
      expect(meal.carbsG).toBeGreaterThanOrEqual(0);
      
      expect(typeof meal.fatG).toBe('number');
      expect(meal.fatG).toBeGreaterThanOrEqual(0);
    });
  });

  test('All meals should be marked as estimated: true', () => {
    const meals = getAllMeals(southIndian);
    meals.forEach((meal) => {
      expect(meal.estimated).toBe(true);
    });
  });

  test('Should have approximately 40+ meals across all categories', () => {
    const meals = getAllMeals(southIndian);
    expect(meals.length).toBeGreaterThanOrEqual(40);
  });
});

describe('North Indian Meals Data Shape', () => {
  const requiredFields = ['name', 'calories', 'proteinG', 'carbsG', 'fatG', 'estimated'];

  // Flatten the nested meal structure to get all individual meals
  const getAllMeals = (mealsObj) => {
    const meals = [];
    Object.keys(mealsObj).forEach((mealType) => {
      Object.keys(mealsObj[mealType]).forEach((category) => {
        const items = mealsObj[mealType][category];
        meals.push(...items);
      });
    });
    return meals;
  };

  test('All meals should be objects, not strings', () => {
    const meals = getAllMeals(northIndian);
    meals.forEach((meal) => {
      expect(typeof meal).toBe('object');
      expect(meal).not.toBe(null);
    });
  });

  test('Each meal should have required nutritional fields', () => {
    const meals = getAllMeals(northIndian);
    meals.forEach((meal) => {
      requiredFields.forEach((field) => {
        expect(meal).toHaveProperty(field);
      });
    });
  });

  test('Each meal should have name as a non-empty string', () => {
    const meals = getAllMeals(northIndian);
    meals.forEach((meal) => {
      expect(typeof meal.name).toBe('string');
      expect(meal.name.length).toBeGreaterThan(0);
    });
  });

  test('All nutritional values should be positive numbers', () => {
    const meals = getAllMeals(northIndian);
    meals.forEach((meal) => {
      expect(typeof meal.calories).toBe('number');
      expect(meal.calories).toBeGreaterThan(0);
      
      expect(typeof meal.proteinG).toBe('number');
      expect(meal.proteinG).toBeGreaterThanOrEqual(0);
      
      expect(typeof meal.carbsG).toBe('number');
      expect(meal.carbsG).toBeGreaterThanOrEqual(0);
      
      expect(typeof meal.fatG).toBe('number');
      expect(meal.fatG).toBeGreaterThanOrEqual(0);
    });
  });

  test('All meals should be marked as estimated: true', () => {
    const meals = getAllMeals(northIndian);
    meals.forEach((meal) => {
      expect(meal.estimated).toBe(true);
    });
  });

  test('Should have approximately 40+ meals across all categories', () => {
    const meals = getAllMeals(northIndian);
    expect(meals.length).toBeGreaterThanOrEqual(40);
  });
});
