/* dependencies */
var express  = require('express')
  , partials = require('express-partials')
  , assets   = require('connect-assets')
  , app      = express();

/* settings */
app
  .set('port', process.env.PORT || 3000)
  .set('views', __dirname + '/views')
  .set('view engine', 'ejs')
  .use(express.favicon())
  .use(express.bodyParser())
  .use(express.methodOverride())
  .use(express.cookieParser('roar'))
  .use(express.session({secret : 'secrets'}))
  .use(express.static(__dirname + '/public'))
  .use(partials())
  .use(assets())
  .configure('development', function(){
    app.use(express.logger('dev'))
      .use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  })
  .configure('production', function(){
    app.use(express.logger())
      .use(express.errorHandler());
  })
  .use(app.router);

/* routes */
app.get('/', function(req, res){
  res.render('index', {
    javascripts: ['globe','client']
  });
});

/* server */
var server = app.listen(app.get('port'), function(){
  var hello = [
    'Earth Tweets server',
    '\nport : ' + app.get('port'),
    '\nenv  : ' + app.settings.env,
    '\nlistening...'
  ];
  console.log(hello[0], hello[1], hello[2], hello[3]);
});

/* socket */
var socket = require('./socket').listen(server);
