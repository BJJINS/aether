struct Uniforms {
    matrix: mat4x4f,
};

struct VertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragColor: vec4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

@vertex
fn vs(@location(0) pos: vec3f, @location(1) color: vec4f) -> VertexShaderOutput {
    return VertexShaderOutput(uni.matrix * vec4f(pos, 1.0), color);
}

@fragment
fn fs(fsInput: VertexShaderOutput) -> @location(0) vec4f {
    return fsInput.fragColor;
}
