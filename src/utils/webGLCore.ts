class WebGLCore {
    public canvasWidth : number;
    public canvasHeight : number;
    public gl :  WebGL2RenderingContext;
    public vao : WebGLVertexArrayObject | null = null;
    public positionBuffer : WebGLBuffer | null = null;
    public texCoordBuffer : WebGLBuffer | null = null;

    constructor (
        gl : WebGL2RenderingContext, 
        cw : number , ch : number) {
        this.canvasHeight = ch;
        this.canvasWidth = cw;
        this.gl = gl;

        // Required in WebGL 2 to render to float textures.
        const ext = this.gl.getExtension('EXT_color_buffer_float'); 
        if (! ext) throw new Error("EXT_color_buffer_float not supported");
    }

    private createShader  (
        shaderName : string,
        shaderType : GLenum,
        shaderSource : string,
    ) : WebGLShader {
        const shader = this.gl.createShader(shaderType);
        
        if (!shader) throw new Error(`Failed to create ${shaderName}` );

        this.gl.shaderSource(shader, shaderSource.trim());
        this.gl.compileShader(shader);
        
        const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (success) return shader;
        
        const shaderInfoLog : string | null = this.gl.getShaderInfoLog(shader);
        this.gl.deleteShader(shader);
        throw new Error(`Failed to compile ${shaderName} - ${shaderInfoLog}`);
    }
    

    public compileAndLinkProgram (
        vertexCode : string,
        fragmentCode : string,
        fragmentShaderName : string
    )  : WebGLProgram {
        if (! this.gl ) throw new Error("Failed to discover gl");
        
        const program = this.gl.createProgram();
        if (!program) throw new Error("Failed to create WebGL program");
        
        const vertexShader = this.createShader('Vertex', this.gl.VERTEX_SHADER, vertexCode);
        const fragmentShader = this.createShader(fragmentShaderName, this.gl.FRAGMENT_SHADER, fragmentCode);
        
        if (!vertexShader || ! fragmentShader) 
            throw new Error("Failed to create vertex or fragment shader");

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        const success : boolean = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);

        if (success) return program;

        const programInfoLog : string | null = this.gl.getProgramInfoLog(program);

        this.gl.deleteProgram(program);

        throw new Error(`Failed to link shaders - ${programInfoLog}`);
    }

    public createPositionBuffer (x: number , y : number, w : number, h : number) : void{
        // Create a rectangle sized the same as the image dimensions once on image load or resize of canvas
        if (!this.gl)  return;
        
        const positions = [
            x, y + h,
            x + w, y,
            x, y,

            x + w, y + h,
            x , y + h,
            x + w, y
        ];

        const positionBuffer = this.gl.createBuffer(); // To create three 2d clip space points
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer); // fills the correct buffer
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.positionBuffer = positionBuffer;
    }

    private setPositionAttribute(program : WebGLProgram) : void{        
        if (! this.gl) return;
        if (! this.positionBuffer) throw new Error ("Failed to create quad buffer")
        
        const ATTR_POSITION = "a_position";
        const positionLocation = this.gl.getAttribLocation(program, ATTR_POSITION);// Position Location
        if (positionLocation < 0) throw new Error(`Failed to locate attribute position`);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer); // Bind it to the ARRAY_BUFFER(Can be considered to position buffer)
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }


    public createTexCoordBuffer() : void {
        // The texture coordinates of each pixel
        if (! this.gl) return;

        
        const texCoords = [
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0
        ];

        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer); // Fills the correct buffer

        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            new Float32Array(texCoords), 
            this.gl.STATIC_DRAW
        );

        this.texCoordBuffer = texCoordBuffer;
    }

    private setTexCoordAttribute(program : WebGLProgram) :void{
        if (! this.gl) return;
        if (! this.texCoordBuffer) throw new Error("Failed to create texcoord buffer");
        const ATTR_TEXCOORD = "a_texCoord";
        const texCoordLocation = this.gl.getAttribLocation(program, ATTR_TEXCOORD);// Texture Coordinates Attributes 
        
        if (texCoordLocation < 0) throw new Error(`Failed to locate attribute texCoord`);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer); // To allow the buffer to be pointed correctly
        this.gl.enableVertexAttribArray(texCoordLocation);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    
    public setupVAO() : void {
        // Set up vertex array object 
        if (! this.gl) return;
        const vao = this.gl.createVertexArray();
        if (!vao) throw new Error("Failed to create vertex array object");
        this.gl.bindVertexArray(vao); // Bind the vao to remember the vertex positions without rebuilding thus reducing unnecessary computations
        this.vao = vao;
    }

    public createQuadVAO(imgWidth : number, imgHeight : number) : void {
        this.setupVAO();// assigns vao to this.vao and binds the vertex array;
        if (! this.gl || ! this.vao) return;  

        // Create buffers if they dont exist
        if (!this.positionBuffer) {
            this.createPositionBuffer(0,0, imgWidth, imgHeight);
        }

        if (! this.texCoordBuffer) {
            this.createTexCoordBuffer();
        }
    }

    public setupVAOAttributes(program: WebGLProgram):void {
        if (!this.gl || !this.vao) throw new Error("WebGL or VAO not available");

        this.gl.bindVertexArray(this.vao);

        // Set attributes
        this.setPositionAttribute(program);
        this.setTexCoordAttribute(program);

        this.gl.bindVertexArray(null);
    }

    public clearCanvas () : void {
        if (! this.gl) return;
        this.gl.clearColor(0.2, 0.2, 0.2, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}

export default WebGLCore;