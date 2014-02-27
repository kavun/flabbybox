var gulp          = require('gulp');
var gutil         = require('gulp-util');
var pkg           = require('./package.json');
var jshint        = require('gulp-jshint');
var jshintStylish = require('jshint-stylish');
var browserify    = require('gulp-browserify');
var uglify        = require('gulp-uglify');
var header        = require('gulp-header');
var rename        = require('gulp-rename');
var express       = require('express');
var path          = require('path');
var tinylr        = require('tiny-lr');
var livereload    = require('gulp-livereload');

var banner = ['/*!',
	' * <%= pkg.name %> - <%= pkg.description %>',
	' * @author <%= pkg.author %>',
	' * @version v<%= pkg.version %>',
	' * @link <%= pkg.homepage %>',
	' * @license <%= pkg.license %>',
	' */',
	''].join('\n');

var createServers = function (port, lrport) {
	var lr = tinylr();
	lr.listen(lrport, function() {
		gutil.log('LR Listening on', lrport);
	});
	var app = express();
	app.use(express.static(path.resolve('./')));
	app.listen(port, function () {
		gutil.log('Listening on', port);
	});
	
	return {
		lr: lr,
		app: app
	};
};

var servers = createServers(8080, 35729);

gulp.task('default', ['jshint', 'build'], function () {
	gulp.watch(['./src/*', 'index.html', 'style.css'], ['jshint', 'build']);
});

gulp.task('jshint', function () {
	gulp.src('./src/*.js')
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter(jshintStylish));
});

gulp.task('build', function () {
	gulp.src('./src/main.js')
		.pipe(browserify({ transform: ['debowerify'] }))
		.pipe(uglify())
		.pipe(header(banner, { pkg : pkg } ))
		.pipe(rename(pkg.name + '.min.js'))
		.pipe(gulp.dest('./dist'))
		.pipe(livereload(servers.lr));
});