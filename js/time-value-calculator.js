document.addEventListener('DOMContentLoaded', function() {
    // Get UI elements
    const calculateBtn = document.getElementById('calculate');
    const chartTypeSelect = document.getElementById('chartType');
    const showNominalCheckbox = document.getElementById('showNominal');
    const showRealValueCheckbox = document.getElementById('showRealValue');
    
    // Chart instance
    let valueChart = null;
    
    // Current calculation results
    let currentCalculation = null;
    
    // Set up event listeners
    calculateBtn.addEventListener('click', calculateTimeValue);
    
    // Add event listeners to update chart when options change
    if (chartTypeSelect) chartTypeSelect.addEventListener('change', updateChart);
    if (showNominalCheckbox) showNominalCheckbox.addEventListener('change', updateChart);
    if (showRealValueCheckbox) showRealValueCheckbox.addEventListener('change', updateChart);
    
    // Calculate on page load with default values
    calculateTimeValue();
    
    // Main calculation function
    function calculateTimeValue() {
        // Get input values
        const currentAmount = parseFloat(document.getElementById('currentAmount').value);
        const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100; // Convert to decimal
        const timePeriod = parseInt(document.getElementById('timePeriod').value);
        
        // Validate inputs
        if (isNaN(currentAmount) || isNaN(inflationRate) || isNaN(timePeriod)) {
            alert('Please enter valid values for all fields');
            return;
        }
        
        // Calculate results for each year
        const results = [];
        let nominalValue = currentAmount;
        
        for (let year = 0; year <= timePeriod; year++) {
            // Calculate real value (purchasing power) affected by inflation
            // For year 0, the real value equals the nominal value
            const realValue = year === 0 ? 
                currentAmount : 
                currentAmount / Math.pow(1 + inflationRate, year);
            
            // Calculate future value (what the amount would need to be to maintain purchasing power)
            const futureValue = year === 0 ? 
                currentAmount : 
                currentAmount * Math.pow(1 + inflationRate, year);
            
            // Store results for this year
            results.push({
                year,
                nominalValue,  // Remains the same if no adjustment
                realValue,     // Decreases over time due to inflation
                futureValue,   // What you'd need to charge to maintain value
                inflationFactor: Math.pow(1 + inflationRate, year)
            });
        }
        
        // Calculate final values and percentages
        const finalYear = results[timePeriod];
        const purchasingPowerLossPercent = ((currentAmount - finalYear.realValue) / currentAmount * 100).toFixed(1);
        const inflationTotalPercent = ((finalYear.futureValue - currentAmount) / currentAmount * 100).toFixed(1);
        
        // Store current calculation
        currentCalculation = {
            currentAmount,
            inflationRate: inflationRate * 100, // Convert back to percentage for display
            timePeriod,
            results,
            finalFutureValue: finalYear.futureValue,
            finalRealValue: finalYear.realValue,
            purchasingPowerLossPercent,
            inflationTotalPercent
        };
        
        // Display results
        displayResults(currentCalculation);
    }
    
    // Display the calculation results
    function displayResults(data) {
        // Show the summary box
        const summaryResult = document.getElementById('summaryResult');
        if (summaryResult) {
            summaryResult.style.display = 'block';
            summaryResult.classList.add('show');
        }
        
        // Update summary values
        document.getElementById('currentValue').textContent = formatCurrency(data.currentAmount);
        document.getElementById('futureValue').textContent = formatCurrency(data.finalFutureValue);
        document.getElementById('purchasingPowerLoss').textContent = data.purchasingPowerLossPercent + '%';
        
        // Update explanation text
        document.getElementById('currentAmountText').textContent = formatCurrency(data.currentAmount);
        document.getElementById('currentAmountText2').textContent = formatCurrency(data.currentAmount);
        document.getElementById('futureAmountText').textContent = formatCurrency(data.finalFutureValue);
        document.getElementById('yearsText').textContent = data.timePeriod;
        document.getElementById('yearsText2').textContent = data.timePeriod;
        document.getElementById('discountedAmountText').textContent = formatCurrency(data.finalRealValue);
        document.getElementById('inflationTotalText').textContent = data.inflationTotalPercent + '%';
        
        // Update the table view
        createResultsTable(data);
        
        // Update the chart
        updateChart();
    }
    
    // Create and update the results table
    function createResultsTable(data) {
        const tableView = document.getElementById('tableView');
        
        // Clear previous table
        tableView.innerHTML = '';
        
        // Create table
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = [
            'Year', 
            'Nominal Value', 
            'Real Value (Today\'s $)', 
            'Required Value to Maintain Purchasing Power',
            'Cumulative Inflation'
        ];
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        data.results.forEach((yearData, index) => {
            const row = document.createElement('tr');
            
            // Year
            const yearCell = document.createElement('td');
            yearCell.textContent = yearData.year;
            row.appendChild(yearCell);
            
            // Nominal Value
            const nominalCell = document.createElement('td');
            nominalCell.textContent = formatCurrency(yearData.nominalValue);
            row.appendChild(nominalCell);
            
            // Real Value
            const realCell = document.createElement('td');
            realCell.textContent = formatCurrency(yearData.realValue);
            row.appendChild(realCell);
            
            // Future Value (Required Value to Maintain Purchasing Power)
            const futureCell = document.createElement('td');
            futureCell.textContent = formatCurrency(yearData.futureValue);
            row.appendChild(futureCell);
            
            // Cumulative Inflation
            const inflationCell = document.createElement('td');
            const inflationPercent = ((yearData.inflationFactor - 1) * 100).toFixed(1) + '%';
            inflationCell.textContent = index === 0 ? '0.0%' : inflationPercent;
            row.appendChild(inflationCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableView.appendChild(table);
    }
    
    // Update the chart with the data
    function updateChart() {
        if (!currentCalculation) return;
        
        const ctx = document.getElementById('valueChart').getContext('2d');
        
        // Destroy previous chart instance if it exists
        if (valueChart) {
            valueChart.destroy();
        }
        
        // Get chart settings
        const chartType = chartTypeSelect ? chartTypeSelect.value : 'line';
        const showNominal = showNominalCheckbox ? showNominalCheckbox.checked : true;
        const showRealValue = showRealValueCheckbox ? showRealValueCheckbox.checked : true;
        
        // Prepare data for charts
        const years = currentCalculation.results.map(item => item.year);
        const nominalValues = currentCalculation.results.map(item => item.nominalValue);
        const realValues = currentCalculation.results.map(item => item.realValue);
        const futureValues = currentCalculation.results.map(item => item.futureValue);
        
        // Build datasets array based on what's enabled
        const datasets = [];
        
        // Always show future value (what you need to charge to maintain value)
        datasets.push({
            label: 'Required Value',
            data: futureValues,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 3,
            fill: chartType === 'line' ? true : false
        });
        
        // Show nominal value if checked
        if (showNominal) {
            datasets.push({
                label: 'Nominal Value',
                data: nominalValues,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 3,
                fill: chartType === 'line' ? true : false
            });
        }
        
        // Show real value if checked
        if (showRealValue) {
            datasets.push({
                label: 'Real Value (Today\'s $)',
                data: realValues,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 3,
                fill: chartType === 'line' ? true : false
            });
        }
        
        // Create chart
        valueChart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: years,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Value ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Helper function to format currency
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
});
