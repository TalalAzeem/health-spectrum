/**
 * Chatbot Animations & Effects
 * Handles typing indicators, pulse effects, health metrics, neural networks, and specialist page animations
 */

document.addEventListener('DOMContentLoaded', function() {
    // ========== CHATBOT MESSAGE SYSTEM ==========
    window.addChatMessage = function(message, isBot = true) {
        const chatContainer = document.querySelector('.chat-messages') || document.querySelector('.messages-container');
        if (!chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
        messageDiv.style.animation = 'slideUpStat 0.6s ease-out';

        if (isBot && message === 'typing') {
            messageDiv.innerHTML = `
                <div class="bot-avatar avatar-pulse">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                ${isBot ? '<div class="bot-avatar avatar-pulse"><i class="fas fa-robot"></i></div>' : ''}
                <div class="message-text">${message}</div>
            `;
        }
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // ========== INITIALIZE BREATHING CIRCLE ==========
    window.initBreathingCircle = function() {
        const container = document.querySelector('.breathing-container');
        if (!container) return;
        
        const circle = document.createElement('div');
        circle.className = 'breathing-circle';
        container.appendChild(circle);
    };

    // ========== INITIALIZE NEURAL NETWORK ==========
    window.initNeuralNetwork = function() {
        const container = document.querySelector('.neural-container');
        if (!container) return;

        const network = document.createElement('div');
        network.className = 'neural-network';

        // Add nodes
        for (let i = 1; i <= 4; i++) {
            const node = document.createElement('div');
            node.className = `neural-node node-${i}`;
            network.appendChild(node);
        }

        // Add connections
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('style', 'position: absolute; inset: 0; width: 100%; height: 100%');
        svg.setAttribute('viewBox', '0 0 300 300');

        const connections = [
            { x1: 60, y1: 45, x2: 240, y2: 105 },
            { x1: 240, y1: 105, x2: 120, y2: 240 },
            { x1: 120, y1: 240, x2: 240, y2: 150 },
            { x1: 60, y1: 45, x2: 120, y2: 240 }
        ];

        connections.forEach(conn => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', conn.x1);
            line.setAttribute('y1', conn.y1);
            line.setAttribute('x2', conn.x2);
            line.setAttribute('y2', conn.y2);
            line.setAttribute('stroke', 'rgba(59, 130, 246, 0.4)');
            line.setAttribute('stroke-width', '2');
            line.style.animation = 'connectionPulse 3s ease-in-out infinite';
            svg.appendChild(line);
        });

        network.appendChild(svg);
        container.appendChild(network);
    };

    // ========== INITIALIZE BODY VISUALIZATION ==========
    window.initBodyVisualization = function() {
        const container = document.querySelector('.body-container');
        if (!container) return;

        const silhouette = document.createElement('div');
        silhouette.className = 'body-silhouette';

        const organs = [
            { class: 'organ-brain', label: 'Brain' },
            { class: 'organ-heart', label: 'Heart' },
            { class: 'organ-lungs', label: 'Lungs' },
            { class: 'organ-stomach', label: 'Stomach' }
        ];

        organs.forEach(organ => {
            const organEl = document.createElement('div');
            organEl.className = `body-organ ${organ.class}`;
            organEl.title = organ.label;
            silhouette.appendChild(organEl);
        });

        container.appendChild(silhouette);
    };

    // ========== INITIALIZE HEALTH METRICS ==========
    window.initHealthMetrics = function() {
        const container = document.querySelector('.metrics-container');
        if (!container) return;

        const metrics = [
            { label: 'Heart Rate', value: '72', unit: 'bpm', icon: 'fa-heartbeat' },
            { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: 'fa-tint' },
            { label: 'Temperature', value: '98.6', unit: '°F', icon: 'fa-thermometer-three-quarters' }
        ];

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        grid.style.gap = '1.5rem';
        grid.style.marginTop = '2rem';

        metrics.forEach(metric => {
            const card = document.createElement('div');
            card.className = 'health-metric-card';
            card.innerHTML = `
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                    <i class="fas ${metric.icon}" style="color: #3B82F6;"></i>
                </div>
                <div class="metric-value">${metric.value} <span style="font-size: 0.8rem; color: #64748b;">${metric.unit}</span></div>
                <div class="metric-label">${metric.label}</div>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);
    };

    // ========== SYMPTOM ANALYSIS PROGRESS ==========
    window.startSymptomAnalysis = function(duration = 3) {
        const container = document.querySelector('.analysis-container');
        if (!container) return;

        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress-circular';
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) progress = 100;
            progressDiv.querySelector('.progress-circle').style.setProperty('--progress', `${progress}%`);
            progressDiv.querySelector('.progress-circle').textContent = Math.floor(progress) + '%';

            if (progress >= 100) clearInterval(interval);
        }, 200);

        container.innerHTML = '';
        container.appendChild(progressDiv);
    };

    // ========== MEDICAL SCAN ANIMATION ==========
    window.initMedicalScan = function() {
        const container = document.querySelector('.scan-container');
        if (!container) return;

        const scan = document.createElement('div');
        scan.className = 'medical-scan';
        scan.innerHTML = '<div class="scan-line"></div>';
        container.appendChild(scan);
    };

    // ========== PROGRESS BAR ANIMATION ==========
    window.startProgressBar = function(target = 85) {
        const container = document.querySelector('.progress-container');
        if (!container) return;

        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.setProperty('--progress-width', `${target}%`);
        bar.appendChild(fill);
        container.appendChild(bar);
    };

    // ========== GLOWING AVATAR EFFECT ==========
    window.addAvatarGlow = function(avatarElement) {
        if (!avatarElement) return;
        avatarElement.classList.add('avatar-pulse');
    };

    // ========== ANIMATED DASHBOARD INITIALIZATION ==========
    window.initDashboard = function() {
        const dashboardCards = document.querySelectorAll('.dashboard-card');
        dashboardCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.15}s`;
        });
    };

    // ========== PAGE TRANSITION ANIMATION ==========
    window.pageTransition = function() {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            if (page.classList.contains('active')) {
                page.classList.add('page-transition');
            }
        });
    };

    // ========== CALMING GRADIENT ANIMATION (Psychiatrist Page) ==========
    window.initCalmingGradient = function() {
        const container = document.querySelector('.gradient-container');
        if (!container) return;

        container.style.background = 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)';
        container.style.backgroundSize = '400% 400%';
        container.style.animation = 'calmingGradient 15s ease infinite';
    };

    // Add calming gradient animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes calmingGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
    `;
    document.head.appendChild(style);

    // Auto-initialize on page load
    initBreathingCircle();
    initNeuralNetwork();
    initBodyVisualization();
    initHealthMetrics();
    initMedicalScan();
    initDashboard();
});

/**
 * Usage Examples:
 * 
 * // Add bot message with typing indicator
 * addChatMessage('typing');
 * setTimeout(() => {
 *     addChatMessage('Hello! How can I help you today?');
 * }, 2000);
 * 
 * // Start symptom analysis
 * startSymptomAnalysis(3);
 * 
 * // Add avatar pulse effect
 * const avatar = document.querySelector('.avatar');
 * addAvatarGlow(avatar);
 * 
 * // Start progress bar
 * startProgressBar(75);
 */
