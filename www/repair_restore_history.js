// Console-based repair helper to restore daily_history entries
// Usage example in DevTools console:
//   await window.restoreDailyHistory([
//     { date: '2025-10-20', score: 85 },
//     { date: '2025-10-21', score: 32 }
//   ])
// Or import/export JSON:
//   const json = await window.exportDailyHistory();
//   await window.importDailyHistory(json);

(function () {
  const toISO = (d) => {
    if (d instanceof Date) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    // Assume input is already YYYY-MM-DD
    return String(d);
  };

  function readLocalDH() {
    try { return JSON.parse(localStorage.getItem('dailyHistory') || '{}') || {}; } catch { return {}; }
  }

  function writeLocalDH(dh) {
    try { localStorage.setItem('dailyHistory', JSON.stringify(dh)); } catch (_) {}
  }

  async function pushRemoteDH(dh) {
    const supabase = window.__fitmateSupabase;
    const user = window.__fitmateUser;
    if (window.updateUserData) {
      // Uses app’s guarded update path which now deep-merges server-side
      return window.updateUserData({ daily_history: dh });
    }
    if (supabase && user) {
      const { error } = await supabase
        .from('users')
        .update({ daily_history: dh, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
    }
  }

  async function restoreDailyHistory(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('Provide an array of entries: [{ date: "YYYY-MM-DD", score: <number> }, ...]');
    }
    const local = readLocalDH();
    const patch = {};
    for (const e of entries) {
      const day = toISO(e.date);
      const score = Number(e.score || 0);
      const intake = e.intake || { calories: 0, protein: 0, carbs: 0, fat: 0, activity: 0, water: 0 };
      const components = e.components || { nutrition: score, activity: 0, workout: 0, hydration: 0 };
      const meals = Array.isArray(e.meals) ? e.meals : [];
      patch[day] = { score, intake, components, meals };
    }
    const merged = { ...local, ...patch };
    writeLocalDH(merged);
    await pushRemoteDH(merged);
    console.log('✅ Restored days:', Object.keys(patch));
    return merged;
  }

  async function exportDailyHistory() {
    const dh = readLocalDH();
    const json = JSON.stringify(dh, null, 2);
    console.log('📤 dailyHistory exported');
    return json;
  }

  async function importDailyHistory(json) {
    let incoming = {};
    try { incoming = JSON.parse(json || '{}') || {}; } catch (e) { throw new Error('Invalid JSON provided'); }
    const local = readLocalDH();
    const merged = { ...local, ...incoming };
    writeLocalDH(merged);
    await pushRemoteDH(merged);
    console.log('✅ Imported dailyHistory; total days:', Object.keys(merged).length);
    return merged;
  }

  window.restoreDailyHistory = restoreDailyHistory;
  window.exportDailyHistory = exportDailyHistory;
  window.importDailyHistory = importDailyHistory;
})();