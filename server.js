const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// ========== DISEASE IDENTIFIER AI API ==========
app.post('/api/analyze-symptoms', (req, res) => {
    try {
        const { age, gender, symptoms, description } = req.body;

        if (!age || !gender) {
            return res.status(400).json({ success: false, error: "Age and Gender are required fields." });
        }

        const activeSymptoms = symptoms || [];
        const descText = (description || '').toLowerCase();

        let possibleConditions = [];
        let severity = "Low";
        let urgency = "Monitor at home";

        // Symptom parsing rules
        const hasFever = activeSymptoms.includes('fever') || descText.includes('fever') || descText.includes('temperature') || descText.includes('hot');
        const hasCough = activeSymptoms.includes('cough') || descText.includes('cough') || descText.includes('coughing') || descText.includes('throat');
        const hasHeadache = activeSymptoms.includes('headache') || descText.includes('headache') || descText.includes('migraine') || descText.includes('head pain');
        const hasFatigue = activeSymptoms.includes('fatigue') || descText.includes('tired') || descText.includes('fatigue') || descText.includes('exhausted') || descText.includes('sleepy');
        const hasNausea = activeSymptoms.includes('nausea') || descText.includes('nausea') || descText.includes('vomit') || descText.includes('stomach') || descText.includes('sick');
        const hasBodyPain = activeSymptoms.includes('pain') || descText.includes('pain') || descText.includes('aches') || descText.includes('sore');

        // Text keyword scans
        const hasShortnessOfBreath = descText.includes('breath') || descText.includes('breathing') || descText.includes('chest pain') || descText.includes('tightness');
        const hasRash = descText.includes('rash') || descText.includes('skin') || descText.includes('itchy') || descText.includes('redness');
        const hasDiarrhea = descText.includes('diarrhea') || descText.includes('loose stool');

        // Condition matching
        if (hasFever && hasCough && hasShortnessOfBreath) {
            possibleConditions.push({
                name: "Severe Respiratory Infection (e.g. Pneumonia, COVID-19)",
                likelihood: "High",
                description: "An infection of the lungs or lower respiratory tract characterized by chest tightness, difficulty breathing, fever, and coughing."
            });
            severity = "High";
            urgency = "Seek immediate medical consultation";
        } else if (hasFever && hasCough && hasFatigue) {
            possibleConditions.push({
                name: "Influenza (Flu) or COVID-19",
                likelihood: "High",
                description: "Acute viral respiratory infections. Symptoms often appear suddenly and include fever, body aches, dry cough, and intense fatigue."
            });
            severity = "Moderate";
            urgency = "Consult a physician within 24-48 hours if symptoms persist";
        }

        if (hasNausea && hasDiarrhea || (hasNausea && descText.includes('stomach'))) {
            possibleConditions.push({
                name: "Gastroenteritis (Stomach Flu)",
                likelihood: "High",
                description: "Inflammation of the stomach and intestines, typically caused by a viral or bacterial infection, resulting in nausea, cramping, and dehydration risk."
            });
            if (hasFever) severity = "Moderate";
        }

        if (hasHeadache && !hasFever) {
            if (descText.includes('one side') || descText.includes('throbbing') || descText.includes('light')) {
                possibleConditions.push({
                    name: "Migraine",
                    likelihood: "High",
                    description: "A neurological condition characterized by intense, throbbing headaches, often accompanied by sensitivity to light/sound and nausea."
                });
            } else {
                possibleConditions.push({
                    name: "Tension Headache",
                    likelihood: "High",
                    description: "The most common type of headache, often triggered by stress, poor posture, muscle tension, or dehydration."
                });
            }
        }

        if (hasFever && hasBodyPain && !hasCough && !hasNausea) {
            possibleConditions.push({
                name: "Systemic Viral Infection",
                likelihood: "Moderate",
                description: "A general viral infection causing immune response symptoms like elevated temperature, joint stiffness, and muscle soreness."
            });
            severity = "Moderate";
        }

        if (hasCough && !hasFever && !hasShortnessOfBreath) {
            possibleConditions.push({
                name: "Allergic Rhinitis or Mild Bronchitis",
                likelihood: "Moderate",
                description: "Irritation of the bronchial tubes or upper airway sensitivity due to allergens, dust, or recovering from a common cold."
            });
        }

        if (hasRash) {
            possibleConditions.push({
                name: "Contact Dermatitis or Allergic Reaction",
                likelihood: "High",
                description: "Localized skin inflammation resulting from exposure to an allergen or irritating substance."
            });
        }

        // Fallback condition if nothing else matches
        if (possibleConditions.length === 0) {
            possibleConditions.push({
                name: "Common Cold or Mild Viral Syndrome",
                likelihood: "High",
                description: "A mild, self-limiting viral infection of the upper respiratory tract. Usually resolves with rest and hydration."
            });
        }

        // Advice compilation
        let advice = "Ensure you stay hydrated, rest, and eat simple, nutritious meals. Monitor your symptoms closely.";
        if (severity === "High") {
            advice = "WARNING: Your symptoms indicate a potentially severe condition. Please visit an emergency clinic or contact a certified medical professional immediately. Avoid intense physical activity.";
        } else if (severity === "Moderate") {
            advice = "We recommend resting and keeping track of your body temperature. Consider consulting a telehealth doctor or general practitioner if your symptoms do not start to improve in 3 days.";
        }

        return res.json({
            success: true,
            summary: {
                possibleConditions,
                severity,
                urgency,
                advice
            }
        });
    } catch (err) {
        console.error("Error in symptoms API:", err);
        return res.status(500).json({ success: false, error: "Internal server error during analysis." });
    }
});

// ========== MENTAL HEALTH CHECKER API ==========
app.post('/api/assess-mental-health', (req, res) => {
    try {
        const { mood, indicators } = req.body;

        if (!mood) {
            return res.status(400).json({ success: false, error: "Mood selection is required." });
        }

        const activeIndicators = indicators || [];

        // Base score by mood
        let baseScore = 100;
        if (mood === 'excellent') baseScore = 100;
        else if (mood === 'good') baseScore = 80;
        else if (mood === 'okay') baseScore = 60;
        else if (mood === 'poor') baseScore = 40;
        else if (mood === 'terrible') baseScore = 20;

        // Deductions based on negative indicators
        let deduction = 0;
        activeIndicators.forEach(ind => {
            if (ind === 'anxiety') deduction += 12;
            else if (ind === 'depression') deduction += 15;
            else if (ind === 'stress') deduction += 12;
            else if (ind === 'insomnia') deduction += 10;
            else if (ind === 'isolation') deduction += 10;
            else if (ind === 'concentration') deduction += 8;
        });

        const score = Math.max(10, baseScore - deduction);

        // Classify based on final score
        let category = "Optimal Mental Wellness";
        let message = "You're demonstrating a strong state of emotional balance. Keep practicing healthy habits!";
        let recommendations = [
            "Maintain your current mindfulness or wellness routine.",
            "Continue engaging in regular social activities and hobbies.",
            "Consider sharing your wellness techniques with friends or family."
        ];
        let suggestedActivities = [
            "10-minute morning gratitude reflection",
            "Moderate cardio workout (30 mins)",
            "Journaling about weekly achievements"
        ];

        if (score < 30) {
            category = "Severe Emotional Distress";
            message = "Your assessment scores suggest you are going through a highly challenging emotional period. Please lean on support structures.";
            recommendations = [
                "Reach out to a mental health professional, therapist, or helpline.",
                "Engage in small, comforting self-care practices daily (warm bath, fresh air).",
                "Share how you feel with a trusted family member or friend."
            ];
            suggestedActivities = [
                "Deep box breathing (4-4-4-4 rhythm for 5 minutes)",
                "Gentle walking outdoors in nature",
                "Contacting a helpline (Crisis Helpline details below)"
            ];
        } else if (score < 55) {
            category = "High Stress and Emotional Strain";
            message = "You are experiencing a elevated degree of stress or anxiety. Taking active steps to recover energy is recommended.";
            recommendations = [
                "Prioritize sleep hygiene: limit screen time before bed and maintain cool room temperature.",
                "Practice setting clear boundaries at work or school to reduce overload.",
                "Dedicate 15 minutes daily to completely disconnect and unplug."
            ];
            suggestedActivities = [
                "Guided progressive muscle relaxation (PMR)",
                "Listening to calming ambient soundscapes or nature sounds",
                "15 minutes of slow yoga or stretching"
            ];
        } else if (score < 75) {
            category = "Mild Anxiety / Situational Stress";
            message = "You are doing okay, but experiencing mild stress. Incorporating small wellness rituals will help stabilize your mood.";
            recommendations = [
                "Incorporate light breathing exercises when feeling overwhelmed.",
                "Ensure balanced meals and moderate caffeine intake.",
                "Keep a daily log of thoughts to identify recurring stressors."
            ];
            suggestedActivities = [
                "Mindfulness meditation breathing exercise (5-7 mins)",
                "A brief walk during lunch breaks",
                "Doodling, coloring, or playing a musical instrument"
            ];
        }

        return res.json({
            success: true,
            summary: {
                score,
                category,
                message,
                recommendations,
                suggestedActivities
            }
        });
    } catch (err) {
        console.error("Error in mental health API:", err);
        return res.status(500).json({ success: false, error: "Internal server error during assessment." });
    }
});

// ========== DIET & EXERCISE PLANNER API ==========
app.post('/api/generate-plan', (req, res) => {
    try {
        const { height, weight, activityLevel, goal } = req.body;

        if (!height || !weight || !activityLevel || !goal) {
            return res.status(400).json({ success: false, error: "All fields (Height, Weight, Activity Level, Goal) are required." });
        }

        const hCm = parseFloat(height);
        const wKg = parseFloat(weight);

        // 1. BMI Calculation
        const bmi = wKg / ((hCm / 100) * (hCm / 100));
        let bmiCategory = "Normal weight";
        if (bmi < 18.5) bmiCategory = "Underweight";
        else if (bmi >= 25 && bmi < 29.9) bmiCategory = "Overweight";
        else if (bmi >= 30) bmiCategory = "Obese";

        // 2. TDEE Calculation (Using general standard formulas)
        // Assume default BMR of 1600 kcal as base, then calculate using height/weight
        const baseBmr = (10 * wKg) + (6.25 * hCm) - (5 * 30) + 5; // Mifflin-St Jeor for 30yo male
        let multiplier = 1.2;
        if (activityLevel === 'sedentary') multiplier = 1.2;
        else if (activityLevel === 'light') multiplier = 1.375;
        else if (activityLevel === 'moderate') multiplier = 1.55;
        else if (activityLevel === 'active') multiplier = 1.725;
        else if (activityLevel === 'extra') multiplier = 1.9;

        const tdee = Math.round(baseBmr * multiplier);

        // 3. Caloric Target adjustment based on goal
        let dailyCalories = tdee;
        if (goal === 'lose') dailyCalories = tdee - 500;
        else if (goal === 'gain') dailyCalories = tdee + 400;
        else if (goal === 'muscle') dailyCalories = tdee + 300;
        else if (goal === 'endurance') dailyCalories = tdee + 250;

        dailyCalories = Math.max(1200, dailyCalories); // Floor it to safe health level

        // 4. Generate plans based on goal
        let dietPlan = {};
        let exercisePlan = {};

        if (goal === 'lose') {
            dietPlan = {
                breakfast: "Egg white scramble (3 eggs) with spinach and whole wheat toast, plus 1 cup of green tea.",
                lunch: "Large mixed greens salad with 150g grilled chicken breast, cucumbers, tomatoes, and 1 tbsp olive oil vinaigrette.",
                dinner: "150g baked cod or salmon with half a cup of quinoa and unlimited steamed asparagus/broccoli.",
                snacks: "1 medium apple with 1 tablespoon of almond butter, or 150g low-fat Greek yogurt.",
                hydration: "Target at least 3.0 Liters of water daily. Limit liquid calories entirely."
            };
            exercisePlan = {
                cardio: "40 minutes of moderate-intensity steady cardio (brisk walk, incline treadmill, or elliptical) 4 times per week.",
                strength: "Full-body resistance circuit (Squats, Pushups, Dumbbell Rows, Planks) 3 times per week, 3 sets of 12-15 repetitions.",
                flexibility: "10 minutes of active stretching post-exercise to promote recovery."
            };
        } else if (goal === 'gain' || goal === 'muscle') {
            dietPlan = {
                breakfast: "4 whole eggs scrambled, 2 slices of whole wheat toast with avocado, and a large bowl of oatmeal with honey and peanut butter.",
                lunch: "200g lean ground beef or turkey with 1.5 cups of white or brown rice and steamed green beans.",
                dinner: "200g grilled salmon or chicken breast with a baked sweet potato and broccoli tossed in olive oil.",
                snacks: "High-calorie protein shake (1 scoop whey, 1 banana, 2 tbsp peanut butter, 300ml whole milk, oats).",
                hydration: "Target 3.5 Liters of water. Drink calories via shakes if struggling to meet calorie targets."
            };
            exercisePlan = {
                cardio: "Light cardio (15-20 minutes slow jog or cycling) 2 times per week to maintain cardiovascular fitness.",
                strength: "Hypertrophy-focused training 4 days a week (Upper/Lower split or Push/Pull/Legs). Focus on heavy compound lifts (Bench Press, Deadlifts, Overhead Press) in the 8-12 rep range.",
                flexibility: "Static stretching routines post-workout to maintain mobility."
            };
        } else if (goal === 'endurance') {
            dietPlan = {
                breakfast: "Large bowl of steel-cut oats with honey, berries, sliced almonds, and 2 boiled eggs on the side.",
                lunch: "Whole wheat pasta with lean turkey meatballs, tomato basil sauce, and a side spinach salad.",
                dinner: "Baked chicken thigh with brown rice, roasted sweet potatoes, and mixed seasonal vegetables.",
                snacks: "Banana with peanut butter, or energy bars with mixed dried fruits and walnuts.",
                hydration: "Target 3.2 Liters. Supplement with electrolyte drinks during exercise sessions exceeding 60 minutes."
            };
            exercisePlan = {
                cardio: "High-volume cardiovascular training (long-distance runs, swimming, or cycling intervals) 4-5 days a week. Incorporate 1 long session (60+ mins) and 2 interval training sessions.",
                strength: "Muscular endurance strength circuit 2 times per week. Focus on light weight and high reps (20+ reps per set) targeting core stability and posture.",
                flexibility: "Focus heavily on hip flexor, hamstring, and calf stretching daily."
            };
        } else {
            // maintain / default
            dietPlan = {
                breakfast: "2 boiled eggs, 1 slice of sourdough toast with butter, and a bowl of mixed fresh fruit.",
                lunch: "Tuna salad wrap with whole wheat tortilla, lettuce, bell peppers, and light mayo.",
                dinner: "Grilled chicken breast with half a cup of brown rice and a side of roasted mixed vegetables.",
                snacks: "A handful of mixed nuts (walnuts, almonds) and a piece of dark chocolate.",
                hydration: "Target 2.5 - 3.0 Liters of water daily."
            };
            exercisePlan = {
                cardio: "30 minutes of cardiovascular activity (jogging, swimming, active sports) 3 times per week.",
                strength: "General physical preparedness training 3 days a week. Focus on functional movements and balanced muscle groups.",
                flexibility: "Daily 10-minute dynamic yoga flow or basic stretching routine."
            };
        }

        return res.json({
            success: true,
            bmi: parseFloat(bmi.toFixed(2)),
            bmiCategory,
            dailyCalories,
            dietPlan,
            exercisePlan
        });
    } catch (err) {
        console.error("Error in diet planner API:", err);
        return res.status(500).json({ success: false, error: "Internal server error during plan generation." });
    }
});

// Start listening
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Health Spectrum Backend Server is running successfully.`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
