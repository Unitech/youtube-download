
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var request = require('request');
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
 
    var url ='http://gdata.youtube.com/feeds/api/playlists/' + req.query.pl + '?v=2&alt=jsonc&p=2&max-results=' + req.query.results;
    
    if (req.query.start != undefined && req.query.start > 0)
	url += '&start-index=' + req.query.start;

    console.log(url);
    req.pipe(request(url)).pipe(res);
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
