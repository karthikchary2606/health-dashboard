'use strict';

module.exports = {
  breakfast: {
    veg: [
      { name: 'Avocado Toast', calories: 280, proteinG: 10.0, carbsG: 28.0, fatG: 14.0, estimated: true },
      { name: 'Oatmeal with Berries', calories: 240, proteinG: 8.0, carbsG: 44.0, fatG: 4.0, estimated: true },
      { name: 'Granola with Yogurt', calories: 320, proteinG: 12.0, carbsG: 42.0, fatG: 10.0, estimated: true },
      { name: 'Banana Nut Smoothie Bowl', calories: 350, proteinG: 14.0, carbsG: 48.0, fatG: 12.0, estimated: true },
      { name: 'Whole Grain Pancakes', calories: 380, proteinG: 10.0, carbsG: 52.0, fatG: 14.0, estimated: true },
      { name: 'Smoothie Bowl', calories: 310, proteinG: 11.0, carbsG: 46.0, fatG: 8.0, estimated: true },
    ],
    eggetarian: [
      { name: 'Scrambled Eggs on Toast', calories: 320, proteinG: 16.0, carbsG: 28.0, fatG: 14.0, estimated: true },
      { name: 'Eggs Benedict', calories: 410, proteinG: 18.0, carbsG: 26.0, fatG: 22.0, estimated: true },
      { name: 'French Omelette', calories: 340, proteinG: 20.0, carbsG: 8.0, fatG: 24.0, estimated: true },
      { name: 'Poached Eggs with Sourdough', calories: 350, proteinG: 18.0, carbsG: 30.0, fatG: 16.0, estimated: true },
    ],
    'non-veg': [
      { name: 'Bacon and Eggs', calories: 420, proteinG: 22.0, carbsG: 2.0, fatG: 32.0, estimated: true },
      { name: 'Smoked Salmon Bagel', calories: 380, proteinG: 20.0, carbsG: 42.0, fatG: 12.0, estimated: true },
      { name: 'Chicken Sausage with Toast', calories: 360, proteinG: 24.0, carbsG: 28.0, fatG: 16.0, estimated: true },
      { name: 'Ham and Cheese Omelette', calories: 400, proteinG: 26.0, carbsG: 6.0, fatG: 28.0, estimated: true },
    ],
  },
  lunch: {
    veg: [
      { name: 'Garden Salad with Vinaigrette', calories: 180, proteinG: 8.0, carbsG: 14.0, fatG: 10.5, estimated: true },
      { name: 'Grilled Cheese Sandwich', calories: 420, proteinG: 16.0, carbsG: 38.0, fatG: 22.0, estimated: true },
      { name: 'Caprese Salad with Focaccia', calories: 350, proteinG: 14.0, carbsG: 32.0, fatG: 18.0, estimated: true },
      { name: 'Vegetable Soup with Bread', calories: 280, proteinG: 10.0, carbsG: 42.0, fatG: 6.0, estimated: true },
      { name: 'Mushroom Risotto', calories: 420, proteinG: 12.0, carbsG: 52.0, fatG: 16.0, estimated: true },
      { name: 'Pasta Primavera', calories: 380, proteinG: 14.0, carbsG: 48.0, fatG: 14.0, estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Salad Sandwich', calories: 380, proteinG: 14.0, carbsG: 36.0, fatG: 18.0, estimated: true },
      { name: 'Quiche Lorraine', calories: 480, proteinG: 18.0, carbsG: 26.0, fatG: 32.0, estimated: true },
      { name: 'Frittata with Salad', calories: 350, proteinG: 20.0, carbsG: 12.0, fatG: 22.0, estimated: true },
      { name: 'Egg Fried Rice', calories: 420, proteinG: 16.0, carbsG: 48.0, fatG: 16.0, estimated: true },
    ],
    'non-veg': [
      { name: 'Grilled Chicken Caesar Salad', calories: 380, proteinG: 32.0, carbsG: 16.0, fatG: 18.0, estimated: true },
      { name: 'Tuna Sandwich', calories: 360, proteinG: 28.0, carbsG: 32.0, fatG: 12.0, estimated: true },
      { name: 'Chicken Wrap', calories: 420, proteinG: 30.0, carbsG: 38.0, fatG: 14.0, estimated: true },
      { name: 'Fish and Chips', calories: 520, proteinG: 32.0, carbsG: 48.0, fatG: 22.0, estimated: true },
      { name: 'Prawn Pasta', calories: 460, proteinG: 28.0, carbsG: 44.0, fatG: 16.0, estimated: true },
      { name: 'Turkey Club Sandwich', calories: 480, proteinG: 34.0, carbsG: 36.0, fatG: 18.0, estimated: true },
    ],
  },
  snack: {
    veg: [
      { name: 'Hummus with Pita', calories: 240, proteinG: 8.0, carbsG: 28.0, fatG: 10.0, estimated: true },
      { name: 'Fruit and Nut Mix', calories: 280, proteinG: 10.0, carbsG: 26.0, fatG: 16.0, estimated: true },
      { name: 'Cheese and Crackers', calories: 220, proteinG: 10.0, carbsG: 18.0, fatG: 12.0, estimated: true },
      { name: 'Vegetable Sticks with Dip', calories: 140, proteinG: 4.0, carbsG: 12.0, fatG: 8.0, estimated: true },
      { name: 'Greek Yogurt with Honey', calories: 200, proteinG: 14.0, carbsG: 22.0, fatG: 4.0, estimated: true },
    ],
    eggetarian: [
      { name: 'Deviled Eggs', calories: 160, proteinG: 12.0, carbsG: 2.0, fatG: 12.0, estimated: true },
      { name: 'Egg and Cress Finger Sandwiches', calories: 180, proteinG: 10.0, carbsG: 16.0, fatG: 8.0, estimated: true },
    ],
    'non-veg': [
      { name: 'Smoked Salmon Blinis', calories: 200, proteinG: 14.0, carbsG: 14.0, fatG: 10.0, estimated: true },
      { name: 'Chicken Skewers', calories: 160, proteinG: 24.0, carbsG: 2.0, fatG: 6.0, estimated: true },
      { name: 'Prawn Cocktail', calories: 120, proteinG: 18.0, carbsG: 4.0, fatG: 2.0, estimated: true },
    ],
  },
  dinner: {
    veg: [
      { name: 'Pasta Arrabbiata', calories: 420, proteinG: 14.0, carbsG: 52.0, fatG: 16.0, estimated: true },
      { name: 'Mushroom Risotto', calories: 420, proteinG: 12.0, carbsG: 52.0, fatG: 16.0, estimated: true },
      { name: 'Grilled Vegetable Platter', calories: 280, proteinG: 10.0, carbsG: 32.0, fatG: 12.0, estimated: true },
      { name: 'Minestrone Soup with Bread', calories: 320, proteinG: 12.0, carbsG: 44.0, fatG: 8.0, estimated: true },
      { name: 'Margherita Pizza', calories: 480, proteinG: 18.0, carbsG: 54.0, fatG: 20.0, estimated: true },
      { name: 'Stuffed Bell Peppers', calories: 340, proteinG: 14.0, carbsG: 32.0, fatG: 16.0, estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Fried Rice with Salad', calories: 420, proteinG: 16.0, carbsG: 48.0, fatG: 16.0, estimated: true },
      { name: 'Spanish Omelette', calories: 380, proteinG: 18.0, carbsG: 32.0, fatG: 20.0, estimated: true },
      { name: 'Shakshuka', calories: 360, proteinG: 16.0, carbsG: 26.0, fatG: 20.0, estimated: true },
      { name: 'Egg Pasta Carbonara', calories: 520, proteinG: 24.0, carbsG: 48.0, fatG: 26.0, estimated: true },
    ],
    'non-veg': [
      { name: 'Grilled Salmon with Vegetables', calories: 440, proteinG: 42.0, carbsG: 12.0, fatG: 22.0, estimated: true },
      { name: 'Chicken Steak with Mashed Potatoes', calories: 520, proteinG: 44.0, carbsG: 38.0, fatG: 18.0, estimated: true },
      { name: 'Prawn Stir Fry with Rice', calories: 420, proteinG: 28.0, carbsG: 42.0, fatG: 14.0, estimated: true },
      { name: 'Beef Stew with Bread', calories: 480, proteinG: 32.0, carbsG: 38.0, fatG: 18.0, estimated: true },
      { name: 'Fish Tacos', calories: 400, proteinG: 28.0, carbsG: 36.0, fatG: 16.0, estimated: true },
      { name: 'Lamb Chops with Roasted Veg', calories: 520, proteinG: 40.0, carbsG: 18.0, fatG: 30.0, estimated: true },
    ],
  },
};
