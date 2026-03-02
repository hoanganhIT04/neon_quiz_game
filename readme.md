# 🎮 Neon Quiz Game

> 🧠 A mini puzzle quiz game built with HTML, CSS and JavaScript  
> ⚡ Neon UI – Multiple Rounds – Dynamic Scoring System  

---

## 📌 Overview

Neon Quiz Game is a browser-based multiple choice puzzle game.  
The game supports multiple rounds, scoring logic, and optional media (image/video) for questions.

---

## 🚀 Features

- ✅ Multiple rounds (warmup, speed, final...)
- ✅ Dynamic scoring system
- ✅ Support image & video questions
- ✅ CSV-based question management
- ✅ Easy to extend and customize

---

## 📂 Project Structure
neon_quiz_game/
│
├── index.html
├── convert_question.py
├── Question.csv
│
├── asset/
├── media/
├── question/
└── sound/

---

## 📄 Question.csv Structure

All questions are stored inside:
Question.csv

### 📝 CSV Format Example

```csv
id,round,type,question,image,video,A,B,C,D,correct,base_point,bet_options,bonus_point
## 📖 Field Explanation

| Field | Description |
|-------|------------|
| id | Unique ID of the question |
| round | Game round (e.g. warmup, speed, final) |
| type | Question type (mcq = multiple choice question) |
| question | Question content |
| image | Image path (leave empty if not used) |
| video | Video path (leave empty if not used) |
| A | Answer option A |
| B | Answer option B |
| C | Answer option C |
| D | Answer option D |
| correct | Correct answer (A, B, C, or D) |
| base_point | Base score for correct answer |
| bet_options | Optional betting options (if game supports betting system) |
| bonus_point | Extra bonus score |