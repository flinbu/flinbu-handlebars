const gulp = require("gulp");
const handlebars = require("./handlebars");
const config = require("./gulp.config")();
const gulpHandlebars = require("gulp-handlebars-html")(handlebars);
const regexRename = require("gulp-regex-rename");
const replace = require("gulp-replace");
const newer = require("gulp-newer");
const imagemin = require("gulp-imagemin");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const deporder = require("gulp-deporder");
const concat = require("gulp-concat");
const stripdebug = require("gulp-strip-debug");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const rename = require("gulp-rename");
const download = require("gulp-download");
const font2css = require("gulp-font2css").default;
const changeCase = require("change-case");
const clean = require("gulp-clean");
const data = require("gulp-data");
const fs = require("fs");
const plumber = require("gulp-plumber");
const htmlmin = require("gulp-htmlmin");
const gulpIf = require("gulp-if");
const path = require("path");

//Browser Sync
let browserSync = false;
let syncOpts;
if (config.server.proxy) {
	syncOpts = {
		proxy: config.server.url,
		files: `${config.dir.build}/**/*`,
		open: true,
		notify: true,
		logLevel: "debug",
		ui: {
			port: 8001
		}
	};
} else {
	syncOpts = {
		server: {
			baseDir: config.server.dir
		},
		files: `${config.dir.build}/**/*`,
		open: true,
		notify: true,
		logLevel: "debug",
		ui: {
			port: 8001
		}
	}
}

//HTML Settings
const html = {
	build: config.dir.build,
	watch: [
		config.templatePath
	]
}

//Images Settings
var images = {
	src: `${config.dir.src}/img/**/*'`,
	build: `${config.dir.build}/assets/img`,
	watch: `${config.dir.src}/img/**/*`,
	dependencies: config.dependencies.images || false
}

//Fonts Settings
var fonts = {
	src: `${config.dir.src}/fonts/**/*`,
	build: `${config.dir.build}/assets/fonts`,
	watch: `${config.dir.src}/fonts/**/*`,
	dependencies: config.dependencies.fonts || false
}

//JS Settings
var js = {
	src: `${config.dir.src}/js/**/*`,
	build: `${config.dir.build}/assets/js`,
	watch: `${config.dir.src}/js/**/*`,
	dependencies: config.dependencies.js || false
}

//CSS Settings
var css = {
	src: `${config.dir.src}/scss/app.scss`,
	build: `${config.dir.build}/assets/css`,
	watch: `${config.dir.src}/scss/**/*.scss`,
	sassOpts: {
		outputStyle: config.sass.outputStyle || "nested",
		imagePath: images.build,
		precision: config.sass.precision || 3,
		errLogToConsole: config.sass.errLogToConsole || true
	},
	processors: [
		require("postcss-assets")({
			loadPaths: [images.build],
			basePath: config.dir.build,
			baseUrl: images.build
		}),
		require("autoprefixer")({
			overrideBrowserslist: config.sass.autoprefixer || ["last 2 versions", "> 2%"]
		}),
		require("css-mqpacker"),
		require("cssnano")
	],
	dependencies: config.dependencies.css || false
}

////////////////// TASKS ///////////////////
//Image processing
gulp.task("images-deps", done => {
	if (images.dependencies) {
		images.dependencies.forEach(dep => {
			if (dep.src) {
				gulp.src(dep.src)
					.pipe(newer(dep.build))
					.pipe(imagemin({
						verbose: true
					}))
					.pipe(gulp.dest(dep.build));
			} else if (dep.download) {
				download(dep.download)
					.pipe(imagemin({
						verbose: true
					}))
					.pipe(gulp.dest(dep.build));
			}
		})
    }
    done();
});
gulp.task("images", gulp.parallel("images-deps"), done => {
	gulp.src(images.src)
		.pipe(plumber())
		.pipe(newer(images.build))
		.pipe(imagemin({
			verbose: true
		}))
        .pipe(gulp.dest(images.build));
        
    done();
});

//CSS Processing
gulp.task("css-deps", done => {
	if (css.dependencies) {
		css.dependencies.forEach(dep => {
			processDep(dep, true);
		});
	}
    done();
});
gulp.task("css", gulp.parallel("images"), done => {
	gulp.src(css.src)
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(sass(css.sassOpts))
		.pipe(postcss(css.processors))
		.pipe(rename(`${config.filename.css}.css`))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest(css.build));
    done();
});

//HTML
gulp.task('html', done => {
	let options = {
		partialsDirectory: [config.templatePartialPath]
	};
	let dataFile = './src/data/templateData.json';
	let templateData = {
		filename: {
			css: config.filename.css,
			js: config.filename.js
		},
		js: [
			"assets/js/popper.min.js",
			"assets/js/jquery.min.js",
			"assets/js/bootstrap.min.js",
			`assets/js/${config.filename.js}.min.js`
		]
	};

	let indexTrue = function (file) {
		if (path.parse(file.path).name == "index.page") return true;
	};
	let indexFalse = function (file) {
		if (path.parse(file.path).name != "index.page") return true;
	};

	gulp.src(`${config.templatePath}/*.page.hbs`)
		.pipe(plumber())
		.pipe(data(() => {
			return JSON.parse(fs.readFileSync(dataFile));
		}))
		.pipe(gulpHandlebars(templateData, options))
		.pipe(gulpIf(indexTrue, regexRename(/\.page\.hbs$/, `.${config.html.ext}`)))
		.pipe(gulpIf(indexFalse, regexRename(/\.page\.hbs$/, `/index.${config.html.ext}`)))
		.pipe(replace(/\uFEFF/ig, ''))
		.pipe(gulpIf(config.html.min, htmlmin({ collapseWhitespace: true })))
        .pipe(gulp.dest(config.templateOutputPath));
    done();
});

//JS Processing
gulp.task("js-deps", done => {
	if (js.dependencies) {
		js.dependencies.forEach(dep => {
			processDep(dep, false);
		});
	}
    done();
});
gulp.task("js", done => {
	gulp.src(js.src)
		.pipe(plumber())
		.pipe(deporder())
		.pipe(concat(`${config.filename.js}.js`))
		.pipe(gulp.dest(js.build))
		.pipe(rename(`${config.filename.js}.min.js`))
		.pipe(stripdebug())
		.pipe(uglify())
        .pipe(gulp.dest(js.build));
        
    done();
});

//JSON
gulp.task("json-deps", done => {
	if (config.dependencies.json) {
		config.dependencies.json.forEach(dep => {
			processDep(dep, false);
		});
    }
    
    done();
});

//Fonts2CSS
gulp.task("font-face", done => {
	if (config.dependencies.fonts2css) {
		config.dependencies.fonts2css.forEach(dep => {
			gulp.src(dep.src)
				.pipe(plumber())
				.pipe(font2css())
				.pipe(concat(`${config.filename.css}.fonts.css`))
				.pipe(postcss(css.processors))
				.pipe(gulp.dest(dep.build));
		});
    }
    
    done();
});

//Fonts Processing
gulp.task("fonts-deps", done => {
	if (fonts.dependencies) {
		fonts.dependencies.forEach(dep => {
			processDep(dep, true);
		});
	}
    done();
});
gulp.task("fonts", gulp.parallel("fonts-deps"), done => {
	gulp.src(fonts.src)
		.pipe(plumber())
		.pipe(newer(fonts.build))
        .pipe(gulp.dest(fonts.build));
        
    done();
});

//HTACCESS
gulp.task("router", done => {
	gulp.src([
		"src/router/**/*",
		"src/router/.htaccess"
	]).pipe(gulp.dest(config.dir.build));
    done();
});

//Clean
gulp.task("clean", done => {
	gulp.src(config.dir.build, { read: false })
		.pipe(plumber())
        .pipe(clean({ force: true }));
        
    done();
});

//Build
gulp.task("pre-build", gulp.series(
	"css",
	"js-deps",
	"js",
	"json-deps",
	"fonts",
	"font-face",
	"css-deps",
	"html"
));
gulp.task("build", gulp.series("pre-build"));

//Browser Sync
gulp.task("browsersync", done => {
	if (!browserSync) {
		browserSync = require("browser-sync").create();
		browserSync.init(syncOpts);
	}
    done();
});

//Watch 
gulp.task("watch-html", done => {
	gulp.watch([
		config.dir.src + "/templates/**/*",
		config.dir.src + "/data/**/*"
	], gulp.series("html"));
    done();
});
gulp.task("watch-images", done => {
	gulp.watch(images.watch, gulp.series("images"));
    done();
});
gulp.task("watch-css", done => {
	gulp.watch(css.watch, gulp.series("css"));
    done();
});
gulp.task("watch-fonts", done => {
	gulp.watch(fonts.watch, gulp.series("fonts"));
    done();
});
gulp.task("watch-js", done => {
	gulp.watch(js.watch, gulp.series("js"));
    done();
});
gulp.task("watch", gulp.series(
	"browsersync",
	"watch-html",
	"watch-images",
	"watch-css",
	"watch-fonts",
	"watch-js"
));

//Default
gulp.task("default", gulp.series("build", "watch"));

//Helpers
function processDep(dep, checkNewer) {
	if (checkNewer) {
		if (dep.src) {
			gulp.src(dep.src)
				.pipe(plumber())
				.pipe(newer(dep.build))
				.pipe(gulp.dest(dep.build))
		} else if (dep.download) {
			download(dep.download)
				.pipe(plumber())
				.pipe(gulp.dest(dep.build));
		}
	} else {
		if (dep.src) {
			gulp.src(dep.src)
				.pipe(plumber())
				.pipe(gulp.dest(dep.build));
		} else if (dep.download) {
			download(dep.download)
				.pipe(plumber())
				.pipe(gulp.dest(dep.build));
		}
	}
};