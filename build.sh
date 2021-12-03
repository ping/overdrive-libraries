src='./_pages'
src_static="$src/static"
pub='./public'
pub_static="$pub/static"
# wipe
rm -rf "$pub_static" && mkdir -p "$pub_static"
# build
cp -p "$src_static/favicon.ico" "$pub_static"
sass --style=compressed --no-source-map "$src_static/styles.scss" "$pub_static/styles.min.css"
terser --mangle --compress --comments '/^!/' "$src_static/main.js" -o "$pub_static/main.min.js"
html-minifier-terser --collapse-whitespace --remove-comments "$src/index.html" -o "$pub/index.html"
