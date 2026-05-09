document.addEventListener('DOMContentLoaded', function() {
    // Random Generator Tab Switching with Tailwind classes
    const randomTabButtons = document.querySelectorAll('.random-tab-button');
    const randomTabContents = document.querySelectorAll('.random-tab-content');
    
    randomTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-random-tab');
            
            // Deactivate all random tabs
            randomTabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-green-600', 'text-white');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });
            randomTabContents.forEach(content => content.classList.remove('active'));
            
            // Activate the selected random tab
            button.classList.add('active', 'bg-green-600', 'text-white');
            button.classList.remove('bg-gray-100', 'text-gray-700');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Initialize all random generator tools
    initializeRandomGenerators();
    
    // Function to initialize all random generator tools
    function initializeRandomGenerators() {
        // Coin Flip functionality
        const coin = document.getElementById('coin');
        const coinResult = document.getElementById('coinResult');
        const flipCoinBtn = document.getElementById('flipCoin');
        const resetCoinStatsBtn = document.getElementById('resetCoinStats');
        const totalFlips = document.getElementById('totalFlips');
        const headsCount = document.getElementById('headsCount');
        const tailsCount = document.getElementById('tailsCount');
        const headsPercentage = document.getElementById('headsPercentage');
        const tailsPercentage = document.getElementById('tailsPercentage');
        
        let flips = 0;
        let heads = 0;
        let tails = 0;
        let coinFlipping = false;
        
        flipCoinBtn.addEventListener('click', function() {
            // If already flipping, just update stats without new animation
            if (coinFlipping) {
                quickCoinFlip();
                return;
            }
            
            coinFlipping = true;
            
            // Determine the result
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            
            // Reset animation by removing all animation classes
            coin.className = 'coin';
            
            // Force browser reflow to ensure animation restarts even with same result
            void coin.offsetWidth;
            
            // Add multi-flip animation class plus the result class
            coin.classList.add('flip-multiple');
            coin.classList.add('flip-' + result);
            
            // Update result display after a short delay to match animation
            setTimeout(() => {
                coinResult.textContent = result.charAt(0).toUpperCase() + result.slice(1);
                
                // Update stats
                flips++;
                if (result === 'heads') heads++;
                else tails++;
                
                updateCoinStats();
            }, 650); // Show result during animation
            
            // Allow new full animation after current one completes
            setTimeout(() => {
                coinFlipping = false;
            }, 750);
        });
        
        // Function for rapid coin flipping without animation delays
        function quickCoinFlip() {
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            coinResult.textContent = result.charAt(0).toUpperCase() + result.slice(1);
            
            // Update stats
            flips++;
            if (result === 'heads') heads++;
            else tails++;
            
            updateCoinStats();
        }
        
        resetCoinStatsBtn.addEventListener('click', function() {
            flips = 0;
            heads = 0;
            tails = 0;
            updateCoinStats();
        });
        
        function updateCoinStats() {
            totalFlips.textContent = flips;
            headsCount.textContent = heads;
            tailsCount.textContent = tails;
            headsPercentage.textContent = flips === 0 ? '0%' : Math.round((heads / flips) * 100) + '%';
            tailsPercentage.textContent = flips === 0 ? '0%' : Math.round((tails / flips) * 100) + '%';
        }
        
        // Dice Roller functionality
        const dice1 = document.getElementById('dice1');
        const dice2 = document.getElementById('dice2');
        const diceResult = document.getElementById('diceResult');
        const rollDiceBtn = document.getElementById('rollDice');
        const diceCountSelect = document.getElementById('diceCount');
        const diceSidesSelect = document.getElementById('diceSides');
        let diceRolling = false;
        
        rollDiceBtn.addEventListener('click', function() {
            // If already rolling dice, just update results without animation
            if (diceRolling) {
                quickDiceRoll();
                return;
            }
            
            diceRolling = true;
            
            const diceCount = parseInt(diceCountSelect.value);
            const diceSides = parseInt(diceSidesSelect.value);
            
            // Hide second die if only one is selected
            dice2.style.display = diceCount === 1 ? 'none' : 'block';
            
            // Start animation
            dice1.classList.add('shake');
            if (diceCount === 2) dice2.classList.add('shake');
            
            // Roll dice
            const roll1 = Math.floor(Math.random() * diceSides) + 1;
            const roll2 = Math.floor(Math.random() * diceSides) + 1;
            const totalRoll = roll1 + (diceCount === 2 ? roll2 : 0);
            
            // Update result text immediately
            diceResult.textContent = diceCount === 1 
                ? `${roll1}` 
                : `${roll1} + ${roll2} = ${totalRoll}`;
            
            // Update dice visuals after animation
            setTimeout(() => {
                updateDiceVisual(dice1, roll1, diceSides);
                if (diceCount === 2) updateDiceVisual(dice2, roll2, diceSides);
                
                // Remove animation class
                dice1.classList.remove('shake');
                dice2.classList.remove('shake');
                
                // Allow new full animation after a short delay
                setTimeout(() => {
                    diceRolling = false;
                }, 100);
            }, 400);
        });
        
        // Function for rapid dice rolling without animation delays
        function quickDiceRoll() {
            const diceCount = parseInt(diceCountSelect.value);
            const diceSides = parseInt(diceSidesSelect.value);
            
            // Roll dice
            const roll1 = Math.floor(Math.random() * diceSides) + 1;
            const roll2 = Math.floor(Math.random() * diceSides) + 1;
            const totalRoll = roll1 + (diceCount === 2 ? roll2 : 0);
            
            // Update result without waiting for animation
            diceResult.textContent = diceCount === 1 
                ? `${roll1}` 
                : `${roll1} + ${roll2} = ${totalRoll}`;
        }
        
        // Handle dice count change
        diceCountSelect.addEventListener('change', function() {
            const diceCount = parseInt(this.value);
            dice2.style.display = diceCount === 1 ? 'none' : 'block';
        });
        
        // Handle dice sides change
        diceSidesSelect.addEventListener('change', function() {
            const diceSides = parseInt(this.value);
            
            // Reset dice visuals when changing sides
            resetDiceVisual(dice1);
            resetDiceVisual(dice2);
            
            // Special UI adjustments for non-standard dice
            if (diceSides !== 6) {
                // For non-6-sided dice, hide the dots and show numbers instead
                const dice = [dice1, dice2];
                dice.forEach(die => {
                    Array.from(die.getElementsByClassName('dot')).forEach(dot => {
                        dot.style.display = 'none';
                    });
                    
                    if (!die.querySelector('.dice-number')) {
                        const numberElement = document.createElement('div');
                        numberElement.className = 'dice-number';
                        numberElement.style.position = 'absolute';
                        numberElement.style.top = '50%';
                        numberElement.style.left = '50%';
                        numberElement.style.transform = 'translate(-50%, -50%)';
                        numberElement.style.fontSize = '28px';
                        numberElement.style.fontWeight = 'bold';
                        die.appendChild(numberElement);
                    }
                });
            } else {
                // Reset to standard 6-sided dice with dots
                const dice = [dice1, dice2];
                dice.forEach(die => {
                    const numberElement = die.querySelector('.dice-number');
                    if (numberElement) numberElement.remove();
                    
                    // Don't show dots yet, they'll be shown during roll
                    resetDiceVisual(die);
                });
            }
        });
        
        function updateDiceVisual(dice, value, sides) {
            // Clear previous state
            resetDiceVisual(dice);
            
            if (sides === 6) {
                // For standard 6-sided die, use dot patterns
                switch (value) {
                    case 1:
                        dice.querySelector('.center').classList.add('active');
                        break;
                    case 2:
                        dice.querySelector('.top-left').classList.add('active');
                        dice.querySelector('.bottom-right').classList.add('active');
                        break;
                    case 3:
                        dice.querySelector('.top-left').classList.add('active');
                        dice.querySelector('.center').classList.add('active');
                        dice.querySelector('.bottom-right').classList.add('active');
                        break;
                    case 4:
                        dice.querySelector('.top-left').classList.add('active');
                        dice.querySelector('.top-right').classList.add('active');
                        dice.querySelector('.bottom-left').classList.add('active');
                        dice.querySelector('.bottom-right').classList.add('active');
                        break;
                    case 5:
                        dice.querySelector('.top-left').classList.add('active');
                        dice.querySelector('.top-right').classList.add('active');
                        dice.querySelector('.center').classList.add('active');
                        dice.querySelector('.bottom-left').classList.add('active');
                        dice.querySelector('.bottom-right').classList.add('active');
                        break;
                    case 6:
                        dice.querySelector('.top-left').classList.add('active');
                        dice.querySelector('.top-right').classList.add('active');
                        dice.querySelector('.center-left').classList.add('active');
                        dice.querySelector('.center-right').classList.add('active');
                        dice.querySelector('.bottom-left').classList.add('active');
                        dice.querySelector('.bottom-right').classList.add('active');
                        break;
                }
            } else {
                // For non-standard dice, display numbers
                const numberElement = dice.querySelector('.dice-number');
                if (numberElement) {
                    numberElement.textContent = value;
                    numberElement.style.display = 'block';
                }
            }
        }
        
        function resetDiceVisual(dice) {
            // Hide all dots
            Array.from(dice.getElementsByClassName('dot')).forEach(dot => {
                dot.classList.remove('active');
            });
            
            // Hide number if exists
            const numberElement = dice.querySelector('.dice-number');
            if (numberElement) numberElement.style.display = 'none';
        }
        
        // Random Number Generator functionality
        const minNumberInput = document.getElementById('minNumber');
        const maxNumberInput = document.getElementById('maxNumber');
        const decimalPlacesInput = document.getElementById('decimalPlaces');
        const numberCountInput = document.getElementById('numberCount');
        const randomNumbersDisplay = document.getElementById('randomNumbers');
        const generateNumbersBtn = document.getElementById('generateNumbers');
        const copyNumbersBtn = document.getElementById('copyNumbers');
        
        generateNumbersBtn.addEventListener('click', function() {
            const min = parseFloat(minNumberInput.value);
            const max = parseFloat(maxNumberInput.value);
            const decimalPlaces = parseInt(decimalPlacesInput.value);
            const count = parseInt(numberCountInput.value);
            
            // Validate inputs
            if (isNaN(min) || isNaN(max) || isNaN(decimalPlaces) || isNaN(count)) {
                alert('Please enter valid numbers for all fields.');
                return;
            }
            
            if (min >= max) {
                alert('Maximum must be greater than minimum.');
                return;
            }
            
            if (count < 1 || count > 1000) {
                alert('Number count must be between 1 and 1000.');
                return;
            }
            
            const randomNumbers = [];
            for (let i = 0; i < count; i++) {
                const randomNumber = Math.random() * (max - min) + min;
                const roundedNumber = decimalPlaces === 0 
                    ? Math.floor(randomNumber) 
                    : parseFloat(randomNumber.toFixed(decimalPlaces));
                randomNumbers.push(roundedNumber);
            }
            
            randomNumbersDisplay.textContent = randomNumbers.join(', ');
        });
        
        copyNumbersBtn.addEventListener('click', function() {
            const text = randomNumbersDisplay.textContent;
            if (text && text !== '-') {
                navigator.clipboard.writeText(text).then(
                    function() {
                        // Temporarily change button text to indicate success
                        const originalText = copyNumbersBtn.textContent;
                        copyNumbersBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyNumbersBtn.textContent = originalText;
                        }, 1500);
                    },
                    function() {
                        alert('Failed to copy to clipboard');
                    }
                );
            }
        });
        
        // Initialize with defaults
        dice2.style.display = diceCountSelect.value === '1' ? 'none' : 'block';

        // Roulette Wheel Implementation
        const wheelCanvas = document.getElementById('wheelCanvas');
        if (wheelCanvas) {
            const ctx = wheelCanvas.getContext('2d');
            const itemInput = document.getElementById('itemInput');
            const addItemBtn = document.getElementById('addItemBtn');
            const itemsList = document.getElementById('itemsList');
            const removeSelectedBtn = document.getElementById('removeSelectedBtn');
            const clearWheelBtn = document.getElementById('clearWheelBtn');
            const spinWheelBtn = document.getElementById('spinWheelBtn');
            const spinResult = document.getElementById('spinResult');
            const historyList = document.getElementById('historyList');
            
            // Initialize with empty wheel
            let wheelItems = [];
            let selectedItems = [];
            let currentAngle = 0;
            let isSpinning = false;
            
            // Colors for the wheel
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#8AC054', '#5D9CEC',
                '#48CFAD', '#EC87C0', '#FC6E51'
            ];
            
            // Initialize the wheel
            drawWheel();
            updateItemsList();
            
            // Add a new item to the wheel
            addItemBtn.addEventListener('click', () => {
                const item = itemInput.value.trim();
                if (item) {
                    wheelItems.push(item);
                    itemInput.value = '';
                    drawWheel();
                    updateItemsList();
                }
            });

            // Allow enter key to add item
            itemInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    addItemBtn.click();
                }
            });
            
            // Handle item selection in the list
            itemsList.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    e.target.classList.toggle('selected');
                    const index = parseInt(e.target.dataset.index);
                    
                    if (e.target.classList.contains('selected')) {
                        selectedItems.push(index);
                    } else {
                        const idx = selectedItems.indexOf(index);
                        if (idx !== -1) {
                            selectedItems.splice(idx, 1);
                        }
                    }
                }
            });
            
            // Remove selected items
            removeSelectedBtn.addEventListener('click', () => {
                if (selectedItems.length === 0) return;
                
                // Sort indices in reverse order to avoid shifting issues when splicing
                selectedItems.sort((a, b) => b - a);
                
                selectedItems.forEach(index => {
                    wheelItems.splice(index, 1);
                });
                
                selectedItems = [];
                drawWheel();
                updateItemsList();
            });
            
            // Clear all items
            clearWheelBtn.addEventListener('click', () => {
                wheelItems = [];
                selectedItems = [];
                drawWheel();
                updateItemsList();
            });
            
            // Spin the wheel
            spinWheelBtn.addEventListener('click', () => {
                if (wheelItems.length < 2) {
                    spinResult.textContent = 'Add at least 2 items to spin the wheel';
                    return;
                }
                
                if (isSpinning) return;
                
                isSpinning = true;
                spinWheelBtn.disabled = true;
                spinResult.textContent = 'Spinning...';
                
                // Random number of rotations (3-8 full rotations)
                const rotations = 3 + Math.random() * 5;
                const targetAngle = currentAngle + (rotations * 360);
                
                let startTime = null;
                const spinDuration = 5000; // 5 seconds
                
                function animateSpin(timestamp) {
                    if (!startTime) startTime = timestamp;
                    
                    const elapsed = timestamp - startTime;
                    const progress = Math.min(elapsed / spinDuration, 1);
                    
                    // Easing function for smooth deceleration
                    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
                    const rotation = currentAngle + easeOut(progress) * (targetAngle - currentAngle);
                    
                    drawWheel(rotation);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateSpin);
                    } else {
                        finishSpin(rotation);
                    }
                }
                
                requestAnimationFrame(animateSpin);
            });
            
            // Draw the wheel with items
            function drawWheel(rotation = currentAngle) {
                const centerX = wheelCanvas.width / 2;
                const centerY = wheelCanvas.height / 2;
                const radius = Math.min(centerX, centerY) - 5;
                
                // Clear canvas
                ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
                
                if (wheelItems.length === 0) {
                    // Draw empty wheel
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = '#f0f0f0';
                    ctx.fill();
                    ctx.strokeStyle = '#ddd';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Draw text
                    ctx.font = '16px Arial';
                    ctx.fillStyle = '#999';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Add items to the wheel', centerX, centerY);
                    return;
                }
                
                const anglePerItem = (2 * Math.PI) / wheelItems.length;
                const rotationInRadians = (rotation * Math.PI) / 180;
                
                // Draw wheel segments
                for (let i = 0; i < wheelItems.length; i++) {
                    const startAngle = i * anglePerItem + rotationInRadians;
                    const endAngle = (i + 1) * anglePerItem + rotationInRadians;
                    
                    // Draw segment
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                    ctx.closePath();
                    
                    // Fill segment
                    ctx.fillStyle = colors[i % colors.length];
                    ctx.fill();
                    
                    // Draw segment border
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    // Draw text
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(startAngle + anglePerItem / 2);
                    
                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px Arial';
                    
                    // Adjust text size based on item name length
                    const maxTextLength = radius * 0.8;
                    let fontSize = 14;
                    ctx.font = `${fontSize}px Arial`;
                    
                    if (ctx.measureText(wheelItems[i]).width > maxTextLength) {
                        const ratio = maxTextLength / ctx.measureText(wheelItems[i]).width;
                        fontSize *= ratio;
                        ctx.font = `${Math.max(fontSize, 8)}px Arial`;
                    }
                    
                    // Draw text rotated properly
                    ctx.textBaseline = 'middle';
                    ctx.fillText(wheelItems[i], radius - 10, 0);
                    ctx.restore();
                }
                
                // Draw center circle
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            // Update the list of items
            function updateItemsList() {
                itemsList.innerHTML = '';
                
                if (wheelItems.length === 0) {
                    const emptyItem = document.createElement('li');
                    emptyItem.textContent = 'No items added yet';
                    emptyItem.className = 'p-3 text-center';
                    emptyItem.style.fontStyle = 'italic';
                    emptyItem.style.color = '#999';
                    itemsList.appendChild(emptyItem);
                    return;
                }
                
                wheelItems.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.className = 'px-3 py-2 flex justify-between items-center';
                    
                    // Create item text span
                    const textSpan = document.createElement('span');
                    textSpan.textContent = item;
                    textSpan.className = 'item-text flex-1';
                    li.appendChild(textSpan);
                    
                    // Create remove button
                    const removeBtn = document.createElement('span');
                    removeBtn.textContent = '×';
                    removeBtn.className = 'item-remove px-2 ml-2';
                    removeBtn.title = 'Remove this item';
                    removeBtn.dataset.index = index;
                    li.appendChild(removeBtn);
                    
                    li.dataset.index = index;
                    
                    if (selectedItems.includes(index)) {
                        li.classList.add('selected');
                        li.classList.add('bg-blue-50');
                    }
                    
                    itemsList.appendChild(li);
                });
                
                // Add event listeners for quick remove buttons
                document.querySelectorAll('.item-remove').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent triggering the li click event
                        const index = parseInt(e.target.dataset.index);
                        wheelItems.splice(index, 1);
                        if (selectedItems.includes(index)) {
                            selectedItems = selectedItems.filter(i => i !== index);
                        }
                        // Update indices in selectedItems array
                        selectedItems = selectedItems.map(i => i > index ? i - 1 : i);
                        drawWheel();
                        updateItemsList();
                    });
                });
            }
            
            // Finish spin and show result
            function finishSpin(finalRotation) {
                currentAngle = finalRotation % 360;
                isSpinning = false;
                spinWheelBtn.disabled = false;
                
                // Determine which item was selected based on the pointer at the right
                const anglePerItem = 360 / wheelItems.length;
                
                // Calculate the absolute angle in the wheel's reference frame
                let normalizedAngle = (360 - currentAngle) % 360;
                
                // Adjust to find which segment is at the right pointer position
                const selectedIndex = Math.floor(normalizedAngle / anglePerItem) % wheelItems.length;
                const selectedItem = wheelItems[selectedIndex];
                
                // Display result with remove button
                spinResult.innerHTML = `
                    <div class="spin-result-container">
                        <span>${selectedItem}</span>
                        <button id="removeWinnerBtn" data-index="${selectedIndex}">Remove</button>
                    </div>
                `;
                
                // Show the remove button
                const removeWinnerBtn = document.getElementById('removeWinnerBtn');
                setTimeout(() => {
                    removeWinnerBtn.classList.add('visible');
                }, 500);
                
                // Add event listener to remove button
                removeWinnerBtn.addEventListener('click', function() {
                    const indexToRemove = parseInt(this.getAttribute('data-index'));
                    wheelItems.splice(indexToRemove, 1);
                    
                    // Update the wheel and items list
                    drawWheel();
                    updateItemsList();
                    
                    // Update the result display
                    spinResult.textContent = `Item "${selectedItem}" has been removed`;
                });
                
                // Add to history
                const historyItem = document.createElement('li');
                historyItem.textContent = selectedItem;
                historyList.prepend(historyItem);
                
                // Limit history to 10 items
                if (historyList.children.length > 10) {
                    historyList.removeChild(historyList.lastChild);
                }
            }
        }
    }
});