let obj = {
    test: {
        wow: {
            kek: 'hi'
        }
    }
}
/**
 * @param {string[]} kek
 * @returns {any}
 */
function interpretObjArr(kek, obj){
    if(kek.length == 0) throw 'invalid argument. Require atleast one argument';
    if(kek.length == 1) return obj[kek[0]];
    let [arg, ...other] = kek;
    return interpretObjArr(other, obj[arg]);
}
/**
 * @param {string} kek 
 * @returns {any}
 */
function interpretObj(kek){
    let arr = kek.split('.');
    return interpretObjArr(arr, obj);
}
console.log(interpretObj('test.wow'));