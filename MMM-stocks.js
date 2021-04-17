/* Magic Mirror
 * Module: stocks
 *
 * By Alex Yakhnin https://github.com/alexyak & Elan Trybuch https://github.com/elaniobro
 * MIT Licensed.
 */
'use strict';

Module.register('MMM-stocks', { /*eslint-disable-line*/
    result: [],
    // Default module config.
    defaults: {
        apiKey: 'YOUR_KEY_HERE',
        crypto: 'BTCUSDT,LTCUSDT,ETHUSDT',
        separator: '&nbsp;&nbsp;•&nbsp;&nbsp;',
        stocks: 'MSFT,AAPL,GOOG,INTC',
        updateInterval: 60000
    },

    getStyles: function () {
        return ['stocks.css'];
    },

    start: function () {
        this.getStocks();
        this.scheduleUpdate();
    },

    // Override dom generator.
    getDom: function () {
        var wrapper = document.createElement('marquee');
        var count = 0;
        var _this = this;
        var separator = this.config.separator;

        wrapper.className = 'medium bright';

        if (this.result.length > 0) {
            this.result.forEach(function (stock) {
                var symbolElement = document.createElement('span');
                var priceElement = document.createElement('span');
                var changeElement = document.createElement('span');
                var symbol = stock.symbol;
                var lastPrice = stock.latestPrice;
                var changePercentage = stock.changePercent;
                var changeValue = stock.change;


                symbolElement.className = 'stock__stock--symbol';
                priceElement.className = 'stock__stock--price';
                changeElement.className = 'stock__stock--change';
                symbolElement.innerHTML = symbol + ' ';
                wrapper.appendChild(symbolElement);


                priceElement.innerHTML = '$' + _this.formatMoney(lastPrice, 2, '.', ',');


                if (changePercentage > 0) {
                    changeElement.classList += ' up';
                } else {
                    changeElement.classList += ' down';
                }

                var change = Math.abs(changeValue, -2).toFixed(2);

                changeElement.innerHTML = ' ' + change;

                var divider = document.createElement('span');

                if (count < _this.result.length - 1){
                    divider.innerHTML = separator;
                }

                wrapper.appendChild(priceElement);
                wrapper.appendChild(changeElement);
                wrapper.appendChild(divider);
                count++;
            });

        }

        return wrapper;
    },

    formatMoney: function (amount, decimalCount, decimal, thousands) {
        try {
            decimalCount = Math.abs(decimalCount);
            decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

            var negativeSign = amount < 0 ? '-' : '';

            var i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
            var j = (i.length > 3) ? i.length % 3 : 0;

            return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
        } catch (e) {
            throw new Error(e);
        }
    },

    scheduleUpdate: function (delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== 'undefined' && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        setInterval(function () {
            self.getStocks();
        }, nextLoad);
    },

    roundValue: function (value) {
        return Math.round(value * 100) / 100;
    },

    getStocks: function () {
        var requestUrls = [];
        var apiKey =  this.config.apiKey;
        var url = 'https://cloud.iexapis.com/v1/';
        var stocksArray = this.config.stocks.split(',');
        var cryptoArray = this.config.crypto.split(',');

        cryptoArray.forEach(function (stock) {
            var requestUrl = url + 'crypto/' + stock + '/quote?token=' + apiKey;
            requestUrls.push(requestUrl);
        });


        stocksArray.forEach(function (stock) {
            var requestUrl = url + 'stock/' + stock + '/quote?token=' + apiKey;
            requestUrls.push(requestUrl);
        });

        this.sendSocketNotification('GET_STOCKS_MULTI', requestUrls);
    },


    socketNotificationReceived: function (notification, payload) {
        if (notification === 'STOCKS_RESULT') {
            this.result = payload;
            this.updateDom(self.config.fadeSpeed);
        }
    },

});
