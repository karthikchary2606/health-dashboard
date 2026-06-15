// Diet data and rendering
const PROGRAM_START = new Date("2026-06-14");

let currentDietMonth = getUserMonthIndex();
let currentDietWeek = 1;

const MONTHLY_DIET = [
  { // Month 1
    name:"Month 1 — Foundation", phase:"Phase 1", calories:"~1200 kcal/day", target:"95→92 kg", weightGoal:92,
    notes:["Telugu comfort food — build the habit","Chicken only Wed & Fri","1 cup rice/day maximum","Walk 20–30 min daily fasted"],
    weekNotes:[
      "Week 1: Focus on routine, don't obsess over calories. Just follow the plan.",
      "Week 2: Weigh every Sunday morning. Aim for -0.5 to -1 kg this week.",
      "Week 3: Increase water to 4L/day. Add 5 extra minutes to your walk.",
      "Week 4: Review — if -3 kg lost → great! If less, reduce rice by ¼ cup next month."
    ],
    days:{
      Monday:{theme:"Upper Push Day — Palakura",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (2 pcs) + Allam Chutney",time:"09:30 AM",cal:280,p:14,f:4,c:42},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Palakura Pappu + 1 Cup Rice + Bendakaya Fry",time:"01:30 PM",cal:460,p:16,f:7,c:80},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea + 10 Almonds + Nuvvulu Mix (20g)",time:"04:30 PM",cal:120,p:4,f:10,c:5},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Capsicum Omelet in Ghee",time:"07:30 PM",cal:330,p:22,f:25,c:3}
      },totals:{cal:1190,p:56,f:46,c:130}},
      Tuesday:{theme:"Lower Body Day — Senagapappu",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji (onion, tomato, ghee)",time:"09:30 AM",cal:340,p:22,f:26,c:6},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Senagapappu Curry + 1 Phulka + Tomato Chutney",time:"01:30 PM",cal:370,p:14,f:7,c:58},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas (Majjiga) 200ml + Seed Mix 20g",time:"04:30 PM",cal:110,p:4,f:6,c:8},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Bhurji (100g) + Cucumber Salad",time:"07:30 PM",cal:300,p:18,f:22,c:6}
      },totals:{cal:1120,p:58,f:61,c:78}},
      Wednesday:{theme:"🍗 CHICKEN DAY — Gongura Kodi",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Rava Upma (small) + Coconut Chutney",time:"09:30 AM",cal:255,p:7,f:5,c:44},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Gongura Chicken Curry 150g + 1 Cup Rice",time:"01:30 PM",cal:490,p:36,f:12,c:62},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea + 10 Almonds",time:"04:30 PM",cal:100,p:3,f:9,c:4},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Sorakaya Pappu (Bottle Gourd Dal) + 1 Phulka",time:"07:30 PM",cal:260,p:10,f:4,c:44}
      },totals:{cal:1105,p:56,f:30,c:154}},
      Thursday:{theme:"Upper Pull Day — Kandi Pappu",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (2 pcs) + Gongura Chutney",time:"09:30 AM",cal:280,p:14,f:4,c:42},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kandi Pappu (Toor Dal) + Steamed Beans + 1 Cup Rice",time:"01:30 PM",cal:420,p:16,f:5,c:74},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea + Seed Mix (pumpkin+sunflower+sesame) 20g",time:"04:30 PM",cal:120,p:5,f:9,c:5},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Egg Curry (3 eggs, tomato-onion gravy)",time:"07:30 PM",cal:320,p:22,f:22,c:10}
      },totals:{cal:1140,p:57,f:40,c:131}},
      Friday:{theme:"🍗 CHICKEN DAY — Kodi Vepudu",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Omelet + Nuvvulu (Sesame) Chutney",time:"09:30 AM",cal:340,p:22,f:26,c:4},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kodi Vepudu (Chicken Fry) 150g + 1 Cup Rice + Raita",time:"01:30 PM",cal:490,p:38,f:15,c:50},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea + 5 Walnuts",time:"04:30 PM",cal:110,p:3,f:10,c:4},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Palakura Pappu (Spinach Dal) + 1 Phulka",time:"07:30 PM",cal:260,p:12,f:5,c:42}
      },totals:{cal:1200,p:75,f:56,c:100}},
      Saturday:{theme:"Active Recovery — Gutti Vankaya",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Omelet + Curry Leaves Tadka",time:"09:30 AM",cal:335,p:22,f:26,c:3},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Gutti Vankaya Curry + 1 Cup Rice + Senagapappu Salad",time:"01:30 PM",cal:440,p:12,f:14,c:62},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 200ml + 10 Walnuts",time:"04:30 PM",cal:155,p:5,f:14,c:8},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Tikka (100g) + Mint Chutney",time:"07:30 PM",cal:285,p:18,f:21,c:5}
      },totals:{cal:1215,p:57,f:75,c:78}},
      Sunday:{theme:"Rest Day — Light & Clean",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Idli (3 pcs) + Sambar + Coconut Chutney",time:"09:30 AM",cal:280,p:9,f:3,c:56},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Sambar Rice (1 cup) + Appalam + Pickle",time:"01:30 PM",cal:400,p:12,f:5,c:72},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Banana + Green Tea",time:"04:30 PM",cal:105,p:1,f:0,c:27},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Pesarattu (2 pcs) + Tomato Chutney",time:"07:30 PM",cal:280,p:12,f:4,c:44}
      },totals:{cal:1065,p:34,f:12,c:199}}
    }
  },
  { // Month 2
    name:"Month 2 — Foundation+", phase:"Phase 1", calories:"~1150 kcal/day", target:"92→89 kg", weightGoal:89,
    notes:["Reduce rice to ¾ cup","Increase protein: add extra egg or 50g more paneer","Add 30-min brisk walk daily","Soyabean 2x/week cooked"],
    weekNotes:[
      "Week 1: You've built the habit. Now tighten portions slightly.",
      "Week 2: Try 2L water before noon. Walk 35 min instead of 20.",
      "Week 3: Track protein — aim for 80g+/day minimum.",
      "Week 4: Last week of Phase 1 — push the walk to 40 min. Prep for Phase 2."
    ],
    days:{
      Monday:{theme:"Upper Push — Palakura Dal",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2-Egg Bhurji + 1 Pesarattu",time:"09:30 AM",cal:310,p:18,f:18,c:22},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Palakura Pappu + ¾ Cup Rice + Tomato Fry",time:"01:30 PM",cal:420,p:15,f:7,c:68},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Roasted Chana (30g) + Green Tea",time:"04:30 PM",cal:130,p:7,f:3,c:19},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Omelet + Onion Tomato Chutney",time:"07:30 PM",cal:330,p:22,f:25,c:5}
      },totals:{cal:1190,p:62,f:53,c:114}},
      Tuesday:{theme:"Lower Body — Rajma",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Oats Upma (40g dry) + Coconut Chutney",time:"09:30 AM",cal:270,p:9,f:5,c:45},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Rajma Curry + ¾ Cup Rice",time:"01:30 PM",cal:380,p:14,f:5,c:65},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 200ml + 10 Almonds",time:"04:30 PM",cal:120,p:4,f:9,c:7},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Curry (100g) + 1 Phulka",time:"07:30 PM",cal:350,p:20,f:22,c:18}
      },totals:{cal:1120,p:47,f:41,c:135}},
      Wednesday:{theme:"🍗 CHICKEN DAY — Chicken Rasam",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Omelet + Green Chutney",time:"09:30 AM",cal:335,p:22,f:26,c:3},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Chicken Rasam + ¾ Cup Rice + Papad",time:"01:30 PM",cal:430,p:32,f:8,c:55},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea + Pumpkin Seeds (20g)",time:"04:30 PM",cal:110,p:5,f:9,c:4},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Kandi Pappu + 1 Phulka",time:"07:30 PM",cal:290,p:12,f:5,c:48}
      },totals:{cal:1165,p:71,f:48,c:110}},
      Thursday:{theme:"Upper Pull — Soyabean Dal",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (2 pcs) + Allam Chutney",time:"09:30 AM",cal:280,p:14,f:4,c:42},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Soyabean Curry (cooked 100g) + ¾ Cup Rice",time:"01:30 PM",cal:400,p:20,f:7,c:64},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Apple + Green Tea",time:"04:30 PM",cal:95,p:1,f:0,c:25},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Egg Curry (3 eggs) + 1 Phulka",time:"07:30 PM",cal:350,p:22,f:22,c:18}
      },totals:{cal:1125,p:57,f:33,c:149}},
      Friday:{theme:"🍗 CHICKEN DAY — Kodi Pulusu",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2 Idli + Sambar + Chutney",time:"09:30 AM",cal:220,p:7,f:2,c:44},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kodi Pulusu (Chicken Curry) 150g + ¾ Cup Rice",time:"01:30 PM",cal:460,p:34,f:12,c:50},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 200ml + Roasted Chana (20g)",time:"04:30 PM",cal:120,p:6,f:3,c:16},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Palakura Pappu + 1 Phulka",time:"07:30 PM",cal:270,p:11,f:5,c:43}
      },totals:{cal:1070,p:58,f:22,c:153}},
      Saturday:{theme:"Active Recovery — Sambar",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + Nuvvulu Chutney",time:"09:30 AM",cal:340,p:22,f:26,c:5},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Sambar + ¾ Cup Rice + Appalam",time:"01:30 PM",cal:380,p:12,f:4,c:70},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"5 Walnuts + Green Tea",time:"04:30 PM",cal:100,p:2,f:9,c:3},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Bhurji (80g) + 1 Phulka",time:"07:30 PM",cal:295,p:16,f:19,c:15}
      },totals:{cal:1115,p:52,f:58,c:93}},
      Sunday:{theme:"Rest — Light Idli Sambar",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Upma (small) + Tomato Chutney",time:"09:30 AM",cal:220,p:6,f:4,c:38},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Sambar Rice ¾ Cup + Papad",time:"01:30 PM",cal:360,p:11,f:4,c:65},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Guava + Green Tea",time:"04:30 PM",cal:65,p:1,f:0,c:15},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Bhurji + Onion Chutney",time:"07:30 PM",cal:330,p:22,f:26,c:4}
      },totals:{cal:975,p:40,f:34,c:122}}
    }
  },
  { // Month 3
    name:"Month 3 — Strength", phase:"Phase 2", calories:"~1050 kcal/day", target:"89→86 kg", weightGoal:86,
    notes:["Replace rice with phulka for dinner","½ cup rice at lunch only","Increase protein to 90g+/day","4-day workout with progressive overload"],
    weekNotes:[
      "Week 1: No rice at dinner — switch fully to phulka. This is the biggest change.",
      "Week 2: Add an extra egg or 20g more dal protein to hit 90g/day.",
      "Week 3: Increase weights by 1–2 kg this week in all exercises.",
      "Week 4: Take progress photos. Compare with Month 1 — you've come far!"
    ],
    days:{
      Monday:{theme:"Upper Push — Pesarattu Power",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (2 pcs) + Allam Chutney",time:"09:30 AM",cal:280,p:14,f:4,c:42},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Palakura Pappu + ½ Cup Rice + Bendakaya Fry",time:"01:30 PM",cal:380,p:15,f:7,c:60},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Roasted Chana (30g) + Green Tea",time:"04:30 PM",cal:130,p:7,f:3,c:19},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Capsicum Omelet + 1 Phulka",time:"07:30 PM",cal:370,p:24,f:25,c:15}
      },totals:{cal:1160,p:60,f:39,c:136}},
      Tuesday:{theme:"Lower Body — Kandi Pappu",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + 1 Pesarattu",time:"09:30 AM",cal:390,p:24,f:22,c:22},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kandi Pappu + ½ Cup Rice + Tomato Fry",time:"01:30 PM",cal:370,p:15,f:5,c:62},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 200ml + Seed Mix 20g",time:"04:30 PM",cal:110,p:4,f:6,c:8},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Bhurji (100g) + 1 Phulka",time:"07:30 PM",cal:320,p:18,f:21,c:15}
      },totals:{cal:1190,p:61,f:54,c:107}},
      Wednesday:{theme:"🍗 CHICKEN DAY — Gongura Chicken",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2-Egg Bhurji + Upma (small)",time:"09:30 AM",cal:320,p:16,f:15,c:30},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Gongura Chicken 150g + ½ Cup Rice",time:"01:30 PM",cal:440,p:36,f:12,c:42},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea + 10 Almonds",time:"04:30 PM",cal:100,p:3,f:9,c:4},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Sorakaya Pappu + 1 Phulka",time:"07:30 PM",cal:240,p:9,f:4,c:40}
      },totals:{cal:1100,p:64,f:40,c:116}},
      Thursday:{theme:"Upper Pull — Soyabean",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (2 pcs) + Coconut Chutney",time:"09:30 AM",cal:285,p:13,f:5,c:44},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Soyabean Curry (cooked 100g) + ½ Cup Rice",time:"01:30 PM",cal:360,p:20,f:7,c:54},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Apple + Pumpkin Seeds (15g)",time:"04:30 PM",cal:120,p:3,f:5,c:20},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Egg Curry (3 eggs) + 1 Phulka",time:"07:30 PM",cal:350,p:22,f:22,c:18}
      },totals:{cal:1115,p:58,f:39,c:136}},
      Friday:{theme:"🍗 CHICKEN DAY — Kodi Vepudu",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Omelet + Nuvvulu Chutney",time:"09:30 AM",cal:340,p:22,f:26,c:4},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kodi Vepudu 150g + ½ Cup Rice",time:"01:30 PM",cal:430,p:36,f:14,c:32},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 200ml",time:"04:30 PM",cal:65,p:2,f:1,c:8},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Palakura Pappu + 1 Phulka",time:"07:30 PM",cal:245,p:10,f:5,c:38}
      },totals:{cal:1080,p:70,f:46,c:82}},
      Saturday:{theme:"Active Recovery — Gutti Vankaya",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Oats (40g) + Boiled Egg (1)",time:"09:30 AM",cal:265,p:12,f:7,c:38},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Gutti Vankaya + ½ Cup Rice",time:"01:30 PM",cal:375,p:9,f:12,c:56},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"5 Walnuts + Green Tea",time:"04:30 PM",cal:100,p:2,f:9,c:3},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Tikka (100g) + Mint Chutney",time:"07:30 PM",cal:285,p:18,f:21,c:5}
      },totals:{cal:1025,p:41,f:49,c:102}},
      Sunday:{theme:"Rest — Idli & Sambar",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Idli (2 pcs) + Sambar + Chutney",time:"09:30 AM",cal:200,p:6,f:2,c:40},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Sambar + ½ Cup Rice + Appalam",time:"01:30 PM",cal:330,p:10,f:3,c:62},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Banana",time:"04:30 PM",cal:90,p:1,f:0,c:23},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"2-Egg Omelet + Onion Chutney",time:"07:30 PM",cal:240,p:14,f:18,c:4}
      },totals:{cal:860,p:31,f:23,c:129}}
    }
  },
  { // Month 4
    name:"Month 4 — Strength+", phase:"Phase 2", calories:"~1000 kcal/day", target:"86→83 kg", weightGoal:83,
    notes:["No rice at all — phulka only (2 per meal max)","Protein target: 95g+/day","Supersets in workout","Reduce snack calories"],
    weekNotes:[
      "Week 1: Zero rice week — commit fully. Phulka + dal is your new staple.",
      "Week 2: Supersetting upper/lower reduces rest time. Push through.",
      "Week 3: Add a protein shake if struggling to hit 95g protein.",
      "Week 4: Almost halfway — 12 kg lost if on track. Reward yourself (not with food)."
    ],
    days:{
      Monday:{theme:"Upper Push Superset",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + Pesarattu (1 pc)",time:"09:30 AM",cal:370,p:22,f:25,c:20},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Palakura Pappu + 2 Phulka",time:"01:30 PM",cal:360,p:14,f:7,c:56},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Boiled Egg (1) + Green Tea",time:"04:30 PM",cal:80,p:6,f:5,c:1},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Bhurji (100g) + 1 Phulka",time:"07:30 PM",cal:300,p:18,f:20,c:15}
      },totals:{cal:1110,p:60,f:57,c:92}},
      Tuesday:{theme:"Lower Body Superset",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Oats (40g) + 2 Boiled Eggs",time:"09:30 AM",cal:320,p:16,f:10,c:40},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Rajma Curry + 2 Phulka",time:"01:30 PM",cal:360,p:14,f:5,c:58},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 200ml",time:"04:30 PM",cal:65,p:2,f:1,c:8},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Omelet + 1 Phulka",time:"07:30 PM",cal:360,p:24,f:26,c:15}
      },totals:{cal:1105,p:56,f:42,c:121}},
      Wednesday:{theme:"🍗 CHICKEN DAY — Chicken Curry",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2 Idli + Sambar (light)",time:"09:30 AM",cal:200,p:6,f:2,c:40},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Chicken Curry 150g + 2 Phulka",time:"01:30 PM",cal:440,p:36,f:14,c:32},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"10 Almonds + Green Tea",time:"04:30 PM",cal:90,p:3,f:8,c:3},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Kandi Pappu + 1 Phulka",time:"07:30 PM",cal:260,p:11,f:4,c:42}
      },totals:{cal:990,p:56,f:28,c:117}},
      Thursday:{theme:"Upper Pull Superset",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (2 pcs) + Allam Chutney",time:"09:30 AM",cal:280,p:14,f:4,c:42},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Soyabean Curry (100g cooked) + 2 Phulka",time:"01:30 PM",cal:370,p:22,f:7,c:52},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Guava + Green Tea",time:"04:30 PM",cal:65,p:1,f:0,c:15},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Egg Curry (3 eggs) + 1 Phulka",time:"07:30 PM",cal:350,p:22,f:22,c:18}
      },totals:{cal:1065,p:59,f:33,c:127}},
      Friday:{theme:"🍗 CHICKEN DAY — Kodi Rasam",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + Nuvvulu Chutney",time:"09:30 AM",cal:340,p:22,f:26,c:4},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kodi Rasam Chicken 150g + 2 Phulka",time:"01:30 PM",cal:410,p:34,f:12,c:30},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Boiled Egg (1) + Chaas 100ml",time:"04:30 PM",cal:100,p:8,f:5,c:4},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Palakura Pappu + 1 Phulka",time:"07:30 PM",cal:245,p:10,f:5,c:38}
      },totals:{cal:1095,p:74,f:48,c:76}},
      Saturday:{theme:"Active Recovery — Sambar",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Upma (small) + Boiled Egg (1)",time:"09:30 AM",cal:250,p:9,f:6,c:38},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Sambar + 2 Phulka",time:"01:30 PM",cal:310,p:11,f:4,c:54},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Roasted Chana (20g) + Green Tea",time:"04:30 PM",cal:90,p:4,f:2,c:13},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Tikka (100g) + Mint Chutney",time:"07:30 PM",cal:285,p:18,f:21,c:5}
      },totals:{cal:935,p:42,f:33,c:110}},
      Sunday:{theme:"Rest — Light Clean",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"1 Banana + Boiled Egg (2)",time:"09:30 AM",cal:250,p:14,f:10,c:30},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kandi Pappu + 1 Phulka",time:"01:30 PM",cal:240,p:10,f:4,c:38},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Apple + Green Tea",time:"04:30 PM",cal:95,p:1,f:0,c:25},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"2-Egg Bhurji + Tomato Chutney",time:"07:30 PM",cal:255,p:16,f:18,c:6}
      },totals:{cal:840,p:41,f:32,c:99}}
    }
  },
  { // Month 5
    name:"Month 5 — Cut Phase", phase:"Phase 3", calories:"~960 kcal/day", target:"83→79 kg", weightGoal:79,
    notes:["No rice at all — zero","Phulka 1 per meal only","Add 10-min HIIT twice a week","High protein, low carb"],
    weekNotes:[
      "Week 1: Final phase. This is where the real transformation happens. Stay disciplined.",
      "Week 2: Add 10-min HIIT on Mon/Thu (burpees, jump squats, mountain climbers).",
      "Week 3: Reduce phulka to 1/meal. If hungry, add cucumber or curd.",
      "Week 4: Almost there — 16 kg down. Just 1 month to go!"
    ],
    days:{
      Monday:{theme:"Upper Push + HIIT",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + Pesarattu (1 pc)",time:"09:30 AM",cal:370,p:22,f:25,c:20},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Palakura Pappu + 1 Phulka",time:"01:30 PM",cal:280,p:12,f:5,c:42},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Boiled Egg (1) + Green Tea",time:"04:30 PM",cal:80,p:6,f:5,c:1},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Bhurji (80g) + 1 Phulka",time:"07:30 PM",cal:255,p:15,f:17,c:13}
      },totals:{cal:985,p:55,f:52,c:76}},
      Tuesday:{theme:"Lower Body Circuit",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Oats (30g) + 2 Boiled Eggs",time:"09:30 AM",cal:280,p:15,f:10,c:32},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Senagapappu + 1 Phulka",time:"01:30 PM",cal:270,p:12,f:5,c:42},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 150ml",time:"04:30 PM",cal:50,p:2,f:1,c:6},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Omelet + Tomato Chutney",time:"07:30 PM",cal:320,p:22,f:24,c:4}
      },totals:{cal:920,p:51,f:40,c:84}},
      Wednesday:{theme:"🍗 CHICKEN DAY — Kodi Vepudu",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (1 pc) + Boiled Egg (1)",time:"09:30 AM",cal:210,p:11,f:7,c:26},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kodi Vepudu 150g + 1 Phulka",time:"01:30 PM",cal:370,p:34,f:14,c:18},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"10 Almonds + Green Tea",time:"04:30 PM",cal:90,p:3,f:8,c:3},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Sorakaya Pappu + 1 Phulka",time:"07:30 PM",cal:220,p:8,f:3,c:36}
      },totals:{cal:890,p:56,f:32,c:83}},
      Thursday:{theme:"Upper Pull + HIIT",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + Nuvvulu Chutney",time:"09:30 AM",cal:340,p:22,f:26,c:4},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kandi Pappu + 1 Phulka",time:"01:30 PM",cal:245,p:10,f:4,c:38},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Boiled Egg (1) + Chaas 100ml",time:"04:30 PM",cal:100,p:8,f:5,c:4},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Egg Curry (2 eggs) + 1 Phulka",time:"07:30 PM",cal:250,p:15,f:15,c:15}
      },totals:{cal:935,p:55,f:50,c:61}},
      Friday:{theme:"🍗 CHICKEN DAY — Gongura Chicken",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2-Egg Omelet + 1 Pesarattu",time:"09:30 AM",cal:295,p:16,f:18,c:16},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Gongura Chicken 150g + 1 Phulka",time:"01:30 PM",cal:360,p:34,f:10,c:22},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea only",time:"04:30 PM",cal:5,p:0,f:0,c:1},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Palakura Pappu + 1 Phulka",time:"07:30 PM",cal:245,p:10,f:5,c:38}
      },totals:{cal:905,p:60,f:33,c:77}},
      Saturday:{theme:"Active Recovery — Dal",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"1 Pesarattu + Boiled Egg (2)",time:"09:30 AM",cal:280,p:16,f:12,c:22},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Sambar + 1 Phulka",time:"01:30 PM",cal:230,p:8,f:3,c:40},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Apple",time:"04:30 PM",cal:75,p:0,f:0,c:20},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Tikka (80g) + Mint Chutney",time:"07:30 PM",cal:240,p:15,f:17,c:4}
      },totals:{cal:825,p:39,f:32,c:86}},
      Sunday:{theme:"Rest — Light",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Boiled Eggs (2) + Green Tea",time:"09:30 AM",cal:155,p:12,f:10,c:1},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kandi Pappu + 1 Phulka",time:"01:30 PM",cal:245,p:10,f:4,c:38},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 200ml",time:"04:30 PM",cal:65,p:2,f:1,c:8},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"2-Egg Bhurji + Onion Chutney",time:"07:30 PM",cal:255,p:16,f:18,c:6}
      },totals:{cal:720,p:40,f:33,c:53}}
    }
  },
  { // Month 6
    name:"Month 6 — Peak Cut", phase:"Phase 3", calories:"~940 kcal/day", target:"79→75 kg", weightGoal:75,
    notes:["Zero rice — phulka only","Max 1 phulka per meal","HIIT 3x/week","Final push — stay committed!"],
    weekNotes:[
      "Week 1: Final month. You're 20 kg lighter than when you started. Keep going.",
      "Week 2: Add HIIT 3x/week. Short, intense, effective.",
      "Week 3: Take a full blood panel — thyroid, liver, HbA1c. Celebrate progress with data.",
      "Week 4: Goal achieved! Maintain with 1200 kcal/day and 3x workout."
    ],
    days:{
      Monday:{theme:"Upper Push + HIIT",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + Allam Chutney",time:"09:30 AM",cal:340,p:22,f:26,c:4},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Palakura Pappu + 1 Phulka",time:"01:30 PM",cal:265,p:11,f:5,c:40},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Boiled Egg (1) + Green Tea",time:"04:30 PM",cal:80,p:6,f:5,c:1},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Bhurji (80g) + 1 Phulka",time:"07:30 PM",cal:255,p:15,f:17,c:13}
      },totals:{cal:940,p:54,f:53,c:58}},
      Tuesday:{theme:"Lower Body Circuit",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2 Boiled Eggs + Pesarattu (1 pc)",time:"09:30 AM",cal:250,p:14,f:11,c:22},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Senagapappu + 1 Phulka",time:"01:30 PM",cal:255,p:11,f:4,c:40},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 100ml",time:"04:30 PM",cal:30,p:1,f:0,c:4},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Omelet (no oil) + Tomato Chutney",time:"07:30 PM",cal:310,p:22,f:22,c:4}
      },totals:{cal:845,p:48,f:37,c:70}},
      Wednesday:{theme:"🍗 CHICKEN DAY — Chicken Fry",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Pesarattu (1 pc) + Allam Chutney",time:"09:30 AM",cal:165,p:8,f:2,c:28},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kodi Vepudu 150g + 1 Phulka",time:"01:30 PM",cal:370,p:34,f:14,c:18},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Green Tea only",time:"04:30 PM",cal:5,p:0,f:0,c:1},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Kandi Pappu + 1 Phulka",time:"07:30 PM",cal:245,p:10,f:4,c:38}
      },totals:{cal:785,p:52,f:20,c:85}},
      Thursday:{theme:"Upper Pull + HIIT",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"3-Egg Bhurji + Nuvvulu Chutney",time:"09:30 AM",cal:340,p:22,f:26,c:4},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Palakura Pappu + 1 Phulka",time:"01:30 PM",cal:265,p:11,f:5,c:40},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Boiled Egg (1) + Green Tea",time:"04:30 PM",cal:80,p:6,f:5,c:1},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Egg Curry (2 eggs) + 1 Phulka",time:"07:30 PM",cal:250,p:15,f:15,c:15}
      },totals:{cal:935,p:54,f:51,c:60}},
      Friday:{theme:"🍗 CHICKEN DAY — Gongura Chicken",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2-Egg Omelet + Green Chutney",time:"09:30 AM",cal:235,p:14,f:18,c:3},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Gongura Chicken 150g + 1 Phulka",time:"01:30 PM",cal:360,p:34,f:10,c:22},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"10 Almonds",time:"04:30 PM",cal:70,p:3,f:6,c:2},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Sorakaya Pappu + 1 Phulka",time:"07:30 PM",cal:220,p:8,f:3,c:36}
      },totals:{cal:885,p:59,f:37,c:63}},
      Saturday:{theme:"Active Recovery",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"2 Boiled Eggs + Green Tea",time:"09:30 AM",cal:155,p:12,f:10,c:1},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Sambar + 1 Phulka",time:"01:30 PM",cal:230,p:8,f:3,c:40},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"Chaas 150ml",time:"04:30 PM",cal:50,p:2,f:1,c:6},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"Paneer Bhurji (80g) + 1 Phulka",time:"07:30 PM",cal:255,p:15,f:17,c:13}
      },totals:{cal:690,p:37,f:31,c:60}},
      Sunday:{theme:"Rest Day — Lightest Day",meals:{
        breakfast:{icon:"🌅",label:"Breakfast",cls:"b",name:"Boiled Eggs (2) + Green Tea",time:"09:30 AM",cal:155,p:12,f:10,c:1},
        lunch:{icon:"☀️",label:"Lunch",cls:"l",name:"Kandi Pappu + 1 Phulka",time:"01:30 PM",cal:245,p:10,f:4,c:38},
        snack:{icon:"🍎",label:"Snack",cls:"s",name:"1 Guava",time:"04:30 PM",cal:50,p:1,f:0,c:12},
        dinner:{icon:"🌙",label:"Dinner",cls:"d",name:"3-Egg Omelet + Tomato Chutney",time:"07:30 PM",cal:320,p:22,f:24,c:4}
      },totals:{cal:770,p:45,f:38,c:55}}
    }
  }
];

function buildDietPlan() {
  const curM = getUserMonthIndex();
  const mSel = document.getElementById("dietMonthSelector");
  mSel.innerHTML = ["Month 1","Month 2","Month 3","Month 4","Month 5","Month 6"].map((lbl,i) => {
    const isCur = i === curM;
    return `<button class="month-btn${currentDietMonth===i?" active":""}${isCur?" current-month":""}" onclick="selectDietMonth(${i})">${lbl}${isCur?" ←":""}</button>`;
  }).join("");
  renderDietWeekSelector();
  renderDietMonthView();
}
function selectDietMonth(m) {
  currentDietMonth = m;
  currentDietWeek = 1;
  document.querySelectorAll("#dietMonthSelector .month-btn").forEach((b,i) => b.classList.toggle("active", i===m));
  renderDietWeekSelector();
  renderDietMonthView();
}
function renderDietWeekSelector() {
  const wSel = document.getElementById("dietWeekSelector");
  wSel.innerHTML = [1,2,3,4].map(w =>
    `<button class="week-btn${currentDietWeek===w?" active":""}" onclick="selectDietWeek(${w})">Week ${w}</button>`
  ).join("");
}
function selectDietWeek(w) {
  currentDietWeek = w;
  document.querySelectorAll("#dietWeekSelector .week-btn").forEach((b,i) => b.classList.toggle("active", i+1===w));
  renderDietMonthView();
}
function renderDietMonthView() {
  const md = MONTHLY_DIET[currentDietMonth];
  document.getElementById("dietPhaseBanner").innerHTML = `<div class="phase-banner"><div><h4>📅 ${md.name}</h4><p>${md.notes.join(" · ")}</p></div><div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end"><span class="phase-pill">🎯 ${md.target}</span><span class="phase-pill">🔥 ${md.calories}</span></div></div>`;
  const wNote = md.weekNotes[currentDietWeek-1] || "";
  document.getElementById("dietWeekNote").innerHTML = `<div class="week-note">💡 <strong>Week ${currentDietWeek} tip:</strong> ${wNote}</div>`;
  const days = Object.keys(md.days);
  const tabsEl = document.getElementById("dayTabs");
  tabsEl.innerHTML = "";
  const today = new Date().toLocaleDateString("en-US",{weekday:"long"});
  days.forEach(day => {
    const btn = document.createElement("button");
    btn.className = "day-tab" + (day === today ? " active" : "");
    btn.textContent = day.substring(0,3);
    btn.onclick = () => { document.querySelectorAll(".day-tab").forEach(t => t.classList.remove("active")); btn.classList.add("active"); renderDietDay(day); };
    tabsEl.appendChild(btn);
  });
  renderDietDay(today in md.days ? today : "Monday");
}
function renderDietDay(day) {
  const md = MONTHLY_DIET[currentDietMonth];
  const d = md.days[day];
  if (!d) return;
  let html = `<div class="day-theme">📅 ${day} — ${d.theme}</div>`;
  ["breakfast","lunch","snack","dinner"].forEach(key => {
    const m = d.meals[key];
    html += `<div class="meal-card ${m.cls}"><div class="meal-icon">${m.icon}</div><div class="meal-info"><div class="meal-name">${m.name}</div><div class="meal-time">⏰ ${m.time} · ${m.label}</div></div><div class="meal-macros"><span class="macro-pill cal">${m.cal} kcal</span><br><span class="macro-pill p">P ${m.p}g</span><span class="macro-pill f">F ${m.f}g</span><span class="macro-pill c">C ${m.c}g</span></div></div>`;
  });
  html += `<div class="day-total-bar"><span>🍽️ Day Total:</span><span>🔥 ${d.totals.cal} kcal</span><span>💪 Protein ${d.totals.p}g</span><span>🥑 Fat ${d.totals.f}g</span><span>🌾 Net Carbs ${d.totals.c}g</span></div>`;
  document.getElementById("dietDayContent").innerHTML = html;
}
