struct Uniforms {
    projectionMatrix: mat4x4f,
};

struct VertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) fragColor: vec4f,
};

struct VertexShaderInput {
    @builtin(instance_index) instanceIndex: u32,
    @location(0) pos: vec4f,
    @location(1) color: vec4f,
}

@group(0) @binding(0) var<uniform> uni: Uniforms;
@group(0) @binding(1) var<uniform> modelMatrixList: array<mat4x4f, 5>;

@vertex
fn vs(input: VertexShaderInput) -> VertexShaderOutput {
    let modelMatrix = modelMatrixList[input.instanceIndex];
    let position = uni.projectionMatrix * modelMatrix * input.pos;
    return VertexShaderOutput(position, input.color);
}

@fragment
fn fs(fsInput: VertexShaderOutput) -> @location(0) vec4f {
    return fsInput.fragColor;
}
