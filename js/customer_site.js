const CUSTOMER_SITES = {
    qiqi: {
        api: 'https://www.qiqidys.com/api.php/provide/vod',
        name: '七七资源',
    },
	dyttzy: {
        api: 'http://caiji.dyttzyapi.com/api.php/provide/vod',
        name: '电影天堂',
     },
    bfzy: {
        api: 'https://bfzyapi.com/api.php/provide/vod',
        name: '暴风资源'
     },	 
	         tyyszy: {
            api: 'https://tyyszy.com/api.php/provide/vod',
            name: '天涯资源',
        },
        ffzy: {
            api: 'https://api.ffzyapi.com/api.php/provide/vod',
            name: '非凡影视',
        },
        zy360: {
            api: 'https://360zy.com/api.php/provide/vod',
            name: 'zy360资源',
        },
        maotaizy: {
            api: 'https://caiji.maotaizy.cc/api.php/provide/vod',
            name: '茅台资源',
        },
        wolong: {
            api: 'https://wolongzyw.com/api.php/provide/vod',
            name: '卧龙资源',
        },
        jisu: {
            api: 'https://jszyapi.com/api.php/provide/vod',
            name: '极速资源',
        },
        dbzy: {
            api: 'https://dbzy.tv/api.php/provide/vod',
            name: '豆瓣资源',
        },
        mozhua: {
            api: 'https://mozhuazy.com/api.php/provide/vod',
            name: '魔爪资源',
        },
        mdzy: {
            api: 'https://www.mdzyapi.com/api.php/provide/vod',
            name: '魔都资源',
        },
        zuid: {
            api: 'https://api.zuidapi.com/api.php/provide/vod',
            name: '最大资源',
        },
        yinghua: {
            api: 'https://m3u8.apiyhzy.com/api.php/provide/vod',
            name: '樱花资源',
        },
        wujin: {
            api: 'https://api.wujinapi.me/api.php/provide/vod',
            name: '无尽资源',
        },
        wwzy: {
            api: 'https://wwzy.tv/api.php/provide/vod',
            name: '旺旺短剧',
        },
        ikun: {
            api: 'https://ikunzyapi.com/api.php/provide/vod',
            name: 'iKun资源',
        },
        lzi: {
            api: 'https://cj.lziapi.com/api.php/provide/vod',
            name: '量子资源',
        },
        bdzy: {
            api: 'https://api.apibdzy.com/api.php/provide/vod',
            name: '百度资源',
        },
        hongniuzy: {
            api: 'https://www.hongniuzy2.com/api.php/provide/vod',
            name: '红牛资源',
        },
        xinlangaa: {
            api: 'https://api.xinlangapi.com/xinlangapi.php/provide/vod',
            name: '新浪资源',
        },
        ckzy: {
            api: 'https://ckzy.me/api.php/provide/vod',
            name: 'CK资源',
        },
        ukuapi: {
            api: 'https://api.ukuapi.com/api.php/provide/vod',
            name: 'U酷资源',
        },
        y1080zyk: {
            api: 'https://api.1080zyku.com/inc/apijson.php/,
            name: 'y1080资源',
        },
        hhzyapi: {
            api: 'https://hhzyapi.com/api.php/provide/vod',
            name: '豪华资源',
        },
        subocaiji: {
            api: 'https://subocaiji.com/api.php/provide/vod',
            name: '速博资源',
        },
        p2100: {
            api: 'https://p2100.net/api.php/provide/vod',
            name: '飘零资源',
        },
        aqyzy: {
            api: 'https://iqiyizyapi.com/api.php/provide/vod',
            name: '爱奇艺',
        },
        yzzy: {
            api: 'https://api.yzzy-api.com/inc/apijson.php,
            name: '优质资源',
        },
        myzy: {
            api: 'https://api.maoyanapi.top/api.php/provide/vod',
            name: '猫眼资源',
        },
        rycj: {
            api: 'https://cj.rycjapi.com/api.php/provide/vod',
            name: '如意资源',
        },
        jinyingzy: {
            name: '金鹰点播',
            api: 'https://jinyingzy.com/api.php/provide/vod',
        },
        guangsuapi: {
            api: 'https://api.guangsuapi.com/api.php/provide/vod',
            name: '光速资源',
        }
};

// 调用全局方法合并
if (window.extendAPISites) {
    window.extendAPISites(CUSTOMER_SITES);
} else {
    console.error("错误：请先加载 config.js！");
}
