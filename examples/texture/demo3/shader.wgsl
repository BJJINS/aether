struct VertexShaderOutput{
    @builtin(position) pos: vec4f,
    @location(0) texcoord: vec2f
}

@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_2d<f32>;

@vertex
fn vs (@location(0) position: vec2f) -> VertexShaderOutput{
    return VertexShaderOutput(vec4f(position, 0.0, 1.0), vec2f(position.x, 1.0 - position.y));
}

@fragment
fn fs (input: VertexShaderOutput)-> @location(0) vec4f{
    return textureSample(ourTexture, ourSampler, input.texcoord);
}
