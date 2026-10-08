/* Pricing Cycle Toggle Logic */

export function initPricing() {
  const toggleSwitch = document.getElementById('pricingToggle');
  const monthlyLabel = document.getElementById('labelMonthly');
  const annualLabel = document.getElementById('labelAnnual');

  const starterPrice = document.getElementById('priceStarter');
  const proPrice = document.getElementById('pricePro');
  const businessPrice = document.getElementById('priceBusiness');

  if (!toggleSwitch) return;

  toggleSwitch.addEventListener('change', () => {
    const isAnnual = toggleSwitch.checked;

    if (isAnnual) {
      if (monthlyLabel) monthlyLabel.classList.remove('active');
      if (annualLabel) annualLabel.classList.add('active');

      if (starterPrice) starterPrice.textContent = '$0';
      if (proPrice) proPrice.textContent = '$12';
      if (businessPrice) businessPrice.textContent = '$29';
    } else {
      if (monthlyLabel) monthlyLabel.classList.add('active');
      if (annualLabel) annualLabel.classList.remove('active');

      if (starterPrice) starterPrice.textContent = '$0';
      if (proPrice) proPrice.textContent = '$15';
      if (businessPrice) businessPrice.textContent = '$36';
    }
  });
}
