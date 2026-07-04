'use strict';
// Telugu / Andhra Pradesh cuisine — authentic regional dishes
// Andhra food is known for bold tamarind, spice, gunpowder masalas, and rice-centric meals.
// All calories are ICMR-estimated per standard serving.

module.exports = {
  breakfast: {
    veg: [
      { name: 'Pesarattu with Upma',           calories: 185, proteinG: 8.0, carbsG: 30.0, fatG: 3.5, estimated: true },
      { name: 'Punugulu with Coconut Chutney',  calories: 210, proteinG: 5.5, carbsG: 35.0, fatG: 5.0, estimated: true },
      { name: 'Idli with Peanut Chutney',       calories: 115, proteinG: 3.5, carbsG: 20.0, fatG: 2.0, estimated: true },
      { name: 'Upma with Kobbari Chutney',      calories: 155, proteinG: 4.0, carbsG: 26.0, fatG: 3.5, estimated: true },
      { name: 'Rava Dosa with Allam Chutney',   calories: 175, proteinG: 4.5, carbsG: 30.0, fatG: 4.0, estimated: true },
      { name: 'Attu (Rice Crepe) with Chutney', calories: 145, proteinG: 3.0, carbsG: 28.0, fatG: 2.5, estimated: true },
      { name: 'Saggubiyyam Upma (Sago)',         calories: 165, proteinG: 1.5, carbsG: 38.0, fatG: 1.0, estimated: true },
      { name: 'Minapa Garelu (Medu Vada) with Sambar', calories: 160, proteinG: 6.5, carbsG: 17.0, fatG: 6.5, estimated: true },
      { name: 'Pesara Attu with Gongura Chutney', calories: 170, proteinG: 7.5, carbsG: 27.0, fatG: 2.5, estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Pesarattu',                  calories: 220, proteinG: 11.0, carbsG: 28.0, fatG: 6.0, estimated: true },
      { name: 'Egg Upma with Chutney',           calories: 200, proteinG: 9.0, carbsG: 23.0, fatG: 7.0, estimated: true },
      { name: 'Andhra Masala Omelette with Rice', calories: 230, proteinG: 10.0, carbsG: 26.0, fatG: 8.0, estimated: true },
      { name: 'Egg Punugulu',                    calories: 240, proteinG: 10.5, carbsG: 30.0, fatG: 8.5, estimated: true },
    ],
    'non-veg': [
      { name: 'Kodi Kura with Attu',             calories: 285, proteinG: 16.0, carbsG: 28.0, fatG: 10.0, estimated: true },
      { name: 'Royyala Fry with Idli',            calories: 220, proteinG: 15.0, carbsG: 21.0, fatG: 6.5, estimated: true },
      { name: 'Andhra Chicken Keema Pesarattu',  calories: 310, proteinG: 18.0, carbsG: 30.0, fatG: 11.0, estimated: true },
    ],
  },

  lunch: {
    veg: [
      { name: 'Pappu Annam with Ghee',           calories: 295, proteinG: 9.5, carbsG: 54.0, fatG: 5.5, estimated: true },
      { name: 'Pulihora (Tamarind Rice)',         calories: 260, proteinG: 5.0, carbsG: 50.0, fatG: 4.0, estimated: true },
      { name: 'Sambar Annam with Vepudu',        calories: 290, proteinG: 8.0, carbsG: 52.0, fatG: 4.5, estimated: true },
      { name: 'Gongura Pappu with Rice',          calories: 275, proteinG: 10.0, carbsG: 50.0, fatG: 3.5, estimated: true },
      { name: 'Gutti Vankaya Curry with Rice',    calories: 300, proteinG: 6.0, carbsG: 52.0, fatG: 6.0, estimated: true },
      { name: 'Daddojanam (Curd Rice)',           calories: 230, proteinG: 6.0, carbsG: 42.0, fatG: 3.5, estimated: true },
      { name: 'Kobbari Annam (Coconut Rice)',     calories: 280, proteinG: 5.5, carbsG: 48.0, fatG: 6.5, estimated: true },
      { name: 'Mamidikaya Pappu with Rice',       calories: 265, proteinG: 9.0, carbsG: 48.0, fatG: 3.0, estimated: true },
      { name: 'Pesara Pappu with Ghee Rice',      calories: 305, proteinG: 12.0, carbsG: 52.0, fatG: 5.0, estimated: true },
      { name: 'Andhra Vegetable Biryani',         calories: 325, proteinG: 8.5, carbsG: 55.0, fatG: 8.0, estimated: true },
    ],
    eggetarian: [
      { name: 'Guddu Kura with Rice',             calories: 330, proteinG: 12.0, carbsG: 50.0, fatG: 8.5, estimated: true },
      { name: 'Egg Biryani (Andhra Style)',        calories: 370, proteinG: 13.0, carbsG: 52.0, fatG: 11.5, estimated: true },
      { name: 'Egg Masala with Pappu Annam',      calories: 345, proteinG: 12.0, carbsG: 51.0, fatG: 9.0, estimated: true },
    ],
    'non-veg': [
      { name: 'Kodi Pulusu with Rice',            calories: 395, proteinG: 22.0, carbsG: 50.0, fatG: 13.0, estimated: true },
      { name: 'Gongura Mamsam with Rice',         calories: 410, proteinG: 24.0, carbsG: 48.0, fatG: 15.0, estimated: true },
      { name: 'Andhra Chicken Biryani',           calories: 450, proteinG: 26.0, carbsG: 52.0, fatG: 16.0, estimated: true },
      { name: 'Royyala Iguru with Rice',          calories: 380, proteinG: 20.0, carbsG: 48.0, fatG: 12.0, estimated: true },
      { name: 'Chepala Pulusu with Rice',         calories: 360, proteinG: 22.0, carbsG: 48.0, fatG: 10.0, estimated: true },
    ],
  },

  snack: {
    veg: [
      { name: 'Murukku with Tea',                calories: 140, proteinG: 2.5, carbsG: 20.0, fatG: 5.5, estimated: true },
      { name: 'Chegodilu',                        calories: 160, proteinG: 3.0, carbsG: 22.0, fatG: 6.0, estimated: true },
      { name: 'Kobbari Mithai',                   calories: 175, proteinG: 2.0, carbsG: 28.0, fatG: 6.5, estimated: true },
      { name: 'Janthikalu with Chutney',          calories: 155, proteinG: 3.0, carbsG: 21.0, fatG: 5.5, estimated: true },
      { name: 'Minapa Sunni Undalu',              calories: 130, proteinG: 5.5, carbsG: 18.0, fatG: 3.0, estimated: true },
      { name: 'Aratipandu (Banana)',              calories: 90,  proteinG: 1.1, carbsG: 23.0, fatG: 0.3, estimated: true },
      { name: 'Palli Chikki (Peanut Bar)',        calories: 145, proteinG: 5.0, carbsG: 16.0, fatG: 7.0, estimated: true },
    ],
    eggetarian: [
      { name: 'Boiled Eggs with Black Pepper',   calories: 150, proteinG: 12.0, carbsG: 1.0, fatG: 9.5, estimated: true },
      { name: 'Egg Bonda',                        calories: 175, proteinG: 8.5, carbsG: 18.0, fatG: 6.5, estimated: true },
    ],
    'non-veg': [
      { name: 'Chicken 65',                       calories: 215, proteinG: 14.0, carbsG: 12.0, fatG: 11.0, estimated: true },
      { name: 'Royyala Vepudu (Prawn Fry)',       calories: 190, proteinG: 16.0, carbsG: 8.0, fatG: 9.5, estimated: true },
      { name: 'Fish Fry (Andhra Style)',          calories: 200, proteinG: 18.0, carbsG: 6.0, fatG: 10.0, estimated: true },
    ],
  },

  dinner: {
    veg: [
      { name: 'Pesarattu with Allam Pachadi',    calories: 180, proteinG: 8.0, carbsG: 30.0, fatG: 3.5, estimated: true },
      { name: 'Pappu with Ghee Rice',             calories: 285, proteinG: 9.5, carbsG: 52.0, fatG: 5.0, estimated: true },
      { name: 'Gongura Pachadi with Roti',        calories: 215, proteinG: 5.5, carbsG: 36.0, fatG: 5.0, estimated: true },
      { name: 'Tomato Pappu with Rice',           calories: 260, proteinG: 8.5, carbsG: 48.0, fatG: 3.5, estimated: true },
      { name: 'Vankaya Fry with Roti',            calories: 225, proteinG: 5.0, carbsG: 32.0, fatG: 7.0, estimated: true },
      { name: 'Saggubiyyam Payasam with Roti',   calories: 240, proteinG: 3.5, carbsG: 45.0, fatG: 4.5, estimated: true },
      { name: 'Minapa Pappu with Rice and Ghee', calories: 300, proteinG: 11.0, carbsG: 52.0, fatG: 5.5, estimated: true },
      { name: 'Kobbari Pachadi with Dosa',        calories: 195, proteinG: 4.5, carbsG: 32.0, fatG: 5.0, estimated: true },
    ],
    eggetarian: [
      { name: 'Guddu Vepudu with Roti',           calories: 280, proteinG: 12.5, carbsG: 30.0, fatG: 10.5, estimated: true },
      { name: 'Egg Curry with Rice',              calories: 325, proteinG: 12.0, carbsG: 50.0, fatG: 8.0, estimated: true },
      { name: 'Egg Pesarattu for Dinner',         calories: 215, proteinG: 10.5, carbsG: 28.0, fatG: 5.5, estimated: true },
    ],
    'non-veg': [
      { name: 'Kodi Kura with Roti',              calories: 355, proteinG: 22.0, carbsG: 30.0, fatG: 14.0, estimated: true },
      { name: 'Gongura Chicken with Rice',        calories: 390, proteinG: 23.0, carbsG: 45.0, fatG: 14.0, estimated: true },
      { name: 'Chepala Pulusu with Rice',         calories: 345, proteinG: 21.0, carbsG: 46.0, fatG: 9.5, estimated: true },
      { name: 'Andhra Lamb Curry with Rice',      calories: 400, proteinG: 22.0, carbsG: 46.0, fatG: 15.0, estimated: true },
      { name: 'Royyala Masala with Roti',         calories: 330, proteinG: 20.0, carbsG: 28.0, fatG: 13.0, estimated: true },
    ],
  },
};
