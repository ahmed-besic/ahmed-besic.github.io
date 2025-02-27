document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables to store chart instances
    let growthChart = null;
    let compareChart = null;
    let lengthChart = null; // Add this to track the length chart instance
    let dividendGrowthChart = null; // Add this for the dividend chart
    let currentScenarioData = null;
    let scenarios = loadSavedScenarios();
    
    // Get UI elements
    const calculateBtn = document.getElementById('calculate');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const compareBtn = document.getElementById('compareBtn');
    const exportBtn = document.getElementById('exportBtn');
    const saveScenarioBtn = document.getElementById('saveScenario');
    const loadScenarioBtn = document.getElementById('loadScenario');
    const deleteScenarioBtn = document.getElementById('deleteScenario');
    
    // Add proper initialization of these selectors
    // These elements might not exist when the previous code tries to access them
    let chartTypeSelect = document.getElementById('chartType');
    let showContributionsCheckbox = document.getElementById('showContributions');
    let showInterestCheckbox = document.getElementById('showInterest');
    let showInflationAdjustedCheckbox = document.getElementById('showInflationAdjusted');
    
    // Ensure these critical buttons are found
    const calculateLengthBtn = document.getElementById('calculateLength');
    const calculateRateBtn = document.getElementById('calculateRate');
    const calculateDividendBtn = document.getElementById('calculateDividend'); // Get the dividend calculator button

    // Set up event listeners for main calculator
    calculateBtn.addEventListener('click', calculateInvestment);
    saveScenarioBtn.addEventListener('click', saveScenario);
    loadScenarioBtn.addEventListener('click', loadScenario);
    deleteScenarioBtn.addEventListener('click', deleteScenario);
    
    // Only add event listeners if elements exist
    if (chartTypeSelect) chartTypeSelect.addEventListener('change', updateCharts);
    if (showContributionsCheckbox) showContributionsCheckbox.addEventListener('change', updateCharts);
    if (showInterestCheckbox) showInterestCheckbox.addEventListener('change', updateCharts);
    if (showInflationAdjustedCheckbox) showInflationAdjustedCheckbox.addEventListener('change', updateCharts);
    
    // Set up view tab switching
    const viewButtons = [tableViewBtn, compareBtn, exportBtn];
    const viewContents = [
        document.getElementById('tableView'),
        document.getElementById('compareView')
    ];
    
    viewButtons.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            if (this === exportBtn) {
                exportData();
                return;
            }
            
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            viewContents.forEach(content => content.classList.remove('active'));
            if (index < viewContents.length) {
                viewContents[index].classList.add('active');
            }
            
            if (this === compareBtn) {
                updateComparisonSelects();
            }
        });
    });
    
    // Set up comparison select event listeners
    document.getElementById('scenario1').addEventListener('change', updateComparisonChart);
    document.getElementById('scenario2').addEventListener('change', updateComparisonChart);
    
    // Calculate on page load with default values
    calculateInvestment();
    updateSavedScenariosSelect();
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activate the selected tab
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Make sure these event listeners are properly attached
    if (calculateLengthBtn) {
        calculateLengthBtn.addEventListener('click', calculateInvestmentLength);
        console.log('Investment Length calculator button listener attached');
    } else {
        console.error('Calculate Length button not found in the DOM');
    }
    
    if (calculateRateBtn) {
        calculateRateBtn.addEventListener('click', calculateRequiredRate);
        console.log('Required Rate calculator button listener attached');
    } else {
        console.error('Calculate Rate button not found in the DOM');
    }

    if (calculateDividendBtn) {
        calculateDividendBtn.addEventListener('click', calculateDividends);
    }

    // Main calculation function
    function calculateInvestment() {
        // Get input values
        const startingAmount = parseFloat(document.getElementById('startingAmount').value);
        const returnRate = parseFloat(document.getElementById('returnRate').value) / 100;
        const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
        
        // Get the new parameters
        const years = parseInt(document.getElementById('years').value);
        const compoundFrequency = parseInt(document.getElementById('compoundFrequency').value);
        const contributionAmount = parseFloat(document.getElementById('contributionAmount').value);
        const contributionFrequency = parseInt(document.getElementById('contributionFrequency').value);
        const contributionTiming = document.querySelector('input[name="contributionTiming"]:checked').value;

        // Calculate the growth
        const results = [];
        let balance = startingAmount;
        let totalContributions = startingAmount;
        
        // Calculate how many times to compound per year
        const periodsPerYear = compoundFrequency;
        const ratePerPeriod = returnRate / periodsPerYear;
        
        // Calculate contribution per period
        const contributionsPerYear = contributionFrequency;
        const contributionPerPeriod = contributionAmount / contributionsPerYear;
        
        // Track contributions and interest separately
        let interestEarned = 0;
        
        for (let year = 1; year <= years; year++) {
            let yearlyContributions = 0;
            let yearlyInterest = 0;
            
            // For each period within the year
            for (let period = 1; period <= periodsPerYear; period++) {
                // If contribution at beginning of period, add it before calculating interest
                if (contributionTiming === 'start') {
                    // Check if we need to add a contribution this period
                    const periodsPerContribution = periodsPerYear / contributionsPerYear;
                    if (period % periodsPerContribution === 0) {
                        balance += contributionPerPeriod;
                        yearlyContributions += contributionPerPeriod;
                        totalContributions += contributionPerPeriod;
                    }
                }
                
                // Add interest for this period
                const periodInterest = balance * ratePerPeriod;
                balance += periodInterest;
                yearlyInterest += periodInterest;
                interestEarned += periodInterest;
                
                // If contribution at end of period, add it after calculating interest
                if (contributionTiming === 'end') {
                    // Check if we need to add a contribution this period
                    const periodsPerContribution = periodsPerYear / contributionsPerYear;
                    if (period % periodsPerContribution === 0) {
                        balance += contributionPerPeriod;
                        yearlyContributions += contributionPerPeriod;
                        totalContributions += contributionPerPeriod;
                    }
                }
            }
            
            // Adjust for inflation to show "real" value
            // This correctly applies inflation once per year using the compounded inflation rate
            // (1 + inflationRate)^year gives us the cumulative inflation effect up to this year
            const inflationFactor = Math.pow(1 + inflationRate, year);
            const inflationAdjusted = balance / inflationFactor;
            
            // Store the results for this year
            results.push({
                year,
                balance,
                contributions: totalContributions,
                interest: interestEarned,
                yearlyContributions,
                yearlyInterest,
                inflationAdjusted
            });
        }
        
        // Store current scenario data
        currentScenarioData = {
            startingAmount,
            returnRate: returnRate * 100,
            compoundFrequency,
            contributionAmount,
            contributionTiming,
            contributionFrequency,
            years,
            inflationRate: inflationRate * 100,
            results,
            totalContributions,
            totalInterest: interestEarned,
            finalBalance: balance,
            inflationAdjustedFinal: results[results.length - 1].inflationAdjusted
        };

        // Display results
        displayResults(currentScenarioData);
    }

    // Display the calculation results
    function displayResults(data) {
        // Update summary values
        document.getElementById('finalBalance').textContent = formatCurrency(data.finalBalance);
        document.getElementById('totalContributions').textContent = formatCurrency(data.totalContributions);
        document.getElementById('totalInterest').textContent = formatCurrency(data.totalInterest);
        document.getElementById('inflationAdjusted').textContent = formatCurrency(data.inflationAdjustedFinal);
        
        // Update the table view
        createResultsTable(data);
        
        // Update the chart
        updateGrowthChart(data);
    }

    // Create and update the results table
    function createResultsTable(data) {
        const tableView = document.getElementById('tableView');
        
        // Clear previous table
        tableView.innerHTML = '';
        
        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        // Create table
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = [
            'Year', 
            'Balance', 
            'Yearly Interest', 
            'Total Interest', 
            'Inflation-Adjusted'
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
        
        data.results.forEach(yearData => {
            const row = document.createElement('tr');
            
            // Year
            const yearCell = document.createElement('td');
            yearCell.textContent = yearData.year;
            row.appendChild(yearCell);
            
            // Balance
            const balanceCell = document.createElement('td');
            balanceCell.textContent = formatCurrency(yearData.balance);
            row.appendChild(balanceCell);
            
            // Yearly Interest
            const yearlyInterestCell = document.createElement('td');
            yearlyInterestCell.textContent = formatCurrency(yearData.yearlyInterest);
            row.appendChild(yearlyInterestCell);
            
            // Total Interest
            const totalInterestCell = document.createElement('td');
            totalInterestCell.textContent = formatCurrency(yearData.interest);
            row.appendChild(totalInterestCell);
            
            // Inflation-Adjusted Balance
            const inflationCell = document.createElement('td');
            inflationCell.textContent = formatCurrency(yearData.inflationAdjusted);
            row.appendChild(inflationCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        tableView.appendChild(tableContainer);
    }

    // Update the chart with investment data
    function updateGrowthChart(data) {
        const ctx = document.getElementById('growthChart').getContext('2d');
        
        // Destroy previous chart instance if it exists
        if (growthChart) {
            growthChart.destroy();
        }
        
        // Get chart settings
        const chartType = chartTypeSelect ? chartTypeSelect.value : 'line';
        const showContributions = showContributionsCheckbox ? showContributionsCheckbox.checked : true;
        const showInterest = showInterestCheckbox ? showInterestCheckbox.checked : true;
        const showInflationAdjusted = showInflationAdjustedCheckbox ? showInflationAdjustedCheckbox.checked : true;
        
        // Prepare data for charts
        const years = data.results.map(item => item.year);
        const balances = data.results.map(item => item.balance);
        const inflationAdjusted = data.results.map(item => item.inflationAdjusted);
        const contributions = data.results.map(item => item.contributions);
        const interest = data.results.map(item => item.interest);
        
        // Handle different chart types
        if (chartType === 'pie') {
            // Create a pie chart showing the breakdown of the final values
            const finalYear = data.results[data.results.length - 1];
            const pieData = [];
            
            // Only add segments that are enabled
            if (showContributions) {
                pieData.push({
                    label: 'Contributions',
                    value: finalYear.contributions,
                    color: 'rgba(75, 192, 192, 0.8)'
                });
            }
            
            if (showInterest) {
                pieData.push({
                    label: 'Interest',
                    value: finalYear.interest,
                    color: 'rgba(153, 102, 255, 0.8)'
                });
            }
            
            growthChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: pieData.map(item => item.label),
                    datasets: [{
                        data: pieData.map(item => item.value),
                        backgroundColor: pieData.map(item => item.color),
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
        } else if (chartType === 'bar') {
            // Create a bar chart showing progression over time
            // For bar chart we'll use fewer data points (every 5 years)
            const filteredYears = [];
            const filteredData = {
                balance: [],
                inflationAdjusted: [],
                contributions: [],
                interest: []
            };
            
            // Filter to every 5 years or fewer points for better visualization
            const step = Math.ceil(years.length / 10); // Show about 10 bars
            for (let i = 0; i < years.length; i += step) {
                filteredYears.push(years[i]);
                filteredData.balance.push(balances[i]);
                filteredData.inflationAdjusted.push(inflationAdjusted[i]);
                filteredData.contributions.push(contributions[i]);
                filteredData.interest.push(interest[i]);
            }
            
            // Add the final year if not already included
            if (filteredYears[filteredYears.length - 1] !== years[years.length - 1]) {
                filteredYears.push(years[years.length - 1]);
                filteredData.balance.push(balances[balances.length - 1]);
                filteredData.inflationAdjusted.push(inflationAdjusted[inflationAdjusted.length - 1]);
                filteredData.contributions.push(contributions[contributions.length - 1]);
                filteredData.interest.push(interest[interest.length - 1]);
            }
            
            // Build datasets array based on what's enabled
            const datasets = [];
            
            if (showContributions) {
                datasets.push({
                    label: 'Contributions',
                    data: filteredData.contributions,
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                });
            }
            
            if (showInterest) {
                datasets.push({
                    label: 'Interest',
                    data: filteredData.interest,
                    backgroundColor: 'rgba(153, 102, 255, 0.8)',
                });
            }
            
            if (!showContributions && !showInterest) {
                // If neither contributions nor interest are shown, show total balance
                datasets.push({
                    label: 'Balance',
                    data: filteredData.balance,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                });
            }
            
            if (showInflationAdjusted) {
                datasets.push({
                    label: 'Inflation-Adjusted',
                    data: filteredData.inflationAdjusted,
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    // If showing as a separate dataset in bar chart
                    type: 'line',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    fill: false
                });
            }
            
            growthChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: filteredYears,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + formatCurrency(context.raw);
                                }
                            }
                        }
                    }
                }
            });
            
        } else { // Default to line chart
            // Build datasets array based on what's enabled
            const datasets = [];
            
            // Always show total balance in line chart
            datasets.push({
                label: 'Balance',
                data: balances,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 3,
                fill: true
            });
            
            if (showInflationAdjusted) {
                datasets.push({
                    label: 'Inflation-Adjusted',
                    data: inflationAdjusted,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 3,
                    fill: true
                });
            }
            
            if (showContributions) {
                datasets.push({
                    label: 'Contributions',
                    data: contributions,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    fill: true
                });
            }
            
            growthChart = new Chart(ctx, {
                type: 'line',
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
                        }
                    }
                }
            });
        }
    }

    // Calculate how long it will take to reach target amount
    function calculateInvestmentLength() {
        console.log('Investment Length calculation started');
        
        // Get input values
        const startingAmount = parseFloat(document.getElementById('lengthStartingAmount').value);
        const targetAmount = parseFloat(document.getElementById('targetAmount').value);
        const returnRate = parseFloat(document.getElementById('lengthReturnRate').value) / 100;
        const contributionAmount = parseFloat(document.getElementById('lengthContributionAmount').value);
        const contributionFrequency = parseInt(document.getElementById('lengthContributionFrequency').value);
        
        // Debug values
        console.log('Starting Amount:', startingAmount);
        console.log('Target Amount:', targetAmount);
        console.log('Return Rate:', returnRate);
        console.log('Contribution Amount:', contributionAmount);
        console.log('Contribution Frequency:', contributionFrequency);
        
        // Validate inputs
        if (isNaN(startingAmount) || isNaN(targetAmount) || isNaN(returnRate) || isNaN(contributionAmount)) {
            alert('Please enter valid values for all fields');
            return;
        }
        
        if (startingAmount >= targetAmount) {
            document.getElementById('yearsToTarget').textContent = '0';
            document.getElementById('lengthResult').style.display = 'block';
            document.getElementById('lengthResult').classList.add('show');
            return;
        }
        
        // Calculate return rate per period based on contribution frequency
        const periodsPerYear = contributionFrequency;
        const ratePerPeriod = returnRate / periodsPerYear;
        
        // Calculate time to reach target (in periods)
        let timeInPeriods;
        let balance = startingAmount;
        let projectionData = [];
        
        // If there are no contributions, use the simple compound interest formula
        if (contributionAmount <= 0) {
            // Formula: t = ln(FV/PV) / ln(1+r)
            // where FV = future value (target), PV = present value (starting amount), r = rate per period, t = time periods
            timeInPeriods = Math.log(targetAmount / startingAmount) / Math.log(1 + ratePerPeriod);
        } else {
            // Use iterative approach for contributions
            let period = 0;
            const maxIterations = 1200; // 100 years (practical limit)
            
            while (balance < targetAmount && period < maxIterations) {
                balance = balance * (1 + ratePerPeriod) + contributionAmount;
                period++;
                
                // Store data points for chart (yearly)
                if (period % periodsPerYear === 0 || period === 1) {
                    projectionData.push({
                        year: period / periodsPerYear,
                        balance: balance
                    });
                }
            }
            
            timeInPeriods = period;
        }
        
        // Convert to years with one decimal
        const timeInYears = (timeInPeriods / periodsPerYear).toFixed(1);
        
        // Display result
        console.log('Calculation completed:', timeInYears, 'years');
        document.getElementById('yearsToTarget').textContent = timeInYears;
        
        // Make sure the result is visible
        const resultElement = document.getElementById('lengthResult');
        resultElement.style.display = 'block';
        
        // Add animation class
        resultElement.classList.add('show');
        
        // Show projection chart
        try {
            updateLengthChart(startingAmount, targetAmount, parseFloat(timeInYears), contributionAmount, contributionFrequency);
            console.log('Chart updated successfully');
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }

    // Update chart with investment length projection data
    function updateLengthChart(startingAmount, targetAmount, years, contributionAmount, contributionFrequency) {
        const ctx = document.getElementById('lengthChart').getContext('2d');
        
        // Create yearly projection data
        const data = [];
        let balance = startingAmount;
        const returnRate = parseFloat(document.getElementById('lengthReturnRate').value) / 100;
        const periodsPerYear = contributionFrequency;
        const ratePerPeriod = returnRate / periodsPerYear;
        
        // Add starting point
        data.push({
            x: 0,
            y: startingAmount
        });
        
        // Calculate balance for each year
        for (let year = 1; year <= Math.ceil(years); year++) {
            // Simulate compounding for each period in the year
            for (let period = 1; period <= periodsPerYear; period++) {
                balance = balance * (1 + ratePerPeriod) + contributionAmount;
            }
            
            data.push({
                x: year,
                y: balance
            });
        }
        
        // Create chart
        if (window.lengthChart instanceof Chart) {
            window.lengthChart.destroy();
        }
        
        // Use lengthChart variable instead of window.lengthChart
        if (lengthChart) {
            lengthChart.destroy();
        }
        
        lengthChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Balance',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                }, {
                    label: 'Target',
                    data: [{ x: 0, y: targetAmount }, { x: years, y: targetAmount }],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderDash: [5, 5],
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Years'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Balance ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
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
                    }
                }
            }
        });
        
        // For backward compatibility
        window.lengthChart = lengthChart;
    }

    // Calculate required return rate to reach target
    function calculateRequiredRate() {
        console.log('Required Rate calculation started');
        
        // Get input values
        const startingAmount = parseFloat(document.getElementById('rateStartingAmount').value);
        const targetAmount = parseFloat(document.getElementById('rateTargetAmount').value);
        const years = parseFloat(document.getElementById('investmentYears').value);
        const contributionAmount = parseFloat(document.getElementById('rateContributionAmount').value);
        const contributionFrequency = parseInt(document.getElementById('rateContributionFrequency').value);
        
        // Debug values
        console.log('Starting Amount:', startingAmount);
        console.log('Target Amount:', targetAmount);
        console.log('Years:', years);
        console.log('Contribution Amount:', contributionAmount);
        console.log('Contribution Frequency:', contributionFrequency);
        
        // Validate inputs
        if (isNaN(startingAmount) || isNaN(targetAmount) || isNaN(years) || isNaN(contributionAmount)) {
            alert('Please enter valid values for all fields');
            return;
        }
        
        if (startingAmount >= targetAmount) {
            document.getElementById('requiredRate').textContent = '0%';
            document.getElementById('rateResult').style.display = 'block';
            document.getElementById('rateResult').classList.add('show');
            return;
        }
        
        let requiredRate;
        
        try {
            // If there are no contributions, use the simple compound interest formula
            if (contributionAmount <= 0) {
                // Formula: r = (FV/PV)^(1/t) - 1
                // where FV = future value (target), PV = present value (starting amount), t = time periods, r = rate per period
                requiredRate = Math.pow(targetAmount / startingAmount, 1 / years) - 1;
            } else {
                // Use numerical approach for contributions (binary search)
                requiredRate = findRateNumerically(startingAmount, targetAmount, years, contributionAmount, contributionFrequency);
            }
            
            // Convert to percentage with two decimals
            const ratePercentage = (requiredRate * 100).toFixed(2) + '%';
            console.log('Calculated rate:', ratePercentage);
            
            // Display result
            document.getElementById('requiredRate').textContent = ratePercentage;
            
            // Make sure the result is visible
            const resultElement = document.getElementById('rateResult');
            resultElement.style.display = 'block';
            resultElement.classList.add('show');
        } catch (error) {
            console.error('Error calculating required rate:', error);
            alert('An error occurred during calculation. Please check your inputs and try again.');
        }
    }

    // Helper function for rate calculation using binary search
    function findRateNumerically(startingAmount, targetAmount, years, contributionAmount, contributionFrequency) {
        let minRate = -0.99; // Minimum rate (-99%)
        let maxRate = 2.0;   // Maximum rate (200%)
        let midRate;
        const tolerance = 0.0001;
        const maxIterations = 100;
        let iteration = 0;
        
        while ((maxRate - minRate) > tolerance && iteration < maxIterations) {
            midRate = (minRate + maxRate) / 2;
            const balance = calculateBalanceWithRate(startingAmount, midRate, years, contributionAmount, contributionFrequency);
            
            if (Math.abs(balance - targetAmount) < tolerance * targetAmount) {
                break; // Found a rate that's close enough
            }
            
            if (balance < targetAmount) {
                minRate = midRate; // Need a higher rate
            } else {
                maxRate = midRate; // Need a lower rate
            }
            
            iteration++;
        }
        
        return midRate;
    }

    // Helper function for rate calculation
    function calculateBalanceWithRate(startingAmount, annualRate, years, contributionAmount, contributionFrequency) {
        const periodsPerYear = contributionFrequency;
        const ratePerPeriod = annualRate / periodsPerYear;
        const periods = years * periodsPerYear;
        let balance = startingAmount;
        
        for (let i = 0; i < periods; i++) {
            balance = balance * (1 + ratePerPeriod) + contributionAmount;
        }
        
        return balance;
    }

    // Save current scenario
    function saveScenario() {
        const scenarioName = document.getElementById('scenarioName').value.trim();
        
        if (!scenarioName) {
            alert('Please enter a name for this scenario');
            return;
        }
        
        if (!currentScenarioData) {
            alert('Please calculate an investment scenario first');
            return;
        }
        
        // Create a copy of the current scenario data and add the name
        const scenarioToSave = { ...currentScenarioData, name: scenarioName };
        
        // Add to or update the scenarios object
        scenarios[scenarioName] = scenarioToSave;
        
        // Save to localStorage
        localStorage.setItem('investmentScenarios', JSON.stringify(scenarios));
        
        // Update the dropdown
        updateSavedScenariosSelect();
        
        alert(`Scenario "${scenarioName}" has been saved`);
    }

    // Load a saved scenario
    function loadScenario() {
        const selectElement = document.getElementById('savedScenarios');
        const selectedScenario = selectElement.value;
        
        if (!selectedScenario) {
            alert('Please select a scenario to load');
            return;
        }
        
        const scenarioData = scenarios[selectedScenario];
        
        if (!scenarioData) {
            alert('Could not find the selected scenario');
            return;
        }
        
        // Update UI with scenario data
        document.getElementById('startingAmount').value = scenarioData.startingAmount;
        document.getElementById('returnRate').value = scenarioData.returnRate;
        document.getElementById('years').value = scenarioData.years || 30; // Default if not present
        document.getElementById('compoundFrequency').value = scenarioData.compoundFrequency || 12; // Default if not present
        document.getElementById('contributionAmount').value = scenarioData.contributionAmount || 0; // Default if not present
        document.getElementById('contributionFrequency').value = scenarioData.contributionFrequency || 12; // Default if not present
        
        // Set contribution timing radio button
        if (scenarioData.contributionTiming) {
            document.querySelector(`input[name="contributionTiming"][value="${scenarioData.contributionTiming}"]`).checked = true;
        }
        
        document.getElementById('inflationRate').value = scenarioData.inflationRate;
        
        // Set current scenario data
        currentScenarioData = scenarioData;
        
        // Display results
        displayResults(scenarioData);
    }

    // Delete a saved scenario
    function deleteScenario() {
        const selectElement = document.getElementById('savedScenarios');
        const selectedScenario = selectElement.value;
        
        if (!selectedScenario) {
            alert('Please select a scenario to delete');
            return;
        }
        
        // Remove from scenarios object
        delete scenarios[selectedScenario];
        
        // Save updated scenarios to localStorage
        localStorage.setItem('investmentScenarios', JSON.stringify(scenarios));
        
        // Update the dropdown
        updateSavedScenariosSelect();
        
        alert(`Scenario "${selectedScenario}" has been deleted`);
    }

    // Export data to CSV
    function exportData() {
        if (!currentScenarioData || !currentScenarioData.results) {
            alert('Please calculate an investment scenario first');
            return;
        }
        
        // Create CSV header
        let csv = 'Year,Balance,Yearly Interest,Total Interest,Inflation-Adjusted\n';
        
        // Add data rows
        currentScenarioData.results.forEach(year => {
            csv += `${year.year},${year.balance},${year.yearlyInterest},${year.interest},${year.inflationAdjusted}\n`;
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'investment_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Update comparison selects
    function updateComparisonSelects() {
        const scenarioNames = Object.keys(scenarios);
        const scenario1Select = document.getElementById('scenario1');
        const scenario2Select = document.getElementById('scenario2');
        
        // Clear current options
        scenario1Select.innerHTML = '<option value="">Select Scenario 1</option>';
        scenario2Select.innerHTML = '<option value="">Select Scenario 2</option>';
        
        // Add options for each scenario
        scenarioNames.forEach(name => {
            scenario1Select.innerHTML += `<option value="${name}">${name}</option>`;
            scenario2Select.innerHTML += `<option value="${name}">${name}</option>`;
        });
    }

    // Update chart comparing two scenarios
    function updateComparisonChart() {
        const scenario1Name = document.getElementById('scenario1').value;
        const scenario2Name = document.getElementById('scenario2').value;
        
        if (!scenario1Name || !scenario2Name) {
            return;
        }
        
        // Get scenario data
        const scenario1 = scenarios[scenario1Name];
        const scenario2 = scenarios[scenario2Name];
        
        if (!scenario1 || !scenario2) {
            alert('Could not find one of the selected scenarios');
            return;
        }
        
        // TODO: Implement comparison chart
        alert('Comparison chart feature is coming soon');
    }

    // Update saved scenarios select dropdown
    function updateSavedScenariosSelect() {
        const selectElement = document.getElementById('savedScenarios');
        const scenarioNames = Object.keys(scenarios);
        
        // Clear current options
        selectElement.innerHTML = '<option value="">-- Saved Scenarios --</option>';
        
        // Add options for each scenario
        scenarioNames.forEach(name => {
            selectElement.innerHTML += `<option value="${name}">${name}</option>`;
        });
    }

    // Load saved scenarios from localStorage
    function loadSavedScenarios() {
        const savedScenarios = localStorage.getItem('investmentScenarios');
        return savedScenarios ? JSON.parse(savedScenarios) : {};
    }

    // Format currency values
    function formatCurrency(value, decimals = 0) {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    // Add updateCharts function to handle chart updates
    function updateCharts() {
        if (currentScenarioData) {
            updateGrowthChart(currentScenarioData);
        }
    }

    // Calculate dividends function
    function calculateDividends() {
        // Get input values
        const stockPrice = parseFloat(document.getElementById('stockPrice').value);
        const sharesOwned = parseInt(document.getElementById('sharesOwned').value);
        const annualDividendPerShare = parseFloat(document.getElementById('annualDividendPerShare').value);
        const dividendFrequency = parseInt(document.getElementById('dividendFrequency').value);
        const dividendGrowthRate = parseFloat(document.getElementById('dividendGrowthRate').value) / 100;
        const projectionYears = parseInt(document.getElementById('projectionYears').value);
        
        // Validate inputs
        if (isNaN(stockPrice) || isNaN(sharesOwned) || isNaN(annualDividendPerShare) || 
            isNaN(dividendGrowthRate) || isNaN(projectionYears)) {
            alert('Please enter valid values for all fields');
            return;
        }
        
        // Calculate dividend metrics
        const totalInvestmentValue = stockPrice * sharesOwned;
        const annualDividendIncome = annualDividendPerShare * sharesOwned;
        const monthlyDividendIncome = annualDividendIncome / 12;
        const currentYieldPercentage = (annualDividendPerShare / stockPrice) * 100;
        
        // Calculate dividend projection for each year
        const projectionData = [];
        let yearlyDividend = annualDividendIncome;
        
        for (let year = 0; year <= projectionYears; year++) {
            projectionData.push({
                year: year,
                dividendIncome: yearlyDividend,
                dividendPerShare: yearlyDividend / sharesOwned,
                cumulativeDividends: year === 0 ? 0 : 
                    projectionData.reduce((sum, data, index) => 
                        index > 0 && index <= year ? sum + data.dividendIncome : sum, 0)
            });
            
            // Increase dividend for next year based on growth rate
            yearlyDividend = yearlyDividend * (1 + dividendGrowthRate);
        }
        
        // Update UI with results
        document.getElementById('currentYield').textContent = currentYieldPercentage.toFixed(2) + '%';
        document.getElementById('annualDividendIncome').textContent = formatCurrency(annualDividendIncome);
        document.getElementById('monthlyDividendIncome').textContent = formatCurrency(monthlyDividendIncome);
        document.getElementById('totalInvestmentValue').textContent = formatCurrency(totalInvestmentValue);
        
        // Show result section with animation
        const resultElement = document.getElementById('dividendResult');
        resultElement.style.display = 'block';
        resultElement.classList.add('show');
        
        // Generate dividend growth chart
        updateDividendChart(projectionData);
    }
    
    // Update dividend growth chart
    function updateDividendChart(projectionData) {
        const ctx = document.getElementById('dividendGrowthChart').getContext('2d');
        
        // Destroy previous chart instance if it exists
        if (dividendGrowthChart) {
            dividendGrowthChart.destroy();
        }
        
        // Prepare data for chart
        const years = projectionData.map(item => item.year);
        const annualDividends = projectionData.map(item => item.dividendIncome);
        const cumulativeDividends = projectionData.map(item => item.cumulativeDividends);
        
        // Create chart
        dividendGrowthChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    type: 'line',
                    label: 'Cumulative Dividends',
                    data: cumulativeDividends,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1'
                }, {
                    type: 'bar',
                    label: 'Annual Dividend Income',
                    data: annualDividends,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Annual Dividend ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, 0);
                            }
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Cumulative Dividends ($)'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, 0);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatCurrency(context.raw);
                                return label;
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

    // Calculate investment on page load with default values
    calculateInvestment();
    updateSavedScenariosSelect();
});
