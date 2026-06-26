const template = require('../../server/templates/weight-loss');

const baseProfile = {
  primaryGoal: 'weight-loss',
  cuisinePreference: 'south-indian',
  dietType: 'non-vegetarian',
  healthConditions: ['lower-back-pain'],
  medications: [{ name: 'Thyronorm', dosage: '12.5mg', timing: 'morning-empty-stomach' }],
  startDate: new Date('2025-01-01'),
  waterGoalL: 2.5
};

test('getDietPlan returns array of 6 items', () => {
  const plan = template.getDietPlan(baseProfile);
  expect(Array.isArray(plan)).toBe(true);
  expect(plan.length).toBe(6);
});

test('getDietPlan month 1 has required shape', () => {
  const [month1] = template.getDietPlan(baseProfile);
  expect(month1).not.toBeNull();
  expect(month1.monthLabel).toBeDefined();
  expect(Array.isArray(month1.weeks)).toBe(true);
  expect(month1.weeks.length).toBe(4);
  expect(month1.weeks[0].weekdays.length).toBe(7);
  expect(month1.weeks[0].weekdays[0].breakfast).toBeDefined();
});

test('getDietPlan all months have 4 weeks of 7 days', () => {
  const plan = template.getDietPlan(baseProfile);
  plan.forEach((month, i) => {
    expect(month.weeks).toBeDefined();
    expect(month.weeks.length).toBe(4);
    month.weeks.forEach(week => {
      expect(Array.isArray(week.weekdays)).toBe(true);
      expect(week.weekdays.length).toBe(7);
      expect(week.weekLabel).toBeDefined();
    });
  });
});

test('getPlanMeta includes currentWeek 1-4', () => {
  const meta = template.getPlanMeta({ ...baseProfile, startDate: new Date() });
  expect(meta.currentWeek).toBeGreaterThanOrEqual(1);
  expect(meta.currentWeek).toBeLessThanOrEqual(4);
});

test('getWorkoutPlan returns 6 months, month 1 has exercises', () => {
  const plan = template.getWorkoutPlan(baseProfile);
  expect(plan.length).toBe(6);
  const month1 = plan[0];
  expect(Array.isArray(month1.schedule)).toBe(true);
  expect(month1.schedule.length).toBeGreaterThan(0);
});

test('getWorkoutPlan LBP condition: no deadlifts in month 1', () => {
  const plan = template.getWorkoutPlan(baseProfile);
  const allExercises = plan[0].schedule.flatMap(d => d.exercises.map(e => e.name.toLowerCase()));
  expect(allExercises.some(n => n.includes('deadlift'))).toBe(false);
});

test('getCardioPlan returns 6 items', () => {
  const plan = template.getCardioPlan(baseProfile);
  expect(plan.length).toBe(6);
});

test('getGroceryList returns 6 items', () => {
  const list = template.getGroceryList(baseProfile);
  expect(list.length).toBe(6);
});

test('getDefaultChecklist includes medication item from profile', () => {
  const items = template.getDefaultChecklist(baseProfile);
  const medItem = items.find(i => i.category === 'medication' && i.text.includes('Thyronorm'));
  expect(medItem).toBeDefined();
});

test('getPlanMeta returns correct totalMonths and phases', () => {
  const meta = template.getPlanMeta(baseProfile);
  expect(meta.totalMonths).toBe(6);
  expect(meta.templateName).toBe('weight-loss');
  expect(Array.isArray(meta.phases)).toBe(true);
});

test('getPlanMeta computes currentMonth correctly from startDate', () => {
  const profile = { ...baseProfile, startDate: new Date() };
  const meta = template.getPlanMeta(profile);
  expect(meta.currentMonth).toBe(1);
});
