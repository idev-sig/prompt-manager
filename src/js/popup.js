document.addEventListener('DOMContentLoaded', function() {
  loadPlatforms();
});

function loadPlatforms() {
  chrome.storage.sync.get(['platforms'], function(result) {
    const platforms = result.platforms || [];
    const container = document.getElementById('platforms-list');
    
    if (platforms.length === 0) {
      container.innerHTML = '<div class="no-platforms">暂无提示词信息，请先设置</div>';
      return;
    }
    
    container.innerHTML = '';
    platforms.forEach(platform => {
      const platformDiv = document.createElement('div');
      platformDiv.className = 'platform-item';
      platformDiv.innerHTML = `
        <div class="platform-name">${escapeHtml(platform.agentName)}</div>
      `;
      container.appendChild(platformDiv);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
