document.addEventListener('DOMContentLoaded', function() {
    // Tip Calculator Functionality
    const billAmountInput = document.getElementById('billAmount');
    const tipPercentageInput = document.getElementById('tipPercentage');
    const tipSlider = document.getElementById('tipSlider');
    const splitCountInput = document.getElementById('splitCount');
    const calculateTipButton = document.getElementById('calculateTip');
    const presetTipButtons = document.querySelectorAll('.preset-tip-btn');
    
    // Synchronize tip percentage input and slider
    tipPercentageInput.addEventListener('input', function() {
        tipSlider.value = this.value;
        calculateTip();
    });
    
    tipSlider.addEventListener('input', function() {
        tipPercentageInput.value = this.value;
        calculateTip();
    });
    
    // Handle preset tip buttons
    presetTipButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tipValue = this.getAttribute('data-tip');
            tipPercentageInput.value = tipValue;
            tipSlider.value = tipValue;
            
            // Update active state with Tailwind classes
            presetTipButtons.forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-100', 'text-gray-800');
            });
            this.classList.remove('bg-gray-100', 'text-gray-800');
            this.classList.add('bg-blue-600', 'text-white');
            
            calculateTip();
        });
    });
    
    // Calculate tip when inputs change or button is clicked
    billAmountInput.addEventListener('input', calculateTip);
    splitCountInput.addEventListener('input', calculateTip);
    calculateTipButton.addEventListener('click', calculateTip);
    
    // Initialize tip calculation
    calculateTip();
    
    function calculateTip() {
        // Get values from inputs
        const billAmount = parseFloat(billAmountInput.value) || 0;
        const tipPercentage = parseFloat(tipPercentageInput.value) || 0;
        const splitCount = parseInt(splitCountInput.value) || 1;
        
        // Calculate tip and total
        const tipAmount = billAmount * (tipPercentage / 100);
        const totalWithTip = billAmount + tipAmount;
        const amountPerPerson = totalWithTip / splitCount;
        
        // Display results
        document.getElementById('tipAmount').textContent = formatCurrency(tipAmount);
        document.getElementById('totalWithTip').textContent = formatCurrency(totalWithTip);
        document.getElementById('amountPerPerson').textContent = formatCurrency(amountPerPerson);
        
        // Show/hide per person row based on split count
        const perPersonRow = document.getElementById('perPersonRow');
        perPersonRow.style.display = splitCount > 1 ? 'flex' : 'none';
    }
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
});
