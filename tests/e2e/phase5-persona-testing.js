#!/usr/bin/env node

/**
 * Phase 5: Persona Testing Infrastructure
 *
 * Validates Phase 4 personalization features work end-to-end with 5 realistic personas:
 * 1. Vegetarian + Chicken/Eggs (Effective Diet Inference)
 * 2. Strict Vegan (No Effective Diet Upgrade)
 * 3. Meal Rotation Validation
 * 4. Workout Rotation Validation
 * 5. Backward Compatibility (No Effective Diet Upgrade)
 *
 * Note: Requires active server at BASE_URL and will register real test users.
 * Registration is rate-limited to 5 per 15 minutes - space test runs accordingly.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Define 5 personas with their profile data and food selections
 */
const PERSONAS = [
  {
    id: 'persona1-veg-chicken',
    name: 'Vegetarian + Chicken/Eggs',
    description: 'User selects vegetarian, but then adds chicken and eggs',
    profile: {
      age: 28,
      heightCm: 170,
      currentWeightKg: 75,
      goalWeightKg: 72,
      primaryGoal: 'maintenance',
      fitnessLevel: 'moderately-active',
      dietType: 'vegetarian',
      cuisinePreference: 'south-indian',
      religion: 'Hindu',
      languageCommunity: 'Telugu',
      sex: 'other'
    },
    foodList: ['Idli', 'Dosa', 'Chicken', 'Eggs', 'Sambar', 'Rasam'],
    validation: {
      type: 'effective-diet',
      expectNonVeg: true,
      description: 'Generated plan must contain chicken or egg meals'
    }
  },
  {
    id: 'persona2-strict-vegan',
    name: 'Strict Vegan',
    description: 'Vegan user selects only plant-based foods',
    profile: {
      age: 32,
      heightCm: 165,
      currentWeightKg: 68,
      goalWeightKg: 62,
      primaryGoal: 'weight-loss',
      fitnessLevel: 'very-active',
      dietType: 'vegan',
      cuisinePreference: 'north-indian',
      religion: 'Hindu',
      languageCommunity: 'Hindi',
      sex: 'other'
    },
    foodList: ['Roti', 'Dal', 'Spinach', 'Beans', 'Nuts'],
    validation: {
      type: 'dairy-free',
      expectNoDairy: true,
      description: 'Generated plan must be dairy-free (no paneer, ghee, milk, yogurt, cheese)',
      dairyKeywords: ['paneer', 'ghee', 'milk', 'yogurt', 'cheese', 'butter', 'cream']
    }
  },
  {
    id: 'persona3-meal-rotation',
    name: 'Meal Rotation Validation',
    description: 'Same diet type, validate different meal variety across 6-month plan',
    profile: {
      age: 25,
      heightCm: 175,
      currentWeightKg: 72,
      goalWeightKg: 68,
      primaryGoal: 'weight-loss',
      fitnessLevel: 'very-active',
      dietType: 'non-vegetarian',
      cuisinePreference: 'continental',
      religion: 'Christian',
      languageCommunity: 'Other',
      sex: 'other'
    },
    foodList: ['Chicken', 'Fish', 'Broccoli', 'Mushrooms', 'Olive Oil', 'Brown Rice'],
    validation: {
      type: 'meal-rotation',
      minRotationPct: 70,
      description: 'Compare meals from first 4 weeks with weeks 4-8. At least 70% should be different'
    }
  },
  {
    id: 'persona4-workout-rotation',
    name: 'Workout Rotation Validation',
    description: 'Same fitness level, validate varied workout types across 6-month plan',
    profile: {
      age: 30,
      heightCm: 172,
      currentWeightKg: 80,
      goalWeightKg: 78,
      primaryGoal: 'maintenance',
      fitnessLevel: 'very-active',
      dietType: 'non-vegetarian',
      cuisinePreference: 'south-indian',
      religion: 'Hindu',
      languageCommunity: 'Telugu',
      sex: 'other'
    },
    foodList: ['Idli', 'Dosa', 'Chicken', 'Fish', 'Vegetables'],
    validation: {
      type: 'workout-rotation',
      description: 'Compare workouts from days 1-30 with days 31-60. Workout names should show rotation'
    }
  },
  {
    id: 'persona5-backward-compat',
    name: 'Backward Compatibility',
    description: 'Pure vegetarian with no non-veg items selected',
    profile: {
      age: 27,
      heightCm: 168,
      currentWeightKg: 70,
      goalWeightKg: 68,
      primaryGoal: 'maintenance',
      fitnessLevel: 'moderately-active',
      dietType: 'vegetarian',
      cuisinePreference: 'south-indian',
      religion: 'Hindu',
      languageCommunity: 'Telugu',
      sex: 'other'
    },
    foodList: ['Idli', 'Dosa', 'Sambar', 'Rasam', 'Vegetables'],
    validation: {
      type: 'strict-vegetarian',
      expectNoNonVeg: true,
      description: 'Generated plan must be 100% vegetarian (no non-veg meals)'
    }
  }
];

/**
 * Make HTTP request using fetch API
 */
async function httpRequest(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: data,
  };
}

/**
 * Register a new user and return auth cookie
 */
async function registerUser(firstName, lastName) {
  const email = `${firstName.toLowerCase()}-${Date.now()}@test.local`;
  const password = 'Password@123';
  const name = `${firstName} ${lastName}`;

  try {
    const response = await httpRequest('POST', '/api/auth/register', {
      email,
      password,
      name,
    });

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Registration limit: 5 per 15 minutes. Please try again later.');
    }

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Registration failed: ${response.body?.error || 'Unknown error'}`);
    }

    // Add small delay to ensure user is persisted
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Login to get auth cookie
    const loginResponse = await httpRequest('POST', '/api/auth/login', {
      email,
      password,
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.body?.error || 'Unknown error'}`);
    }

    // Extract cookie from Set-Cookie header
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (!setCookieHeader) {
      throw new Error('No auth cookie received');
    }

    // Parse the cookie - typically format: health_token=...; Path=/; HttpOnly; ...
    const cookieMatch = setCookieHeader.match(/health_token=[^;]+/);
    if (!cookieMatch) {
      throw new Error('Invalid cookie format');
    }

    return {
      email,
      password,
      name,
      cookie: cookieMatch[0],
    };
  } catch (err) {
    throw new Error(`User registration failed: ${err.message}`);
  }
}

/**
 * Update user profile with persona data
 */
async function updateProfile(persona, cookie) {
  try {
    const response = await httpRequest(
      'POST',
      '/api/profile/onboarding',
      persona.profile,
      { Cookie: cookie }
    );

    if (response.status !== 200) {
      throw new Error(`Profile update failed: ${response.body?.error || 'Unknown error'}`);
    }

    return true;
  } catch (err) {
    throw new Error(`Profile update failed: ${err.message}`);
  }
}

/**
 * Update food preferences for user
 */
async function updateFoodPreferences(foodList, cookie) {
  try {
    // Format food list - map item names to objects with category
    const formattedFoodList = foodList.map((item) => {
      // Categorize common foods
      const categories = {
        // Grains
        'Idli': 'grains',
        'Dosa': 'grains',
        'Roti': 'grains',
        'Brown Rice': 'grains',
        // Vegetables
        'Spinach': 'vegetables',
        'Broccoli': 'vegetables',
        'Mushrooms': 'vegetables',
        'Vegetables': 'vegetables',
        // Proteins
        'Chicken': 'proteins',
        'Fish': 'proteins',
        'Eggs': 'proteins',
        'Dal': 'proteins',
        'Beans': 'proteins',
        'Nuts': 'proteins',
        // Dairy
        'Sambar': 'dairy', // Contains lentils and spices, typically dairy-friendly
        'Rasam': 'beverages',
        // Oils and fats
        'Olive Oil': 'snacks',
        'Ghee': 'dairy'
      };

      return {
        name: item,
        category: categories[item] || 'snacks',
        custom: false
      };
    });

    const response = await httpRequest(
      'PATCH',
      '/api/profile',
      { foodList: formattedFoodList },
      { Cookie: cookie }
    );

    if (response.status !== 200) {
      throw new Error(`Food preferences update failed: ${response.body?.error || 'Unknown error'}`);
    }

    return true;
  } catch (err) {
    throw new Error(`Food preferences update failed: ${err.message}`);
  }
}

/**
 * Fetch generated meal and workout plan
 */
async function fetchPlan(cookie) {
  try {
    const response = await httpRequest('GET', '/api/profile/plan', null, { Cookie: cookie });

    if (response.status !== 200) {
      throw new Error(`Plan fetch failed: ${response.body?.error || 'Unknown error'}`);
    }

    // Debug logging
    if (process.env.DEBUG_PLAN) {
      console.log('🔍 Plan structure:', JSON.stringify(response.body, null, 2).substring(0, 500));
    }

    return response.body;
  } catch (err) {
    throw new Error(`Plan fetch failed: ${err.message}`);
  }
}

/**
 * Validate plan against persona expectations
 */
function validatePersonaExpectations(persona, plan) {
  const { validation } = persona;
  const issues = [];

  // Plan structure: diet is array of months, each may be null
  if (!Array.isArray(plan.diet)) {
    issues.push('Invalid plan structure: diet is not an array');
    return issues;
  }

  if (!Array.isArray(plan.workout)) {
    issues.push('Invalid plan structure: workout is not an array');
    return issues;
  }

  // Flatten all meals from all months for validation
  const allMeals = [];
  const allWorkouts = [];

  // Extract all meals from months
  for (let monthIdx = 0; monthIdx < plan.diet.length; monthIdx++) {
    const month = plan.diet[monthIdx];
    if (month && typeof month === 'object' && Array.isArray(month.weekdays)) {
      month.weekdays.forEach((day) => {
        if (day && day.breakfast) allMeals.push({ name: day.breakfast, type: 'breakfast' });
        if (day && day.lunch) allMeals.push({ name: day.lunch, type: 'lunch' });
        if (day && day.dinner) allMeals.push({ name: day.dinner, type: 'dinner' });
        if (day && Array.isArray(day.snacks)) {
          day.snacks.forEach((snack) => allMeals.push({ name: snack, type: 'snack' }));
        }
      });
    }
  }

  // Extract all workouts from months
  for (let monthIdx = 0; monthIdx < plan.workout.length; monthIdx++) {
    const month = plan.workout[monthIdx];
    if (month && typeof month === 'object' && Array.isArray(month.schedule)) {
      month.schedule.forEach((day) => {
        if (day && day.day) allWorkouts.push({ name: day.day, focus: day.focus });
      });
    }
  }

  if (allMeals.length === 0) {
    // Log some debug info
    console.log(`    ⚠️  Diet array length: ${plan.diet.length}, first entry type: ${typeof plan.diet[0]}`);
    issues.push('No meals found in any month of the plan');
    return issues;
  }

  if (allWorkouts.length === 0 && (validation.type === 'workout-rotation')) {
    console.log(`    ⚠️  Workout array length: ${plan.workout.length}`);
    issues.push('No workouts found in plan');
    return issues;
  }

  console.log(`    📊 Plan has ${allMeals.length} total meals and ${allWorkouts.length} workouts`);

  // Validation type: effective-diet (non-veg meals expected)
  if (validation.type === 'effective-diet') {
    const nonVegKeywords = ['chicken', 'egg', 'fish', 'meat', 'mutton', 'lamb'];
    const hasNonVeg = allMeals.some((meal) =>
      nonVegKeywords.some((keyword) => meal.name?.toLowerCase().includes(keyword))
    );

    if (!hasNonVeg) {
      issues.push('No non-veg meals found. Expected chicken, egg, or fish meals.');
    } else {
      console.log('    ✓ Non-veg meals detected');
    }
  }

  // Validation type: dairy-free (vegan compliance)
  if (validation.type === 'dairy-free') {
    const dairyKeywords = validation.dairyKeywords || ['paneer', 'ghee', 'milk', 'yogurt', 'cheese', 'butter', 'cream'];
    const hasDairy = allMeals.some((meal) =>
      dairyKeywords.some((keyword) => meal.name?.toLowerCase().includes(keyword))
    );

    if (hasDairy) {
      const dairyMeals = allMeals.filter((meal) =>
        dairyKeywords.some((keyword) => meal.name?.toLowerCase().includes(keyword))
      );
      issues.push(`Found dairy products in ${dairyMeals.length} meals`);
    } else {
      console.log('    ✓ No dairy products detected');
    }
  }

  // Validation type: meal-rotation (compare first and second month)
  if (validation.type === 'meal-rotation') {
    if (plan.diet.length < 2) {
      issues.push('Plan does not have at least 2 months');
    } else {
      const month0_meals = [];
      const month1_meals = [];

      if (plan.diet[0] && typeof plan.diet[0] === 'object' && Array.isArray(plan.diet[0].weekdays)) {
        plan.diet[0].weekdays.forEach((day) => {
          if (day && day.lunch) month0_meals.push(day.lunch.toLowerCase());
          if (day && day.dinner) month0_meals.push(day.dinner.toLowerCase());
        });
      }

      if (plan.diet[1] && typeof plan.diet[1] === 'object' && Array.isArray(plan.diet[1].weekdays)) {
        plan.diet[1].weekdays.forEach((day) => {
          if (day && day.lunch) month1_meals.push(day.lunch.toLowerCase());
          if (day && day.dinner) month1_meals.push(day.dinner.toLowerCase());
        });
      }

      if (month0_meals.length === 0 || month1_meals.length === 0) {
        issues.push('Not enough meals to compare rotation');
      } else {
        const month0_unique = new Set(month0_meals);
        const month1_unique = new Set(month1_meals);

        let overlap = 0;
        month1_unique.forEach((meal) => {
          if (month0_unique.has(meal)) overlap++;
        });

        const rotationPct = Math.round(((month1_unique.size - overlap) / month1_unique.size) * 100);

        if (rotationPct < validation.minRotationPct) {
          issues.push(`Meal rotation is ${rotationPct}%, expected at least ${validation.minRotationPct}%`);
        } else {
          console.log(`    ✓ Meal rotation detected (${rotationPct}% different)`);
        }
      }
    }
  }

  // Validation type: workout-rotation (compare first and second month)
  if (validation.type === 'workout-rotation') {
    if (plan.workout.length < 2) {
      issues.push('Plan does not have at least 2 workout months');
    } else {
      const month0_workouts = [];
      const month1_workouts = [];

      if (plan.workout[0] && typeof plan.workout[0] === 'object' && Array.isArray(plan.workout[0].schedule)) {
        plan.workout[0].schedule.forEach((day) => {
          if (day && day.focus) month0_workouts.push(day.focus.toLowerCase());
        });
      }

      if (plan.workout[1] && typeof plan.workout[1] === 'object' && Array.isArray(plan.workout[1].schedule)) {
        plan.workout[1].schedule.forEach((day) => {
          if (day && day.focus) month1_workouts.push(day.focus.toLowerCase());
        });
      }

      if (month0_workouts.length === 0 || month1_workouts.length === 0) {
        issues.push('Not enough workouts to compare rotation');
      } else {
        const month0_pattern = month0_workouts.join(',');
        const month1_pattern = month1_workouts.join(',');

        if (month0_pattern === month1_pattern) {
          issues.push('Workout patterns are identical in both months');
        } else {
          console.log('    ✓ Workout rotation detected');
        }
      }
    }
  }

  // Validation type: strict-vegetarian
  if (validation.type === 'strict-vegetarian') {
    const nonVegKeywords = ['chicken', 'egg', 'fish', 'meat', 'mutton', 'lamb', 'eggs'];
    const hasNonVeg = allMeals.some((meal) =>
      nonVegKeywords.some((keyword) => meal.name?.toLowerCase().includes(keyword))
    );

    if (hasNonVeg) {
      const nonVegMeals = allMeals.filter((meal) =>
        nonVegKeywords.some((keyword) => meal.name?.toLowerCase().includes(keyword))
      );
      issues.push(`Found non-veg meals in ${nonVegMeals.length} meals`);
    } else {
      console.log('    ✓ All meals are vegetarian');
    }
  }

  return issues;
}

/**
 * Test a single persona end-to-end
 */
async function testPersona(persona) {
  console.log(`\n📋 Testing ${persona.id}...`);
  console.log(`   ${persona.description}`);

  const results = {
    personaId: persona.id,
    personaName: persona.name,
    timestamp: new Date().toISOString(),
    steps: [],
    passed: true,
  };

  try {
    // Step 1: Register user
    console.log('   ⏳ Registering user...');
    const [firstName, ...rest] = persona.name.split(' ');
    const lastName = rest.join(' ') || 'Test';
    const user = await registerUser(firstName, lastName);
    results.steps.push({ name: 'registration', status: 'passed', email: user.email });
    console.log('   ✓ Registration complete');

    // Step 2: Update profile
    console.log('   ⏳ Updating profile...');
    await updateProfile(persona, user.cookie);
    results.steps.push({ name: 'profile-update', status: 'passed' });
    console.log('   ✓ Profile updated');

    // Step 3: Set food preferences
    console.log('   ⏳ Setting food preferences...');
    await updateFoodPreferences(persona.foodList, user.cookie);
    results.steps.push({ name: 'food-preferences', status: 'passed', foodList: persona.foodList });
    console.log('   ✓ Food preferences saved');

    // Step 4: Fetch generated plan
    console.log('   ⏳ Fetching generated plan...');
    const plan = await fetchPlan(user.cookie);
    results.steps.push({ name: 'plan-generation', status: 'passed' });
    console.log(`   ✓ Plan generated`);

    // Debug: Save plan structure for inspection
    if (process.env.SAVE_PLAN) {
      results.steps.push({
        name: 'debug-plan',
        status: 'info',
        plan: {
          dietKeys: plan.diet ? Object.keys(plan.diet) : null,
          workoutKeys: plan.workout ? Object.keys(plan.workout) : null,
          firstMonth: plan.diet && plan.diet[0] ? Object.keys(plan.diet[0]) : null
        }
      });
    }

    // Step 5: Validate expectations
    console.log('   ⏳ Validating expectations...');
    const validationIssues = validatePersonaExpectations(persona, plan);

    if (validationIssues.length === 0) {
      results.steps.push({ name: 'validation', status: 'passed' });
      console.log('   ✓ Validation passed');
    } else {
      results.steps.push({
        name: 'validation',
        status: 'failed',
        issues: validationIssues,
      });
      results.passed = false;
      console.log('   ✗ Validation failed:');
      validationIssues.forEach((issue) => console.log(`      - ${issue}`));
    }
  } catch (err) {
    results.passed = false;
    const stepIndex = results.steps.length;
    const stepNames = ['registration', 'profile-update', 'food-preferences', 'plan-generation', 'validation'];
    results.steps.push({
      name: stepNames[stepIndex] || 'unknown',
      status: 'error',
      error: err.message,
    });
    console.log(`   ✗ Error at ${stepNames[stepIndex]}: ${err.message}`);
  }

  return results;
}

/**
 * Run all persona tests
 */
async function runAllTests() {
  console.log('\n═════════════════════════════════════════════════════════');
  console.log('  🚀 Phase 5: Persona Testing Infrastructure');
  console.log('═════════════════════════════════════════════════════════');
  console.log(`  BASE_URL: ${BASE_URL}`);
  console.log(`  📊 Testing ${PERSONAS.length} personas...`);
  console.log('═════════════════════════════════════════════════════════\n');

  const results = [];

  // Test each persona sequentially
  for (const persona of PERSONAS) {
    const result = await testPersona(persona);
    results.push(result);

    // Add a small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n═════════════════════════════════════════════════════════');
  console.log('  📊 Test Summary');
  console.log('═════════════════════════════════════════════════════════');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const successRate = Math.round((passed / results.length) * 100);

  console.log(`  Total Personas: ${results.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Success Rate: ${successRate}%\n`);

  results.forEach((r) => {
    const status = r.passed ? '✓' : '✗';
    console.log(`  ${status} ${r.personaName}`);
    r.steps.forEach((step) => {
      const stepStatus = step.status === 'passed' ? '  ✓' : '  ✗';
      console.log(`    ${stepStatus} ${step.name}`);
    });
  });

  // Save results to JSON file
  const resultsFile = 'tests/e2e/persona-test-results.json';
  try {
    const fs = require('fs');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n✅ Results saved to: ${resultsFile}`);
  } catch (err) {
    console.error(`Failed to save results: ${err.message}`);
  }

  console.log('═════════════════════════════════════════════════════════\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
