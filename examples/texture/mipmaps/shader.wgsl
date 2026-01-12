struct VertexOutput{
    @location(0) uv: vec2f,
    @builtin(position) position: vec4f,
}

@vertex
fn vs(@location(0) position: vec2f) -> VertexOutput {
    return VertexOutput(position, vec4f(position, 0.0, 1.0));
}


@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4f {
    
    return textureSample(ourTexture, ourSampler, input.uv);
}