let currentRecipeFilter = 'all';

window._recipeShowAll = false;

function toggleCuisineFilter(btn) {
  window._recipeShowAll = !window._recipeShowAll;
  btn.textContent = window._recipeShowAll ? '🍛 My Cuisine Only' : '🌍 Show All Cuisines';
  renderRecipes(currentRecipeFilter);
}

const RECIPES = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────────
  { id:0, icon:"🥞", cat:"breakfast", name:"Pesarattu (Moong Dal Crepes)", time:"25 min", cal:240, p:12, f:4, c:38,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","high-protein","Telugu-traditional"],
    ingredients:[
      "1 cup whole green moong dal (soaked 6-8 hrs)",
      "1 tsp grated ginger",
      "2 green chilies",
      "Salt to taste",
      "¼ tsp cumin seeds",
      "Oil or ghee for tawa (1 tsp per crepe)",
      "Optional: finely chopped onion for topping"
    ],
    steps:[
      "Soak green moong dal in water for at least 6 hours or overnight.",
      "Drain and blend dal with ginger, green chilies, cumin, and salt into a smooth batter. Add water gradually — batter should be thick but pourable.",
      "Heat a non-stick tawa on medium-high heat. Sprinkle a few drops of water to test — it should sizzle.",
      "Pour one ladle of batter and spread in a circular motion to make a thin crepe (like dosa).",
      "Drizzle ½ tsp ghee or oil on the edges. Optionally sprinkle finely chopped onion on top.",
      "Cook for 2–3 minutes until edges turn golden and crispy. Fold and serve with Allam Chutney.",
      "Tip: Batter made the previous night improves crispiness. Don't add urad dal — that's the traditional recipe."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:120, proteinG:12, carbsG:38, fatG:4, servingSizeG:200 }
  },
  { id:1, icon:"🍳", cat:"breakfast", name:"Andhra Anda Bhurji (Egg Scramble)", time:"12 min", cal:280, p:18, f:20, c:5,
    cuisine: 'south-indian',
    dietType: ['eggetarian','non-vegetarian'],
    tags:["thyroid-safe","high-protein","quick","Telugu-traditional"],
    ingredients:[
      "3 large eggs",
      "1 medium onion, finely chopped",
      "1 medium tomato, finely chopped",
      "1 green chili, chopped",
      "¼ tsp turmeric powder",
      "½ tsp red chili powder",
      "Salt to taste",
      "1 tsp ghee or oil",
      "Fresh coriander leaves for garnish",
      "Curry leaves (5–6)"
    ],
    steps:[
      "Heat ghee in a pan over medium heat. Add curry leaves — they will splutter.",
      "Add finely chopped onion and sauté for 3–4 minutes until golden.",
      "Add green chili and tomato. Cook for 2 minutes until tomato softens.",
      "Add turmeric, red chili powder, and salt. Stir well.",
      "Crack 3 eggs directly into the pan. Do NOT stir immediately — let whites set for 30 seconds.",
      "Now scramble everything together, breaking yolks and mixing with masala.",
      "Cook on medium-low for 2 minutes stirring continuously until eggs are just set (not dry).",
      "Garnish with fresh coriander. Serve hot with Pesarattu or Phulka."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:187, proteinG:18, carbsG:5, fatG:20, servingSizeG:150 }
  },
  { id:2, icon:"🍳", cat:"breakfast", name:"Masala Omelet (Telugu Style)", time:"10 min", cal:265, p:18, f:20, c:4,
    cuisine: 'south-indian',
    dietType: ['eggetarian','non-vegetarian'],
    tags:["thyroid-safe","quick","high-protein"],
    ingredients:[
      "3 large eggs",
      "1 small onion, finely chopped",
      "1 green chili, finely chopped",
      "¼ capsicum, finely chopped",
      "¼ tsp turmeric",
      "Salt and pepper to taste",
      "1 tsp ghee",
      "5–6 fresh curry leaves, chopped",
      "Fresh coriander, chopped"
    ],
    steps:[
      "Beat eggs with salt, turmeric, and pepper until well combined.",
      "Mix in all chopped vegetables (onion, chili, capsicum, curry leaves, coriander).",
      "Heat a flat tawa or non-stick pan over medium heat. Add 1 tsp ghee.",
      "Pour egg mixture. Spread gently to cover the pan evenly.",
      "Cook for 2–3 minutes until bottom is golden and set.",
      "Carefully flip with a spatula and cook the other side for 1 minute.",
      "Fold in half and serve with any chutney of choice."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:221, proteinG:18, carbsG:4, fatG:20, servingSizeG:120 }
  },
  { id:3, icon:"🥣", cat:"breakfast", name:"Oats Upma (Oat Rava Upma)", time:"15 min", cal:220, p:8, f:5, c:35,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","fiber-rich","weight-loss"],
    ingredients:[
      "40g (½ cup) rolled oats",
      "1 tsp mustard seeds",
      "1 tsp chana dal",
      "1 tsp urad dal",
      "1 medium onion, sliced",
      "1 green chili",
      "8–10 curry leaves",
      "1 medium tomato, chopped",
      "¼ tsp turmeric",
      "Salt to taste",
      "1 tsp oil or ghee",
      "Fresh coriander for garnish",
      "Squeeze of lemon"
    ],
    steps:[
      "Dry roast oats in a pan for 3–4 minutes on medium heat until slightly golden and fragrant. Set aside.",
      "In the same pan, heat oil. Add mustard seeds — wait for them to splutter.",
      "Add chana dal and urad dal. Fry for 1 minute until golden.",
      "Add curry leaves, onion, and green chili. Sauté 3–4 minutes until onion is translucent.",
      "Add tomato and turmeric. Cook 2 minutes until tomato softens.",
      "Add 1 cup hot water and salt. Bring to a boil.",
      "Add roasted oats and stir well. Reduce heat to low.",
      "Cover and cook for 3–4 minutes, stirring once, until all water is absorbed.",
      "Squeeze lemon juice, garnish with coriander. Serve with coconut chutney."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:110, proteinG:8, carbsG:35, fatG:5, servingSizeG:200 }
  },
  { id:4, icon:"🥣", cat:"breakfast", name:"Rava Upma (Semolina Upma)", time:"20 min", cal:210, p:6, f:5, c:36,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","light"],
    ingredients:[
      "½ cup (60g) fine semolina (rava/sooji)",
      "1 tsp mustard seeds",
      "1 tsp chana dal",
      "1 tsp urad dal",
      "1 medium onion, finely chopped",
      "1 green chili, slit",
      "8–10 curry leaves",
      "¼ tsp ginger, grated",
      "2 tbsp fresh/frozen peas (optional)",
      "Salt to taste",
      "1 tsp ghee + 1 tsp oil",
      "Lemon juice"
    ],
    steps:[
      "Dry roast rava in a pan on medium heat for 4–5 minutes, stirring continuously, until light golden and aromatic. Set aside to cool.",
      "In a pot, heat ghee and oil together. Add mustard seeds and wait for them to pop.",
      "Add dals, curry leaves, and ginger. Fry 1 minute.",
      "Add onion and green chili. Sauté until onion is soft and lightly golden (5 min).",
      "Add 1.5 cups water, peas, and salt. Bring to a vigorous boil.",
      "Reduce heat to low. While stirring continuously, add roasted rava in a slow, steady stream.",
      "Keep stirring to prevent lumps. Cover and cook on low heat for 3–4 minutes.",
      "Add a squeeze of lemon, fluff with a fork, and serve with coconut chutney."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:105, proteinG:6, carbsG:36, fatG:5, servingSizeG:200 }
  },
  { id:5, icon:"🍚", cat:"breakfast", name:"Idli with Sambar & Chutney", time:"20 min (store-bought batter)", cal:200, p:6, f:2, c:40,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","light","fermented"],
    ingredients:[
      "6 idli (use 2–3 per serving)",
      "200ml Andhra Sambar (see Sambar recipe)",
      "Coconut chutney or Allam chutney to serve",
      "For quick idli batter: 2 cups idli rice + 1 cup urad dal (soak 6 hrs, grind, ferment 8–10 hrs)"
    ],
    steps:[
      "Grease idli moulds lightly with oil.",
      "Fill each mould ¾ full with fermented batter.",
      "Steam in an idli cooker or pressure cooker (without weight) for 10–12 minutes.",
      "Insert a toothpick — it should come out clean when done.",
      "Let cool for 2 minutes before removing with a wet spoon.",
      "Serve hot with warm Andhra Sambar poured on top and coconut/allam chutney on the side.",
      "Tip: For weight loss, eat 2 idli max per serving. Pair with protein-rich sambar."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:67, proteinG:6, carbsG:40, fatG:2, servingSizeG:300 }
  },
  { id:6, icon:"🧀", cat:"breakfast", name:"Paneer Bhurji (Scrambled Cottage Cheese)", time:"15 min", cal:235, p:14, f:17, c:6,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","vegetarian","high-protein"],
    ingredients:[
      "100g paneer, crumbled",
      "1 small onion, finely chopped",
      "1 small tomato, finely chopped",
      "1 green chili, chopped",
      "¼ tsp turmeric",
      "½ tsp cumin seeds",
      "½ tsp coriander powder",
      "¼ tsp garam masala",
      "Salt to taste",
      "1 tsp ghee",
      "Fresh coriander for garnish"
    ],
    steps:[
      "Heat ghee in a pan. Add cumin seeds and let them sizzle.",
      "Add onion and green chili. Sauté for 3 minutes until softened.",
      "Add tomato with turmeric, coriander powder, and salt. Cook for 3 minutes until oil separates.",
      "Add crumbled paneer and mix gently. Cook on medium heat for 3–4 minutes.",
      "Add garam masala and stir. Do not over-cook or paneer becomes rubbery.",
      "Garnish with fresh coriander. Serve with 1 Phulka or alongside Pesarattu."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:157, proteinG:14, carbsG:6, fatG:17, servingSizeG:150 }
  },
  // ── DAL & VEGETARIAN CURRIES ──────────────────────────────────────────────
  { id:7, icon:"🍲", cat:"lunch", name:"Kandi Pappu (Andhra Toor Dal)", time:"25 min", cal:185, p:11, f:5, c:26,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","high-protein","daily-staple"],
    ingredients:[
      "½ cup toor dal (pigeon pea lentil)",
      "1 medium tomato, chopped",
      "¼ tsp turmeric",
      "Salt to taste",
      "For tadka: 1 tsp ghee, ½ tsp mustard seeds, ½ tsp cumin, 2 dry red chilies, 8–10 curry leaves, 3 garlic cloves (crushed), a pinch of hing (asafoetida)"
    ],
    steps:[
      "Wash toor dal. Pressure cook with tomato, turmeric, salt, and 1.5 cups water for 3–4 whistles until very soft.",
      "Mash the cooked dal well with a ladle until smooth. Adjust consistency with water if too thick.",
      "For tadka (tempering): Heat ghee in a small pan. Add mustard seeds and wait for them to pop.",
      "Add cumin, dry red chilies, curry leaves, and crushed garlic. Fry for 30 seconds until fragrant.",
      "Add hing. Pour this tadka immediately over the cooked dal and mix well.",
      "Taste and adjust salt. Serve hot over rice or with Phulka.",
      "Tip: Kandi Pappu is the soul of Andhra meals. Ghee tadka is non-negotiable for flavor!"
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:93, proteinG:11, carbsG:26, fatG:5, servingSizeG:200 }
  },
  { id:8, icon:"🥬", cat:"lunch", name:"Palakura Pappu (Spinach Dal)", time:"30 min", cal:165, p:11, f:4, c:22,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","iron-rich","Telugu-traditional"],
    ingredients:[
      "½ cup toor dal or moong dal",
      "1 cup fresh spinach (palakura), washed and chopped",
      "1 medium onion, chopped",
      "1 medium tomato, chopped",
      "2 green chilies",
      "¼ tsp turmeric",
      "Salt to taste",
      "For tadka: 1 tsp ghee, ½ tsp mustard seeds, ½ tsp cumin, curry leaves, 2 garlic cloves, hing"
    ],
    steps:[
      "Wash dal. In a pressure cooker, add dal, spinach, onion, tomato, green chilies, turmeric, salt, and 1.5 cups water.",
      "Cook for 3–4 whistles. Open once pressure releases naturally.",
      "Mash everything together. The spinach will blend into the dal beautifully.",
      "Prepare tadka: Heat ghee, add mustard seeds. Once they pop, add cumin, curry leaves, garlic, and hing.",
      "Pour tadka over the dal. Stir and serve.",
      "Thyroid note: Spinach must be cooked (not raw) for thyroid safety. Cooking neutralizes goitrogens."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:83, proteinG:11, carbsG:22, fatG:4, servingSizeG:200 }
  },
  { id:9, icon:"🍲", cat:"lunch", name:"Sorakaya Pappu (Bottle Gourd Dal)", time:"30 min", cal:145, p:8, f:3, c:20,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","cooling","weight-loss"],
    ingredients:[
      "½ cup toor dal",
      "1 cup bottle gourd (sorakaya), peeled and cubed",
      "1 medium tomato",
      "2 green chilies",
      "¼ tsp turmeric",
      "Salt to taste",
      "For tadka: 1 tsp ghee, mustard seeds, cumin, curry leaves, 2 garlic cloves, hing, 1 dry red chili"
    ],
    steps:[
      "Wash dal. Combine dal, bottle gourd, tomato, green chilies, turmeric, and salt in a pressure cooker.",
      "Add 1.5 cups water. Cook for 3 whistles.",
      "The bottle gourd will become very soft and melt into the dal. Mash gently.",
      "Prepare tadka: Heat ghee, add mustard seeds, cumin, curry leaves, garlic, red chili, and hing.",
      "Pour tadka over dal and serve hot with rice.",
      "Tip: Sorakaya (bottle gourd) is low-calorie and extremely cooling — ideal for summer and weight loss."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:73, proteinG:8, carbsG:20, fatG:3, servingSizeG:200 }
  },
  { id:10, icon:"🥘", cat:"lunch", name:"Andhra Sambar", time:"35 min", cal:125, p:5, f:3, c:20,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","probiotic","daily-staple"],
    ingredients:[
      "½ cup toor dal",
      "1 drumstick (murungakkai), cut in 2-inch pieces",
      "1 small carrot, cubed",
      "½ cup small onions (or 1 large onion, quartered)",
      "1 medium tomato",
      "Lemon-size tamarind ball (soaked in warm water, extract pulp)",
      "2 tsp Andhra sambar powder (or MTR brand)",
      "¼ tsp turmeric",
      "Salt to taste",
      "For tadka: 1 tsp oil, mustard seeds, curry leaves, 2 dry red chilies, hing"
    ],
    steps:[
      "Pressure cook toor dal with turmeric and 1 cup water for 3 whistles. Mash well.",
      "In a separate pot, add tamarind extract (½ cup water), vegetables, tomato, onion, sambar powder, and salt.",
      "Boil vegetables on medium heat for 10–12 minutes until cooked through.",
      "Add mashed dal to the vegetable pot. Add 1 cup more water and simmer for 5 minutes.",
      "Prepare tadka: Heat oil, add mustard seeds. Once popped, add curry leaves, red chilies, and hing.",
      "Pour tadka into sambar. Simmer for 2 more minutes. Adjust salt and tanginess.",
      "Andhra sambar is thinner and spicier than Tamil sambar — perfect with idli, dosa, or rice."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:63, proteinG:5, carbsG:20, fatG:3, servingSizeG:200 }
  },
  { id:11, icon:"🫘", cat:"lunch", name:"Senagapappu Curry (Chana Dal Curry)", time:"30 min", cal:205, p:10, f:5, c:30,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","high-fiber"],
    ingredients:[
      "½ cup chana dal (split Bengal gram)",
      "1 large onion, finely chopped",
      "2 medium tomatoes, chopped",
      "1 tsp ginger-garlic paste",
      "½ tsp turmeric",
      "1 tsp red chili powder",
      "1 tsp coriander powder",
      "½ tsp garam masala",
      "Salt to taste",
      "1 tsp oil or ghee",
      "Curry leaves, mustard seeds"
    ],
    steps:[
      "Soak chana dal for 30 minutes. Cook in pressure cooker with turmeric for 2 whistles (should hold shape, not mushy).",
      "Heat oil in a pan. Add mustard seeds and curry leaves.",
      "Add onion and fry until golden brown (6–8 minutes).",
      "Add ginger-garlic paste and fry for 1 minute.",
      "Add tomatoes, red chili powder, coriander powder, and salt. Cook until oil separates.",
      "Add cooked chana dal and ½ cup water. Simmer for 5 minutes.",
      "Add garam masala, stir, and serve with Phulka or rice."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:103, proteinG:10, carbsG:30, fatG:5, servingSizeG:200 }
  },
  { id:12, icon:"🫘", cat:"lunch", name:"Soyabean Curry (Thyroid-Safe)", time:"30 min", cal:155, p:12, f:5, c:16,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","high-protein","vegetarian"],
    ingredients:[
      "100g dry soyabeans (soaked overnight, cooked — this gives ~250g cooked)",
      "1 large onion, chopped",
      "2 tomatoes, chopped",
      "1 tsp ginger-garlic paste",
      "½ tsp turmeric",
      "1 tsp red chili powder",
      "1 tsp coriander powder",
      "½ tsp cumin powder",
      "Salt to taste",
      "1 tsp oil",
      "Fresh coriander"
    ],
    steps:[
      "Always cook soyabeans thoroughly — soak overnight, pressure cook fully. Never use raw or minimally cooked soy.",
      "Soak soyabeans overnight. Drain and pressure cook with fresh water for 4–5 whistles until completely tender.",
      "Heat oil in a pan. Add onion and fry until deep golden (8 min).",
      "Add ginger-garlic paste, fry 1 minute. Add tomatoes and all dry spices.",
      "Cook masala until oil separates from the sides (8–10 minutes).",
      "Add cooked soyabeans and ½ cup water. Mix well and simmer 5 minutes.",
      "Serve with 2 Phulka or ½ cup rice. Limit to 100g cooked soy, max 3x per week."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:78, proteinG:12, carbsG:16, fatG:5, servingSizeG:200 }
  },
  { id:13, icon:"🫘", cat:"lunch", name:"Rajma Curry (Kidney Bean Curry)", time:"40 min", cal:225, p:12, f:4, c:34,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","high-fiber","high-protein"],
    ingredients:[
      "½ cup red kidney beans (soaked overnight)",
      "2 large onions, finely chopped",
      "2 tomatoes, pureed",
      "1 tsp ginger-garlic paste",
      "1 tsp cumin seeds",
      "½ tsp turmeric",
      "1 tsp red chili powder",
      "1 tsp coriander powder",
      "½ tsp garam masala",
      "Salt to taste",
      "1 tsp oil"
    ],
    steps:[
      "Pressure cook soaked rajma with salt and turmeric for 5–6 whistles until completely tender. Reserve cooking water.",
      "Heat oil in a heavy pan. Add cumin seeds — let them splutter.",
      "Add onions and cook on medium heat for 10 minutes until deep brown.",
      "Add ginger-garlic paste, fry 2 minutes. Add tomato puree and cook until oil separates.",
      "Add red chili powder, coriander powder, and salt. Cook 3 more minutes.",
      "Add cooked rajma with its water. Mash a few beans with the back of the spoon to thicken the gravy.",
      "Simmer on low heat for 10 minutes. Add garam masala and serve with rice or Phulka."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:113, proteinG:12, carbsG:34, fatG:4, servingSizeG:200 }
  },
  { id:14, icon:"🍆", cat:"lunch", name:"Gutti Vankaya Curry (Stuffed Brinjal Curry)", time:"30 min", cal:165, p:4, f:9, c:19,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","festive","aromatic"],
    ingredients:[
      "6 small brinjals (vankaya), cross-slit at bottom but stem intact",
      "3 tbsp peanuts, roasted and roughly crushed",
      "2 tbsp dry coconut, grated",
      "1 tbsp sesame seeds (nuvvulu), roasted",
      "1 tsp red chili powder",
      "½ tsp turmeric",
      "1 tsp coriander powder",
      "¼ tsp cumin powder",
      "Salt to taste",
      "2 tsp oil",
      "1 onion, finely chopped",
      "½ tsp tamarind paste",
      "Curry leaves"
    ],
    steps:[
      "Make stuffing: Mix peanuts, coconut, sesame, red chili, coriander, cumin, turmeric, salt, and tamarind paste.",
      "Carefully stuff each brinjal with the masala mixture, pushing it into the cross-cut.",
      "Heat oil in a wide pan. Add curry leaves and onion — fry until golden.",
      "Place stuffed brinjals in a single layer. Cook on low heat, covered, for 5 minutes.",
      "Gently turn brinjals. Add 3–4 tbsp water, cover and cook 10 more minutes until tender.",
      "Uncover and cook 5 minutes more until the masala coats the brinjals and oil separates.",
      "Serve with rice — a festive Andhra dish!"
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:83, proteinG:4, carbsG:19, fatG:9, servingSizeG:200 }
  },
  { id:15, icon:"🥚", cat:"lunch", name:"Andhra Egg Curry (Kodi Guddu Kura)", time:"25 min", cal:285, p:19, f:21, c:8,
    cuisine: 'south-indian',
    dietType: ['eggetarian','non-vegetarian'],
    tags:["thyroid-safe","high-protein","Telugu-traditional"],
    ingredients:[
      "3 large eggs, hard boiled and peeled",
      "2 large onions, finely chopped",
      "2 tomatoes, chopped",
      "1 tsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp turmeric",
      "1 tsp coriander powder",
      "½ tsp garam masala",
      "Salt to taste",
      "1 tsp oil",
      "Curry leaves, fresh coriander"
    ],
    steps:[
      "Hard boil eggs for 10 minutes. Peel and make 2 small slits on each egg — this helps gravy penetrate.",
      "Heat oil in a pan. Add curry leaves, then onion. Fry on medium heat until deep golden (8–10 min).",
      "Add ginger-garlic paste and fry 2 minutes until raw smell disappears.",
      "Add tomatoes and cook until completely mushy and oil separates.",
      "Add red chili powder, turmeric, coriander, and salt. Cook 3 minutes.",
      "Add ¼ cup water. Add the whole eggs to the gravy and coat gently.",
      "Simmer on low heat for 5 minutes. Add garam masala, garnish with coriander.",
      "Serve with Phulka or rice. Andhra egg curry has more masala than gravy — thick and spicy!"
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:143, proteinG:19, carbsG:8, fatG:21, servingSizeG:200 }
  },
  { id:16, icon:"🧀", cat:"lunch", name:"Tawa Paneer Tikka (No-Oven)", time:"20 min", cal:225, p:15, f:17, c:5,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","high-protein","vegetarian","no-oven"],
    ingredients:[
      "100g paneer, cut in 1-inch cubes",
      "3 tbsp thick curd (hung curd preferred)",
      "½ tsp ginger-garlic paste",
      "¼ tsp turmeric",
      "½ tsp red chili powder",
      "½ tsp cumin powder",
      "¼ tsp garam masala",
      "½ tsp kasuri methi (dried fenugreek)",
      "Salt to taste",
      "1 tsp oil for tawa",
      "Lemon wedge, mint chutney to serve"
    ],
    steps:[
      "Mix curd with all spices (ginger-garlic paste, turmeric, chili, cumin, garam masala, kasuri methi, salt).",
      "Add paneer cubes and coat well. Marinate for at least 30 minutes (overnight is best).",
      "Heat a tawa or cast-iron pan on high heat. Brush with a thin layer of oil.",
      "Place marinated paneer pieces. Cook on high heat for 2 minutes until charred marks appear.",
      "Flip carefully and cook other side for 2 minutes.",
      "Serve immediately with mint chutney and lemon squeeze. The char is essential!"
    ],
    mealType: ['lunch', 'snack'],
    nutrition: { caloriesPer100g:150, proteinG:15, carbsG:5, fatG:17, servingSizeG:150 }
  },
  { id:17, icon:"🥦", cat:"lunch", name:"Bendakaya Fry (Andhra Okra Fry)", time:"20 min", cal:85, p:2, f:4, c:12,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","fiber-rich","side-dish"],
    ingredients:[
      "250g okra (bendakaya), washed and dried completely",
      "1 large onion, sliced",
      "½ tsp turmeric",
      "1 tsp red chili powder",
      "1 tsp coriander powder",
      "Salt to taste",
      "1 tsp oil",
      "¼ tsp mustard seeds",
      "Curry leaves"
    ],
    steps:[
      "KEY STEP: Okra must be completely dry before cutting — any moisture makes it slimy.",
      "Cut okra into ½-inch rounds. Keep aside.",
      "Heat oil in a wide pan on medium-high heat. Add mustard seeds and curry leaves.",
      "Add onion and fry for 2 minutes until translucent.",
      "Add okra and spread in a single layer. Do NOT cover the pan.",
      "Cook on medium-high heat, stirring every 2 minutes, for 12–15 minutes until okra is completely cooked and slightly crispy.",
      "Add turmeric, chili powder, coriander, and salt only when okra is 80% cooked.",
      "Stir and cook 3 more minutes. Serve as a side with dal and rice."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:57, proteinG:2, carbsG:12, fatG:4, servingSizeG:150 }
  },
  // ── CHICKEN ──────────────────────────────────────────────────────────────────
  { id:18, icon:"🍗", cat:"dinner", name:"Kodi Vepudu (Andhra Chicken Fry)", time:"35 min", cal:285, p:33, f:15, c:5,
    cuisine: 'south-indian',
    dietType: ['non-vegetarian'],
    tags:["thyroid-safe","high-protein","Telugu-traditional"],
    ingredients:[
      "150g chicken (bone-in thigh/drumstick recommended)",
      "1 large onion, sliced",
      "1 tbsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp Andhra karam (extra hot chili) or increase red chili",
      "¼ tsp turmeric",
      "½ tsp garam masala",
      "1 tsp coriander powder",
      "Salt to taste",
      "1 tsp oil",
      "Curry leaves, lemon juice",
      "Fresh coriander"
    ],
    steps:[
      "Clean and score chicken pieces with a knife for marinade penetration.",
      "Marinate chicken with ginger-garlic paste, red chili, turmeric, coriander, garam masala, and salt for at least 30 minutes.",
      "Heat oil in a heavy pan on high heat. Add curry leaves.",
      "Add marinated chicken. Sear on high heat for 3–4 minutes per side without stirring.",
      "Reduce to medium heat. Add sliced onions around the chicken.",
      "Cook covered for 10 minutes, stirring occasionally.",
      "Uncover. Increase heat and fry, stirring, until chicken is deeply colored and nearly dry (5–8 minutes).",
      "Squeeze lemon, garnish with coriander. Serve with rice or Phulka.",
      "Always cook chicken thoroughly to 75°C internal temperature. Rest 2–3 minutes before serving."
    ],
    mealType: ['dinner'],
    nutrition: { caloriesPer100g:143, proteinG:33, carbsG:5, fatG:15, servingSizeG:200 }
  },
  { id:19, icon:"🍗", cat:"lunch", name:"Kodi Pulusu (Andhra Chicken Curry)", time:"45 min", cal:265, p:28, f:12, c:10,
    cuisine: 'south-indian',
    dietType: ['non-vegetarian'],
    tags:["thyroid-safe","high-protein","Telugu-traditional"],
    ingredients:[
      "150g chicken, bone-in",
      "2 large onions, finely chopped",
      "2 tomatoes, chopped",
      "Lemon-size tamarind (soak and extract ¼ cup pulp)",
      "1 tbsp ginger-garlic paste",
      "1.5 tsp red chili powder",
      "1 tsp coriander powder",
      "½ tsp turmeric",
      "½ tsp garam masala",
      "Salt to taste",
      "1.5 tsp oil",
      "Curry leaves, whole spices (1 bay leaf, 2 cardamom, 2 cloves)"
    ],
    steps:[
      "Heat oil. Add whole spices (bay leaf, cardamom, cloves) and curry leaves. Fry 30 seconds.",
      "Add onions and cook until deep golden brown (12–15 minutes) — this is crucial for gravy richness.",
      "Add ginger-garlic paste. Cook 3 minutes until raw smell goes.",
      "Add tomatoes and cook until completely mashed and oil separates.",
      "Add red chili powder, coriander, turmeric, and salt. Cook 3 minutes.",
      "Add chicken pieces and mix well with the masala. Sear on high heat for 5 minutes.",
      "Add tamarind extract and 1 cup water. Bring to boil.",
      "Cover and cook on low heat for 20–25 minutes until chicken is tender.",
      "Add garam masala. Simmer uncovered for 5 minutes to thicken gravy.",
      "Pulusu (tamarind curry) is the signature Andhra dish — sour, spicy, and deeply savory."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:106, proteinG:28, carbsG:10, fatG:12, servingSizeG:250 }
  },
  { id:20, icon:"🍗", cat:"lunch", name:"Gongura Chicken Curry", time:"40 min", cal:255, p:30, f:12, c:6,
    cuisine: 'south-indian',
    dietType: ['non-vegetarian'],
    tags:["thyroid-safe","high-protein","Telugu-traditional","unique"],
    ingredients:[
      "150g chicken",
      "1 large bunch gongura (sorrel/roselle leaves) — about 2 cups packed",
      "2 onions, sliced",
      "1 tbsp ginger-garlic paste",
      "4–5 dry red chilies",
      "½ tsp turmeric",
      "1 tsp red chili powder",
      "Salt to taste",
      "1.5 tsp oil",
      "Curry leaves, mustard seeds"
    ],
    steps:[
      "Gongura prep: Wash gongura leaves. Sauté in 1 tsp oil with 2 red chilies and little salt until wilted (5 min). Blend to a smooth paste.",
      "Heat remaining oil. Add mustard seeds and curry leaves.",
      "Add onions and fry until golden brown. Add ginger-garlic paste and fry 2 minutes.",
      "Add chicken pieces and sear on high heat for 5 minutes.",
      "Add turmeric, red chili powder, and salt. Cook 3 minutes.",
      "Add gongura paste (the star ingredient!) and ½ cup water. Mix well.",
      "Cook covered on medium heat for 20–25 minutes until chicken is tender and gravy thickens.",
      "The sour, spicy flavor of gongura is iconic Andhra — unique to Telugu cuisine!"
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:102, proteinG:30, carbsG:6, fatG:12, servingSizeG:250 }
  },
  { id:21, icon:"🍲", cat:"dinner", name:"Kodi Rasam (Chicken Rasam)", time:"40 min", cal:120, p:15, f:4, c:8,
    cuisine: 'south-indian',
    dietType: ['non-vegetarian'],
    tags:["thyroid-safe","digestive","healing","Thu-recovery"],
    ingredients:[
      "100g chicken (bone-in for stock flavor)",
      "1 tomato",
      "Small piece tamarind",
      "1 tsp black pepper, coarsely ground",
      "1 tsp cumin seeds",
      "4 garlic cloves",
      "¼ tsp turmeric",
      "Salt to taste",
      "1 tsp ghee",
      "Curry leaves, coriander"
    ],
    steps:[
      "Pressure cook chicken with 2 cups water, tomato, half the pepper, and salt for 3 whistles.",
      "Strain the stock. Shred chicken and set aside.",
      "In a pot, add tamarind extract, remaining pepper, cumin, crushed garlic, turmeric, and salt.",
      "Add the chicken stock and bring to boil. Simmer 10 minutes.",
      "Add shredded chicken back to the rasam.",
      "Prepare tadka: Heat ghee, add cumin, curry leaves, and remaining garlic (sliced). Pour over rasam.",
      "Garnish with coriander. Serve as a light dinner soup with ¾ cup rice.",
      "Kodi Rasam is Andhra's healing broth — perfect after workout days for recovery."
    ],
    mealType: ['dinner'],
    nutrition: { caloriesPer100g:40, proteinG:15, carbsG:8, fatG:4, servingSizeG:300 }
  },
  // ── CHUTNEYS ──────────────────────────────────────────────────────────────────
  { id:22, icon:"🫙", cat:"chutney", name:"Allam Chutney (Ginger Chutney)", time:"10 min", cal:35, p:1, f:1, c:6,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","digestive","Telugu-traditional","classic-pesarattu-pair"],
    ingredients:[
      "2-inch fresh ginger piece, peeled",
      "2 tbsp chana dal, roasted",
      "3–4 dry red chilies",
      "1 tsp tamarind paste",
      "1 tsp jaggery (small piece)",
      "Salt to taste",
      "For tadka: 1 tsp oil, ½ tsp mustard seeds, curry leaves"
    ],
    steps:[
      "Dry roast chana dal and red chilies together in a pan until fragrant. Cool.",
      "Grind ginger, roasted chana dal, red chilies, tamarind, jaggery, and salt together.",
      "Add 2–3 tbsp water to get a thick, spreadable chutney consistency.",
      "Prepare tadka: Heat oil, add mustard seeds. Once popped, add curry leaves.",
      "Pour tadka over chutney and mix.",
      "Allam chutney is THE classic pairing for Pesarattu. Ginger aids digestion."
    ],
    mealType: ['breakfast', 'lunch', 'dinner'],
    nutrition: { caloriesPer100g:117, proteinG:1, carbsG:6, fatG:1, servingSizeG:30 }
  },
  { id:23, icon:"🫙", cat:"chutney", name:"Nuvvulu Chutney (Sesame Seed Chutney)", time:"8 min", cal:90, p:3, f:7, c:4,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","calcium-rich","Telugu-traditional"],
    ingredients:[
      "3 tbsp sesame seeds (nuvvulu), white or black",
      "2 dry red chilies",
      "1 tbsp roasted peanuts (optional)",
      "1 garlic clove",
      "Salt to taste",
      "½ tsp tamarind paste",
      "For tadka: 1 tsp oil, mustard seeds, curry leaves"
    ],
    steps:[
      "Dry roast sesame seeds on medium heat for 2–3 minutes until they start to pop and turn lightly golden. Be careful — they burn quickly.",
      "Cool completely. Grind with red chilies, garlic, tamarind, and salt into a coarse powder.",
      "Add 2–3 tbsp water and grind again to a thick paste.",
      "Prepare tadka: Oil + mustard seeds + curry leaves. Pour over chutney.",
      "Sesame is rich in calcium and healthy fats — excellent thyroid support.",
      "Serve with Pesarattu, Idli, or as a spread with Phulka."
    ],
    mealType: ['breakfast', 'lunch', 'dinner'],
    nutrition: { caloriesPer100g:300, proteinG:3, carbsG:4, fatG:7, servingSizeG:30 }
  },
  { id:24, icon:"🫙", cat:"chutney", name:"Coconut Chutney (Kobbari Pachadi)", time:"8 min", cal:80, p:2, f:7, c:4,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","classic"],
    ingredients:[
      "½ cup fresh/frozen coconut, grated",
      "2 tbsp roasted chana dal",
      "2 green chilies",
      "½ tsp ginger",
      "Salt to taste",
      "For tadka: 1 tsp oil, mustard seeds, curry leaves, 1 dry red chili"
    ],
    steps:[
      "Grind coconut, roasted chana dal, green chilies, ginger, and salt together.",
      "Add water gradually to get desired consistency (thick for dosa/pesarattu, slightly thinner for idli).",
      "Prepare tadka: Heat oil, add mustard seeds. Once popped, add curry leaves and red chili.",
      "Pour tadka over chutney and mix.",
      "Store in fridge up to 2 days. This chutney pairs well with Idli, Dosa, Pesarattu, and Upma."
    ],
    mealType: ['breakfast', 'lunch', 'dinner'],
    nutrition: { caloriesPer100g:267, proteinG:2, carbsG:4, fatG:7, servingSizeG:30 }
  },
  { id:25, icon:"🫙", cat:"chutney", name:"Tomato Chutney (Tomato Pachadi)", time:"12 min", cal:45, p:1, f:2, c:6,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","tangy"],
    ingredients:[
      "3 medium tomatoes, roughly chopped",
      "3 dry red chilies",
      "4 garlic cloves",
      "½ tsp cumin seeds",
      "Salt to taste",
      "1 tsp oil",
      "For tadka: mustard seeds, curry leaves, hing"
    ],
    steps:[
      "Heat oil in a pan. Add cumin and garlic — fry 1 minute.",
      "Add red chilies and tomatoes. Cook on medium heat for 8–10 minutes until tomatoes are completely soft and mushy.",
      "Cool slightly. Blend to a smooth or slightly chunky paste. Add salt.",
      "Prepare tadka: Heat a little oil, add mustard seeds. Once popped, add curry leaves and a pinch of hing.",
      "Pour tadka over chutney. Serve with Pesarattu, Idli, or Egg Bhurji."
    ],
    mealType: ['breakfast', 'lunch', 'dinner'],
    nutrition: { caloriesPer100g:150, proteinG:1, carbsG:6, fatG:2, servingSizeG:30 }
  },
  { id:26, icon:"🫙", cat:"chutney", name:"Gongura Pachadi (Sorrel Chutney)", time:"15 min", cal:40, p:1, f:2, c:5,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","Telugu-traditional","signature-Andhra","tangy"],
    ingredients:[
      "2 cups gongura (sorrel/roselle) leaves, washed",
      "4–5 dry red chilies",
      "4 garlic cloves",
      "½ tsp cumin seeds",
      "Salt to taste",
      "1 tsp oil",
      "For tadka: oil, mustard seeds, curry leaves, 2 red chilies, sliced garlic"
    ],
    steps:[
      "Heat oil in pan. Add cumin and garlic. Fry 30 seconds.",
      "Add red chilies and gongura leaves. Cook on medium heat, stirring, until leaves completely wilt and look dry (8–10 minutes).",
      "Cool and blend to a coarse paste. Add salt.",
      "Prepare generous tadka: Heat oil, add mustard seeds, then curry leaves, red chilies, and sliced garlic. Fry until garlic is golden.",
      "Pour tadka over chutney and mix well.",
      "Gongura Pachadi is the pride of Andhra Pradesh! Extremely tangy and spicy. A must-have with plain rice."
    ],
    mealType: ['breakfast', 'lunch', 'dinner'],
    nutrition: { caloriesPer100g:133, proteinG:1, carbsG:5, fatG:2, servingSizeG:30 }
  },
  { id:27, icon:"🫙", cat:"chutney", name:"Pudina Chutney (Mint Green Chutney)", time:"5 min", cal:30, p:1, f:1, c:4,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","cooling","digestive"],
    ingredients:[
      "1 cup fresh mint leaves (pudina)",
      "½ cup fresh coriander leaves",
      "2 green chilies",
      "1 garlic clove",
      "½ tsp cumin",
      "1 tsp lemon juice",
      "Salt to taste",
      "2 tbsp water"
    ],
    steps:[
      "Wash mint and coriander leaves thoroughly.",
      "Blend all ingredients together with 2 tbsp water until smooth.",
      "Taste and adjust lemon/salt/chili.",
      "Serve immediately or store in airtight container in fridge for up to 2 days.",
      "Mint chutney pairs best with Paneer Tikka, Kebabs, and as a sandwich spread."
    ],
    mealType: ['breakfast', 'lunch', 'dinner'],
    nutrition: { caloriesPer100g:100, proteinG:1, carbsG:4, fatG:1, servingSizeG:30 }
  },
  // ── SIDES & OTHERS ────────────────────────────────────────────────────────────
  { id:28, icon:"🫓", cat:"breakfast", name:"Phulka / Whole Wheat Roti", time:"20 min", cal:70, p:3, f:1, c:14,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","whole-grain","daily-staple"],
    ingredients:[
      "1 cup whole wheat atta",
      "Water (approximately ½ cup) to knead",
      "A pinch of salt",
      "½ tsp ghee per phulka (for smearing)"
    ],
    steps:[
      "Mix atta and salt. Add water slowly, kneading for 5–7 minutes until soft and pliable dough. Cover and rest 15 minutes.",
      "Divide into small lemon-sized balls.",
      "Roll each ball on a lightly floured surface into a thin, even circle (5–6 inches).",
      "Heat a tawa on high heat. Place phulka and cook 30 seconds until bubbles appear.",
      "Flip and cook 30 seconds more.",
      "Transfer directly to a flame (gas stove) and it will puff up. Rotate with tongs.",
      "Smear ½ tsp ghee on one side. Each phulka = ~70 kcal. 1 Phulka is about 30g atta."
    ],
    mealType: ['breakfast', 'lunch', 'dinner'],
    nutrition: { caloriesPer100g:175, proteinG:3, carbsG:14, fatG:1, servingSizeG:40 }
  },
  { id:29, icon:"🥛", cat:"snack", name:"Chaas / Majjiga (Spiced Buttermilk)", time:"3 min", cal:45, p:3, f:2, c:4,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","probiotic","cooling","post-meal"],
    ingredients:[
      "200ml low-fat yogurt/curd",
      "200ml cold water",
      "A pinch of roasted cumin powder",
      "A pinch of black salt",
      "Salt to taste",
      "Optional: a few mint leaves, small piece of ginger, green chili"
    ],
    steps:[
      "Add yogurt and water to a glass or tall container.",
      "Whisk vigorously (or blend 10 seconds) until frothy and well combined.",
      "Add roasted cumin powder, black salt, and regular salt.",
      "Optional: blend with mint leaves and ginger for Masala Chaas.",
      "Serve chilled. Drink after lunch for digestion — a Telugu household essential!",
      "200ml chaas = ~45 kcal. Excellent probiotic for gut health and thyroid support."
    ],
    mealType: ['snack'],
    nutrition: { caloriesPer100g:11, proteinG:3, carbsG:4, fatG:2, servingSizeG:400 }
  },
  { id:30, icon:"🌰", cat:"snack", name:"Seed & Nut Mix (Daily Snack)", time:"5 min", cal:160, p:5, f:13, c:6,
    cuisine: 'south-indian',
    dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:["thyroid-safe","omega-3","anti-inflammatory"],
    ingredients:[
      "10g pumpkin seeds",
      "10g sunflower seeds",
      "5g sesame seeds (nuvvulu)",
      "5g flaxseeds (alsi)",
      "5 almonds (whole)",
      "3 walnuts",
      "Optional: a pinch of black salt"
    ],
    steps:[
      "Lightly dry roast pumpkin and sunflower seeds for 3–4 minutes until slightly crunchy.",
      "Mix all ingredients together and store in an airtight container (make weekly batch).",
      "Consume as a mid-morning or pre-workout snack.",
      "Thyroid note: Flaxseeds should be ground or cracked to release omega-3s. Limit to 15g/day.",
      "This mix provides selenium (thyroid support), zinc, omega-3, and healthy fats.",
      "Total per serving (~35g): 160 kcal, 5g protein, 13g fat, 6g carbs"
    ],
    mealType: ['snack'],
    nutrition: { caloriesPer100g:457, proteinG:5, carbsG:6, fatG:13, servingSizeG:35 }
  },
  // ── NORTH INDIAN – BREAKFAST ─────────────────────────────────────────────
  { id:31, icon:"🫓", cat:"breakfast", name:"Aloo Paratha with Curd", time:"30 min", cal:380, p:10, f:12, c:58,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','filling','vegetarian'],
    ingredients:[
      "1 cup whole wheat atta",
      "2 medium potatoes, boiled and mashed",
      "1 green chili, finely chopped",
      "½ tsp cumin seeds",
      "¼ tsp red chili powder",
      "¼ tsp amchur (dry mango powder)",
      "Salt to taste",
      "1 tsp ghee per paratha",
      "½ cup thick curd to serve"
    ],
    steps:[
      "Knead atta with water into a soft dough. Rest covered for 15 minutes.",
      "Mix mashed potato with green chili, cumin, red chili, amchur, and salt.",
      "Divide dough and filling into equal balls. Flatten a dough ball, place filling in centre, seal edges.",
      "Gently roll into a 6-inch circle on a floured surface — don't press too hard.",
      "Cook on a hot tawa for 2 minutes each side until golden spots appear.",
      "Apply ½ tsp ghee on each side. Serve hot with cold curd and pickle."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:190, proteinG:10, carbsG:58, fatG:12, servingSizeG:200 }
  },
  { id:32, icon:"🫓", cat:"breakfast", name:"Dal Paratha (Chana Dal Stuffed)", time:"35 min", cal:340, p:13, f:9, c:52,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','high-protein','vegetarian'],
    ingredients:[
      "1 cup whole wheat atta",
      "½ cup chana dal, soaked 30 min and pressure cooked until soft",
      "1 small onion, finely chopped",
      "1 green chili, chopped",
      "½ tsp cumin seeds",
      "½ tsp coriander powder",
      "¼ tsp garam masala",
      "Salt to taste",
      "1 tsp ghee per paratha"
    ],
    steps:[
      "Knead atta with water and pinch of salt into soft dough. Rest 15 minutes.",
      "Drain cooked chana dal well and mash roughly. It should be dry — too much moisture tears the paratha.",
      "Mix dal with onion, green chili, cumin, coriander, garam masala, and salt.",
      "Stuff and roll parathas same as Aloo Paratha technique.",
      "Cook on hot tawa with ghee until golden brown on both sides.",
      "Serve with plain curd and mint chutney."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:189, proteinG:13, carbsG:52, fatG:9, servingSizeG:180 }
  },
  { id:33, icon:"🧀", cat:"breakfast", name:"Paneer Bhurji with Paratha", time:"20 min", cal:410, p:20, f:22, c:35,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','high-protein','vegetarian','quick'],
    ingredients:[
      "100g paneer, crumbled",
      "1 medium onion, finely chopped",
      "1 tomato, finely chopped",
      "1 green chili",
      "¼ tsp turmeric",
      "½ tsp cumin seeds",
      "½ tsp red chili powder",
      "½ tsp garam masala",
      "1 tsp butter or ghee",
      "2 whole wheat phulkas or parathas to serve"
    ],
    steps:[
      "Heat butter in a pan. Add cumin seeds until they sizzle.",
      "Add onion and green chili. Sauté 3 minutes until softened.",
      "Add tomato, turmeric, chili powder, and salt. Cook 3 minutes until oil separates.",
      "Add crumbled paneer. Mix gently and cook 3–4 minutes on medium heat.",
      "Add garam masala. Stir once. Remove from heat — overcooking makes paneer rubbery.",
      "Serve with 2 phulkas or 1 paratha and a glass of chaas."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:164, proteinG:20, carbsG:35, fatG:22, servingSizeG:250 }
  },
  { id:34, icon:"🍳", cat:"breakfast", name:"Egg Bhurji Roti", time:"15 min", cal:320, p:22, f:18, c:20,
    cuisine:'north-indian', dietType:['eggetarian','non-vegetarian'],
    tags:['north-indian','high-protein','quick','eggetarian'],
    ingredients:[
      "3 large eggs",
      "1 small onion, finely chopped",
      "1 tomato, chopped",
      "1 green chili, chopped",
      "¼ tsp turmeric",
      "½ tsp red chili powder",
      "¼ tsp pav bhaji masala or garam masala",
      "Salt to taste",
      "1 tsp butter",
      "Fresh coriander",
      "2 whole wheat rotis to serve"
    ],
    steps:[
      "Heat butter in a non-stick pan over medium heat.",
      "Add onion and green chili. Sauté until translucent (2 min).",
      "Add tomato, turmeric, chili powder, and salt. Cook 2 minutes.",
      "Crack eggs directly into the pan. Let whites set for 20 seconds.",
      "Scramble everything together. Add pav bhaji masala and stir.",
      "Cook on medium heat stirring until eggs are just set — remove from heat while still slightly soft.",
      "Garnish with coriander. Serve with 2 warm rotis."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:160, proteinG:22, carbsG:20, fatG:18, servingSizeG:200 }
  },
  { id:35, icon:"🥞", cat:"breakfast", name:"Besan Chilla (Gram Flour Pancake)", time:"20 min", cal:250, p:12, f:8, c:32,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','high-protein','vegetarian','gluten-free'],
    ingredients:[
      "½ cup besan (chickpea flour)",
      "1 small onion, finely chopped",
      "1 tomato, finely chopped",
      "1 green chili, chopped",
      "¼ tsp turmeric",
      "½ tsp cumin seeds",
      "¼ tsp ajwain (carom seeds)",
      "Salt to taste",
      "Water to make thin batter",
      "1 tsp oil per chilla"
    ],
    steps:[
      "Mix besan with turmeric, cumin, ajwain, and salt. Add water gradually, whisking to make a lump-free thin batter (like dosa consistency).",
      "Fold in chopped onion, tomato, and green chili.",
      "Heat a non-stick tawa. Add ½ tsp oil. Pour a ladleful of batter and spread in circles.",
      "Cook on medium heat for 2–3 minutes until edges lift and top looks set.",
      "Flip and cook 1–2 minutes more until golden.",
      "Serve hot with mint chutney or curd. Besan chilla is a high-protein vegan breakfast."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:167, proteinG:12, carbsG:32, fatG:8, servingSizeG:150 }
  },
  // ── NORTH INDIAN – LUNCH ─────────────────────────────────────────────────
  { id:36, icon:"🫘", cat:"lunch", name:"Dal Makhani", time:"50 min", cal:310, p:14, f:12, c:38,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','high-protein','vegetarian','rich'],
    ingredients:[
      "½ cup whole black urad dal (sabut urad), soaked overnight",
      "2 tbsp rajma (kidney beans), soaked overnight",
      "2 large tomatoes, pureed",
      "1 large onion, finely chopped",
      "1 tbsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp garam masala",
      "Salt to taste",
      "2 tbsp butter",
      "2 tbsp cream (optional)",
      "½ tsp kasuri methi"
    ],
    steps:[
      "Pressure cook soaked urad dal and rajma with salt and 3 cups water for 6–8 whistles until completely soft. Mash lightly.",
      "Heat butter in a heavy pan. Add onion and cook until deep golden (10 min).",
      "Add ginger-garlic paste and fry 2 minutes until raw smell disappears.",
      "Add tomato puree, red chili, and salt. Cook until butter separates from masala (8–10 min).",
      "Add cooked dal to the masala. Stir well and add ½ cup water for creamy consistency.",
      "Simmer on very low heat for 20 minutes, stirring frequently. This slow cook is the secret.",
      "Add garam masala, kasuri methi, and cream. Simmer 3 more minutes. Serve with jeera rice or roti."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:124, proteinG:14, carbsG:38, fatG:12, servingSizeG:250 }
  },
  { id:37, icon:"🍚", cat:"lunch", name:"Rajma Chawal (NI Style)", time:"45 min", cal:390, p:16, f:7, c:68,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','comfort-food','vegetarian','high-fiber'],
    ingredients:[
      "½ cup red kidney beans, soaked overnight",
      "1 cup basmati rice",
      "2 large onions, finely chopped",
      "3 tomatoes, pureed",
      "1 tbsp ginger-garlic paste",
      "1 tsp cumin seeds",
      "1 tsp red chili powder",
      "½ tsp turmeric",
      "1 tsp coriander powder",
      "½ tsp garam masala",
      "Salt to taste",
      "1.5 tsp oil",
      "Fresh coriander to garnish"
    ],
    steps:[
      "Pressure cook rajma with turmeric and salt for 5–6 whistles. Reserve cooking water.",
      "Heat oil. Add cumin seeds. When they splutter, add onions and cook 10–12 min until golden brown.",
      "Add ginger-garlic paste. Cook 2 min. Add tomato puree and all dry spices. Cook until oil separates.",
      "Add cooked rajma with its water. Mash a few beans to thicken gravy.",
      "Simmer 10 minutes on low heat. Add garam masala.",
      "Meanwhile cook basmati rice separately with salt.",
      "Serve rajma over rice with a dollop of butter. The ultimate North Indian comfort meal."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:111, proteinG:16, carbsG:68, fatG:7, servingSizeG:350 }
  },
  { id:38, icon:"🥙", cat:"lunch", name:"Chole Bhature", time:"50 min", cal:520, p:16, f:18, c:75,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','festive','vegetarian','indulgent'],
    ingredients:[
      "1 cup white chickpeas (kabuli chana), soaked overnight",
      "2 tea bags (for color, optional)",
      "2 large onions, finely chopped",
      "2 tomatoes, pureed",
      "1 tbsp ginger-garlic paste",
      "2 tsp chole masala (MDH or Everest brand)",
      "½ tsp turmeric",
      "Salt to taste",
      "1.5 tsp oil",
      "For bhatura: 1 cup maida, ¼ cup curd, ½ tsp baking soda, salt, oil for frying"
    ],
    steps:[
      "Pressure cook chickpeas with tea bags (for dark color), salt, and water for 5–6 whistles until tender.",
      "Heat oil. Add onions and cook until deep brown (12 min). Add ginger-garlic paste, cook 2 min.",
      "Add tomato puree, chole masala, turmeric, and salt. Cook until oil separates.",
      "Add cooked chickpeas with their water. Simmer 15 minutes. Mash a few chickpeas for thick gravy.",
      "For bhatura: Mix maida, curd, baking soda, salt, and enough water into a soft dough. Rest 30 min.",
      "Roll into oval shapes and deep fry in hot oil until puffed and golden.",
      "Serve chole with 2 bhaturas, sliced onion, and lemon wedge."
    ],
    mealType: ['lunch'],
    nutrition: { caloriesPer100g:149, proteinG:16, carbsG:75, fatG:18, servingSizeG:350 }
  },
  { id:39, icon:"🧀", cat:"lunch", name:"Paneer Butter Masala with Roti", time:"30 min", cal:430, p:18, f:24, c:38,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','high-protein','creamy'],
    ingredients:[
      "150g paneer, cubed",
      "3 large tomatoes, roughly chopped",
      "1 large onion, roughly chopped",
      "2 tbsp cashews",
      "1 tbsp butter",
      "1 tbsp cream",
      "1 tbsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp kashmiri chili (for color)",
      "½ tsp garam masala",
      "1 tsp kasuri methi",
      "Salt to taste",
      "2 phulkas to serve"
    ],
    steps:[
      "Boil tomato, onion, and cashews together for 10 min. Cool and blend to smooth paste. Strain through sieve.",
      "Heat butter in a pan. Add ginger-garlic paste and fry 1 minute.",
      "Add the strained tomato-onion-cashew paste. Cook on medium heat for 8 minutes until raw smell leaves.",
      "Add red chili, kashmiri chili, and salt. Cook 3 minutes.",
      "Add paneer cubes. Gently fold into the gravy.",
      "Add cream, garam masala, and kasuri methi (crush between palms). Simmer 3 minutes.",
      "Serve with 2 phulkas. Do not simmer too long — paneer should remain soft."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:143, proteinG:18, carbsG:38, fatG:24, servingSizeG:300 }
  },
  { id:40, icon:"🍗", cat:"lunch", name:"Chicken Curry Rice (NI Style)", time:"40 min", cal:420, p:32, f:14, c:46,
    cuisine:'north-indian', dietType:['non-vegetarian'],
    tags:['north-indian','non-veg','high-protein'],
    ingredients:[
      "150g chicken, bone-in",
      "1 cup basmati rice",
      "2 onions, finely chopped",
      "2 tomatoes, pureed",
      "1 tbsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp turmeric",
      "1 tsp coriander powder",
      "½ tsp garam masala",
      "1 tsp oil",
      "Whole spices: 1 bay leaf, 2 cloves, 1 cardamom",
      "Fresh coriander"
    ],
    steps:[
      "Heat oil. Add whole spices and let sizzle 30 seconds.",
      "Add onions and cook until deep golden (10 min). Add ginger-garlic paste, cook 2 min.",
      "Add tomato puree, red chili, turmeric, coriander, and salt. Cook until oil separates.",
      "Add chicken and mix well. Sear on high heat for 5 minutes.",
      "Add 1 cup water. Cover and cook on medium heat for 20–25 minutes until chicken is tender.",
      "Add garam masala. Simmer uncovered 5 minutes to thicken.",
      "Serve with steamed basmati rice and sliced onion salad."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:120, proteinG:32, carbsG:46, fatG:14, servingSizeG:350 }
  },
  { id:41, icon:"🍚", cat:"lunch", name:"Mutton Biryani", time:"75 min", cal:520, p:30, f:20, c:58,
    cuisine:'north-indian', dietType:['non-vegetarian'],
    tags:['north-indian','non-veg','festive','high-protein'],
    ingredients:[
      "150g mutton, bone-in (curry cut)",
      "1 cup basmati rice, soaked 30 min",
      "2 onions, thinly sliced (for crispy fried onions)",
      "½ cup thick curd",
      "1 tbsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp turmeric",
      "1 tsp biryani masala (MDH/Shan brand)",
      "Whole spices: 2 bay leaves, 4 cloves, 3 cardamom, 1-inch cinnamon",
      "Saffron pinch soaked in 2 tbsp warm milk",
      "2 tbsp ghee",
      "Fresh mint and coriander"
    ],
    steps:[
      "Marinate mutton with curd, ginger-garlic paste, red chili, turmeric, biryani masala, and salt. Rest 1 hour (overnight is better).",
      "Deep fry sliced onions until crispy golden. Drain on paper. Reserve the oil.",
      "Cook marinated mutton in a heavy pot with 2 tbsp of the onion oil until 70% cooked (20 min). Set aside.",
      "Parboil soaked rice with whole spices, salt, and water until 70% cooked (10 min). Drain.",
      "Layer: mutton at bottom, then rice, then fried onions, mint, coriander, saffron milk, and ghee.",
      "Seal the pot with dough or tight foil. Cook on dum (very low heat) for 25–30 minutes.",
      "Open and mix gently from bottom. Serve with raita."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:149, proteinG:30, carbsG:58, fatG:20, servingSizeG:350 }
  },
  { id:42, icon:"🍲", cat:"lunch", name:"Kadhi Chawal", time:"40 min", cal:320, p:10, f:10, c:48,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','comfort-food','probiotic'],
    ingredients:[
      "1 cup sour curd (or plain + 1 tsp lemon)",
      "3 tbsp besan (chickpea flour)",
      "2 cups water",
      "¼ tsp turmeric",
      "1 tsp red chili powder",
      "Salt to taste",
      "For tadka: 1 tsp ghee, ½ tsp mustard seeds, ½ tsp cumin, 2 dry red chilies, curry leaves, 2 garlic cloves",
      "For pakodas: ½ cup besan, 1 onion chopped, salt, ½ tsp ajwain, oil for frying",
      "1 cup basmati rice to serve"
    ],
    steps:[
      "Whisk together curd, besan, turmeric, chili powder, salt, and water until completely smooth — no lumps.",
      "Bring the mixture to a boil in a heavy pot, stirring continuously to prevent curdling.",
      "Reduce heat and simmer 20–25 minutes stirring occasionally until kadhi thickens slightly.",
      "For pakodas: Mix besan, onion, ajwain, and salt into thick batter. Drop spoonfuls into hot oil and fry until golden. Add to kadhi.",
      "Prepare tadka: Heat ghee. Add mustard seeds, cumin, red chilies, curry leaves, and garlic. Fry until garlic is golden.",
      "Pour tadka into kadhi. Simmer 2 minutes. Serve over steamed rice."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:91, proteinG:10, carbsG:48, fatG:10, servingSizeG:350 }
  },
  { id:43, icon:"🥬", cat:"lunch", name:"Sarson Da Saag with Makki Roti", time:"60 min", cal:340, p:10, f:14, c:44,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','seasonal','Punjabi'],
    ingredients:[
      "2 cups mustard leaves (sarson), washed and roughly chopped",
      "1 cup spinach leaves",
      "½ cup bathua (chenopodium) or extra spinach",
      "1 large onion, chopped",
      "2 tomatoes, chopped",
      "1 tbsp ginger, grated",
      "4 garlic cloves, minced",
      "2 green chilies",
      "2 tbsp makki atta (corn flour) to thicken",
      "2 tbsp butter",
      "Salt to taste",
      "For makki roti: 1 cup makki atta, warm water"
    ],
    steps:[
      "Pressure cook mustard leaves, spinach, bathua, onion, tomatoes, ginger, garlic, and chilies with salt for 3 whistles.",
      "Blend roughly — sarson saag should have some texture, not silky smooth.",
      "Return to pot. Add makki atta for thickening. Cook on low heat 15 minutes stirring frequently.",
      "Stir in butter. Simmer 5 minutes. Adjust salt.",
      "For makki roti: Knead makki atta with warm water into a crumbly dough. Pat by hand into small thick rotis.",
      "Cook on tawa with ghee until both sides have golden spots.",
      "Serve saag topped with extra butter alongside hot makki roti and jaggery."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:113, proteinG:10, carbsG:44, fatG:14, servingSizeG:300 }
  },
  // ── NORTH INDIAN – DINNER ────────────────────────────────────────────────
  { id:44, icon:"🍲", cat:"dinner", name:"Dal Tadka with Roti", time:"30 min", cal:280, p:14, f:8, c:40,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','daily-staple','high-protein'],
    ingredients:[
      "½ cup toor dal (pigeon pea) or arhar dal",
      "1 tomato, chopped",
      "¼ tsp turmeric",
      "Salt to taste",
      "For tadka: 2 tbsp ghee, 1 tsp cumin seeds, 4 garlic cloves (sliced), 2 dry red chilies, 1 tsp red chili powder, hing",
      "Lemon juice",
      "Fresh coriander",
      "2 phulkas to serve"
    ],
    steps:[
      "Pressure cook toor dal with tomato, turmeric, and salt for 3–4 whistles until soft. Mash well.",
      "Adjust consistency — Dal Tadka should be thinner than dal makhani.",
      "For tadka: Heat ghee in a small pan until hot. Add cumin seeds — they should sizzle instantly.",
      "Add garlic slices and fry until golden brown (not burnt).",
      "Add dry red chilies and hing. Remove from heat.",
      "Add red chili powder OFF the heat — the residual heat blooms the spice without burning.",
      "Pour sizzling tadka over the dal immediately. Don't stir — let it sit 30 seconds. Then mix.",
      "Squeeze lemon, garnish with coriander. Serve with phulkas."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:93, proteinG:14, carbsG:40, fatG:8, servingSizeG:300 }
  },
  { id:45, icon:"🥬", cat:"dinner", name:"Palak Paneer", time:"30 min", cal:295, p:16, f:20, c:14,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','high-protein','iron-rich'],
    ingredients:[
      "200g fresh spinach leaves",
      "100g paneer, cubed",
      "1 large onion, chopped",
      "2 tomatoes, chopped",
      "1 tbsp ginger-garlic paste",
      "1 green chili",
      "½ tsp cumin seeds",
      "½ tsp red chili powder",
      "½ tsp garam masala",
      "1 tbsp cream (optional)",
      "1 tsp oil + 1 tsp butter",
      "Salt to taste"
    ],
    steps:[
      "Blanch spinach: boil 2 cups water, add spinach for 2 minutes, then transfer to ice-cold water. This preserves the bright green color.",
      "Drain and blend spinach with green chili to a smooth puree.",
      "Heat oil in a pan. Add cumin seeds. Add onion and fry until golden (6–8 min).",
      "Add ginger-garlic paste and tomato. Cook until oil separates.",
      "Add red chili powder and salt. Cook 2 minutes.",
      "Add spinach puree and simmer 5 minutes on medium heat.",
      "Add paneer cubes. Gently fold. Cook 3 minutes.",
      "Add garam masala, butter, and cream. Stir once and serve."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:148, proteinG:16, carbsG:14, fatG:20, servingSizeG:200 }
  },
  { id:46, icon:"🥔", cat:"dinner", name:"Aloo Matar with Roti", time:"25 min", cal:265, p:9, f:7, c:44,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','comfort-food'],
    ingredients:[
      "2 medium potatoes, cubed",
      "½ cup green peas (fresh or frozen)",
      "1 large onion, finely chopped",
      "2 tomatoes, chopped",
      "1 tsp ginger-garlic paste",
      "½ tsp cumin seeds",
      "½ tsp turmeric",
      "1 tsp coriander powder",
      "½ tsp garam masala",
      "Salt to taste",
      "1 tsp oil",
      "Fresh coriander",
      "2 phulkas to serve"
    ],
    steps:[
      "Heat oil in a pan. Add cumin seeds and let them sizzle.",
      "Add onion and cook until golden. Add ginger-garlic paste, fry 1 minute.",
      "Add tomatoes, turmeric, coriander powder, and salt. Cook until oil separates.",
      "Add potato cubes and mix well with masala. Add ½ cup water.",
      "Cover and cook on medium heat for 12 minutes until potatoes are nearly tender.",
      "Add green peas. Cook uncovered 5 more minutes.",
      "Add garam masala and fresh coriander. Serve with phulkas."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:88, proteinG:9, carbsG:44, fatG:7, servingSizeG:300 }
  },
  { id:47, icon:"🍗", cat:"dinner", name:"Chicken Saag Rice", time:"40 min", cal:390, p:30, f:13, c:40,
    cuisine:'north-indian', dietType:['non-vegetarian'],
    tags:['north-indian','non-veg','high-protein','iron-rich'],
    ingredients:[
      "150g chicken breast, cubed",
      "150g fresh spinach",
      "¾ cup basmati rice",
      "1 onion, chopped",
      "1 tomato, pureed",
      "1 tbsp ginger-garlic paste",
      "½ tsp cumin seeds",
      "½ tsp red chili powder",
      "½ tsp garam masala",
      "1 tsp oil",
      "Salt to taste"
    ],
    steps:[
      "Blanch spinach and blend to puree. Set aside.",
      "Heat oil. Add cumin seeds. Add onion and cook until golden.",
      "Add ginger-garlic paste and tomato puree. Cook until oil separates.",
      "Add chicken, red chili, and salt. Sear on high heat for 5 minutes.",
      "Add spinach puree and ¼ cup water. Cover and cook 15 minutes until chicken is cooked through.",
      "Add garam masala. Simmer uncovered 5 minutes to thicken.",
      "Serve over steamed basmati rice."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:111, proteinG:30, carbsG:40, fatG:13, servingSizeG:350 }
  },
  { id:48, icon:"🥩", cat:"dinner", name:"Keema Matar with Roti", time:"35 min", cal:380, p:28, f:20, c:24,
    cuisine:'north-indian', dietType:['non-vegetarian'],
    tags:['north-indian','non-veg','high-protein'],
    ingredients:[
      "150g minced mutton or chicken (keema)",
      "½ cup green peas",
      "1 large onion, finely chopped",
      "2 tomatoes, chopped",
      "1 tbsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp turmeric",
      "1 tsp coriander powder",
      "½ tsp garam masala",
      "½ tsp cumin seeds",
      "1 tsp oil",
      "Fresh coriander",
      "2 phulkas to serve"
    ],
    steps:[
      "Heat oil. Add cumin seeds. Add onion and fry until deep golden (8 min).",
      "Add ginger-garlic paste. Cook 2 minutes until raw smell disappears.",
      "Add tomatoes, red chili, turmeric, coriander, and salt. Cook until oil separates.",
      "Add keema. Break it apart with a spoon. Cook on high heat for 5 minutes, stirring.",
      "Reduce heat. Add ½ cup water. Cover and cook 15 minutes.",
      "Add green peas and cook uncovered 8 more minutes until peas are done and water evaporates.",
      "Add garam masala. Garnish with coriander. Serve with phulkas."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:127, proteinG:28, carbsG:24, fatG:20, servingSizeG:300 }
  },
  { id:49, icon:"🍆", cat:"dinner", name:"Baingan Bharta with Roti", time:"35 min", cal:195, p:5, f:8, c:28,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','smoky','fiber-rich'],
    ingredients:[
      "1 large brinjal (baingan/eggplant)",
      "1 large onion, finely chopped",
      "2 tomatoes, chopped",
      "1 tbsp ginger-garlic paste",
      "1 green chili",
      "½ tsp cumin seeds",
      "½ tsp turmeric",
      "½ tsp red chili powder",
      "½ tsp garam masala",
      "1 tsp oil",
      "Fresh coriander",
      "2 phulkas to serve"
    ],
    steps:[
      "Char the brinjal directly on a gas flame, turning with tongs, until completely burnt outside and soft inside (8–10 min). This smoky char is the soul of bharta.",
      "Cool and peel off the charred skin. Mash the flesh well.",
      "Heat oil. Add cumin seeds. Add onion and green chili — cook until golden.",
      "Add ginger-garlic paste and tomatoes. Cook until oil separates.",
      "Add turmeric, red chili, and salt. Mix well.",
      "Add mashed brinjal and mix thoroughly. Cook on medium heat for 5 minutes.",
      "Add garam masala and fresh coriander. Serve with phulkas."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:78, proteinG:5, carbsG:28, fatG:8, servingSizeG:250 }
  },
  { id:50, icon:"🥩", cat:"dinner", name:"Mutton Rogan Josh", time:"70 min", cal:420, p:32, f:22, c:18,
    cuisine:'north-indian', dietType:['non-vegetarian'],
    tags:['north-indian','non-veg','festive','high-protein','Kashmiri'],
    ingredients:[
      "150g mutton, bone-in",
      "1 cup thick curd",
      "2 large onions, finely sliced",
      "1 tbsp ginger-garlic paste",
      "2 tsp Kashmiri red chili powder (for deep color)",
      "½ tsp turmeric",
      "1 tsp coriander powder",
      "1 tsp fennel powder (saunf)",
      "½ tsp ginger powder (soonth)",
      "½ tsp garam masala",
      "Whole spices: 2 cardamom, 3 cloves, 1-inch cinnamon, 2 bay leaves",
      "2 tbsp oil or ghee",
      "Salt to taste"
    ],
    steps:[
      "Heat ghee in a heavy pot. Fry sliced onions until deep brown (15 min). Remove and set aside.",
      "In the same oil, add whole spices. Fry 30 seconds.",
      "Add mutton pieces. Sear on high heat until browned on all sides (8 min).",
      "Add ginger-garlic paste and cook 2 minutes.",
      "Beat curd with all dry spices. Add to the mutton. Cook on medium heat until curd is absorbed and oil surfaces (10 min).",
      "Add fried onions and ½ cup water. Cover and cook on low heat for 40–45 minutes until mutton is very tender.",
      "Add garam masala. Simmer uncovered 5 minutes. Serve with basmati rice or naan."
    ],
    mealType: ['dinner'],
    nutrition: { caloriesPer100g:168, proteinG:32, carbsG:18, fatG:22, servingSizeG:250 }
  },
  // ── NORTH INDIAN – SNACKS ────────────────────────────────────────────────
  { id:51, icon:"🥟", cat:"snack", name:"Samosa (Baked or Fried)", time:"45 min", cal:210, p:5, f:9, c:28,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','snack','classic'],
    ingredients:[
      "For pastry: 1 cup maida, 2 tbsp oil, ½ tsp ajwain, salt, water",
      "For filling: 2 boiled potatoes (mashed), ½ cup peas, 1 tsp cumin seeds, 1 tsp coriander powder, ½ tsp garam masala, ½ tsp amchur, 1 green chili, fresh coriander, salt",
      "Oil for deep frying (or brush and bake at 200°C for 25 min)"
    ],
    steps:[
      "Make dough: Mix maida, oil, ajwain, and salt. Add water slowly and knead into a firm (not soft) dough. Rest 20 minutes.",
      "Filling: Heat oil, fry cumin seeds, add peas, potatoes, and all spices. Mix and cool completely.",
      "Divide dough into golf ball-sized pieces. Roll each into a 6-inch oval.",
      "Cut oval in half. Fold each half into a cone, seal the straight edge with water.",
      "Fill cone with potato mixture. Seal the open edge firmly.",
      "Deep fry in medium-hot oil (170°C) for 8–10 minutes turning until golden and crispy.",
      "Serve with mint chutney and tamarind chutney."
    ],
    mealType: ['snack'],
    nutrition: { caloriesPer100g:210, proteinG:5, carbsG:28, fatG:9, servingSizeG:100 }
  },
  { id:52, icon:"🥗", cat:"snack", name:"Bhel Puri", time:"10 min", cal:180, p:5, f:5, c:30,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','street-food','quick'],
    ingredients:[
      "2 cups puffed rice (murmura)",
      "½ cup sev (thin chickpea noodles)",
      "1 small onion, finely chopped",
      "1 medium potato, boiled and cubed",
      "1 tomato, finely chopped",
      "2 tbsp tamarind chutney",
      "2 tbsp green mint chutney",
      "1 tsp chaat masala",
      "½ tsp red chili powder",
      "Fresh coriander and lemon"
    ],
    steps:[
      "In a large bowl, combine puffed rice and sev.",
      "Add chopped onion, boiled potato, and tomato. Toss to mix.",
      "Add tamarind chutney, green chutney, chaat masala, and red chili powder.",
      "Mix well and quickly — bhel puri should be eaten immediately before it gets soggy.",
      "Squeeze lemon juice and garnish with fresh coriander.",
      "Tip: Make it spicier with extra green chutney or add raw mango for extra tang."
    ],
    mealType: ['snack'],
    nutrition: { caloriesPer100g:120, proteinG:5, carbsG:30, fatG:5, servingSizeG:150 }
  },
  { id:53, icon:"🥜", cat:"snack", name:"Peanut Chaat", time:"10 min", cal:200, p:9, f:13, c:14,
    cuisine:'north-indian', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['north-indian','vegetarian','high-protein','quick','gluten-free'],
    ingredients:[
      "1 cup raw peanuts",
      "1 small onion, finely chopped",
      "1 tomato, finely chopped",
      "1 green chili, chopped",
      "1 tsp chaat masala",
      "½ tsp red chili powder",
      "Juice of 1 lemon",
      "Fresh coriander, chopped",
      "Salt to taste"
    ],
    steps:[
      "Roast peanuts in a dry pan on medium heat for 5–6 minutes until crunchy and slightly browned. Cool.",
      "In a bowl, combine roasted peanuts with chopped onion, tomato, and green chili.",
      "Add chaat masala, red chili powder, and salt. Toss well.",
      "Squeeze lemon juice and add fresh coriander.",
      "Serve immediately. Peanut chaat is high in protein and healthy fats — excellent pre-workout snack.",
      "Variation: Add boiled chickpeas or pomegranate seeds for extra nutrition."
    ],
    mealType: ['snack'],
    nutrition: { caloriesPer100g:200, proteinG:9, carbsG:14, fatG:13, servingSizeG:100 }
  },
  { id:54, icon:"🍗", cat:"snack", name:"Chicken Tikka", time:"40 min", cal:230, p:28, f:10, c:6,
    cuisine:'north-indian', dietType:['non-vegetarian'],
    tags:['north-indian','non-veg','high-protein','grilled'],
    ingredients:[
      "150g boneless chicken thighs, cut in 2-inch pieces",
      "3 tbsp thick curd (hung curd)",
      "1 tbsp ginger-garlic paste",
      "1 tsp red chili powder",
      "½ tsp kashmiri chili (for color)",
      "½ tsp turmeric",
      "½ tsp cumin powder",
      "½ tsp garam masala",
      "1 tsp kasuri methi",
      "1 tsp lemon juice",
      "1 tsp oil",
      "Salt to taste"
    ],
    steps:[
      "Mix curd with all spices, ginger-garlic paste, lemon juice, and salt.",
      "Add chicken and coat well. Marinate for at least 1 hour (overnight in fridge is best).",
      "Thread chicken on skewers or place on a hot cast-iron grill pan.",
      "Cook on high heat for 3–4 minutes per side until charred spots appear.",
      "Brush with a little oil and cook 2 more minutes until juices run clear.",
      "Internal temperature should reach 75°C. Serve with mint chutney and lemon wedge."
    ],
    mealType: ['snack', 'dinner'],
    nutrition: { caloriesPer100g:153, proteinG:28, carbsG:6, fatG:10, servingSizeG:150 }
  },
  { id:55, icon:"🥩", cat:"snack", name:"Seekh Kebab", time:"30 min", cal:245, p:24, f:14, c:8,
    cuisine:'north-indian', dietType:['non-vegetarian'],
    tags:['north-indian','non-veg','high-protein','grilled'],
    ingredients:[
      "150g minced mutton or chicken (fine keema)",
      "1 small onion, very finely grated",
      "1 tbsp ginger-garlic paste",
      "1 green chili, minced",
      "½ tsp red chili powder",
      "½ tsp garam masala",
      "½ tsp cumin powder",
      "1 tbsp besan (helps bind)",
      "Fresh coriander and mint, finely chopped",
      "Salt to taste",
      "Oil for basting"
    ],
    steps:[
      "Mix all ingredients into the keema and knead well for 3–4 minutes until the mixture becomes slightly sticky.",
      "Refrigerate the mixture for 30 minutes — this helps it hold on skewers.",
      "With wet hands, mold the mixture around flat metal skewers in 4-inch sausage shapes.",
      "Grill on a hot tawa or grill pan, turning every 2 minutes, basting with oil.",
      "Cook for 12–15 minutes until well browned and cooked through.",
      "Serve with mint chutney, sliced onion rings, and lemon wedge."
    ],
    mealType: ['snack', 'dinner'],
    nutrition: { caloriesPer100g:163, proteinG:24, carbsG:8, fatG:14, servingSizeG:150 }
  },
  // ── CONTINENTAL – BREAKFAST ──────────────────────────────────────────────
  { id:56, icon:"🫙", cat:"breakfast", name:"Overnight Oats with Berries", time:"5 min (prep) + overnight", cal:310, p:12, f:8, c:48,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','high-fiber','meal-prep','no-cook'],
    ingredients:[
      "½ cup rolled oats",
      "¾ cup milk (or almond milk for vegan)",
      "½ cup Greek yogurt",
      "1 tbsp chia seeds",
      "1 tsp honey or maple syrup",
      "½ cup mixed berries (blueberry, strawberry, raspberry)",
      "1 tbsp almond flakes",
      "Pinch of cinnamon"
    ],
    steps:[
      "In a mason jar or container, combine oats, chia seeds, and cinnamon.",
      "Add milk and yogurt. Stir well until combined.",
      "Add honey or maple syrup. Mix again.",
      "Cover and refrigerate overnight (minimum 6 hours).",
      "In the morning, top with mixed berries and almond flakes.",
      "No cooking needed! Can be prepared 3–4 jars at once for the week."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:103, proteinG:12, carbsG:48, fatG:8, servingSizeG:300 }
  },
  { id:57, icon:"🥑", cat:"breakfast", name:"Avocado Toast with Poached Egg", time:"15 min", cal:340, p:16, f:20, c:28,
    cuisine:'continental', dietType:['eggetarian','non-vegetarian'],
    tags:['continental','eggetarian','high-protein','healthy-fat'],
    ingredients:[
      "2 slices whole grain sourdough bread",
      "1 ripe avocado",
      "2 eggs",
      "1 tsp white vinegar (for poaching)",
      "Lemon juice",
      "Pinch of red chili flakes",
      "Salt and black pepper",
      "Fresh microgreens or spinach (optional)"
    ],
    steps:[
      "Toast bread slices until golden and crisp.",
      "Mash avocado with lemon juice, salt, and pepper. Spread generously on toast.",
      "Bring a small saucepan of water to a gentle simmer. Add vinegar.",
      "Crack egg into a small cup. Create a gentle swirl in the water with a spoon.",
      "Slide the egg into the centre of the swirl. Poach for 3–4 minutes for a runny yolk.",
      "Remove with a slotted spoon and drain. Place on avocado toast.",
      "Season with chili flakes and black pepper. Serve immediately."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:155, proteinG:16, carbsG:28, fatG:20, servingSizeG:220 }
  },
  { id:58, icon:"🥛", cat:"breakfast", name:"Greek Yogurt Granola Bowl", time:"5 min", cal:290, p:14, f:8, c:42,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','high-protein','quick','probiotic'],
    ingredients:[
      "200g thick Greek yogurt",
      "¼ cup store-bought granola (or homemade)",
      "1 tbsp honey",
      "½ banana, sliced",
      "2 tbsp mixed berries",
      "1 tsp chia seeds",
      "A few walnuts"
    ],
    steps:[
      "Spoon Greek yogurt into a bowl.",
      "Top with granola for crunch.",
      "Add sliced banana and berries.",
      "Drizzle honey on top.",
      "Sprinkle chia seeds and walnuts.",
      "Eat immediately — granola loses its crunch if it sits too long in yogurt."
    ],
    mealType: ['breakfast'],
    nutrition: { caloriesPer100g:116, proteinG:14, carbsG:42, fatG:8, servingSizeG:250 }
  },
  // ── CONTINENTAL – LUNCH ──────────────────────────────────────────────────
  { id:59, icon:"🥗", cat:"lunch", name:"Quinoa Buddha Bowl", time:"25 min", cal:380, p:14, f:12, c:54,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','vegan','high-fiber','balanced'],
    ingredients:[
      "½ cup quinoa",
      "½ cup chickpeas (canned or boiled)",
      "1 cup mixed greens (spinach, arugula, kale)",
      "½ cup roasted sweet potato cubes",
      "½ avocado, sliced",
      "¼ cup cherry tomatoes",
      "2 tbsp tahini",
      "1 lemon, juiced",
      "1 garlic clove, minced",
      "Olive oil, salt, pepper"
    ],
    steps:[
      "Cook quinoa: Rinse and cook in 1 cup water with a pinch of salt for 12–15 min. Fluff with fork.",
      "Roast sweet potato: Toss cubes in olive oil, salt, pepper. Roast at 200°C for 20 minutes.",
      "Season chickpeas with cumin, paprika, salt, and olive oil. Either roast or use as is.",
      "Make tahini dressing: Whisk tahini with lemon juice, garlic, salt, and 2 tbsp water.",
      "Assemble bowl: Quinoa base, then greens, sweet potato, chickpeas, avocado, and cherry tomatoes.",
      "Drizzle tahini dressing generously. Serve immediately."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:109, proteinG:14, carbsG:54, fatG:12, servingSizeG:350 }
  },
  { id:60, icon:"🥗", cat:"lunch", name:"Grilled Chicken Caesar Salad", time:"25 min", cal:360, p:32, f:18, c:14,
    cuisine:'continental', dietType:['non-vegetarian'],
    tags:['continental','non-veg','high-protein','classic'],
    ingredients:[
      "150g chicken breast",
      "2 cups romaine lettuce, chopped",
      "2 tbsp Caesar dressing (store-bought or homemade)",
      "2 tbsp parmesan cheese, grated",
      "4 croutons (small)",
      "For chicken: olive oil, garlic powder, salt, pepper",
      "Lemon wedge"
    ],
    steps:[
      "Season chicken breast with olive oil, garlic powder, salt, and pepper.",
      "Grill on a hot grill pan for 5–6 minutes per side until internal temp reaches 75°C.",
      "Rest the chicken for 3 minutes. Then slice diagonally.",
      "Toss romaine lettuce with Caesar dressing in a large bowl.",
      "Plate the dressed lettuce. Top with sliced chicken, croutons, and parmesan.",
      "Squeeze lemon on the chicken. Serve immediately."
    ],
    mealType: ['lunch'],
    nutrition: { caloriesPer100g:120, proteinG:32, carbsG:14, fatG:18, servingSizeG:300 }
  },
  { id:61, icon:"🌯", cat:"lunch", name:"Tuna Wrap", time:"10 min", cal:350, p:30, f:10, c:34,
    cuisine:'continental', dietType:['non-vegetarian'],
    tags:['continental','non-veg','high-protein','quick','omega-3'],
    ingredients:[
      "1 can (120g) tuna in water, drained",
      "1 large whole wheat wrap or tortilla",
      "2 tbsp Greek yogurt or light mayo",
      "1 celery stalk, finely chopped",
      "1 tbsp red onion, finely chopped",
      "½ cup mixed greens",
      "1 tbsp lemon juice",
      "½ tsp black pepper",
      "Salt to taste",
      "4 slices cucumber"
    ],
    steps:[
      "Mix tuna with Greek yogurt, lemon juice, celery, red onion, salt, and pepper.",
      "Warm the wrap in a dry pan or microwave for 15 seconds.",
      "Lay mixed greens down the centre of the wrap.",
      "Spoon tuna mixture over the greens.",
      "Add cucumber slices.",
      "Roll tightly, tucking in the sides. Cut diagonally and serve immediately."
    ],
    mealType: ['lunch'],
    nutrition: { caloriesPer100g:140, proteinG:30, carbsG:34, fatG:10, servingSizeG:250 }
  },
  { id:62, icon:"🥗", cat:"lunch", name:"Greek Salad with Hummus", time:"10 min", cal:280, p:10, f:16, c:26,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','vegan','quick','mediterranean'],
    ingredients:[
      "1 cup romaine lettuce, chopped",
      "1 medium cucumber, diced",
      "1 cup cherry tomatoes, halved",
      "½ red onion, thinly sliced",
      "½ cup kalamata olives",
      "50g feta cheese, crumbled",
      "1 tbsp olive oil",
      "1 tbsp red wine vinegar",
      "½ tsp dried oregano",
      "Salt and pepper",
      "3 tbsp hummus",
      "Pita bread (1 piece, optional)"
    ],
    steps:[
      "Combine lettuce, cucumber, tomatoes, onion, and olives in a large bowl.",
      "Drizzle olive oil and red wine vinegar over the salad.",
      "Season with oregano, salt, and pepper. Toss gently.",
      "Top with crumbled feta cheese — don't over-toss after adding feta.",
      "Serve alongside hummus and pita or use hummus as a dip for the pita bread.",
      "Tip: Let salad sit 5 minutes after dressing — the vegetables absorb flavor better."
    ],
    mealType: ['lunch', 'snack'],
    nutrition: { caloriesPer100g:93, proteinG:10, carbsG:26, fatG:16, servingSizeG:300 }
  },
  { id:63, icon:"🍲", cat:"lunch", name:"Lentil Soup with Bread", time:"35 min", cal:320, p:16, f:6, c:52,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','vegan','high-fiber','warming'],
    ingredients:[
      "½ cup red lentils",
      "1 medium carrot, diced",
      "1 celery stalk, diced",
      "1 medium onion, chopped",
      "3 garlic cloves, minced",
      "2 cups vegetable stock",
      "1 tsp cumin powder",
      "½ tsp smoked paprika",
      "½ tsp turmeric",
      "1 tbsp olive oil",
      "Lemon juice",
      "Salt and pepper",
      "2 slices whole grain bread"
    ],
    steps:[
      "Heat olive oil in a pot. Add onion, carrot, and celery. Sauté 5 minutes until softened.",
      "Add garlic, cumin, paprika, and turmeric. Cook 1 minute until fragrant.",
      "Add rinsed lentils and vegetable stock. Bring to a boil.",
      "Reduce heat, cover, and simmer for 20–25 minutes until lentils are completely soft.",
      "Use an immersion blender to partially blend — leave some texture.",
      "Season with salt, pepper, and a squeeze of lemon. Serve with whole grain bread."
    ],
    mealType: ['lunch', 'dinner'],
    nutrition: { caloriesPer100g:80, proteinG:16, carbsG:52, fatG:6, servingSizeG:400 }
  },
  // ── CONTINENTAL – DINNER ─────────────────────────────────────────────────
  { id:64, icon:"🍝", cat:"dinner", name:"Pasta Primavera", time:"25 min", cal:360, p:12, f:10, c:56,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','fiber-rich','quick'],
    ingredients:[
      "100g whole wheat penne or fusilli",
      "1 zucchini, sliced",
      "1 bell pepper, sliced",
      "½ cup cherry tomatoes",
      "½ cup broccoli florets",
      "3 garlic cloves, minced",
      "2 tbsp olive oil",
      "¼ cup pasta water (reserved)",
      "2 tbsp parmesan cheese",
      "½ tsp red chili flakes",
      "Fresh basil",
      "Salt and pepper"
    ],
    steps:[
      "Cook pasta in salted boiling water until al dente. Reserve ¼ cup pasta water before draining.",
      "Heat olive oil in a large pan. Add garlic and chili flakes. Sauté 30 seconds.",
      "Add broccoli and bell pepper. Stir fry on medium-high heat for 3 minutes.",
      "Add zucchini and cherry tomatoes. Cook 2 more minutes.",
      "Add drained pasta to the pan. Toss everything together.",
      "Add reserved pasta water to loosen. Season with salt and pepper.",
      "Serve topped with parmesan and fresh basil leaves."
    ],
    mealType: ['dinner'],
    nutrition: { caloriesPer100g:120, proteinG:12, carbsG:56, fatG:10, servingSizeG:300 }
  },
  { id:65, icon:"🐟", cat:"dinner", name:"Grilled Salmon with Roasted Veggies", time:"30 min", cal:420, p:36, f:22, c:18,
    cuisine:'continental', dietType:['non-vegetarian'],
    tags:['continental','non-veg','high-protein','omega-3','gluten-free'],
    ingredients:[
      "150g salmon fillet (skin-on)",
      "1 medium zucchini, sliced",
      "1 bell pepper, chunks",
      "½ cup cherry tomatoes",
      "2 tbsp olive oil",
      "3 garlic cloves",
      "1 lemon",
      "1 tsp dried herbs (thyme or Italian seasoning)",
      "Salt and black pepper"
    ],
    steps:[
      "Preheat oven to 200°C. Toss vegetables with 1 tbsp olive oil, garlic, herbs, salt, and pepper. Roast 20 minutes.",
      "Pat salmon dry. Season with salt, pepper, and a drizzle of olive oil.",
      "Heat an oven-safe pan on high heat. Place salmon skin-side down.",
      "Press lightly with spatula and cook without moving for 3–4 minutes until skin is crispy.",
      "Flip salmon. Cook 2 minutes more. For medium doneness, the centre should be slightly translucent.",
      "Squeeze lemon over salmon. Serve alongside roasted vegetables."
    ],
    mealType: ['dinner'],
    nutrition: { caloriesPer100g:140, proteinG:36, carbsG:18, fatG:22, servingSizeG:300 }
  },
  { id:66, icon:"🍗", cat:"dinner", name:"Chicken Stir Fry Rice", time:"25 min", cal:390, p:30, f:10, c:46,
    cuisine:'continental', dietType:['non-vegetarian'],
    tags:['continental','non-veg','high-protein','quick'],
    ingredients:[
      "150g chicken breast, thinly sliced",
      "¾ cup cooked rice (day-old rice works best)",
      "1 cup mixed vegetables (carrot, peas, corn, bell pepper)",
      "2 tbsp soy sauce",
      "1 tbsp oyster sauce",
      "1 tsp sesame oil",
      "3 garlic cloves, minced",
      "1-inch ginger, minced",
      "1 egg, beaten",
      "1 tsp oil",
      "Spring onion for garnish"
    ],
    steps:[
      "Heat oil in a wok or large pan on high heat — very hot is key for stir fry.",
      "Add garlic and ginger. Stir fry 20 seconds.",
      "Add chicken and stir fry on high heat until cooked through (4–5 min). Remove and set aside.",
      "Add vegetables to the same pan. Stir fry 2 minutes.",
      "Push everything to the side. Add beaten egg and scramble.",
      "Add cooked rice, soy sauce, and oyster sauce. Toss everything together on high heat.",
      "Return chicken to the wok. Add sesame oil and toss. Garnish with spring onion."
    ],
    mealType: ['dinner'],
    nutrition: { caloriesPer100g:111, proteinG:30, carbsG:46, fatG:10, servingSizeG:350 }
  },
  { id:67, icon:"🍄", cat:"dinner", name:"Mushroom Risotto", time:"35 min", cal:360, p:12, f:12, c:52,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','creamy','comfort-food'],
    ingredients:[
      "¾ cup arborio rice",
      "300g mixed mushrooms (cremini, shiitake, or button)",
      "1 medium onion, finely chopped",
      "3 garlic cloves, minced",
      "2.5 cups warm vegetable stock",
      "½ cup dry white wine or extra stock",
      "2 tbsp butter",
      "2 tbsp parmesan, grated",
      "1 tbsp olive oil",
      "Fresh thyme or parsley",
      "Salt and pepper"
    ],
    steps:[
      "Heat stock and keep it warm on a separate burner — risotto needs warm stock at all times.",
      "Heat olive oil in a wide pan. Sauté mushrooms on high heat until golden (5 min). Season and set aside.",
      "In the same pan, melt 1 tbsp butter. Add onion and garlic, cook until soft.",
      "Add arborio rice. Stir for 1–2 minutes until edges become translucent.",
      "Add wine. Stir until absorbed. Then add warm stock one ladle at a time, stirring constantly and waiting for each ladle to absorb before adding the next (18–20 min).",
      "When rice is al dente and creamy, stir in mushrooms, remaining butter, and parmesan.",
      "Season with salt and pepper. Serve immediately — risotto waits for no one."
    ],
    mealType: ['dinner'],
    nutrition: { caloriesPer100g:103, proteinG:12, carbsG:52, fatG:12, servingSizeG:350 }
  },
  // ── CONTINENTAL – SNACKS ─────────────────────────────────────────────────
  { id:68, icon:"🌰", cat:"snack", name:"Mixed Nuts and Fruit", time:"2 min", cal:190, p:5, f:14, c:16,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','vegan','quick','healthy-fat','meal-prep'],
    ingredients:[
      "10 almonds",
      "5 walnuts",
      "5 cashews",
      "2 tbsp pumpkin seeds",
      "½ apple or ½ banana",
      "Optional: 3 dates or 1 tbsp dried cranberries"
    ],
    steps:[
      "Portion nuts into a small container for easy grab-and-go.",
      "Pair with fresh fruit of choice.",
      "For variety, lightly dry-roast nuts with a pinch of cinnamon.",
      "Avoid salted or flavored commercial nut mixes — plain is always better.",
      "This is the simplest high-quality snack — healthy fats, fiber, and natural sugars for sustained energy."
    ],
    mealType: ['snack'],
    nutrition: { caloriesPer100g:190, proteinG:5, carbsG:16, fatG:14, servingSizeG:100 }
  },
  { id:69, icon:"🥚", cat:"snack", name:"Hard Boiled Eggs", time:"12 min", cal:155, p:13, f:11, c:1,
    cuisine:'continental', dietType:['eggetarian','non-vegetarian'],
    tags:['continental','eggetarian','high-protein','quick','meal-prep'],
    ingredients:[
      "2 large eggs",
      "Water for boiling",
      "Pinch of salt",
      "Black pepper (optional)",
      "Hot sauce or mustard for dipping (optional)"
    ],
    steps:[
      "Place eggs in a saucepan. Cover with cold water by 1 inch.",
      "Bring to a boil over medium-high heat.",
      "Once boiling, reduce heat to low. Simmer for 9–10 minutes for fully set yolk.",
      "Transfer immediately to ice-cold water for 5 minutes — this stops cooking and makes peeling easy.",
      "Peel and season with salt, pepper, or hot sauce.",
      "Batch prep: boil 6 eggs and store unpeeled in the fridge for up to 7 days."
    ],
    mealType: ['snack', 'breakfast'],
    nutrition: { caloriesPer100g:155, proteinG:13, carbsG:1, fatG:11, servingSizeG:100 }
  },
  { id:70, icon:"🥙", cat:"snack", name:"Hummus with Veggies", time:"5 min (store-bought) / 10 min (homemade)", cal:185, p:7, f:9, c:20,
    cuisine:'continental', dietType:['vegetarian','vegan','eggetarian','non-vegetarian'],
    tags:['continental','vegetarian','vegan','high-fiber','mediterranean'],
    ingredients:[
      "4 tbsp hummus (store-bought or homemade)",
      "1 medium carrot, cut in sticks",
      "½ cucumber, sliced",
      "½ bell pepper, sliced",
      "4 celery stalks",
      "Paprika and olive oil drizzle for hummus",
      "For homemade: 1 cup chickpeas, 2 tbsp tahini, 1 lemon, 1 garlic clove, olive oil, salt"
    ],
    steps:[
      "If making hummus: blend chickpeas, tahini, lemon juice, garlic, and salt until very smooth. Add 2–3 tbsp cold water for creaminess. Drizzle olive oil on top.",
      "Prepare vegetables — cut into uniform sticks for easy dipping.",
      "Plate hummus in a shallow bowl. Sprinkle paprika and drizzle olive oil.",
      "Arrange vegetable sticks around the hummus bowl.",
      "Dip and eat. Hummus + raw veggies is a nutritionally complete snack — protein, fiber, and healthy fat."
    ],
    mealType: ['snack'],
    nutrition: { caloriesPer100g:93, proteinG:7, carbsG:20, fatG:9, servingSizeG:200 }
  }
];

function getFilteredRecipes(profile, options) {
  options = options || {};
  var mealType  = options.mealType;
  var goal      = options.goal;
  var limit     = options.limit || 20;

  var avoidances    = (profile.culturalFoodAvoidances || []).map(function(a){ return a.toLowerCase(); });
  var userFoodNames = (profile.foodList || []).map(function(f){ return f.name.toLowerCase(); });
  var hasFoodList   = userFoodNames.length >= 10;
  var cuisine       = profile.cuisinePreference || 'mixed';

  var results = RECIPES.filter(function(r) {
    // 1. Hard-exclude if recipe name OR any ingredient matches an avoidance
    if (avoidances.length > 0) {
      var ingredLower = (r.ingredients || []).map(function(i){ return i.toLowerCase(); });
      var inName = r.name.toLowerCase();
      if (avoidances.some(function(a){ return inName.includes(a) || ingredLower.some(function(i){ return i.includes(a); }); })) return false;
    }

    // 1b. Diet type filter
    if (profile.dietType && r.dietType && r.dietType.length > 0) {
      var userDiet = profile.dietType;
      // For vegan: only accept vegan recipes
      if (userDiet === 'vegan' && !r.dietType.includes('vegan')) return false;
      // For vegetarian: accept vegetarian or vegan; reject non-vegetarian
      if (userDiet === 'vegetarian' && !r.dietType.some(function(d){ return d === 'vegetarian' || d === 'vegan'; })) return false;
      // For eggetarian: accept eggetarian, vegetarian, vegan; reject non-vegetarian
      if (userDiet === 'eggetarian' && !r.dietType.some(function(d){ return d === 'eggetarian' || d === 'vegetarian' || d === 'vegan'; })) return false;
      // non-vegetarian: no restriction
    }

    // 2. Food list filter (only when >= 10 items in user's list)
    if (hasFoodList && r.ingredients && r.ingredients.length > 0) {
      var allInList = r.ingredients.every(function(ing) {
        return userFoodNames.some(function(fn){ return ing.toLowerCase().includes(fn) || fn.includes(ing.toLowerCase()); });
      });
      if (!allInList) return false;
    }

    // 3. Cuisine filter
    if (cuisine !== 'mixed' && r.cuisine !== cuisine && r.cuisine !== 'mixed') return false;

    // 4. Meal type filter
    if (mealType && r.mealType && r.mealType.length > 0 && !r.mealType.includes(mealType)) return false;

    return true;
  });

  // 5. Goal-based sort boost
  if (goal === 'weight-loss') {
    results.sort(function(a, b) {
      return ((a.nutrition && a.nutrition.caloriesPer100g) || 9999) - ((b.nutrition && b.nutrition.caloriesPer100g) || 9999);
    });
  } else if (goal === 'muscle-gain') {
    results.sort(function(a, b) {
      return ((b.nutrition && b.nutrition.proteinG) || 0) - ((a.nutrition && a.nutrition.proteinG) || 0);
    });
  }

  return results.slice(0, limit);
}
if (typeof window !== 'undefined') window.getFilteredRecipes = getFilteredRecipes;

function buildRecipes() {
  var subtitle = document.getElementById('recipeSectionSubtitle');
  if (subtitle) {
    var dietLabel = {
      standard:         'All recipes',
      vegetarian:       'Vegetarian recipes',
      vegan:            'Vegan recipes',
      eggetarian:       'Egg-friendly recipes',
      'gluten-free':    'Gluten-free recipes',
      'non-vegetarian': 'All recipes'
    };
    var diet    = currentUser && currentUser.profile && currentUser.profile.dietType;
    var cuisine = currentUser && currentUser.profile && currentUser.profile.cuisinePreference;
    var cuisineLabel = (cuisine && cuisine !== 'mixed')
      ? ' · ' + cuisine.replace('-', ' ') + ' cuisine'
      : '';
    subtitle.textContent = (dietLabel[diet] || 'All recipes') + cuisineLabel + ' · Filtered for your profile';
  }

  var cats = ['all','breakfast','lunch','dinner','snack','chutney'];
  var filtersEl = document.getElementById('recipeFilters');
  filtersEl.innerHTML = cats.map(function(c) {
    return '<button class="filter-pill' + (c === 'all' ? ' active' : '') + '" onclick="filterRecipes(\'' + c + '\',this)">' +
      c.charAt(0).toUpperCase() + c.slice(1) +
    '</button>';
  }).join('') +
  '<button id="cuisineToggleBtn" class="filter-pill" style="margin-left:8px;background:#f0fdf4;color:#166534;border-color:#bbf7d0" onclick="toggleCuisineFilter(this)">🌍 Show All Cuisines</button>';

  renderRecipes('all');
}

function filterRecipes(cat, btn) {
  currentRecipeFilter = cat;
  document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderRecipes(cat);
}

function renderRecipes(cat) {
  var profile = (currentUser && currentUser.profile) || {};
  var overrideProfile = window._recipeShowAll
    ? Object.assign({}, profile, { cuisinePreference: 'mixed' })
    : profile;

  var goal = profile.primaryGoal;
  var recs;
  if (typeof getFilteredRecipes === 'function') {
    recs = getFilteredRecipes(overrideProfile, {
      limit: 200,
      goal: goal,
      mealType: (cat && cat !== 'all') ? cat : undefined
    });
  } else {
    recs = (cat === 'all') ? RECIPES : RECIPES.filter(function(r) { return r.cat === cat; });
  }

  var grid = document.getElementById('recipeGrid');
  if (!recs || recs.length === 0) {
    var emptyMsg = 'No recipes match your profile preferences.';
    var toggleHint = !window._recipeShowAll
      ? ' <button onclick="toggleCuisineFilter(document.getElementById(\'cuisineToggleBtn\'))" style="color:#1b4332;background:none;border:none;cursor:pointer;text-decoration:underline">Try showing all cuisines</button>'
      : ' Try adjusting your food avoidances or dietary settings.';
    grid.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center">' + emptyMsg + toggleHint + '</p>';
    return;
  }

  grid.innerHTML = recs.map(function(r) { return (
    '<div class="recipe-card">' +
      '<div class="recipe-header">' +
        '<div class="r-icon">' + r.icon + '</div>' +
        '<div class="r-name">' + r.name + '</div>' +
        '<div class="r-time">⏱️ ' + r.time + ' · ' + r.cal + ' kcal</div>' +
      '</div>' +
      '<div class="recipe-body">' +
        '<div class="recipe-macros">' +
          '<span class="macro-pill p">P ' + r.p + 'g</span>' +
          '<span class="macro-pill f">F ' + r.f + 'g</span>' +
          '<span class="macro-pill c">C ' + r.c + 'g</span>' +
          '<span class="macro-pill cal">' + r.cal + ' kcal</span>' +
        '</div>' +
        '<div class="recipe-tags">' +
          r.tags.map(function(t) { return '<span class="tag' + (t.includes('ban') ? ' red' : '') + '">' + t + '</span>'; }).join('') +
        '</div>' +
      '</div>' +
      '<div class="recipe-expand" id="rx-' + r.id + '">' +
        '<h4>🛒 Ingredients</h4>' +
        '<ul>' + r.ingredients.map(function(i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' +
        '<h4>👨‍🍳 Method</h4>' +
        '<ol>' + r.steps.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
        (r.tip ? '<div class="recipe-tip">💡 ' + r.tip + '</div>' : '') +
      '</div>' +
      '<div style="padding:10px 16px;border-top:1px solid var(--border)">' +
        '<button class="btn btn-primary btn-sm" onclick="toggleRecipe(' + r.id + ')">View Recipe ▼</button>' +
      '</div>' +
    '</div>'
  ); }).join('');
}

function toggleRecipe(id) {
  const el = document.getElementById("rx-"+id);
  el.classList.toggle("open");
  const btn = el.nextElementSibling.querySelector("button");
  btn.textContent = el.classList.contains("open") ? "Hide Recipe ▲" : "View Recipe ▼";
}
