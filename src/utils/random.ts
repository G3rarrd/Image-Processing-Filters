class Random<T> {
    shuffle(arr: T[]) : void {
        for (let i = arr.length - 1; i > 0; i--) {
            const randIndex : number = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[randIndex]] = [arr[randIndex], arr[i]];
        }
    }

    sample(arr : T[], sampleSize: number) : T[] {
        if(sampleSize >= arr.length) {
            this.shuffle(arr);
            return arr;
        }

        const sampleArr : T[] = [];
        const tmpArr : T[] = [...arr];
        let count = 0;
        while (count < sampleSize) {
            const back : number = tmpArr.length - 1;
            const randIndex = this.rand(0, back);
            [tmpArr[randIndex], tmpArr[back]] = [tmpArr[back], tmpArr[randIndex] ];
            sampleArr.push(tmpArr[back]);
            tmpArr.pop(); 
            count++;
        }

        tmpArr.length = 0;   

        return sampleArr;
    }

    rand(min : number, max : number) : number {
        min = Math.ceil(min);
        max = Math.floor(max); 
        return (Math.random() * (max - min + 1)) + min;
    }
    
}

export default Random

