import {
  GAMEPAD_DEADZONE,
  GAMEPAD_LOOK_SENSITIVITY,
  GAMEPAD_VIBRATION_DAMAGE,
  GAMEPAD_VIBRATION_STRONG,
  GAMEPAD_VIBRATION_WEAK,
  PLAYER_TURN_SPEED,
} from "./constants.js";

export class Controls {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = { w: false, a: false, s: false, d: false, shoot: false };
    this.mouseDX = 0;
    this.locked = false;

    // Gamepad state
    this.gamepadIndex = null;
    this.hasGamepad = false;
    this.moveX = 0;
    this.moveY = 0;
    this._prevMenuPressed = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onGamepadConnected = this._onGamepadConnected.bind(this);
    this._onGamepadDisconnected = this._onGamepadDisconnected.bind(this);

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("mousemove", this._onMouseMove);
    canvas.addEventListener("mousedown", this._onMouseDown);
    canvas.addEventListener("mouseup", this._onMouseUp);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);
    window.addEventListener("gamepadconnected", this._onGamepadConnected);
    window.addEventListener("gamepaddisconnected", this._onGamepadDisconnected);
  }

  requestLock() {
    this.canvas.requestPointerLock();
  }

  consumeMouseDelta() {
    const dx = this.mouseDX;
    this.mouseDX = 0;
    return dx;
  }

  // Standard gamepad layout (PS5 DualSense):
  // axes[0,1] = left stick (X,Y), axes[2,3] = right stick (X,Y)
  // buttons[0]=Cross, [7]=R2, [9]=Options
  pollGamepad(dt) {
    const gp = this._activeGamepad();
    if (!gp) {
      this.hasGamepad = false;
      this.moveX = 0;
      this.moveY = 0;
      return;
    }
    this.hasGamepad = true;

    // Left stick -> analog movement with radial deadzone
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const lm = Math.hypot(lx, ly);
    if (lm < GAMEPAD_DEADZONE) {
      this.moveX = 0;
      this.moveY = 0;
    } else {
      const rescaled = Math.min(1, (lm - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE));
      const norm = rescaled / lm;
      this.moveX = lx * norm;
      this.moveY = ly * norm;
    }

    // Right stick X -> look (frame-rate independent, converted to mouseDX units)
    const rx = gp.axes[2] || 0;
    const ax = Math.abs(rx);
    if (ax >= GAMEPAD_DEADZONE) {
      const rScaled = Math.sign(rx) * ((ax - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE));
      const rotPerSec = rScaled * GAMEPAD_LOOK_SENSITIVITY;
      this.mouseDX += (rotPerSec / PLAYER_TURN_SPEED) * dt;
    }

    // R2 trigger -> shoot (authoritative while gamepad is active)
    const r2 = gp.buttons[7];
    this.keys.shoot = !!(r2 && r2.pressed);
  }

  // Edge-detected menu trigger: Cross or Options, fires once per press
  consumeMenuPress() {
    const gp = this._activeGamepad();
    if (!gp) {
      this.hasGamepad = false;
      this._prevMenuPressed = false;
      return false;
    }
    this.hasGamepad = true;
    const cross = gp.buttons[0]?.pressed ?? false;
    const options = gp.buttons[9]?.pressed ?? false;
    const pressed = cross || options;
    const justPressed = pressed && !this._prevMenuPressed;
    this._prevMenuPressed = pressed;
    return justPressed;
  }

  vibrate(
    duration = GAMEPAD_VIBRATION_DAMAGE,
    strong = GAMEPAD_VIBRATION_STRONG,
    weak = GAMEPAD_VIBRATION_WEAK,
  ) {
    const gp = this._activeGamepad();
    const actuator = gp?.vibrationActuator;
    if (actuator?.playEffect) {
      actuator.playEffect("dual-rumble", { duration, strongMagnitude: strong, weakMagnitude: weak }).catch(() => {});
    }
  }

  _activeGamepad() {
    if (this.gamepadIndex === null) return null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return pads[this.gamepadIndex] || null;
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
    if (e.button === 0 && !this.hasGamepad) {
      this.keys.shoot = false;
    }
  }

  _onPointerLockChange() {
    this.locked = document.pointerLockElement === this.canvas;
  }

  _onGamepadConnected(e) {
    if (this.gamepadIndex === null) {
      this.gamepadIndex = e.gamepad.index;
    }
  }

  _onGamepadDisconnected(e) {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null;
      this.hasGamepad = false;
      this.moveX = 0;
      this.moveY = 0;
      this.keys.shoot = false;
    }
  }
}
