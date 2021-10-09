let { parse } = require('./parser');
let { elements, attr2css } = require('./html');
const parser = require('./parser');
const DEBUG = false;

function mergeStyles(...parts) {
    let result = { ...parts[0] };

    for (let i = 1; i < parts.length; ++i) {
        for (let k in parts[i]) {
            let v = parts[i][k];

            if (v == "smaller") v = "0.75em";

            let emm = String(v).match(/([0-9.]+)[ ]?(em|pt|px)$/);
            if (emm) {
                switch(emm[2]) {
                    case 'em': result[k] = result['font-size'] * parseFloat(emm[1]); break;
                    case 'pt': result[k] = (96 * parseFloat(emm[1]) / 72).toFixed(2); break;
                    case 'px': result[k] = parseFloat(emm[1]); break;
                }
                
                if (isNaN(result[k]))
                    throw new Error("Its Nan Jim");

                continue;
            }

            result[k] = v;
        }
    }

    return result;
}

let distill = (block, style, {t, l, r}) => {
    if ( block.h !== undefined ) return;
    let line = block.c;
    let extra = 0;
    let vtop = line.map(o => o.y - o.ts.fontBoundingBoxAscent).reduce((a, b) => a < b ? a : b, Number.MAX_SAFE_INTEGER);
    let mad = line.map(o => o.ts.fontBoundingBoxAscent).reduce((a, b) => a > b ? a : b, 0);
    let rmp = line.map(o => o.x + o.ts.width).reduce((a, b) => a > b ? a : b, 0);
    let bmp = line.map(o => o.y + o.ts.fontBoundingBoxDescent).reduce((a, b) => a > b ? a : b, 0);

    block.h = bmp - block.y;

    if (vtop < t) extra = t - vtop;
    for (let l of line) l.y += extra + mad - l.ts.fontBoundingBoxAscent;


    if (style['text-align'] == 'center') {
        for (let ln of line) ln.x += ((r-l) - rmp) / 2;
    }
    if (style['text-align'] == 'right') {
        for (let ln of line) ln.x += ((r-l) - rmp);
    }
    //line.splice(0, line.length);
}



function renderBlock(els, { x, y, l, r, t, b, style, measure, blocks }, depth = 1) {
    let mkblock = () => ({ c: [], x: l, y: t, w: r - l});

    if (!blocks) blocks = [mkblock()];

    let cstyle = mergeStyles({ 'font-size': 12}, style);
    let base = measure('m', cstyle);
    let emitLine = (el) => blocks[blocks.length - 1].c.push(el);
    let brk = (style) => { 
        let extra = 0;
        let line = blocks[blocks.length - 1].c;
        let mlh = line.map(o => o.ts.fontBoundingBoxAscent + o.ts.fontBoundingBoxDescent).reduce((a, b) => a > b ? a : b, 0);


        y += mlh;
        x = l;

        distill(blocks[blocks.length - 1], style, {t, r, l})

        y += extra;
        t += extra + mlh;
        blocks.push(mkblock());
    };



    for (let e of els) {
        if (typeof (e) === "string") {
            let ts = measure(e, cstyle);
            if ( x + ts.width > r ) {
                brk(cstyle);
            }
            //Collapse beginning of line whitespace
            if (x == l && /^[ \n]+$/.test(e) ) continue;
            let el = { text: e, x: x - l, y: y + ts.fontBoundingBoxAscent, style: cstyle, ts };
            emitLine(el);

            x += ts.width;
        } else {
            if ( e.tag == "br" ) {
                let ts = measure(' ', cstyle);
                let el = { text: '\n', x: x - l, y: y + ts.fontBoundingBoxAscent, style: cstyle, ts };
                emitLine(el);
                brk(cstyle);
                continue;
            }

            if (elements[e.tag] && elements[e.tag].display == 'block') {
                if ( x > l ) brk(cstyle);
            }

            let ds = {};
            for ( let k in e ) {
                if ( k === "childern" || k === "tag" ) continue;
                if (attr2css[k]) Object.assign(ds, attr2css[k](e[k]));
                if (attr2css[`${e.tag}:${k}`]) Object.assign(ds, attr2css[`${e.tag}:${k}`](e[k]));
            }

            let istyle = mergeStyles(cstyle, elements[e.tag], ds);

            if ( e.style ) {
                let r = parser.parse(e.style, {startRule: 'style'});
                
                for ( let m of Object.entries(r) ) {
                    istyle[m[0]] = m[1];
                }
            }

            if (e.tag == "hr") {
                let ts = measure('', cstyle);
                ts.width = r - x
                ts.fontBoundingBoxDescent = 5;
                ts.fontBoundingBoxAscent = 0;

                emitLine({ text: '', x: x - l, y: y, style: istyle, ts });
                brk(cstyle);
                continue;
            }

            if (e.tag == "path") {
                let ts = measure('　', cstyle);
                if (x + ts.width > r) {
                    brk(cstyle);
                }
                emitLine({
                    text:'　',
                    path: e.d,
                    width: e.width ? parseFloat(e.width) : 512,
                    scale: e.scale ? parseFloat(e.scale) : 1,
                    x: x - l, y: y + ts.fontBoundingBoxAscent, style: istyle, ts });
                x += ts.width;
                continue;
            }

            if (e.children) {
                let rc = renderBlock(e.children, { x, y, l, r, t, b, style: istyle, measure, blocks }, depth + 1);
                x = rc.x, y = rc.y;
            } 
            if (elements[e.tag] && elements[e.tag].display == 'block') {
                let ts = measure('', cstyle);
                if (blocks[blocks.length - 1].c.length == 0 ) {
                    emitLine({ text: '', x: x - l, y: y, style: istyle, ts });
                }
                brk(istyle);
            }
        }
    }

    if ( depth == 1) distill(blocks[blocks.length - 1], style, { t, r, l });
    return { x, y, blocks };
}

//target.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontStretch} ${style.fontSize} ${style.fontFamily}`;

//target.fillStyle = style.color;

function applyTextStyle(c, style) {
    let f = [
        `${style['font-style'] || ''}`,
        `${style['font-weight'] || ''}`,
        `${parseFloat(style['font-size']).toFixed(0)}px`,
        `${style['font-family'] || 'serif'}`,
    ].filter( x => x).join(' ');

    c.textBaseline = 'alphabetic';
    
    let was = c.font;
    c.font = f;

    if (DEBUG && c.font !== f)
        throw new Error(`Invalid font: to- ${f} was- ${was} is- ${c.font}`);

    let fill = `${(style['color'] || '#000000').toLowerCase()}`;
    c.fillStyle = fill;

    if (c.fillStyle !== fill)
        throw new Error(`Invalid fill: ${fill} vs ${c.fillStyle}`);
}

function applyBackgroundStyle(c, style, prefix = '') {
    let fill = `${(style[prefix + '-color'] || 'rgba(0, 0, 0, 0)').toLowerCase()}`;
    c.fillStyle = fill;

    if (c.fillStyle !== fill)
        throw new Error(`Invalid fill: ${fill} vs ${c.fillStyle}`);

}

function go(html, mc, style, { x, y, width } = { x: 50, y: 50, width: 300 }) {
    let parsed = parse(html);

    let { blocks } = renderBlock(parsed, {
        x: x, y: y, l: x, r: x + width, t: y, b: y+400,
        style,
        measure: (text, style) => {
            applyTextStyle(mc, style);
            let {
                actualBoundingBoxAscent,
                actualBoundingBoxDescent,
                actualBoundingBoxLeft,
                actualBoundingBoxRight,
                fontBoundingBoxAscent,
                fontBoundingBoxDescent,
                width
            } = mc.measureText(text);

            return {
                actualBoundingBoxAscent,
                actualBoundingBoxDescent,
                actualBoundingBoxLeft,
                actualBoundingBoxRight,
                fontBoundingBoxAscent,
                fontBoundingBoxDescent,
                width
            };
        }
    });

    blocks = blocks.filter(b => b.c.length > 0);

    console.log(blocks);

    let maxy = 0;
    let cmds = [];
    for (let b of blocks) {
        if (b.h) maxy = Math.max(maxy, b.y + b.h);
        //cmds.push({x:b.x, y:b.y, w:b.w, h:b.h, style: b.style, type: 'bg'})
        cmds = cmds.concat(b.c.map(x => ({ ...x, x: x.x + b.x, h:b.h })));
    }
    

    return {
        draw: (c) => {
            c.strokeStyle = "red";
            c.lineWidth = 1;


            console.log("SIZE", width, maxy - y)
            
            if (false) {
                c.strokeStyle = "blue";
                c.lineWidth = 1;
                c.strokeRect(x, y, width, maxy - y);
            }

            //console.log('CMDS', cmds);
            for (let cmd of cmds) {
                //console.log("CMD", cmd);
                if ( cmd.type == "bg" ) {
                    applyBackgroundStyle(c, cmd.style, 'background');
                    c.fillRect(cmd.x, cmd.y, cmd.w, cmd.h);

                } else {
                    applyBackgroundStyle(c, cmd.style, 'background');
                    c.fillRect(cmd.x, cmd.y - cmd.ts.fontBoundingBoxAscent, cmd.ts.width, cmd.ts.fontBoundingBoxDescent + cmd.ts.fontBoundingBoxAscent);

                    if (cmd.style['border-bottom-width']) {
                        applyBackgroundStyle(c, cmd.style, 'border-bottom');
                        c.fillRect(cmd.x, cmd.y + cmd.ts.fontBoundingBoxDescent, cmd.ts.width, -2)
                    }

                    applyTextStyle(c, cmd.style);

                    if (cmd.path) {
                        c.save();
                        c.translate(cmd.x, cmd.y);
                        c.translate(0, -cmd.ts.width*0.9 );
                        c.scale(1/cmd.width*cmd.ts.width, 1/cmd.width*cmd.ts.width);
                        c.scale(cmd.scale,cmd.scale);

                        //c.scale(1.3, 1.3);
                        c.fill(new Path2D(cmd.path));
                        c.restore();
                    }
                    else
                        c.fillText(cmd.text, cmd.x, cmd.y);

                    if (cmd.style['text-decoration'] == 'underline') {
                        c.fillRect(cmd.x, cmd.y + cmd.ts.fontBoundingBoxDescent, cmd.ts.width, -1)
                    }

                }
            }
        },
        height: maxy - y
    }
}

function draw(c, html, mc, style, argz) {
    go(html, mc, style, argz).draw(c);
}

module.exports = {
    draw,
    go
};