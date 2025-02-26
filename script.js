document.addEventListener('DOMContentLoaded', function() {
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
