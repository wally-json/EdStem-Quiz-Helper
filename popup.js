document.getElementById('openOptions').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});

document.addEventListener('DOMContentLoaded', function() {
    // 首先檢查當前頁面是否是edstem.org
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (!currentTab.url.includes('edstem.org')) {
            document.getElementById('quizCount').innerHTML = 
                "Please visit an EdStem page to count quizzes";
            return;
        }

        // 如果是edstem.org，則發送消息給content script
        chrome.tabs.sendMessage(currentTab.id, {action: "getQuizCount"}, function(response) {
            if (chrome.runtime.lastError) {
                // 優雅地處理通信錯誤
                document.getElementById('quizCount').innerHTML = 
                    "Unable to count quizzes. Please refresh the page.";
                return;
            }

            if (response) {
                document.getElementById('quizCount').innerHTML = 
                    `Found ${response.quizCount} quizzes<br>` +
                    `with ${response.questionCount} questions`;
            } else {
                document.getElementById('quizCount').innerHTML = 
                    "No quizzes found on this page";
            }
        });
    });
}); 