"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function shuffle(arr, count = 100) {
    for (let i = 0; i < count; i++) {
        let index1 = Math.floor(Math.random() * arr.length);
        let index2 = Math.floor(Math.random() * arr.length);
        if (index1 == index2)
            continue;
        let temp = arr[index1];
        arr[index1] = arr[index2];
        arr[index2] = temp;
    }
    return arr;
}
exports.shuffle = shuffle;
function parseUsername(user) {
    if (user.first_name) {
        if (user.last_name)
            return `${user.first_name} ${user.last_name}`;
        else
            return user.first_name;
    }
    else if (user.username) {
        return user.username;
    }
    return 'Unknown user';
}
exports.parseUsername = parseUsername;
//# sourceMappingURL=utils.js.map