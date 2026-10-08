/* ROI & Productivity Calculator */

export function initRoiCalculator() {
  const teamSlider = document.getElementById('sliderTeamSize');
  const rateSlider = document.getElementById('sliderHourlyRate');

  const teamVal = document.getElementById('valTeamSize');
  const rateVal = document.getElementById('valHourlyRate');

  const hoursDisplay = document.getElementById('resHoursSaved');
  const moneyDisplay = document.getElementById('resMoneySaved');

  if (!teamSlider || !rateSlider) return;

  function calculateROI() {
    const teamSize = parseInt(teamSlider.value, 10);
    const hourlyRate = parseInt(rateSlider.value, 10);

    if (teamVal) teamVal.textContent = teamSize;
    if (rateVal) rateVal.textContent = `$${hourlyRate}`;

    // Calculation: StratOS saves average 4.5 hours per engineer/member per week by automating status reports, dependency tracking, & meeting overhead
    const hoursPerWeek = Math.round(teamSize * 4.5);
    const annualSavings = Math.round(hoursPerWeek * hourlyRate * 50);

    if (hoursDisplay) hoursDisplay.textContent = `${hoursPerWeek} hrs/wk`;
    if (moneyDisplay) moneyDisplay.textContent = `$${annualSavings.toLocaleString()}/yr`;
  }

  teamSlider.addEventListener('input', calculateROI);
  rateSlider.addEventListener('input', calculateROI);

  calculateROI();
}
