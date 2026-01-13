struct VertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}


@vertex
fn vs(@location(0) pos: vec2f) -> VertexShaderOutput {
    return VertexShaderOutput(vec4f(pos.xy, 0.0, 1.0), pos.xy);
}

@group(0) @binding(0) var ourTexture: texture_2d<f32>;
@group(0) @binding(1) var ourSampler: sampler;


@fragment
fn fs(input: VertexShaderOutput) -> @location(0) vec4f {
    return textureSample(ourTexture, ourSampler, input.uv);
}