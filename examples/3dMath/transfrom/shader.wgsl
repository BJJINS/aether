struct Uniforms {
    color: vec4f,
    resolution: vec2f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;


@vertex
fn vs(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    let position = pos.xy;
    let zeroToOne = position / uni.resolution;
    let zeroToTwo = zeroToOne * 2.0;
    let flippedClipSpace = zeroToTwo - 1.0;
    let clipSpace = flippedClipSpace * vec2f(1.0, -1.0);
    return vec4f(clipSpace, 0.0, 1.0);
}

@fragment
fn fs() -> @location(0) vec4f {
    return uni.color;
}