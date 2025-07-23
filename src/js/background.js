// 后台脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('多平台智能体管理器已安装');
  
  // 初始化存储，添加一些默认数据用于测试
  chrome.storage.sync.get(['platforms', 'enabledSites'], function(result) {
    if (!result.platforms || result.platforms.length === 0) {
      const defaultPlatforms = [
        {
          id: 1,
          name: "通用助手",
          agentName: "通用助手",
          agentDescription: "你是一个有用的AI助手，请帮助用户解答问题。"
        },
        {
          id: 2,
          name: "代码助手",
          agentName: "代码助手",
          agentDescription: "你是一个专业的编程助手，擅长代码编写和调试。"
        }
      ];
      chrome.storage.sync.set({platforms: defaultPlatforms}, function() {
        console.log('默认提示词数据已初始化');
      });
    }
    
    // 初始化默认禁用的网站
    if (!result.enabledSites) {
      const defaultEnabledSites = [
        { domain: 'chatgpt.com', name: 'ChatGPT', enabled: false }
      ];
      chrome.storage.sync.set({enabledSites: defaultEnabledSites}, function() {
        console.log('默认网站设置已初始化');
      });
    }
  });
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPlatforms') {
    chrome.storage.sync.get(['platforms'], function(result) {
      sendResponse({platforms: result.platforms || []});
    });
    return true; // 保持消息通道开放
  }
});
