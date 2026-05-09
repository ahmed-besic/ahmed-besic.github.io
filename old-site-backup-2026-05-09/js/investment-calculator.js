document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'investmentScenarios';
    const MAX_LENGTH_YEARS = 100;
    const MAX_RATE_SEARCH = 10;

    const elements = {
        tabButtons: document.querySelectorAll('.tab-button'),
        tabContents: document.querySelectorAll('.tab-content'),
        calculate: document.getElementById('calculate'),
        calculateLength: document.getElementById('calculateLength'),
        calculateRate: document.getElementById('calculateRate'),
        saveScenario: document.getElementById('saveScenario'),
        loadScenario: document.getElementById('loadScenario'),
        deleteScenario: document.getElementById('deleteScenario'),
        scenarioName: document.getElementById('scenarioName'),
        savedScenarios: document.getElementById('savedScenarios'),
        chartType: document.getElementById('chartType'),
        showContributions: document.getElementById('showContributions'),
        showInterest: document.getElementById('showInterest'),
        showInflationAdjusted: document.getElementById('showInflationAdjusted'),
        tableViewBtn: document.getElementById('tableViewBtn'),
        compareBtn: document.getElementById('compareBtn'),
        exportBtn: document.getElementById('exportBtn'),
        tableView: document.getElementById('tableView'),
        compareView: document.getElementById('compareView'),
        compareSummary: document.getElementById('compareSummary'),
        scenario1: document.getElementById('scenario1'),
        scenario2: document.getElementById('scenario2'),
        growthCanvas: document.getElementById('growthChart'),
        compareCanvas: document.getElementById('compareChart'),
        lengthCanvas: document.getElementById('lengthChart'),
        finalBalance: document.getElementById('finalBalance'),
        totalContributions: document.getElementById('totalContributions'),
        totalInterest: document.getElementById('totalInterest'),
        inflationAdjusted: document.getElementById('inflationAdjusted'),
        lengthResult: document.getElementById('lengthResult'),
        lengthSummary: document.getElementById('lengthSummary'),
        rateResult: document.getElementById('rateResult'),
        rateSummary: document.getElementById('rateSummary')
    };

    const state = {
        growthChart: null,
        compareChart: null,
        lengthChart: null,
        currentScenario: null,
        scenarios: loadSavedScenarios()
    };

    bindEvents();
    activateTab('growthCalculator');
    showView('table');
    refreshSavedScenarioOptions();
    refreshComparisonOptions();
    calculateInvestment();

    function bindEvents() {
        elements.tabButtons.forEach((button) => {
            button.addEventListener('click', () => activateTab(button.dataset.tab));
        });

        elements.calculate.addEventListener('click', calculateInvestment);
        elements.calculateLength.addEventListener('click', calculateInvestmentLength);
        elements.calculateRate.addEventListener('click', calculateRequiredRate);
        elements.saveScenario.addEventListener('click', saveScenario);
        elements.loadScenario.addEventListener('click', loadScenario);
        elements.deleteScenario.addEventListener('click', deleteScenario);

        elements.chartType.addEventListener('change', updateGrowthChart);
        elements.showContributions.addEventListener('change', updateGrowthChart);
        elements.showInterest.addEventListener('change', updateGrowthChart);
        elements.showInflationAdjusted.addEventListener('change', updateGrowthChart);

        elements.tableViewBtn.addEventListener('click', () => showView('table'));
        elements.compareBtn.addEventListener('click', () => showView('compare'));
        elements.exportBtn.addEventListener('click', exportData);

        elements.scenario1.addEventListener('change', updateComparisonChart);
        elements.scenario2.addEventListener('change', updateComparisonChart);
    }

    function activateTab(tabId) {
        elements.tabButtons.forEach((button) => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });

        elements.tabContents.forEach((content) => {
            content.classList.toggle('active', content.id === tabId);
        });
    }

    function showView(viewName) {
        const showingTable = viewName === 'table';
        elements.tableViewBtn.classList.toggle('active', showingTable);
        elements.compareBtn.classList.toggle('active', !showingTable);
        elements.exportBtn.classList.remove('active');

        elements.tableView.classList.toggle('active', showingTable);
        elements.tableView.classList.toggle('hidden', !showingTable);
        elements.compareView.classList.toggle('active', !showingTable);
        elements.compareView.classList.toggle('hidden', showingTable);

        if (!showingTable) {
            refreshComparisonOptions();
            updateComparisonChart();
        }
    }

    function calculateInvestment() {
        const inputs = readGrowthInputs();
        if (!inputs) {
            return;
        }

        state.currentScenario = buildGrowthScenario(inputs);
        renderGrowthScenario(state.currentScenario);
    }

    function readGrowthInputs() {
        const inputs = {
            startingAmount: readNumber('startingAmount'),
            returnRate: readNumber('returnRate'),
            years: readInteger('years'),
            compoundFrequency: readInteger('compoundFrequency'),
            contributionAmount: readNumber('contributionAmount'),
            contributionFrequency: readInteger('contributionFrequency'),
            contributionTiming: document.querySelector('input[name="contributionTiming"]:checked')?.value || 'end',
            inflationRate: readNumber('inflationRate')
        };

        if (
            inputs.startingAmount < 0 ||
            inputs.returnRate < 0 ||
            inputs.years <= 0 ||
            inputs.compoundFrequency <= 0 ||
            inputs.contributionAmount < 0 ||
            inputs.contributionFrequency <= 0 ||
            inputs.inflationRate < 0
        ) {
            alert('Please enter valid non-negative values for all fields.');
            return null;
        }

        return inputs;
    }

    function buildGrowthScenario(inputs) {
        const years = Math.min(inputs.years, 100);
        const compoundingPerYear = inputs.compoundFrequency;
        const contributionPerYear = inputs.contributionFrequency;
        const subPeriods = lcm(compoundingPerYear, contributionPerYear);
        const subPeriodRate = Math.pow(1 + (inputs.returnRate / 100) / compoundingPerYear, compoundingPerYear / subPeriods) - 1;
        const contributionEvery = subPeriods / contributionPerYear;
        const contributionPerEvent = inputs.contributionAmount;

        let balance = inputs.startingAmount;
        let totalContributions = inputs.startingAmount;
        let totalInterest = 0;
        const results = [];

        for (let year = 1; year <= years; year += 1) {
            let yearlyContributions = 0;
            let yearlyInterest = 0;

            for (let step = 1; step <= subPeriods; step += 1) {
                const isContributionStep = contributionPerEvent > 0 && step % contributionEvery === 0;

                if (isContributionStep && inputs.contributionTiming === 'start') {
                    balance += contributionPerEvent;
                    yearlyContributions += contributionPerEvent;
                    totalContributions += contributionPerEvent;
                }

                const periodInterest = balance * subPeriodRate;
                balance += periodInterest;
                yearlyInterest += periodInterest;
                totalInterest += periodInterest;

                if (isContributionStep && inputs.contributionTiming === 'end') {
                    balance += contributionPerEvent;
                    yearlyContributions += contributionPerEvent;
                    totalContributions += contributionPerEvent;
                }
            }

            const inflationAdjusted = balance / Math.pow(1 + inputs.inflationRate / 100, year);
            results.push({
                year,
                balance,
                totalContributions,
                totalInterest,
                yearlyContributions,
                yearlyInterest,
                inflationAdjusted
            });
        }

        const finalYear = results[results.length - 1];

        return {
            name: '',
            ...inputs,
            results,
            finalBalance: finalYear.balance,
            totalContributions: finalYear.totalContributions,
            totalInterest: finalYear.totalInterest,
            inflationAdjustedFinal: finalYear.inflationAdjusted
        };
    }

    function renderGrowthScenario(scenario) {
        elements.finalBalance.textContent = formatCurrency(scenario.finalBalance);
        elements.totalContributions.textContent = formatCurrency(scenario.totalContributions);
        elements.totalInterest.textContent = formatCurrency(scenario.totalInterest);
        elements.inflationAdjusted.textContent = formatCurrency(scenario.inflationAdjustedFinal);

        renderResultsTable(scenario);
        updateGrowthChart();
    }

    function renderResultsTable(scenario) {
        const rows = scenario.results.map((yearData, index) => `
            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                <td class="px-4 py-3 text-center text-sm font-medium text-gray-900">${yearData.year}</td>
                <td class="px-4 py-3 text-right text-sm text-gray-700">${formatCurrency(yearData.balance)}</td>
                <td class="px-4 py-3 text-right text-sm text-gray-700">${formatCurrency(yearData.totalContributions)}</td>
                <td class="px-4 py-3 text-right text-sm text-gray-700">${formatCurrency(yearData.yearlyInterest)}</td>
                <td class="px-4 py-3 text-right text-sm text-gray-700">${formatCurrency(yearData.totalInterest)}</td>
                <td class="px-4 py-3 text-right text-sm text-gray-700">${formatCurrency(yearData.inflationAdjusted)}</td>
            </tr>
        `).join('');

        elements.tableView.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Year</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Balance</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Contributions</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Yearly Growth</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total Growth</th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Real Value</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">${rows}</tbody>
                </table>
            </div>
        `;
    }

    function updateGrowthChart() {
        if (!state.currentScenario) {
            return;
        }

        if (state.growthChart) {
            state.growthChart.destroy();
        }

        const ctx = elements.growthCanvas.getContext('2d');
        const chartType = elements.chartType.value;
        const years = state.currentScenario.results.map((entry) => entry.year);
        const balances = state.currentScenario.results.map((entry) => roundMoney(entry.balance));
        const contributions = state.currentScenario.results.map((entry) => roundMoney(entry.totalContributions));
        const growth = state.currentScenario.results.map((entry) => roundMoney(entry.totalInterest));
        const inflationAdjusted = state.currentScenario.results.map((entry) => roundMoney(entry.inflationAdjusted));

        if (chartType === 'pie') {
            const pieParts = [];
            const gainValue = state.currentScenario.finalBalance - state.currentScenario.totalContributions;

            if (elements.showContributions.checked) {
                pieParts.push({
                    label: 'Contributions',
                    value: Math.max(state.currentScenario.totalContributions, 0),
                    color: 'rgba(59, 130, 246, 0.85)'
                });
            }

            if (elements.showInterest.checked) {
                pieParts.push({
                    label: gainValue >= 0 ? 'Growth' : 'Loss',
                    value: Math.abs(gainValue),
                    color: gainValue >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)'
                });
            }

            if (pieParts.length === 0) {
                pieParts.push({
                    label: 'Ending Balance',
                    value: Math.max(state.currentScenario.finalBalance, 0),
                    color: 'rgba(99, 102, 241, 0.85)'
                });
            }

            state.growthChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: pieParts.map((part) => part.label),
                    datasets: [{
                        data: pieParts.map((part) => part.value),
                        backgroundColor: pieParts.map((part) => part.color),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label(context) {
                                    const total = context.dataset.data.reduce((sum, value) => sum + value, 0) || 1;
                                    const percentage = ((context.raw / total) * 100).toFixed(1);
                                    return `${context.label}: ${formatCurrency(context.raw)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            return;
        }

        const sourceYears = chartType === 'bar' ? sampleLabels(years, 12) : years;
        const selectedIndexes = sourceYears.map((year) => years.indexOf(year));
        const datasets = [];

        const pick = (values) => selectedIndexes.map((index) => values[index]);

        datasets.push({
            label: 'Balance',
            data: pick(balances),
            borderColor: 'rgba(37, 99, 235, 1)',
            backgroundColor: chartType === 'bar' ? 'rgba(37, 99, 235, 0.75)' : 'rgba(37, 99, 235, 0.15)',
            borderWidth: 3,
            fill: chartType !== 'bar',
            tension: 0.25
        });

        if (elements.showContributions.checked) {
            datasets.push({
                label: 'Contributions',
                data: pick(contributions),
                borderColor: 'rgba(14, 165, 233, 1)',
                backgroundColor: chartType === 'bar' ? 'rgba(14, 165, 233, 0.75)' : 'rgba(14, 165, 233, 0.12)',
                borderWidth: 2,
                fill: false,
                tension: 0.2
            });
        }

        if (elements.showInterest.checked) {
            datasets.push({
                label: 'Growth',
                data: pick(growth),
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: chartType === 'bar' ? 'rgba(16, 185, 129, 0.75)' : 'rgba(16, 185, 129, 0.12)',
                borderWidth: 2,
                fill: false,
                tension: 0.2
            });
        }

        if (elements.showInflationAdjusted.checked) {
            datasets.push({
                label: 'Real Value',
                data: pick(inflationAdjusted),
                borderColor: 'rgba(245, 158, 11, 1)',
                backgroundColor: chartType === 'bar' ? 'rgba(245, 158, 11, 0.75)' : 'rgba(245, 158, 11, 0.12)',
                borderWidth: 2,
                fill: false,
                tension: 0.2
            });
        }

        state.growthChart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: sourceYears,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const value = chartType === 'bar' ? context.raw : context.parsed.y;
                                return `${context.dataset.label}: ${formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function calculateInvestmentLength() {
        const inputs = {
            startingAmount: readNumber('lengthStartingAmount'),
            targetAmount: readNumber('targetAmount'),
            annualRate: readNumber('lengthReturnRate') / 100,
            contributionAmount: readNumber('lengthContributionAmount'),
            frequency: readInteger('lengthContributionFrequency')
        };

        if (
            inputs.startingAmount < 0 ||
            inputs.targetAmount <= 0 ||
            inputs.contributionAmount < 0 ||
            inputs.frequency <= 0
        ) {
            alert('Please enter valid values for the time-to-target calculator.');
            return;
        }

        const projection = projectToTarget(inputs);
        showResultCard(elements.lengthResult);

        if (projection.reached) {
            const yearsText = projection.years.toFixed(1);
            elements.lengthSummary.innerHTML = `With the given parameters, it will take approximately <span id="yearsToTarget" class="text-2xl font-bold text-blue-600 px-2 bg-blue-50 rounded">${yearsText}</span> years to reach your target amount.`;
        } else {
            elements.lengthSummary.innerHTML = `With the current inputs, the target is not reached within <span class="text-2xl font-bold text-red-600 px-2 bg-red-50 rounded">${MAX_LENGTH_YEARS}+</span> years.`;
        }

        updateLengthChart(projection, inputs.targetAmount);
    }

    function projectToTarget(inputs) {
        const maxPeriods = MAX_LENGTH_YEARS * inputs.frequency;
        const periodRate = inputs.annualRate / inputs.frequency;
        let balance = inputs.startingAmount;
        const points = [{ x: 0, y: roundMoney(balance) }];

        if (balance >= inputs.targetAmount) {
            return { reached: true, years: 0, points };
        }

        for (let period = 1; period <= maxPeriods; period += 1) {
            balance = balance * (1 + periodRate) + inputs.contributionAmount;
            const yearMark = period / inputs.frequency;

            if (period % inputs.frequency === 0 || balance >= inputs.targetAmount) {
                points.push({
                    x: yearMark,
                    y: roundMoney(balance)
                });
            }

            if (balance >= inputs.targetAmount) {
                return { reached: true, years: yearMark, points };
            }
        }

        return { reached: false, years: MAX_LENGTH_YEARS, points };
    }

    function updateLengthChart(projection, targetAmount) {
        if (state.lengthChart) {
            state.lengthChart.destroy();
        }

        const ctx = elements.lengthCanvas.getContext('2d');
        const lastX = projection.points[projection.points.length - 1]?.x || MAX_LENGTH_YEARS;

        state.lengthChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Projected Balance',
                    data: projection.points,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.25
                }, {
                    label: 'Target',
                    data: [{ x: 0, y: targetAmount }, { x: lastX, y: targetAmount }],
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    borderWidth: 2
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
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function calculateRequiredRate() {
        const inputs = {
            startingAmount: readNumber('rateStartingAmount'),
            targetAmount: readNumber('rateTargetAmount'),
            years: readInteger('investmentYears'),
            contributionAmount: readNumber('rateContributionAmount'),
            frequency: readInteger('rateContributionFrequency')
        };

        if (
            inputs.startingAmount < 0 ||
            inputs.targetAmount <= 0 ||
            inputs.years <= 0 ||
            inputs.contributionAmount < 0 ||
            inputs.frequency <= 0
        ) {
            alert('Please enter valid values for the return-rate calculator.');
            return;
        }

        if (inputs.startingAmount >= inputs.targetAmount) {
            showResultCard(elements.rateResult);
            elements.rateSummary.innerHTML = 'Your starting balance already meets or exceeds the target amount, so no additional return is required.';
            return;
        }

        const requiredRate = findRequiredAnnualRate(inputs);
        showResultCard(elements.rateResult);

        if (requiredRate === null) {
            elements.rateSummary.innerHTML = `The target is not reached even with an annual return rate above <span class="text-2xl font-bold text-red-600 px-2 bg-red-50 rounded">${(MAX_RATE_SEARCH * 100).toFixed(0)}%</span>. Increase the contribution, starting balance, or time horizon.`;
            return;
        }

        const rateText = `${(requiredRate * 100).toFixed(2)}%`;
        elements.rateSummary.innerHTML = `To reach your target amount in the specified time, you need an annual return rate of <span id="requiredRate" class="text-2xl font-bold text-blue-600 px-2 bg-blue-50 rounded">${rateText}</span>.`;
    }

    function findRequiredAnnualRate(inputs) {
        const lowRate = -0.999;
        let highRate = 0.1;
        let highValue = futureValueWithRate(inputs, highRate);

        if (Math.abs(highValue - inputs.targetAmount) < 0.01) {
            return highRate;
        }

        while (highValue < inputs.targetAmount && highRate < MAX_RATE_SEARCH) {
            highRate *= 2;
            highValue = futureValueWithRate(inputs, highRate);
        }

        if (highValue < inputs.targetAmount) {
            return null;
        }

        let left = lowRate;
        let right = highRate;

        for (let iteration = 0; iteration < 100; iteration += 1) {
            const mid = (left + right) / 2;
            const value = futureValueWithRate(inputs, mid);

            if (Math.abs(value - inputs.targetAmount) < 0.01) {
                return mid;
            }

            if (value < inputs.targetAmount) {
                left = mid;
            } else {
                right = mid;
            }
        }

        return (left + right) / 2;
    }

    function futureValueWithRate(inputs, annualRate) {
        const periods = inputs.years * inputs.frequency;
        const periodRate = annualRate / inputs.frequency;
        let balance = inputs.startingAmount;

        for (let period = 0; period < periods; period += 1) {
            balance = balance * (1 + periodRate) + inputs.contributionAmount;
        }

        return balance;
    }

    function saveScenario() {
        const scenarioName = elements.scenarioName.value.trim();

        if (!scenarioName) {
            alert('Enter a scenario name before saving.');
            return;
        }

        if (!state.currentScenario) {
            alert('Calculate a scenario first.');
            return;
        }

        state.scenarios[scenarioName] = {
            ...state.currentScenario,
            name: scenarioName
        };

        persistScenarios();
        refreshSavedScenarioOptions();
        refreshComparisonOptions();
        elements.savedScenarios.value = scenarioName;
    }

    function loadScenario() {
        const scenarioName = elements.savedScenarios.value;
        const scenario = state.scenarios[scenarioName];

        if (!scenario) {
            alert('Select a saved scenario to load.');
            return;
        }

        document.getElementById('startingAmount').value = scenario.startingAmount;
        document.getElementById('returnRate').value = scenario.returnRate;
        document.getElementById('years').value = scenario.years;
        document.getElementById('compoundFrequency').value = scenario.compoundFrequency;
        document.getElementById('contributionAmount').value = scenario.contributionAmount;
        document.getElementById('contributionFrequency').value = scenario.contributionFrequency;
        document.querySelector(`input[name="contributionTiming"][value="${scenario.contributionTiming}"]`).checked = true;
        document.getElementById('inflationRate').value = scenario.inflationRate;
        elements.scenarioName.value = scenarioName;

        activateTab('growthCalculator');
        showView('table');
        calculateInvestment();
    }

    function deleteScenario() {
        const scenarioName = elements.savedScenarios.value;

        if (!scenarioName || !state.scenarios[scenarioName]) {
            alert('Select a saved scenario to delete.');
            return;
        }

        delete state.scenarios[scenarioName];
        persistScenarios();
        refreshSavedScenarioOptions();
        refreshComparisonOptions();
        updateComparisonChart();
    }

    function refreshSavedScenarioOptions() {
        const scenarioNames = Object.keys(state.scenarios).sort((a, b) => a.localeCompare(b));
        elements.savedScenarios.innerHTML = '<option value="">-- Saved Scenarios --</option>';
        scenarioNames.forEach((name) => {
            elements.savedScenarios.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`);
        });
    }

    function refreshComparisonOptions() {
        const scenarioNames = Object.keys(state.scenarios).sort((a, b) => a.localeCompare(b));
        const selected1 = elements.scenario1.value;
        const selected2 = elements.scenario2.value;

        elements.scenario1.innerHTML = '<option value="">Select Scenario 1</option>';
        elements.scenario2.innerHTML = '<option value="">Select Scenario 2</option>';

        scenarioNames.forEach((name) => {
            const option = `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
            elements.scenario1.insertAdjacentHTML('beforeend', option);
            elements.scenario2.insertAdjacentHTML('beforeend', option);
        });

        if (state.scenarios[selected1]) {
            elements.scenario1.value = selected1;
        }

        if (state.scenarios[selected2]) {
            elements.scenario2.value = selected2;
        }
    }

    function updateComparisonChart() {
        const first = state.scenarios[elements.scenario1.value];
        const second = state.scenarios[elements.scenario2.value];

        if (state.compareChart) {
            state.compareChart.destroy();
            state.compareChart = null;
        }

        if (!first || !second) {
            elements.compareSummary.textContent = 'Select two saved scenarios to compare.';
            return;
        }

        const labels = Array.from(
            new Set([
                ...first.results.map((entry) => entry.year),
                ...second.results.map((entry) => entry.year)
            ])
        ).sort((a, b) => a - b);

        const firstMap = new Map(first.results.map((entry) => [entry.year, roundMoney(entry.balance)]));
        const secondMap = new Map(second.results.map((entry) => [entry.year, roundMoney(entry.balance)]));

        state.compareChart = new Chart(elements.compareCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: first.name || elements.scenario1.value,
                    data: labels.map((year) => firstMap.get(year) ?? null),
                    borderColor: 'rgba(37, 99, 235, 1)',
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    borderWidth: 3,
                    tension: 0.25,
                    spanGaps: true
                }, {
                    label: second.name || elements.scenario2.value,
                    data: labels.map((year) => secondMap.get(year) ?? null),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 3,
                    tension: 0.25,
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                }
            }
        });

        const winner = first.finalBalance >= second.finalBalance ? first : second;
        const balanceGap = Math.abs(first.finalBalance - second.finalBalance);

        elements.compareSummary.innerHTML = `
            <div class="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
                <div class="rounded-lg bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Higher Ending Balance</p>
                    <p class="mt-1 text-lg font-semibold text-gray-900">${escapeHtml(winner.name || (winner === first ? elements.scenario1.value : elements.scenario2.value))}</p>
                    <p class="text-sm text-gray-600">${formatCurrency(winner.finalBalance)}</p>
                </div>
                <div class="rounded-lg bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Balance Gap</p>
                    <p class="mt-1 text-lg font-semibold text-gray-900">${formatCurrency(balanceGap)}</p>
                    <p class="text-sm text-gray-600">Difference at the final year.</p>
                </div>
                <div class="rounded-lg bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Growth Efficiency</p>
                    <p class="mt-1 text-lg font-semibold text-gray-900">${formatPercent((winner.totalInterest / Math.max(winner.totalContributions, 1)) * 100)}</p>
                    <p class="text-sm text-gray-600">Growth as a share of contributions.</p>
                </div>
            </div>
        `;
    }

    function exportData() {
        if (!state.currentScenario) {
            alert('Calculate a scenario first.');
            return;
        }

        const header = ['Year', 'Balance', 'Total Contributions', 'Yearly Growth', 'Total Growth', 'Inflation Adjusted'];
        const rows = state.currentScenario.results.map((entry) => [
            entry.year,
            roundMoney(entry.balance),
            roundMoney(entry.totalContributions),
            roundMoney(entry.yearlyInterest),
            roundMoney(entry.totalInterest),
            roundMoney(entry.inflationAdjusted)
        ]);
        const csv = [header, ...rows].map((row) => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'investment-scenario.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function loadSavedScenarios() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw);
            return Object.entries(parsed).reduce((accumulator, [name, value]) => {
                const normalized = normalizeScenario(name, value);
                if (normalized) {
                    accumulator[name] = normalized;
                }
                return accumulator;
            }, {});
        } catch (_error) {
            return {};
        }
    }

    function normalizeScenario(name, value) {
        if (!value || typeof value !== 'object') {
            return null;
        }

        const normalizedInputs = {
            startingAmount: numberOr(value.startingAmount, 1000),
            returnRate: numberOr(value.returnRate, 7),
            years: integerOr(value.years, 30),
            compoundFrequency: integerOr(value.compoundFrequency, 12),
            contributionAmount: numberOr(value.contributionAmount, 100),
            contributionFrequency: integerOr(value.contributionFrequency, 12),
            contributionTiming: value.contributionTiming === 'start' ? 'start' : 'end',
            inflationRate: numberOr(value.inflationRate, 2.5)
        };

        return {
            ...buildGrowthScenario(normalizedInputs),
            name: value.name || name
        };
    }

    function persistScenarios() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scenarios));
    }

    function showResultCard(element) {
        element.classList.remove('hidden');
        element.classList.add('show');
    }

    function readNumber(id) {
        return numberOr(document.getElementById(id).value, 0);
    }

    function readInteger(id) {
        return integerOr(document.getElementById(id).value, 0);
    }

    function numberOr(value, fallback) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function integerOr(value, fallback) {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function roundMoney(value) {
        return Math.round(value * 100) / 100;
    }

    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    function lcm(a, b) {
        return Math.abs(a * b) / gcd(a, b);
    }

    function sampleLabels(values, maxItems) {
        if (values.length <= maxItems) {
            return values;
        }

        const step = Math.ceil(values.length / maxItems);
        const sampled = [];

        for (let index = 0; index < values.length; index += step) {
            sampled.push(values[index]);
        }

        if (sampled[sampled.length - 1] !== values[values.length - 1]) {
            sampled.push(values[values.length - 1]);
        }

        return sampled;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    function formatPercent(value) {
        return `${value.toFixed(1)}%`;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
});
