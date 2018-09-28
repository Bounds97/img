/**
 * Download wallpapers from Bing, Chromecast and Spotlight
 */
const request = require("request");
const moment = require("moment")

/**
 * 获取Bing图片
 * @param {string} option random:随机，latest:最新
 * @param {number} count 返回图片的数量
 */
const getBingImg = async (option = 'random', count = 1) => {
    if (option && !isNaN(Number(option))) return
    if (count && (count < 1 || count > 15)) return
    if (isNaN(Number(count))) return

    let images, latest = false
    if (option == 'latest' && count < 8) {
        images = fetchBingImg('latest')
        latest = true
    } else images = fetchBingImg()


    try {
        var result = await images
    } catch (error) {
        console.error('fetch Bing img error', error)
        return
    }

    let img = result
    if (!latest) img = result[0].concat(result[1])
    if (option == 'random') {
        // 随机返回图片
        let randomNum = () => Math.floor(Math.random() * 15)
        if (count == 1) return img[randomNum()].url
        else {
            let imgArr = []
            for (let i = count; i > 0; i--) {
                imgArr.push(img[randomNum()])
            }
            return imgArr.map(item => item.url)
        }
    } else {
        // 排序后返回最新的count张图片
        img.sort((a, b) => b.startdate - a.startdate)
        if (count == 1) return img[0].url
        else return img.splice(0, count).map(item => item.url)
    }

}

/**
 * 请求获取图片列表
 * @param {string} option 
 */
const fetchBingImg = (option = 'all') => {
    // url = "http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=de-DE";
    // format: js返回JSON，xml返回xml
    // idx 最大为7，指图片距今天的天数，即最多返回七天前的图片
    // n 最大为8，指每次返回的图片数，为距今日idx天之前的那天，再往前数8天的图片
    // 即总共能获取到15张图片

    let latestUrl = "http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=7&mkt=de-DE";
    let soonestUrl = "http://www.bing.com/HPImageArchive.aspx?format=js&idx=7&n=8&mkt=de-DE";

    let options = {
        method: 'GET',
        url: latestUrl,
        headers: {
            'content-type': 'application/json'
        }
    };

    let fetchLatest = () => new Promise((resolve, reject) => {
        options.url = latestUrl
        request(options, (error, response, body) => {
            if (error) return reject(error);
            let result = JSON.parse(body)
            result.images.forEach(item => {
                item.url = `https://www.bing.com${item.url}`
            })
            //console.log('fetchLatest success', images);
            return resolve(result.images)
        });
    })

    let fetchSoonest = () => new Promise((resolve, reject) => {
        options.url = soonestUrl
        request(options, (error, response, body) => {
            if (error) return reject(error);
            let result = JSON.parse(body)
            result.images.forEach(item => {
                item.url = `https://www.bing.com${item.url}`
            })
            //console.log('fetchSoonest success', images);
            return resolve(result.images)
        });
    })

    if (option == 'all') {
        return Promise.all([fetchLatest(), fetchSoonest()])
    } else {
        return fetchLatest()
    }

}



/**
 * 获取chromecastHome图片
 * @param {number} count 图片数量
 * 参考：
 * https://github.com/KoalaBR/spotlight
 * https://github.com/dconnolly/chromecast-backgrounds
 */
const getChromecastImg = (count = 1) => {
    if (count < 0) return
    let chromecastHomeURL = 'https://clients3.google.com/cast/chromecast/home';
    return new Promise((resolve, reject) => {
        request(chromecastHomeURL, (error, response, body) => {
            if (error) return reject(error)
            //console.log('get Chromecast success');
            let result = parseChromecastHome(body)

            let res
            let randomNum = () => Math.floor(Math.random() * result.length)

            if (count >= result.length) res = result
            else if (count == 1) res = result[randomNum()]
            else {
                let imgArr = []
                for (let i = count; i > 0; i--) {
                    imgArr.push(result[randomNum()])
                }
                res = imgArr
            }
            return resolve(res)
        });
    })
}

/**
 * 正则匹配解析chromecast页面中的图片数据
 * @param {string} htmlString chromecast页面的HTML
 */
const parseChromecastHome = htmlString => {
    let initJSONStateRegex = /(JSON\.parse\('.+'\))\)\./;
    let matches = htmlString.match(initJSONStateRegex);
    let JSONParse = matches[1];
    let initState = eval(JSONParse); // I don't know why this is ok but JSON.parse fails.
    //let initState = JSON.parse(JSONParse)
    let parsedBackgrounds = [];
    for (let i in initState[0]) {
        //console.log(initState[0][i])
        // author = initState[0][i][1]
        let url = initState[0][i][0]
        parsedBackgrounds.push(url);
    }
    return parsedBackgrounds;
};

/**
 * 随机返回一张一月内的图片
 */
const getSpotlightImg = () => {
    // 随机返回1个月内的图片
    let count = Math.floor(Math.random() * 30)
    let time = moment().subtract(count, 'days').format('YYYYMMDD[T]HHMMSS[Z]');
    return fetchSpotlightImg(time)
}

const fetchSpotlightImg = (time) => {
    // https://arc.msn.com/v3/Delivery/Cache?pid=209567&fmt=json&rafb=0&ua=WindowsShellClient%2F0&disphorzres=9999&dispvertres=9999&lo=80217&pl=en-US&lc=en-US&ctry=us&time=2017-12-31T23:59:59Z
    // pid : Purpose currently unknown
    // fmt : Output format, e.g. json
    // rafb : Purpose currently unknown
    // ua : Client user agent string
    // disphorzres: Screen width in pixels
    // dispvertres: Screen height in pixels
    // lo : Purpose currently uknown
    // pl : Locale, e.g. en-US zh-CN
    // lc : Language, e.g. en-US
    // ctry : Country, e.g. us
    // time : Time, e.g. 2017-12-31T23:59:59Z
    let m_locale = 'zh-CN'
    let url = "https://arc.msn.com/v3/Delivery/Cache?pid=209567&fmt=json&";
    url += "rafb=0&ua=WindowsShellClient%2F0&disphorzres=1920&dispvertres=1080";
    url += "&lo=80217&pl=" + m_locale + "&lc=" + m_locale + "&ctry=de&time=";
    //url += moment().format('YYYYMMDD[T]HHMMSS[Z]');
    url += time;

    var options = {
        method: 'GET',
        url: url,
        headers: {
            'content-type': 'application/json'
        }
    };
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) return reject(error);
            let result = JSON.parse(body)
            result = result.batchrsp.items[0].item
            result = JSON.parse(result)
            let img = result.ad.image_fullscreen_001_landscape.u
            //console.log(typeof result, result);
            return resolve(img)
        });
    })


}

/**
 * 格式化时间，请求chromecast时有用
 */
const formatSpotlightTime = () => {
    let date = new Date()
    let year = date.getFullYear(),
        month = date.getMonth(),
        day = date.getDate(),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        seconds = date.getSeconds()

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

module.exports = {
    bing: getBingImg,
    chrome: getChromecastImg,
    windows: getSpotlightImg
}