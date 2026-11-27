(() => {
  const form = document.getElementById("supplier-form");
  const quantityField = document.getElementById("supplier-quantity");
  const cashField = document.getElementById("supplier-cash");
  const error = document.getElementById("supplier-error");
  const result = document.getElementById("supplier-result");
  const exactResult = document.getElementById("supplier-exact");
  const bulkResult = document.getElementById("supplier-bulk");
  const comparison = document.getElementById("supplier-comparison");
  const dollars = new Intl.NumberFormat("en-US");
  const retailUnitCents = 480;
  const bulkUnits = 100;
  const bulkCostCents = bulkUnits * 360;

  function parseQuantity(raw) {
    const value = raw.trim();
    if (!/^\d{1,3}$/.test(value)) return null;
    const quantity = Number(value);
    return quantity >= 1 && quantity <= bulkUnits ? quantity : null;
  }

  function parseCash(raw) {
    const value = raw.trim();
    if (!/^(?:\d{1,6}(?:\.\d{1,2})?|\.\d{1,2})$/.test(value)) return null;
    const [whole, fraction = ""] = value.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  }

  function money(cents) {
    const whole = Math.floor(cents / 100);
    const fraction = String(cents % 100).padStart(2, "0");
    return `$${dollars.format(whole)}.${fraction}`;
  }

  function quote(cost, cash) {
    const remaining = cash - cost;
    const balance = remaining < 0 ? `${money(-remaining)} short` : `${money(remaining)} left`;
    return `${money(cost)} due · ${balance}`;
  }

  function showComparison() {
    const quantity = parseQuantity(quantityField.value);
    const cash = parseCash(cashField.value);
    for (const [field, value] of [[quantityField, quantity], [cashField, cash]]) {
      if (value === null) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }
    if (quantity === null || cash === null) {
      result.hidden = true;
      error.textContent = quantity === null ? "Enter a whole number from 1 to 100 for units needed."
        : "Enter cash from $0 to $999,999.99 without a dollar sign or commas, such as 350.00.";
      error.hidden = false;
      (quantity === null ? quantityField : cashField).focus();
      return;
    }

    error.hidden = true;
    const exactCost = quantity * retailUnitCents;
    const difference = bulkCostCents - exactCost;
    const differenceText = difference === 0 ? "Both choices cost the same."
      : `${difference > 0 ? "Buying as needed" : "The box"} costs ${money(Math.abs(difference))} less.`;
    const spareUnits = bulkUnits - quantity;
    exactResult.textContent = quote(exactCost, cash);
    bulkResult.textContent = quote(bulkCostCents, cash);
    comparison.textContent = `${differenceText} The box leaves ${spareUnits} ${spareUnits === 1 ? "unit" : "units"} unused after this order.`;
    result.hidden = false;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showComparison();
  });
  showComparison();
  form.hidden = false;
  document.getElementById("supplier-example").hidden = true;
})();
