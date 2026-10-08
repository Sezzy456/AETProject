/* FAQ Accordion Module */

export function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all other open FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
        }
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
      } else {
        item.classList.remove('open');
      }
    });
  });
}
