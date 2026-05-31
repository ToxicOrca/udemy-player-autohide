const toggle = document.getElementById("toggle");
const label = document.getElementById("label");

chrome.storage.local.get({ uphideEnabled: true }, (result) => {
  toggle.checked = result.uphideEnabled;
  label.textContent = result.uphideEnabled ? "Enabled" : "Disabled";
});

toggle.addEventListener("change", () => {
  const val = toggle.checked;
  chrome.storage.local.set({ uphideEnabled: val });
  label.textContent = val ? "Enabled" : "Disabled";
});
