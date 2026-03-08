document.addEventListener('DOMContentLoaded', () => {
  const revealCards = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    revealCards.forEach((card) => observer.observe(card));
  } else {
    revealCards.forEach((card) => card.classList.add('visible'));
  }
});
