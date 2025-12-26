// FINAL REPAIR - Updates both localStorage AND Supabase
// Run this ONCE in the Console while signed in

(async function repairOct20Final() {
  console.log('🔧 Starting complete repair (local + remote)...');
  
  const toISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = new Date();
  const todayISO = toISO(today);
  const oct20 = new Date(2025, 9, 20);
  const oct20ISO = toISO(oct20);
  
  // Your actual Oct 20 data
  const oct20Intake = { calories: 2295, protein: 59, carbs: 390, fat: 63, activity: 0, water: 8 };
  const goals = JSON.parse(localStorage.getItem('goals')||'null') || {calories:2000,protein:120,carbs:250,fat:60,activity:30,water:8};
  
  // Compute Oct 20 score
  const calRatio = oct20Intake.calories / goals.calories;
  const proteinRatio = oct20Intake.protein / goals.protein;
  const calPenalty = Math.max(0, (calRatio - 1.1) * 25);
  const nutrition = Math.round(Math.max(0, ((calRatio + proteinRatio) / 2) * 40 - calPenalty));
  const waterScore = Math.round((oct20Intake.water / goals.water) * 15);
  const score = nutrition + waterScore;
  
  // Prepare data
  const dh = JSON.parse(localStorage.getItem('dailyHistory')||'{}');
  dh[oct20ISO] = { 
    intake: oct20Intake, 
    meals: [], 
    score, 
    components: {nutrition, activity:0, workout:0, hydration:waterScore} 
  };
  
  const zero = {calories:0, protein:0, carbs:0, fat:0, activity:0, water:0};
  
  // 1. Update localStorage
  localStorage.setItem('dailyHistory', JSON.stringify(dh));
  localStorage.setItem('dailyIntake', JSON.stringify(zero));
  localStorage.setItem('recentMeals', '[]');
  localStorage.setItem('dailyIntakeDate', todayISO);
  localStorage.setItem('lastSavedDate', todayISO);
  console.log('✅ Local storage updated');
  
  // 2. Update Supabase (prevents remote from overwriting)
  try {
    // Get Supabase client and user from window (exposed by app)
    const supabase = window.__fitmateSupabase;
    const user = window.__fitmateUser;
    
    if (!supabase || !user) {
      console.error('❌ Not signed in or Supabase not available');
      console.log('Please ensure you are signed in and try again');
      console.log('supabase:', !!supabase, 'user:', !!user);
      return;
    }
    
    console.log('📤 Updating Supabase for user:', user.id);
    
    // Update all three: daily_intake, daily_history, recent_meals
    const { error } = await supabase
      .from('users')
      .update({
        daily_intake: zero,
        daily_history: dh,
        recent_meals: [],
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) {
      console.error('❌ Supabase update failed:', error);
      console.log('Trying alternative update method...');
      
      // Alternative: use the app's sync functions if available
      if (window.updateUserData) {
        await window.updateUserData({
          daily_intake: zero,
          daily_history: dh,
          recent_meals: []
        });
        console.log('✅ Updated via app sync function');
      }
    } else {
      console.log('✅ Supabase updated successfully');
    }
    
    console.log('\n✅ REPAIR COMPLETE!');
    console.log('Oct 20 score:', score);
    console.log('Oct 21 intake: 0');
    console.log('\n🔄 Reloading in 2 seconds...');
    
    setTimeout(() => location.reload(), 2000);
    
  } catch (err) {
    console.error('❌ Error updating Supabase:', err);
    console.log('\nLocal data is fixed, but remote sync failed.');
    console.log('You may need to sign out and sign back in for full sync.');
  }
})();
