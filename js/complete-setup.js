/**
 * This file contains utility functions for the calculator website
 */

// Check if all required files exist
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calculator suite initialized');
    
    // Add fade-in effect to the page content
    document.body.classList.add('fade-in');
    
    // Add navigation highlight
    const currentPage = window.location.pathname.split('/').pop();
    const navButtons = document.querySelectorAll('.nav-button');
    
    navButtons.forEach(button => {
        const href = button.getAttribute('href');
        if (href === currentPage) {
            button.classList.add('active-nav');
        }
    });
    
    // Check for mobile devices and apply optimizations
    if (window.innerWidth < 768) {
        console.log('Mobile device detected, applying optimizations');
        
        // Adjust spacing for mobile
        document.querySelectorAll('.form-group').forEach(group => {
            group.style.marginBottom = '20px';
        });
        
        // Make inputs larger on mobile for better touch targets
        document.querySelectorAll('input, select').forEach(input => {
            input.style.height = '44px';
        });
    }
});

// Utility function for formatting currencies
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// Utility function for percentage formatting
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
}

// Add back navigation to use browser history when applicable
function setupBackNavigation() {
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    });
}

// Add theme switching functionality if needed
function setupThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            const isDarkTheme = document.body.classList.contains('dark-theme');
            localStorage.setItem('darkTheme', isDarkTheme);
        });
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('darkTheme');
        if (savedTheme === 'true') {
            document.body.classList.add('dark-theme');
        }
    }
}
