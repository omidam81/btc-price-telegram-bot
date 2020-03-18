
var telegram = require('telegram-bot-api');
var fs = require('fs');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)


db.defaults({ chats: [] })
    .write()

var CronJob = require('cron').CronJob;
const axios = require('axios');
const config = {
    usd_try_url: 'https://api.ratesapi.io/api/latest?base=USD&symbols=TRY',
    TRY_USD: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
    TRY_IR: 'http://api.navasan.net/latest/?item=try_hav&api_key=zgnH6pRQLkUxc6dIhSezXetz3DS15uPF',


    rates: {},
    BTCUSD: '5300',
    BTCLYR: '50000',
    TRYRLS: '',
    BTCRYS: '2340294029834'
}

var job = new CronJob('*/10 * * * * *', function () {
    axios.get(config.usd_try_url)
        .then(function (response) {
            // handle success
            config.rates = response.data.rates;
        })
        .catch(function (error) {
            // handle error
            console.log("error");
        })
}, null, true, 'America/Los_Angeles', null, true);
job.start();


var job2 = new CronJob('*/10 * * * * *', function () {
    axios.get(config.TRY_USD)
        .then(function (response) {
            config.BTCUSD = response.data.price;
            config.BTCLYR = config.BTCUSD * config.rates.TRY;
        })
        .catch(function (error) {
            console.log("error");
        })
}, null, true, 'America/Los_Angeles', null, true);
job2.start();


var job3 = new CronJob('0 0 */1 * * *', function () {
    axios.get(config.TRY_IR)
        .then(function (response) {
            config.TRYRLS = response.data.try_hav.value; //response.data[0].value;
            config.BTCRYS = config.BTCLYR * config.TRYRLS;
        })
        .catch(function (error) {
            console.log("error", error);
        })
}, null, true, 'America/Los_Angeles', null, true);
job3.start();

/////////
////////Telegram part

//DB


function formatMoney(number, decPlaces, decSep, thouSep) {
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSep = typeof decSep === "undefined" ? "." : decSep;
    thouSep = typeof thouSep === "undefined" ? "," : thouSep;
    var sign = number < 0 ? "-" : "";
    var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
    var j = (j = i.length) > 3 ? j % 3 : 0;

    return sign +
        (j ? i.substr(0, j) + thouSep : "") +
        i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
        (decPlaces ? decSep + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
}



var api = new telegram({
    token: '900942268:AAHTk6LeG2OYiJtNtiHzdW5Ew-5B4I8aXwg',
    updates: {
        enabled: true
    }
});


//904644860:AAEnTWXOySP8iyeEVCtp4sorn_j_bE28ui4


api.on('message', function (message) {
    console.log("xxxxx");
    var id = db.get('chats')
        .find({ id: message.chat.id })
        .value()
    if (!id)
        db.get('chats')
            .push({ id: message.chat.id })
            .write()



    let text = `
        Orginial Price (from websites)
        BTC TO USD :  ${formatMoney(config.BTCUSD, 2, ".", ",")}
        BTC TO TRY : ${formatMoney(config.BTCLYR, 2, ".", ",")}
        BTC TO Toman : ${formatMoney(config.BTCRYS, 2, ".", ",")}
    `;

    text += `
Price with comission: 

        BTC TO USD :  USD${formatMoney(config.BTCUSD * 1.04, 2, ".", ",")}
        BTC TO TRY : ${formatMoney(config.BTCLYR * 1.04, 2, ".", ",")}
        BTC TO Toman : ${formatMoney(config.BTCRYS * 1.04, 2, ".", ",")}
    `


    var items = db.get('chats')
        .map('id')
        .value()
    for (var i in items) {
        api.sendMessage({
            chat_id: items[i],
            text: text
        }, {
            "parse_mode": 'HTML'
        });
    }
});


