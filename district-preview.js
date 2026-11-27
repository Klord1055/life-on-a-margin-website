const districtPreview = document.querySelector("[data-district-preview]");
const districtControls = districtPreview.querySelector(".district-controls");
const districtButtons = Array.from(districtControls.querySelectorAll("button[aria-controls]"));

function showDistrict(selected) {
  for (const button of districtButtons) {
    const active = button === selected;
    button.setAttribute("aria-pressed", String(active));
    document.getElementById(button.getAttribute("aria-controls")).hidden = !active;
  }
}

for (const button of districtButtons) {
  button.addEventListener("click", () => showDistrict(button));
}

showDistrict(districtButtons[0]);
districtControls.hidden = false;
