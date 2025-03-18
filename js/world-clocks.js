// world-clocks.js
document.addEventListener('DOMContentLoaded', function() {
    const clocksContainer = document.getElementById('clocksContainer');
    const citySearchInput = document.getElementById('citySearch');
    const citySuggestions = document.getElementById('citySuggestions');
    const addCityBtn = document.getElementById('addCityBtn');
    const themeToggle = document.getElementById('themeToggle');
    const localTimeDisplay = document.getElementById('localTime');
    const sortClocksBtn = document.getElementById('sortClocks');
    const clearClocksBtn = document.getElementById('clearClocks');
    const resetToDefaultBtn = document.getElementById('resetToDefault');

    let selectedCity = null;
    // Add time format preference
    let use24HourFormat = localStorage.getItem('use24HourFormat') === 'true';

    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: true
    });

    // Theme toggle functionality with improved animation
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

    // Update local time
    function updateLocalTime() {
        if (localTimeDisplay) {
            const now = new Date();
            const timeOptions = { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit', 
                hour12: !use24HourFormat 
            };
            const timeString = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
            localTimeDisplay.textContent = timeString;
        }
    }
    
    // Update local time immediately and then every second
    updateLocalTime();
    setInterval(updateLocalTime, 1000);

    // Default clocks
    const defaultClocks = [
        { name: 'New York', timezone: 'America/New_York' },
        { name: 'London', timezone: 'Europe/London' },
        { name: 'Tokyo', timezone: 'Asia/Tokyo' },
        { name: 'Sydney', timezone: 'Australia/Sydney' },
        { name: 'Dubai', timezone: 'Asia/Dubai' },
        { name: 'San Francisco', timezone: 'America/Los_Angeles' }
    ];

    // Load saved clocks from localStorage or use defaults
    let clocks = JSON.parse(localStorage.getItem('worldClocks')) || defaultClocks;

    // Function to get country flag emoji
    function getCountryFlagEmoji(countryName) {
        const countryMap = {
            'USA': '🇺🇸',
            'United Kingdom': '🇬🇧',
            'Japan': '🇯🇵',
            'Australia': '🇦🇺',
            'UAE': '🇦🇪',
            'France': '🇫🇷',
            'Germany': '🇩🇪',
            'Italy': '🇮🇹',
            'Spain': '🇪🇸',
            'Netherlands': '🇳🇱',
            'Belgium': '🇧🇪',
            'Austria': '🇦🇹',
            'Russia': '🇷🇺',
            'China': '🇨🇳',
            'Singapore': '🇸🇬',
            'South Korea': '🇰🇷',
            'New Zealand': '🇳🇿',
            'India': '🇮🇳',
            'Thailand': '🇹🇭',
            'Egypt': '🇪🇬',
            'South Africa': '🇿🇦',
            'Nigeria': '🇳🇬',
            'Kenya': '🇰🇪',
            'Brazil': '🇧🇷',
            'Argentina': '🇦🇷',
            'Mexico': '🇲🇽',
            'Canada': '🇨🇦',
            'Turkey': '🇹🇷',
            'Greece': '🇬🇷',
            'Israel': '🇮🇱',
            'Saudi Arabia': '🇸🇦',
            'Qatar': '🇶🇦',
            'Kuwait': '🇰K',
            'Iran': '🇮🇷',
            'Pakistan': '🇵🇰',
            'Bangladesh': '🇧🇩',
            'Indonesia': '🇮🇩',
            'Philippines': '🇵🇭',
            'Malaysia': '🇲🇾',
            'Taiwan': '🇹🇼',
            'Vietnam': '🇻🇳',
            'Sweden': '🇸🇪',
            'Norway': '🇳🇴',
            'Denmark': '🇩🇰',
            'Finland': '🇫🇮',
            'Poland': '🇵🇱',
            'Czech Republic': '🇨🇿',
            'Hungary': '🇭🇺',
            'Switzerland': '🇨🇭',
            'Ireland': '🇮🇪',
            'Portugal': '🇵🇹',
            'Morocco': '🇲🇦',
            'Senegal': '🇸🇳',
            'Ethiopia': '🇪🇹',
            'DR Congo': '🇨🇩',
            'Angola': '🇦🇴',
            'Peru': '🇵🇪',
            'Colombia': '🇨🇴',
            'Chile': '🇨🇱',
            'Venezuela': '🇻🇪',
            'Nepal': '🇳🇵',
            'Cambodia': '🇰🇭',
            'Mongolia': '🇲🇳',
            'Sri Lanka': '🇱🇰',
            'Kyrgyzstan': '🇰G',
            'Tunisia': '🇹🇳',
            'Sudan': '🇸🇩',
            'Ghana': '🇬🇭',
            'Ivory Coast': '🇨🇮',
            'Libya': '🇱🇾',
            'Rwanda': '🇷🇼',
            'Uganda': '🇺🇬',
            'Tanzania': '🇹🇿',
            'Mozambique': '🇲🇿',
            'Algeria': '🇩🇿'
        };
        
        return countryMap[countryName] || '🌍';
    }

    // Function to get timezone abbreviation
    function getTimezoneAbbreviation(timezone) {
        try {
            const now = new Date();
            const options = { timeZone: timezone, timeZoneName: 'short' };
            const tzString = new Intl.DateTimeFormat('en-US', options).format(now);
            // Extract the timezone abbreviation (usually at the end after a space)
            const abbr = tzString.split(' ').pop();
            return abbr;
        } catch (error) {
            return '';
        }
    }

    // Function to update the clocks display
    function updateClocksDisplay() {
        clocksContainer.innerHTML = '';
        
        if (clocks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'col-span-full empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-clock animate-float"></i>
                <h3 class="text-xl font-bold text-gray-600 dark:text-gray-300 mb-3">No Clocks Added Yet</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6">Add your first world clock by searching for a city above.</p>
                <button id="addDefaultClocksBtn" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105">
                    <i class="fas fa-plus-circle mr-2"></i>Add Default Clocks
                </button>
            `;
            clocksContainer.appendChild(emptyState);
            
            // Add event listener for adding default clocks
            document.getElementById('addDefaultClocksBtn').addEventListener('click', function() {
                clocks = [...defaultClocks];
                localStorage.setItem('worldClocks', JSON.stringify(clocks));
                updateClocksDisplay();
            });
            
            return;
        }
        
        clocks.forEach((clock, index) => {
            const safeId = `clock-${clock.name.replace(/\s+/g, '_')}`;
            const cityInfo = cityTimezones.find(city => city.city === clock.name);
            const countryFlag = cityInfo ? getCountryFlagEmoji(cityInfo.country) : '🌍';
            const tzAbbr = getTimezoneAbbreviation(clock.timezone);
            
            const clockCard = document.createElement('div');
            clockCard.className = 'clock-card dark:bg-gray-800 dark:border-gray-700 dark:text-white';
            clockCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h2 class="dark:text-white text-xl font-bold flex items-center">
                        <span class="mr-2 text-lg">${countryFlag}</span>
                        ${clock.name}
                    </h2>
                    <button class="delete-btn text-red-500 hover:text-red-700 transition-colors" data-index="${index}">
                        <i class="fas fa-times-circle"></i>
                    </button>
                </div>
                <div class="time-display" id="${safeId}">
                    <div class="time text-3xl font-bold">--:--:--</div>
                    <div class="date text-sm text-gray-500 dark:text-gray-400">--</div>
                </div>
                <div class="mt-3 flex justify-between items-center">
                    <span class="text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                        ${tzAbbr}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">${clock.timezone.replace('_', ' ')}</span>
                </div>
            `;
            clocksContainer.appendChild(clockCard);
            
            // Add fade-in animation with delay based on index
            setTimeout(() => {
                clockCard.classList.add('animate-fadeIn');
            }, index * 100);
            
            // Add event listener to delete button
            clockCard.querySelector('.delete-btn').addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                clockCard.classList.add('animate-fadeOut');
                setTimeout(() => {
                    clocks.splice(index, 1);
                    localStorage.setItem('worldClocks', JSON.stringify(clocks));
                    updateClocksDisplay();
                }, 300);
            });
        });
    }

    // Function to update the time for each clock
    function updateClockTimes() {
        clocks.forEach(clock => {
            const safeId = `clock-${clock.name.replace(/\s+/g, '_')}`;
            const timeDisplay = document.getElementById(safeId);
            if (!timeDisplay) return;
            
            try {
                const now = new Date();
                const timeOptions = { 
                    timeZone: clock.timezone, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit', 
                    hour12: !use24HourFormat 
                };
                const dateOptions = { 
                    timeZone: clock.timezone, 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                };
                
                const timeString = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
                const dateString = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
                
                const timeElement = timeDisplay.querySelector('.time');
                timeElement.textContent = timeString;
                
                // Add tick-tock animation to any clock showing seconds at :00
                if (timeString.includes(':00:') || timeString.includes(':00 ')) {
                    timeElement.classList.add('animate-ticktock');
                    setTimeout(() => {
                        timeElement.classList.remove('animate-ticktock');
                    }, 1000);
                }
                
                timeDisplay.querySelector('.date').textContent = dateString;
            } catch (error) {
                timeDisplay.querySelector('.time').textContent = 'Invalid timezone';
                timeDisplay.querySelector('.date').textContent = 'Please check format';
            }
        });
    }

    // City search autocomplete functionality
    citySearchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        selectedCity = null;
        
        if (searchTerm.length < 2) {
            citySuggestions.classList.add('hidden');
            return;
        }
        
        // Filter cities based on search term
        const matchedCities = cityTimezones.filter(city => 
            city.city.toLowerCase().includes(searchTerm) ||
            (city.country && city.country.toLowerCase().includes(searchTerm))
        ).slice(0, 10); // Limit to 10 results
        
        if (matchedCities.length > 0) {
            renderCitySuggestions(matchedCities);
        } else {
            citySuggestions.innerHTML = `<div class="p-3 text-gray-500 dark:text-gray-400">No cities found</div>`;
            citySuggestions.classList.remove('hidden');
        }
    });

    // Render city suggestions
    function renderCitySuggestions(cities) {
        citySuggestions.innerHTML = '';
        
        cities.forEach(city => {
            const countryFlag = getCountryFlagEmoji(city.country);
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors flex justify-between items-center';
            suggestionItem.innerHTML = `
                <div class="flex items-center">
                    <span class="text-xl mr-3">${countryFlag}</span>
                    <div>
                        <div class="font-medium">${city.city}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">${city.country || ''}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">${getTimezoneAbbreviation(city.timezone)}</div>
            `;
            
            suggestionItem.addEventListener('click', function() {
                selectedCity = city;
                citySearchInput.value = `${city.city}, ${city.country || ''}`;
                citySuggestions.classList.add('hidden');
                
                // Add button animation
                addCityBtn.classList.add('animate-pulse', 'bg-green-500');
                setTimeout(() => {
                    addCityBtn.classList.remove('animate-pulse', 'bg-green-500');
                }, 1500);
            });
            
            citySuggestions.appendChild(suggestionItem);
        });
        
        citySuggestions.classList.remove('hidden');
    }

    // Close suggestions when clicking outside
    document.addEventListener('click', function(event) {
        if (!citySearchInput.contains(event.target) && !citySuggestions.contains(event.target)) {
            citySuggestions.classList.add('hidden');
        }
    });

    // Add new clock from selected city
    addCityBtn.addEventListener('click', function() {
        if (selectedCity) {
            // Check if this city is already added
            const cityExists = clocks.some(clock => 
                clock.name.toLowerCase() === selectedCity.city.toLowerCase() && 
                clock.timezone === selectedCity.timezone
            );
            
            if (cityExists) {
                // Show error with SweetAlert instead of CSS animation
                Swal.fire({
                    title: 'Already Added',
                    text: `${selectedCity.city} is already in your clock collection.`,
                    icon: 'warning',
                    confirmButtonColor: '#3b82f6',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                
                return;
            }
            
            const newClock = {
                name: selectedCity.city,
                timezone: selectedCity.timezone
            };
            
            clocks.push(newClock);
            localStorage.setItem('worldClocks', JSON.stringify(clocks));
            updateClocksDisplay();
            
            // Reset selection
            citySearchInput.value = '';
            selectedCity = null;
            
            // Show success toast with SweetAlert
            Swal.fire({
                title: 'Clock Added',
                text: `${newClock.name} has been added to your collection.`,
                icon: 'success',
                confirmButtonColor: '#3b82f6',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        } else if (citySearchInput.value.trim()) {
            // Show error - no city selected
            Swal.fire({
                title: 'No City Selected',
                text: 'Please select a city from the dropdown.',
                icon: 'error',
                confirmButtonColor: '#3b82f6',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            
            citySearchInput.classList.add('border-red-500', 'animate-shake');
            setTimeout(() => {
                citySearchInput.classList.remove('border-red-500', 'animate-shake');
            }, 1000);
        }
    });
    
    // Sort clocks alphabetically
    sortClocksBtn.addEventListener('click', function() {
        if (clocks.length <= 1) {
            Swal.fire({
                title: 'Nothing to Sort',
                text: 'You need at least two clocks to sort.',
                icon: 'info',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }
        
        clocks.sort((a, b) => a.name.localeCompare(b.name));
        localStorage.setItem('worldClocks', JSON.stringify(clocks));
        
        // Animate sort button
        sortClocksBtn.classList.add('animate-pulse');
        setTimeout(() => {
            sortClocksBtn.classList.remove('animate-pulse');
        }, 1000);
        
        // Show success message
        Swal.fire({
            title: 'Sorted!',
            text: 'Your clocks have been sorted alphabetically.',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        
        updateClocksDisplay();
    });
    
    // Clear all clocks
    clearClocksBtn.addEventListener('click', function() {
        if (clocks.length === 0) {
            Swal.fire({
                title: 'No Clocks',
                text: 'There are no clocks to clear.',
                icon: 'info',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }
        
        Swal.fire({
            title: 'Clear All Clocks?',
            text: 'This will remove all your saved clocks. This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, clear all',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                clocks = [];
                localStorage.setItem('worldClocks', JSON.stringify(clocks));
                updateClocksDisplay();
                
                Swal.fire({
                    title: 'Cleared!',
                    text: 'All clocks have been removed.',
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
            }
        });
    });
    
    // Reset to default clocks
    resetToDefaultBtn.addEventListener('click', function() {
        Swal.fire({
            title: 'Reset to Default?',
            text: 'This will replace your current clocks with the default set.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, reset',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                clocks = [...defaultClocks];
                localStorage.setItem('worldClocks', JSON.stringify(clocks));
                updateClocksDisplay();
                
                Swal.fire({
                    title: 'Reset Complete',
                    text: 'Your clocks have been reset to the default set.',
                    icon: 'success',
                    confirmButtonColor: '#3b82f6'
                });
            }
        });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Add new city on Enter when input is focused
        if (event.key === 'Enter' && document.activeElement === citySearchInput && selectedCity) {
            addCityBtn.click();
        }
        
        // Close city suggestions on Escape
        if (event.key === 'Escape' && !citySuggestions.classList.contains('hidden')) {
            citySuggestions.classList.add('hidden');
        }
    });

    // Add time format toggle handler
    function toggleTimeFormat() {
        use24HourFormat = !use24HourFormat;
        localStorage.setItem('use24HourFormat', use24HourFormat);
        
        // Update the toggle button text
        const formatToggleBtn = document.getElementById('formatToggleBtn');
        if (formatToggleBtn) {
            formatToggleBtn.innerHTML = use24HourFormat ? 
                '<i class="fas fa-clock mr-2"></i>12h' : 
                '<i class="fas fa-clock mr-2"></i>24h';
            
            // Add animation to button
            formatToggleBtn.classList.add('animate-pulse');
            setTimeout(() => {
                formatToggleBtn.classList.remove('animate-pulse');
            }, 1000);
        }
        
        // Update all clocks immediately
        updateLocalTime();
        updateClockTimes();
        
        // Show a toast notification
        Swal.fire({
            title: `Time Format: ${use24HourFormat ? '24-hour' : '12-hour'}`,
            text: `Switched to ${use24HourFormat ? '24-hour' : '12-hour'} time format`,
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    }

    // Initial display and time update
    updateClocksDisplay();
    updateClockTimes();
    setInterval(updateClockTimes, 1000);
    
    // Create time format toggle button
    const controlsContainer = document.querySelector('.mb-8.flex.flex-wrap');
    if (controlsContainer) {
        const formatToggleBtn = document.createElement('button');
        formatToggleBtn.id = 'formatToggleBtn';
        formatToggleBtn.className = 'px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-300 flex items-center format-toggle-btn';
        formatToggleBtn.innerHTML = use24HourFormat ? 
            '<i class="fas fa-clock mr-2"></i>12h' : 
            '<i class="fas fa-clock mr-2"></i>24h';
        formatToggleBtn.addEventListener('click', toggleTimeFormat);
        
        // Insert as the first button in controls
        controlsContainer.insertBefore(formatToggleBtn, controlsContainer.firstChild);
    }
});