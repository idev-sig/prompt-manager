// 内容脚本 - 简化版本
(function() {
  'use strict';

  console.log('Content script loaded on:', window.location.href);

  function initAIAgentSelector() {
    if (document.getElementById('ai-agent-container')) {
      console.log('AI Agent Selector already initialized');
      return;
    }

    // 检查当前网站是否启用
    checkSiteEnabled().then(enabled => {
      if (!enabled) {
        console.log('当前网站未启用提示词功能');
        return;
      }
      
      console.log('Initializing AI Agent Selector');
      new AIAgentSelector();
    });
  }

  function checkSiteEnabled() {
    return new Promise((resolve) => {
      const currentDomain = window.location.hostname;
      console.log('当前域名:', currentDomain);
      
      chrome.storage.sync.get(['enabledSites'], function(result) {
        const enabledSites = result.enabledSites || [];
        const siteConfig = enabledSites.find(site => currentDomain.includes(site.domain));
        
        if (siteConfig) {
          console.log('找到网站配置:', siteConfig);
          resolve(siteConfig.enabled);
        } else {
          // 如果没有配置，默认不启用
          console.log('未找到网站配置，默认不启用');
          resolve(false);
        }
      });
    });
  }

  class AIAgentSelector {
    constructor() {
      this.platforms = [];
      this.selectedAgentId = null;
      this.init();
    }

    init() {
      this.loadPlatforms();
      this.createUI();
      console.log('AI Agent Selector initialized successfully');
    }

    loadPlatforms() {
      chrome.storage.sync.get(['platforms'], (result) => {
        this.platforms = result.platforms || [];
        console.log('加载到的平台数据:', this.platforms);
        
        // 先加载选中的智能体，然后更新选择框
        chrome.storage.local.get(['selectedAgentId'], (localResult) => {
          this.selectedAgentId = localResult.selectedAgentId || null;
          console.log('加载到的选中智能体ID:', this.selectedAgentId);
          this.updateSelect();
        });
      });
    }

    loadSelectedAgent() {
      chrome.storage.local.get(['selectedAgentId'], (result) => {
        this.selectedAgentId = result.selectedAgentId || null;
        console.log('加载到的选中智能体ID:', this.selectedAgentId);
      });
    }

    saveSelectedAgent(agentId) {
      this.selectedAgentId = agentId;
      chrome.storage.local.set({selectedAgentId: agentId}, () => {
        console.log('已保存选中的智能体ID:', agentId);
      });
    }

    createUI() {
      // 创建容器
      const container = document.createElement('div');
      container.id = 'ai-agent-container';
      container.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        background: white !important;
        border: 2px solid #007bff !important;
        border-radius: 8px !important;
        padding: 10px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        z-index: 2147483647 !important;
        font-family: Arial, sans-serif !important;
        min-width: 250px !important;
      `;

      // 创建标题
      const title = document.createElement('div');
      title.textContent = '选择提示词';
      title.style.cssText = `
        font-weight: bold !important;
        margin-bottom: 10px !important;
        color: #333 !important;
      `;

      // 创建选择框
      const select = document.createElement('select');
      select.id = 'ai-agent-select';
      select.style.cssText = `
        width: 100% !important;
        padding: 8px !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        margin-bottom: 10px !important;
      `;

      // 创建复制按钮
      const copyButton = document.createElement('button');
      copyButton.textContent = '复制提示词';
      copyButton.style.cssText = `
        width: 100% !important;
        padding: 8px !important;
        background: #007bff !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
      `;

      copyButton.addEventListener('click', () => {
        this.copySelectedPrompt();
      });

      // 组装UI
      container.appendChild(title);
      container.appendChild(select);
      container.appendChild(copyButton);
      document.body.appendChild(container);

      this.selectElement = select;
      this.copyButtonElement = copyButton;
    }

    updateSelect() {
      if (!this.selectElement) return;

      // 清空选项
      this.selectElement.innerHTML = '';

      if (this.platforms.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '暂无提示词';
        this.selectElement.appendChild(option);
        this.copyButtonElement.disabled = true;
        return;
      }

      // 添加默认选项
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '请选择提示词';
      this.selectElement.appendChild(defaultOption);

      // 添加智能体选项
      this.platforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = JSON.stringify(platform);
        option.textContent = platform.agentName;
        this.selectElement.appendChild(option);
      });

      // 恢复之前选中的提示词
      if (this.selectedAgentId) {
        const selectedPlatform = this.platforms.find(p => p.id === this.selectedAgentId);
        if (selectedPlatform) {
          this.selectElement.value = JSON.stringify(selectedPlatform);
          console.log('恢复选中的提示词:', selectedPlatform.agentName);
        }
      }

      this.copyButtonElement.disabled = false;

      // 移除之前的事件监听器（如果存在）
      this.selectElement.removeEventListener('change', this.handleSelectChange);
      
      // 绑定新的事件监听器
      this.handleSelectChange = () => {
        const selectedValue = this.selectElement.value;
        if (selectedValue) {
          try {
            const platform = JSON.parse(selectedValue);
            this.saveSelectedAgent(platform.id);
            console.log('选择了提示词:', platform.agentName);
          } catch (error) {
            console.error('解析选中项失败:', error);
          }
        } else {
          this.saveSelectedAgent(null);
          console.log('取消选择提示词');
        }
      };
      
      this.selectElement.addEventListener('change', this.handleSelectChange);
    }

    copySelectedPrompt() {
      const selectedValue = this.selectElement.value;
      
      if (!selectedValue) {
        alert('请先选择一个提示词');
        return;
      }

      try {
        const platform = JSON.parse(selectedValue);
        const promptText = platform.agentDescription;

        // 先填充到页面表单
        this.fillPageForms(promptText);

        // 复制到剪贴板
        navigator.clipboard.writeText(promptText).then(() => {
          console.log('提示词已复制:', promptText);
          
          // 显示成功提示
          this.showMessage('提示词已复制到剪贴板并填充到表单！');
          
        }).catch(err => {
          console.error('复制失败:', err);
          
          // 降级方案：使用传统方法
          this.fallbackCopy(promptText);
        });

      } catch (error) {
        console.error('解析选中项失败:', error);
        alert('选择的数据格式错误');
      }
    }

    fillPageForms(text) {
      // 获取当前焦点元素
      const activeElement = document.activeElement;
      
      console.log('当前焦点元素:', activeElement);
      
      // 检查焦点元素是否是可填充的输入框
      if (this.isValidInputElement(activeElement)) {
        console.log('焦点元素是有效的输入框，直接填充');
        this.fillElement(activeElement, text);
        return;
      }
      
      // 如果没有焦点或焦点不在输入框上，尝试查找最可能的输入框
      console.log('焦点不在输入框上，查找最可能的输入框...');
      this.findAndFillBestInput(text);
    }

    isValidInputElement(element) {
      if (!element) return false;
      
      // 跳过我们自己的元素
      if (element.closest('#ai-agent-container')) return false;
      
      // 跳过只读和禁用的元素
      if (element.readOnly || element.disabled) return false;
      
      // 跳过隐藏的元素
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      
      const tagName = element.tagName.toLowerCase();
      const isTextarea = tagName === 'textarea';
      const isTextInput = tagName === 'input' && (element.type === 'text' || element.type === 'search' || !element.type);
      const isContentEditable = element.contentEditable === 'true' || element.hasAttribute('contenteditable');
      const hasTextRole = element.getAttribute('role') === 'textbox';
      
      return isTextarea || isTextInput || isContentEditable || hasTextRole;
    }

    fillElement(element, text) {
      console.log('填充元素:', element.tagName, element.type, element.className);
      
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'textarea' || (tagName === 'input' && (element.type === 'text' || element.type === 'search' || !element.type))) {
        // 清空并填充 input/textarea
        element.value = '';
        setTimeout(() => {
          element.value = text;
          element.focus();
          this.triggerEvents(element);
        }, 50);
        console.log('已填充 input/textarea');
        
      } else if (element.contentEditable === 'true' || element.hasAttribute('contenteditable')) {
        // 清空并填充可编辑元素
        element.textContent = '';
        element.innerHTML = '';
        setTimeout(() => {
          element.textContent = text;
          element.innerHTML = text;
          element.focus();
          this.triggerEvents(element);
        }, 50);
        console.log('已填充 contenteditable');
      }
    }

    findAndFillBestInput(text) {
      // 查找最可能的输入框（通常是最大的可见文本输入框）
      const selectors = [
        'textarea',
        'input[type="text"]',
        'input[type="search"]',
        '[contenteditable="true"]',
        '[contenteditable]',
        '[role="textbox"]'
      ];
      
      let bestElement = null;
      let maxArea = 0;
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (this.isValidInputElement(element)) {
            // 计算元素面积，选择最大的
            const rect = element.getBoundingClientRect();
            const area = rect.width * rect.height;
            
            if (area > maxArea) {
              maxArea = area;
              bestElement = element;
            }
          }
        });
      });
      
      if (bestElement) {
        console.log('找到最佳输入框:', bestElement);
        this.fillElement(bestElement, text);
      } else {
        console.log('未找到合适的输入框');
        alert('请先点击要填充的输入框，然后再复制提示词');
      }
    }

    triggerEvents(element) {
      // 触发多种事件确保页面能检测到变化
      const events = ['input', 'change', 'keyup', 'keydown', 'focus', 'blur'];
      
      events.forEach(eventType => {
        const event = new Event(eventType, { 
          bubbles: true, 
          cancelable: true 
        });
        element.dispatchEvent(event);
      });
      
      // 特殊处理 React 应用
      if (element._valueTracker) {
        element._valueTracker.setValue('');
      }
      
      // 模拟用户输入
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: element.value || element.textContent
      });
      element.dispatchEvent(inputEvent);
    }

    fallbackCopy(text) {
      // 先填充到页面表单
      this.fillPageForms(text);

      // 创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.showMessage('提示词已复制到剪贴板并填充到表单！');
      } catch (err) {
        console.error('降级复制也失败:', err);
        alert('复制失败，但已填充到表单：\n' + text);
      }
      
      document.body.removeChild(textArea);
    }

    showMessage(text) {
      // 创建临时提示
      const message = document.createElement('div');
      message.textContent = text;
      message.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: #28a745 !important;
        color: white !important;
        padding: 15px 25px !important;
        border-radius: 5px !important;
        z-index: 2147483648 !important;
        font-family: Arial, sans-serif !important;
      `;
      
      document.body.appendChild(message);
      
      // 2秒后移除
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 2000);
    }
  }

  // 确保DOM准备好后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIAgentSelector);
  } else {
    initAIAgentSelector();
  }

})();
