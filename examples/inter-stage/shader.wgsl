struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@vertex
fn vs (@builtin(vertex_index) index: u32) -> OurVertexShaderOutput{
    var pos:vec2f;
    switch(index){
        case 1: {
            pos = vec2f(0.0, 0.5);
            break;
        }
        case 2: {
            pos = vec2f(0.5, -0.5);
            break;
        }
        default: {
            pos = vec2f(-0.5, -0.5);
            break;
        }
    }
    return OurVertexShaderOutput(
        vec4f(pos, 0.0, 1.0),
        vec4f(1.0, 0.0, 0.0, 1.0),
    );
}

@fragment
fn fs (input: OurVertexShaderOutput)->@location(0) vec4f{
    return input.color;
}

