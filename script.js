document.addEventListener('DOMContentLoaded', function() {
    // Add to the top of your existing script.js file

    // Top-level tab switching functionality
    const mainTabButtons = document.querySelectorAll('.main-tab-button');
    const mainTabContents = document.querySelectorAll('.main-tab-content');
    
    mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mainTabId = button.getAttribute('data-main-tab');
            
            // Deactivate all main tabs
            mainTabButtons.forEach(btn => btn.classList.remove('active'));
            mainTabContents.forEach(content => content.classList.remove('active'));
            
            // Activate the selected main tab
            button.classList.add('active');
            document.getElementById(mainTabId).classList.add('active');
        });
    });

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
            
            // Update active state
            presetTipButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
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

    // Rest of your existing code continues below...
    // Initialize variables to store chart instances
    let growthChart = null;
    let compareChart = null;
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
    const chartTypeSelect = document.getElementById('chartType');
    const showContributionsCheckbox = document.getElementById('showContributions');
    const showInterestCheckbox = document.getElementById('showInterest');
    const showInflationAdjustedCheckbox = document.getElementById('showInflationAdjusted');
    
    // Initialize view buttons and contents for the bottom section
    const viewButtons = [tableViewBtn, compareBtn, exportBtn];
    const viewContents = [
        document.getElementById('tableView'),
        document.getElementById('compareView')
    ];
    
    // Set up event listeners
    calculateBtn.addEventListener('click', calculateInvestment);
    saveScenarioBtn.addEventListener('click', saveScenario);
    loadScenarioBtn.addEventListener('click', loadScenario);
    deleteScenarioBtn.addEventListener('click', deleteScenario);
    chartTypeSelect.addEventListener('change', updateCharts);
    showContributionsCheckbox.addEventListener('change', updateCharts);
    showInterestCheckbox.addEventListener('change', updateCharts);
    showInflationAdjustedCheckbox.addEventListener('change', updateCharts);
    
    // Set up view tab switching
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

    // Initialize the original calculate button functionality
    // (This should already exist in your code)
    
    // Investment Length Calculator
    document.getElementById('calculateLength').addEventListener('click', calculateInvestmentLength);
    
    // Return Rate Calculator
    document.getElementById('calculateRate').addEventListener('click', calculateRequiredRate);

    // Random Generator Tab Switching
    const randomTabButtons = document.querySelectorAll('.random-tab-button');
    const randomTabContents = document.querySelectorAll('.random-tab-content');
    
    randomTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-random-tab');
            
            // Deactivate all random tabs
            randomTabButtons.forEach(btn => btn.classList.remove('active'));
            randomTabContents.forEach(content => content.classList.remove('active'));
            
            // Activate the selected random tab
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Random Generator Functionality
    initializeRandomGenerators();

    // Main calculation function
    function calculateInvestment() {
        // Get input values
        const startingAmount = parseFloat(document.getElementById('startingAmount').value);
        const returnRate = parseFloat(document.getElementById('returnRate').value) / 100;
        const compoundFrequency = parseInt(document.getElementById('compoundFrequency').value);
        const contributionAmount = parseFloat(document.getElementById('contributionAmount').value);
        const contributionTiming = document.getElementById('contributionTiming').value;
        const contributionFrequency = parseInt(document.getElementById('contributionFrequency').value);
        const years = parseInt(document.getElementById('years').value);
        const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;

        // Validate inputs
        if (isNaN(startingAmount) || isNaN(returnRate) || isNaN(contributionAmount) || isNaN(years)) {
            alert('Please enter valid numbers for all fields.');
            return;
        }

        // Calculate results
        let balance = startingAmount;
        let totalContributions = startingAmount;
        let totalInterest = 0;
        const results = [];

        const periodsPerYear = Math.max(compoundFrequency, contributionFrequency);
        const ratePerPeriod = returnRate / periodsPerYear;
        const contributionsPerPeriod = contributionFrequency / periodsPerYear;

        for (let year = 1; year <= years; year++) {
            let yearStartBalance = balance;
            let yearContributions = 0;
            let yearInterest = 0;

            for (let period = 1; period <= periodsPerYear; period++) {
                // Add contribution at the beginning of period if selected
                if (contributionTiming === 'beginning' && period % contributionsPerPeriod === 0) {
                    balance += contributionAmount;
                    yearContributions += contributionAmount;
                    totalContributions += contributionAmount;
                }

                // Calculate interest for this period
                const periodInterest = balance * ratePerPeriod;
                balance += periodInterest;
                yearInterest += periodInterest;
                totalInterest += periodInterest;

                // Add contribution at the end of period if selected
                if (contributionTiming === 'end' && period % contributionsPerPeriod === 0) {
                    balance += contributionAmount;
                    yearContributions += contributionAmount;
                    totalContributions += contributionAmount;
                }
            }

            // Calculate inflation-adjusted value
            const inflationAdjustedValue = balance / Math.pow(1 + inflationRate, year);

            results.push({
                year: year,
                startBalance: yearStartBalance,
                contributions: yearContributions,
                interest: yearInterest,
                endBalance: balance,
                inflationAdjusted: inflationAdjustedValue
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
            totalInterest,
            finalBalance: balance,
            inflationAdjustedFinal: results[results.length - 1].inflationAdjusted
        };

        // Display results
        displayResults(currentScenarioData);
    }

    function displayResults(data) {
        // Update summary
        document.getElementById('finalBalance').textContent = formatCurrency(data.finalBalance);
        document.getElementById('totalContributions').textContent = formatCurrency(data.totalContributions);
        document.getElementById('totalInterest').textContent = formatCurrency(data.totalInterest);
        document.getElementById('inflationAdjusted').textContent = formatCurrency(data.inflationAdjustedFinal);

        // Update table
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        data.results.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${result.year}</td>
                <td>${formatCurrency(result.startBalance)}</td>
                <td>${formatCurrency(result.contributions)}</td>
                <td>${formatCurrency(result.interest)}</td>
                <td>${formatCurrency(result.endBalance)}</td>
                <td>${formatCurrency(result.inflationAdjusted)}</td>
            `;
            tableBody.appendChild(row);
        });

        // Update charts
        updateGrowthChart(data);
    }

    function updateGrowthChart(data) {
        const chartType = document.getElementById('chartType').value;
        const showContributions = document.getElementById('showContributions').checked;
        const showInterest = document.getElementById('showInterest').checked;
        const showInflationAdjusted = document.getElementById('showInflationAdjusted').checked;
        const ctx = document.getElementById('growthChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (growthChart) {
            growthChart.destroy();
        }
        
        // Prepare data for the chart
        const labels = data.results.map(result => `Year ${result.year}`);
        const endBalances = data.results.map(result => result.endBalance);
        const contributionsData = data.results.map((result, index) => {
            if (index === 0) {
                return data.startingAmount + result.contributions;
            } else {
                return data.results[index - 1].endBalance - data.results[index - 1].interest + result.contributions;
            }
        });
        const interestData = data.results.map((result, index) => result.interest);
        const inflationAdjustedData = data.results.map(result => result.inflationAdjusted);
        
        // Configure chart based on chart type
        if (chartType === 'pie') {
            // Pie chart showing final balance composition
            const lastResult = data.results[data.results.length - 1];
            const totalContributions = data.totalContributions;
            const totalInterest = data.totalInterest;
            
            growthChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Contributions', 'Interest'],
                    datasets: [{
                        data: [totalContributions, totalInterest],
                        backgroundColor: ['#3498db', '#2ecc71']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Investment Composition',
                            font: { size: 16 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const percentage = Math.round(value / data.finalBalance * 100);
                                    return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            // Line or bar chart showing year-by-year growth
            const datasets = [];
            
            // Total balance dataset
            datasets.push({
                label: 'Balance',
                data: endBalances,
                borderColor: '#3498db',
                backgroundColor: chartType === 'bar' ? 'rgba(52, 152, 219, 0.5)' : 'transparent',
                borderWidth: 2,
                tension: 0.4
            });
            
            // Inflation-adjusted dataset
            if (showInflationAdjusted) {
                datasets.push({
                    label: 'Inflation-Adjusted',
                    data: inflationAdjustedData,
                    borderColor: '#9b59b6',
                    backgroundColor: chartType === 'bar' ? 'rgba(155, 89, 182, 0.5)' : 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4
                });
            }
            
            // Contributions dataset
            if (showContributions) {
                datasets.push({
                    label: 'Contributions',
                    data: contributionsData,
                    borderColor: '#2ecc71',
                    backgroundColor: chartType === 'bar' ? 'rgba(46, 204, 113, 0.5)' : 'transparent',
                    borderWidth: 2,
                    tension: 0.4
                });
            }
            
            growthChart = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Investment Growth Over Time',
                            font: { size: 16 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    function updateCharts() {
        if (currentScenarioData) {
            updateGrowthChart(currentScenarioData);
        }
    }
    
    function saveScenario() {
        if (!currentScenarioData) return;
        
        const scenarioName = document.getElementById('scenarioName').value.trim();
        if (!scenarioName) {
            alert('Please enter a name for your scenario.');
            return;
        }
        
        // Store scenario data
        scenarios[scenarioName] = { ...currentScenarioData };
        
        // Save to localStorage
        localStorage.setItem('investmentScenarios', JSON.stringify(scenarios));
        
        // Update UI
        updateSavedScenariosSelect();
        document.getElementById('scenarioName').value = '';
        
        alert(`Scenario "${scenarioName}" has been saved.`);
    }
    
    function loadScenario() {
        const select = document.getElementById('savedScenarios');
        const scenarioName = select.value;
        
        if (!scenarioName || !scenarios[scenarioName]) return;
        
        const scenario = scenarios[scenarioName];
        
        // Load scenario data into form inputs
        document.getElementById('startingAmount').value = scenario.startingAmount;
        document.getElementById('returnRate').value = scenario.returnRate;
        document.getElementById('compoundFrequency').value = scenario.compoundFrequency;
        document.getElementById('contributionAmount').value = scenario.contributionAmount;
        document.getElementById('contributionTiming').value = scenario.contributionTiming;
        document.getElementById('contributionFrequency').value = scenario.contributionFrequency;
        document.getElementById('years').value = scenario.years;
        document.getElementById('inflationRate').value = scenario.inflationRate;
        
        // Calculate and display results
        calculateInvestment();
    }
    
    function deleteScenario() {
        const select = document.getElementById('savedScenarios');
        const scenarioName = select.value;
        
        if (!scenarioName || !scenarios[scenarioName]) return;
        
        if (confirm(`Are you sure you want to delete the scenario "${scenarioName}"?`)) {
            delete scenarios[scenarioName];
            localStorage.setItem('investmentScenarios', JSON.stringify(scenarios));
            updateSavedScenariosSelect();
        }
    }
    
    function loadSavedScenarios() {
        const savedScenarios = localStorage.getItem('investmentScenarios');
        return savedScenarios ? JSON.parse(savedScenarios) : {};
    }
    
    function updateSavedScenariosSelect() {
        const select = document.getElementById('savedScenarios');
        const scenario1 = document.getElementById('scenario1');
        const scenario2 = document.getElementById('scenario2');
        
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.options.remove(1);
        }
        
        // Clear comparison selects
        while (scenario1.options.length > 1) {
            scenario1.options.remove(1);
        }
        
        while (scenario2.options.length > 1) {
            scenario2.options.remove(1);
        }
        
        // Add saved scenarios
        Object.keys(scenarios).forEach(name => {
            const option = new Option(name, name);
            select.add(option);
            
            scenario1.add(new Option(name, name));
            scenario2.add(new Option(name, name));
        });
    }
    
    function updateComparisonSelects() {
        updateSavedScenariosSelect();
        if (Object.keys(scenarios).length > 0) {
            // Enable comparison if we have saved scenarios
            document.getElementById('scenario2').disabled = false;
        } else {
            document.getElementById('scenario2').disabled = true;
        }
    }
    
    function updateComparisonChart() {
        const scenario1Id = document.getElementById('scenario1').value;
        const scenario2Id = document.getElementById('scenario2').value;
        
        // Return if we don't have two scenarios to compare
        if (!scenario1Id || !scenario2Id || scenario1Id === scenario2Id) {
            if (compareChart) {
                compareChart.destroy();
                compareChart = null;
            }
            document.getElementById('compareSummary').innerHTML = '<p>Please select two different scenarios to compare.</p>';
            return;
        }
        
        // Get scenario data
        let scenario1;
        let scenario2;
        
        if (scenario1Id === 'current') {
            scenario1 = currentScenarioData;
            if (!scenario1) {
                return;
            }
        } else {
            scenario1 = scenarios[scenario1Id];
        }
        
        scenario2 = scenarios[scenario2Id];
        
        // Create comparison chart
        const ctx = document.getElementById('compareChart').getContext('2d');
        
        if (compareChart) {
            compareChart.destroy();
        }
        
        // Determine the maximum number of years to show
        const maxYears = Math.max(scenario1.years, scenario2.years);
        const labels = Array.from({ length: maxYears }, (_, i) => `Year ${i + 1}`);
        
        // Prepare data for chart
        const scenario1Data = scenario1.results.map(r => r.endBalance);
        const scenario2Data = scenario2.results.map(r => r.endBalance);
        
        // Fill in remaining years with null if one scenario has fewer years
        if (scenario1.years < maxYears) {
            for (let i = scenario1.years; i < maxYears; i++) {
                scenario1Data.push(null);
            }
        }
        
        if (scenario2.years < maxYears) {
            for (let i = scenario2.years; i < maxYears; i++) {
                scenario2Data.push(null);
            }
        }
        
        compareChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: scenario1Id === 'current' ? 'Current Scenario' : scenario1Id,
                        data: scenario1Data,
                        borderColor: '#3498db',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4
                    },
                    {
                        label: scenario2Id,
                        data: scenario2Data,
                        borderColor: '#e74c3c',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Scenario Comparison',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
        
        // Create comparison summary
        const summary = document.getElementById('compareSummary');
        
        // Calculate differences at common ending point
        const commonYears = Math.min(scenario1.years, scenario2.years);
        const scenario1Final = scenario1.results[commonYears - 1].endBalance;
        const scenario2Final = scenario2.results[commonYears - 1].endBalance;
        const difference = scenario2Final - scenario1Final;
        const percentDifference = (difference / scenario1Final) * 100;
        
        // Create HTML for comparison
        let html = `
            <h4>Comparison after ${commonYears} ${commonYears === 1 ? 'year' : 'years'}</h4>
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>${scenario1Id === 'current' ? 'Current Scenario' : scenario1Id}</th>
                        <th>${scenario2Id}</th>
                        <th>Difference</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Final Balance</td>
                        <td>${formatCurrency(scenario1Final)}</td>
                        <td>${formatCurrency(scenario2Final)}</td>
                        <td>${formatCurrency(difference)} (${percentDifference.toFixed(2)}%)</td>
                    </tr>
                    <tr>
                        <td>Total Contributions</td>
                        <td>${formatCurrency(getTotalContributionsByYear(scenario1, commonYears))}</td>
                        <td>${formatCurrency(getTotalContributionsByYear(scenario2, commonYears))}</td>
                        <td>${formatCurrency(getTotalContributionsByYear(scenario2, commonYears) - getTotalContributionsByYear(scenario1, commonYears))}</td>
                    </tr>
                    <tr>
                        <td>Total Interest</td>
                        <td>${formatCurrency(getTotalInterestByYear(scenario1, commonYears))}</td>
                        <td>${formatCurrency(getTotalInterestByYear(scenario2, commonYears))}</td>
                        <td>${formatCurrency(getTotalInterestByYear(scenario2, commonYears) - getTotalInterestByYear(scenario1, commonYears))}</td>
                    </tr>
                </tbody>
            </table>
            
            <h4>Parameters Comparison</h4>
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>${scenario1Id === 'current' ? 'Current Scenario' : scenario1Id}</th>
                        <th>${scenario2Id}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Starting Amount</td>
                        <td>${formatCurrency(scenario1.startingAmount)}</td>
                        <td>${formatCurrency(scenario2.startingAmount)}</td>
                    </tr>
                    <tr>
                        <td>Return Rate</td>
                        <td>${scenario1.returnRate}%</td>
                        <td>${scenario2.returnRate}%</td>
                    </tr>
                    <tr>
                        <td>Compound Frequency</td>
                        <td>${getFrequencyText(scenario1.compoundFrequency)}</td>
                        <td>${getFrequencyText(scenario2.compoundFrequency)}</td>
                    </tr>
                    <tr>
                        <td>Contribution Amount</td>
                        <td>${formatCurrency(scenario1.contributionAmount)}</td>
                        <td>${formatCurrency(scenario2.contributionAmount)}</td>
                    </tr>
                    <tr>
                        <td>Contribution Timing</td>
                        <td>${scenario1.contributionTiming === 'beginning' ? 'Beginning of Period' : 'End of Period'}</td>
                        <td>${scenario2.contributionTiming === 'beginning' ? 'Beginning of Period' : 'End of Period'}</td>
                    </tr>
                    <tr>
                        <td>Contribution Frequency</td>
                        <td>${getFrequencyText(scenario1.contributionFrequency)}</td>
                        <td>${getFrequencyText(scenario2.contributionFrequency)}</td>
                    </tr>
                    <tr>
                        <td>Inflation Rate</td>
                        <td>${scenario1.inflationRate}%</td>
                        <td>${scenario2.inflationRate}%</td>
                    </tr>
                </tbody>
            </table>
        `;
        
        summary.innerHTML = html;
    }
    
    function getTotalContributionsByYear(scenario, year) {
        let total = scenario.startingAmount;
        for (let i = 0; i < year; i++) {
            total += scenario.results[i].contributions;
        }
        return total;
    }
    
    function getTotalInterestByYear(scenario, year) {
        let total = 0;
        for (let i = 0; i < year; i++) {
            total += scenario.results[i].interest;
        }
        return total;
    }
    
    function getFrequencyText(frequency) {
        switch (parseInt(frequency)) {
            case 1: return 'Annually';
            case 4: return 'Quarterly';
            case 12: return 'Monthly';
            case 365: return 'Daily';
            default: return frequency.toString();
        }
    }
    
    function exportData() {
        if (!currentScenarioData) return;
        
        // Create CSV content
        const csvContent = [
            'Year,Starting Balance,Contributions,Interest,Ending Balance,Inflation-Adjusted',
            ...currentScenarioData.results.map(result => 
                `${result.year},${result.startBalance},${result.contributions},${result.interest},${result.endBalance},${result.inflationAdjusted}`
            )
        ].join('\n');
        
        // Create a CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'investment_data.csv');
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
});

// Calculate how long it will take to reach target amount
function calculateInvestmentLength() {
    // Get input values
    const targetAmount = parseFloat(document.getElementById('length_target').value);
    const startingAmount = parseFloat(document.getElementById('length_startingAmount').value);
    const returnRate = parseFloat(document.getElementById('length_returnRate').value) / 100;
    const compoundFrequency = parseInt(document.getElementById('length_compoundFrequency').value);
    const contributionAmount = parseFloat(document.getElementById('length_contributionAmount').value);
    const contributionTiming = document.getElementById('length_contributionTiming').value;
    const contributionFrequency = parseInt(document.getElementById('length_contributionFrequency').value);
    const inflationRate = parseFloat(document.getElementById('length_inflationRate').value) / 100;

    // Variables for calculation
    let balance = startingAmount;
    let years = 0;
    const maxYears = 100; // Prevent infinite loops
    const periodsPerYear = compoundFrequency;
    const contributionsPerYear = contributionFrequency;
    const periodicRate = returnRate / periodsPerYear;
    const contributionPerPeriod = contributionAmount * (periodsPerYear / contributionsPerYear);

    // Calculate time to reach target
    while (balance < targetAmount && years < maxYears) {
        years += 1/periodsPerYear;
        
        // Add contribution at beginning of period if specified
        if (contributionTiming === 'beginning') {
            // Only add contribution on the appropriate periods
            if (Math.round(years * periodsPerYear) % (periodsPerYear / contributionsPerYear) === 0) {
                balance += contributionPerPeriod;
            }
        }
        
        // Compound interest
        balance *= (1 + periodicRate);
        
        // Add contribution at end of period if specified
        if (contributionTiming === 'end') {
            // Only add contribution on the appropriate periods
            if (Math.round(years * periodsPerYear) % (periodsPerYear / contributionsPerYear) === 0) {
                balance += contributionPerPeriod;
            }
        }
    }

    // Create or update result display
    let resultDisplay = document.querySelector('#lengthCalculator .result-display');
    if (!resultDisplay) {
        resultDisplay = document.createElement('div');
        resultDisplay.className = 'result-display';
        document.getElementById('lengthCalculator').appendChild(resultDisplay);
    }

    // Display results
    if (years >= maxYears) {
        resultDisplay.innerHTML = `
            <h3>Target not reached within ${maxYears} years</h3>
            <p>You may need to increase your contribution amount or return rate.</p>
        `;
    } else {
        const yearText = years === 1 ? 'year' : 'years';
        const monthsDecimal = (years % 1) * 12;
        const months = Math.floor(monthsDecimal);
        
        resultDisplay.innerHTML = `
            <h3>Time to Reach Target</h3>
            <div class="result-value">
                ${Math.floor(years)} ${yearText} ${months > 0 ? `and ${months} months` : ''}
            </div>
            <p>Your investment will grow from $${startingAmount.toLocaleString()} to $${targetAmount.toLocaleString()}</p>
            <p>With ${contributionFrequency === 12 ? 'monthly' : 'yearly'} contributions of $${contributionAmount.toLocaleString()}</p>
        `;
    }

    // Update chart with projection data if needed
    updateChartWithLengthData(years, targetAmount, startingAmount, contributionAmount, contributionFrequency);
}

// Calculate required return rate to reach target
function calculateRequiredRate() {
    // Get input values
    const targetAmount = parseFloat(document.getElementById('rate_target').value);
    const startingAmount = parseFloat(document.getElementById('rate_startingAmount').value);
    const years = parseFloat(document.getElementById('rate_years').value);
    const compoundFrequency = parseInt(document.getElementById('rate_compoundFrequency').value);
    const contributionAmount = parseFloat(document.getElementById('rate_contributionAmount').value);
    const contributionTiming = document.getElementById('rate_contributionTiming').value;
    const contributionFrequency = parseInt(document.getElementById('rate_contributionFrequency').value);
    
    // Binary search to find the rate
    let lowerRate = -0.99; // -99% (avoid -100% as it breaks calculations)
    let upperRate = 10; // 1000%
    let requiredRate;
    let iterations = 0;
    const maxIterations = 50;
    
    while (iterations < maxIterations) {
        requiredRate = (lowerRate + upperRate) / 2;
        
        // Calculate final balance with this rate
        const finalBalance = calculateBalanceWithRate(
            startingAmount, 
            requiredRate, 
            years, 
            compoundFrequency,
            contributionAmount,
            contributionTiming,
            contributionFrequency
        );
        
        if (Math.abs(finalBalance - targetAmount) < 1) {
            // Close enough, stop iterations
            break;
        }
        
        if (finalBalance < targetAmount) {
            lowerRate = requiredRate;
        } else {
            upperRate = requiredRate;
        }
        
        iterations++;
    }
    
    // Create or update result display
    let resultDisplay = document.querySelector('#rateCalculator .result-display');
    if (!resultDisplay) {
        resultDisplay = document.createElement('div');
        resultDisplay.className = 'result-display';
        document.getElementById('rateCalculator').appendChild(resultDisplay);
    }
    
    // Display results
    if (iterations >= maxIterations) {
        resultDisplay.innerHTML = `
            <h3>Could not calculate required rate</h3>
            <p>Try adjusting your parameters. Target may be too high or too low.</p>
        `;
    } else {
        const ratePercentage = (requiredRate * 100).toFixed(2);
        
        resultDisplay.innerHTML = `
            <h3>Required Annual Return Rate</h3>
            <div class="result-value">${ratePercentage}%</div>
            <p>To grow $${startingAmount.toLocaleString()} to $${targetAmount.toLocaleString()} in ${years} years</p>
            <p>With ${contributionFrequency === 12 ? 'monthly' : 'yearly'} contributions of $${contributionAmount.toLocaleString()}</p>
        `;
    }
}

// Helper function for rate calculation
function calculateBalanceWithRate(startingAmount, rate, years, compoundFrequency, contributionAmount, contributionTiming, contributionFrequency) {
    let balance = startingAmount;
    const periodsTotal = years * compoundFrequency;
    const periodicRate = rate / compoundFrequency;
    const contributionPerPeriod = contributionAmount * (compoundFrequency / contributionFrequency);
    
    for (let i = 0; i < periodsTotal; i++) {
        // Add contribution at beginning if specified
        if (contributionTiming === 'beginning' && i % (compoundFrequency / contributionFrequency) === 0) {
            balance += contributionPerPeriod;
        }
        
        // Compound interest
        balance *= (1 + periodicRate);
        
        // Add contribution at end if specified
        if (contributionTiming === 'end' && i % (compoundFrequency / contributionFrequency) === 0) {
            balance += contributionPerPeriod;
        }
    }
    
    return balance;
}

// Function to update chart with investment length projection data
function updateChartWithLengthData(years, targetAmount, startingAmount, contributionAmount, contributionFrequency) {
    // Add chart update logic if desired
    // This would show how the investment grows over the calculated time period
}

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
        
        // Start animation
        coin.style.animation = 'none';
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        requestAnimationFrame(() => {
            // Update coin visual
            coin.className = 'coin';
            void coin.offsetWidth; // Trigger reflow to restart animation
            coin.classList.add('flip-' + result);
            
            // Update result display immediately
            coinResult.textContent = result.charAt(0).toUpperCase() + result.slice(1);
            
            // Update stats
            flips++;
            if (result === 'heads') heads++;
            else tails++;
            
            updateCoinStats();
            
            // Allow new full animation after current one completes
            setTimeout(() => {
                coinFlipping = false;
            }, 550); // Reduced from 1000ms to 550ms for quicker response
        });
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
        }, 400); // Reduced from 600ms to 400ms
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
}

// Your existing functions for investment calculator continue here...
// function formatCurrency(value) { ... }
// function calculateInvestmentLength() { ... }
// etc...
