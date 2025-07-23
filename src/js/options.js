document.addEventListener('DOMContentLoaded', function() {
  // 初始化TAB切换
  initTabs();
  
  // 初始化编辑模态框
  initEditModal();
  
  // 加载已有的平台信息和网站设置
  loadPlatforms();
  loadSites();
  updateStats();
  loadWebDAVSettings();
  
  // 绑定表单提交事件
  document.getElementById('platform-form').addEventListener('submit', addPlatform);
  document.getElementById('add-site-btn').addEventListener('click', addSite);
  
  // 绑定导入导出事件
  document.getElementById('export-config-btn').addEventListener('click', exportConfig);
  document.getElementById('import-config-btn').addEventListener('click', triggerImport);
  document.getElementById('import-file-input').addEventListener('change', importConfig);
  
  // 绑定WebDAV事件
  document.getElementById('webdav-form').addEventListener('submit', saveWebDAVSettings);
  document.getElementById('test-webdav-btn').addEventListener('click', testWebDAVConnection);
  document.getElementById('backup-to-webdav-btn').addEventListener('click', backupToWebDAV);
  document.getElementById('restore-from-webdav-btn').addEventListener('click', restoreFromWebDAV);
  
  // 检查自动备份
  checkAutoBackup();
});

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // 从URL hash或localStorage恢复上次选中的TAB
  let activeTab = window.location.hash.replace('#', '') || localStorage.getItem('activeTab') || 'prompts';
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // 移除所有活动状态
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // 添加当前活动状态
      this.classList.add('active');
      document.getElementById(targetTab + '-tab').classList.add('active');
      
      // 保存当前TAB状态
      localStorage.setItem('activeTab', targetTab);
      window.location.hash = targetTab;
      
      // 如果切换到配置管理页面，更新统计
      if (targetTab === 'config') {
        updateStats();
      }
    });
  });
  
  // 恢复TAB状态
  const targetBtn = document.querySelector(`[data-tab="${activeTab}"]`);
  const targetContent = document.getElementById(activeTab + '-tab');
  
  if (targetBtn && targetContent) {
    // 移除所有活动状态
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // 设置当前活动状态
    targetBtn.classList.add('active');
    targetContent.classList.add('active');
    
    // 如果是配置管理页面，更新统计
    if (activeTab === 'config') {
      updateStats();
    }
  }
}

function updateStats() {
  chrome.storage.sync.get(['platforms', 'enabledSites'], function(result) {
    const platforms = result.platforms || [];
    const sites = result.enabledSites || [];
    const enabledSites = sites.filter(site => site.enabled);
    
    document.getElementById('prompts-count').textContent = platforms.length;
    document.getElementById('sites-count').textContent = sites.length;
    document.getElementById('enabled-sites-count').textContent = enabledSites.length;
  });
}

function addPlatform(e) {
  e.preventDefault();
  
  const agentName = document.getElementById('agent-name').value.trim();
  const agentDescription = document.getElementById('agent-description').value.trim();
  
  if (!agentName || !agentDescription) {
    showMessage('请填写所有必填字段', 'error');
    return;
  }
  
  // 获取现有平台列表
  chrome.storage.sync.get(['platforms'], function(result) {
    let platforms = result.platforms || [];
    
    // 检查提示词名称是否已存在
    const exists = platforms.some(p => p.agentName === agentName);
    if (exists) {
      showMessage('提示词名称已存在', 'error');
      return;
    }
    
    // 添加新提示词
    const newPlatform = {
      id: Date.now(),
      name: agentName, // 使用提示词名称作为平台名称
      agentName: agentName,
      agentDescription: agentDescription
    };
    
    platforms.push(newPlatform);
    
    // 保存到存储
    chrome.storage.sync.set({platforms: platforms}, function() {
      showMessage('提示词添加成功', 'success');
      loadPlatforms();
      updateStats();
      
      // 清空表单
      document.getElementById('platform-form').reset();
    });
  });
}

let currentEditingPlatformId = null;

function initEditModal() {
  const modal = document.getElementById('edit-modal');
  const closeBtn = document.querySelector('.close');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const editForm = document.getElementById('edit-platform-form');
  
  // 关闭模态框
  closeBtn.addEventListener('click', closeEditModal);
  cancelBtn.addEventListener('click', closeEditModal);
  
  // 点击模态框外部关闭
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeEditModal();
    }
  });
  
  // 键盘快捷键
  document.addEventListener('keydown', function(e) {
    if (modal.classList.contains('show')) {
      if (e.key === 'Escape') {
        // ESC 关闭
        closeEditModal();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter 或 Cmd+Enter 保存
        e.preventDefault();
        editForm.dispatchEvent(new Event('submit'));
      }
    }
  });
  
  // 提交编辑表单
  editForm.addEventListener('submit', saveEditedPlatform);
}

function openEditModal(platformId) {
  chrome.storage.sync.get(['platforms'], function(result) {
    const platforms = result.platforms || [];
    const platform = platforms.find(p => p.id === platformId);
    
    if (!platform) {
      showMessage('找不到要编辑的提示词', 'error');
      return;
    }
    
    currentEditingPlatformId = platformId;
    
    // 填充表单
    document.getElementById('edit-agent-name').value = platform.agentName;
    document.getElementById('edit-agent-description').value = platform.agentDescription;
    
    // 显示模态框
    const modal = document.getElementById('edit-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // 聚焦到名称输入框
    document.getElementById('edit-agent-name').focus();
  });
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  modal.classList.remove('show');
  modal.style.display = 'none';
  currentEditingPlatformId = null;
  
  // 清空表单
  document.getElementById('edit-platform-form').reset();
}

function saveEditedPlatform(e) {
  e.preventDefault();
  
  if (!currentEditingPlatformId) {
    showMessage('编辑状态异常', 'error');
    return;
  }
  
  const agentName = document.getElementById('edit-agent-name').value.trim();
  const agentDescription = document.getElementById('edit-agent-description').value.trim();
  
  if (!agentName || !agentDescription) {
    showMessage('请填写所有必填字段', 'error');
    return;
  }
  
  chrome.storage.sync.get(['platforms'], function(result) {
    let platforms = result.platforms || [];
    
    // 检查名称是否与其他提示词重复（排除当前编辑的）
    const exists = platforms.some(p => p.agentName === agentName && p.id !== currentEditingPlatformId);
    if (exists) {
      showMessage('提示词名称已存在', 'error');
      return;
    }
    
    // 更新提示词
    const platformIndex = platforms.findIndex(p => p.id === currentEditingPlatformId);
    if (platformIndex !== -1) {
      platforms[platformIndex] = {
        ...platforms[platformIndex],
        name: agentName,
        agentName: agentName,
        agentDescription: agentDescription
      };
      
      // 保存到存储
      chrome.storage.sync.set({platforms: platforms}, function() {
        showMessage('提示词修改成功', 'success');
        loadPlatforms();
        updateStats();
        closeEditModal();
      });
    } else {
      showMessage('找不到要编辑的提示词', 'error');
    }
  });
}

function loadPlatforms() {
  chrome.storage.sync.get(['platforms'], function(result) {
    const platforms = result.platforms || [];
    const container = document.getElementById('platforms-list');
    
    if (platforms.length === 0) {
      container.innerHTML = '<div class="empty-message">暂无配置的提示词</div>';
      return;
    }
    
    container.innerHTML = '';
    platforms.forEach(platform => {
      const platformDiv = document.createElement('div');
      platformDiv.className = 'platform-item';
      platformDiv.innerHTML = `
        <div class="platform-header">
          <div class="platform-name">${escapeHtml(platform.agentName)}</div>
          <div class="platform-actions">
            <button class="edit-btn" data-id="${platform.id}">编辑</button>
            <button class="delete-btn" data-id="${platform.id}">删除</button>
          </div>
        </div>
        <div class="agent-description">${escapeHtml(platform.agentDescription)}</div>
      `;
      container.appendChild(platformDiv);
    });
    
    // 绑定编辑按钮事件
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const platformId = parseInt(this.getAttribute('data-id'));
        openEditModal(platformId);
      });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const platformId = parseInt(this.getAttribute('data-id'));
        deletePlatform(platformId);
      });
    });
  });
}

function deletePlatform(platformId) {
  if (!confirm('确定要删除这个提示词吗？')) {
    return;
  }
  
  chrome.storage.sync.get(['platforms'], function(result) {
    let platforms = result.platforms || [];
    platforms = platforms.filter(p => p.id !== platformId);
    
    chrome.storage.sync.set({platforms: platforms}, function() {
      showMessage('提示词删除成功', 'success');
      loadPlatforms();
      updateStats();
    });
  });
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = type;
  
  // 3秒后自动清除消息
  setTimeout(() => {
    messageDiv.textContent = '';
    messageDiv.className = '';
  }, 3000);
}

function loadSites() {
  chrome.storage.sync.get(['enabledSites'], function(result) {
    const sites = result.enabledSites || [];
    const container = document.getElementById('sites-list');
    
    container.innerHTML = '';
    sites.forEach(site => {
      const siteDiv = document.createElement('div');
      siteDiv.className = 'site-item';
      siteDiv.innerHTML = `
        <div class="site-info">
          <div class="site-name">${site.name}</div>
          <div class="site-domain">${site.domain}</div>
        </div>
        <div class="site-controls">
          <label class="toggle-switch">
            <input type="checkbox" ${site.enabled ? 'checked' : ''} data-domain="${site.domain}">
            <span class="slider"></span>
          </label>
          <button class="remove-site-btn" data-domain="${site.domain}">删除</button>
        </div>
      `;
      container.appendChild(siteDiv);
    });
    
    // 绑定开关事件
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', function() {
        const domain = this.getAttribute('data-domain');
        const enabled = this.checked;
        updateSiteStatus(domain, enabled);
      });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.remove-site-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const domain = this.getAttribute('data-domain');
        removeSite(domain);
      });
    });
  });
}

function addSite() {
  const domain = document.getElementById('new-site-domain').value.trim();
  const name = document.getElementById('new-site-name').value.trim();
  
  if (!domain || !name) {
    showMessage('请填写域名和网站名称', 'error');
    return;
  }
  
  chrome.storage.sync.get(['enabledSites'], function(result) {
    let sites = result.enabledSites || [];
    
    // 检查域名是否已存在
    const exists = sites.some(site => site.domain === domain);
    if (exists) {
      showMessage('该域名已存在', 'error');
      return;
    }
    
    // 添加新网站，默认不启用
    sites.push({
      domain: domain,
      name: name,
      enabled: false
    });
    
    chrome.storage.sync.set({enabledSites: sites}, function() {
      showMessage('网站添加成功', 'success');
      loadSites();
      updateStats();
      
      // 清空输入框
      document.getElementById('new-site-domain').value = '';
      document.getElementById('new-site-name').value = '';
    });
  });
}

function updateSiteStatus(domain, enabled) {
  chrome.storage.sync.get(['enabledSites'], function(result) {
    let sites = result.enabledSites || [];
    const siteIndex = sites.findIndex(site => site.domain === domain);
    
    if (siteIndex !== -1) {
      sites[siteIndex].enabled = enabled;
      chrome.storage.sync.set({enabledSites: sites}, function() {
        showMessage(`${sites[siteIndex].name} ${enabled ? '已启用' : '已禁用'}`, 'success');
        updateStats();
      });
    }
  });
}

function removeSite(domain) {
  if (!confirm('确定要删除这个网站吗？')) {
    return;
  }
  
  chrome.storage.sync.get(['enabledSites'], function(result) {
    let sites = result.enabledSites || [];
    sites = sites.filter(site => site.domain !== domain);
    
    chrome.storage.sync.set({enabledSites: sites}, function() {
      showMessage('网站删除成功', 'success');
      loadSites();
      updateStats();
    });
  });
}

function getManifestVersion() {
  return chrome.runtime.getManifest().version;
}

function exportConfig() {
  chrome.storage.sync.get(['platforms', 'enabledSites', 'webdavSettings'], function(result) {
    const config = {
      platforms: result.platforms || [],
      enabledSites: result.enabledSites || [],
      webdavSettings: result.webdavSettings || {},
      exportTime: new Date().toISOString(),
      version: getManifestVersion()
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `prompt-manager-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showMessage('配置已导出', 'success');
  });
}

function triggerImport() {
  document.getElementById('import-file-input').click();
}

function importConfig(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const config = JSON.parse(e.target.result);
      
      // 验证配置文件格式
      if (!validateConfig(config)) {
        showMessage('配置文件格式不正确', 'error');
        return;
      }
      
      // 确认导入
      if (!confirm('导入配置将覆盖当前所有设置，确定要继续吗？')) {
        return;
      }
      
      // 导入配置
      chrome.storage.sync.set({
        platforms: config.platforms || [],
        enabledSites: config.enabledSites || [],
        webdavSettings: config.webdavSettings || {}
      }, function() {
        showMessage('配置导入成功', 'success');
        
        // 重新加载页面数据
        loadPlatforms();
        loadSites();
        loadWebDAVSettings();
        updateStats();
      });
      
    } catch (error) {
      console.error('导入配置失败:', error);
      showMessage('配置文件解析失败，请检查文件格式', 'error');
    }
  };
  
  reader.readAsText(file);
  
  // 清空文件输入，允许重复选择同一文件
  event.target.value = '';
}

function validateConfig(config) {
  // 检查基本结构
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // 检查platforms数组
  if (config.platforms && Array.isArray(config.platforms)) {
    for (const platform of config.platforms) {
      if (!platform.id || !platform.agentName || !platform.agentDescription) {
        return false;
      }
    }
  }
  
  // 检查enabledSites数组
  if (config.enabledSites && Array.isArray(config.enabledSites)) {
    for (const site of config.enabledSites) {
      if (!site.domain || !site.name || typeof site.enabled !== 'boolean') {
        return false;
      }
    }
  }
  
  return true;
}

function exportSelectedConfig() {
  // 可以扩展为选择性导出功能
  const checkboxes = document.querySelectorAll('.export-checkbox:checked');
  const selectedTypes = Array.from(checkboxes).map(cb => cb.value);
  
  chrome.storage.sync.get(['platforms', 'enabledSites'], function(result) {
    const config = {
      exportTime: new Date().toISOString(),
      version: '1.0'
    };
    
    if (selectedTypes.includes('platforms')) {
      config.platforms = result.platforms || [];
    }
    
    if (selectedTypes.includes('sites')) {
      config.enabledSites = result.enabledSites || [];
    }
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `prompt-manager-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showMessage('选择的配置已导出', 'success');
  });
}

function mergeConfig(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const newConfig = JSON.parse(e.target.result);
      
      if (!validateConfig(newConfig)) {
        showMessage('配置文件格式不正确', 'error');
        return;
      }
      
      chrome.storage.sync.get(['platforms', 'enabledSites'], function(result) {
        let platforms = result.platforms || [];
        let enabledSites = result.enabledSites || [];
        
        // 合并提示词（避免重复）
        if (newConfig.platforms) {
          newConfig.platforms.forEach(newPlatform => {
            const exists = platforms.some(p => p.agentName === newPlatform.agentName);
            if (!exists) {
              newPlatform.id = Date.now() + Math.random();
              platforms.push(newPlatform);
            }
          });
        }
        
        // 合并网站设置（避免重复）
        if (newConfig.enabledSites) {
          newConfig.enabledSites.forEach(newSite => {
            const existingIndex = enabledSites.findIndex(s => s.domain === newSite.domain);
            if (existingIndex === -1) {
              enabledSites.push(newSite);
            } else {
              enabledSites[existingIndex] = newSite;
            }
          });
        }
        
        // 保存合并后的配置
        chrome.storage.sync.set({
          platforms: platforms,
          enabledSites: enabledSites
        }, function() {
          showMessage('配置合并成功', 'success');
          loadPlatforms();
          loadSites();
          updateStats();
        });
      });
      
    } catch (error) {
      console.error('合并配置失败:', error);
      showMessage('配置文件解析失败', 'error');
    }
  };
  
  reader.readAsText(file);
  event.target.value = '';
}

function triggerMerge() {
  document.getElementById('merge-file-input').click();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// WebDAV相关功能
function loadWebDAVSettings() {
  chrome.storage.sync.get(['webdavSettings'], function(result) {
    const settings = result.webdavSettings || {};
    
    document.getElementById('webdav-url').value = settings.url || '';
    document.getElementById('webdav-filename').value = settings.filename || 'prompt-manager-backup.json';
    document.getElementById('webdav-username').value = settings.username || '';
    document.getElementById('webdav-password').value = decryptPassword(settings.password) || ''; // 解密密码
    document.getElementById('auto-backup-enabled').checked = settings.autoBackup || false;
  });
}

function saveWebDAVSettings(e) {
  e.preventDefault();
  
  const password = document.getElementById('webdav-password').value.trim();
  
  const settings = {
    url: document.getElementById('webdav-url').value.trim(),
    filename: document.getElementById('webdav-filename').value.trim() || 'prompt-manager-backup.json',
    username: document.getElementById('webdav-username').value.trim(),
    password: encryptPassword(password), // 加密密码
    autoBackup: document.getElementById('auto-backup-enabled').checked
  };
  
  chrome.storage.sync.set({webdavSettings: settings}, function() {
    showMessage('WebDAV设置已保存', 'success');
    showWebDAVStatus('设置保存成功', 'success');
  });
}

function testWebDAVConnection() {
  const url = document.getElementById('webdav-url').value.trim();
  const username = document.getElementById('webdav-username').value.trim();
  const password = document.getElementById('webdav-password').value.trim();
  const testBtn = document.getElementById('test-webdav-btn');
  
  if (!url) {
    showWebDAVStatus('请先填写WebDAV服务器地址', 'error');
    return;
  }
  
  testBtn.disabled = true;
  testBtn.textContent = '测试中...';
  
  showWebDAVStatus('正在测试连接...', 'info');
  
  testWebDAVAuth(url, username, password)
    .then(() => {
      showWebDAVStatus('WebDAV连接测试成功！', 'success');
    })
    .catch(error => {
      console.error('WebDAV连接测试失败:', error);
      showWebDAVStatus(`连接测试失败: ${error.message}`, 'error');
    })
    .finally(() => {
      testBtn.disabled = false;
      testBtn.textContent = '测试连接';
    });
}

function testWebDAVAuth(url, username, password) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PROPFIND', url, true);
    
    if (username && password) {
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(username + ':' + password));
    }
    
    xhr.setRequestHeader('Depth', '0');
    xhr.setRequestHeader('Content-Type', 'application/xml');
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('网络连接失败'));
    };
    
    xhr.ontimeout = function() {
      reject(new Error('连接超时'));
    };
    
    xhr.timeout = 10000; // 10秒超时
    xhr.send('<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop></prop></propfind>');
  });
}

function backupToWebDAV() {
  chrome.storage.sync.get(['webdavSettings', 'platforms', 'enabledSites'], function(result) {
    const settings = result.webdavSettings;
    
    if (!settings || !settings.url) {
      showMessage('请先配置WebDAV设置', 'error');
      return;
    }
    
    const config = {
      platforms: result.platforms || [],
      enabledSites: result.enabledSites || [],
      webdavSettings: result.webdavSettings || {},
      exportTime: new Date().toISOString(),
      version: getManifestVersion()
    };
    
    const configData = JSON.stringify(config, null, 2);
    
    showWebDAVStatus('正在备份到WebDAV...', 'info');
    
    uploadToWebDAV(settings, configData)
      .then(() => {
        showWebDAVStatus('备份到WebDAV成功！', 'success');
        showMessage('配置已备份到WebDAV', 'success');
        updateStats();
      })
      .catch(error => {
        showWebDAVStatus(`备份失败: ${error.message}`, 'error');
        showMessage('WebDAV备份失败', 'error');
      });
  });
}

function restoreFromWebDAV() {
  chrome.storage.sync.get(['webdavSettings'], function(result) {
    const settings = result.webdavSettings;
    
    if (!settings || !settings.url) {
      showMessage('请先配置WebDAV设置', 'error');
      return;
    }
    
    if (!confirm('从WebDAV恢复配置将覆盖当前所有设置，确定要继续吗？')) {
      return;
    }
    
    showWebDAVStatus('正在从WebDAV恢复...', 'info');
    
    downloadFromWebDAV(settings)
      .then(configData => {
        try {
          const config = JSON.parse(configData);
          
          if (!validateConfig(config)) {
            throw new Error('配置文件格式不正确');
          }
          
          // 恢复配置（包括WebDAV设置）
          chrome.storage.sync.set({
            platforms: config.platforms || [],
            enabledSites: config.enabledSites || [],
            webdavSettings: config.webdavSettings || {}
          }, function() {
            showWebDAVStatus('从WebDAV恢复成功！', 'success');
            showMessage('配置已从WebDAV恢复', 'success');
            
            // 重新加载页面数据
            loadPlatforms();
            loadSites();
            loadWebDAVSettings();
            updateStats();
          });
          
        } catch (error) {
          showWebDAVStatus(`恢复失败: ${error.message}`, 'error');
          showMessage('配置文件解析失败', 'error');
        }
      })
      .catch(error => {
        showWebDAVStatus(`恢复失败: ${error.message}`, 'error');
        showMessage('WebDAV恢复失败', 'error');
      });
  });
}

function uploadToWebDAV(settings, data) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = settings.url.endsWith('/') ? settings.url + settings.filename : settings.url + '/' + settings.filename;
    
    xhr.open('PUT', url, true);
    
    if (settings.username && settings.password) {
      const decryptedPassword = decryptPassword(settings.password);
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(settings.username + ':' + decryptedPassword));
    }
    
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('网络连接失败'));
    };
    
    xhr.ontimeout = function() {
      reject(new Error('上传超时'));
    };
    
    xhr.timeout = 30000; // 30秒超时
    xhr.send(data);
  });
}

function downloadFromWebDAV(settings) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = settings.url.endsWith('/') ? settings.url + settings.filename : settings.url + '/' + settings.filename;
    
    xhr.open('GET', url, true);
    
    if (settings.username && settings.password) {
      const decryptedPassword = decryptPassword(settings.password);
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(settings.username + ':' + decryptedPassword));
    }
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('网络连接失败'));
    };
    
    xhr.ontimeout = function() {
      reject(new Error('下载超时'));
    };
    
    xhr.timeout = 30000; // 30秒超时
    xhr.send();
  });
}

function showWebDAVStatus(message, type) {
  const statusDiv = document.getElementById('webdav-status');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `webdav-status ${type}`;
    statusDiv.style.display = 'block';
    
    // 3秒后自动隐藏成功和信息提示
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
}

function saveBackupHistory(backupInfo) {
  chrome.storage.local.get(['backupHistory'], function(result) {
    let history = result.backupHistory || [];
    
    // 添加新备份记录
    history.unshift(backupInfo);
    
    // 只保留最近10次备份记录
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    chrome.storage.local.set({backupHistory: history});
  });
}

function loadBackupHistory() {
  chrome.storage.local.get(['backupHistory'], function(result) {
    const history = result.backupHistory || [];
    const container = document.getElementById('backup-history');
    
    if (history.length === 0) {
      container.innerHTML = '<p class="empty-message">暂无备份记录</p>';
      return;
    }
    
    container.innerHTML = history.map((backup, index) => `
      <div class="backup-item">
        <div class="backup-info">
          <div class="backup-time">${new Date(backup.time).toLocaleString('zh-CN')}</div>
          <div class="backup-size">${(backup.size / 1024).toFixed(1)} KB</div>
        </div>
        <div class="backup-actions">
          <button class="restore-backup-btn" data-index="${index}">恢复此备份</button>
          <button class="delete-backup-btn" data-index="${index}">删除</button>
        </div>
      </div>
    `).join('');
    
    // 绑定恢复按钮事件
    document.querySelectorAll('.restore-backup-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        restoreFromBackupHistory(index);
      });
    });
    
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-backup-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        deleteFromBackupHistory(index);
      });
    });
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function deleteFromBackupHistory(index) {
  if (!confirm('确定要删除这条备份记录吗？')) {
    return;
  }
  
  chrome.storage.local.get(['backupHistory'], function(result) {
    let history = result.backupHistory || [];
    
    if (index >= 0 && index < history.length) {
      history.splice(index, 1);
      
      chrome.storage.local.set({backupHistory: history}, function() {
        showMessage('备份记录已删除', 'success');
        loadBackupHistory();
        updateStats();
      });
    }
  });
}

function restoreFromBackupHistory(index) {
  chrome.storage.local.get(['backupHistory'], function(result) {
    const history = result.backupHistory || [];
    
    if (index < 0 || index >= history.length) {
      showMessage('备份记录不存在', 'error');
      return;
    }
    
    const backup = history[index];
    
    if (!confirm(`确定要恢复到 ${new Date(backup.time).toLocaleString('zh-CN')} 的备份吗？这将覆盖当前所有设置。`)) {
      return;
    }
    
    // 从WebDAV恢复指定的备份
    chrome.storage.sync.get(['webdavSettings'], function(syncResult) {
      const settings = syncResult.webdavSettings;
      
      if (!settings || !settings.url) {
        showMessage('WebDAV设置不完整，无法恢复', 'error');
        return;
      }
      
      showWebDAVStatus('正在从备份恢复...', 'info');
      
      downloadFromWebDAV(settings)
        .then(configData => {
          try {
            const config = JSON.parse(configData);
            
            if (!validateConfig(config)) {
              throw new Error('备份文件格式不正确');
            }
            
            // 恢复配置
            chrome.storage.sync.set({
              platforms: config.platforms || [],
              enabledSites: config.enabledSites || [],
              webdavSettings: config.webdavSettings || {}
            }, function() {
              showWebDAVStatus('从备份恢复成功！', 'success');
              showMessage('配置已从备份恢复', 'success');
              
              // 重新加载页面数据
              loadPlatforms();
              loadSites();
              loadWebDAVSettings();
              updateStats();
            });
            
          } catch (error) {
            showWebDAVStatus(`恢复失败: ${error.message}`, 'error');
            showMessage('备份文件解析失败', 'error');
          }
        })
        .catch(error => {
          showWebDAVStatus(`恢复失败: ${error.message}`, 'error');
          showMessage('从WebDAV恢复失败', 'error');
        });
    });
  });
}

function checkAutoBackup() {
  chrome.storage.sync.get(['webdavSettings'], function(result) {
    const settings = result.webdavSettings;
    
    if (settings && settings.autoBackup && settings.url) {
      // 检查上次备份时间
      chrome.storage.local.get(['lastAutoBackup'], function(localResult) {
        const lastBackup = localResult.lastAutoBackup;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24小时
        
        if (!lastBackup || (now - lastBackup) > oneDay) {
          // 执行自动备份
          performAutoBackup();
        }
      });
    }
  });
}

function performAutoBackup() {
  chrome.storage.sync.get(['platforms', 'enabledSites', 'webdavSettings'], function(result) {
    const settings = result.webdavSettings;
    
    if (!settings || !settings.url) return;
    
    const config = {
      platforms: result.platforms || [],
      enabledSites: result.enabledSites || [],
      webdavSettings: result.webdavSettings || {},
      exportTime: new Date().toISOString(),
      version: getManifestVersion(),
      autoBackup: true
    };
    
    const configData = JSON.stringify(config, null, 2);
    
    uploadToWebDAV(settings, configData)
      .then(() => {
        // 更新最后备份时间
        chrome.storage.local.set({lastAutoBackup: Date.now()});
        console.log('自动备份完成');
      })
      .catch(error => {
        console.error('自动备份失败:', error);
      });
  });
}

// 简单的加密/解密函数
function encryptPassword(password) {
  if (!password) return '';
  return btoa(password); // 使用base64编码，简单加密
}

function decryptPassword(encryptedPassword) {
  if (!encryptedPassword) return '';
  try {
    return atob(encryptedPassword); // base64解码
  } catch (e) {
    return encryptedPassword; // 如果解码失败，返回原值（兼容旧数据）
  }
}
