struct OurStruct{
    color: vec4f,
    offset: vec2f,
}

struct OtherStruct{
    scale: vec2f,
}

struct OutStruct{
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}


@group(0) @binding(0) var<storage, read> ourStructs: array<OurStruct>;
@group(0) @binding(1) var<storage, read> otherStructs: array<OtherStruct>;
@group(0) @binding(2) var<storage, read> positions: array<vec2f>;

@vertex
fn vs (@builtin(vertex_index) index: u32, @builtin(instance_index) instanceIndex: u32) -> OutStruct{
    let pos = positions[index];
    return OutStruct(vec4f(pos * otherStructs[instanceIndex].scale + ourStructs[instanceIndex].offset, 0.0, 1.0), ourStructs[instanceIndex].color);
}

@fragment
fn fs (input: OutStruct)-> @location(0) vec4f{
    return input.color;
}
