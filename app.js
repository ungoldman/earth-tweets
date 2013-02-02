/* dependencies */
var express  = require('express'),
    assets   = require('connect-assets'),
    infos    = require('./package.json'),
    app      = express()

/* settings */
app
  .set('port', process.env.PORT || process.env.VCAP_APP_PORT || 3000)
  .set('views', __dirname + '/views')
  .set('view engine', 'ejs')
  .use(express.favicon())
  .use(express.bodyParser())
  .use(express.methodOverride())
  .use(express.static(__dirname + '/public'))
  .use(assets())
  .configure('development', function(){
    app.use(express.logger('dev'))
      .use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
      }))
  })
  .configure('production', function(){
    app.use(express.logger()).use(express.errorHandler())
  })
  .use(app.router)

/* routes */
app.get('/', function(req, res) { res.render('index') })

/* server */
var server = app.listen(app.get('port'), function(){
  [
    'Earth Tweets ' + infos.version,
    'port : ' + app.get('port'),
    'env  : ' + app.settings.env,
    '[√] express server ready'
  ]
  .forEach(function(str){ console.log(str) })

  /* socket */
  var socket = require('./socket').listen(server)
})
