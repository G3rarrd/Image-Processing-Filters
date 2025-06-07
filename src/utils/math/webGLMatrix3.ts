export const m3 = {
    translation: (tx : number, ty: number) : number[] => {
      return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1,
      ];
    },
  
    rotation: (angleInRadians : number) : number[] => {
      const c = Math.cos(angleInRadians);
      const s = Math.sin(angleInRadians);
      return [
        c,-s, 0,
        s, c, 0,
        0, 0, 1,
      ];
    },
  
    scaling: (sx : number, sy : number) : number[]=> {
      return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1,
      ];
    },

    identity: ():number[] => {
      return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ];
    },

    projection: function(width : number, height : number) {
      // Note: This matrix flips the Y axis so that 0 is at the top.
      return [
        2 / width, 0, 0,
        0, -2 / height, 0,
        -1, 1, 1
      ];
    },
  
    multiply: (a : number[], b : number[])=> {
      const a00 = a[0 * 3 + 0];
      const a01 = a[0 * 3 + 1];
      const a02 = a[0 * 3 + 2];
      const a10 = a[1 * 3 + 0];
      const a11 = a[1 * 3 + 1];
      const a12 = a[1 * 3 + 2];
      const a20 = a[2 * 3 + 0];
      const a21 = a[2 * 3 + 1];
      const a22 = a[2 * 3 + 2];
      const b00 = b[0 * 3 + 0];
      const b01 = b[0 * 3 + 1];
      const b02 = b[0 * 3 + 2];
      const b10 = b[1 * 3 + 0];
      const b11 = b[1 * 3 + 1];
      const b12 = b[1 * 3 + 2];
      const b20 = b[2 * 3 + 0];
      const b21 = b[2 * 3 + 1];
      const b22 = b[2 * 3 + 2];
      return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      ];
    },

    inverse : (matrix : number[]) : number[] => {
      const m = matrix;
      const det = 
          m[0] * (m[4] * m[8] - m[5] * m[7]) -
          m[1] * (m[3] * m[8] - m[5] * m[6]) +
          m[2] * (m[3] * m[7] - m[4] * m[6]);
  
      if (det === 0) {
          throw new Error("Matrix is not invertible");
      }
  
      const invDet = 1 / det;
  
      return [
          (m[4] * m[8] - m[5] * m[7]) * invDet,
          (m[2] * m[7] - m[1] * m[8]) * invDet,
          (m[1] * m[5] - m[2] * m[4]) * invDet,
          (m[5] * m[6] - m[3] * m[8]) * invDet,
          (m[0] * m[8] - m[2] * m[6]) * invDet,
          (m[2] * m[3] - m[0] * m[5]) * invDet,
          (m[3] * m[7] - m[4] * m[6]) * invDet,
          (m[1] * m[6] - m[0] * m[7]) * invDet,
          (m[0] * m[4] - m[1] * m[3]) * invDet,
      ];
  },

  transformPoint : (matrix : number[], point :[number, number]) : [number, number]=> {
    const [x, y] = point;
    const transformedX = matrix[0] * x + matrix[3] * y + matrix[6];
    const transformedY = matrix[1] * x + matrix[4] * y + matrix[7];
    return [transformedX, transformedY];
  },

    translate: function(m : number[], tx : number, ty : number) {
      return m3.multiply(m, m3.translation(tx, ty));
    },
  
    rotate: function(m: number[], angleInRadians : number) {
      return m3.multiply(m, m3.rotation(angleInRadians));
    },
  
    scale: function(m: number[], sx : number, sy : number) {
      return m3.multiply(m, m3.scaling(sx, sy));
    },

    verticallyFlip : (matrix : number[]) => {
      return[matrix[6], matrix[7], matrix[8], matrix[4], matrix[5], matrix[6], matrix[1], matrix[2], matrix[3]];
    }
}