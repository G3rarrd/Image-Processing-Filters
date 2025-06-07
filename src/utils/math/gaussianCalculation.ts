class GaussianCalculations {
    private get1DGaussianFunction = (x: number, sigma: number) => {
        const eX: number = -((x * x) / (2 * sigma * sigma));
        return (1 / Math.sqrt(2 * Math.PI * sigma * sigma)) * Math.exp(eX);
    };
    
    public get1DGaussianKernel (kernelSize: number, sigma: number): number[] {
        if (!(kernelSize % 2)) kernelSize++; // ensures the kernel is always odd in size
    
        const halfSize: number = Math.floor(kernelSize / 2);
    
        const kernel1D: number[] = [];
        let kernelSum: number = 0;
    
        for (let x: number = -halfSize; x <= halfSize; x++) {
            const value: number = this.get1DGaussianFunction(x, sigma);
            kernelSum += value;
            kernel1D.push(value);
        }
    
        // Normalize kernel Grid
        this.normalizeKernel(kernel1D, kernelSum);
        return kernel1D;
    };

    private normalizeKernel (kernel1D : number[], kernelSum : number) : void {
        for (let i: number = 0; i < kernel1D.length; i++) {
            kernel1D[i] /= kernelSum;
        }
    }

    public getKernelSize(sigma : number) {
        /* Gets kernel size based on the sigma */ 
        return Math.max(3, (Math.ceil(3 * sigma) + 1) | 1);
    }
}

export default GaussianCalculations;