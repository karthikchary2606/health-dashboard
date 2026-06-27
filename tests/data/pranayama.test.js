'use strict';
const { getFilteredPranayama, PRANAYAMA } = require('../../server/data/pranayama');

test('PRANAYAMA has 6 techniques', () => {
  expect(PRANAYAMA.length).toBe(6);
});

test('all 6 techniques returned for healthy 30yo', () => {
  const result = getFilteredPranayama({ age: 30, healthConditions: [], medications: [] });
  expect(result.length).toBe(6);
});

test('Kapalabhati excluded for age 60', () => {
  const result = getFilteredPranayama({ age: 60, healthConditions: [], medications: [] });
  expect(result.find(t => t.id === 'kapalabhati')).toBeUndefined();
});

test('Bhastrika excluded for age 50', () => {
  const result = getFilteredPranayama({ age: 50, healthConditions: [], medications: [] });
  expect(result.find(t => t.id === 'bhastrika')).toBeUndefined();
});

test('Bhastrika excluded for active hypertension', () => {
  const result = getFilteredPranayama({
    age: 35,
    healthConditions: [{ name: 'hypertension', active: true }],
    medications: []
  });
  expect(result.find(t => t.id === 'bhastrika')).toBeUndefined();
});

test('resolved hypertension does NOT exclude Bhastrika', () => {
  const result = getFilteredPranayama({
    age: 35,
    healthConditions: [{ name: 'hypertension', active: false }],
    medications: []
  });
  expect(result.find(t => t.id === 'bhastrika')).toBeDefined();
});

test('Kapalabhati excluded for active blood-thinners medication', () => {
  const result = getFilteredPranayama({
    age: 30,
    healthConditions: [],
    medications: [{ name: 'blood-thinners', active: true }]
  });
  expect(result.find(t => t.id === 'kapalabhati')).toBeUndefined();
});
