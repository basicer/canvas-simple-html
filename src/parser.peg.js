module.exports = `

document = Element*

space = [ \\t\\f\\n]
ws = space*
wws = space+

Element = Text / Tag

Text =
    e:$([^<> \\t\\f\\n]+ space?) { return e.replace(/&nbsp;/g, '\u00a0'); } /
    $(wws)

Symbol = $([a-zA-Z][a-zA-Z0-9-]*)
Attributes =
    a:(ws Attribute)* ws { return a.map(x => x[1]); }  /
    ws { return [] }

Attribute =
    k:Symbol '=' v:Value { return {k,v}; } /
    k:Symbol { return {k, v: true}; }

Value = 
    '"' t:$([^"]*) '"' { return t; } /
    $([^ \\t\\f\\n'"\`<=>]+)

Tag = 
    '<' open:Symbol attributes:Attributes '>' c:Element* '</' close:Symbol '>' {
        let tag = { tag: open, children: c };

        for ( let a of attributes )
            tag[a.k] = a.v;

        return tag;
    } / '<' open:Symbol attributes:Attributes '/>' {
        let tag = { tag: open, children: [] };
        for ( let a of attributes )
            tag[a.k] = a.v;
        return tag;
    }


style = f:StyleElement e:(';' ws StyleElement)* {
    let o = {};
    o[f[0]] = f[1];
    for ( let l of e ) o[l[2][0]] = l[2][1];
    return o;
}

StyleElement = k:$([a-z-]+) ':' ws v:$([^;]*) { return [k,v]}


`;
