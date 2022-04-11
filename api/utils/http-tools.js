//HTTP helpers, do not modify

function unquote(value) {
    if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"')
        return value.substring(1, value.length - 1);
    return value;
}

export function deepCloneJson(obj) {
    let result = undefined;
    if (obj) {
        result = JSON.parse(JSON.stringify(obj));
    }
    return result;
}

export function parseLinkHeader(header) {
    if (header !== undefined) {
        let linkexp =
            /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
        let paramexp =
            /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;

        let matches = header.match(linkexp);
        let rels = {};
        const matchesLength = matches.length;
        for (let i = 0; i < matchesLength; i++) {
            let split = matches[i].split(">");
            let href = split[0].substring(1);
            let ps = split[1];
            let link = {};
            link.href = href;
            let s = ps.match(paramexp);
            const sLength = s.length;
            for (let j = 0; j < sLength; j++) {
                let p = s[j];
                let paramsplit = p.split("=");
                let name = paramsplit[0];
                link[name] = unquote(paramsplit[1]);
            }

            if (link.rel !== undefined) {
                rels[link.rel] = link;
            }
        }
        //console.log(rels);
        return rels;
    } else {
        return undefined;
    }
}
