var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var app = express();
var TOKEN = process.env.TOKEN || '';
var PORT = process.env.PORT || 3000;

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', function (req, res) {
    var token = req.query.token;
    var q = req.query.text;
    res.type('text/plain');

    if (token !== TOKEN) {
        res.send('SEA Source, Scorch, Scorch. FLATLINED, bitch. (invalid token)');
    } else if (!q || !q.length) {
        res.send('You have to tell me what to look for, mate.');
    } else {
        request('http://netrunnerdb.com/find/?q=' + q, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = substitute(body);
                var $ = cheerio.load(body);
                var panel = $('.panel');
                var matches = $('[data-th="Title"]');
                var flavor;

                if (panel && panel.length === 1) {
                    res.write('*' + clean(panel.find('.panel-heading').text()).replace('♦', '◆') + '*\n');
                    res.write(clean(panel.find('.card-info').text()) + '\n');
                    panel.find('.card-text p').each(function (i, p) {
                        res.write('> ' + clean($(p).text()) + '\n');
                    });
                    flavor = clean(panel.find('.card-flavor').text());
                    if (flavor.length) res.write('_' + flavor + '_\n');
                    res.write(clean(panel.find('.card-illustrator').text()) + '\n');
                    res.write(panel.find('a.card-title').attr('href'));
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

app.listen(PORT);
console.info('Listening on port %s', PORT);

function clean (s) {
    return s.replace(/\s\s+/g, ' ').trim();
}

function substitute (body) {
    body = body.replace('<span class="icon icon-click"></span>', '[click]');
    body = body.replace('<span class="icon icon-credit"></span>', '[credit]');
    body = body.replace('<span class="icon icon-trash"></span>', '[trash]');
    body = body.replace('<span class="icon icon-link"></span>', '[link]');
    body = body.replace('<span class="icon icon-mu"></span>', '[mu]');
    body = body.replace('<strong>', '*');
    body = body.replace('</strong>', '*');
    return body;
}
