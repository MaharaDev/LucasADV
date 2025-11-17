document.addEventListener('DOMContentLoaded', function () {
  const ctaButton = document.querySelector('.cta-header-btn-lehmann');
  const heroSection = document.querySelector('.hero-lehmann');

  if (!ctaButton || !heroSection) return;

  const heroHeight = heroSection.offsetHeight;
  let ticking = false;

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        if (window.scrollY > heroHeight - 100) {
          ctaButton.classList.add('sticky-cta-visible');
        } else {
          ctaButton.classList.remove('sticky-cta-visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
});
document.addEventListener('DOMContentLoaded', function () {
  const track = document.querySelector('.carousel-track');
  const cards = document.querySelectorAll('.testimonial-card');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let currentIndex = 0;

  function updateCarousel() {
    const offset = -currentIndex * cards[0].offsetWidth;
    track.style.transform = `translateX(${offset}px)`;
  }

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % cards.length;
    updateCarousel();
  });

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCarousel();
  });

  window.addEventListener('resize', updateCarousel);
});
