

let html = `
Begin
<h1 fontsize=20 checked fontface="Ariel" align="right">Hello<br />Goodbye</h1>
Extra Text
<h3>This is a an h3 container, it's pretty long but it should wrap okay.</h3>
<div align="center" color="#FF0000" style="font-size: 30; font-family: monospace; color: #FF0000">Ten Pt</div>
Four<font size="26" style="font-size: 26">Five</font>Six <br />
`;


html +=  `
<br />
<hr />
If you could let <u>me</u> <i>inside</i> your <b>heart</b>.
Oh, let <u>me</u> be a part of the narrative.
In the story they will write someday.
Let this <u>moment be the first chapter.
Where you decide to stay</u>.

`;

let examples = [
        html, 
        '<h1>po<font size="5">o</font>ja po<font size="1">o</font>ja</h1>Paint <span style="background-color: #ff0000">the town</span> red.<hr color="#ff0000" />',
        `
<p><b>Trigger: </b>
Critical success or failure when casting a spell.</p><div style="font-size: 0.5em">&nbsp;</div>
<p>Seek a random spell you're able to cast. You may (must on fail) cast that spell instead. If you do, study it.</p>
<div style="font-size: 0.5em">&nbsp;</div><small style="font-size:8pt"><b>Requires:</b> Mystic Talents.</small>`,

    ];

/*
html = `
Four<span style="font-size: 26">Five</span>Six <br />
Hello <br />
Four<span style="font-size: 40">Fi<br/>ve</span>Six
<h1>hi</hi>
<h3>Tacos</h3>
`;
*/


let go = require('./index');
let crt = require('canvas-rich-text');
console.log(crt);
let {
    drawArrangedText,
    arrangeBlock,
    parseHtmlString,
} = crt;

let size = 12;

let lol = (html, id=0) => `<div style="width: 1210px; height: 400px; border: 1px solid black">
<canvas
    id="${id}a" height=800 width=800 
    style="display: inline-block; height: 400px; width: 400px;"
></canvas>
<div style="display: inline-block; height: 400px; width: 400px; background-color: #ffeecc; font-family: Lato">
    <div style="position: relative;">
    <div style="position: absolute; left: 50px; top: 50px; width: 300px; height: 300px; border: 1px solid black; font-size: ${size}px">
${html}
    </div>
    </div>
</div>
<canvas
    id="${id}b" height=800 width = 800
style = "display: inline-block; height: 400px; width: 400px;"
    ></canvas >
</div >`;


let main = () => {
    document.getElementById("stuff").innerHTML = '';
        for ( let id = 0; id < examples.length; ++id ) {
            let ht = examples[id];
            console.log(id,ht);
            let x = document.createElement("div");
            x.innerHTML = lol(ht, id);
            document.getElementById("stuff").appendChild(x);

            let cm = document.getElementById('' + id + 'a');
            let mc = cm.getContext('2d');
            mc.fillStyle = "#cceeff";
            mc.fillRect(0, 0, 1000, 1000);
            mc.fillStyle = "#000000";

            mc.scale(2, 2);
            mc.strokeRect(50, 50, 300, 300);
            go(ht, mc, { 'font-size': size, 'font-family': 'Lato' }).draw(mc);
            mc.scale(0.5, 0.5);

            let ctx = document.getElementById('' + id + 'b').getContext("2d");

            ctx.fillStyle = "#eeffcc";
            ctx.fillRect(0, 0, 1000, 1000);
            ctx.fillStyle = "#000000";
            ctx.scale(2, 2);

            crt.defaultStyle.fontFamily = 'Lato';
            const tokens = parseHtmlString(ht.replace(/\n/g,' '), {
                fontFamily: 'Lato',
                fontSize: size,
                width: 300,
            });
            let arrangedText = arrangeBlock(tokens);
        
            ctx.strokeRect(50, 50, 300, 300);
            drawArrangedText(
                arrangedText,
                ctx,
                50,
                50
            );
            ctx.scale(0.5, 0.5);

        }
};


document.addEventListener('DOMContentLoaded', () => {
    document.fonts.load('12pt Lato')
        .then(() => document.fonts.load('bold 12pt Lato'))
        .then(() => document.fonts.load('black 12pt Lato'))
        .then(() => document.fonts.load('italic 12pt Lato'))
        .then(main);
});