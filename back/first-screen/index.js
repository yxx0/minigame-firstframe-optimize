const VS_LOGO = `
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;
void main() {
    gl_Position = a_Position;  
    v_TexCoord = a_TexCoord;
}`;

const FS_LOGO = `
precision mediump float;
uniform sampler2D u_Sampler;
varying vec2 v_TexCoord;
void main() {
    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
}`;

const options = {
    alpha: false,
    antialias: true,
    depth: true,
    stencil: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'default',
    failIfMajorPerformanceCaveat: false,
};

let gl = null;
let image = null;
let program = null;
let rafHandle = null;
let texture = null;
let vertexBuffer = null;

function initShaders(vshader, fshader) {
    return createProgram(vshader, fshader);
}

function createProgram(vshader, fshader) {
    var vertexShader = loadShader(gl.VERTEX_SHADER, vshader);
    var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fshader);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        var error = gl.getProgramInfoLog(program);
        console.log('Failed to link program: ' + error);
        gl.deleteProgram(program);
        program = null;
    }
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return program;
}

function loadShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        var error = gl.getShaderInfoLog(shader);
        console.log('Failed to compile shader: ' + error);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initVertexBuffer() {
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
}

function updateVertexBuffer(fitMode) {
    let vertices;
    if (fitMode === 'fullscreen') {
        // 全屏拉伸，填满整个画布
        vertices = new Float32Array([
            1, -1, 1.0, 1.0,
            1, 1, 1.0, 0.0,
            -1, -1, 0.0, 1.0,
            -1, 1, 0.0, 0.0,
        ]);
    } else if (fitMode === 'center') {
        // 居中显示，保持图片原始尺寸，不缩放
        const sys = bl.getSystemInfoSync();
        const imgWidthRatio = image.width / sys.screenWidth;
        const imgHeightRatio = image.height / sys.screenHeight;

        vertices = new Float32Array([
            imgWidthRatio, -imgHeightRatio, 1.0, 1.0,
            imgWidthRatio, imgHeightRatio, 1.0, 0.0,
            -imgWidthRatio, -imgHeightRatio, 0.0, 1.0,
            -imgWidthRatio, imgHeightRatio, 0.0, 0.0,
        ]);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function loadImage(imgPath) {
    return new Promise((resolve, reject) => {
        image = new Image();
        image.premultiplyAlpha = true; // 启用预乘 alpha，防止毛边
        image.onload = function () {
            resolve(image);
        };
        image.onerror = function (err) {
            reject(err);
        };
        image.src = imgPath.replace('#', '%23');
    });
}

function initTexture() {
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 使用 LINEAR 模式避免平滑产生的毛边
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 设置一个2x2占位黑色像素图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
}


function updateTexture() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

function draw() {
    //  r(1.0)g(1.0)b(1.0)a(0.0)
    gl.clearColor(1.0, 1.0, 1.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    var uSampler = gl.getUniformLocation(program, 'u_Sampler');
    gl.uniform1i(uSampler, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var vertexFormatLength = 4;
    var aPosition = gl.getAttribLocation(program, 'a_Position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, vertexFormatLength * 4, 0);
    var aTexCoord = gl.getAttribLocation(program, 'a_TexCoord');
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, vertexFormatLength * 4, vertexFormatLength * 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function tick() {
    rafHandle = requestAnimationFrame(function () {
        draw();
        tick();
    })
}

function end() {
    // 取消动画帧
    if (rafHandle) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
        console.log('Animation frame canceled');
    }
    // 清除 WebGL 上下文中的所有内容
    if (gl) {
        gl.useProgram(null);
        // 删除纹理
        if (texture) {
            gl.deleteTexture(texture);
            texture = null;
            console.log('Texture deleted');
        }
        // 删除缓冲区
        if (vertexBuffer) {
            gl.deleteBuffer(vertexBuffer);
            vertexBuffer = null;
            console.log('Vertex buffer deleted');
        }
        // 删除着色器程序
        if (program) {
            gl.deleteProgram(program);
            program = null;
            console.log('Shader program deleted');
        }
        // 清除所有 WebGL 状态
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        console.log('WebGL context cleared');
        // 清理 canvas 上下文
        gl = null;
        console.log('WebGL context reset to null');
    }
    image = null;  // 释放图片资源引用
    console.log('Image resource reference cleared');
}

function start(alpha, antialias, fitMode) {
    options.alpha = alpha === 'true' ? true : false;
    options.antialias = antialias === 'false' ? false : true;
    gl = gl || window.canvas.getContext("webgl", options);

    // 开启混合模式，防止半透明区域错误填充
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    initVertexBuffer();
    initTexture();
    program = initShaders(VS_LOGO, FS_LOGO);

    
    return loadImage('./first-screen/splash.png').then(() => {
        updateVertexBuffer(fitMode); // 使用适配模式更新顶点缓冲区
        updateTexture();
        // draw();
        tick();
    });
}
module.exports = { start, end };
