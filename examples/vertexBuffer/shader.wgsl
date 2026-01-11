struct OutStruct{
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

struct VertexInput {
    @location(0) position: vec2f,
    @location(1) color: vec4f,
    @location(2) offset: vec2f,
    @location(3) scale: vec2f,
}

@vertex
fn vs (input: VertexInput) -> OutStruct{
    return OutStruct(vec4f(input.position * input.scale + input.offset, 0.0, 1.0), input.color);
}

@fragment
fn fs (input: OutStruct)-> @location(0) vec4f{
    return input.color;
}
