var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var app = express();
var _TOKEN = 's0dnQ0ZUvq89CD8LlLPUOOSG';

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', function (req, res) {
    var token = req.query.token;
    var q = req.query.text;
    res.type('text/plain');

    if (token !== _TOKEN) {
        res.send('SEA Source, Scorch, Scorch. FLATLINED, bitch. (invalid token)');
    } else if (!q || !q.length) {
        res.send('You have to tell me what to look for, fool.');
    } else {
        request('http://netrunnerdb.com/find/?q=' + q, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                var panel = $('.panel');
                var matches = $('[data-th="Title"]');

                if (panel && panel.length === 1) {
                    panel.text().split('\n').map(function (s) {
                        return s.trim().replace('\t', '').replace(/\s\s+/g, ' ');
                    }).filter(function (s) {
                        return s.length > 0;
                    }).map(function (s) {
                        res.write(s);
                        res.write('\n');
                    });
                } else if (matches.length) {
                    res.write('Multiple cards matched your search:');
                    res.write('\n\n');
                    matches.text().split('\n').map(function (s) {
                        return s.trim().replace('\t', '').replace(/\s\s+/g, ' ');
                    }).filter(function (s) {
                        return s.length > 0;
                    }).map(function (s) {
                        res.write('  • ' + s);
                        res.write('\n');
                    });
                } else {
                    res.write('You access R&D and see nothing of interest. (no matches)');
                }
            }
            res.end();
        });
    }
});

app.listen(3030);
console.info('Listening on port %s', 3030);
