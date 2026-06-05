document.addEventListener('DOMContentLoaded', function() {
    const pageMap = {
        'index.html': 'home',
        'symptoms.html': 'symptom-checker',
        'mh.html': 'mental-health',
        'dae.html': 'diet-exercise',
        'about.html': 'about'
    };

    let currentFile = window.location.pathname.split('/').pop().toLowerCase();
    if (!currentFile) {
        currentFile = 'index.html';
    }
    const currentPage = pageMap[currentFile] || 'home';

    document.querySelectorAll('.nav-link').forEach(link => {
        const page = link.dataset.page?.toLowerCase();
        if (page === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const root = document.documentElement;
    let isFrameScheduled = false;
    const pointerState = { x: 0, y: 0 };

    function updatePointerVars() {
        root.style.setProperty('--pointer-x', pointerState.x);
        root.style.setProperty('--pointer-y', pointerState.y);
        isFrameScheduled = false;
    }

    function handlePointerMove(clientX, clientY) {
        pointerState.x = ((clientX / window.innerWidth) - 0.5) * 2;
        pointerState.y = ((clientY / window.innerHeight) - 0.5) * 2;
        if (!isFrameScheduled) {
            isFrameScheduled = true;
            requestAnimationFrame(updatePointerVars);
        }
    }

    window.addEventListener('mousemove', event => {
        handlePointerMove(event.clientX, event.clientY);
    });

    window.addEventListener('touchmove', event => {
        if (event.touches.length) {
            const touch = event.touches[0];
            handlePointerMove(touch.clientX, touch.clientY);
        }
    }, { passive: true });

    // ========== COUNTER ANIMATIONS - DISABLED, USE 3D INSTEAD ==========
    function animateCounters() {
        // Animation disabled - numbers show directly with 3D transforms
    }

    // ========== SCROLL REVEAL ANIMATIONS ==========
    function setupScrollReveal() {
        const revealElements = document.querySelectorAll('.scroll-reveal, .feature-card, .stat-item, .section-title');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    if (entry.target.classList.contains('stat-number')) {
                        animateCounters();
                    }
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => observer.observe(el));
    }

    // ========== MOUSE GLOW EFFECT ==========
    function setupMouseGlow() {
        const glowElement = document.createElement('div');
        glowElement.className = 'mouse-glow';
        document.body.appendChild(glowElement);

        document.addEventListener('mousemove', (e) => {
            glowElement.classList.add('active');
            glowElement.style.left = (e.clientX - 150) + 'px';
            glowElement.style.top = (e.clientY - 150) + 'px';
        });

        document.addEventListener('mouseleave', () => {
            glowElement.classList.remove('active');
        });
    }

    // ========== STAT ANIMATION TRIGGER ==========
    function triggerStatsAnimation() {
        // Trigger immediately on page load
        setTimeout(() => {
            animateCounters();
        }, 500);

        const statsSection = document.querySelector('.stats');
        if (!statsSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statsSection.classList.contains('animated')) {
                    statsSection.classList.add('animated');
                    animateCounters();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(statsSection);
    }

    // ========== TYPING INDICATOR ==========
    window.createTypingIndicator = function() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        return indicator;
    };

    // ========== SCROLL ANIMATIONS ON LOAD ==========
    setupScrollReveal();
    triggerStatsAnimation();
    setupMouseGlow();

    // Add scroll reveal class to elements dynamically
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        if (!card.classList.contains('scroll-reveal')) {
            card.classList.add('scroll-reveal');
            if (index % 2 === 0) {
                card.classList.add('slide-left');
            }
        }
        // Activate immediately
        card.classList.add('active');
    });

    // Animate all scroll-reveal elements immediately
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        el.classList.add('active');
    });

    // Still observe for additional reveals if user has custom content
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    featureCards.forEach(card => cardObserver.observe(card));
});
