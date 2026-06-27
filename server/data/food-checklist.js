'use strict';

const FOOD_ITEMS = {
  grains: [
    { name: 'Rice',           communities: ['Telugu','Tamil','Kannada','Malayalam'], default: true },
    { name: 'Idli',           communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Dosa',           communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Pesarattu',      communities: ['Telugu'] },
    { name: 'Upma',           communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Pongal',         communities: ['Telugu','Tamil'] },
    { name: 'Ragi Mudde',     communities: ['Kannada'] },
    { name: 'Appam',          communities: ['Malayalam','Tamil'] },
    { name: 'Puttu',          communities: ['Malayalam','Tamil'] },
    { name: 'Chapati / Roti', communities: ['Hindi'],              default: true },
    { name: 'Paratha',        communities: ['Hindi'] },
    { name: 'Poha',           communities: ['Hindi'] },
    { name: 'Bread',          communities: [],                     default: true },
    { name: 'Oats',           communities: [],                     default: true },
    { name: 'Millet (Jowar/Bajra)', communities: ['Hindi','Telugu'] },
    { name: 'Semolina (Rava)',communities: ['Telugu','Tamil','Kannada'] },
  ],
  vegetables: [
    { name: 'Tomato',         communities: [], default: true },
    { name: 'Onion',          communities: [], default: true },
    { name: 'Spinach',        communities: [], default: true },
    { name: 'Brinjal (Eggplant)', communities: ['Telugu','Tamil','Kannada'] },
    { name: 'Gongura (Sorrel Leaves)', communities: ['Telugu'] },
    { name: 'Raw Banana',     communities: ['Telugu','Tamil','Malayalam'] },
    { name: 'Drumstick',      communities: ['Telugu','Tamil'] },
    { name: 'Bitter Gourd',   communities: ['Telugu','Tamil','Kannada'] },
    { name: 'Ridge Gourd',    communities: ['Telugu','Tamil'] },
    { name: 'Bottle Gourd',   communities: ['Hindi','Telugu'] },
    { name: 'Cauliflower',    communities: ['Hindi'],             default: true },
    { name: 'Cabbage',        communities: [], default: true },
    { name: 'Carrot',         communities: [], default: true },
    { name: 'Potato',         communities: [], default: true },
    { name: 'Beans',          communities: [], default: true },
    { name: 'Pumpkin',        communities: ['Telugu','Malayalam'] },
    { name: 'Ash Gourd',      communities: ['Tamil','Kannada','Malayalam'] },
    { name: 'Taro Root (Colocasia)', communities: ['Telugu','Tamil','Malayalam'] },
  ],
  proteins: [
    { name: 'Eggs',           communities: [], default: true },
    { name: 'Chicken',        communities: [], default: true },
    { name: 'Mutton',         communities: ['Telugu','Tamil'] },
    { name: 'Fish',           communities: ['Telugu','Tamil','Malayalam','Kannada'] },
    { name: 'Prawns',         communities: ['Telugu','Tamil','Malayalam'] },
    { name: 'Lentils (Dal)',  communities: [], default: true },
    { name: 'Chana Dal',      communities: ['Telugu','Tamil','Hindi'] },
    { name: 'Toor Dal',       communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Urad Dal',       communities: ['Telugu','Tamil','Kannada'] },
    { name: 'Moong Dal',      communities: [], default: true },
    { name: 'Rajma',          communities: ['Hindi'] },
    { name: 'Chhole',         communities: ['Hindi'] },
    { name: 'Soya Chunks',    communities: ['Telugu','Hindi'] },
    { name: 'Paneer',         communities: ['Hindi'],             default: true },
    { name: 'Tofu',           communities: [] },
  ],
  dairy: [
    { name: 'Milk',           communities: [], default: true },
    { name: 'Curd / Yoghurt', communities: [], default: true },
    { name: 'Ghee',           communities: ['Telugu','Tamil','Kannada','Hindi'], default: true },
    { name: 'Cheese',         communities: [] },
    { name: 'Butter',         communities: [], default: true },
  ],
  snacks: [
    { name: 'Murukku',        communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Mixture',        communities: ['Telugu','Tamil'] },
    { name: 'Biscuits',       communities: [], default: true },
    { name: 'Peanuts',        communities: [], default: true },
    { name: 'Banana',         communities: [], default: true },
    { name: 'Apple',          communities: [], default: true },
    { name: 'Puffed Rice (Murmura)', communities: ['Telugu','Hindi'] },
    { name: 'Chikki',         communities: ['Hindi','Telugu'] },
    { name: 'Boiled Chickpeas', communities: ['Telugu','Tamil'] },
  ],
  beverages: [
    { name: 'Tea',            communities: [], default: true },
    { name: 'Coffee',         communities: ['Telugu','Tamil','Kannada','Malayalam'], default: true },
    { name: 'Coconut Water',  communities: ['Telugu','Tamil','Malayalam','Kannada'] },
    { name: 'Buttermilk',     communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Fruit Juice',    communities: [], default: true },
    { name: 'Water',          communities: [], default: true },
  ]
};

/**
 * Returns checklist items for each category, pre-selected based on languageCommunity.
 * @param {string} languageCommunity
 * @param {string[]} culturalFoodAvoidances
 * @returns {{ category: string, items: { name: string, preSelected: boolean }[] }[]}
 */
function getChecklist(languageCommunity, culturalFoodAvoidances = []) {
  const avoidSet = new Set((culturalFoodAvoidances || []).map(a => a.toLowerCase()));
  return Object.entries(FOOD_ITEMS).map(([category, items]) => {
    const filtered = items.filter(item => !avoidSet.has(item.name.toLowerCase()));
    const enriched = filtered.map(item => ({
      name: item.name,
      preSelected: item.communities.includes(languageCommunity) || (item.default === true && !item.communities.length)
    }));
    enriched.sort((a, b) => (b.preSelected ? 1 : 0) - (a.preSelected ? 1 : 0));
    return { category, items: enriched };
  });
}

module.exports = { getChecklist, FOOD_ITEMS };
