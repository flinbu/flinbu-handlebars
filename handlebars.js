const handlebars = require("handlebars");
handlebars.registerHelper("for", (from, to, inc, block) => {
    block = block || {fn: () => { return arguments[0]; }};
    const data = block.data || {index: null};
    const output = "";
    for (let i = from; i <= to; i += inc) {
        data["index"] = i;
        output += block.fn(i, { data: data });
    }

    return output;
});

handlebars.registerHelper("ifCond", (v1, v2, options) => {
    if (v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

handlebars.registerHelper("lt", (a, b) => {
    let next = arguments[arguments.length - 1];
    return (a < b) ? next.fn(this) : next.inverse(this);
});

module.exports = handlebars;