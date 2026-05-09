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
    const bmiResults = document.querySelector('.bmi-results');
    
    // Form containers
    const metricForm = document.getElementById('metricForm');
    const imperialForm = document.getElementById('imperialForm');
    
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: false
    });
    
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
            
            // Add rotation animation to theme toggle
            themeToggle.classList.add('animate-spin');
            setTimeout(() => {
                themeToggle.classList.remove('animate-spin');
            }, 500);
        });
    
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    // Button handlers for unit toggle with enhanced animation
    metricBtn.addEventListener('click', function() {
        metricBtn.classList.add('active', 'bg-blue-600', 'text-white');
        metricBtn.classList.remove('bg-gray-200', 'text-gray-700');
        imperialBtn.classList.remove('active', 'bg-blue-600', 'text-white');
        imperialBtn.classList.add('bg-gray-200', 'text-gray-700');
        
        // Slide transition for form toggle
        imperialForm.style.opacity = '0';
        imperialForm.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            metricForm.style.display = 'block';
            imperialForm.style.display = 'none';
            
            setTimeout(() => {
                metricForm.style.opacity = '1';
                metricForm.style.transform = 'translateX(0)';
            }, 50);
        }, 300);
    });
    
    imperialBtn.addEventListener('click', function() {
        imperialBtn.classList.add('active', 'bg-blue-600', 'text-white');
        imperialBtn.classList.remove('bg-gray-200', 'text-gray-700');
        metricBtn.classList.remove('active', 'bg-blue-600', 'text-white');
        metricBtn.classList.add('bg-gray-200', 'text-gray-700');
        
        // Slide transition for form toggle
        metricForm.style.opacity = '0';
        metricForm.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            imperialForm.style.display = 'block';
            metricForm.style.display = 'none';
            
            setTimeout(() => {
                imperialForm.style.opacity = '1';
                imperialForm.style.transform = 'translateX(0)';
            }, 50);
        }, 300);
    });
    
    // Calculate BMI handlers
    document.getElementById('calculateMetric').addEventListener('click', calculateMetricBMI);
    document.getElementById('calculateImperial').addEventListener('click', calculateImperialBMI);
    
    // Add keyboard event listeners for better UX
    heightCm.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateMetricBMI();
    });
    
    weightKg.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateMetricBMI();
    });
    
    heightFt.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateImperialBMI();
    });
    
    heightIn.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateImperialBMI();
    });
    
    weightLbs.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateImperialBMI();
    });
    
    // Functions to calculate BMI
    function calculateMetricBMI() {
        const height = parseFloat(heightCm.value) / 100; // convert cm to meters
        const weight = parseFloat(weightKg.value);
        
        if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
            Swal.fire({
                title: 'Invalid Input',
                text: 'Please enter valid values for height and weight.',
                icon: 'error',
                confirmButtonColor: '#3b82f6',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            
            // Add shake animation to inputs
            if (isNaN(height) || height <= 0) {
                heightCm.classList.add('border-red-500', 'animate-shake');
                setTimeout(() => heightCm.classList.remove('border-red-500', 'animate-shake'), 1000);
            }
            if (isNaN(weight) || weight <= 0) {
                weightKg.classList.add('border-red-500', 'animate-shake');
                setTimeout(() => weightKg.classList.remove('border-red-500', 'animate-shake'), 1000);
            }
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
            Swal.fire({
                title: 'Invalid Input',
                text: 'Please enter valid values for height and weight.',
                icon: 'error',
                confirmButtonColor: '#3b82f6',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            
            // Add shake animation to inputs
            if (totalHeightInInches <= 0) {
                heightFt.classList.add('border-red-500', 'animate-shake');
                heightIn.classList.add('border-red-500', 'animate-shake');
                setTimeout(() => {
                    heightFt.classList.remove('border-red-500', 'animate-shake');
                    heightIn.classList.remove('border-red-500', 'animate-shake');
                }, 1000);
            }
            if (isNaN(weight) || weight <= 0) {
                weightLbs.classList.add('border-red-500', 'animate-shake');
                setTimeout(() => weightLbs.classList.remove('border-red-500', 'animate-shake'), 1000);
            }
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
        
        // Show results with animation
        bmiResults.style.display = 'block';
        
        // Trigger reflow for animation
        void bmiResults.offsetWidth;
        
        // Add show class for animation
        bmiResults.classList.add('show');
        
        // Show toast notification
        let toastIcon = 'info';
        if (category === 'Normal weight') {
            toastIcon = 'success';
        } else if (category === 'Underweight' || category === 'Overweight') {
            toastIcon = 'warning';
        } else if (category === 'Obese') {
            toastIcon = 'error';
        }
        
        // Display a nice toast notification
        Swal.fire({
            title: 'BMI Calculated',
            text: `Your BMI is ${bmi.toFixed(1)} (${category})`,
            icon: toastIcon,
            confirmButtonColor: '#3b82f6',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });
    }
    
    // Fix any results that might be showing by default
    bmiResults.style.display = 'none';
    bmiResults.classList.remove('show');
});
