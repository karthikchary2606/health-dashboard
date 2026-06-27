let currentRecipeFilter = 'all';

const RECIPES = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────────
  { id:0, icon:"🥞", cat:"breakfast", name:"Pesarattu (Moong Dal Crepes)", time:"25 min", cal:240, p:12, f:4, c:38,
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
    ]
  },
  { id:1, icon:"🍳", cat:"breakfast", name:"Andhra Anda Bhurji (Egg Scramble)", time:"12 min", cal:280, p:18, f:20, c:5,
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
    ]
  },
  { id:2, icon:"🍳", cat:"breakfast", name:"Masala Omelet (Telugu Style)", time:"10 min", cal:265, p:18, f:20, c:4,
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
    ]
  },
  { id:3, icon:"🥣", cat:"breakfast", name:"Oats Upma (Oat Rava Upma)", time:"15 min", cal:220, p:8, f:5, c:35,
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
    ]
  },
  { id:4, icon:"🥣", cat:"breakfast", name:"Rava Upma (Semolina Upma)", time:"20 min", cal:210, p:6, f:5, c:36,
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
    ]
  },
  { id:5, icon:"🍚", cat:"breakfast", name:"Idli with Sambar & Chutney", time:"20 min (store-bought batter)", cal:200, p:6, f:2, c:40,
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
    ]
  },
  { id:6, icon:"🧀", cat:"breakfast", name:"Paneer Bhurji (Scrambled Cottage Cheese)", time:"15 min", cal:235, p:14, f:17, c:6,
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
    ]
  },
  // ── DAL & VEGETARIAN CURRIES ──────────────────────────────────────────────
  { id:7, icon:"🍲", cat:"lunch", name:"Kandi Pappu (Andhra Toor Dal)", time:"25 min", cal:185, p:11, f:5, c:26,
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
    ]
  },
  { id:8, icon:"🥬", cat:"lunch", name:"Palakura Pappu (Spinach Dal)", time:"30 min", cal:165, p:11, f:4, c:22,
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
    ]
  },
  { id:9, icon:"🍲", cat:"lunch", name:"Sorakaya Pappu (Bottle Gourd Dal)", time:"30 min", cal:145, p:8, f:3, c:20,
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
    ]
  },
  { id:10, icon:"🥘", cat:"lunch", name:"Andhra Sambar", time:"35 min", cal:125, p:5, f:3, c:20,
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
    ]
  },
  { id:11, icon:"🫘", cat:"lunch", name:"Senagapappu Curry (Chana Dal Curry)", time:"30 min", cal:205, p:10, f:5, c:30,
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
    ]
  },
  { id:12, icon:"🫘", cat:"lunch", name:"Soyabean Curry (Thyroid-Safe)", time:"30 min", cal:155, p:12, f:5, c:16,
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
    ]
  },
  { id:13, icon:"🫘", cat:"lunch", name:"Rajma Curry (Kidney Bean Curry)", time:"40 min", cal:225, p:12, f:4, c:34,
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
    ]
  },
  { id:14, icon:"🍆", cat:"lunch", name:"Gutti Vankaya Curry (Stuffed Brinjal Curry)", time:"30 min", cal:165, p:4, f:9, c:19,
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
    ]
  },
  { id:15, icon:"🥚", cat:"lunch", name:"Andhra Egg Curry (Kodi Guddu Kura)", time:"25 min", cal:285, p:19, f:21, c:8,
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
    ]
  },
  { id:16, icon:"🧀", cat:"lunch", name:"Tawa Paneer Tikka (No-Oven)", time:"20 min", cal:225, p:15, f:17, c:5,
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
    ]
  },
  { id:17, icon:"🥦", cat:"lunch", name:"Bendakaya Fry (Andhra Okra Fry)", time:"20 min", cal:85, p:2, f:4, c:12,
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
    ]
  },
  // ── CHICKEN ──────────────────────────────────────────────────────────────────
  { id:18, icon:"🍗", cat:"dinner", name:"Kodi Vepudu (Andhra Chicken Fry)", time:"35 min", cal:285, p:33, f:15, c:5,
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
    ]
  },
  { id:19, icon:"🍗", cat:"lunch", name:"Kodi Pulusu (Andhra Chicken Curry)", time:"45 min", cal:265, p:28, f:12, c:10,
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
    ]
  },
  { id:20, icon:"🍗", cat:"lunch", name:"Gongura Chicken Curry", time:"40 min", cal:255, p:30, f:12, c:6,
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
    ]
  },
  { id:21, icon:"🍲", cat:"dinner", name:"Kodi Rasam (Chicken Rasam)", time:"40 min", cal:120, p:15, f:4, c:8,
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
    ]
  },
  // ── CHUTNEYS ──────────────────────────────────────────────────────────────────
  { id:22, icon:"🫙", cat:"chutney", name:"Allam Chutney (Ginger Chutney)", time:"10 min", cal:35, p:1, f:1, c:6,
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
    ]
  },
  { id:23, icon:"🫙", cat:"chutney", name:"Nuvvulu Chutney (Sesame Seed Chutney)", time:"8 min", cal:90, p:3, f:7, c:4,
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
    ]
  },
  { id:24, icon:"🫙", cat:"chutney", name:"Coconut Chutney (Kobbari Pachadi)", time:"8 min", cal:80, p:2, f:7, c:4,
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
    ]
  },
  { id:25, icon:"🫙", cat:"chutney", name:"Tomato Chutney (Tomato Pachadi)", time:"12 min", cal:45, p:1, f:2, c:6,
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
    ]
  },
  { id:26, icon:"🫙", cat:"chutney", name:"Gongura Pachadi (Sorrel Chutney)", time:"15 min", cal:40, p:1, f:2, c:5,
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
    ]
  },
  { id:27, icon:"🫙", cat:"chutney", name:"Pudina Chutney (Mint Green Chutney)", time:"5 min", cal:30, p:1, f:1, c:4,
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
    ]
  },
  // ── SIDES & OTHERS ────────────────────────────────────────────────────────────
  { id:28, icon:"🫓", cat:"breakfast", name:"Phulka / Whole Wheat Roti", time:"20 min", cal:70, p:3, f:1, c:14,
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
    ]
  },
  { id:29, icon:"🥛", cat:"snack", name:"Chaas / Majjiga (Spiced Buttermilk)", time:"3 min", cal:45, p:3, f:2, c:4,
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
    ]
  },
  { id:30, icon:"🌰", cat:"snack", name:"Seed & Nut Mix (Daily Snack)", time:"5 min", cal:160, p:5, f:13, c:6,
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
    ]
  }
];

function buildRecipes() {
  // Update subtitle based on user diet profile
  const subtitle = document.getElementById('recipeSectionSubtitle');
  if (subtitle) {
    const dietLabel = {
      standard:      'All recipes',
      vegetarian:    'Vegetarian recipes',
      vegan:         'Vegan recipes',
      eggetarian:    'Egg-friendly recipes',
      'gluten-free': 'Gluten-free recipes',
      'non-vegetarian': 'All recipes'
    };
    const diet = currentUser && currentUser.profile && currentUser.profile.dietType;
    subtitle.textContent = (dietLabel[diet] || 'All recipes') + ' · Filtered for your health profile';
  }

  const cats = ["all","breakfast","lunch","dinner","snack","chutney"];
  const filtersEl = document.getElementById("recipeFilters");
  filtersEl.innerHTML = cats.map(c =>
    `<button class="filter-pill${c==="all"?" active":""}" onclick="filterRecipes('${c}',this)">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`
  ).join("");
  renderRecipes("all");
}

function filterRecipes(cat, btn) {
  currentRecipeFilter = cat;
  document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderRecipes(cat);
}

function renderRecipes(cat) {
  let recs = cat === "all" ? RECIPES : RECIPES.filter(r => r.cat === cat);

  // Filter by dietary preference when user profile is available
  if (currentUser && currentUser.profile) {
    const diet = currentUser.profile.dietType;

    // Eggetarian, vegetarian, vegan: remove meat/fish (eggs are OK for eggetarian)
    if (diet === 'vegetarian' || diet === 'vegan' || diet === 'eggetarian') {
      recs = recs.filter(r =>
        !r.tags.some(t => ['chicken', 'meat', 'fish', 'non-veg', 'mutton'].includes(t)) &&
        !r.name.toLowerCase().includes('chicken') &&
        !r.name.toLowerCase().match(/\b(fish|mutton|prawn|shrimp)\b/)
      );
    }

    // Vegan: additionally remove eggs and dairy
    if (diet === 'vegan') {
      recs = recs.filter(r =>
        !r.tags.some(t => t.includes('egg')) &&
        !r.name.toLowerCase().match(/\b(egg|omelet|omelette|paneer|ghee|dairy)\b/)
      );
    }
  }

  const grid = document.getElementById("recipeGrid");
  grid.innerHTML = recs.map(r => `
    <div class="recipe-card">
      <div class="recipe-header">
        <div class="r-icon">${r.icon}</div>
        <div class="r-name">${r.name}</div>
        <div class="r-time">⏱️ ${r.time} · ${r.cal} kcal</div>
      </div>
      <div class="recipe-body">
        <div class="recipe-macros">
          <span class="macro-pill p">P ${r.p}g</span>
          <span class="macro-pill f">F ${r.f}g</span>
          <span class="macro-pill c">C ${r.c}g</span>
          <span class="macro-pill cal">${r.cal} kcal</span>
        </div>
        <div class="recipe-tags">
          ${r.tags.map(t => `<span class="tag${t.includes("ban")?" red":""}">${t}</span>`).join("")}
        </div>
      </div>
      <div class="recipe-expand" id="rx-${r.id}">
        <h4>🛒 Ingredients</h4>
        <ul>${r.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>
        <h4>👨‍🍳 Method</h4>
        <ol>${r.steps.map(s=>`<li>${s}</li>`).join("")}</ol>
        ${r.tip ? `<div class="recipe-tip">💡 ${r.tip}</div>` : ""}
      </div>
      <div style="padding:10px 16px;border-top:1px solid var(--border)">
        <button class="btn btn-primary btn-sm" onclick="toggleRecipe(${r.id})">View Recipe ▼</button>
      </div>
    </div>
  `).join("");
}

function toggleRecipe(id) {
  const el = document.getElementById("rx-"+id);
  el.classList.toggle("open");
  const btn = el.nextElementSibling.querySelector("button");
  btn.textContent = el.classList.contains("open") ? "Hide Recipe ▲" : "View Recipe ▼";
}
