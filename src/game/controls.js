export class Controls {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = { w: false, a: false, s: false, d: false, shoot: false };
    this.mouseDX = 0;
    this.locked = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("mousemove", this._onMouseMove);
    canvas.addEventListener("mousedown", this._onMouseDown);
    canvas.addEventListener("mouseup", this._onMouseUp);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);
  }

  requestLock() {
    this.canvas.requestPointerLock();
  }

  consumeMouseDelta() {
    const dx = this.mouseDX;
    this.mouseDX = 0;
    return dx;
  }

  _onKeyDown(e) {
    const prevent = ["KeyW", "KeyA", "KeyS", "KeyD", "Space"];
    if (prevent.includes(e.code)) e.preventDefault();
    const map = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d", Space: "shoot" };
    const key = map[e.code];
    if (key) this.keys[key] = true;
  }

  _onKeyUp(e) {
    const map = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d", Space: "shoot" };
    const key = map[e.code];
    if (key) this.keys[key] = false;
  }

  _onMouseMove(e) {
    if (this.locked) {
      this.mouseDX += e.movementX;
    }
  }

  _onMouseDown(e) {
    if (this.locked && e.button === 0) {
      this.keys.shoot = true;
    }
  }

  _onMouseUp(e) {
    if (e.button === 0) {
      this.keys.shoot = false;
    }
  }

  _onPointerLockChange() {
    this.locked = document.pointerLockElement === this.canvas;
  }
}
