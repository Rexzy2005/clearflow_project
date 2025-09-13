const sections = document.querySelectorAll(".section");
const menuBtns = document.querySelectorAll("[data-target]");

// show section on menu click
const savedSection = localStorage.getItem("activeSection");
if (savedSection) {
  // hide all sections
  sections.forEach(section => section.classList.remove("active-section"));
  // show saved one
  const activeSec = document.getElementById(savedSection);
  if (activeSec) activeSec.classList.add("active-section");

  // highlight correct menu button
  menuBtns.forEach(btn => {
    btn.classList.remove("active-link");
    if (btn.dataset.target === savedSection) {
      btn.classList.add("active-link");
    }
  });
}


menuBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    sections.forEach(section => section.classList.remove('active-section'));
    document.getElementById(btn.dataset.target).classList.add('active-section');

    // remove active class from all buttons
    menuBtns.forEach(btn => btn.classList.remove('active-link'));
    btn.classList.add('active-link');


    // save active section
    localStorage.setItem("activeSection", btn.dataset.target);
  })
})


function updateSlider(slider, valueDisplay) {
  const value = slider.value;
  valueDisplay.textContent = value + "%";

  const min = slider.min ? slider.min : 0;
  const max = slider.max ? slider.max : 100;
  const percent = ((value - min) / (max - min)) * 100;

  slider.style.background = `linear-gradient(to right, #1FCAE6 0%, #2B59FF ${percent}%, #808080cc ${percent}%, #808080cc 100%)`;
}

const sliders = [
  { slider: document.getElementById("flowRate"), value: document.getElementById("flowValue") },
  { slider: document.getElementById("FilterIntensity"), value: document.getElementById("FilterIntensityValue") },
  { slider: document.getElementById("uvRate"), value: document.getElementById("uvValue") },

  { slider: document.getElementById("pfRate"), value: document.getElementById("pfValue") },
  { slider: document.getElementById("uvsRate"), value: document.getElementById("uvsValue") },
  { slider: document.getElementById("wpRate"), value: document.getElementById("wpValue") },
  { slider: document.getElementById("saRate"), value: document.getElementById("saValue") },
];

sliders.forEach(({ slider, value }) => {
  updateSlider(slider, value);
  slider.addEventListener("input", () => updateSlider(slider, value));
});



const hambugerMenubtn = document.getElementById('hambuger-menubtn');
const sidePanel = document.getElementById('sidePanel');

hambugerMenubtn.addEventListener('click', () => {
  hambugerMenubtn.classList.toggle('open');
  sidePanel.classList.toggle('open');
})
