// 全局变量
let currentApiSource = localStorage.getItem('currentApiSource') || 'heimuer';
let customApiUrl = localStorage.getItem('customApiUrl') || '';

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化时检查是否使用自定义接口
    if (currentApiSource === 'custom') {
        document.getElementById('customApiInput').classList.remove('hidden');
        document.getElementById('customApiUrl').value = customApiUrl;
    }

    // 设置 select 的默认选中值
    document.getElementById('apiSource').value = currentApiSource;

    // 初始化显示当前站点代码
    document.getElementById('currentCode').textContent = currentApiSource;
    
    // 初始化显示当前站点状态（使用优化后的测试函数）
    updateSiteStatusWithTest(currentApiSource);
    
    // 渲染搜索历史
    renderSearchHistory();
    
    // 设置事件监听器
    setupEventListeners();
});

// 带有超时和缓存的站点可用性测试
async function updateSiteStatusWithTest(source) {
    // 显示加载状态
    document.getElementById('siteStatus').innerHTML = '<span class="text-gray-500">●</span> 测试中...';
    
    // 检查缓存中是否有有效的测试结果
    const cacheKey = `siteStatus_${source}_${customApiUrl || ''}`;
    const cachedResult = localStorage.getItem(cacheKey);
    
    if (cachedResult) {
        try {
            const { isAvailable, timestamp } = JSON.parse(cachedResult);
            // 缓存有效期为1小时
            if (Date.now() - timestamp < 3600000) {
                updateSiteStatus(isAvailable);
                return;
            }
        } catch (e) {
            // 忽略解析错误，继续测试
            console.error('缓存数据解析错误:', e);
        }
    }
    
    // 使用 Promise.race 添加超时处理
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('测试超时')), 8000)
        );
        
        const testPromise = testSiteAvailability(source);
        const isAvailable = await Promise.race([testPromise, timeoutPromise]);
        
        // 更新UI状态
        updateSiteStatus(isAvailable);
        
        // 缓存测试结果
        localStorage.setItem(cacheKey, JSON.stringify({
            isAvailable,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('站点测试错误:', error);
        updateSiteStatus(false);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // API源选择变更事件
    document.getElementById('apiSource').addEventListener('change', async function(e) {
        currentApiSource = e.target.value;
        const customApiInput = document.getElementById('customApiInput');
        
        if (currentApiSource === 'custom') {
            customApiInput.classList.remove('hidden');
            customApiUrl = document.getElementById('customApiUrl').value;
            localStorage.setItem('customApiUrl', customApiUrl);
            // 自定义接口不立即测试可用性
            document.getElementById('siteStatus').innerHTML = '<span class="text-gray-500">●</span> 待测试';
        } else {
            customApiInput.classList.add('hidden');
            // 非自定义接口立即测试可用性
            showToast('正在测试站点可用性...', 'info');
            updateSiteStatusWithTest(currentApiSource);
        }
        
        localStorage.setItem('currentApiSource', currentApiSource);
        document.getElementById('currentCode').textContent = currentApiSource;
        
        // 清理搜索结果并重置搜索区域
        resetSearchArea();
    });

    // 自定义接口输入框事件
    document.getElementById('customApiUrl').addEventListener('blur', async function(e) {
        customApiUrl = e.target.value;
        localStorage.setItem('customApiUrl', customApiUrl);
        
        if (currentApiSource === 'custom' && customApiUrl) {
            showToast('正在测试接口可用性...', 'info');
            const isAvailable = await testSiteAvailability('custom');
            updateSiteStatus(isAvailable);
            
            if (!isAvailable) {
                showToast('接口不可用，请检查地址是否正确', 'error');
            } else {
                showToast('接口可用', 'success');
            }
        }
    });

    // 回车搜索
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            search();
        }
    });

    // 点击外部关闭设置面板
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('settingsPanel');
        const settingsButton = document.querySelector('button[onclick="toggleSettings(event)"]');
        
        if (!panel.contains(e.target) && !settingsButton.contains(e.target) && panel.classList.contains('show')) {
            panel.classList.remove('show');
        }
    });
}

// 重置搜索区域
function resetSearchArea() {
    // 清理搜索结果
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';
    
    // 恢复搜索区域的样式
    document.getElementById('searchArea').classList.add('flex-1');
    document.getElementById('searchArea').classList.remove('mb-8');
    document.getElementById('resultsArea').classList.add('hidden');
}

// 搜索功能
async function search() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        showToast('请输入搜索内容', 'info');
        return;
    }
    
    showLoading();
    const apiParams = currentApiSource === 'custom' 
        ? '&customApi=' + encodeURIComponent(customApiUrl)
        : '&source=' + currentApiSource;
    
    try {
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch('/api/search?wd=' + encodeURIComponent(query) + apiParams, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.code === 400) {
            showToast(data.msg || '搜索失败，请检查网络连接或更换数据源', 'error');
            return;
        }
        
        // 保存搜索历史
        saveSearchHistory(query);
        
        // 显示结果区域，调整搜索区域
        document.getElementById('searchArea').classList.remove('flex-1');
        document.getElementById('searchArea').classList.add('mb-8');
        document.getElementById('resultsArea').classList.remove('hidden');
        
        const resultsDiv = document.getElementById('results');
        
        if (!data.list || data.list.length === 0) {
            resultsDiv.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">没有找到相关内容</div>';
            return;
        }
        
        // 添加XSS保护，使用textContent和属性转义
        resultsDiv.innerHTML = data.list.map(item => {
            const safeId = item.vod_id ? item.vod_id.toString().replace(/[^\w-]/g, '') : '';
            const safeName = (item.vod_name || '').toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            
            return `
                <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer p-6 h-fit" 
                     onclick="showDetails('${safeId}','${safeName}')">
                    <h3 class="text-xl font-semibold mb-3">${safeName}</h3>
                    <p class="text-gray-400 text-sm mb-2">${(item.type_name || '').toString().replace(/</g, '&lt;')}</p>
                    <p class="text-gray-400 text-sm">${(item.vod_remarks || '').toString().replace(/</g, '&lt;')}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('搜索错误:', error);
        if (error.name === 'AbortError') {
            showToast('搜索请求超时，请检查网络连接', 'error');
        } else {
            showToast('搜索请求失败，请稍后重试', 'error');
        }
    } finally {
        hideLoading();
    }
}

// 显示详情
async function showDetails(id, vod_name) {
    if (!id) {
        showToast('视频ID无效', 'error');
        return;
    }
    
    showLoading();
    try {
        const apiParams = currentApiSource === 'custom' 
            ? '&customApi=' + encodeURIComponent(customApiUrl)
            : '&source=' + currentApiSource;
        
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch('/api/detail?id=' + encodeURIComponent(id) + apiParams, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = vod_name || '未知视频';
        
        if (data.episodes && data.episodes.length > 0) {
            // 安全处理集数URL
            const safeEpisodes = data.episodes.map(url => {
                try {
                    // 确保URL是有效的并且是http或https开头
                    return url && (url.startsWith('http://') || url.startsWith('https://'))
                        ? url.replace(/"/g, '&quot;')
                        : '';
                } catch (e) {
                    return '';
                }
            }).filter(url => url); // 过滤掉空URL
            
            if (safeEpisodes.length === 0) {
                modalContent.innerHTML = '<p class="text-center text-gray-400 py-8">没有找到可用的播放链接</p>';
            } else {
                modalContent.innerHTML = `
                    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        ${safeEpisodes.map((episode, index) => `
                            <button onclick="playVideo('${episode}','${vod_name.replace(/"/g, '&quot;')}')" 
                                    class="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#333] hover:border-white rounded-lg transition-colors text-center">
                                第${index + 1}集
                            </button>
                        `).join('')}
                    </div>
                `;
            }
        } else {
            modalContent.innerHTML = '<p class="text-center text-gray-400 py-8">没有找到可播放的视频</p>';
        }
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('获取详情错误:', error);
        if (error.name === 'AbortError') {
            showToast('获取详情超时，请检查网络连接', 'error');
        } else {
            showToast('获取详情失败，请稍后重试', 'error');
        }
    } finally {
        hideLoading();
    }
}

// 播放视频
function playVideo(url, vod_name) {
    if (!url) {
        showToast('无效的视频链接', 'error');
        return;
    }
    
    showLoading();
    const modalContent = document.getElementById('modalContent');
    const modalTitle = document.getElementById('modalTitle');
    let episodeNumber = '1';
    
    try {
        // 获取当前点击的按钮中的集数
        if (event && event.target) {
            episodeNumber = event.target.textContent.replace(/[^0-9]/g, '') || '1';
        }
        
        // 安全处理URL和标题
        const safeUrl = encodeURIComponent(url);
        const safeTitle = vod_name ? vod_name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '未知视频';
        
        // 更新标题显示
        modalTitle.textContent = safeTitle + " - 第" + episodeNumber + "集";
        
        // 先移除现有的视频播放器（如果存在）
        const existingPlayer = modalContent.querySelector('.video-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }
        
        // 当前HTML内容
        const currentHtml = modalContent.innerHTML;
        
        // 如果是第一次播放，保存集数列表
        if (!modalContent.querySelector('.episodes-list')) {
            modalContent.innerHTML = `
                <div class="space-y-6">
                    <div class="video-player">
                        <iframe 
                            src="${HOPLAYER_URL}?url=${safeUrl}&autoplay=true"
                            width="100%" 
                            height="600" 
                            frameborder="0" 
                            scrolling="no" 
                            allowfullscreen="true"
                            onload="hideLoading()"
                            onerror="handlePlayerError()">
                        </iframe>
                    </div>
                    <div class="episodes-list mt-6">
                        ${currentHtml}
                    </div>
                </div>
            `;
        } else {
            // 如果已经有集数列表，只更新视频播放器
            const episodesList = modalContent.querySelector('.episodes-list');
            if (episodesList) {
                modalContent.innerHTML = `
                    <div class="space-y-6">
                        <div class="video-player">
                            <iframe 
                                src="${HOPLAYER_URL}?url=${safeUrl}&autoplay=true"
                                width="100%" 
                                height="600" 
                                frameborder="0" 
                                scrolling="no" 
                                allowfullscreen="true"
                                onload="hideLoading()"
                                onerror="handlePlayerError()">
                            </iframe>
                        </div>
                        <div class="episodes-list mt-6">
                            ${episodesList.innerHTML}
                        </div>
                    </div>
                `;
            } else {
                // 如果找不到episodes-list元素，重新创建
                modalContent.innerHTML = `
                    <div class="space-y-6">
                        <div class="video-player">
                            <iframe 
                                src="${HOPLAYER_URL}?url=${safeUrl}&autoplay=true"
                                width="100%" 
                                height="600" 
                                frameborder="0" 
                                scrolling="no" 
                                allowfullscreen="true"
                                onload="hideLoading()"
                                onerror="handlePlayerError()">
                            </iframe>
                        </div>
                        <div class="episodes-list mt-6">
                            ${currentHtml}
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('播放器加载错误:', error);
        hideLoading();
        showToast('视频播放加载失败，请检查链接或稍后重试', 'error');
    }
}

// 处理播放器加载错误
function handlePlayerError() {
    hideLoading();
    showToast('视频播放加载失败，请尝试其他视频源', 'error');
}
