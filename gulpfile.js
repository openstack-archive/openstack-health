var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');

function configure() {
	return browserify('./stackviz/static/js/app.js', {
		debug: true
	})
}

function rebundle(bundler) {
	return bundler.bundle()
		.on('error', function(err) {
			console.error(err);
			this.emit('end');
		})
		.pipe(source('bundle.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./stackviz/static/'));
}

function compile() {
	return rebundle(configure());
}

var _count = 1;

function watch() {
	bundler = watchify(configure());

	bundler.on('update', function(ids) {
		var files = [];
		ids.forEach(function(id) {
			files.push(path.basename(id));
		});

		var s = '[watch #' + _count + ']';
		gutil.log(gutil.colors.blue(s),
			'building...',
			gutil.colors.gray('(', files.join(', '), ')'));

		rebundle(bundler);
	});

	bundler.on('log', function(msg) {
		var s = '[watch #' + _count + ']';
		gutil.log(gutil.colors.blue(s), 'finished: ', msg);

		_count++;
	})

	return rebundle(bundler);
};

gulp.task('build', function() { return compile(); });
gulp.task('watch', function() { return watch(); });

gulp.task('default', ['build']);
