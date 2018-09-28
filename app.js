var express = require('express')
var app = express()
const Image = require('./index')

// 跨域处理
const crossDomain = (req, res, next) => {
    var allowedOrigins = ['https://ldsun.com', 'https://www.ldsun.com', 'null'];
    var origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next()
}

app.use(crossDomain)

app.get('/bing/:option/:count', function (req, res) {

    let {
        option,
        count
    } = req.params
    Image.bing(option, count)
        .then(result => {
            res.json({
                status: 1,
                data: result
            })
        })
        .catch(error => {
            res.json({
                status: 0,
                data: null
            })
        })

})

app.get('/chrome/:count', function (req, res) {
    let count = req.params.count
    Image.chrome(count)
        .then(result => {
            res.json({
                status: 1,
                data: result
            })
        })
        .catch(error => {
            res.json({
                status: 0,
                data: null
            })
        })
})

app.get('/windows/:count', function (req, res) {
    let count = req.params.count
    Image.windows(count)
        .then(result => {
            res.json({
                status: 1,
                data: result
            })
        })
        .catch(error => {
            res.json({
                status: 0,
                data: null
            })
        })
})

app.listen(3000)