"use strict";

const guideSearch = document.querySelector(".guide-search");
const guideQuery = guideSearch.querySelector("input");
const guideStatus = guideSearch.querySelector("[role=status]");
const guideTopics = Array.from(document.querySelectorAll("#guide-results > div"), (item) => ({
  item,
  text: item.textContent.toLowerCase()
}));

function filterGuide() {
  const query = guideQuery.value.trim().toLowerCase();
  const words = query.split(/\s+/);
  let count = 0;

  for (const { item, text } of guideTopics) {
    const matches = words.every((word) => text.includes(word));
    item.hidden = !matches;
    if (matches) count += 1;
  }

  if (!query) {
    guideStatus.textContent = `All ${count} topics shown`;
  } else if (count === 0) {
    guideStatus.textContent = "No matching topics. Try a shorter search.";
  } else {
    guideStatus.textContent = count === 1 ? "1 topic found" : `${count} topics found`;
  }
}

guideSearch.addEventListener("submit", (event) => event.preventDefault());
guideQuery.addEventListener("input", filterGuide);
guideSearch.addEventListener("reset", (event) => {
  event.preventDefault();
  guideQuery.value = "";
  filterGuide();
  guideQuery.focus();
});

filterGuide();
guideSearch.hidden = false;
