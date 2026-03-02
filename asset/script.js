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
        video: row.video,
        A: row.A,
        B: row.B,
        C: row.C,
        D: row.D,
        correct: row.correct?.trim() || "",
        base_point: parseInt(row.base_point) || 0,
        bonus_point: parseInt(row.bonus_point) || 0,
        bet_options: row.bet_options
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
    const box=document.getElementById("mediaBox");
    const img=document.getElementById("questionImage");
    const video=document.getElementById("questionVideo");

    img.classList.add("hidden");
    video.classList.add("hidden");

    if(q.image){
        img.src="media/"+q.image;
        img.classList.remove("hidden");
        box.classList.remove("hidden");
    }
    else if(q.video){
        video.src="media/"+q.video;
        video.classList.remove("hidden");
        box.classList.remove("hidden");
    }
    else{
        box.classList.add("hidden");
    }
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
}
// ================= TURN =================

function nextTurn(){
    const q=questions[currentQuestion];
    const buttons=document.querySelectorAll("#answerBox button");

    const correctText=document.getElementById("correctAnswerText");
    correctText.classList.add("hidden");
    correctText.innerText="";

    if(q.type==="mcq"){
        buttons.forEach(btn=>{
            btn.disabled=true;
            const letter=btn.dataset.letter;

            if(!hasAnswered){
                // Hết giờ -> tô đỏ đáp án đúng (vì người chơi sai)
                if(letter===q.correct){
                    btn.classList.add("wrong");
                }
            }
            else{
                // Trường hợp đã trả lời -> giữ logic cũ
                if(letter===q.correct){
                    btn.classList.add("correct");
                }
            }
        });
    }

    if(q.type==="fill"){
        const input=document.getElementById("fillInput");

        input.classList.remove("correct","wrong");

        if(!answeredCorrectly){
            input.classList.add("wrong");
            correctText.innerText="Đáp án đúng: " + q.correct;
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