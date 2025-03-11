document.addEventListener('DOMContentLoaded', function() {
    // Unit toggle buttons
    const metricBtn = document.getElementById('metricUnits');
    const imperialBtn = document.getElementById('imperialUnits');
    
    // Input fields
    const heightCm = document.getElementById('heightCm');
    const weightKg = document.getElementById('weightKg');
    const heightFt = document.getElementById('heightFt');
    const heightIn = document.getElementById('heightIn');
    const weightLbs = document.getElementById('weightLbs');
    
    // Result elements
    const bmiValue = document.getElementById('bmiValue');
    const bmiCategory = document.getElementById('bmiCategory');
    const bmiMarker = document.getElementById('bmiMarker');
    
    // Form containers
    const metricForm = document.getElementById('metricForm');
    const imperialForm = document.getElementById('imperialForm');
    
    // Button handlers
    metricBtn.addEventListener('click', function() {
        metricBtn.classList.add('active', 'bg-blue-600', 'text-white');
        metricBtn.classList.remove('bg-gray-200', 'text-gray-700');
        imperialBtn.classList.remove('active', 'bg-blue-600', 'text-white');
        imperialBtn.classList.add('bg-gray-200', 'text-gray-700');
        
        metricForm.style.display = 'block';
        imperialForm.style.display = 'none';
    });
    
    imperialBtn.addEventListener('click', function() {
        imperialBtn.classList.add('active', 'bg-blue-600', 'text-white');
        imperialBtn.classList.remove('bg-gray-200', 'text-gray-700');
        metricBtn.classList.remove('active', 'bg-blue-600', 'text-white');
        metricBtn.classList.add('bg-gray-200', 'text-gray-700');
        
        imperialForm.style.display = 'block';
        metricForm.style.display = 'none';
    });
    
    // Calculate BMI handlers
    document.getElementById('calculateMetric').addEventListener('click', calculateMetricBMI);
    document.getElementById('calculateImperial').addEventListener('click', calculateImperialBMI);
    
    // Functions to calculate BMI
    function calculateMetricBMI() {
        const height = parseFloat(heightCm.value) / 100; // convert cm to meters
        const weight = parseFloat(weightKg.value);
        
        if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
            alert('Please enter valid values for height and weight');
            return;
        }
        
        const bmi = weight / (height * height);
        displayResults(bmi);
    }
    
    function calculateImperialBMI() {
        const heightInFeet = parseFloat(heightFt.value) || 0;
        const heightInInches = parseFloat(heightIn.value) || 0;
        const weight = parseFloat(weightLbs.value);
        
        // Convert height to inches
        const totalHeightInInches = (heightInFeet * 12) + heightInInches;
        
        if (isNaN(totalHeightInInches) || isNaN(weight) || totalHeightInInches <= 0 || weight <= 0) {
            alert('Please enter valid values for height and weight');
            return;
        }
        
        // BMI formula for imperial units: (weight in pounds) / (height in inches)² * 703
        const bmi = (weight / (totalHeightInInches * totalHeightInInches)) * 703;
        displayResults(bmi);
    }
    
    function displayResults(bmi) {
        // Display BMI value rounded to 1 decimal place
        bmiValue.textContent = bmi.toFixed(1);
        
        // Set BMI category and color
        let category, categoryClass, markerPosition;
        
        if (bmi < 18.5) {
            category = 'Underweight';
            categoryClass = 'text-underweight';
            markerPosition = (bmi / 40) * 100; // Scale to percentage of chart width
        } else if (bmi < 25) {
            category = 'Normal weight';
            categoryClass = 'text-normal';
            markerPosition = (bmi / 40) * 100;
        } else if (bmi < 30) {
            category = 'Overweight';
            categoryClass = 'text-overweight';
            markerPosition = (bmi / 40) * 100;
        } else {
            category = 'Obese';
            categoryClass = 'text-obese';
            markerPosition = Math.min((bmi / 40) * 100, 98); // Cap at 98% to keep marker visible
        }
        
        // Update category text and class
        bmiCategory.textContent = category;
        bmiCategory.className = 'text-xl font-semibold mb-4 ' + categoryClass;
        
        // Position the marker
        bmiMarker.style.left = `${markerPosition}%`;
        
        // Show results
        document.querySelector('.bmi-results').style.display = 'block';
    }
});
