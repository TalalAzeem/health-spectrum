const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_AI_BACKEND = 'http://localhost:5000';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// ========== PROXY ENDPOINTS TO PYTHON AI BACKEND ==========

/**
 * Enhanced Symptom Analyzer - Proxies to Python ML Backend
 */
app.post('/api/analyze-symptoms', async (req, res) => {
    try {
        const { age, gender, symptoms, description } = req.body;

        if (!age || !gender) {
            return res.status(400).json({ 
                success: false, 
                error: "Age and Gender are required fields." 
            });
        }

        // Call Python ML backend
        try {
            const response = await axios.post(`${PYTHON_AI_BACKEND}/api/analyze-symptoms-ml`, {
                age: parseInt(age),
                gender: gender,
                symptoms: Array.isArray(symptoms) ? symptoms : [],
                description: description || ''
            }, { timeout: 10000 });

            return res.json(response.data);
        } catch (pythonError) {
            console.warn("Python backend error, using fallback rules engine:", pythonError.message);
            // Fallback to in-process analysis if Python backend is unavailable
            const fallbackResult = fallbackSymptomAnalysis(age, gender, symptoms, description);
            return res.json(fallbackResult);
        }

    } catch (err) {
        console.error("Error in symptoms API:", err);
        return res.status(500).json({ 
            success: false, 
            error: "Internal server error during analysis." 
        });
    }
});

/**
 * Enhanced Mental Health Assessor - Proxies to Python ML Backend
 */
app.post('/api/assess-mental-health', async (req, res) => {
    try {
        const { mood, indicators } = req.body;

        if (!mood) {
            return res.status(400).json({ 
                success: false, 
                error: "Mood selection is required." 
            });
        }

        // Call Python ML backend
        try {
            const response = await axios.post(`${PYTHON_AI_BACKEND}/api/mental-health-assessment`, {
                mood: mood,
                indicators: Array.isArray(indicators) ? indicators : []
            }, { timeout: 10000 });

            return res.json(response.data);
        } catch (pythonError) {
            console.warn("Python backend error, using fallback scoring:", pythonError.message);
            // Fallback to in-process analysis
            const fallbackResult = fallbackMentalHealthAnalysis(mood, indicators);
            return res.json(fallbackResult);
        }

    } catch (err) {
        console.error("Error in mental health API:", err);
        return res.status(500).json({ 
            success: false, 
            error: "Internal server error during assessment." 
        });
    }
});

/**
 * Enhanced Diet & Exercise Planner - Proxies to Python ML Backend
 */
app.post('/api/generate-plan', async (req, res) => {
    try {
        const { height, weight, activityLevel, goal, age = 30, gender = 'male' } = req.body;

        if (!height || !weight || !activityLevel || !goal) {
            return res.status(400).json({ 
                success: false, 
                error: "All fields (Height, Weight, Activity Level, Goal) are required." 
            });
        }

        // Call Python ML backend
        try {
            const response = await axios.post(`${PYTHON_AI_BACKEND}/api/diet-exercise-plan`, {
                height: parseFloat(height),
                weight: parseFloat(weight),
                activityLevel: activityLevel,
                goal: goal,
                age: parseInt(age),
                gender: gender
            }, { timeout: 10000 });

            return res.json(response.data);
        } catch (pythonError) {
            console.warn("Python backend error, using fallback plan generation:", pythonError.message);
            // Fallback to in-process planning
            const fallbackResult = fallbackDietExercisePlan(height, weight, activityLevel, goal);
            return res.json(fallbackResult);
        }

    } catch (err) {
        console.error("Error in diet planner API:", err);
        return res.status(500).json({ 
            success: false, 
            error: "Internal server error during plan generation." 
        });
    }
});

// ========== FALLBACK ANALYSIS FUNCTIONS (IN-PROCESS) ==========

function fallbackSymptomAnalysis(age, gender, symptoms, description) {
    const symptoms_array = Array.isArray(symptoms) ? symptoms : [];
    const desc_lower = (description || '').toLowerCase();
    
    let possibleConditions = [];
    let severity = "Low";
    let urgency = "Monitor at home";

    // Enhanced symptom detection
    const hasFever = symptoms_array.includes('fever') || desc_lower.match(/fever|temperature|hot|chills/);
    const hasCough = symptoms_array.includes('cough') || desc_lower.match(/cough|coughing|throat/);
    const hasHeadache = symptoms_array.includes('headache') || desc_lower.match(/headache|migraine|head pain/);
    const hasFatigue = symptoms_array.includes('fatigue') || desc_lower.match(/tired|fatigue|exhausted|weak/);
    const hasNausea = symptoms_array.includes('nausea') || desc_lower.match(/nausea|vomit|sick|stomach/);
    const hasBodyPain = symptoms_array.includes('pain') || desc_lower.match(/pain|aches|sore/);
    const hasBreathIssue = desc_lower.match(/breath|breathing|chest pain|tightness|shortness/);
    const hasRash = desc_lower.match(/rash|skin|itchy|redness/);

    // COVID-19 or Pneumonia detection
    if (hasFever && hasCough && hasBreathIssue) {
        possibleConditions.push({
            name: "Severe Respiratory Infection (Pneumonia/COVID-19)",
            likelihood: "High",
            description: "A serious lung infection requiring immediate medical attention. Symptoms include fever, persistent cough, and breathing difficulties."
        });
        severity = "High";
        urgency = "Seek immediate medical consultation";
    }
    // Flu or COVID
    else if (hasFever && hasCough && hasFatigue) {
        possibleConditions.push({
            name: "Influenza or COVID-19",
            likelihood: "High",
            description: "Viral respiratory infection with sudden onset of fever, cough, and fatigue. May cause severe body aches."
        });
        severity = "Moderate";
        urgency = "Consult physician within 24-48 hours";
    }
    // Gastroenteritis
    if (hasNausea && (hasBodyPain || desc_lower.includes('stomach'))) {
        possibleConditions.push({
            name: "Gastroenteritis (Stomach Flu)",
            likelihood: "High",
            description: "Stomach and intestinal inflammation from viral/bacterial infection. Presents with nausea, cramping, and potential dehydration."
        });
        if (hasFever) severity = "Moderate";
    }
    // Migraine
    if (hasHeadache && !hasFever) {
        if (desc_lower.match(/one side|throbbing|light sensitive|sensitive to light/)) {
            possibleConditions.push({
                name: "Migraine",
                likelihood: "High",
                description: "Neurological condition causing intense throbbing headaches, often with light/sound sensitivity and nausea."
            });
        } else {
            possibleConditions.push({
                name: "Tension Headache",
                likelihood: "High",
                description: "Most common headache type, typically caused by stress, poor posture, or muscle tension."
            });
        }
    }
    // General viral
    if (hasFever && hasBodyPain && !hasCough) {
        possibleConditions.push({
            name: "Systemic Viral Infection",
            likelihood: "Moderate",
            description: "General viral infection causing immune response with fever, joint stiffness, and muscle soreness."
        });
        severity = "Moderate";
    }
    // Allergy
    if (hasCough && !hasFever) {
        possibleConditions.push({
            name: "Allergic Rhinitis or Mild Bronchitis",
            likelihood: "Moderate",
            description: "Upper airway irritation from allergens, dust, or post-cold inflammation."
        });
    }
    // Rash
    if (hasRash) {
        possibleConditions.push({
            name: "Skin Condition (Dermatitis/Allergic Reaction)",
            likelihood: "High",
            description: "Localized skin inflammation from allergen exposure or irritating substance."
        });
    }

    if (possibleConditions.length === 0) {
        possibleConditions.push({
            name: "Common Cold or Mild Viral Syndrome",
            likelihood: "High",
            description: "Mild, self-limiting viral infection of the upper respiratory tract. Usually resolves with rest and hydration."
        });
    }

    const advice = severity === "High" 
        ? "⚠️ WARNING: Seek immediate medical consultation. Your symptoms suggest a serious condition."
        : severity === "Moderate"
        ? "Consider consulting a doctor within 24-48 hours. Rest, hydrate, and monitor symptoms."
        : "Monitor your symptoms at home. Rest, stay hydrated, and maintain good hygiene. Seek care if symptoms persist beyond 7 days.";

    return {
        success: true,
        summary: {
            possibleConditions,
            severity,
            urgency,
            advice
        }
    };
}

function fallbackMentalHealthAnalysis(mood, indicators) {
    const indicators_array = Array.isArray(indicators) ? indicators : [];
    
    let baseScore = { excellent: 95, good: 80, okay: 60, poor: 35, terrible: 15 }[mood] || 60;
    let deduction = indicators_array.length * 8;
    const score = Math.max(10, baseScore - deduction);

    let category, message, recommendations, suggestedActivities;

    if (score >= 80) {
        category = "Optimal Mental Wellness";
        message = "You're demonstrating excellent emotional balance and well-being!";
        recommendations = [
            "Maintain your current wellness routine",
            "Continue engaging in meaningful activities",
            "Share your wellness strategies with others"
        ];
        suggestedActivities = ["Daily gratitude practice", "Regular exercise", "Social connection"];
    } else if (score >= 60) {
        category = "Good Mental Health";
        message = "You're managing well overall with some areas for improvement.";
        recommendations = [
            "Maintain balance between work and relaxation",
            "Engage in regular physical activity",
            "Nurture your social connections"
        ];
        suggestedActivities = ["30-minute workout", "Time with friends", "Hobby engagement"];
    } else if (score >= 40) {
        category = "Elevated Stress - Intervention Needed";
        message = "You're experiencing noticeable stress. Taking action now will help.";
        recommendations = [
            "Practice daily meditation or breathing exercises",
            "Ensure adequate sleep (7-9 hours)",
            "Consider speaking with a counselor"
        ];
        suggestedActivities = ["Meditation (10 mins)", "Yoga", "Nature walk"];
    } else if (score >= 20) {
        category = "Severe Emotional Distress";
        message = "Your mental health needs professional support. Please reach out.";
        recommendations = [
            "Contact a mental health professional",
            "Reach out to trusted friends or family",
            "Call a crisis helpline if in acute distress",
            "Avoid isolation"
        ];
        suggestedActivities = ["Crisis helpline", "Breathing exercises", "Therapy"];
    } else {
        category = "Mental Health Crisis";
        message = "You need immediate professional help. Please contact emergency services.";
        recommendations = [
            "Call emergency services immediately",
            "Contact a crisis helpline",
            "Go to nearest emergency room",
            "Tell someone you trust how you're feeling"
        ];
        suggestedActivities = ["Call 911/emergency", "Crisis text line", "ER visit"];
    }

    return {
        success: true,
        summary: {
            score: Math.round(score),
            category,
            message,
            recommendations,
            suggestedActivities
        }
    };
}

function fallbackDietExercisePlan(height, weight, activityLevel, goal) {
    const hCm = parseFloat(height);
    const wKg = parseFloat(weight);

    // BMI Calculation
    const bmi = wKg / ((hCm / 100) * (hCm / 100));
    let bmiCategory = "Normal weight";
    if (bmi < 18.5) bmiCategory = "Underweight";
    else if (bmi >= 25 && bmi < 29.9) bmiCategory = "Overweight";
    else if (bmi >= 30) bmiCategory = "Obese";

    // TDEE Calculation
    const baseBmr = (10 * wKg) + (6.25 * hCm) - (5 * 30) + 5;
    const multipliers = {
        sedentary: 1.2, light: 1.375, moderate: 1.55,
        active: 1.725, extra: 1.9
    };
    const multiplier = multipliers[activityLevel] || 1.55;
    const tdee = Math.round(baseBmr * multiplier);

    // Caloric Target
    let dailyCalories = tdee;
    if (goal === 'lose') dailyCalories = tdee - 500;
    else if (goal === 'gain') dailyCalories = tdee + 400;
    else if (goal === 'muscle') dailyCalories = tdee + 300;
    else if (goal === 'endurance') dailyCalories = tdee + 250;

    dailyCalories = Math.max(1200, dailyCalories);

    // Diet plans
    const dietPlans = {
        lose: {
            breakfast: "3 egg whites with spinach, whole wheat toast, green tea",
            lunch: "150g grilled chicken, mixed salad, olive oil dressing",
            dinner: "150g baked salmon, quinoa (1/2 cup), steamed broccoli",
            snacks: "Apple with 1 tbsp almond butter",
            hydration: "3+ liters water daily"
        },
        gain: {
            breakfast: "4 whole eggs, 2 toast with avocado, oatmeal with honey",
            lunch: "200g ground beef, 1.5 cups rice, green beans",
            dinner: "200g salmon, sweet potato, broccoli with olive oil",
            snacks: "Protein shake (1 scoop, banana, 2 tbsp peanut butter, milk)",
            hydration: "3.5+ liters water"
        },
        muscle: {
            breakfast: "4 eggs, 2 toast with butter, large oatmeal bowl",
            lunch: "200g lean meat, 1.5 cups rice, vegetables",
            dinner: "200g chicken/fish, sweet potato, mixed veggies",
            snacks: "High-calorie protein shake with complex carbs",
            hydration: "3-3.5 liters water with electrolytes"
        },
        endurance: {
            breakfast: "Steel-cut oats with berries, almonds, 2 boiled eggs",
            lunch: "Pasta with turkey meatballs, spinach salad",
            dinner: "Chicken with brown rice, sweet potatoes",
            snacks: "Banana with peanut butter, energy bars",
            hydration: "3.2+ liters, electrolytes during long exercise"
        },
        maintain: {
            breakfast: "2 eggs, toast with butter, fresh fruit",
            lunch: "Tuna wrap, whole wheat tortilla, veggies",
            dinner: "Grilled chicken, brown rice, roasted vegetables",
            snacks: "Mixed nuts and dark chocolate",
            hydration: "2.5-3 liters water daily"
        }
    };

    const exercisePlans = {
        lose: {
            cardio: "40-50 mins moderate intensity 4x/week",
            strength: "Full-body circuit 3x/week, 12-15 reps",
            flexibility: "10 mins stretching post-workout"
        },
        gain: {
            cardio: "15-20 mins light cardio 2x/week",
            strength: "Heavy compound lifts 4x/week, 8-12 reps",
            flexibility: "Static stretching post-workout"
        },
        muscle: {
            cardio: "20-30 mins cardio 2-3x/week",
            strength: "Push/Pull/Legs split 4x/week",
            flexibility: "Dynamic stretching and mobility"
        },
        endurance: {
            cardio: "Long-distance training 4-5x/week, include 60+ min session",
            strength: "High-rep endurance 2x/week, 20+ reps",
            flexibility: "Daily hip/hamstring stretching"
        },
        maintain: {
            cardio: "30 mins, 3x/week (jogging, swimming, sports)",
            strength: "Full body 3x/week, functional movements",
            flexibility: "10 mins daily yoga or stretching"
        }
    };

    const dietPlan = dietPlans[goal] || dietPlans.maintain;
    const exercisePlan = exercisePlans[goal] || exercisePlans.maintain;

    return {
        success: true,
        bmi: parseFloat(bmi.toFixed(2)),
        bmiCategory,
        dailyCalories,
        dietPlan,
        exercisePlan
    };
}

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.json({ 
        status: "Node.js server is running",
        pythonBackendUrl: PYTHON_AI_BACKEND,
        timestamp: new Date().toISOString()
    });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Health Spectrum Backend Server is running!`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Python AI Backend: ${PYTHON_AI_BACKEND}`);
    console.log(`${'='.repeat(60)}\n`);
});
