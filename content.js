function extractQuestionContent(questionElement) {
    // 提取問題文字
    const questionContent = questionElement.querySelector('.qqshow-content');
    const questionText = questionContent ? questionContent.textContent.trim() : '';

    // 提取選擇題選項
    const choices = questionElement.querySelectorAll('.qqsmc-item');
    const choicesText = Array.from(choices).map(choice => {
        return choice.textContent.trim();
    });

    return {
        question: questionText,
        choices: choicesText,
        choiceElements: Array.from(choices) // 返回選項元素以便後續使用
    };
}

function addAskButtonToFooter(question) {
    const footer = question.querySelector('.lsqz-footer');
    if (footer && !footer.querySelector('.ask-me-btn')) {
        const button = document.createElement('button');
        button.className = 'ask-me-btn';
        button.textContent = 'Ask me';
        
        button.onclick = async () => {
            const content = extractQuestionContent(question);
            
            try {
                const response = await chrome.runtime.sendMessage({
                    action: "askClaude",
                    data: {
                        question: content.question,
                        choices: content.choices
                    }
                });
                
                // 為每個選項添加解釋
                content.choiceElements.forEach((choiceElement, index) => {
                    // 移除已存在的解釋（如果有）
                    let existingExplanation = choiceElement.nextElementSibling;
                    if (existingExplanation && existingExplanation.classList.contains('claude-answer')) {
                        existingExplanation.remove();
                    }
                    
                    // 創建新的解釋元素
                    const explanationDiv = document.createElement('div');
                    explanationDiv.className = 'claude-answer choice-explanation';
                    
                    // 從 Claude 的回答中提取對應選項的解釋
                    const choiceMarker = `Option ${index + 1}:`;
                    const nextChoiceMarker = `Option ${index + 2}:`;
                    let explanation = '';
                    
                    if (response.answer) {
                        const answerText = response.answer;
                        const startIndex = answerText.indexOf(choiceMarker);
                        if (startIndex !== -1) {
                            const endIndex = nextChoiceMarker ? 
                                answerText.indexOf(nextChoiceMarker) : 
                                answerText.length;
                            explanation = answerText.substring(startIndex, endIndex !== -1 ? endIndex : undefined).trim();
                        }
                    }
                    
                    explanationDiv.textContent = explanation || "無法獲取解釋";
                    
                    // 將解釋插入到選項元素後面
                    choiceElement.parentNode.insertBefore(explanationDiv, choiceElement.nextSibling);
                });
                
            } catch (error) {
                console.error('Error getting Claude response:', error);
                alert('無法獲取 Claude 的回答，請稍後再試');
            }
        };
        
        footer.appendChild(button);
    }
}

function addAskButtons() {
    const questions = document.getElementsByClassName('lsqz-question');
    
    Array.from(questions).forEach((question) => {
        // 檢查是否已經有按鈕存在
        addAskButtonToFooter(question);
    });
}

function countQuizElements() {
    const quizzes = document.getElementsByClassName('lessli-quiz');
    const questions = document.getElementsByClassName('lsqz-question');
    
    // 每次計數時也加入按鈕
    addAskButtons();
    
    return {
        quizCount: quizzes.length,
        questionCount: questions.length
    };
}

// 監聽頁面變化，因為 Ed 使用動態加載
const observer = new MutationObserver(() => {
    addAskButtons();
});

// 開始觀察整個文檔的變化
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getQuizCount") {
        sendResponse(countQuizElements());
    }
}); 