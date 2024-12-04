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
    
    // Basic statistics
    const avgRating = results.reduce((acc, r) => acc + r.rating, 0) / results.length;
    const avgReactionTime = results.reduce((acc, r) => acc + r.reactionTime, 0) / results.length;

    // Find highest and lowest rated colors
    const highestRated = results.reduce((prev, current) => 
        (prev.rating > current.rating) ? prev : current);
    const lowestRated = results.reduce((prev, current) => 
        (prev.rating < current.rating) ? prev : current);

    // Analyze color properties preferences
    const highSatColors = results.filter(r => r.color.saturation > 50);
    const lowSatColors = results.filter(r => r.color.saturation <= 50);
    const brightColors = results.filter(r => r.color.lightness > 50);
    const darkColors = results.filter(r => r.color.lightness <= 50);

    // Calculate average ratings for different color properties
    const avgHighSat = highSatColors.reduce((acc, r) => acc + r.rating, 0) / highSatColors.length;
    const avgLowSat = lowSatColors.reduce((acc, r) => acc + r.rating, 0) / lowSatColors.length;
    const avgBright = brightColors.reduce((acc, r) => acc + r.rating, 0) / brightColors.length;
    const avgDark = darkColors.reduce((acc, r) => acc + r.rating, 0) / darkColors.length;

    // Analyze hue preferences by color families
    const huePreferences = results.reduce((acc, r) => {
        let hue = r.color.hue;
        let category = '';
        if (hue <= 30 || hue > 330) category = 'reds';
        else if (hue <= 90) category = 'yellows';
        else if (hue <= 150) category = 'greens';
        else if (hue <= 210) category = 'cyans';
        else if (hue <= 270) category = 'blues';
        else if (hue <= 330) category = 'purples';
        
        if (!acc[category]) acc[category] = [];
        acc[category].push(r.rating);
        return acc;
    }, {});

    // Calculate average rating for each hue category
    const hueAverages = Object.entries(huePreferences).reduce((acc, [hue, ratings]) => {
        acc[hue] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        return acc;
    }, {});

    // Find favorite color family
    const favoriteHue = Object.entries(hueAverages)
        .sort(([,a], [,b]) => b - a)[0][0];

    // Analyze consistency
    const ratingVariance = results.reduce((acc, r) => 
        acc + Math.pow(r.rating - avgRating, 2), 0) / results.length;
    const consistency = ratingVariance < 1 ? 'very consistent' : 
                       ratingVariance < 2 ? 'moderately consistent' : 
                       'quite varied';

    // Decision speed analysis
    const avgDecisionTime = avgReactionTime / 1000; // convert to seconds
    const decisionStyle = avgDecisionTime < 2 ? 'intuitive' : 
                         avgDecisionTime < 4 ? 'balanced' : 
                         'contemplative';

    return {
        averageRating: avgRating.toFixed(2),
        saturationPreference: avgHighSat > avgLowSat ? "saturated" : "desaturated",
        brightnessPreference: avgBright > avgDark ? "bright" : "dark",
        favoriteHue,
        consistency,
        decisionStyle,
        averageReactionTime: avgDecisionTime.toFixed(2),
        highestRated,
        lowestRated,
        hueAverages,
        saturationImpact: Math.abs(avgHighSat - avgLowSat).toFixed(2),
        brightnessImpact: Math.abs(avgBright - avgDark).toFixed(2)
    };
}

function showResults() {
    document.getElementById('experiment').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
    
    const summary = document.getElementById('results-summary');
    const analysis = analyzeResults();
    summary.innerHTML = `
        <div class="results-graphic">
            <!-- Container for elements to be captured in screenshot -->
            <div class="results-summary-container">
                <h3>Your Color<br>Preference Results</h3>
                <!-- Color Grid -->
                <div class="color-grid">
                    ${createResultsVisualization()}
                </div>

                <!-- Summary Stats -->
                <div class="results-stats">
                <h3>Results Summary</h3>
                    <p>Average Rating: ${analysis.averageRating}/7</p>
                    <p>You tended to prefer ${analysis.saturationPreference} colors</p>
                    <p>Average response time: ${analysis.averageReactionTime} seconds</p>
                </div>

                <!-- Detailed Analysis -->
                <div class="results-detailed">
                    <p>Your preferences were  <span class="dynamic-text">${analysis.consistency}</span> across different colors, showing a clear preference for <span class="dynamic-text">${analysis.saturationPreference}</span> and <span class="dynamic-text">${analysis.brightnessPreference}</span> colors.</p>
                    <p>Your favorite colour family was <span class="dynamic-text">${analysis.favoriteHue}</span>, with saturation impacting your ratings by <span class="dynamic-text">${analysis.saturationImpact}</span> points and brightness by <span class="dynamic-text">${analysis.brightnessImpact}</span> points.</p>
                    <p>Your decision-making style was <span class="dynamic-text">${analysis.decisionStyle}</span>, suggesting a <span class="dynamic-text">${analysis.decisionStyle === 'intuitive' ? 'quick, gut-reaction' : analysis.decisionStyle === 'balanced' ? 'measured, thoughtful' : 'careful, analytical'}</span> approach to color preferences.</p>
                </div>
            </div>`;
}

function createResultsVisualization() {
    let html = '';
    for (let i = 0; i < config.results.length; i++) {
        const result = config.results[i];
        // Calculate text color based on background lightness
        const textColor = result.color.lightness > 60 ? '#000000' : '#FFFFFF';
        
        html += `
            <div class="result-circle" 
                 style="background-color: hsl(${result.color.hue}, ${result.color.saturation}%, ${result.color.lightness}%)">
                <span style="color: ${textColor}">${result.rating}</span>
            </div>`;
    }
    return html;
}
function downloadResults() {
    // Download JSON data
    const results = {
        timestamp: new Date().toISOString(),
        summary: analyzeResults(),
        totalDuration: ((Date.now() - config.startTime) / 1000).toFixed(2) + ' seconds',
        detailedResults: config.results
    };

    const jsonBlob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const jsonUrl = window.URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = 'color-preference-results.json';
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    window.URL.revokeObjectURL(jsonUrl);

    // Take screenshot of results
    const elementToCapture = document.querySelector('.results-summary-container');
    
    // Add white background before capture
    elementToCapture.style.backgroundColor = 'white';
    
    html2canvas(elementToCapture, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        windowWidth: elementToCapture.scrollWidth,
        windowHeight: elementToCapture.scrollHeight
    }).then(canvas => {
        // Convert to image and download
        const imageUrl = canvas.toDataURL('image/png', 1.0);
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = 'color-preference-results.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }).catch(error => {
        console.error('Screenshot failed:', error);
    });
}