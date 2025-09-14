const profileClick = document.getElementById('profileClick');
const dropDown = document.getElementById('dropDown');

// toggle dropdown on profile pic click
profileClick.addEventListener('click', (e) => {
  e.stopPropagation(); // stop bubbling so document click doesn’t instantly close it
  dropDown.classList.toggle('showDropDown');
});

// close dropdown on clicking any item inside
dropDown.querySelectorAll("p").forEach(item => {
  item.addEventListener("click", () => {
    dropDown.classList.remove("showDropDown");
  });
});

// close dropdown on clicking outside
document.addEventListener("click", (e) => {
  if (!dropDown.contains(e.target) && !profileClick.contains(e.target)) {
    dropDown.classList.remove("showDropDown");
  }
});