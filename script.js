// Experiment Configuration
const config = {
    totalTrials: 10,
    currentTrial: 0,
    results: [],
    startTime: null
};

// Generate random HSL color
function generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 100);
    const lightness = Math.floor(Math.random() * 100);
    return {
        hsl: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        values: { hue, saturation, lightness }
    };
}

// Generate trials
function generateTrials() {
    const trials = [];
    for (let i = 0; i < config.totalTrials; i++) {
        trials.push({
            color: generateRandomColor(),
            trialStartTime: null
        });
    }
    return trials;
}

let trials = [];

// Experiment Flow Functions
function startExperiment() {
    config.startTime = Date.now();
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('instructions').classList.remove('hidden');
}

function startTrials() {
    document.getElementById('instructions').classList.add('hidden');
    document.getElementById('experiment').classList.remove('hidden');
    trials = generateTrials();
    showTrial();
}

function showTrial() {
    if (config.currentTrial >= config.totalTrials) {
        showResults();
        return;
    }
    
    const trial = trials[config.currentTrial];
    trial.trialStartTime = Date.now();
    
    // Update color display
    const colorStimulus = document.getElementById('color-stimulus');
    colorStimulus.style.backgroundColor = trial.color.hsl;
    
    // Reset slider to middle position
    document.getElementById('rating-slider').value = 4;
    
    updateProgress();
}

function updateProgress() {
    const progress = document.getElementById('progress');
    const width = (config.currentTrial / config.totalTrials) * 100;
    progress.style.width = `${width}%`;
    document.getElementById('trial-number').textContent = config.currentTrial + 1;
}

function recordResponse() {
    const rating = parseInt(document.getElementById('rating-slider').value);
    const trial = trials[config.currentTrial];
    
    config.results.push({
        trial: config.currentTrial + 1,
        color: trial.color.values,
        rating: rating,
        reactionTime: Date.now() - trial.trialStartTime
    });
    
    config.currentTrial++;
    showTrial();
}

function analyzeResults() {
    const results = config.results;
    
    // Calculate average rating
    const avgRating = results.reduce((acc, r) => acc + r.rating, 0) / results.length;
    
    // Find highest and lowest rated colors
    const highestRated = results.reduce((prev, current) => 
        (prev.rating > current.rating) ? prev : current);
    const lowestRated = results.reduce((prev, current) => 
        (prev.rating < current.rating) ? prev : current);
    
    // Analyze preferences by color properties
    const highSaturationRatings = results.filter(r => r.color.saturation > 50)
        .map(r => r.rating);
    const lowSaturationRatings = results.filter(r => r.color.saturation <= 50)
        .map(r => r.rating);
    
    const avgHighSat = highSaturationRatings.length ? 
        highSaturationRatings.reduce((a, b) => a + b) / highSaturationRatings.length : 0;
    const avgLowSat = lowSaturationRatings.length ? 
        lowSaturationRatings.reduce((a, b) => a + b) / lowSaturationRatings.length : 0;
    
    return {
        averageRating: avgRating.toFixed(2),
        highestRated,
        lowestRated,
        saturationPreference: avgHighSat > avgLowSat ? "saturated" : "desaturated",
        averageReactionTime: (results.reduce((acc, r) => acc + r.reactionTime, 0) / results.length / 1000).toFixed(2)
    };
}

function showResults() {
    document.getElementById('experiment').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
    
    const analysis = analyzeResults();
    const summary = document.getElementById('results-summary');
    
    summary.innerHTML = `
        <h3>Results Summary</h3>
        <p>Your average color preference rating: ${analysis.averageRating} out of 7</p>
        <p>You tended to prefer ${analysis.saturationPreference} colors</p>
        <p>Your highest rated color was HSL(${analysis.highestRated.color.hue}, ${analysis.highestRated.color.saturation}%, ${analysis.highestRated.color.lightness}%)</p>
        <p>Average response time: ${analysis.averageReactionTime} seconds</p>
    `;
}

function downloadResults() {
    const results = {
        timestamp: new Date().toISOString(),
        summary: analyzeResults(),
        totalDuration: ((Date.now() - config.startTime) / 1000).toFixed(2) + ' seconds',
        detailedResults: config.results
    };

    // Download JSON results
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-preference-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Take screenshot
    html2canvas(document.getElementById('results')).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const screenshotLink = document.createElement('a');
        screenshotLink.href = image;
        screenshotLink.download = 'color-preference-results.png';
        document.body.appendChild(screenshotLink);
        screenshotLink.click();
        document.body.removeChild(screenshotLink);
    });
}