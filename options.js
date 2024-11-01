document.addEventListener('DOMContentLoaded', function() {
    const apiKeyEl = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveOptions');

    // 讀取已保存的設定
    chrome.storage.sync.get(['apiKey'], function(result) {
        if (result.apiKey) {
            apiKeyEl.value = result.apiKey;
        }
    });

    // 保存設定
    saveButton.addEventListener('click', function() {
        chrome.storage.sync.set({
            apiKey: apiKeyEl.value
        }, function() {
            alert('API key saved successfully!');
        });
    });
}); 