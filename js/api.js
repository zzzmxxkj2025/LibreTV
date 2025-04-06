// 改进的API请求处理函数
async function handleApiRequest(url) {
    const customApi = url.searchParams.get('customApi') || '';
    const source = url.searchParams.get('source') || 'heimuer';
    
    try {
        if (url.pathname === '/api/search') {
            const searchQuery = url.searchParams.get('wd');
            if (!searchQuery) {
                throw new Error('缺少搜索参数');
            }
            
            // 验证API和source的有效性
            if (source === 'custom' && !customApi) {
                throw new Error('使用自定义API时必须提供API地址');
            }
            
            if (!API_SITES[source] && source !== 'custom') {
                throw new Error('无效的API来源');
            }
            
            const apiUrl = customApi
                ? `${customApi}${API_CONFIG.search.path}${encodeURIComponent(searchQuery)}`
                : `${API_SITES[source].api}${API_CONFIG.search.path}${encodeURIComponent(searchQuery)}`;
            
            // 添加超时处理
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
                    headers: API_CONFIG.search.headers,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status}`);
                }
                
                const data = await response.json();
                
                // 检查JSON格式的有效性
                if (!data || !Array.isArray(data.list)) {
                    throw new Error('API返回的数据格式无效');
                }
                
                return JSON.stringify({
                    code: 200,
                    list: data.list || [],
                });
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        }

        if (url.pathname === '/api/detail') {
            const id = url.searchParams.get('id');
            if (!id) {
                throw new Error('缺少视频ID参数');
            }
            
            // 验证ID格式 - 只允许数字和有限的特殊字符
            if (!/^[\w-]+$/.test(id)) {
                throw new Error('无效的视频ID格式');
            }

            // 验证API和source的有效性
            if (source === 'custom' && !customApi) {
                throw new Error('使用自定义API时必须提供API地址');
            }
            
            if (!API_SITES[source] && source !== 'custom') {
                throw new Error('无效的API来源');
            }

            const detailUrl = customApi
                ? `${customApi}${API_CONFIG.detail.path}${id}.html`
                : `${API_SITES[source].detail}${API_CONFIG.detail.path}${id}.html`;
            
            // 添加超时处理
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await fetch(PROXY_URL + encodeURIComponent(detailUrl), {
                    headers: API_CONFIG.detail.headers,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`详情请求失败: ${response.status}`);
                }
                
                const html = await response.text();
                if (!html || html.length < 100) {
                    throw new Error('获取到的详情内容无效');
                }
                
                const matches = html.match(M3U8_PATTERN) || [];
                
                // 改进的URL清理
                const cleanUrls = matches.map(link => {
                    try {
                        // 去除各种引号和前缀
                        let cleanLink = link.replace(/^\$/, '')
                                           .replace(/^["']+/, '')
                                           .replace(/["']+$/, '');
                        
                        // 处理可能嵌在括号中的URL
                        if (cleanLink.includes('(') && cleanLink.includes(')')) {
                            cleanLink = cleanLink.split(')')[0].split('(').pop();
                        }
                        
                        // 确保链接是http或https开头
                        return (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) ? cleanLink : '';
                    } catch (e) {
                        return '';
                    }
                }).filter(link => link); // 过滤掉空URL

                return JSON.stringify({
                    code: 200,
                    episodes: cleanUrls,
                    detailUrl: detailUrl,
                });
            } catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        }

        throw new Error('未知的API路径');
    } catch (error) {
        console.error('API处理错误:', error);
        return JSON.stringify({
            code: 400,
            msg: error.message || '请求处理失败',
            list: [],
            episodes: [],
        });
    }
}

// 拦截API请求
(function() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
        const requestUrl = typeof input === 'string' ? new URL(input, window.location.origin) : input.url;
        
        if (requestUrl.pathname.startsWith('/api/')) {
            try {
                const data = await handleApiRequest(requestUrl);
                return new Response(data, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    code: 500,
                    msg: '服务器内部错误',
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
        }
        
        // 非API请求使用原始fetch
        return originalFetch.apply(this, arguments);
    };
})();

async function testSiteAvailability(source) {
    try {
        // 避免传递空的自定义URL
        const apiParams = source === 'custom' && customApiUrl
            ? '&customApi=' + encodeURIComponent(customApiUrl)
            : source === 'custom'
                ? '' // 如果是custom但没有URL，返回空字符串
                : '&source=' + source;
        
        // 如果是custom但没有URL，直接返回false
        if (source === 'custom' && !customApiUrl) {
            return false;
        }
        
        // 使用更简单的测试查询
        const response = await fetch('/api/search?wd=test' + apiParams, {
            // 添加超时
            signal: AbortSignal.timeout(5000)
        });
        
        // 检查响应状态
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        
        // 检查API响应的有效性
        return data && data.code !== 400 && Array.isArray(data.list);
    } catch (error) {
        console.error('站点可用性测试失败:', error);
        return false;
    }
}
