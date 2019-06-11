module.exports = () => {
    const root = ".";
    const assetsRoot = `${root}/src`;
    const handlebarsRoot = `${assetsRoot}/pages`;

    const config = {
        filename: {
            js: "app",
            css: "app"
        },
        server: {
            proxy: false,
            dir: "./dist"
        },
        dir: {
            src: "src",
            build: "dist"
        },
        html: {
            ext: "html",
            min: false
        },
        dependencies: {
            css: false,
			js: [
                {
                    download: 'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js',
                    build: 'dist/assets/js'
                },
				{
					src: 'node_modules/jquery/dist/jquery.min.js',
					build: 'dist/assets/js'
				},
		      	{
			        src: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
			        build: 'dist/assets/js'
				}
		    ],
            images: false,
            fonts: [
                {
                    src: "node_modules/boxicons/fonts/*",
                    build: "dist/assets/fonts"
                }
            ],
            icons: false,
            fonts2css: false
        },
        templatePath: handlebarsRoot,
        templatePartialPath: `${assetsRoot}/partials`,
        templateOutputPath: `${root}/dist`,
        templates: [
            `${handlebarsRoot}/**/*.hbs`
        ],
        sass: {
            outputStyle: "nested",
            precision: 3,
            errorLogToConsole: true,
            autoprefixer: ["last 2 versions", "> 2%"]
        }
    };

    return config;
}