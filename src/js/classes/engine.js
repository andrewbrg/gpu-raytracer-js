import Kernels from './kernels';

const {Input} = require('gpu.js');

export default class Engine {
    constructor(depth, shadowRayCount = 4) {
        this._depth = depth;
        this._resolutionScale = 1;
        this._shadowRayCount = shadowRayCount;
        this._frameCount = 0;
        this._prevFrame = null;

        this.bnImage = document.createElement('img');
        this.bnImage.src = '/assets/img/blue-noise.jpg';
    }

    renderCanvas(camera, scene, width, height) {
        const sceneArr = scene.toArray();
        const objsCount = sceneArr[0].length;
        const objs = this._flatten(sceneArr[0], 30);

        const lightsCount = sceneArr[1].length;
        const lights = this._flatten(sceneArr[1], 15);

        const rays = camera.generateRays(width * this._resolutionScale, height * this._resolutionScale);
        const size = rays.output;

        const shader = Kernels.shader(size, objsCount, lightsCount, this.bnImage);
        this.shaderFrame = shader(
            camera.point,
            rays,
            objs,
            lights,
            this._depth,
            this._shadowRayCount,
            this._frameCount
        );

        const rgb = Kernels.rgb(size);

        if (null !== this._prevFrame) {
            this.shaderFrame = Kernels.lerp(size)(this._prevFrame, this.shaderFrame);
            rgb(this.shaderFrame);
            this._prevFrame.delete();
            this.shaderFrame.delete();
        } else {
            rgb(this.shaderFrame);
        }

        this._prevFrame = this.shaderFrame.clone();

        this._frameCount++;
        return rgb.canvas;
    }

    _flatten(objects, size) {
        return new Input(objects.flat(), [size, objects.length]);
    }
}