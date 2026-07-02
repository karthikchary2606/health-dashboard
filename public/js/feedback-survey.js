// public/js/feedback-survey.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const ratings = {};

  // Handle rating button clicks
  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const question = btn.dataset.question;
      const value = btn.dataset.value;

      ratings[question] = parseInt(value);

      // Update UI - remove selected class from all buttons for this question
      document.querySelectorAll(`.rating-btn[data-question="${question}"]`).forEach(b => {
        b.classList.remove('selected');
      });
      // Add selected class to clicked button
      btn.classList.add('selected');
    });
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    const loading = document.getElementById('loading');

    // Validate that both questions are answered
    if (!ratings.mealSatisfaction || !ratings.personalizationMatch) {
      errorMsg.textContent = '❌ Please answer both questions before submitting.';
      errorMsg.style.display = 'block';
      successMsg.style.display = 'none';
      return;
    }

    loading.style.display = 'block';
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    try {
      const feedbackData = {
        mealSatisfaction: ratings.mealSatisfaction,
        personalizationMatch: ratings.personalizationMatch,
        additionalFeedback: document.getElementById('additionalFeedback').value || null,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });

      loading.style.display = 'none';

      if (response.ok) {
        successMsg.style.display = 'block';
        form.reset();
        document.querySelectorAll('.rating-btn.selected').forEach(btn => {
          btn.classList.remove('selected');
        });
        ratings = {};

        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      loading.style.display = 'none';
      errorMsg.textContent = `❌ Failed to submit feedback: ${error.message}`;
      errorMsg.style.display = 'block';
    }
  });
});
