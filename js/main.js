document.addEventListener('DOMContentLoaded', function() {
    console.log('Main application loaded');
    
    // Add any landing page specific functionality here
    const cards = document.querySelectorAll('.calculator-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover');
        });
    });
});
