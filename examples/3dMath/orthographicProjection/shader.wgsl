struct Uniforms {
    color: vec4f,
    matrix: mat4x4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

@vertex
fn vs(@location(0) pos: vec3f) -> @builtin(position) vec4f {
    let position = uni.matrix * vec4f(pos, 1.0);
    return position;
}

@fragment
fn fs() -> @location(0) vec4f {
    return uni.color;
}
