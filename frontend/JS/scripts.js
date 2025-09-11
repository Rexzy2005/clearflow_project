
const faqCards = document.querySelectorAll('.faq-card');
// auth section Ui element
const formSections = document.querySelectorAll('.form-section');
faqCards.forEach(card => {
  const question = card.querySelector('.faq-question');
  const answer = card.querySelector('.answer');
  const icon = card.querySelector('i');
  
  question.addEventListener('click', () => {
    const isOpen = answer.style.display === "block";
    answer.style.transition = "display .5s ease-in-out";
    
    // Close all FAQs if you want accordion style
    faqCards.forEach(c => {
      c.querySelector('.answer').style.display = "none";
      c.querySelector('i').classList.replace('fa-minus', 'fa-plus');
    });
    
    if (isOpen) {
      answer.style.display = "none";
      icon.classList.replace('fa-minus', 'fa-plus');
    } else {
      answer.style.display = "block";
      icon.classList.replace('fa-plus', 'fa-minus');
    }
  });
});

// auth screen js functionalities
let pushToHistory = [];
function setActiveSection(id) {
  formSections.forEach(section => section.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

function showSection(sectionId, pushToHistory = true) {
  setActiveSection(sectionId)
  const url = new URL(window.location);
  url.searchParams.set("mode", sectionId);

   if (pushToHistory) {
    window.history.pushState({ mode: sectionId }, "", url);
  } else {
    window.history.replaceState({ mode: sectionId }, "", url);
  }
}

function goBack() {
  window.history.back();
}


document.getElementById("back-btn").addEventListener("click", () => {
  if (window.history.length >= 1) {
    window.history.back();
  } else {
    window.location.href = "index.html"; // your landing page
  }
});

window.addEventListener("popstate", (e) => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "signup";
  showSection(mode, false);
});

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "signup";
  showSection(mode, false);
});
