const GROCERY_PLAN = [
  { month:"Month 1", budget:5200, categories:[
    { name:"Proteins (Eggs, Paneer, Chicken)", items:[
      {item:"Eggs",qty:"30 pcs",price:180,note:"Buy in trays — cheaper"},
      {item:"Paneer (full-fat)",qty:"400g",price:140,note:"Amul or local fresh"},
      {item:"Chicken (skinless)",qty:"600g",price:200,note:"Wed+Fri portions"},
      {item:"Soyabean (dry)",qty:"200g",price:40,note:"Cook 100g portions"}
    ], total:560 },
    { name:"Dal & Legumes", items:[
      {item:"Kandi Pappu (Toor Dal)",qty:"500g",price:80,note:""},
      {item:"Palakura Pappu (Chana Dal)",qty:"500g",price:75,note:""},
      {item:"Senagapappu (Chickpeas)",qty:"500g",price:70,note:"Soak overnight"},
      {item:"Rajma",qty:"250g",price:55,note:""}
    ], total:280 },
    { name:"Vegetables", items:[
      {item:"Palakura (Spinach)",qty:"500g",price:30,note:"Twice weekly"},
      {item:"Bendakaya (Okra)",qty:"500g",price:40,note:""},
      {item:"Vankaya (Brinjal)",qty:"500g",price:30,note:""},
      {item:"Sorakaya (Bottle Gourd)",qty:"1 kg",price:30,note:""},
      {item:"Tomato",qty:"1 kg",price:40,note:""},
      {item:"Onion",qty:"1 kg",price:35,note:""},
      {item:"Capsicum",qty:"300g",price:30,note:""},
      {item:"Green Chillies",qty:"100g",price:15,note:""},
      {item:"Curry Leaves",qty:"2 bunches",price:10,note:""}
    ], total:260 },
    { name:"Grains & Flour", items:[
      {item:"Rice (raw)",qty:"1 kg",price:60,note:"1 cup/day max"},
      {item:"Wheat Atta",qty:"1 kg",price:55,note:"For phulka"},
      {item:"Rava (Semolina)",qty:"500g",price:35,note:"For upma"},
      {item:"Oats (plain)",qty:"500g",price:80,note:""}
    ], total:230 },
    { name:"Dairy & Fats", items:[
      {item:"Ghee",qty:"200g",price:180,note:"Pure desi preferred"},
      {item:"Curd (plain)",qty:"500g",price:50,note:"Full-fat only"},
      {item:"Buttermilk (Majjiga)",qty:"1 L",price:40,note:""}
    ], total:270 },
    { name:"Nuts, Seeds & Spices", items:[
      {item:"Almonds",qty:"100g",price:120,note:"10/day"},
      {item:"Walnuts",qty:"100g",price:130,note:"5/day"},
      {item:"Pumpkin Seeds",qty:"100g",price:80,note:"Selenium source"},
      {item:"Sesame (Nuvvulu)",qty:"100g",price:40,note:"For chutney"},
      {item:"Ginger (Allam)",qty:"100g",price:20,note:""},
      {item:"Iodized Salt",qty:"1 kg",price:20,note:"MUST be iodized"},
      {item:"Turmeric, Cumin, Coriander",qty:"assorted",price:80,note:""}
    ], total:490 },
    { name:"Beverages & Other", items:[
      {item:"Green Tea",qty:"50 bags",price:80,note:"No sugar"},
      {item:"Coconut (for chutney)",qty:"2 pcs",price:60,note:""},
      {item:"Gongura (Sorrel leaves)",qty:"200g",price:30,note:"Seasonal"}
    ], total:170 }
  ]},
  { month:"Month 2", budget:5100, categories:[
    { name:"Proteins", items:[
      {item:"Eggs",qty:"30 pcs",price:180,note:""},
      {item:"Paneer",qty:"300g",price:105,note:"Reduce slightly"},
      {item:"Chicken",qty:"600g",price:200,note:""},
      {item:"Soyabean (dry)",qty:"200g",price:40,note:""}
    ], total:525 },
    { name:"Dal & Legumes", items:[
      {item:"Kandi Pappu",qty:"500g",price:80,note:""},
      {item:"Palakura Pappu",qty:"500g",price:75,note:""},
      {item:"Rajma",qty:"250g",price:55,note:""},
      {item:"Roasted Chana",qty:"300g",price:60,note:"Snack replacement"}
    ], total:270 },
    { name:"Vegetables", items:[
      {item:"Palakura",qty:"500g",price:30,note:""},
      {item:"Bendakaya",qty:"500g",price:40,note:""},
      {item:"Gutti Vankaya",qty:"500g",price:35,note:""},
      {item:"Tomato",qty:"1 kg",price:40,note:""},
      {item:"Onion",qty:"1 kg",price:35,note:""},
      {item:"Cucumber",qty:"500g",price:25,note:""}
    ], total:205 },
    { name:"Grains & Flour", items:[
      {item:"Rice (raw)",qty:"750g",price:45,note:"Reduce from M1"},
      {item:"Wheat Atta",qty:"1 kg",price:55,note:""},
      {item:"Oats",qty:"500g",price:80,note:""}
    ], total:180 },
    { name:"Dairy & Fats", items:[
      {item:"Ghee",qty:"200g",price:180,note:""},
      {item:"Curd",qty:"500g",price:50,note:""},
      {item:"Buttermilk",qty:"1 L",price:40,note:""}
    ], total:270 },
    { name:"Nuts, Seeds & Spices", items:[
      {item:"Almonds",qty:"100g",price:120,note:""},
      {item:"Walnuts",qty:"100g",price:130,note:""},
      {item:"Pumpkin Seeds",qty:"100g",price:80,note:""},
      {item:"Sesame",qty:"100g",price:40,note:""},
      {item:"Iodized Salt, Spice Mix",qty:"assorted",price:100,note:""}
    ], total:470 },
    { name:"Beverages & Other", items:[
      {item:"Green Tea",qty:"50 bags",price:80,note:""},
      {item:"Coconut",qty:"2 pcs",price:60,note:""},
      {item:"Gongura",qty:"200g",price:30,note:""}
    ], total:170 }
  ]},
  { month:"Months 3–4", budget:5000, categories:[
    { name:"Proteins", items:[
      {item:"Eggs",qty:"35 pcs",price:210,note:"Increase for protein target"},
      {item:"Paneer",qty:"300g",price:105,note:""},
      {item:"Chicken",qty:"600g",price:200,note:""},
      {item:"Soyabean (dry)",qty:"200g",price:40,note:""}
    ], total:555 },
    { name:"Dal & Legumes", items:[
      {item:"Kandi Pappu",qty:"500g",price:80,note:""},
      {item:"Palakura Pappu",qty:"500g",price:75,note:""},
      {item:"Senagapappu",qty:"500g",price:70,note:""},
      {item:"Roasted Chana",qty:"200g",price:40,note:""}
    ], total:265 },
    { name:"Vegetables", items:[
      {item:"Palakura",qty:"500g",price:30,note:""},
      {item:"Bendakaya",qty:"500g",price:40,note:""},
      {item:"Vankaya/Sorakaya",qty:"1 kg",price:50,note:""},
      {item:"Tomato, Onion",qty:"1.5 kg",price:70,note:""},
      {item:"Cucumber",qty:"500g",price:25,note:""}
    ], total:215 },
    { name:"Grains (Atta only — no rice)", items:[
      {item:"Wheat Atta",qty:"1.5 kg",price:82,note:"Phulka only — no rice"},
      {item:"Oats",qty:"500g",price:80,note:""}
    ], total:162 },
    { name:"Dairy & Fats", items:[
      {item:"Ghee",qty:"200g",price:180,note:""},
      {item:"Curd",qty:"500g",price:50,note:""},
      {item:"Buttermilk",qty:"1 L",price:40,note:""}
    ], total:270 },
    { name:"Nuts, Seeds & Spices", items:[
      {item:"Almonds",qty:"100g",price:120,note:""},
      {item:"Pumpkin Seeds",qty:"100g",price:80,note:""},
      {item:"Sesame",qty:"100g",price:40,note:""},
      {item:"Spices + Iodized Salt",qty:"assorted",price:100,note:""}
    ], total:340 },
    { name:"Beverages & Other", items:[
      {item:"Green Tea",qty:"50 bags",price:80,note:""},
      {item:"Coconut",qty:"2 pcs",price:60,note:""},
      {item:"Gongura",qty:"200g",price:30,note:""}
    ], total:170 }
  ]},
  { month:"Months 5–6", budget:4900, categories:[
    { name:"Proteins", items:[
      {item:"Eggs",qty:"40 pcs",price:240,note:"Primary protein — increase"},
      {item:"Paneer",qty:"250g",price:87,note:"Reduce portion"},
      {item:"Chicken",qty:"600g",price:200,note:""},
      {item:"Soyabean",qty:"100g",price:20,note:"Reduce frequency"}
    ], total:547 },
    { name:"Dal & Legumes", items:[
      {item:"Kandi Pappu",qty:"500g",price:80,note:""},
      {item:"Palakura Pappu",qty:"500g",price:75,note:""},
      {item:"Senagapappu",qty:"250g",price:35,note:""}
    ], total:190 },
    { name:"Vegetables", items:[
      {item:"Palakura (Spinach)",qty:"500g",price:30,note:"Daily"},
      {item:"Mixed Vegetables",qty:"1.5 kg",price:80,note:""},
      {item:"Tomato, Onion",qty:"1 kg",price:55,note:""},
      {item:"Cucumber",qty:"500g",price:25,note:"Fill-up snack"}
    ], total:190 },
    { name:"Grains (Minimal)", items:[
      {item:"Wheat Atta",qty:"1 kg",price:55,note:"1 phulka/meal only"},
      {item:"Oats",qty:"250g",price:40,note:""}
    ], total:95 },
    { name:"Dairy & Fats", items:[
      {item:"Ghee",qty:"150g",price:135,note:"Reduce in cut phase"},
      {item:"Curd",qty:"500g",price:50,note:""},
      {item:"Buttermilk",qty:"1 L",price:40,note:""}
    ], total:225 },
    { name:"Nuts & Seeds", items:[
      {item:"Almonds",qty:"100g",price:120,note:""},
      {item:"Pumpkin Seeds",qty:"100g",price:80,note:""},
      {item:"Spices + Iodized Salt",qty:"assorted",price:80,note:""}
    ], total:280 },
    { name:"Beverages & Other", items:[
      {item:"Green Tea",qty:"50 bags",price:80,note:""},
      {item:"Coconut",qty:"1 pc",price:30,note:""},
      {item:"Gongura",qty:"100g",price:15,note:""}
    ], total:125 }
  ]}
];

function buildGrocery() {
  const sel = document.getElementById("groceryMonthSelector");
  sel.innerHTML = ["Month 1","Month 2","Month 3","Month 4","Month 5","Month 6"].map((lbl,i) => {
    return `<button class="month-btn${currentDietMonth===i?" active":""}" onclick="selectGroceryMonth(${i})">${lbl}</button>`;
  }).join("");
  renderGrocery(currentDietMonth);
}
function selectGroceryMonth(m) {
  document.querySelectorAll("#groceryMonthSelector .month-btn").forEach((b,i) => b.classList.toggle("active", i===m));
  renderGrocery(m);
}
function renderGrocery(month) {
  const gIdx = month < 2 ? month : (month < 4 ? 2 : 3);
  const g = GROCERY_PLAN[gIdx];
  const totalSpend = g.categories.reduce((s,c) => s + c.total, 0);
  document.getElementById("groceryBudgetBar").innerHTML = `<div class="phase-banner" style="margin-bottom:14px"><div><h4>🛒 ${g.month} Shopping List</h4><p>Estimated monthly spend · Local Telugu market rates</p></div><div style="text-align:right"><span class="phase-pill" style="font-size:.95rem">💰 ₹${totalSpend.toLocaleString("en-IN")} / ₹${g.budget.toLocaleString("en-IN")} budget</span></div></div>`;
  let html = "";
  g.categories.forEach(cat => {
    html += `<div class="grocery-category"><div class="grocery-cat-title">🛍️ ${cat.name} <span style="margin-left:auto;font-weight:400;font-size:.78rem;color:#555">₹${cat.total.toLocaleString("en-IN")}</span></div><table class="grocery-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Note</th></tr></thead><tbody>`;
    cat.items.forEach(item => {
      html += `<tr><td>${item.item}</td><td>${item.qty}</td><td>₹${item.price}</td><td style="color:#666;font-size:.78rem">${item.note||""}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  });
  html += `<div class="week-note" style="margin-top:16px">🏪 <strong>Shopping tip:</strong> Buy dal, rice, and dry spices in bulk monthly. Shop vegetables twice a week — Tuesdays & Saturdays from local sabzi mandi.</div>`;
  document.getElementById("groceryContent").innerHTML = html;
}
