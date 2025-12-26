// ONE-TIME REPAIR for Oct 20, 2025 data
// Run this in Console ONCE after deploying the fixes
// This will correctly archive Oct 20 with your actual data and reset Oct 21 to zero

(function repairOct20() {
  const toISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  
  // Define dates
  const today = new Date();
  const todayISO = toISO(today);
  const oct20 = new Date(2025, 9, 20); // Month is 0-indexed, so 9 = October
  const oct20ISO = toISO(oct20);
  
  console.log('🔧 Starting repair for', oct20ISO);
  
  // Get current state
  const currentIntake = JSON.parse(localStorage.getItem('dailyIntake') || '{}');
  const currentMeals = JSON.parse(localStorage.getItem('recentMeals') || '[]');
  const goals = JSON.parse(localStorage.getItem('goals') || 'null') || {
    calories: 2000, protein: 120, carbs: 250, fat: 60, activity: 30, water: 8
  };
  
  console.log('Current intake:', currentIntake);
  console.log('Current meals:', currentMeals.length);
  
  // You need to manually input what Oct 20's ACTUAL data was
  // Replace these values with your actual Oct 20 data:
  const oct20Intake = {
    calories: 2295,  // FROM YOUR SCREENSHOT
    protein: 59,
    carbs: 390,
    fat: 63,
    activity: 0,
    water: 8
  };
  
  const oct20Meals = []; // Add your Oct 20 meals if you remember them
  
  // Compute score for Oct 20
  let oct20Score = 0;
  let oct20Components = { nutrition: 0, activity: 0, workout: 0, hydration: 0 };
  
  try {
    // Nutrition (40% weight)
    const calRatio = Math.min(oct20Intake.calories / goals.calories, 1.2);
    const proteinRatio = Math.min(oct20Intake.protein / goals.protein, 1.2);
    const calPenalty = Math.max(0, (oct20Intake.calories / goals.calories - 1.1) * 0.25);
    const nutritionRaw = ((calRatio + proteinRatio) / 2) * 100;
    oct20Components.nutrition = Math.round(Math.max(0, nutritionRaw - calPenalty * 100) * 0.4);
    
    // Activity (15% weight)
    const activityRatio = Math.min((oct20Intake.activity || 0) / (goals.activity || 30), 1);
    oct20Components.activity = Math.round(activityRatio * 100 * 0.15);
    
    // Workout (30% weight) - check workoutHistory for Oct 20
    const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    const oct20Workouts = workoutHistory.filter(w => {
      const wDate = new Date(w.timestamp);
      return toISO(wDate) === oct20ISO;
    });
    const avgCompletion = oct20Workouts.length > 0
      ? oct20Workouts.reduce((sum, w) => sum + (w.completionRate || 0), 0) / oct20Workouts.length
      : 0;
    oct20Components.workout = Math.round(avgCompletion * 0.30);
    
    // Hydration (15% weight)
    const waterRatio = Math.min((oct20Intake.water || 0) / (goals.water || 8), 1);
    oct20Components.hydration = Math.round(waterRatio * 100 * 0.15);
    
    oct20Score = Object.values(oct20Components).reduce((sum, v) => sum + v, 0);
    
    console.log('Oct 20 computed score:', oct20Score, oct20Components);
  } catch (e) {
    console.error('Error computing score:', e);
  }
  
  // Get current history
  const dh = JSON.parse(localStorage.getItem('dailyHistory') || '{}');
  
  // Set Oct 20 in history
  dh[oct20ISO] = {
    intake: oct20Intake,
    meals: oct20Meals,
    score: oct20Score,
    components: oct20Components
  };
  
  // Reset Oct 21 to zero
  const zeroIntake = { calories: 0, protein: 0, carbs: 0, fat: 0, activity: 0, water: 0 };
  
  // Apply changes to localStorage
  localStorage.setItem('dailyHistory', JSON.stringify(dh));
  localStorage.setItem('dailyIntake', JSON.stringify(zeroIntake));
  localStorage.setItem('recentMeals', JSON.stringify([]));
  localStorage.setItem('dailyIntakeDate', todayISO);
  localStorage.setItem('lastSavedDate', todayISO);
  
  console.log('✅ Repair complete!');
  console.log('Oct 20:', oct20ISO, '- Score:', oct20Score);
  console.log('Today:', todayISO, '- Reset to 0');
  console.log('\n⚠️  IMPORTANT: Please manually reload the page now (Ctrl+R or F5)');
  console.log('Do NOT sign out or close the tab before reloading.');
  
  // Do NOT auto-reload or call fitmateHydrateFromRemote
  // Let user manually reload to ensure localStorage writes complete
})();
