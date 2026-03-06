let players = [];
let currentPlayer = 0;
let currentQuestion = 0;
let questions = [];
let answeredCorrectly = false;
let countdown;
let timeLeft = 30;
let hasAnswered = false;

const startBtn = document.getElementById("startBtn");

// ================= SOUND =================

const bgSound = new Audio("sound/bg.mp3");
const correctSound = new Audio("sound/correct.mp3");
const wrongSound = new Audio("sound/wrong.mp3");
const clickSound = new Audio("sound/click.mp3");

clickSound.volume = 0.6;
bgSound.loop = true;
bgSound.volume = 0.4;

startBtn.addEventListener("click", async () => {
    bgSound.play();
    const count = parseInt(document.getElementById("teamCount").value);
    initPlayers(count);
    await loadCSV();
    showScreen("gameScreen");
    loadQuestion();
});

// ================= LOAD CSV =================

async function loadCSV() {
    const response = await fetch("question/Question.csv");
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
    });

    questions = parsed.data.map(row => ({
        id: row.id,
        round: row.round,
        type: row.type,
        question: row.question?.trim() || "",
        image: row.image,
        sound: row.sound,
        video: row.video,
        A: row.A,
        B: row.B,
        C: row.C,
        D: row.D,
        correct: row.correct?.trim() || "",
        base_point: parseInt(row.base_point) || 0,
        bonus_point: parseInt(row.bonus_point) || 0,
        bet_options: row.bet_options,

        explanation: row.explanation?.trim() || "",
        explanation_image: row.explanation_image
    }));
}

// ================= INIT =================

function initPlayers(count){
    players=[];
    for(let i=1;i<=count;i++){
        players.push({id:i,score:0});
    }
    renderScoreBoard();
}

function showScreen(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    if(id === "gameScreen"){
        document.getElementById("scoreBoard").classList.remove("hidden");
    } else {
        document.getElementById("scoreBoard").classList.add("hidden");
    }
}

// ================= LOAD QUESTION =================

function loadQuestion(){
    document.getElementById("correctAnswerText").classList.add("hidden");
    document.getElementById("correctAnswerText").innerText="";
    document.getElementById("answerBox").innerHTML="";
    document.getElementById("explanationBox").classList.add("hidden");
    document.getElementById("explanationText").innerText = "";
    document.getElementById("explanationImage").classList.add("hidden");
    if(currentQuestion>=questions.length){
        showResult();
        return;
    }

    resetTimer();
    startTimer();

    const q = questions[currentQuestion];
    renderPointInfo(q);
    document.getElementById("playerDisplay").innerText = players[currentPlayer].id;
    document.getElementById("scoreDisplay").innerText = players[currentPlayer].score;
    renderScoreBoard();
    document.getElementById("questionText").innerText = q.question;

    renderMedia(q);
    renderAnswers(q);
}

// ================= TIMER =================

function startTimer(){
    timeLeft=30;
    document.getElementById("timer").innerText=timeLeft;

    countdown=setInterval(()=>{
        timeLeft--;
        document.getElementById("timer").innerText=timeLeft;

        if(timeLeft<=0){
            clearInterval(countdown);
            wrongSound.play(); // thêm
            nextTurn();
        }
    },1000);
}

function resetTimer(){
    clearInterval(countdown);
}

// ================= MEDIA =================

function renderMedia(q){
    const box = document.getElementById("mediaBox");
    const img = document.getElementById("questionImage");
    const video = document.getElementById("questionVideo");
    const audio = document.getElementById("questionAudio");
    const audioBox = document.getElementById("audioBox");

    // ===== RESET HOÀN TOÀN =====
    img.classList.add("hidden");
    video.classList.add("hidden");
    audioBox.classList.add("hidden");

    img.src = "";

    video.pause();
    video.currentTime = 0;
    video.removeAttribute("src");
    video.load();

    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();

    let hasMedia = false;

    // ===== IMAGE =====
    if(q.image && q.image.trim() !== ""){
        img.src = "media/" + q.image.trim();
        img.classList.remove("hidden");
        hasMedia = true;
    }

    // ===== VIDEO =====
    if(q.video && q.video.trim() !== ""){
        video.src = "media/" + q.video.trim();
        video.classList.remove("hidden");
        video.load();
        hasMedia = true;
    }

    // ===== SOUND =====
    if(q.sound && q.sound.trim() !== ""){
        audio.src = "media/" + q.sound.trim();
        audioBox.classList.remove("hidden");
        audio.load();
        hasMedia = true;
    }

    // Ẩn toàn bộ box nếu không có media
    box.classList.toggle("hidden", !hasMedia);
}

// ================= ANSWERS =================

function renderAnswers(q){
    const answerBox = document.getElementById("answerBox");
    const fillBox = document.getElementById("fillBox");
    const correctText = document.getElementById("correctAnswerText");

    // reset tất cả
    answerBox.innerHTML = "";
    fillBox.classList.add("hidden");
    correctText.classList.add("hidden");
    correctText.innerText = "";

    if(q.type === "mcq"){
        ["A","B","C","D"].forEach(letter=>{
            if(q[letter]){
                const btn = document.createElement("button");
                btn.innerText = q[letter];
                btn.dataset.letter = letter;
                btn.onclick = ()=>checkAnswer(letter);

                answerBox.appendChild(btn);
            }
        });
    }

    else if(q.type === "fill"){
        fillBox.classList.remove("hidden");

        const input = document.getElementById("fillInput");
        const submitBtn = document.getElementById("submitFill");

        input.value = "";
        input.classList.remove("correct","wrong");

        // 🔓 MỞ LẠI CHO CÂU MỚI
        input.disabled = false;
        submitBtn.disabled = false;

        submitBtn.onclick = submitFill;
    }
}

// ================= CHECK =================

function checkAnswer(choice){
    hasAnswered = true;
    resetTimer();
    const q = questions[currentQuestion];

    const buttons = document.querySelectorAll("#answerBox button");

    buttons.forEach(btn=>{
        btn.disabled = true;
        const letter = btn.dataset.letter;

        // Tô đáp án đúng
        if(letter === q.correct){
            btn.classList.add("correct");
        }

        // Nếu chọn sai thì tô đỏ lựa chọn
        if(letter === choice && choice !== q.correct){
            btn.classList.add("wrong");
        }
    });

    // ===== TÍNH ĐIỂM =====
    if(choice === q.correct){

        if(q.round === "bet"){
            players[currentPlayer].score += parseInt(q.bonus_point); 
            // +20 điểm
        } 
        else {
            players[currentPlayer].score += q.base_point;
        }

        correctSound.play();
    }
    else{

        if(q.round === "bet"){
            players[currentPlayer].score -= q.bet_options; 
            // -10 điểm
        }

        wrongSound.play();
    }

    // Cập nhật điểm hiển thị
    document.getElementById("scoreDisplay").innerText =
        players[currentPlayer].score;
    renderScoreBoard();
    showNextButton();
    showExplanation(q);
}

function submitFill(){
    resetTimer();
    const q = questions[currentQuestion];
    const input = document.getElementById("fillInput");
    const submitBtn = document.getElementById("submitFill");
    const correctText = document.getElementById("correctAnswerText");

    const value = input.value.trim().toLowerCase();
    const correctAnswer = q.correct.trim().toLowerCase();
    const questionText = q.question.trim().toLowerCase();

    input.classList.remove("correct","wrong");
    correctText.classList.add("hidden");
    correctText.innerText = "";

    let isCorrect = false;

    if(value === correctAnswer){
        isCorrect = true;
    } else {
        let missingLetters = "";
        for(let i = 0; i < correctAnswer.length; i++){
            if(questionText[i] !== correctAnswer[i]){
                missingLetters += correctAnswer[i];
            }
        }
        if(value === missingLetters){
            isCorrect = true;
        }
    }

    if(isCorrect){
        players[currentPlayer].score += q.base_point;
        input.classList.add("correct");
        correctSound.play();
    } else {
        input.classList.add("wrong");
        correctText.innerText = "Đáp án đúng: " + correctAnswer;
        correctText.classList.remove("hidden");
        wrongSound.play();
    }

    // 🔒 KHÓA TẠI ĐÂY
    input.disabled = true;
    submitBtn.disabled = true;

    document.getElementById("scoreDisplay").innerText =
        players[currentPlayer].score;

    renderScoreBoard();
    showNextButton();
    showExplanation(q);
}
// ================= TURN =================

function nextTurn(){
    const q = questions[currentQuestion];
    const buttons = document.querySelectorAll("#answerBox button");

    const correctText = document.getElementById("correctAnswerText");
    correctText.classList.add("hidden");
    correctText.innerText = "";

    // ===== MULTIPLE CHOICE =====
    if(q.type === "mcq"){

        buttons.forEach(btn=>{
            btn.disabled = true;
            const letter = btn.dataset.letter;

            // HẾT GIỜ KHÔNG TRẢ LỜI
            if(!hasAnswered){
                if(letter === q.correct){
                    btn.classList.add("wrong"); // đỏ
                }
            }

            // ĐÃ TRẢ LỜI
            else{
                if(letter === q.correct){
                    btn.classList.add("correct"); // xanh
                }
            }

        });
    }

    // ===== FILL QUESTION =====
    if(q.type === "fill"){

        const input = document.getElementById("fillInput");
        const submitBtn = document.getElementById("submitFill");

        input.disabled = true;
        submitBtn.disabled = true;

        input.classList.remove("correct","wrong");

        // Hết giờ hoặc trả lời sai
        if(!answeredCorrectly){
            input.classList.add("wrong");

            correctText.innerText = "Đáp án đúng: " + q.correct;
            correctText.classList.remove("hidden");
        }
    }

    showNextButton();
}
// ================= RESULT =================

function showResult(){
    showScreen("resultScreen");

    players.sort((a,b)=>b.score-a.score);

    const board=document.getElementById("resultBoard");
    board.innerHTML="";

    players.forEach(p=>{
        board.innerHTML+=`<p>Đội ${p.id}: ${p.score} điểm</p>`;
    });
}

function showNextButton(){
    const nextBox=document.getElementById("nextBox");
    nextBox.classList.remove("hidden");

    document.getElementById("nextBtn").onclick=()=>{
        nextBox.classList.add("hidden");
        currentQuestion++;
        currentPlayer++;

        if(currentPlayer>=players.length){
            currentPlayer=0;
        }

        loadQuestion();
    };
}

function renderPointInfo(q){
    const pointInfo = document.getElementById("pointInfo");

    // Câu bình thường
    if(q.round !== "bet"){
        pointInfo.innerHTML = `🎯 Câu này: +${q.base_point} điểm`;
    }

    else{
        pointInfo.innerHTML = `
            🎰 CÂU CƯỢC <br>
            ❌ Sai: -${q.bet_options} điểm <br>
            ✅ Đúng: +${q.bonus_point} điểm
        `;
    }
}

function renderScoreBoard(){
    const board = document.getElementById("scoreBoard");
    board.innerHTML = "";

    players.forEach((p,index)=>{
        const div = document.createElement("div");
        div.classList.add("score-item");

        if(index === currentPlayer){
            div.classList.add("active");
        }

        div.innerHTML = `
            Đội ${p.id} <br>
            <span style="color:#00ffcc">${p.score} điểm</span>
        `;

        board.appendChild(div);
    });
}

function playClick(){
    clickSound.currentTime = 0; // reset để click nhanh không bị delay
    clickSound.play();
}

document.addEventListener("click", function(e){
    if(e.target.tagName === "BUTTON"){
        playClick();
    }
});
document.addEventListener("click", () => {
    if (bgSound.paused) {
        bgSound.play().catch(()=>{});
    }
}, { once: true });

function showExplanation(q){
    const box = document.getElementById("explanationBox");
    const text = document.getElementById("explanationText");
    const img = document.getElementById("explanationImage");

    if(!q.explanation) return;

    text.innerText = q.explanation;
    box.classList.remove("hidden");

    if(q.explanation_image && q.explanation_image.trim() !== ""){
        img.src = "media/" + q.explanation_image.trim();
        img.classList.remove("hidden");
    } else {
        img.classList.add("hidden");
    }
}