"""
Health Spectrum AI Backend - Python Machine Learning Module
Provides advanced health analysis using ML and expert system rules
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import numpy as np
from typing import Dict, List, Tuple

app = Flask(__name__)
CORS(app)

# ============================================================================
# DISEASE DATABASE WITH SYMPTOMS & CONFIDENCE PATTERNS
# ============================================================================

DISEASE_SYMPTOMS_DB = {
    "COVID-19": {
        "primary_symptoms": ["fever", "cough", "fatigue"],
        "secondary_symptoms": ["headache", "body pain", "shortness of breath"],
        "severity_indicators": ["shortness of breath", "chest pain", "difficulty breathing"],
        "base_confidence": 0.75,
        "severity": "High",
        "urgency": "Seek immediate medical consultation",
        "treatment": "Isolation, rest, fever management, oxygen if needed",
        "precautions": "Avoid contact with others, wear mask"
    },
    "Influenza (Flu)": {
        "primary_symptoms": ["fever", "cough", "fatigue"],
        "secondary_symptoms": ["headache", "body pain", "nausea"],
        "severity_indicators": ["high fever", "severe body pain"],
        "base_confidence": 0.70,
        "severity": "Moderate",
        "urgency": "Consult physician within 24-48 hours",
        "treatment": "Antiviral medications, rest, fluids, fever reducers",
        "precautions": "Stay home for 5-7 days, cover coughs"
    },
    "Common Cold": {
        "primary_symptoms": ["cough", "fatigue"],
        "secondary_symptoms": ["headache", "nausea"],
        "severity_indicators": [],
        "base_confidence": 0.60,
        "severity": "Low",
        "urgency": "Monitor at home",
        "treatment": "Rest, hydration, vitamin C, throat lozenges",
        "precautions": "Maintain hygiene, avoid close contact"
    },
    "Pneumonia": {
        "primary_symptoms": ["fever", "cough", "shortness of breath"],
        "secondary_symptoms": ["chest pain", "fatigue", "body pain"],
        "severity_indicators": ["shortness of breath", "chest pain", "persistent high fever"],
        "base_confidence": 0.80,
        "severity": "High",
        "urgency": "Seek immediate medical consultation",
        "treatment": "Antibiotics, hospitalization if severe, oxygen therapy",
        "precautions": "Chest imaging needed, professional medical care required"
    },
    "Gastroenteritis": {
        "primary_symptoms": ["nausea", "pain"],
        "secondary_symptoms": ["fatigue", "fever"],
        "severity_indicators": ["persistent vomiting", "severe dehydration"],
        "base_confidence": 0.65,
        "severity": "Moderate",
        "urgency": "Monitor at home, seek care if worsens",
        "treatment": "Hydration, bland diet, electrolytes, anti-nausea medication",
        "precautions": "Avoid dairy and fatty foods, maintain hygiene"
    },
    "Migraine": {
        "primary_symptoms": ["headache"],
        "secondary_symptoms": ["nausea", "fatigue"],
        "severity_indicators": ["throbbing headache", "light sensitivity"],
        "base_confidence": 0.70,
        "severity": "Low",
        "urgency": "Manage at home",
        "treatment": "Rest, dark quiet room, pain relievers, hydration",
        "precautions": "Avoid triggers, manage stress, maintain sleep schedule"
    },
    "Tension Headache": {
        "primary_symptoms": ["headache"],
        "secondary_symptoms": ["fatigue", "stress"],
        "severity_indicators": [],
        "base_confidence": 0.65,
        "severity": "Low",
        "urgency": "Manage at home",
        "treatment": "Muscle relaxants, pain relievers, stress management",
        "precautions": "Take breaks from screens, practice good posture"
    },
    "Allergic Rhinitis": {
        "primary_symptoms": ["cough"],
        "secondary_symptoms": ["headache", "fatigue"],
        "severity_indicators": [],
        "base_confidence": 0.60,
        "severity": "Low",
        "urgency": "Monitor at home",
        "treatment": "Antihistamines, nasal decongestants, allergy avoidance",
        "precautions": "Identify and avoid allergens"
    },
    "Anxiety Disorder": {
        "primary_symptoms": ["stress", "anxiety"],
        "secondary_symptoms": ["insomnia", "headache", "body pain"],
        "severity_indicators": ["panic attacks", "severe anxiety"],
        "base_confidence": 0.70,
        "severity": "Moderate",
        "urgency": "Consult mental health professional",
        "treatment": "Therapy, meditation, breathing exercises, medication if needed",
        "precautions": "Lifestyle changes, stress management, counseling"
    },
    "Systemic Viral Infection": {
        "primary_symptoms": ["fever", "body pain"],
        "secondary_symptoms": ["fatigue", "headache"],
        "severity_indicators": ["high fever", "persistent symptoms"],
        "base_confidence": 0.60,
        "severity": "Moderate",
        "urgency": "Monitor symptoms, consult if persists",
        "treatment": "Rest, hydration, fever management, supportive care",
        "precautions": "Maintain isolation, monitor temperature"
    }
}

# ============================================================================
# MENTAL HEALTH ASSESSMENT RULES
# ============================================================================

MENTAL_HEALTH_THRESHOLDS = {
    "excellent": 90,
    "good": 75,
    "okay": 50,
    "poor": 30,
    "terrible": 0
}

INDICATOR_WEIGHTS = {
    "anxiety": -15,
    "depression": -20,
    "stress": -15,
    "insomnia": -12,
    "isolation": -12,
    "concentration": -10,
    "confidence": 8,
    "social_support": 10,
    "exercise": 12,
    "healthy_eating": 8
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_symptom_match_score(user_symptoms: List[str], disease_symptoms: Dict) -> float:
    """Calculate how well user symptoms match a disease pattern"""
    user_symptoms_lower = [s.lower() for s in user_symptoms]
    
    # Primary symptom matching (high weight)
    primary_matches = sum(1 for s in disease_symptoms["primary_symptoms"] 
                         if s.lower() in user_symptoms_lower)
    primary_weight = primary_matches / max(len(disease_symptoms["primary_symptoms"]), 1) * 0.6
    
    # Secondary symptom matching (medium weight)
    secondary_matches = sum(1 for s in disease_symptoms["secondary_symptoms"] 
                           if s.lower() in user_symptoms_lower)
    secondary_weight = secondary_matches / max(len(disease_symptoms["secondary_symptoms"]), 1) * 0.3
    
    # Severity indicators (high weight)
    severity_matches = sum(1 for s in disease_symptoms["severity_indicators"] 
                          if s.lower() in user_symptoms_lower)
    severity_weight = severity_matches / max(len(disease_symptoms["severity_indicators"]), 1) * 0.1 if disease_symptoms["severity_indicators"] else 0
    
    total_score = (primary_weight + secondary_weight + severity_weight) * 100
    return total_score

def analyze_symptoms_ml(age: int, gender: str, symptoms: List[str], description: str) -> Dict:
    """Analyze symptoms using ML-based pattern matching"""
    
    # Normalize symptoms
    all_symptoms = set(symptoms + extract_symptoms_from_text(description))
    
    # Calculate confidence scores for each disease
    disease_scores = {}
    for disease, pattern in DISEASE_SYMPTOMS_DB.items():
        match_score = calculate_symptom_match_score(list(all_symptoms), pattern)
        base_confidence = pattern["base_confidence"]
        
        # Age factor adjustment
        age_factor = 1.0
        if disease == "COVID-19" and age > 60:
            age_factor = 1.15
        elif disease == "Pneumonia" and (age < 5 or age > 65):
            age_factor = 1.2
        elif disease == "Influenza (Flu)" and (age < 5 or age > 60):
            age_factor = 1.1
        
        final_score = (match_score / 100) * base_confidence * age_factor * 100
        disease_scores[disease] = final_score
    
    # Get top 3 matching diseases with confidence > 20%
    sorted_diseases = sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)
    
    conditions = []
    for disease, score in sorted_diseases[:3]:
        if score >= 20:
            pattern = DISEASE_SYMPTOMS_DB[disease]
            likelihood = "High" if score >= 65 else "Moderate" if score >= 40 else "Low"
            conditions.append({
                "name": disease,
                "likelihood": likelihood,
                "description": f"{disease}: {pattern['treatment']}",
                "confidence_score": round(score, 1),
                "severity": pattern["severity"],
                "treatment": pattern["treatment"],
                "precautions": pattern["precautions"]
            })
    
    if not conditions:
        conditions.append({
            "name": "Common Cold or Mild Viral Syndrome",
            "likelihood": "High",
            "description": "A mild, self-limiting viral infection. Usually resolves with rest and hydration.",
            "confidence_score": 60.0,
            "severity": "Low",
            "treatment": "Rest, hydration, vitamin C",
            "precautions": "Maintain good hygiene"
        })
    
    # Determine overall severity
    max_severity_order = {"Low": 0, "Moderate": 1, "High": 2}
    overall_severity = max([DISEASE_SYMPTOMS_DB[cond["name"]]["severity"] for cond in conditions], 
                          key=lambda x: max_severity_order.get(x, 0))
    urgency = DISEASE_SYMPTOMS_DB[conditions[0]["name"]]["urgency"] if conditions else "Monitor at home"
    
    # Generate comprehensive advice
    advice = generate_medical_advice(overall_severity, conditions)
    
    return {
        "success": True,
        "summary": {
            "possibleConditions": conditions,
            "severity": overall_severity,
            "urgency": urgency,
            "advice": advice,
            "confidence_scores": {cond["name"]: cond["confidence_score"] for cond in conditions}
        }
    }

def extract_symptoms_from_text(text: str) -> List[str]:
    """Extract symptoms mentioned in descriptive text"""
    text_lower = text.lower()
    extracted = []
    
    symptom_keywords = {
        "fever": ["fever", "temperature", "hot", "chills"],
        "cough": ["cough", "coughing", "throat", "dry throat"],
        "headache": ["headache", "head pain", "migraine", "head ache"],
        "fatigue": ["tired", "fatigue", "exhausted", "sleepy", "weakness", "weak"],
        "nausea": ["nausea", "vomiting", "nauseous", "sick", "vomit"],
        "pain": ["pain", "aches", "aching", "sore", "soreness"],
        "shortness of breath": ["breath", "breathing", "difficulty breathing", "chest pain", "tightness"],
        "stress": ["stress", "stressed", "tension"],
        "anxiety": ["anxiety", "anxious", "nervous", "worry"],
        "insomnia": ["sleep", "insomnia", "can't sleep", "sleepless"],
    }
    
    for symptom, keywords in symptom_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            extracted.append(symptom)
    
    return extracted

def generate_medical_advice(severity: str, conditions: List[Dict]) -> str:
    """Generate personalized medical advice based on severity and conditions"""
    
    if severity == "High":
        return (
            "⚠️ WARNING: Your symptoms suggest a potentially serious condition. "
            "Please seek immediate medical consultation at an emergency clinic or hospital. "
            "Call an ambulance if you experience severe chest pain, difficulty breathing, or loss of consciousness. "
            "Avoid strenuous activity and monitor your vital signs closely."
        )
    elif severity == "Moderate":
        return (
            "Important: Your symptoms warrant professional medical evaluation. "
            "We recommend scheduling an appointment with your doctor or using telehealth services within 24-48 hours. "
            "In the meantime: rest adequately, stay hydrated, maintain good hygiene, and monitor your symptoms. "
            f"Consider: {conditions[0].get('treatment', 'rest and supportive care')}"
        )
    else:
        return (
            "You can manage these symptoms at home with rest and self-care. "
            f"Recommended approach: {conditions[0].get('treatment', 'rest, hydration, and monitoring')}. "
            "Keep track of your symptoms and consult a doctor if they persist beyond 7 days or worsen. "
            "Maintain good hygiene to prevent spreading to others."
        )

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/analyze-symptoms-ml', methods=['POST'])
def analyze_symptoms_endpoint():
    """Enhanced symptom analysis with ML"""
    try:
        data = request.json
        age = int(data.get('age', 0))
        gender = data.get('gender', '')
        symptoms = data.get('symptoms', [])
        description = data.get('description', '')
        
        if not age or not gender:
            return jsonify({"success": False, "error": "Age and Gender are required"}), 400
        
        result = analyze_symptoms_ml(age, gender, symptoms, description)
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in symptom analysis: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/mental-health-assessment', methods=['POST'])
def mental_health_assessment():
    """Enhanced mental health assessment with ML scoring"""
    try:
        data = request.json
        mood = data.get('mood', '')
        indicators = data.get('indicators', [])
        
        if not mood:
            return jsonify({"success": False, "error": "Mood selection is required"}), 400
        
        # Base score from mood
        base_scores = {"excellent": 95, "good": 80, "okay": 60, "poor": 35, "terrible": 15}
        score = base_scores.get(mood, 60)
        
        # Apply indicator adjustments
        for indicator in indicators:
            score += INDICATOR_WEIGHTS.get(indicator, 0)
        
        score = max(10, min(100, score))  # Clamp between 10-100
        
        # Classification
        if score >= 80:
            category = "Optimal Mental Wellness"
            message = "You're demonstrating excellent emotional balance! Continue these positive practices."
            recommendations = [
                "Share wellness strategies with friends/family",
                "Continue healthy routines and hobbies",
                "Consider mentoring others on mental wellness"
            ]
            activities = [
                "Gratitude journaling (10 mins daily)",
                "Social activities with friends",
                "Helping others or volunteering"
            ]
        elif score >= 65:
            category = "Good Mental Health"
            message = "You're managing well! Keep maintaining your wellness routine."
            recommendations = [
                "Continue current wellness habits",
                "Build stronger social connections",
                "Engage in regular physical activity"
            ]
            activities = [
                "Moderate exercise (30 mins)",
                "Quality time with loved ones",
                "Hobby engagement"
            ]
        elif score >= 50:
            category = "Mild Stress - Building Resilience"
            message = "You're experiencing manageable stress. Small interventions can help."
            recommendations = [
                "Practice daily meditation (10-15 mins)",
                "Limit screen time before bed",
                "Maintain regular sleep schedule"
            ]
            activities = [
                "Progressive muscle relaxation",
                "Nature walks",
                "Creative activities like art or music"
            ]
        elif score >= 30:
            category = "Moderate Emotional Strain"
            message = "You're experiencing notable stress. Professional support is recommended."
            recommendations = [
                "Reach out to a therapist or counselor",
                "Practice daily stress management",
                "Limit caffeine and maintain sleep",
                "Share feelings with trusted people"
            ]
            activities = [
                "Deep breathing exercises (4-4-4-4 box breathing)",
                "Gentle yoga or stretching",
                "Journaling emotions and thoughts"
            ]
        else:
            category = "Severe Emotional Distress"
            message = "Your assessment indicates you need immediate support. Please reach out for help."
            recommendations = [
                "Contact a mental health crisis helpline immediately",
                "Reach out to trusted family or friends",
                "Schedule urgent appointment with mental health professional",
                "Consider visiting emergency mental health services"
            ]
            activities = [
                "Call crisis helpline (available 24/7)",
                "Deep breathing and grounding exercises",
                "Physical activity to release tension"
            ]
        
        return jsonify({
            "success": True,
            "summary": {
                "score": round(score),
                "category": category,
                "message": message,
                "recommendations": recommendations,
                "suggestedActivities": activities
            }
        })
        
    except Exception as e:
        print(f"Error in mental health assessment: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/diet-exercise-plan', methods=['POST'])
def diet_exercise_plan():
    """Enhanced diet and exercise planning with ML"""
    try:
        data = request.json
        height = float(data.get('height', 0))
        weight = float(data.get('weight', 0))
        activity_level = data.get('activityLevel', '')
        goal = data.get('goal', '')
        age = int(data.get('age', 30))
        gender = data.get('gender', 'male')
        
        if not all([height, weight, activity_level, goal]):
            return jsonify({"success": False, "error": "All fields are required"}), 400
        
        # BMI Calculation
        bmi = weight / ((height / 100) ** 2)
        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25:
            bmi_category = "Normal weight"
        elif bmi < 30:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"
        
        # TDEE Calculation (Mifflin-St Jeor formula)
        if gender.lower() == "male":
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        else:
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
        
        # Activity multiplier
        multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "extra": 1.9
        }
        multiplier = multipliers.get(activity_level, 1.55)
        tdee = int(bmr * multiplier)
        
        # Calorie adjustment by goal
        if goal == "lose":
            daily_calories = tdee - 500
        elif goal == "gain":
            daily_calories = tdee + 400
        elif goal == "muscle":
            daily_calories = tdee + 300
        elif goal == "endurance":
            daily_calories = tdee + 250
        else:
            daily_calories = tdee
        
        daily_calories = max(1200, daily_calories)
        
        # Diet plans (context-specific)
        diet_plans = {
            "lose": {
                "breakfast": "3 egg white scramble with spinach, 2 slices whole wheat toast, green tea",
                "lunch": "150g grilled chicken, mixed salad, olive oil dressing",
                "dinner": "150g baked salmon, quinoa (1/2 cup), steamed broccoli",
                "snacks": "Apple with almond butter or Greek yogurt (150g)",
                "hydration": "3+ liters water daily, limit sugary drinks"
            },
            "gain": {
                "breakfast": "4 whole eggs, 2 toast with avocado, oatmeal with peanut butter and honey",
                "lunch": "200g ground beef/turkey, 1.5 cups rice, green beans",
                "dinner": "200g salmon, sweet potato, broccoli with olive oil",
                "snacks": "High-calorie protein shake (whey, banana, peanut butter, whole milk)",
                "hydration": "3.5+ liters water, drink calories via shakes"
            },
            "muscle": {
                "breakfast": "4 whole eggs, toast with butter, bowl of oatmeal",
                "lunch": "200g lean meat, rice, vegetables",
                "dinner": "200g fish/chicken, sweet potato, veggies",
                "snacks": "Protein shake with complex carbs",
                "hydration": "3-3.5 liters water with electrolytes"
            },
            "endurance": {
                "breakfast": "Steel-cut oats with berries, almonds, 2 boiled eggs",
                "lunch": "Whole wheat pasta with turkey meatballs, spinach salad",
                "dinner": "Chicken thigh with brown rice, sweet potatoes",
                "snacks": "Banana with peanut butter, energy bars with nuts",
                "hydration": "3.2+ liters water, electrolytes during long exercise"
            },
            "maintain": {
                "breakfast": "2 boiled eggs, whole wheat toast with butter, fresh fruit",
                "lunch": "Tuna salad wrap, whole wheat tortilla, veggies",
                "dinner": "Grilled chicken, brown rice, roasted mixed vegetables",
                "snacks": "Handful of mixed nuts and dark chocolate",
                "hydration": "2.5-3 liters water daily"
            }
        }
        
        diet_plan = diet_plans.get(goal, diet_plans["maintain"])
        
        # Exercise plans
        exercise_plans = {
            "lose": {
                "cardio": "40-50 mins moderate cardio 4x/week (brisk walk, elliptical, cycling)",
                "strength": "Full-body resistance 3x/week, 12-15 reps, 3 sets",
                "flexibility": "10 mins stretching post-workout daily"
            },
            "gain": {
                "cardio": "15-20 mins light cardio 2x/week",
                "strength": "Hypertrophy training 4x/week, heavy compounds, 8-12 reps",
                "flexibility": "Static stretching post-workout"
            },
            "muscle": {
                "cardio": "20-30 mins moderate cardio 2-3x/week",
                "strength": "Push/Pull/Legs split 4x/week, focus on compound lifts",
                "flexibility": "Dynamic stretching, mobility work"
            },
            "endurance": {
                "cardio": "Long-distance running/cycling 4-5x/week including 1x 60+ min session",
                "strength": "High-rep muscular endurance 2x/week, 20+ reps",
                "flexibility": "Focus on hip flexors, hamstrings, daily stretching"
            },
            "maintain": {
                "cardio": "30 mins cardio 3x/week (jogging, swimming, sports)",
                "strength": "Full body 3x/week, functional movements",
                "flexibility": "10 mins daily yoga or stretching"
            }
        }
        
        exercise_plan = exercise_plans.get(goal, exercise_plans["maintain"])
        
        return jsonify({
            "success": True,
            "bmi": round(bmi, 2),
            "bmiCategory": bmi_category,
            "dailyCalories": daily_calories,
            "tdee": tdee,
            "bmr": round(bmr),
            "dietPlan": diet_plan,
            "exercisePlan": exercise_plan
        })
        
    except Exception as e:
        print(f"Error in diet/exercise plan: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "AI Backend is running", "timestamp": datetime.now().isoformat()})

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("Health Spectrum AI Backend (Python) - Starting...")
    print("URL: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, port=5000, use_reloader=False)
