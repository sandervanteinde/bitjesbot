class ArrayUtil{
    /**
     * 
     * @param {any[]} arr 
     * @param {number} count
     */
    shuffle(arr, count = 100){
        for(let i = 0; i < count; i++){
            let index1 = Math.floor(Math.random() * arr.length);
            let index2 = Math.floor(Math.random() * arr.length);
            if(index1 == index2) continue;
            let temp = arr[index1];
            arr[index1] = arr[index2];
            arr[index2] = temp;
        }
        return arr;
    }
}
module.exports = new ArrayUtil();