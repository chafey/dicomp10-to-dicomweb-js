const path = require('path');

const allArgs = {};

const getArg = (name, longName, def, description) => {
    allArgs[name || longName] = {hasArg: true, longName, description};
    allArgs[longName || name] = allArgs[name || longName];
    for(let i=2; i<process.argv.length-1; i++) {
       if( process.argv[i]==name ) return process.argv[i+1];
    }
    return def;
}

const hasArg = (name,longName, def, description) => {
    def = def===undefined ? false : def;
    allArgs[name || longName] = {hasArg: false, longName, description};
    for(let i=2; i<process.argv.length; i++) {
        const val = process.argv[i];
        if( val==name || val==longName ) return !def;
    }
    return def;
}

const getRemainingArgs = () => {
    const ret = [];
    for(let i=2; i<process.argv.length; i++) {
        const val = process.argv[i];
        const argVal = allArgs[val];
        if( argVal ) {
            if( argVal && argVal.hasArg ) i++;
            continue;
        }
        ret.push(val);
    }
    return ret;
}

const showHelp = (commandLine, description) => {
    console.log(commandLine);
    console.log(description);
    Object.keys(allArgs).forEach( name => {
        const arg = allArgs[name];
        console.log(`  ${name} ${name!=arg.longName && arg.longName} ${arg.description}`)
    });
}
module.exports = { getArg, hasArg, getRemainingArgs, showHelp };
