// Date Calculator JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Set default dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Set default values for date inputs
    document.getElementById('startDate').value = todayStr;
    document.getElementById('endDate').value = todayStr;
    document.getElementById('baseDate').value = todayStr;
    
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const calculatorSections = document.querySelectorAll('.calculator-section');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and sections
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('text-blue-600', 'border-blue-600');
            });
            
            calculatorSections.forEach(section => {
                section.classList.remove('active');
                section.classList.add('hidden');
            });
            
            // Add active class to clicked button and corresponding section
            button.classList.add('active', 'text-blue-600', 'border-blue-600');
            const tabId = button.getAttribute('data-tab');
            const activeSection = document.getElementById(tabId);
            activeSection.classList.add('active');
            activeSection.classList.remove('hidden');
        });
    });
    
    // Days Between Dates Calculator
    const calculateDaysBtn = document.getElementById('calculateDays');
    calculateDaysBtn.addEventListener('click', calculateDaysBetween);
    
    function calculateDaysBetween() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        // Calculate difference in milliseconds
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Display results
        document.getElementById('daysDifference').textContent = diffDays;
        document.getElementById('weeksResult').textContent = (diffDays / 7).toFixed(1);
        document.getElementById('monthsResult').textContent = (diffDays / 30.44).toFixed(1); // Average days in month
        document.getElementById('yearsResult').textContent = (diffDays / 365.25).toFixed(2); // Account for leap years
        
        // Show result section
        document.getElementById('daysResult').classList.remove('hidden');
    }
    
    // Add/Subtract from Date Calculator
    const calculateNewDateBtn = document.getElementById('calculateNewDate');
    calculateNewDateBtn.addEventListener('click', calculateNewDate);
    
    function calculateNewDate() {
        const baseDate = new Date(document.getElementById('baseDate').value);
        const operation = document.querySelector('input[name="operation"]:checked').value;
        
        const years = parseInt(document.getElementById('years').value) || 0;
        const months = parseInt(document.getElementById('months').value) || 0;
        const weeks = parseInt(document.getElementById('weeks').value) || 0;
        const days = parseInt(document.getElementById('days').value) || 0;
        
        // Clone the base date to avoid modifying the original
        const resultDate = new Date(baseDate);
        
        // Apply the operation
        if (operation === 'add') {
            resultDate.setFullYear(resultDate.getFullYear() + years);
            resultDate.setMonth(resultDate.getMonth() + months);
            resultDate.setDate(resultDate.getDate() + (weeks * 7) + days);
        } else { // subtract
            resultDate.setFullYear(resultDate.getFullYear() - years);
            resultDate.setMonth(resultDate.getMonth() - months);
            resultDate.setDate(resultDate.getDate() - (weeks * 7) - days);
        }
        
        // Format the result date for display
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('resultDate').textContent = resultDate.toLocaleDateString(undefined, options);
        
        // Show result section
        document.getElementById('dateResult').classList.remove('hidden');
    }
});