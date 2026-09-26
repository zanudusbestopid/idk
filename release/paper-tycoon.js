#!/usr/bin/env node
// Paper Tycoon – single-file game server. Run: node paper-tycoon.js
import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse2(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse: parse2 };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes: randomBytes2, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse: parse2 } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property2) => {
      Object.defineProperty(WebSocket2.prototype, property2, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes2(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse2(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse2(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse: parse2 };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server2 = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server2.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server2, map) {
      for (const event of Object.keys(map)) server2.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server2.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server2) {
      server2._state = CLOSED;
      server2.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server2, req, socket, code, message, headers) {
      if (server2.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server2.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// src/server/index.ts
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { randomInt as randomInt2 } from "node:crypto";

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// embed:embedded-assets
function getAssets() {
  return { html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Paper Tycoon</title>
<meta name="description" content="A paper-craft property trading board game to play online with friends.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Patrick+Hand&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/client.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='6' y='6' width='52' height='52' rx='8' fill='%23fbf3e0' stroke='%232b2118' stroke-width='5'/%3E%3Crect x='6' y='6' width='52' height='14' rx='6' fill='%23d9413a' stroke='%232b2118' stroke-width='5'/%3E%3Ccircle cx='24' cy='40' r='4' fill='%232b2118'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%232b2118'/%3E%3C/svg%3E">
</head>
<body>
<div id="app" class="app"></div>
<script src="/client.js"></script>
</body>
</html>
`, js: '"use strict";(()=>{var Ut=Object.defineProperty;var qt=(t,e,n)=>e in t?Ut(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var p=(t,e,n)=>qt(t,typeof e!="symbol"?e+"":e,n);var ze=\'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="pp-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="pp-noise"/><feColorMatrix in="pp-noise" type="matrix" values="0.4 0.4 0.4 0 0.2  0.4 0.4 0.4 0 0.17  0.4 0.4 0.4 0 0.12  0 0 0 0 0.06" result="pp-tint"/><feBlend in="SourceGraphic" in2="pp-tint" mode="multiply" result="pp-blend"/><feComposite in="pp-blend" in2="SourceGraphic" operator="in"/></filter><filter id="pp-wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="pp-warp"/><feDisplacementMap in="SourceGraphic" in2="pp-warp" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="pp-shadow" x="-12%" y="-12%" width="130%" height="135%"><feDropShadow dx="2" dy="3" stdDeviation="1.5" flood-color="#2b2118" flood-opacity="0.35"/></filter><pattern id="pp-cardboard" patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="#c9a36b"/><rect x="0" y="0" width="12" height="3.5" fill="#b8905a"/><rect x="0" y="3.5" width="12" height="1.2" fill="#ad8752"/><rect x="0" y="7" width="12" height="1.5" fill="#d6b27c"/></pattern><pattern id="pp-wood" patternUnits="userSpaceOnUse" width="120" height="60"><rect width="120" height="60" fill="#8b5a2b"/><path d="M0 9 Q30 4 60 9 T120 9" fill="none" stroke="#a06a35" stroke-width="2" opacity="0.75"/><path d="M0 21 Q30 25 60 21 T120 21" fill="none" stroke="#7a4d22" stroke-width="1.5" opacity="0.8"/><path d="M0 33 Q30 28 60 33 T120 33" fill="none" stroke="#a06a35" stroke-width="1.5" opacity="0.6"/><path d="M0 45 Q30 49 60 45 T120 45" fill="none" stroke="#9c6531" stroke-width="2.5" opacity="0.55"/><path d="M0 55 Q30 52 60 55 T120 55" fill="none" stroke="#7a4d22" stroke-width="1" opacity="0.7"/></pattern></defs></svg>\';var ee=null,Me=(()=>{try{return localStorage.getItem("pt.muted")==="1"}catch{return!1}})();function Te(){if(Me)return null;try{return ee||(ee=new(window.AudioContext||window.webkitAudioContext)),ee.state==="suspended"&&ee.resume(),ee}catch{return null}}function Ye(){Te()}function de(){return Me}function Fe(t){Me=t;try{localStorage.setItem("pt.muted",t?"1":"0")}catch{}}function L(t,e,n="sine",i=.15,a=0,o=0){let s=Te();if(!s)return;let l=s.createOscillator(),c=s.createGain();l.type=n,l.frequency.setValueAtTime(t,s.currentTime+a),o&&l.frequency.exponentialRampToValueAtTime(Math.max(20,t+o),s.currentTime+a+e),c.gain.setValueAtTime(1e-4,s.currentTime+a),c.gain.exponentialRampToValueAtTime(i,s.currentTime+a+.01),c.gain.exponentialRampToValueAtTime(1e-4,s.currentTime+a+e),l.connect(c).connect(s.destination),l.start(s.currentTime+a),l.stop(s.currentTime+a+e+.02)}function Se(t,e=.08,n=0){let i=Te();if(!i)return;let a=i.createBuffer(1,Math.floor(i.sampleRate*t),i.sampleRate),o=a.getChannelData(0);for(let d=0;d<o.length;d++)o[d]=(Math.random()*2-1)*(1-d/o.length);let s=i.createBufferSource();s.buffer=a;let l=i.createGain();l.gain.value=e;let c=i.createBiquadFilter();c.type="highpass",c.frequency.value=1200,s.connect(c).connect(l).connect(i.destination),s.start(i.currentTime+n)}var T={step(){L(520+Math.random()*80,.06,"triangle",.08),Se(.03,.03)},dice(){for(let t=0;t<6;t++)Se(.05,.06,t*.09);L(300,.08,"square",.05,.55)},cash(){L(880,.08,"square",.06),L(1320,.12,"square",.06,.08)},pay(){L(440,.1,"sawtooth",.05),L(330,.16,"sawtooth",.05,.1)},card(){Se(.12,.09),L(700,.05,"triangle",.05,.05)},build(){L(200,.06,"square",.08),L(200,.06,"square",.08,.12),L(260,.1,"square",.08,.24)},jail(){L(200,.35,"sawtooth",.08,0,-120),L(150,.4,"sawtooth",.08,.2,-80)},turn(){L(660,.08,"sine",.08),L(990,.12,"sine",.08,.1)},click(){L(900,.03,"square",.04)},win(){[523,659,784,1047].forEach((t,e)=>L(t,.25,"triangle",.1,e*.15))},lose(){[392,349,311,262].forEach((t,e)=>L(t,.3,"sawtooth",.06,e*.2))},bid(){L(1200,.05,"square",.05)},notify(){L(784,.1,"sine",.08),L(1047,.15,"sine",.08,.12)}};function r(t,e,...n){let i=document.createElement(t);if(e){for(let[a,o]of Object.entries(e))if(!(o==null||o===!1))if(a==="class")i.className=String(o);else if(a==="style"&&typeof o=="object")for(let[s,l]of Object.entries(o))s.startsWith("--")?i.style.setProperty(s,l):i.style[s]=l;else a==="html"?i.innerHTML=String(o):a.startsWith("on")&&typeof o=="function"?i.addEventListener(a.slice(2).toLowerCase(),o):a==="dataset"&&typeof o=="object"?Object.assign(i.dataset,o):a in i&&!(a.startsWith("aria")||a.startsWith("data-"))?i[a]=o:i.setAttribute(a,String(o))}return pe(i,n),i}function pe(t,e){for(let n of e)n==null||n===!1||(Array.isArray(n)?pe(t,n):n instanceof Node?t.appendChild(n):t.appendChild(document.createTextNode(String(n))))}function v(t){for(;t.firstChild;)t.removeChild(t.firstChild)}function f(t){return`${t<0?"-":""}$${Math.abs(Math.round(t)).toLocaleString("en-US")}`}var ce=null;function B(t,e="info",n=2600){ce||(ce=r("div",{class:"toast-host"}),document.body.appendChild(ce));let i=r("div",{class:`toast paper paper--flat ${e==="error"?"toast--error":""}`},t);ce.appendChild(i),setTimeout(()=>i.remove(),n)}var G=t=>new Promise(e=>setTimeout(e,t));var he=class{constructor(){p(this,"ws",null);p(this,"listeners",new Set);p(this,"statusListeners",new Set);p(this,"queue",[]);p(this,"backoff",500);p(this,"closedByUser",!1);p(this,"session",null);p(this,"status","closed")}connect(){this.closedByUser=!1;let e=location.protocol==="https:"?"wss":"ws";this.setStatus("connecting");let n=new WebSocket(`${e}://${location.host}/ws`);this.ws=n,n.addEventListener("open",()=>{this.backoff=500,this.setStatus("open"),this.session&&this.sendNow({t:"rejoin",session:this.session});for(let i of this.queue)n.send(i);this.queue=[]}),n.addEventListener("message",i=>{let a;try{a=JSON.parse(String(i.data))}catch{return}a.t==="welcome"&&(this.session=a.session),a.t==="left"&&(this.session=null),a.t==="error"&&a.fatal&&(this.session=null);for(let o of this.listeners)o(a)}),n.addEventListener("close",()=>{this.ws=null,this.setStatus("closed"),!this.closedByUser&&(setTimeout(()=>this.connect(),this.backoff),this.backoff=Math.min(8e3,this.backoff*1.7))}),n.addEventListener("error",()=>{})}send(e){let n=JSON.stringify(e);this.ws&&this.ws.readyState===WebSocket.OPEN?this.ws.send(n):this.queue.push(n)}sendNow(e){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}onStatus(e){return this.statusListeners.add(e),()=>this.statusListeners.delete(e)}setStatus(e){this.status=e;for(let n of this.statusListeners)n(e)}close(){this.closedByUser=!0,this.ws?.close()}};var ue=class{constructor(){p(this,"state",{screen:"home",connection:"closed",playerId:null,room:null,game:null,timerEndsAt:null,chat:[]});p(this,"listeners",new Set)}set(e){Object.assign(this.state,e);for(let n of this.listeners)n(this.state)}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}get me(){return this.state.game?.players.find(e=>e.id===this.state.playerId)??null}get isHost(){return!!this.state.room&&this.state.room.hostId===this.state.playerId}},Ee="pt.session",Ue="pt.profile";function te(t,e){try{t&&e?localStorage.setItem(Ee,JSON.stringify({session:t,code:e})):localStorage.removeItem(Ee)}catch{}}function qe(){try{let t=localStorage.getItem(Ee);return t?JSON.parse(t):null}catch{return null}}function Ve(t,e){try{localStorage.setItem(Ue,JSON.stringify({name:t,token:e}))}catch{}}function We(){try{return JSON.parse(localStorage.getItem(Ue)||"")||{name:"",token:"hat"}}catch{return{name:"",token:"hat"}}}function k(t,e,n,i,a,o){return{index:t,type:"property",name:e,group:n,price:i,rent:a,houseCost:o}}function fe(t,e){return{index:t,type:"railroad",name:e,price:200}}function Ke(t,e){return{index:t,type:"utility",name:e,price:150}}var Xe=[{index:0,type:"go",name:"Go"},k(1,"Mediterranean Avenue","brown",60,[2,10,30,90,160,250],50),{index:2,type:"chest",name:"Community Chest"},k(3,"Baltic Avenue","brown",60,[4,20,60,180,320,450],50),{index:4,type:"tax",name:"Income Tax",amount:200},fe(5,"Reading Railroad"),k(6,"Oriental Avenue","lightblue",100,[6,30,90,270,400,550],50),{index:7,type:"chance",name:"Chance"},k(8,"Vermont Avenue","lightblue",100,[6,30,90,270,400,550],50),k(9,"Connecticut Avenue","lightblue",120,[8,40,100,300,450,600],50),{index:10,type:"jail",name:"Jail / Just Visiting"},k(11,"St. Charles Place","pink",140,[10,50,150,450,625,750],100),Ke(12,"Electric Company"),k(13,"States Avenue","pink",140,[10,50,150,450,625,750],100),k(14,"Virginia Avenue","pink",160,[12,60,180,500,700,900],100),fe(15,"Pennsylvania Railroad"),k(16,"St. James Place","orange",180,[14,70,200,550,750,950],100),{index:17,type:"chest",name:"Community Chest"},k(18,"Tennessee Avenue","orange",180,[14,70,200,550,750,950],100),k(19,"New York Avenue","orange",200,[16,80,220,600,800,1e3],100),{index:20,type:"freeparking",name:"Free Parking"},k(21,"Kentucky Avenue","red",220,[18,90,250,700,875,1050],150),{index:22,type:"chance",name:"Chance"},k(23,"Indiana Avenue","red",220,[18,90,250,700,875,1050],150),k(24,"Illinois Avenue","red",240,[20,100,300,750,925,1100],150),fe(25,"B&O Railroad"),k(26,"Atlantic Avenue","yellow",260,[22,110,330,800,975,1150],150),k(27,"Ventnor Avenue","yellow",260,[22,110,330,800,975,1150],150),Ke(28,"Water Works"),k(29,"Marvin Gardens","yellow",280,[24,120,360,850,1025,1200],150),{index:30,type:"gotojail",name:"Go To Jail"},k(31,"Pacific Avenue","green",300,[26,130,390,900,1100,1275],200),k(32,"North Carolina Avenue","green",300,[26,130,390,900,1100,1275],200),{index:33,type:"chest",name:"Community Chest"},k(34,"Pennsylvania Avenue","green",320,[28,150,450,1e3,1200,1400],200),fe(35,"Short Line"),{index:36,type:"chance",name:"Chance"},k(37,"Park Place","darkblue",350,[35,175,500,1100,1300,1500],200),{index:38,type:"tax",name:"Luxury Tax",amount:100},k(39,"Boardwalk","darkblue",400,[50,200,600,1400,1700,2e3],200)],I={brown:[1,3],lightblue:[6,8,9],pink:[11,13,14],orange:[16,18,19],red:[21,23,24],yellow:[26,27,29],green:[31,32,34],darkblue:[37,39]},V=[5,15,25,35],W=[12,28];var et=[25,50,100,200],tt=[4,10];function R(t){return Math.floor((t.price??0)/2)}var nt=[{id:0,text:"Advance to Go. (Collect $200)",effect:{kind:"advance",to:0}},{id:1,text:"Advance to Illinois Avenue. If you pass Go, collect $200.",effect:{kind:"advance",to:24}},{id:2,text:"Advance to St. Charles Place. If you pass Go, collect $200.",effect:{kind:"advance",to:11}},{id:3,text:"Advance token to the nearest Utility. If unowned, you may buy it from the Bank. If owned, pay the owner ten times the amount shown on the dice.",effect:{kind:"nearestUtility"}},{id:4,text:"Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.",effect:{kind:"nearestRailroad"}},{id:5,text:"Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.",effect:{kind:"nearestRailroad"}},{id:6,text:"Bank pays you dividend of $50.",effect:{kind:"collect",amount:50}},{id:7,text:"Get Out of Jail Free. This card may be kept until needed or traded.",effect:{kind:"jailCard"}},{id:8,text:"Go Back 3 Spaces.",effect:{kind:"goBack",spaces:3}},{id:9,text:"Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.",effect:{kind:"goToJail"}},{id:10,text:"Make general repairs on all your property: for each house pay $25, for each hotel pay $100.",effect:{kind:"repairs",perHouse:25,perHotel:100}},{id:11,text:"Pay poor tax of $15.",effect:{kind:"pay",amount:15}},{id:12,text:"Take a trip to Reading Railroad. If you pass Go, collect $200.",effect:{kind:"advance",to:5}},{id:13,text:"Take a walk on the Boardwalk. Advance token to Boardwalk.",effect:{kind:"advance",to:39}},{id:14,text:"You have been elected Chairman of the Board. Pay each player $50.",effect:{kind:"payEach",amount:50}},{id:15,text:"Your building loan matures. Collect $150.",effect:{kind:"collect",amount:150}}],rt=[{id:0,text:"Advance to Go. (Collect $200)",effect:{kind:"advance",to:0}},{id:1,text:"Bank error in your favor. Collect $200.",effect:{kind:"collect",amount:200}},{id:2,text:"Doctor\'s fee. Pay $50.",effect:{kind:"pay",amount:50}},{id:3,text:"From sale of stock you get $50.",effect:{kind:"collect",amount:50}},{id:4,text:"Get Out of Jail Free. This card may be kept until needed or traded.",effect:{kind:"jailCard"}},{id:5,text:"Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.",effect:{kind:"goToJail"}},{id:6,text:"Holiday fund matures. Receive $100.",effect:{kind:"collect",amount:100}},{id:7,text:"Income tax refund. Collect $20.",effect:{kind:"collect",amount:20}},{id:8,text:"It is your birthday. Collect $10 from every player.",effect:{kind:"collectFromEach",amount:10}},{id:9,text:"Life insurance matures. Collect $100.",effect:{kind:"collect",amount:100}},{id:10,text:"Pay hospital fees of $100.",effect:{kind:"pay",amount:100}},{id:11,text:"Pay school fees of $50.",effect:{kind:"pay",amount:50}},{id:12,text:"Receive $25 consultancy fee.",effect:{kind:"collect",amount:25}},{id:13,text:"You are assessed for street repairs: $40 per house, $115 per hotel.",effect:{kind:"repairs",perHouse:40,perHotel:115}},{id:14,text:"You have won second prize in a beauty contest. Collect $10.",effect:{kind:"collect",amount:10}},{id:15,text:"You inherit $100.",effect:{kind:"collect",amount:100}}];var it={chance:nt.find(t=>t.effect.kind==="jailCard").id,chest:rt.find(t=>t.effect.kind==="jailCard").id};var j={ok:!0};function g(t){return{ok:!1,reason:t}}function H(t,e){return t.players.find(n=>n.id===e)}function Ae(t){return t.players[t.currentPlayer].id}function Vt(t,e){return Ae(t)===e}function Wt(t){return t.players.filter(e=>!e.bankrupt)}function Pe(t,e){return Object.keys(t.properties).map(Number).filter(n=>t.properties[n].owner===e).sort((n,i)=>n-i)}function ot(t,e,n){return n.filter(i=>t.properties[i]?.owner===e).length}function dt(t,e,n){return I[n].every(i=>t.properties[i]?.owner===e)}function ct(t,e){return I[e].some(n=>(t.properties[n]?.houses??0)>0)}function Ge(t){return Math.ceil(R(t)/10)}function pt(t){return R(t)+Ge(t)}function Re(t,e,n){let i=t.board[e],a=t.properties[e];if(!i||!a||a.owner===null||a.mortgaged)return 0;switch(i.type){case"property":{let o=i.rent??[];if(a.houses>0)return o[a.houses]??0;let s=o[0]??0;return i.group&&dt(t,a.owner,i.group)?s*2:s}case"railroad":{let o=ot(t,a.owner,V);return et[Math.min(Math.max(o,1),4)-1]}case"utility":{let o=ot(t,a.owner,W);return tt[Math.min(Math.max(o,1),2)-1]*n}default:return 0}}function K(t,e){let n=H(t,e);if(!n)return g("Unknown player");if(n.bankrupt)return g("You are out of the game");switch(t.phase){case"roll":case"action":return Vt(t,e)?j:g("Not your turn");case"debt":return t.debt?.debtor===e?j:g("Only the player in debt may manage property now");case"buy":return g("Decide on the purchase first");case"auction":return g("Not during an auction");default:return g("The game is over")}}function ne(t,e,n){let i=K(t,e);if(!i.ok)return i;let a=H(t,e),o=t.board[n],s=t.properties[n];if(!o||!s)return g("Not a property");if(o.type!=="property"||!o.group)return g("Only streets can be built on");if(s.owner!==e)return g("You do not own this property");if(!dt(t,e,o.group))return g("You must own the whole color group");let l=I[o.group];if(l.some(d=>t.properties[d].mortgaged))return g("A property in this group is mortgaged");if(s.houses>=5)return g("There is already a hotel here");let c=Math.min(...l.map(d=>t.properties[d].houses));if(s.houses>c)return g("Build evenly: add houses to the least-built streets first");if(s.houses===4){if(t.hotelsLeft<1)return g("The bank has no hotels left")}else if(t.housesLeft<1)return g("The bank has no houses left");return a.cash<(o.houseCost??0)?g("Not enough cash"):j}function re(t,e,n){let i=K(t,e);if(!i.ok)return i;let a=t.board[n],o=t.properties[n];if(!a||!o)return g("Not a property");if(a.type!=="property"||!a.group)return g("Not a street");if(o.owner!==e)return g("You do not own this property");if(o.houses===0)return g("Nothing to sell");let s=Math.max(...I[a.group].map(l=>t.properties[l].houses));return o.houses<s?g("Sell evenly: sell from the most-built streets first"):o.houses===5&&t.housesLeft<4?g("The bank lacks the 4 houses needed to break up the hotel"):j}function ie(t,e,n){let i=K(t,e);if(!i.ok)return i;let a=t.board[n],o=t.properties[n];return!a||!o?g("Not a property"):o.owner!==e?g("You do not own this property"):o.mortgaged?g("Already mortgaged"):o.houses>0?g("Sell the buildings first"):a.group&&ct(t,a.group)?g("Sell all buildings in the color group first"):j}function oe(t,e,n){let i=K(t,e);if(!i.ok)return i;let a=H(t,e),o=t.board[n],s=t.properties[n];return!o||!s?g("Not a property"):s.owner!==e?g("You do not own this property"):s.mortgaged?a.cash<pt(o)?g("Not enough cash"):j:g("Not mortgaged")}function me(t,e){let n=H(t,e);if(!n)return 0;let i=n.cash;for(let a of Pe(t,e)){let o=t.board[a],s=t.properties[a];i+=s.mortgaged?R(o):o.price??0,i+=s.houses*(o.houseCost??0)}return i}function at(t,e){let n=0;for(let i of e)t.properties[i]?.mortgaged&&(n+=Ge(t.board[i]));return n}function st(t){return t.cash===0&&t.jailCards===0&&t.properties.length===0}function lt(t,e,n){if(!e||typeof e!="object")return"Malformed trade";if(!Number.isInteger(e.cash)||e.cash<0)return"Invalid cash amount";if(!Number.isInteger(e.jailCards)||e.jailCards<0)return"Invalid jail card count";if(e.jailCards>n.jailCards)return`${n.name} does not have ${e.jailCards} Get Out of Jail Free card(s)`;if(!Array.isArray(e.properties))return"Invalid property list";let i=new Set;for(let a of e.properties){if(!Number.isInteger(a)||!(a in t.properties))return"Invalid property";if(i.has(a))return"Duplicate property in trade";i.add(a);let o=t.board[a],s=t.properties[a];if(s.owner!==n.id)return`${n.name} does not own ${o.name}`;if(s.houses>0)return`${o.name} has buildings`;if(o.group&&ct(t,o.group))return`The ${o.group} group has buildings`}return null}function $e(t,e,n){switch(t.phase){case"roll":case"action":case"buy":return j;case"debt":return t.debt&&(t.debt.debtor===e||t.debt.debtor===n)?j:g("Only trades involving the player in debt are allowed right now");case"auction":return g("Not during an auction");default:return g("The game is over")}}function ht(t,e,n){let i=H(t,e.from),a=H(t,e.to);if(!i||i.bankrupt)return"The proposer is not in the game";if(!a||a.bankrupt)return"The other player is not in the game";if(i.id===a.id)return"You cannot trade with yourself";let o=lt(t,e.offer,i);if(o)return o;let s=lt(t,e.request,a);if(s)return s;if(st(e.offer)&&st(e.request))return"The trade is empty";if(n){if(i.cash-e.offer.cash+e.request.cash-at(t,e.request.properties)<0)return`${i.name} cannot afford this trade`;if(a.cash-e.request.cash+e.offer.cash-at(t,e.offer.properties)<0)return`${a.name} cannot afford this trade`}return null}function ut(t,e){let n=H(t,e);return n?n.bankrupt?g("You are out of the game"):t.phase==="auction"||t.phase==="ended"?$e(t,e,e):t.phase==="debt"?t.debt?H(t,t.debt.debtor)?.bankrupt?g("No one to trade with"):j:g("No debt"):Wt(t).length>1?j:g("No one to trade with"):g("Unknown player")}function ft(t,e,n){if(n.to!==e)return g("Only the recipient can accept");let i=$e(t,n.from,n.to);if(!i.ok)return i;let a=ht(t,n,!0);return a?g(a):j}function mt(t,e,n){return n.to!==e&&n.from!==e?g("Not your trade"):t.phase==="auction"?g("Not during an auction"):t.phase==="ended"?g("The game is over"):j}function Q(t,e){let n=H(t,e);if(!n||n.bankrupt||t.phase==="ended")return[];let i=[],a=Ae(t)===e;switch(t.phase){case"roll":a&&(i.push("roll"),n.inJail&&t.dice===null&&(n.cash>=t.config.jailFine&&i.push("payJailFine"),n.jailCards>0&&i.push("useJailCard")));break;case"buy":if(a&&t.pendingSpace!==null){let o=t.board[t.pendingSpace]?.price??0;n.cash>=o&&i.push("buy"),i.push("decline")}break;case"auction":t.auction&&t.auction.current===e&&(n.cash>t.auction.highBid&&i.push("bid"),t.auction.highBidder!==e&&i.push("passAuction"));break;case"debt":t.debt&&t.debt.debtor===e&&(n.cash>=t.debt.amount&&i.push("payDebt"),i.push("declareBankruptcy"));break;case"action":a&&i.push("endTurn");break}if(K(t,e).ok){let o=Pe(t,e);o.some(s=>ne(t,e,s).ok)&&i.push("build"),o.some(s=>re(t,e,s).ok)&&i.push("sellHouse"),o.some(s=>ie(t,e,s).ok)&&i.push("mortgage"),o.some(s=>oe(t,e,s).ok)&&i.push("unmortgage")}return ut(t,e).ok&&i.push("proposeTrade"),t.trades.some(o=>ft(t,e,o).ok)&&i.push("acceptTrade"),t.trades.some(o=>mt(t,e,o).ok)&&i.push("rejectTrade"),i.push("resign"),i}var nn={1:[[32,32]],2:[[20,20],[44,44]],3:[[20,20],[32,32],[44,44]],4:[[20,20],[44,20],[20,44],[44,44]],5:[[20,20],[44,20],[32,32],[20,44],[44,44]],6:[[20,20],[44,20],[20,32],[44,32],[20,44],[44,44]]};function D(t){let e=Math.min(6,Math.max(1,Math.round(t)||1));return\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"><path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z"/></g><g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z" fill="#fffaf0" stroke="none"/><path d="M52.8 15 L52.8 47.5 Q52.8 52.8 47.5 52.8 L15 52.8" fill="none" stroke="#e4dfd3" stroke-width="4.5"/><path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z" fill="none"/>\'+nn[e].map(([i,a])=>\'<circle cx="\'+i+\'" cy="\'+a+\'" r="4.6" fill="#2b2118" stroke="none"/>\').join("")+"</g></svg>"}var C=\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\',S=\'<g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">\',E=\'<g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">\',A="</g></svg>",At=\'<g stroke="#2b2118" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">\',gt="M6 42 A24 24 0 0 1 54 42 L60 41 L47.5 57 L35 41 L41 42 A11 11 0 0 0 19 42 Z",rn=C+S+\'<path d="\'+gt+\'"/></g>\'+E+\'<path d="\'+gt+\'" fill="#d9413a"/><path d="M17.5 42 A14.5 14.5 0 0 1 46.5 42 L44.2 42 A12.2 12.2 0 0 0 19.8 42 Z" fill="#a8302b" stroke="none"/><path d="M39.5 43 L47.5 53 L55.5 43 Z" fill="#a8302b" stroke="none"/>\'+A,bt="M24 25 Q24 15 32 15 Q40 15 40 22 Q40 27 34.5 30 Q32 31.5 32 35 L32 38",on=C+\'<g transform="rotate(-6 32 32)">\'+S+\'<rect x="16" y="8" width="34" height="48" rx="3"/></g>\'+E+\'<rect x="16" y="8" width="34" height="48" rx="3" fill="#fffaf0"/><rect x="44" y="10" width="4.5" height="44" fill="#e4dfd3" stroke="none"/><rect x="19" y="11" width="28" height="42" rx="2" fill="none" stroke="#e8842f" stroke-width="1.5" stroke-dasharray="3 2.5"/><path d="\'+bt+\'" fill="none" stroke-width="9"/><path d="\'+bt+\'" fill="none" stroke="#e8842f" stroke-width="4"/><circle cx="32" cy="46" r="4.2" fill="#e8842f"/></g></g></svg>\',an=C+S+\'<path d="M8 33 L8 24 Q8 12 20 12 L44 12 Q56 12 56 24 L56 33 Z"/><rect x="8" y="33" width="48" height="23" rx="2"/></g>\'+E+\'<path d="M8 33 L8 24 Q8 12 20 12 L44 12 Q56 12 56 24 L56 33 Z" fill="#6cc4ea"/><path d="M44 13.5 Q54.5 14 54.5 24 L54.5 31.5 L48 31.5 L48 24 Q48 16 44 13.5 Z" fill="#3f9dc8" stroke="none"/><rect x="18" y="12.5" width="5" height="20.5" fill="#3f9dc8"/><rect x="41" y="12.5" width="5" height="20.5" fill="#3f9dc8"/><rect x="8" y="33" width="48" height="23" rx="2" fill="#6cc4ea"/><rect x="10" y="50" width="44" height="4" fill="#3f9dc8" stroke="none"/><rect x="18" y="33" width="5" height="23" fill="#3f9dc8"/><rect x="41" y="33" width="5" height="23" fill="#3f9dc8"/><rect x="26.5" y="29" width="11" height="11" rx="2" fill="#f2b632"/><circle cx="32" cy="34" r="1.7" fill="#2b2118" stroke="none"/><rect x="31" y="34" width="2" height="3.5" fill="#2b2118" stroke="none"/>\'+A,sn=C+S+\'<circle cx="54" cy="8" r="4.5"/><rect x="42" y="9" width="8" height="16"/><rect x="40" y="8" width="12" height="4" rx="1"/><rect x="24" y="23" width="32" height="21" rx="9"/><rect x="6" y="14" width="20" height="30" rx="2"/><rect x="4" y="12" width="24" height="4" rx="1"/><rect x="4" y="44" width="52" height="5"/><path d="M54 44 L62 54 L54 54 Z"/><circle cx="15" cy="53" r="6.5"/><circle cx="33" cy="53" r="6.5"/><circle cx="47" cy="53" r="4.5"/></g>\'+E+\'<circle cx="54" cy="8" r="4.5" fill="#e4dfd3"/><rect x="42" y="9" width="8" height="16" fill="#4a4a4a"/><rect x="40" y="8" width="12" height="4" rx="1" fill="#4a4a4a"/><rect x="24" y="23" width="32" height="21" rx="9" fill="#4a4a4a"/><path d="M27 37 L52 37 Q49 42 44 42.5 L28 42.5 Z" fill="#333333" stroke="none"/><circle cx="55" cy="29.5" r="3" fill="#f9e27a"/><rect x="6" y="14" width="20" height="30" rx="2" fill="#4a4a4a"/><rect x="8" y="37" width="16" height="5" fill="#333333" stroke="none"/><rect x="10" y="19" width="11" height="10" rx="1" fill="#bfe3f5"/><rect x="4" y="12" width="24" height="4" rx="1" fill="#4a4a4a"/><rect x="4" y="44" width="52" height="5" fill="#2b2118"/><path d="M54 44 L62 54 L54 54 Z" fill="#6b7177"/><circle cx="15" cy="53" r="6.5" fill="#d9413a"/><circle cx="33" cy="53" r="6.5" fill="#d9413a"/><circle cx="47" cy="53" r="4.5" fill="#d9413a"/><path d="M15 53 L33 53" fill="none"/><circle cx="15" cy="53" r="2" fill="#fffaf0" stroke="none"/><circle cx="33" cy="53" r="2" fill="#fffaf0" stroke="none"/><circle cx="47" cy="53" r="1.5" fill="#fffaf0" stroke="none"/>\'+A,yt="M32 4 L32 8 M15 9 L18 12 M49 9 L46 12 M9 28 L13 28 M55 28 L51 28",ln=C+S+\'<path d="\'+yt+\'" fill="none"/><circle cx="32" cy="28" r="16"/><path d="M24 42 L40 42 L40 52 Q40 54 38 54 L26 54 Q24 54 24 52 Z"/><rect x="28" y="54" width="8" height="4" rx="1.5"/></g>\'+E+\'<path d="\'+yt+\'" fill="none"/><circle cx="32" cy="28" r="16" fill="#f9e27a" stroke="none"/><path d="M40 14.2 A16 16 0 0 1 40 41.8 A26 26 0 0 0 40 14.2 Z" fill="#e9c94d" stroke="none"/><circle cx="32" cy="28" r="16" fill="none"/><path d="M26 36 L26 32 L29 27 L32 34 L35 27 L38 32 L38 36" fill="none" stroke-width="2"/><path d="M24 42 L40 42 L40 52 Q40 54 38 54 L26 54 Q24 54 24 52 Z" fill="#9aa0a6"/><path d="M24 46 L40 46 M24 50 L40 50" fill="none" stroke-width="2"/><rect x="28" y="54" width="8" height="4" rx="1.5" fill="#6b7177"/>\'+A,xt="M16 36 L16 26 Q16 15 27 15 L42 15 Q52 15 52 25 L52 38 L58 38 L58 50 L46 50 L46 38 L44 38 L44 25 Q44 23 42 23 L27 23 Q24 23 24 26 L24 36 Z",dn=C+S+\'<rect x="44" y="8" width="4" height="8"/><rect x="38" y="4" width="16" height="5" rx="2.5"/><path d="\'+xt+\'"/><rect x="13" y="35" width="14" height="5" rx="1"/><path d="M20 44 Q13 53 20 58 Q27 53 20 44 Z"/></g>\'+E+\'<rect x="44" y="8" width="4" height="8" fill="#9aa0a6"/><rect x="38" y="4" width="16" height="5" rx="2.5" fill="#6b7177"/><path d="\'+xt+\'" fill="#9aa0a6"/><rect x="48" y="44" width="8" height="4" fill="#6b7177" stroke="none"/><path d="M20 30 L20 24 Q20 19.5 26 19.5" fill="none" stroke="#d7dbe0" stroke-width="2"/><rect x="13" y="35" width="14" height="5" rx="1" fill="#6b7177"/><path d="M20 44 Q13 53 20 58 Q27 53 20 44 Z" fill="#4aa3e0"/><circle cx="17.5" cy="53" r="1.5" fill="#bfe3f5" stroke="none"/>\'+A,wt="M37.5 30.5 Q35 26.5 31 27 Q26 27.5 26.5 32 Q27 36 32 37 Q37.5 38 37.5 42.5 Q37 47 32 47 Q28 47 26 44",cn=C+S+\'<path d="M25 18 L39 18 L37 9 L27 9 Z"/><path d="M32 18 Q12 26 11 44 Q11 58 32 58 Q53 58 53 44 Q52 26 32 18 Z"/></g>\'+E+\'<path d="M25 18 L39 18 L37 9 L27 9 Z" fill="#9aa0a6"/><path d="M32 18 Q12 26 11 44 Q11 58 32 58 Q53 58 53 44 Q52 26 32 18 Z" fill="#9aa0a6"/><path d="M44 29 Q51.3 38 51.3 45 Q51 54 41 56.6 Q47.5 52 47.5 45 Q47.5 37 44 29 Z" fill="#6b7177" stroke="none"/><rect x="24" y="16" width="16" height="4.5" rx="2" fill="#6b7177"/><path d="M32 23.5 L32 27.5 M32 46.5 L32 50.5" fill="none" stroke-width="7"/><path d="\'+wt+\'" fill="none" stroke-width="8"/><path d="M32 23.5 L32 27.5 M32 46.5 L32 50.5" fill="none" stroke="#3aa655" stroke-width="2.5"/><path d="\'+wt+\'" fill="none" stroke="#3aa655" stroke-width="3.5"/>\'+A,kt="M50 8 L51.6 12.4 L56 14 L51.6 15.6 L50 20 L48.4 15.6 L44 14 L48.4 12.4 Z",vt="M12 11 L13.2 14 L16 15 L13.2 16 L12 19 L10.8 16 L8 15 L10.8 14 Z",pn=C+S+\'<circle cx="32" cy="42" r="13" fill="none" stroke-width="17"/><path d="M22 20 L27 12 L37 12 L42 20 L32 32 Z"/><path d="\'+kt+\'"/><path d="\'+vt+\'"/></g>\'+E+\'<circle cx="32" cy="42" r="13" fill="none" stroke-width="11"/><circle cx="32" cy="42" r="13" fill="none" stroke="#f2b632" stroke-width="6"/><path d="M21 46 A11.5 11.5 0 0 0 43 46" fill="none" stroke="#d99a1e" stroke-width="3"/><path d="M22 20 L27 12 L37 12 L42 20 L32 32 Z" fill="#bfe3f5"/><path d="M32 20 L42 20 L32 32 Z" fill="#8fd0ee" stroke="none"/><path d="M22 20 L42 20 M27 12 L32 20 L37 12" fill="none" stroke-width="2"/><path d="\'+kt+\'" fill="#fffaf0" stroke-width="2"/><path d="\'+vt+\'" fill="#fffaf0" stroke-width="2"/>\'+A,hn=C+S+\'<rect x="8" y="8" width="48" height="48" rx="3"/><rect x="9" y="6" width="4" height="52" rx="1.5"/><rect x="51" y="6" width="4" height="52" rx="1.5"/></g>\'+E+\'<rect x="8" y="8" width="48" height="48" rx="3" fill="#d7d2c4"/><rect x="10.5" y="10.5" width="43" height="43" rx="2" fill="#c9c3b3" stroke="none"/><circle cx="32" cy="33" r="12" fill="#fffaf0"/><circle cx="28.5" cy="31" r="2" fill="#2b2118" stroke="none"/><circle cx="35.5" cy="31" r="2" fill="#2b2118" stroke="none"/><path d="M26 26 L29.5 27.5 M38 26 L34.5 27.5" fill="none" stroke-width="2"/><path d="M27.5 40 Q32 36 36.5 40" fill="none" stroke-width="2.2"/><rect x="8" y="16" width="48" height="3.5" fill="#8a8f94"/><rect x="8" y="46" width="48" height="3.5" fill="#8a8f94"/><rect x="9" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/><rect x="20.5" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/><rect x="39.5" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/><rect x="51" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/>\'+A,Lt="M13 12 L45 12 L54 20.5 L45 29 L13 29 Z",Ct="M51 33 L19 33 L10 41 L19 49 L51 49 Z",un=C+S+\'<rect x="29.5" y="14" width="5" height="44" rx="1.5"/><path d="\'+Lt+\'"/><path d="\'+Ct+\'"/><ellipse cx="32" cy="57" rx="11" ry="3.5"/></g>\'+E+\'<ellipse cx="32" cy="57" rx="11" ry="3.5" fill="#8a8f94"/><rect x="29.5" y="14" width="5" height="44" rx="1.5" fill="#6b7177"/><path d="\'+Lt+\'" fill="#9aa0a6"/><path d="M13 25 L47.5 25 L45 27.5 L13 27.5 Z" fill="#6b7177" stroke="none"/><path d="M19 18 L40 18 M19 23 L33 23" fill="none" stroke-width="2.2"/><path d="\'+Ct+\'" fill="#9aa0a6"/><path d="M51 45 L16.5 45 L19 47.5 L51 47.5 Z" fill="#6b7177" stroke="none"/><path d="M25 39 L46 39 M31 44 L46 44" fill="none" stroke-width="2.2"/>\'+A,fn=C+S+\'<rect x="9" y="44" width="10" height="12" rx="3"/><rect x="45" y="44" width="10" height="12" rx="3"/><path d="M15 33 L19 17 Q20 13 25 13 L39 13 Q44 13 45 17 L49 33 Z"/><rect x="10" y="26" width="6" height="4" rx="1"/><rect x="48" y="26" width="6" height="4" rx="1"/><rect x="5" y="32" width="54" height="20" rx="4"/></g>\'+E+\'<rect x="9" y="44" width="10" height="12" rx="3" fill="#2b2118"/><rect x="45" y="44" width="10" height="12" rx="3" fill="#2b2118"/><path d="M15 33 L19 17 Q20 13 25 13 L39 13 Q44 13 45 17 L49 33 Z" fill="#d9413a"/><path d="M19.5 30 L22.5 18 L41.5 18 L44.5 30 Z" fill="#bfe3f5"/><rect x="10" y="26" width="6" height="4" rx="1" fill="#a8302b"/><rect x="48" y="26" width="6" height="4" rx="1" fill="#a8302b"/><rect x="5" y="32" width="54" height="20" rx="4" fill="#d9413a"/><rect x="8" y="46" width="48" height="4" fill="#a8302b" stroke="none"/><circle cx="14" cy="40" r="4" fill="#f9e27a"/><circle cx="50" cy="40" r="4" fill="#f9e27a"/><rect x="24" y="38" width="16" height="5" rx="1.5" fill="#2b2118" stroke="none"/><rect x="7" y="48" width="50" height="5" rx="2" fill="#9aa0a6"/>\'+A,mn=C+S+\'<path d="M27 37 L12 28" fill="none" stroke-width="16"/><path d="M45 37 L50 48" fill="none" stroke-width="16"/><circle cx="11" cy="27" r="4"/><path d="M9 25 L5 22" fill="none" stroke-width="10"/><circle cx="50.5" cy="49.5" r="3.5"/><path d="M26 34 L46 34 L50 54 L22 54 Z"/><rect x="27" y="53.5" width="8" height="6" rx="1"/><rect x="37" y="53.5" width="8" height="6" rx="1"/><circle cx="36" cy="23" r="9"/><path d="M25 17 Q25 6 36 6 Q47 6 47 17 Z"/><rect x="23" y="16" width="26" height="4" rx="1.5"/></g>\'+E+\'<path d="M27 37 L12 28" fill="none" stroke-width="9"/><path d="M27 37 L12 28" fill="none" stroke="#2f6fd6" stroke-width="4.5"/><path d="M45 37 L50 48" fill="none" stroke-width="9"/><path d="M45 37 L50 48" fill="none" stroke="#2f6fd6" stroke-width="4.5"/><rect x="27" y="53.5" width="8" height="6" rx="1" fill="#1f4fa3"/><rect x="37" y="53.5" width="8" height="6" rx="1" fill="#1f4fa3"/><path d="M26 34 L46 34 L50 54 L22 54 Z" fill="#2f6fd6"/><path d="M42 35.5 L45 35.5 L48.6 52.5 L45 52.5 Z" fill="#1f4fa3" stroke="none"/><rect x="23.2" y="51" width="25.6" height="3.5" fill="#2b2118" stroke="none"/><circle cx="36" cy="42" r="1.5" fill="#f2b632" stroke="none"/><circle cx="36" cy="47.5" r="1.5" fill="#f2b632" stroke="none"/><circle cx="11" cy="27" r="4" fill="#f1c7a4"/><path d="M9 25 L5 22" fill="none" stroke-width="6"/><path d="M9 25 L5 22" fill="none" stroke="#f1c7a4" stroke-width="3"/><circle cx="50.5" cy="49.5" r="3.5" fill="#f1c7a4"/><circle cx="36" cy="23" r="9" fill="#f1c7a4"/><circle cx="33" cy="24" r="1.7" fill="#2b2118" stroke="none"/><circle cx="39" cy="24" r="1.7" fill="#2b2118" stroke="none"/><path d="M33 28.5 L39 28.5" fill="none" stroke-width="2"/><path d="M25 17 Q25 6 36 6 Q47 6 47 17 Z" fill="#2f6fd6"/><rect x="23" y="16" width="26" height="4" rx="1.5" fill="#1f4fa3"/><circle cx="36" cy="11.5" r="2.2" fill="#f2b632" stroke="none"/>\'+A,gn=C+S+\'<rect x="42" y="14" width="7" height="12"/><rect x="13" y="30" width="38" height="28" rx="1.5"/><path d="M6 32 L32 9 L58 32 Z"/></g>\'+At+\'<rect x="42" y="14" width="7" height="12" fill="#2c7f41"/><rect x="13" y="30" width="38" height="28" rx="1.5" fill="#3aa655"/><rect x="28" y="42" width="8" height="16" rx="1" fill="#2c7f41"/><rect x="17" y="36" width="7" height="6" fill="#fffaf0" stroke-width="2"/><path d="M6 32 L32 9 L58 32 Z" fill="#2c7f41"/>\'+A,bn=C+S+\'<rect x="8" y="21" width="48" height="37" rx="1.5"/><rect x="4" y="15" width="56" height="8" rx="2"/></g>\'+At+\'<rect x="8" y="21" width="48" height="37" rx="1.5" fill="#d9413a"/><rect x="13" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="28" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="43" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="13" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="28" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="43" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="28" y="47" width="8" height="11" rx="1" fill="#a8302b"/><rect x="4" y="15" width="56" height="8" rx="2" fill="#a8302b"/>\'+A,je="M23 30 L23 21 A9 9 0 0 1 41 21 L41 30",yn=C+S+\'<path d="\'+je+\'" fill="none" stroke-width="13"/><rect x="14" y="28" width="36" height="28" rx="4"/></g>\'+E+\'<path d="\'+je+\'" fill="none" stroke-width="9"/><path d="\'+je+\'" fill="none" stroke="#9aa0a6" stroke-width="4.5"/><rect x="14" y="28" width="36" height="28" rx="4" fill="#9aa0a6"/><rect x="16.5" y="49" width="31" height="4.5" rx="1" fill="#6b7177" stroke="none"/><circle cx="32" cy="40" r="4" fill="#2b2118" stroke="none"/><rect x="30" y="41" width="4" height="8" rx="1" fill="#2b2118" stroke="none"/>\'+A,xn=C+S+\'<rect x="4" y="17" width="56" height="30" rx="2"/></g>\'+E+\'<rect x="4" y="17" width="56" height="30" rx="2" fill="#5cb85c"/><rect x="6.5" y="43" width="51" height="2.5" fill="#2c7f41" stroke="none"/><rect x="8.5" y="21.5" width="47" height="21" rx="1" fill="none" stroke="#2c7f41" stroke-width="1.5"/><circle cx="12.5" cy="26" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="51.5" cy="26" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="12.5" cy="38" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="51.5" cy="38" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="32" cy="32" r="8.5" fill="#a5dba4"/><path d="M35 28 Q34 26.5 32 26.5 Q29 26.5 29 29.5 Q29 32 32 32 Q35 32 35 34.5 Q35 37.5 32 37.5 Q30 37.5 29 36 M32 24.5 L32 26.5 M32 37.5 L32 39.5" fill="none" stroke-width="2"/>\'+A,St="M12 26 L33 26 Q40 26 40 33 L40 38 Q40 45 33 45 L12 45 Z",Mt="M52 26 L35 26 Q27 26 27 34 L27 37 Q27 45 35 45 L52 45 Z",wn="M36 28 L45.5 28 Q50 28 50 32 L50 40.5 Q50 44.5 45.5 44.5 L36 44.5 Z",Tt="M20 21 Q20 17.5 24 17.5 L37 20 Q41 21 40 25 Q39 28 35 27.5 L22 27.5 Q20 27 20 25 Z",Et=C+S+\'<rect x="2" y="25" width="12" height="20" rx="2"/><rect x="50" y="25" width="12" height="20" rx="2"/><path d="\'+Mt+\'"/><path d="\'+St+\'"/><path d="\'+Tt+\'"/></g>\'+E+\'<rect x="2" y="25" width="12" height="20" rx="2" fill="#5a6a8a"/><rect x="50" y="25" width="12" height="20" rx="2" fill="#8a6a5a"/><path d="\'+Mt+\'" fill="#d8a274"/><path d="M44 28 L50.5 28 L50.5 43 L44 43 Z" fill="#c48b5c" stroke="none"/><path d="\'+St+\'" fill="#f1c7a4"/><path d="\'+wn+\'" fill="#f1c7a4"/><path d="M37 33.5 L48.5 33.5 M37 39 L48.5 39" fill="none" stroke-width="2"/><path d="\'+Tt+\'" fill="#d8a274"/>\'+A,kn=C+\'<g transform="rotate(-40 32 34)">\'+S+\'<rect x="29" y="22" width="6.5" height="34" rx="2"/><rect x="17" y="8" width="30" height="14" rx="2.5"/></g>\'+E+\'<rect x="29" y="22" width="6.5" height="34" rx="2" fill="#c9a36b"/><path d="M33.5 26 L33.5 53" fill="none" stroke="#a8844f" stroke-width="1.5"/><rect x="17" y="8" width="30" height="14" rx="2.5" fill="#8a8f94"/><rect x="19" y="17" width="26" height="3.2" fill="#6b7177" stroke="none"/><rect x="41.5" y="10" width="4" height="7" fill="#6b7177" stroke="none"/></g></g></svg>\',Oe="M19 12 L45 12 L45 18 L34 32 L45 46 L45 52 L19 52 L19 46 L30 32 L19 18 Z",vn=C+S+\'<path d="\'+Oe+\'"/><rect x="15" y="6" width="34" height="6" rx="2"/><rect x="15" y="52" width="34" height="6" rx="2"/></g>\'+E+\'<path d="\'+Oe+\'" fill="#e8f4fa" stroke="none"/><path d="M22 22 L42 22 L34 32 L30 32 Z" fill="#f2b632" stroke="none"/><path d="M22.5 42 L41.5 42 L45 46 L45 50.5 L19 50.5 L19 46 Z" fill="#f2b632" stroke="none"/><path d="M32 32 L32 44" fill="none" stroke="#f2b632" stroke-width="2"/><path d="\'+Oe+\'" fill="none"/><rect x="15" y="6" width="34" height="6" rx="2" fill="#c9a36b"/><rect x="15" y="52" width="34" height="6" rx="2" fill="#c9a36b"/>\'+A,Ln=C+S+\'<path d="M10 50 L7 20 L22 33 L32 12 L42 33 L57 20 L54 50 Z"/><rect x="9" y="46" width="46" height="9" rx="2"/></g>\'+E+\'<path d="M10 50 L7 20 L22 33 L32 12 L42 33 L57 20 L54 50 Z" fill="#f2b632"/><path d="M45.5 36 L54.5 27.5 L53.5 46 L45.5 46 Z" fill="#d99a1e" stroke="none"/><rect x="9" y="46" width="46" height="9" rx="2" fill="#d99a1e"/><circle cx="7" cy="20" r="3.2" fill="#d9413a"/><circle cx="57" cy="20" r="3.2" fill="#d9413a"/><circle cx="32" cy="12" r="3.5" fill="#2f6fd6"/><circle cx="32" cy="50.5" r="2.8" fill="#2aa9a0"/>\'+A,x={go:rn,chance:on,chest:an,railroad:sn,electric:ln,water:dn,incometax:cn,luxurytax:pn,jail:hn,visiting:un,freeparking:fn,gotojail:mn,house:gn,hotel:bn,mortgage:yn,dollar:xn,handshake:Et,trade:Et,hammer:kn,timer:vn,crown:Ln};var Z=\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\',_=\'<g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">\',J=\'<g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">\',z="</g></svg>",Cn=Z+_+\'<path d="M17 46 L19 13 Q32 9 45 13 L47 46 Z"/><rect x="8" y="45" width="48" height="9" rx="4"/></g>\'+J+\'<path d="M17 46 L19 13 Q32 9 45 13 L47 46 Z" fill="#8e5bc4"/><path d="M41 14 L43.8 13.4 L45.8 44.8 L42.5 44.8 Z" fill="#6b3f9e" stroke="none"/><rect x="17.5" y="36" width="29" height="6.5" fill="#6b3f9e"/><rect x="8" y="45" width="48" height="9" rx="4" fill="#8e5bc4"/><rect x="11" y="49.5" width="42" height="3" fill="#6b3f9e" stroke="none"/><circle cx="26" cy="25" r="2.2" fill="#2b2118" stroke="none"/><circle cx="38" cy="25" r="2.2" fill="#2b2118" stroke="none"/><circle cx="22.5" cy="29.5" r="1.7" fill="#e8649c" stroke="none"/><path d="M27 30 Q32 34.5 37 30" fill="none"/>\'+z,Sn=Z+_+\'<path d="M32 8 L32 42"/><path d="M32 8 L42 11 L32 14 Z"/><path d="M29 16 L29 40 L13 40 Z"/><path d="M35 12 L35 40 L55 40 Z"/><path d="M6 42 L58 42 L52 56 L12 56 Z"/></g>\'+J+\'<path d="M32 8 L32 42" fill="none"/><path d="M29 16 L29 40 L13 40 Z" fill="#fffaf0"/><path d="M27.8 31 L27.8 38.6 L18.6 38.6 Z" fill="#e4dfd3" stroke="none"/><path d="M35 12 L35 40 L55 40 Z" fill="#fffaf0"/><path d="M36.5 26 L44.4 26 L48.4 31.8 L36.5 31.8 Z" fill="#2f6fd6" stroke="none"/><path d="M32 8 L42 11 L32 14 Z" fill="#d9413a"/><path d="M6 42 L58 42 L52 56 L12 56 Z" fill="#2f6fd6"/><path d="M11 51.5 L53 51.5 L51.5 54.6 L12.5 54.6 Z" fill="#1f4fa3" stroke="none"/><circle cx="26" cy="46.5" r="2.2" fill="#2b2118" stroke="none"/><circle cx="38" cy="46.5" r="2.2" fill="#2b2118" stroke="none"/><path d="M27.5 49.5 Q32 53 36.5 49.5" fill="none"/>\'+z,Mn=Z+_+\'<path d="M21 12 Q9 14 12 30 Q17 33 21 26 Z"/><path d="M43 12 Q55 14 52 30 Q47 33 43 26 Z"/><path d="M18 58 L18 42 Q18 33 32 33 Q46 33 46 42 L46 58 Z"/><ellipse cx="25" cy="56" rx="5.5" ry="3.5"/><ellipse cx="39" cy="56" rx="5.5" ry="3.5"/><circle cx="32" cy="22" r="13"/></g>\'+J+\'<path d="M18 58 L18 42 Q18 33 32 33 Q46 33 46 42 L46 58 Z" fill="#c47a3c"/><path d="M40.5 35 Q44.6 37 44.6 42 L44.6 56.6 L40.5 56.6 Z" fill="#9a5a28" stroke="none"/><ellipse cx="25" cy="56" rx="5.5" ry="3.5" fill="#c47a3c"/><ellipse cx="39" cy="56" rx="5.5" ry="3.5" fill="#c47a3c"/><path d="M21 12 Q9 14 12 30 Q17 33 21 26 Z" fill="#9a5a28"/><path d="M43 12 Q55 14 52 30 Q47 33 43 26 Z" fill="#9a5a28"/><circle cx="32" cy="22" r="13" fill="#c47a3c"/><ellipse cx="32" cy="27" rx="7" ry="5" fill="#e6b07a" stroke="none"/><circle cx="27" cy="19.5" r="2.2" fill="#2b2118" stroke="none"/><circle cx="37" cy="19.5" r="2.2" fill="#2b2118" stroke="none"/><ellipse cx="32" cy="25.5" rx="3" ry="2.2" fill="#2b2118" stroke="none"/><path d="M28.5 29 Q32 32.5 35.5 29" fill="none" stroke-width="2"/>\'+z,Tn=Z+_+\'<rect x="3" y="24" width="12" height="4" rx="1.5"/><rect x="8" y="27" width="3.5" height="6"/><path d="M4 46 L6 34 L20 31 L26 20 L42 20 L48 31 L60 35 L61 46 Z"/><circle cx="18" cy="46" r="8"/><circle cx="46" cy="46" r="8"/></g>\'+J+\'<rect x="8" y="27" width="3.5" height="6" fill="#a8302b"/><rect x="3" y="24" width="12" height="4" rx="1.5" fill="#a8302b"/><path d="M4 46 L6 34 L20 31 L26 20 L42 20 L48 31 L60 35 L61 46 Z" fill="#d9413a"/><path d="M6.5 39 L58.6 39 L59.4 44.6 L5.5 44.6 Z" fill="#a8302b" stroke="none"/><path d="M27 23 L40 23 L44 31 L24 31 Z" fill="#bfe3f5"/><circle cx="57.5" cy="37.5" r="2" fill="#f9e27a" stroke="none"/><circle cx="18" cy="46" r="8" fill="#2b2118"/><circle cx="46" cy="46" r="8" fill="#2b2118"/><circle cx="18" cy="46" r="3.5" fill="#fffaf0" stroke="none"/><circle cx="46" cy="46" r="3.5" fill="#fffaf0" stroke="none"/><circle cx="31.5" cy="26" r="1.8" fill="#2b2118" stroke="none"/><circle cx="37" cy="26" r="1.8" fill="#2b2118" stroke="none"/><path d="M31 28.5 Q34.5 31 38 28.5" fill="none" stroke-width="2"/>\'+z,En=Z+_+\'<path d="M43 53 Q56 53 55 41" fill="none" stroke-width="16"/><path d="M14 22 L23 24 M14 27 L23 26.5 M50 22 L41 24 M50 27 L41 26.5" fill="none"/><path d="M21 16 L23.5 4 L31 11 Z"/><path d="M43 16 L40.5 4 L33 11 Z"/><path d="M20 58 L20 44 Q20 35 32 35 Q44 35 44 44 L44 58 Z"/><ellipse cx="26" cy="57" rx="5.5" ry="3.2"/><ellipse cx="38" cy="57" rx="5.5" ry="3.2"/><circle cx="32" cy="22" r="13"/></g>\'+J+\'<path d="M43 53 Q56 53 55 41" fill="none" stroke-width="9"/><path d="M43 53 Q56 53 55 41" fill="none" stroke="#e8649c" stroke-width="4"/><path d="M20 58 L20 44 Q20 35 32 35 Q44 35 44 44 L44 58 Z" fill="#e8649c"/><path d="M39 37 Q42.6 39 42.6 44 L42.6 56.6 L39 56.6 Z" fill="#c24a7e" stroke="none"/><ellipse cx="26" cy="57" rx="5.5" ry="3.2" fill="#e8649c"/><ellipse cx="38" cy="57" rx="5.5" ry="3.2" fill="#e8649c"/><path d="M21 16 L23.5 4 L31 11 Z" fill="#e8649c"/><path d="M43 16 L40.5 4 L33 11 Z" fill="#e8649c"/><circle cx="32" cy="22" r="13" fill="#e8649c"/><path d="M23.5 11 L24.5 6.5 L28 9.5 Z" fill="#c24a7e" stroke="none"/><path d="M40.5 11 L39.5 6.5 L36 9.5 Z" fill="#c24a7e" stroke="none"/><path d="M14 22 L23 24 M14 27 L23 26.5 M50 22 L41 24 M50 27 L41 26.5" fill="none" stroke-width="2"/><circle cx="27" cy="21" r="2.2" fill="#2b2118" stroke="none"/><circle cx="37" cy="21" r="2.2" fill="#2b2118" stroke="none"/><path d="M30 25.5 L34 25.5 L32 28 Z" fill="#2b2118" stroke="none"/><path d="M29 29 Q30.5 31 32 29 Q33.5 31 35 29" fill="none" stroke-width="2"/>\'+z,An=Z+_+\'<path d="M21 36 L9 52 L21 50 Z"/><path d="M43 36 L55 52 L43 50 Z"/><path d="M25 43 L32 57 L39 43 Z"/><path d="M32 4 Q45 17 43.5 43 L20.5 43 Q19 17 32 4 Z"/></g>\'+J+\'<path d="M25 43 L32 57 L39 43 Z" fill="#f2b632"/><path d="M28.5 45 L32 53 L35.5 45 Z" fill="#e8842f" stroke="none"/><path d="M21 36 L9 52 L21 50 Z" fill="#1d7f78"/><path d="M43 36 L55 52 L43 50 Z" fill="#1d7f78"/><path d="M32 4 Q45 17 43.5 43 L20.5 43 Q19 17 32 4 Z" fill="#2aa9a0"/><path d="M38 25 L41.3 25 L42.3 41.5 L38 41.5 Z" fill="#1d7f78" stroke="none"/><path d="M32 4 Q40 12 42 22 L22 22 Q24 12 32 4 Z" fill="#1d7f78"/><circle cx="32" cy="31" r="6.5" fill="#bfe3f5"/><circle cx="29.5" cy="30" r="1.6" fill="#2b2118" stroke="none"/><circle cx="34.5" cy="30" r="1.6" fill="#2b2118" stroke="none"/><path d="M29.5 33 Q32 35 34.5 33" fill="none" stroke-width="2"/>\'+z,Pn=Z+_+\'<path d="M12 40 L5 32 L20 35 Z"/><path d="M9 47 Q9 34 24 34 L40 34 Q57 34 57 47 Q57 58 42 58 L22 58 Q9 58 9 47 Z"/><path d="M32 16 L50 21 L32 27.5 Z"/><circle cx="23" cy="22" r="12"/></g>\'+J+\'<path d="M12 40 L5 32 L20 35 Z" fill="#f2b632"/><path d="M9 47 Q9 34 24 34 L40 34 Q57 34 57 47 Q57 58 42 58 L22 58 Q9 58 9 47 Z" fill="#f2b632"/><path d="M12 52 L54 52 Q51.5 56.6 42 56.6 L22 56.6 Q13 56.6 12 52 Z" fill="#d99a1e" stroke="none"/><path d="M27 41 Q40 35 50 44 Q40 52 27 46 Z" fill="#d99a1e"/><path d="M32 16 L50 21 L32 27.5 Z" fill="#e8842f"/><path d="M37 21.6 L47.5 21.2" fill="none" stroke-width="1.6"/><circle cx="23" cy="22" r="12" fill="#f2b632"/><circle cx="21" cy="19" r="2.2" fill="#2b2118" stroke="none"/><circle cx="28" cy="19" r="2.2" fill="#2b2118" stroke="none"/><circle cx="17.5" cy="24.5" r="1.8" fill="#f5a3a3" stroke="none"/>\'+z,Gn=Z+_+\'<path d="M32 12 L32 8"/><circle cx="32" cy="7" r="2.6"/><rect x="14" y="19" width="4" height="8" rx="1"/><rect x="46" y="19" width="4" height="8" rx="1"/><rect x="18" y="13" width="28" height="20" rx="3"/><rect x="28" y="33" width="8" height="3"/><rect x="8" y="37" width="6" height="14" rx="2"/><rect x="50" y="37" width="6" height="14" rx="2"/><rect x="16" y="35" width="32" height="18" rx="2.5"/><rect x="20" y="53" width="9" height="7" rx="1.5"/><rect x="35" y="53" width="9" height="7" rx="1.5"/></g>\'+J+\'<path d="M32 12 L32 8" fill="none"/><circle cx="32" cy="7" r="2.6" fill="#d9413a"/><rect x="14" y="19" width="4" height="8" rx="1" fill="#2c7f41"/><rect x="46" y="19" width="4" height="8" rx="1" fill="#2c7f41"/><rect x="28" y="33" width="8" height="3" fill="#2c7f41"/><rect x="8" y="37" width="6" height="14" rx="2" fill="#3aa655"/><rect x="50" y="37" width="6" height="14" rx="2" fill="#3aa655"/><rect x="20" y="53" width="9" height="7" rx="1.5" fill="#2c7f41"/><rect x="35" y="53" width="9" height="7" rx="1.5" fill="#2c7f41"/><rect x="16" y="35" width="32" height="18" rx="2.5" fill="#3aa655"/><rect x="43" y="37" width="3.5" height="14.5" fill="#2c7f41" stroke="none"/><rect x="24" y="39" width="16" height="10" rx="1.5" fill="#2c7f41"/><circle cx="28" cy="44" r="1.7" fill="#f2b632" stroke="none"/><circle cx="32" cy="44" r="1.7" fill="#d9413a" stroke="none"/><circle cx="36" cy="44" r="1.7" fill="#bfe3f5" stroke="none"/><rect x="18" y="13" width="28" height="20" rx="3" fill="#3aa655"/><circle cx="26" cy="22" r="3.2" fill="#fffaf0"/><circle cx="38" cy="22" r="3.2" fill="#fffaf0"/><circle cx="26" cy="22" r="1.5" fill="#2b2118" stroke="none"/><circle cx="38" cy="22" r="1.5" fill="#2b2118" stroke="none"/><path d="M27 28 Q32 31 37 28" fill="none" stroke-width="2"/>\'+z,He=[{id:"hat",name:"Top Hat",color:"#8e5bc4",svg:Cn},{id:"boat",name:"Sailboat",color:"#2f6fd6",svg:Sn},{id:"dog",name:"Dog",color:"#c47a3c",svg:Mn},{id:"car",name:"Race Car",color:"#d9413a",svg:Tn},{id:"cat",name:"Cat",color:"#e8649c",svg:En},{id:"rocket",name:"Rocket",color:"#2aa9a0",svg:An},{id:"duck",name:"Rubber Duck",color:"#f2b632",svg:Pn},{id:"robot",name:"Robot",color:"#3aa655",svg:Gn}];var Y=[{id:"hat",name:"Top Hat",color:"#8e5bc4"},{id:"boat",name:"Sailboat",color:"#2f6fd6"},{id:"dog",name:"Dog",color:"#c47a3c"},{id:"car",name:"Race Car",color:"#d9413a"},{id:"cat",name:"Cat",color:"#e8649c"},{id:"rocket",name:"Rocket",color:"#2aa9a0"},{id:"duck",name:"Rubber Duck",color:"#f2b632"},{id:"robot",name:"Robot",color:"#3aa655"}],fr=Object.fromEntries(Y.map(t=>[t.id,t]));function N(t){return He.find(e=>e.id===t)?.svg??He[0].svg}function Pt(t,e,n=""){v(t);let i=We(),a=Y.some(b=>b.id===i.token)?i.token:"hat",o=r("input",{class:"input",placeholder:"Your name",maxLength:16,value:i.name,autocomplete:"off"}),s=r("input",{class:"input input--code",placeholder:"CODE",maxLength:4,value:n,autocomplete:"off",spellcheck:!1}),l=r("div",{class:"token-grid"}),c=new Map;for(let b of Y){let O=r("button",{class:"token-pick",type:"button",title:b.name,onClick:()=>d(b.id)},r("span",{html:N(b.id)}),r("span",{class:"name"},b.name));c.set(b.id,O),l.appendChild(O)}function d(b){a=b;for(let[O,X]of c)X.classList.toggle("is-selected",O===b)}d(a);function h(){let b=o.value.trim()||"Player";return Ve(b,a),b}let u=r("button",{class:"btn btn--primary btn--lg",type:"button",onClick:()=>e.onCreate(h(),a)},"Create a room"),m=r("button",{class:"btn btn--blue",type:"button",onClick:()=>y()},"Join");function y(){let b=s.value.trim().toUpperCase();if(b.length!==4){s.focus(),s.classList.add("shake");return}e.onJoin(b,h(),a)}s.addEventListener("keydown",b=>{b.key==="Enter"&&y()});let M=r("div",{class:"home paper paper--tilt-l"},r("h1",{class:"title-art"},r("span",null,"PAPER"),r("span",null,"TYCOON")),r("p",{class:"subtitle hand"},"Buy streets, build houses, bankrupt your friends. All out of paper."),r("div",{class:"field"},r("label",null,"Your name"),o),r("div",{class:"field"},r("label",null,"Pick a token"),l),r("div",{style:{textAlign:"center",marginTop:"6px"}},u),r("div",{class:"or"},"\\u2014 or join a friend \\u2014"),r("div",{class:"row"},r("div",{class:"field",style:{marginBottom:"0"}},r("label",null,"Room code"),s),m));t.appendChild(r("div",{class:"screen-center"},M)),o.focus()}var ae={brown:"#8b4a2b",lightblue:"#7ec8e3",pink:"#d94f9a",orange:"#ef8a2b",red:"#d9413a",yellow:"#f2c94c",green:"#3aa655",darkblue:"#2f4fa8",railroad:"#2b2118",utility:"#9aa0a6"},Be=new Set(["lightblue","yellow","utility"]);function F(t){return t.type==="property"&&t.group?ae[t.group]:t.type==="railroad"?ae.railroad:t.type==="utility"?ae.utility:"#bbb"}function Ne(t){return t<=10?"bottom":t<=20?"left":t<=30?"top":"right"}function Rn(t){let e,n;return t<=10?(e=11-t,n=11):t<20?(e=1,n=21-t):t===20?(e=1,n=1):t<30?(e=t-19,n=1):t===30?(e=11,n=1):(e=11,n=t-29),`${n} / ${e} / ${n+1} / ${e+1}`}function $n(t){switch(t.type){case"go":return x.go;case"chance":return x.chance;case"chest":return x.chest;case"railroad":return x.railroad;case"utility":return/water/i.test(t.name)?x.water:x.electric;case"tax":return/luxury/i.test(t.name)?x.luxurytax:x.incometax;case"jail":return x.jail;case"freeparking":return x.freeparking;case"gotojail":return x.gotojail;default:return null}}var Gt=[[0,.05],[-.3,-.18],[.3,-.18],[-.3,.28],[.3,.28],[0,-.32],[-.32,.05],[.32,.05]],ge=class{constructor(e){p(this,"wrap");p(this,"board");p(this,"spaces",[]);p(this,"tokens",new Map);p(this,"tokenPos",new Map);p(this,"facing",new Map);p(this,"dice",[]);p(this,"banner");p(this,"bannerWho");p(this,"pot");p(this,"onSpaceClick");p(this,"state",null);this.onSpaceClick=e,this.board=r("div",{class:"board"}),this.wrap=r("div",{class:"board-wrap"},this.board),this.bannerWho=r("span",{class:"who"}),this.banner=r("div",{class:"turn-banner paper paper--flat"},this.bannerWho,r("span",null,"\'s turn")),this.pot=r("div",{class:"pot paper paper--flat hidden"}),new ResizeObserver(()=>this.resize()).observe(this.wrap)}build(e){this.state=e,v(this.board),this.spaces.length=0;for(let o of e.board){let s=Ne(o.index),l=o.index%10===0,c=r("div",{class:`space space--${s} ${l?"space--corner":""} ${o.type==="property"?"space--property":""}`,style:{gridArea:Rn(o.index)},dataset:{index:String(o.index)},title:o.name,onClick:()=>this.onSpaceClick(o.index)});o.type==="property"&&c.appendChild(r("div",{class:"band",style:{"--band":F(o)}}));let d=r("div",{class:"content"}),h=$n(o);h&&d.appendChild(r("span",{class:"sicon",html:h}));let u=o.type==="chest"?"Community Chest":o.type==="jail"?"Jail":o.name;d.appendChild(r("div",{class:"sname"},u)),o.price&&d.appendChild(r("div",{class:"sprice"},`$${o.price}`)),o.type==="tax"&&d.appendChild(r("div",{class:"sprice"},`Pay $${o.amount}`)),c.appendChild(d),c.appendChild(r("div",{class:"houses"})),this.board.appendChild(c),this.spaces[o.index]=c}let n=r("div",{class:"deck deck--chance"},r("span",{html:x.chance}),"CHANCE"),i=r("div",{class:"deck deck--chest"},r("span",{html:x.chest}),r("span",null,"COMMUNITY"),r("span",null,"CHEST"));this.dice=[r("div",{class:"die",html:D(1)}),r("div",{class:"die",html:D(1)})];let a=r("div",{class:"center"},r("div",{class:"logo title-art"},"PAPER",r("span",{class:"small"},"TYCOON")),r("div",{class:"middle"},n,r("div",{class:"dice-area"},r("div",{class:"dice"},...this.dice)),i),r("div",{class:"bottom"},this.banner,this.pot));this.board.appendChild(a);for(let o of this.tokens.values())o.remove();this.tokens.clear(),this.tokenPos.clear();for(let o of e.players){let s=r("div",{class:"token",style:{"--tcolor":o.color}},r("div",{class:"flip",html:N(o.token)}),r("span",{class:"badge hidden",html:x.jail}));this.board.appendChild(s),this.tokens.set(o.id,s),this.tokenPos.set(o.id,o.position),this.facing.set(o.id,"left")}this.resize(),this.updateStatic(e),this.placeTokens(e,!1),e.dice&&this.showDice(e.dice,!1)}resize(){let e=this.wrap.clientWidth||600;this.board.style.fontSize=`${(e/100).toFixed(2)}px`,this.state&&this.placeTokens(this.state,!1)}updateStatic(e){this.state=e;let n=new Map(e.players.map(a=>[a.id,a]));for(let a of e.board){let o=this.spaces[a.index];if(!o)continue;let s=e.properties[a.index];o.querySelector(".owner")?.remove();let l=o.querySelector(".houses");if(v(l),o.classList.toggle("is-mortgaged",!!s?.mortgaged),s?.owner){let c=n.get(s.owner);if(o.appendChild(r("span",{class:"owner",style:{"--owner":c?.color??"#999"},title:c?.name??""})),s.houses===5)l.appendChild(r("span",{class:"hotel",html:x.hotel}));else for(let d=0;d<s.houses;d++)l.appendChild(r("span",{html:x.house}));l.querySelectorAll("span").forEach(d=>{let h=d.querySelector("svg");h&&d.classList.contains("hotel")&&h.classList.add("hotel")})}}let i=e.players[e.currentPlayer];if(i&&(this.bannerWho.textContent=i.name,this.banner.style.setProperty("--who",i.color)),e.phase==="ended"&&e.winner){let a=n.get(e.winner);this.bannerWho.textContent=a?.name??"",this.banner.lastChild.textContent=" wins!"}this.pot.classList.toggle("hidden",!e.config.freeParkingJackpot),this.pot.textContent=`Free Parking pot: $${e.freeParkingPot}`;for(let a of e.players){let o=this.tokens.get(a.id);o&&(o.classList.toggle("is-current",e.players[e.currentPlayer]?.id===a.id&&e.phase!=="ended"),o.classList.toggle("is-bankrupt",a.bankrupt),o.querySelector(".badge")?.classList.toggle("hidden",!a.inJail))}}slotsAt(e,n){return n.players.filter(i=>!i.bankrupt&&(this.tokenPos.get(i.id)??i.position)===e).map(i=>i.id)}coordsFor(e,n){let i=this.spaces[e],a=parseFloat(this.board.style.fontSize)||6,[o,s]=Gt[n%Gt.length],l=i.offsetWidth,c=i.offsetHeight,d=i.offsetLeft+l/2+o*Math.min(l,9*a),h=i.offsetTop+c/2+s*Math.min(c,9*a),u=Ne(e),m=e%10===0?0:.6*a;return{left:d+(u==="left"?-m:u==="right"?m:0),top:h+(u==="bottom"?m:u==="top"?-m:0)}}placeTokens(e,n){for(let i of e.players)this.tokenPos.set(i.id,i.position);for(let i of e.players){let a=this.tokens.get(i.id);if(!a)continue;let o=this.slotsAt(i.position,e),s=Math.max(0,o.indexOf(i.id)),l=this.coordsFor(i.position,s);n||(a.style.transition="none"),a.style.left=`${l.left}px`,a.style.top=`${l.top}px`,n||(a.offsetWidth,a.style.transition="")}}setFacing(e,n){let i=this.tokens.get(e);i&&(this.facing.set(e,n),i.classList.toggle("face-left",n==="left"),i.style.setProperty("--sx",n==="left"?"-1":"1"))}async moveToken(e,n,i,a,o){let s=this.tokens.get(e);if(!s)return;if(a.direct){this.tokenPos.set(e,i),s.classList.add("is-hop"),await G(120);let u=Math.max(0,this.slotsAt(i,o).indexOf(e)),m=this.coordsFor(i,u);s.style.transition="left 0.5s cubic-bezier(.3,1.4,.5,1), top 0.5s cubic-bezier(.3,1.4,.5,1)",s.style.left=`${m.left}px`,s.style.top=`${m.top}px`,await G(520),s.style.transition="",s.classList.remove("is-hop");return}let l=a.backward??(n-i+40)%40===3,c=l?(n-i+40)%40:(i-n+40)%40,d=c>12?95:170,h=n;for(let u=0;u<c;u++){h=l?(h+39)%40:(h+1)%40;let m=Ne(h),y=l?m==="bottom"?"right":m==="left"||m==="top"?"left":"right":m==="bottom"?"left":m==="left"||m==="top"?"right":"left";this.facing.get(e)!==y&&this.setFacing(e,y),this.tokenPos.set(e,h);let M=h===i?Math.max(0,this.slotsAt(h,o).indexOf(e)):0,b=this.coordsFor(h,M);s.style.transitionDuration=`${d}ms, ${d}ms`,s.style.left=`${b.left}px`,s.style.top=`${b.top}px`,s.classList.remove("is-hop"),s.offsetWidth,s.classList.add("is-hop"),T.step(),await G(d)}s.style.transitionDuration="",s.classList.remove("is-hop"),this.placeTokens({...o,players:o.players.map(u=>u.id===e?{...u,position:i}:{...u,position:this.tokenPos.get(u.id)??u.position})},!0),this.flash(i)}flash(e){let n=this.spaces[e];n&&(n.classList.remove("is-landing"),n.offsetWidth,n.classList.add("is-landing"))}highlight(e){this.spaces.forEach((n,i)=>n.classList.toggle("is-highlight",i===e))}async showDice(e,n){if(n){T.dice();for(let i of this.dice)i.classList.remove("is-rolling"),i.offsetWidth,i.classList.add("is-rolling");await G(450)}if(this.dice[0].innerHTML=D(e[0]),this.dice[1].innerHTML=D(e[1]),n){await G(600);for(let i of this.dice)i.classList.remove("is-rolling")}}};var be=class{constructor(){p(this,"open",new Map)}show(e,n,i={}){this.close(e);let a=r("div",{class:`dialog paper ${i.wide?"dialog--wide":""}`},n),o=r("div",{class:`overlay ${i.passive?"is-passive":""}`},a);i.dismissible&&o.addEventListener("click",l=>{l.target===o&&s.close()}),document.body.appendChild(o);let s={el:a,close:()=>{o.remove(),this.open.get(e)===s&&this.open.delete(e),i.onClose?.()}};return this.open.set(e,s),s}has(e){return this.open.has(e)}get(e){return this.open.get(e)}close(e){this.open.get(e)?.close()}closeAll(e=[]){for(let n of[...this.open.keys()])e.includes(n)||this.close(n)}};function Ie(t,e,n,i="Yes",a="Cancel"){let o=r("div",null,r("p",{style:{fontSize:"1.1em",margin:"4px 0 0"}},e),r("div",{class:"buttons"},r("button",{class:"btn",type:"button",onClick:()=>t.close("confirm")},a),r("button",{class:"btn btn--primary",type:"button",onClick:()=>{t.close("confirm"),n()}},i)));t.show("confirm",o,{dismissible:!0})}function U(t,e){return e===null?"the Bank":t.players.find(n=>n.id===e)?.name??"?"}function Rt(t,e){return e===null?"#666":t.players.find(n=>n.id===e)?.color??"#666"}function q(t,e){return r("b",{style:{color:Rt(t,e)}},U(t,e))}function $t(t,e){return Object.entries(t.properties).filter(([,n])=>n.owner===e).map(([n])=>Number(n)).sort((n,i)=>n-i)}function jn(t,e){return e.type!=="property"||!e.group?!1:I[e.group].some(n=>(t.properties[n]?.houses??0)>0)}function Qe(t,e,n={}){let i=t.board[e],a=t.properties[e],o=F(i),s=i.group?Be.has(i.group):i.type==="utility",l=r("div",{class:`deed-band ${s?"is-light":""}`,style:{"--band":o}},r("div",{class:"kind"},i.type==="property"?"TITLE DEED":i.type==="railroad"?"RAILROAD":"UTILITY"),r("div",{class:"dname"},i.name)),c=r("div",{class:"deed-body"}),d=a?.owner??null,h=y=>y.filter(M=>d&&t.properties[M]?.owner===d).length,u=r("table"),m=(y,M,b=!1)=>u.appendChild(r("tr",{class:b?"is-active":""},r("td",null,y),r("td",null,M)));if(i.type==="property"&&i.rent){let y=a?.houses??0,M=!!d&&I[i.group].every(b=>t.properties[b]?.owner===d);m("Rent",f(i.rent[0]),y===0&&!M),m("Rent with full set",f(i.rent[0]*2),y===0&&M);for(let b=1;b<=4;b++)m(`With ${b} house${b>1?"s":""}`,f(i.rent[b]),y===b);m("With hotel",f(i.rent[5]),y===5),c.appendChild(u),c.appendChild(r("div",{class:"foot"},`Houses cost ${f(i.houseCost)} each \\xB7 Mortgage value ${f(R(i))}`))}else if(i.type==="railroad"){c.appendChild(r("span",{class:"deed-icon",html:x.railroad}));let y=h(V);[25,50,100,200].forEach((M,b)=>m(`Rent with ${b+1} railroad${b>0?"s":""}`,f(M),y===b+1)),c.appendChild(u),c.appendChild(r("div",{class:"foot"},`Mortgage value ${f(R(i))}`))}else if(i.type==="utility"){c.appendChild(r("span",{class:"deed-icon",html:/water/i.test(i.name)?x.water:x.electric}));let y=h(W);m("One utility owned","4 \\xD7 dice",y===1),m("Both utilities owned","10 \\xD7 dice",y===2),c.appendChild(u),c.appendChild(r("div",{class:"foot"},`Mortgage value ${f(R(i))}`))}return d?(c.appendChild(r("div",{class:"deed-owner"},r("span",{class:"dot",style:{"--owner":Rt(t,d)}}),"Owned by ",q(t,d),a?.mortgaged?r("span",{class:"tag"},"mortgaged"):null)),n.diceTotal!==void 0&&!a?.mortgaged&&c.appendChild(r("div",{class:"foot"},`Current rent: ${f(Re(t,e,n.diceTotal))}`))):c.appendChild(r("div",{class:"deed-owner"},r("span",{class:"muted"},`Unowned \\xB7 Price ${f(i.price??0)}`))),r("div",{class:"deed paper paper--flat"},l,c)}function jt(t,e,n,i,a){let o=t.board[e],s=o.price??0,l=n.cash>=s;return r("div",null,r("h2",null,r("span",{class:"ico",html:x.dollar}),`Buy ${o.name}?`),Qe(t,e),r("p",{class:"muted",style:{textAlign:"center"}},`You have ${f(n.cash)}. `,l?"":"You cannot afford this."),r("div",{class:"buttons"},r("button",{class:"btn",type:"button",onClick:()=>i({type:"decline"})},a?"Decline (auction)":"Decline"),r("button",{class:"btn btn--good btn--lg",type:"button",disabled:!l,onClick:()=>i({type:"buy"})},`Buy for ${f(s)}`)))}var ye=class{constructor(e){p(this,"el",r("div",{class:"auction"}));p(this,"bidsEl",r("div",{class:"bids"}));p(this,"input",r("input",{class:"input",type:"number",min:1,step:1}));p(this,"status",r("div",{class:"hand",style:{fontSize:"1.15em",margin:"6px 0"}}));p(this,"form",r("div",{class:"bidform"}));p(this,"deedHost",r("div"));p(this,"send");p(this,"lastSpace",-1);p(this,"high",null);this.send=e;let n=r("button",{class:"btn btn--good",type:"button",onClick:()=>this.bid()},"Bid"),i=r("button",{class:"btn",type:"button",onClick:()=>e({type:"passAuction"})},"Pass"),a=o=>r("button",{class:"btn btn--sm",type:"button",onClick:()=>{this.input.value=String(this.minBid()+o-1),this.bid()}},`+${o}`);this.input.addEventListener("keydown",o=>{o.key==="Enter"&&this.bid()}),this.form.append(this.input,n,a(1),a(10),a(50),i),this.el.append(r("h2",null,r("span",{class:"ico",html:x.hammer}),"Auction"),this.deedHost,this.status,this.bidsEl,this.form)}minBid(){return(this.high??0)+1}bid(){let e=Math.floor(Number(this.input.value));if(!Number.isFinite(e)||e<this.minBid()){this.input.value=String(this.minBid());return}this.send({type:"bid",amount:e})}update(e,n){let i=e.auction;if(!i)return;i.space!==this.lastSpace&&(v(this.deedHost),this.deedHost.appendChild(Qe(e,i.space)),this.lastSpace=i.space),this.high=i.highBid;let a=i.current??i.active[0];v(this.bidsEl);for(let d of e.players){if(d.bankrupt)continue;let h=!i.active.includes(d.id),u=i.highBidder===d.id;this.bidsEl.appendChild(r("div",{class:`bidrow ${u?"is-high":""} ${h?"is-out":""}`},r("span",null,q(e,d.id),d.id===a&&!h?r("span",{class:"tag",style:{marginLeft:"6px"}},"bidding"):null),r("span",null,u?`High bid ${f(i.highBid)}`:h?"passed":`cash ${f(d.cash)}`)))}let o=a===n&&i.active.includes(n),s=Q(e,n),l=o&&s.includes("bid");this.form.classList.toggle("hidden",!o),this.form.querySelectorAll("button, input").forEach(d=>d.disabled=!l&&!d.textContent?.includes("Pass"));let c=e.players.find(d=>d.id===n);this.input.min=String(this.minBid()),(!this.input.value||Number(this.input.value)<this.minBid())&&(this.input.value=String(this.minBid())),this.status.textContent=o?`Your bid. Minimum ${f(this.minBid())}, you have ${f(c?.cash??0)}.`:`${U(e,a??null)} is deciding\\u2026 ${i.highBidder?`High bid ${f(i.highBid)} by ${U(e,i.highBidder)}.`:"No bids yet."}`}};async function Ot(t,e,n){T.card();let i=r("div",{class:`card-pop ${e}`},r("div",{class:"card-head"},r("span",{html:e==="chance"?x.chance:x.chest}),e==="chance"?"CHANCE":"COMMUNITY CHEST"),r("div",{class:"card-text hand"},n),r("div",{class:"muted small",style:{textAlign:"center",paddingBottom:"10px"}},"click to continue")),a=t.show("card",i,{dismissible:!0});a.el.style.padding="0",a.el.style.overflow="hidden";let o=!1,s=new Promise(l=>{let c=()=>{o||(o=!0,a.close(),l())};a.el.addEventListener("click",c),a.el.parentElement?.addEventListener("click",c),setTimeout(c,4200)});await G(1500)}var se=class{constructor(e,n){p(this,"el",r("div",{class:"manage"}));p(this,"list",r("div"));p(this,"cashEl",r("span",{class:"money"}));p(this,"supply",r("span",{class:"muted small"}));p(this,"send");this.send=e,this.el.append(r("h2",null,r("span",{class:"ico",html:x.hammer}),"Manage properties"),r("div",{class:"row-between",style:{marginBottom:"8px"}},r("span",null,"Cash: ",this.cashEl),this.supply),this.list,r("div",{class:"buttons"},r("button",{class:"btn",type:"button",onClick:n},"Done")))}update(e,n){let i=e.players.find(s=>s.id===n);this.cashEl.textContent=f(i.cash),this.supply.textContent=`Bank has ${e.housesLeft} houses, ${e.hotelsLeft} hotels`,v(this.list);let a=$t(e,n);if(a.length===0){this.list.appendChild(r("p",{class:"muted"},"You do not own anything yet."));return}let o=new Map;for(let s of a){let l=e.board[s],c=l.type==="property"?l.group:l.type;o.has(c)||o.set(c,[]),o.get(c).push(s)}for(let[s,l]of o){let c=r("div",{class:"group"});for(let d of l){let h=e.board[d],u=e.properties[d],m=r("span",{class:`chip ${u.mortgaged?"is-mortgaged":""}`,style:{"--chip":ae[s]??"#999"}}),y=u.mortgaged?"mortgaged":u.houses===5?"hotel":u.houses>0?`${u.houses} house${u.houses>1?"s":""}`:"",M=r("div",{class:"pb"});if(h.type==="property"){let X=ne(e,n,d),Ce=re(e,n,d);M.append(r("button",{class:"btn btn--sm btn--good",type:"button",disabled:!X.ok,title:X.ok?`Build for ${f(h.houseCost)}`:X.reason??"",onClick:()=>this.send({type:"build",space:d})},u.houses===4?"Hotel":"Build",` ${f(h.houseCost)}`),r("button",{class:"btn btn--sm",type:"button",disabled:!Ce.ok,title:Ce.ok?`Sell for ${f(h.houseCost/2)}`:Ce.reason??"",onClick:()=>this.send({type:"sellHouse",space:d})},"Sell"))}let b=ie(e,n,d),O=oe(e,n,d);u.mortgaged?M.appendChild(r("button",{class:"btn btn--sm btn--blue",type:"button",disabled:!O.ok,title:O.ok?"":O.reason??"",onClick:()=>this.send({type:"unmortgage",space:d})},`Unmortgage ${f(Math.ceil(R(h)*1.1))}`)):M.appendChild(r("button",{class:"btn btn--sm",type:"button",disabled:!b.ok,title:b.ok?"":b.reason??"",onClick:()=>this.send({type:"mortgage",space:d})},`Mortgage +${f(R(h))}`)),c.appendChild(r("div",{class:"prow"},m,r("div",{class:"pn"},h.name," ",r("small",null,y)),M))}this.list.appendChild(c)}}},xe=class{constructor(e,n){p(this,"el",r("div"));p(this,"text",r("p",{style:{fontSize:"1.1em"}}));p(this,"manage");p(this,"payBtn",r("button",{class:"btn btn--good btn--lg",type:"button"}));p(this,"bankruptBtn",r("button",{class:"btn btn--primary",type:"button"}));this.manage=new se(e,()=>{}),this.manage.el.querySelector(".buttons")?.remove(),this.manage.el.querySelector("h2")?.remove(),this.payBtn.addEventListener("click",()=>e({type:"payDebt"})),this.bankruptBtn.addEventListener("click",()=>Ie(n,"Declare bankruptcy? You will be out of the game.",()=>e({type:"declareBankruptcy"}),"Declare bankruptcy")),this.el.append(r("h2",null,r("span",{class:"ico",html:x.incometax}),"You owe money"),this.text,this.manage.el,r("div",{class:"buttons"},this.bankruptBtn,this.payBtn))}update(e,n){let i=e.debt,a=e.players.find(s=>s.id===n);v(this.text),this.text.append("You owe ",r("b",null,f(i.amount))," to ",q(e,i.creditor),` (${i.reason}). You have `,r("b",null,f(a.cash)),". Sell houses or mortgage properties to raise cash."),this.manage.update(e,n);let o=Q(e,n);this.payBtn.disabled=!o.includes("payDebt"),this.payBtn.textContent=`Pay ${f(i.amount)}`,this.bankruptBtn.textContent="Declare bankruptcy",this.bankruptBtn.disabled=!o.includes("declareBankruptcy")}},we=class{constructor(e,n,i,a,o){p(this,"el",r("div",{class:"trade"}));p(this,"partnerSel",r("select",{class:"input"}));p(this,"cols",r("div",{class:"cols"}));p(this,"send");p(this,"state");p(this,"meId");p(this,"offer",{cash:0,properties:[],jailCards:0});p(this,"request",{cash:0,properties:[],jailCards:0});this.send=e,this.state=n,this.meId=i;let s=n.players.filter(c=>c.id!==i&&!c.bankrupt);for(let c of s)this.partnerSel.appendChild(r("option",{value:c.id,selected:c.id===o},c.name));this.partnerSel.addEventListener("change",()=>{this.request={cash:0,properties:[],jailCards:0},this.render()});let l=r("button",{class:"btn btn--good",type:"button",onClick:()=>this.propose()},"Propose trade");this.el.append(r("h2",null,r("span",{class:"ico",html:x.trade}),"Propose a trade"),r("div",{class:"field"},r("label",null,"Trade with"),this.partnerSel),this.cols,r("div",{class:"buttons"},r("button",{class:"btn",type:"button",onClick:a},"Cancel"),l)),this.render()}update(e){this.state=e,this.render()}side(e,n,i){let a=this.state,o=r("div",{class:"plist"});for(let c of $t(a,e.id)){let d=a.board[c],h=a.properties[c],u=jn(a,d),m=r("input",{type:"checkbox",checked:n.properties.includes(c),disabled:u});m.addEventListener("change",()=>{n.properties=m.checked?[...n.properties,c]:n.properties.filter(y=>y!==c)}),o.appendChild(r("label",{class:u?"is-locked":"",title:u?"Sell the buildings in this color group first":""},m,r("span",{class:`chip ${h.mortgaged?"is-mortgaged":""}`,style:{"--chip":F(d)}}),d.name,h.mortgaged?r("span",{class:"tag"},"mortgaged"):null))}o.hasChildNodes()||o.appendChild(r("span",{class:"muted small"},"No properties"));let s=r("input",{class:"input",type:"number",min:0,max:e.cash,step:1,value:String(n.cash)});s.addEventListener("change",()=>{n.cash=Math.max(0,Math.min(e.cash,Math.floor(Number(s.value)||0))),s.value=String(n.cash)});let l=r("input",{class:"input",type:"number",min:0,max:e.jailCards,step:1,value:String(n.jailCards),style:{width:"5em"}});return l.addEventListener("change",()=>{n.jailCards=Math.max(0,Math.min(e.jailCards,Math.floor(Number(l.value)||0))),l.value=String(n.jailCards)}),r("div",{class:"col paper paper--flat"},r("h3",null,i," ",r("span",{class:"muted small"},`(${f(e.cash)} cash)`)),r("div",{class:"cash"},"Cash $",s),e.jailCards>0?r("div",{class:"cash"},"Jail cards",l):null,o)}render(){let e=this.state.players.find(i=>i.id===this.meId),n=this.state.players.find(i=>i.id===this.partnerSel.value);if(v(this.cols),!n){this.cols.appendChild(r("p",{class:"muted"},"Nobody to trade with."));return}this.cols.append(this.side(e,this.offer,"You give"),this.side(n,this.request,`${n.name} gives`))}propose(){let e=this.partnerSel.value;e&&(this.offer.cash===0&&this.offer.properties.length===0&&this.offer.jailCards===0&&this.request.cash===0&&this.request.properties.length===0&&this.request.jailCards===0||this.send({type:"proposeTrade",to:e,offer:this.offer,request:this.request}))}};function Ht(t,e){let n=(i,a)=>{let o=[];a.cash&&o.push(r("span",{class:"money"},f(a.cash)));for(let s of a.properties)o.push(r("span",{class:"tag",style:{background:F(t.board[s]),color:Be.has(t.board[s].group??t.board[s].type)?"#2b2118":"#fff"}},t.board[s].name));return a.jailCards&&o.push(r("span",{class:"tag"},`${a.jailCards} jail card${a.jailCards>1?"s":""}`)),o.length===0&&o.push(r("span",{class:"muted"},"nothing")),r("div",{class:"line"},q(t,i)," gives: ",...o)};return r("div",{class:"summary"},n(e.from,e.offer),n(e.to,e.request))}function Nt(t,e,n,i){let o=Q(t,i).includes("acceptTrade");return r("div",{class:"trade"},r("h2",null,r("span",{class:"ico",html:x.trade}),`${U(t,e.from)} proposes a trade`),Ht(t,e),r("div",{class:"buttons"},r("button",{class:"btn",type:"button",onClick:()=>n({type:"rejectTrade",tradeId:e.id})},"Reject"),r("button",{class:"btn btn--good",type:"button",disabled:!o,onClick:()=>n({type:"acceptTrade",tradeId:e.id})},"Accept")))}function Bt(t,e,n,i,a){let o=r("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}});for(let s of t.trades){let l=s.from===e,c=s.to===e;o.appendChild(r("div",{class:"paper paper--flat",style:{padding:"8px 10px"}},Ht(t,s),r("div",{class:"buttons",style:{marginTop:"6px"}},l?r("button",{class:"btn btn--sm",type:"button",onClick:()=>n({type:"rejectTrade",tradeId:s.id})},"Cancel offer"):null,c?r("button",{class:"btn btn--sm",type:"button",onClick:()=>n({type:"rejectTrade",tradeId:s.id})},"Reject"):null,c?r("button",{class:"btn btn--sm btn--good",type:"button",onClick:()=>n({type:"acceptTrade",tradeId:s.id})},"Accept"):null,!l&&!c?r("span",{class:"muted small"},"between other players"):null)))}return t.trades.length===0&&o.appendChild(r("p",{class:"muted"},"No open trade offers.")),r("div",null,r("h2",null,r("span",{class:"ico",html:x.trade}),"Trades"),o,r("div",{class:"buttons"},r("button",{class:"btn",type:"button",onClick:i},"Close"),r("button",{class:"btn btn--good",type:"button",onClick:a},"New trade")))}function It(t,e,n,i,a,o){let s=t.board[e],l=t.properties[e],c=r("div",{class:"buttons"});if(l?.owner===n){if(s.type==="property"){let u=ne(t,n,e),m=re(t,n,e);c.append(r("button",{class:"btn btn--sm btn--good",type:"button",disabled:!u.ok,title:u.reason??"",onClick:()=>i({type:"build",space:e})},`Build ${f(s.houseCost)}`),r("button",{class:"btn btn--sm",type:"button",disabled:!m.ok,title:m.reason??"",onClick:()=>i({type:"sellHouse",space:e})},"Sell house"))}let d=ie(t,n,e),h=oe(t,n,e);l.mortgaged?c.appendChild(r("button",{class:"btn btn--sm btn--blue",type:"button",disabled:!h.ok,title:h.reason??"",onClick:()=>i({type:"unmortgage",space:e})},`Unmortgage ${f(Math.ceil(R(s)*1.1))}`)):c.appendChild(r("button",{class:"btn btn--sm",type:"button",disabled:!d.ok,title:d.reason??"",onClick:()=>i({type:"mortgage",space:e})},`Mortgage +${f(R(s))}`))}else l?.owner&&!t.players.find(d=>d.id===l.owner)?.bankrupt&&t.phase!=="ended"&&c.appendChild(r("button",{class:"btn btn--sm btn--blue",type:"button",onClick:()=>o(l.owner)},`Offer a trade to ${U(t,l.owner)}`));return c.appendChild(r("button",{class:"btn btn--sm",type:"button",onClick:a},"Close")),r("div",null,Qe(t,e,{diceTotal:t.dice?t.dice[0]+t.dice[1]:7}),c)}function Qt(t,e,n,i,a,o="Back to lobby"){let s=[...t.players].map(d=>({p:d,worth:d.bankrupt?-1:me(t,d.id)})).sort((d,h)=>h.worth-d.worth),l=t.players.find(d=>d.id===t.winner),c=s.map(({p:d,worth:h})=>r("div",{class:`srow paper paper--flat ${d.id===t.winner?"is-winner":""}`},r("span",{html:N(d.token)}),r("span",null,r("b",{style:{color:d.color}},d.name),d.id===e?r("span",{class:"tag tag--you",style:{marginLeft:"6px"}},"you"):null,d.bankrupt?r("span",{class:"tag",style:{marginLeft:"6px"}},"bankrupt"):null),r("span",{class:"money"},d.bankrupt?"\\u2014":f(h))));return r("div",null,l?r("span",{class:"winner-crown",html:x.crown}):null,r("h2",{style:{justifyContent:"center"}},l?`${l.name} wins!`:"Game over"),r("div",{class:"standings"},...c),r("div",{class:"buttons"},r("button",{class:"btn",type:"button",onClick:i},"Leave"),n?r("button",{class:"btn btn--good",type:"button",onClick:a},o):r("span",{class:"muted small"},"Waiting for the host\\u2026")))}function Dt(t){let e=r("div",{class:"confetti"});for(let n=0;n<90;n++){let i=r("i",{style:{left:`${Math.random()*100}%`,background:t[n%t.length],animationDuration:`${2+Math.random()*2.5}s`,animationDelay:`${Math.random()*1.5}s`,transform:`rotate(${Math.random()*360}deg)`}});e.appendChild(i)}document.body.appendChild(e),setTimeout(()=>e.remove(),6e3)}var ke=class{constructor(e,n,i,a={}){p(this,"root");p(this,"handlers");p(this,"board");p(this,"playersEl",r("div",{class:"game__players"}));p(this,"actionsEl",r("div",{class:"actions paper paper--flat"}));p(this,"logEl",r("div",{class:"log"}));p(this,"chatInput",r("input",{class:"input",placeholder:"Say something\\u2026",maxLength:200}));p(this,"timerEl",r("span",{class:"timer paper paper--flat hidden"}));p(this,"modals",new be);p(this,"state",null);p(this,"meId");p(this,"room",null);p(this,"queue",[]);p(this,"processing",!1);p(this,"timerEndsAt",null);p(this,"timerHandle",null);p(this,"manage",null);p(this,"auction",null);p(this,"debt",null);p(this,"trade",null);p(this,"lastCash",new Map);p(this,"seenTrades",new Set);p(this,"incomingShown",null);p(this,"gameOverShown",!1);p(this,"lastLogCount",0);p(this,"opts");p(this,"locked",[]);this.root=e,this.meId=n,this.opts=a,this.handlers={...i,send:d=>{this.lockButtons(),i.send(d)}},v(e),this.board=new ge(d=>this.openDeed(d));let o=r("form",{class:"chatform",onSubmit:d=>{d.preventDefault();let h=this.chatInput.value.trim();h&&(i.chat(h),this.chatInput.value="")}},this.chatInput,r("button",{class:"btn btn--sm",type:"submit"},"Send")),s=r("button",{class:"btn btn--sm",type:"button",title:"Toggle sound"},de()?"\\u{1F507}":"\\u{1F50A}");s.addEventListener("click",()=>{Fe(!de()),s.textContent=de()?"\\u{1F507}":"\\u{1F50A}"});let l=r("button",{class:"btn btn--sm",type:"button",onClick:()=>Ie(this.modals,a.leaveText??"Leave the game? If it is still running you will forfeit.",()=>this.handlers.leave(),"Leave")},"Leave"),c=r("div",{class:"logbox paper paper--flat"},r("h3",null,a.chat===!1?"Log":"Log & chat",r("span",{class:"topbar"},s,l)),this.logEl,a.chat===!1?null:o);e.appendChild(r("div",{class:"game"},this.playersEl,r("div",{class:"game__board"},this.board.wrap),r("div",{class:"game__actions"},this.actionsEl),r("div",{class:"game__log"},c))),this.timerHandle=window.setInterval(()=>this.tickTimer(),500)}lockButtons(){this.locked=[],document.querySelectorAll(".dialog button, .actions button").forEach(e=>{e.disabled||(e.disabled=!0,this.locked.push(e))})}onError(){for(let e of this.locked)e.disabled=!1;this.locked=[],this.state&&!this.processing&&this.renderActions()}destroy(){this.timerHandle&&clearInterval(this.timerHandle),this.modals.closeAll()}setRoom(e){this.room=e}setTimer(e){this.timerEndsAt=e,this.tickTimer()}tickTimer(){if(!this.timerEndsAt){this.timerEl.classList.add("hidden");return}let e=Math.max(0,Math.ceil((this.timerEndsAt-Date.now())/1e3));this.timerEl.classList.remove("hidden"),this.timerEl.textContent=`\\u23F1 ${Math.floor(e/60)}:${String(e%60).padStart(2,"0")}`,this.timerEl.classList.toggle("is-low",e<=10)}addChat(e){let n=r("div",{class:`entry ${e.from?"chat":"system"}`});e.from?n.append(r("b",{style:{color:this.state?this.playerColor(e.from):"inherit"}},e.name),": ",e.text):n.append(e.text),this.logEl.appendChild(n),this.logEl.scrollTop=this.logEl.scrollHeight,e.from&&e.from!==this.meId&&T.notify()}playerColor(e){return this.state?.players.find(n=>n.id===e)?.color??"inherit"}onState(e,n){let i=!this.state;if(this.state=e,i){this.board.build(e);for(let a of e.players)this.lastCash.set(a.id,a.cash);for(let a of e.log)this.appendLog(a,e);this.lastLogCount=e.log.length,this.render(),this.opts.onIdle?.();return}this.locked=[],this.queue.push(...n),this.processing||this.process()}async process(){for(this.processing=!0,this.renderActions();this.queue.length;){let e=this.queue.shift(),n=this.state;try{await this.animate(e,n)}catch(i){console.error(i)}this.appendLog(e,n)}this.processing=!1,this.render(),this.opts.onIdle?.()}async animate(e,n){switch(e.type){case"rolled":await this.board.showDice(e.dice,!0);return;case"moved":await this.board.moveToken(e.player,e.from,e.to,{direct:e.direct,backward:e.backwards},n),await G(120);return;case"paid":e.to===this.meId?T.cash():e.from===this.meId&&T.pay(),this.bumpCash(e.from,-e.amount),this.bumpCash(e.to,e.amount),await G(250);return;case"card":await Ot(this.modals,e.deck,e.text);return;case"bought":T.cash(),this.board.updateStatic(n),this.board.flash(e.space),await G(250);return;case"built":case"soldHouse":T.build(),this.board.updateStatic(n),await G(150);return;case"mortgaged":case"unmortgaged":case"auctionEnded":case"tradeAccepted":case"bankrupt":this.board.updateStatic(n),this.renderPlayers(),await G(150);return;case"jailed":T.jail(),this.board.updateStatic(n),await G(300);return;case"turnStarted":this.board.updateStatic(n),e.player===this.meId&&(T.turn(),B("Your turn!"));return;case"freeParking":T.cash(),await G(200);return;case"gameOver":return;default:return}}bumpCash(e,n){if(!e)return;let i=this.playersEl.querySelector(`[data-player="${e}"] .pcash`);if(!i)return;let a=(this.lastCash.get(e)??0)+n;this.lastCash.set(e,a),i.textContent=f(a),i.classList.remove("bump-up","bump-down"),i.offsetWidth,i.classList.add(n>=0?"bump-up":"bump-down")}render(){let e=this.state;this.board.updateStatic(e),this.board.placeTokens(e,!0);for(let n of e.players)this.lastCash.set(n.id,n.cash);this.renderPlayers(),this.renderActions(),this.syncDialogs()}renderPlayers(){let e=this.state;v(this.playersEl);for(let n of e.players){let i=e.players[e.currentPlayer]?.id===n.id&&e.phase!=="ended",a=r("div",{class:"pprops"});for(let[s,l]of Object.entries(e.properties)){if(l.owner!==n.id)continue;let c=e.board[Number(s)];a.appendChild(r("span",{class:`chip ${l.mortgaged?"is-mortgaged":""}`,title:`${c.name}${l.mortgaged?" (mortgaged)":""}`,style:{"--chip":F(c)},onClick:()=>this.openDeed(Number(s))},l.houses>0?r("span",{class:"h"},l.houses===5?"H":String(l.houses)):null))}let o=r("div",{class:`pcard paper paper--flat ${i?"is-current":""} ${n.bankrupt?"is-bankrupt":""}`,dataset:{player:n.id},style:{"--pcolor":n.color}},r("span",{class:"ptoken",html:N(n.token)}),r("div",null,r("div",{class:"pname"},n.name,n.id===this.meId?r("span",{class:"tag tag--you"},"you"):null,this.room?.hostId===n.id?r("span",{class:"tag tag--host"},"host"):null,n.inJail?r("span",{class:"tag tag--jail"},"in jail"):null,n.connected?null:r("span",{class:"tag tag--off"},"away"),n.bankrupt?r("span",{class:"tag"},"bankrupt"):null),r("div",{class:"pcash"},n.bankrupt?"\\u2014":f(n.cash))),a,r("div",{class:"pmeta muted"},n.bankrupt?null:`worth ${f(me(e,n.id))}`,n.jailCards>0?` \\xB7 ${n.jailCards} jail card${n.jailCards>1?"s":""}`:null));this.playersEl.appendChild(o)}}renderActions(){let e=this.state;v(this.actionsEl);let n=(...y)=>pe(this.actionsEl,y),i=e.players.find(y=>y.id===this.meId),a=this.processing,o=i&&!a?new Set(Q(e,this.meId)):new Set,s=(y,M,b="btn",O=!0)=>r("button",{class:b,type:"button",disabled:!O,onClick:()=>{T.click(),this.handlers.send(M)}},y),l=e.players[e.currentPlayer],c=e.dice?r("span",{class:"dice-mini",html:D(e.dice[0])+D(e.dice[1])}):null;if(e.phase==="ended"){n(r("span",{class:"hint"},"Game over."),r("span",{class:"spacer"}),r("button",{class:"btn",type:"button",onClick:()=>this.syncDialogs(!0)},"Show standings"));return}if(!i||i.bankrupt){n(r("span",{class:"hint"},"You are out of the game. Enjoy the show!"));return}if(a){n(c,r("span",{class:"hint"},"\\u2026"),r("span",{class:"spacer"}),this.timerEl);return}let d=l?.id===this.meId,h;if(e.phase==="roll"&&d)i.inJail?(h=r("span",{class:"hint"},`You are in jail (turn ${i.jailTurns+1} of ${e.config.maxJailTurns}). Roll doubles to get out, or pay.`),n(h,s("Roll for doubles",{type:"roll"},"btn btn--primary btn--lg",o.has("roll")),s(`Pay ${f(e.config.jailFine)}`,{type:"payJailFine"},"btn btn--warn",o.has("payJailFine")),i.jailCards>0?s("Use jail card",{type:"useJailCard"},"btn btn--blue",o.has("useJailCard")):null)):(h=r("span",{class:"hint"},e.canRollAgain?"Doubles! Roll again.":"Your turn."),n(h,s("Roll dice",{type:"roll"},"btn btn--primary btn--lg",o.has("roll"))));else if(e.phase==="action"&&d)h=r("span",{class:"hint"},"Build, trade, or end your turn."),n(c,h,s("End turn",{type:"endTurn"},"btn btn--primary btn--lg",o.has("endTurn")));else if(e.phase==="buy"&&d)h=r("span",{class:"hint"},`Buy ${e.board[e.pendingSpace??0]?.name}?`),n(c,h,r("button",{class:"btn btn--good",type:"button",onClick:()=>this.syncDialogs(!0)},"Show offer"));else if(e.phase==="auction")h=r("span",{class:"hint"},`Auction for ${e.board[e.auction?.space??0]?.name}`),n(h,r("button",{class:"btn btn--good",type:"button",onClick:()=>this.syncDialogs(!0)},"Show auction"));else if(e.phase==="debt"){let y=e.debt;h=r("span",{class:"hint"},y.debtor===this.meId?`You owe ${f(y.amount)}.`:`${U(e,y.debtor)} is raising ${f(y.amount)}\\u2026`),n(h,y.debtor===this.meId?r("button",{class:"btn btn--primary",type:"button",onClick:()=>this.syncDialogs(!0)},"Raise money"):null)}else h=r("span",{class:"hint"},"","Waiting for ",q(e,l?.id??null),"\\u2026"),n(c,h);n(r("span",{class:"spacer"}));let u=o.has("build")||o.has("sellHouse")||o.has("mortgage")||o.has("unmortgage"),m=e.trades.filter(y=>y.to===this.meId||y.from===this.meId).length;n(r("button",{class:"btn",type:"button",disabled:e.phase==="debt"&&e.debt?.debtor!==this.meId,onClick:()=>this.openManage()},r("span",{class:"ico",html:x.hammer}),u?"Manage":"Properties"),r("button",{class:"btn",type:"button",disabled:!o.has("proposeTrade")&&m===0,onClick:()=>this.openTrades()},r("span",{class:"ico",html:x.trade}),m?`Trades (${m})`:"Trade"),this.timerEl)}syncDialogs(e=!1){let n=this.state,i=n.players.find(u=>u.id===this.meId),a=n.players[n.currentPlayer]?.id===this.meId,o=n.phase==="buy"&&a&&!!i&&!i.bankrupt,s=n.phase==="auction"&&!!n.auction,l=n.phase==="debt"&&n.debt?.debtor===this.meId,c=n.phase==="ended";if(o&&(e||!this.modals.has("buy"))?this.modals.show("buy",jt(n,n.pendingSpace,i,this.handlers.send,n.config.auctions)):o||this.modals.close("buy"),s?((!this.auction||e||!this.modals.has("auction"))&&(this.auction=new ye(this.handlers.send),this.modals.show("auction",this.auction.el,{passive:!1})),this.auction.update(n,this.meId)):this.modals.has("auction")&&(this.modals.close("auction"),this.auction=null),l?((!this.debt||e||!this.modals.has("debt"))&&(this.debt=new xe(this.handlers.send,this.modals),this.modals.show("debt",this.debt.el,{wide:!0})),this.debt.update(n,this.meId)):this.modals.has("debt")&&(this.modals.close("debt"),this.debt=null),this.manage&&this.modals.has("manage")){let u=new Set(Q(n,this.meId));n.phase==="debt"&&n.debt?.debtor!==this.meId?this.modals.close("manage"):this.manage.update(n,this.meId)}this.trade&&this.modals.has("trade")&&(Q(n,this.meId).includes("proposeTrade")?this.trade.update(n):this.modals.close("trade")),this.modals.has("trades")&&this.openTrades(!0);let d=n.trades.filter(u=>u.to===this.meId);this.incomingShown&&!d.some(u=>u.id===this.incomingShown)&&(this.modals.close("incoming"),this.incomingShown=null);let h=d.find(u=>!this.seenTrades.has(u.id));h&&!this.incomingShown&&!o&&!l&&!s&&(this.seenTrades.add(h.id),this.incomingShown=h.id,T.notify(),this.modals.show("incoming",Nt(n,h,this.handlers.send,this.meId),{dismissible:!0,onClose:()=>{this.incomingShown=null}}));for(let u of n.trades)this.seenTrades.add(u.id);c&&(e||!this.gameOverShown)&&(this.gameOverShown=!0,this.modals.closeAll(),n.players.find(m=>m.id===n.winner)?.id===this.meId?(T.win(),Dt(n.players.map(m=>m.color))):T.lose(),this.modals.show("over",Qt(n,this.meId,this.room?.hostId===this.meId,this.handlers.leave,this.handlers.restart,this.opts.restartLabel),{dismissible:!0}))}openManage(){let e=this.state;this.manage=new se(this.handlers.send,()=>this.modals.close("manage")),this.manage.update(e,this.meId),this.modals.show("manage",this.manage.el,{wide:!0,dismissible:!0,onClose:()=>{this.manage=null}})}openTrades(e=!1){let n=this.state,i=Bt(n,this.meId,this.handlers.send,()=>this.modals.close("trades"),()=>{this.modals.close("trades"),this.openTradeComposer()});if(e&&this.modals.has("trades")){let a=this.modals.get("trades").el;v(a),a.appendChild(i);return}if(n.trades.length===0){this.openTradeComposer();return}this.modals.show("trades",i,{dismissible:!0})}openTradeComposer(e){let n=this.state;if(!Q(n,this.meId).includes("proposeTrade")){B("You cannot trade right now","error");return}this.trade=new we(this.handlers.send,n,this.meId,()=>this.modals.close("trade"),e),this.modals.show("trade",this.trade.el,{wide:!0,dismissible:!0,onClose:()=>{this.trade=null}})}onTradeProposed(){this.modals.close("trade")}openDeed(e){let n=this.state;if(!n)return;let i=n.board[e];(i.type==="property"||i.type==="railroad"||i.type==="utility")&&(this.board.highlight(e),this.modals.show("deed",It(n,e,this.meId,a=>{this.handlers.send(a)},()=>this.modals.close("deed"),a=>{this.modals.close("deed"),this.openTradeComposer(a)}),{dismissible:!0,onClose:()=>this.board.highlight(null)}))}refreshDeed(){this.modals.has("deed")&&this.modals.close("deed")}appendLog(e,n){let i=On(e,n);if(!i)return;let a=r("div",{class:"entry"},...i);for(this.logEl.appendChild(a);this.logEl.children.length>300;)this.logEl.firstElementChild?.remove();this.logEl.scrollTop=this.logEl.scrollHeight,(e.type==="tradeAccepted"||e.type==="bought"||e.type==="mortgaged"||e.type==="unmortgaged"||e.type==="built"||e.type==="soldHouse")&&this.refreshDeed()}};function On(t,e){let n=a=>q(e,a),i=a=>r("b",null,e.board[a]?.name??`#${a}`);switch(t.type){case"rolled":return[n(t.player),` rolled ${t.dice[0]} + ${t.dice[1]}${t.doubles?" (doubles!)":""}`];case"moved":return t.passedGo?[n(t.player)," passed Go and landed on ",i(t.to)]:[n(t.player),t.direct?" went to ":" landed on ",i(t.to)];case"paid":return[n(t.from),` paid ${f(t.amount)} to `,n(t.to),t.reason?` (${t.reason})`:""];case"bought":return[n(t.player)," bought ",i(t.space),` for ${f(t.price)}`];case"declined":return[n(t.player)," declined to buy ",i(t.space)];case"auctionStarted":return["Auction started for ",i(t.space)];case"bid":return[n(t.player),` bid ${f(t.amount)}`];case"auctionEnded":return t.winner?[n(t.winner)," won the auction for ",i(t.space),` at ${f(t.amount)}`]:["Nobody bid on ",i(t.space)];case"card":return[n(t.player),` drew ${t.deck==="chance"?"Chance":"Community Chest"}: \\u201C${t.text}\\u201D`];case"built":return[n(t.player),t.houses===5?" built a hotel on ":" built a house on ",i(t.space)];case"soldHouse":return[n(t.player)," sold a building on ",i(t.space)];case"mortgaged":return[n(t.player)," mortgaged ",i(t.space)];case"unmortgaged":return[n(t.player)," lifted the mortgage on ",i(t.space)];case"jailed":return[n(t.player),` went to jail (${t.reason})`];case"freed":return[n(t.player),t.how==="doubles"?" rolled doubles and left jail":t.how==="card"?" used a Get Out of Jail Free card":t.how==="fine"?" paid the fine and left jail":" had to pay and leave jail"];case"tradeProposed":return[n(t.trade.from)," proposed a trade to ",n(t.trade.to)];case"tradeAccepted":return[n(t.trade.to)," accepted a trade from ",n(t.trade.from)];case"tradeRejected":return["Trade between ",n(t.trade.from)," and ",n(t.trade.to)," was declined"];case"debt":return[n(t.player),` owes ${f(t.amount)} to `,n(t.creditor)];case"bankrupt":return[n(t.player)," went bankrupt",t.creditor?[" to ",n(t.creditor)]:""].flat();case"freeParking":return[n(t.player),` collected ${f(t.amount)} from Free Parking`];case"turnStarted":return[r("span",{class:"muted"},`\\u2014 Turn ${t.turnNumber}: `),n(t.player)];case"turnEnded":return null;case"gameOver":return[r("b",null,"\\u{1F3C6} "),n(t.winner)," wins the game!"];default:return null}}function Zt(t,e,n){let i=r("div"),a=(s,l,c,d,h,u=1)=>{let m=r("input",{class:"input",type:"number",min:d,max:h,step:u,value:String(t[s]??0),disabled:!e,id:`rule-${s}`});m.addEventListener("change",()=>n({[s]:Number(m.value)})),i.appendChild(r("div",{class:"rule"},r("div",null,r("div",{class:"rlabel"},l),r("div",{class:"rhint"},c)),m))},o=(s,l,c)=>{let d=r("button",{class:`switch ${t[s]?"is-on":""}`,type:"button",role:"switch","aria-checked":String(!!t[s]),"aria-label":l,disabled:!e,id:`rule-${s}`,onClick:()=>n({[s]:!t[s]})});i.appendChild(r("div",{class:"rule"},r("div",null,r("div",{class:"rlabel"},l),r("div",{class:"rhint"},c)),d))};return a("startingCash","Starting cash","Everyone begins with this much.",100,1e4,50),a("goSalary","Salary for passing Go","Collected each lap.",0,2e3,10),o("auctions","Auctions","A property nobody buys goes to auction (official rule)."),o("freeParkingJackpot","Free Parking jackpot","Taxes and fees pile up; land there to collect."),o("doubleGoSalary","Double salary on Go","Landing exactly on Go pays twice."),a("jailFine","Jail fine","Cost to leave jail early.",0,1e3,10),a("maxJailTurns","Max turns in jail","Then you must pay and move.",1,6),i}function _t(t,e,n){let i=r("select",{class:"input",disabled:!e,id:"rule-turnTimerSeconds"});for(let[a,o]of[[0,"Off"],[30,"30 s"],[60,"60 s"],[90,"90 s"],[120,"2 min"],[180,"3 min"],[300,"5 min"]])i.appendChild(r("option",{value:String(a),selected:(t.turnTimerSeconds??0)===a},o));return i.addEventListener("change",()=>n({turnTimerSeconds:Number(i.value)||null})),r("div",{class:"rule"},r("div",null,r("div",{class:"rlabel"},"Turn timer"),r("div",{class:"rhint"},"Slow players get auto-played.")),i)}function Jt(){return r("div",{class:"muted small",style:{marginTop:"8px"}},r("span",{class:"ico",html:x.timer,style:{width:"1em",display:"inline-block",verticalAlign:"middle"}})," Only the host can change the rules.")}var ve=class{constructor(e,n){p(this,"root");p(this,"handlers");p(this,"playersEl",r("div",{class:"players"}));p(this,"tokenGrid",r("div",{class:"token-grid"}));p(this,"rulesEl",r("div"));p(this,"startBtn",r("button",{class:"btn btn--primary btn--lg",type:"button"},"Start game"));p(this,"codeEl",r("span",{class:"code paper paper--flat"}));p(this,"linkEl",r("input",{class:"input",readOnly:!0,style:{maxWidth:"300px"}}));p(this,"hint",r("div",{class:"muted small",style:{marginTop:"8px"}}));p(this,"me",null);p(this,"room",null);this.root=e,this.handlers=n,v(e),this.startBtn.addEventListener("click",()=>n.onStart());let i=r("button",{class:"btn btn--sm",type:"button",onClick:()=>this.copyLink()},"Copy invite link"),a=r("button",{class:"btn btn--sm",type:"button",onClick:()=>n.onLeave()},"Leave"),o=r("div",null,r("h1",null,"Waiting room"),r("div",{class:"muted small"},"Share the code or the link. Friends can join from any browser."),r("div",{class:"code-box"},this.codeEl,i),this.linkEl,r("h2",{style:{fontSize:"1.1em",margin:"16px 0 6px"}},"Players"),this.playersEl,r("div",{class:"my-token"},r("span",{style:{fontWeight:"600"}},"Your token:"),this.tokenGrid),r("div",{class:"actions"},this.startBtn,a),this.hint),s=r("div",{class:"rules paper paper--flat paper--tilt-r"},r("h2",null,"House rules"),this.rulesEl);e.appendChild(r("div",{class:"screen-center"},r("div",{class:"lobby paper"},o,s)))}copyLink(){let e=this.linkEl.value;navigator.clipboard?.writeText(e).then(()=>B("Invite link copied"),()=>{this.linkEl.select(),B("Select and copy the link")})}update(e,n){this.room=e,this.me=n;let i=e.hostId===n;this.codeEl.textContent=e.code,this.linkEl.value=`${location.origin}/${e.code}`,v(this.playersEl);for(let l of e.players){let c=r("div",{class:"player-row paper paper--flat",style:{"--pcolor":l.color}},r("span",{html:N(l.token)}),r("div",null,r("div",{class:"pname"},l.name,l.id===n?r("span",{class:"tag tag--you",style:{marginLeft:"6px"}},"you"):null),r("div",{class:"pmeta"},l.isHost?r("span",{class:"tag tag--host"},"host"):null,l.connected?null:r("span",{class:"tag tag--off"},"disconnected"),r("span",{class:"tag",style:{background:l.color,color:"#fff"}},Y.find(d=>d.id===l.token)?.name??l.token))),i&&l.id!==n?r("button",{class:"btn btn--sm",type:"button",onClick:()=>this.handlers.onKick(l.id)},"Remove"):r("span"));if(l.id===n){let d=r("button",{class:"btn btn--sm",type:"button",onClick:()=>{let h=prompt("Your name",l.name);h!==null&&h.trim()&&this.handlers.onSetName(h.trim())}},"Rename");c.lastElementChild.replaceWith(d)}this.playersEl.appendChild(c)}v(this.tokenGrid);let a=e.players.find(l=>l.id===n),o=new Set(e.players.filter(l=>l.id!==n).map(l=>l.token));for(let l of Y){let c=r("button",{class:`token-pick ${a?.token===l.id?"is-selected":""} ${o.has(l.id)?"is-taken":""}`,type:"button",title:l.name,disabled:o.has(l.id),onClick:()=>this.handlers.onSetToken(l.id)},r("span",{html:N(l.id)}),r("span",{class:"name"},l.name));this.tokenGrid.appendChild(c)}this.renderRules(e.config,i);let s=e.players.filter(l=>l.connected).length;this.startBtn.disabled=!i||s<2,this.startBtn.classList.toggle("hidden",!i),this.hint.textContent=i?s<2?"You need at least 2 players to start.":`${s} players ready. Up to ${e.maxPlayers} can join.`:"Waiting for the host to start the game\\u2026"}renderRules(e,n){v(this.rulesEl),this.rulesEl.appendChild(Zt(e,n,i=>this.handlers.onSetConfig(i))),this.rulesEl.appendChild(_t(e,n,i=>this.handlers.onSetConfig(i))),n||this.rulesEl.appendChild(Jt())}};var Le=document.getElementById("app");document.body.insertAdjacentHTML("afterbegin",ze);document.addEventListener("pointerdown",Ye,{once:!0});var w=new ue,P=new he,le=null,$=null,Hn=null,zt=location.pathname.replace(/^\\//,"").toUpperCase(),_e=/^[A-Z0-9]{4}$/.test(zt)?zt:"";function Je(){$?.destroy(),$=null,le=null,w.set({screen:"home",room:null,game:null,playerId:null}),Pt(Le,{onCreate:(t,e)=>P.send({t:"create",name:t,token:e}),onJoin:(t,e,n)=>P.send({t:"join",code:t,name:e,token:n})},_e)}function Yt(){$?.destroy(),$=null,w.set({screen:"lobby",game:null}),le=new ve(Le,{onSetToken:t=>P.send({t:"setToken",token:t}),onSetName:t=>P.send({t:"setName",name:t}),onSetConfig:t=>P.send({t:"setConfig",config:t}),onKick:t=>{confirm("Remove this player?")&&P.send({t:"kick",playerId:t})},onStart:()=>P.send({t:"start"}),onLeave:()=>Ft()}),w.state.room&&w.state.playerId&&le.update(w.state.room,w.state.playerId)}function De(){le=null,w.set({screen:"game"}),$=new ke(Le,w.state.playerId,{send:t=>P.send({t:"action",action:t}),chat:t=>P.send({t:"chat",text:t}),leave:()=>Ft(),restart:()=>P.send({t:"restart"})}),w.state.room&&$.setRoom(w.state.room);for(let t of w.state.chat)$.addChat(t)}function Ft(){P.send({t:"leave"}),P.session=null,te(null,null),history.replaceState(null,"","/"),Je()}P.on(t=>{if(!(!(w.state.playerId!==null)&&(t.t==="room"||t.t==="state"||t.t==="timer"||t.t==="chat"||t.t==="chatHistory")))switch(t.t){case"welcome":{w.set({playerId:t.playerId,room:t.room,chat:[]}),Hn=t.room.code,te(t.session,t.room.code),history.replaceState(null,"",`/${t.room.code}`),t.room.status==="lobby"?Yt():w.state.screen!=="game"?De():$?.setRoom(t.room);return}case"room":{let n=w.state.room;if(w.set({room:t.room}),t.room.status==="lobby"&&w.state.screen!=="lobby"){Yt();return}t.room.status!=="lobby"&&w.state.screen==="lobby"&&De(),le?.update(t.room,w.state.playerId),$?.setRoom(t.room);return}case"state":{w.set({game:t.state}),w.state.screen!=="game"&&De(),$?.onState(t.state,t.events),t.events.some(n=>n.type==="tradeProposed"&&n.trade.from===w.state.playerId)&&$?.onTradeProposed();return}case"timer":w.set({timerEndsAt:t.endsAt}),$?.setTimer(t.endsAt);return;case"chat":w.state.chat.push(t.message),w.state.chat.length>100&&w.state.chat.shift(),$?.addChat(t.message);return;case"chatHistory":w.set({chat:t.messages});return;case"error":B(t.message,"error"),$?.onError(),t.fatal&&(te(null,null),P.session=null,history.replaceState(null,"","/"),Je());return;case"left":return;case"pong":return}});P.onStatus(t=>{w.set({connection:t}),t==="closed"&&w.state.screen!=="home"&&B("Connection lost, reconnecting\\u2026","error",1500)});var Ze=qe();Ze&&(!_e||Ze.code===_e)?(P.session=Ze.session,Le.appendChild(r("div",{class:"screen-center"},r("div",{class:"paper",style:{padding:"20px 28px",fontWeight:"600"}},"Reconnecting\\u2026"))),P.connect()):(te(null,null),Je(),P.connect());})();\n', css: `:root{--ink: #2b2118;--ink-soft: #5b4a3a;--paper: #fbf3e0;--paper-2: #f3e7c9;--paper-3: #e8d9b5;--paper-edge: #fffaf0;--wood: #8b5a2b;--wood-dark: #6e4520;--accent: #d9413a;--accent-2: #2f7fd6;--good: #3aa655;--warn: #e8b923;--shadow: rgba(43, 33, 24, .35);--font-ui: "Fredoka", "Trebuchet MS", "Segoe UI", sans-serif;--font-hand: "Patrick Hand", "Comic Sans MS", cursive;--g-brown: #8b4a2b;--g-lightblue: #7ec8e3;--g-pink: #d94f9a;--g-orange: #ef8a2b;--g-red: #d9413a;--g-yellow: #f2c94c;--g-green: #3aa655;--g-darkblue: #2f4fa8;--g-railroad: #2b2118;--g-utility: #9aa0a6}*{box-sizing:border-box}html,body{margin:0;height:100%}body{font-family:var(--font-ui);color:var(--ink);background:repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 2px,transparent 2px 38px),repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 7px),linear-gradient(180deg,#9a6431,#7d4d22);min-height:100%;overflow-x:hidden}button,input,select{font:inherit;color:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.55}.hidden{display:none!important}.sr-only{position:absolute;left:-9999px}.app{min-height:100vh;display:flex;flex-direction:column}.paper{background:var(--paper);border:3px solid var(--ink);border-radius:10px;box-shadow:0 6px 0 -2px var(--paper-edge),0 8px 0 -1px var(--ink),0 14px 18px -6px var(--shadow);position:relative}.paper:after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.9;mix-blend-mode:multiply}.paper--flat{box-shadow:0 3px 0 -1px var(--ink),0 6px 10px -4px var(--shadow)}.paper--tilt-l{transform:rotate(-.8deg)}.paper--tilt-r{transform:rotate(.7deg)}.btn{display:inline-flex;align-items:center;justify-content:center;gap:.4em;background:var(--paper-2);border:3px solid var(--ink);border-radius:10px;padding:.5em 1.1em;font-weight:600;letter-spacing:.01em;line-height:1.1;box-shadow:0 4px 0 0 var(--ink);transform:translateY(0);transition:transform .08s,box-shadow .08s;white-space:nowrap;user-select:none}.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 0 0 var(--ink)}.btn:active:not(:disabled){transform:translateY(3px);box-shadow:0 1px 0 0 var(--ink)}.btn--primary{background:var(--accent);color:#fff}.btn--blue{background:var(--accent-2);color:#fff}.btn--good{background:var(--good);color:#fff}.btn--warn{background:var(--warn)}.btn--ghost{background:transparent;box-shadow:none;border-color:transparent;text-decoration:underline;padding:.3em .5em}.btn--sm{padding:.3em .7em;font-size:.85em;border-width:2px;box-shadow:0 3px 0 0 var(--ink);border-radius:8px}.btn--lg{font-size:1.25em;padding:.6em 1.4em}.btn--icon{padding:.35em;width:2.4em;height:2.4em}.btn .ico{width:1.3em;height:1.3em;display:inline-block}.btn .ico svg{width:100%;height:100%;display:block}.input{background:var(--paper-edge);border:3px solid var(--ink);border-radius:10px;padding:.5em .8em;width:100%;outline:none;box-shadow:inset 0 2px #0000000f}.input:focus{border-color:var(--accent-2)}.input--code{text-transform:uppercase;letter-spacing:.25em;font-weight:700;text-align:center;font-size:1.4em}.field{display:flex;flex-direction:column;gap:.3em;margin-bottom:.9em}.field label{font-weight:600;font-size:.9em;color:var(--ink-soft)}.tag{display:inline-block;padding:.1em .5em;border:2px solid var(--ink);border-radius:6px;font-size:.75em;font-weight:700;background:var(--paper-2);line-height:1.3}.tag--host{background:var(--warn)}.tag--off{background:#ccc;color:#444}.tag--jail{background:#9aa0a6;color:#fff}.tag--you{background:var(--accent-2);color:#fff}.title-art{font-family:var(--font-ui);font-weight:700;letter-spacing:.02em;line-height:.95;text-align:center;color:var(--paper);-webkit-text-stroke:2px var(--ink);text-shadow:3px 3px 0 var(--ink),6px 6px 0 var(--accent)}.title-art span{display:block}.hand{font-family:var(--font-hand)}.toast-host{position:fixed;left:50%;top:14px;transform:translate(-50%);z-index:90;display:flex;flex-direction:column;gap:8px;pointer-events:none}.toast{padding:.5em 1em;font-weight:600;animation:toast-in .25s ease-out}.toast--error{background:#ffd9d6}@keyframes toast-in{0%{transform:translateY(-20px) rotate(-2deg);opacity:0}to{transform:none;opacity:1}}.screen-center{flex:1;display:flex;align-items:center;justify-content:center;padding:24px 16px}.home{width:min(560px,100%);padding:28px 28px 24px}.home .title-art{font-size:clamp(2.4rem,8vw,4rem);margin:0 0 6px}.home .subtitle{text-align:center;margin:0 0 20px;color:var(--ink-soft);font-size:1.1em}.home .row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}.home .or{text-align:center;margin:14px 0 6px;font-weight:700;color:var(--ink-soft)}.token-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.token-pick{background:var(--paper-edge);border:3px solid var(--ink);border-radius:12px;padding:6px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 3px 0 0 var(--ink);transition:transform .1s}.token-pick svg{width:52px;height:52px}.token-pick .name{font-size:.75em;font-weight:600}.token-pick.is-selected{outline:4px solid var(--accent-2);outline-offset:-1px;transform:translateY(-2px) rotate(-2deg)}.token-pick.is-taken{opacity:.4}.token-pick.is-taken .name:after{content:" (taken)"}.lobby{width:min(980px,100%);padding:22px;display:grid;grid-template-columns:1.1fr 1fr;gap:22px}.lobby h1{margin:0 0 4px;font-size:1.6em}.lobby .code-box{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}.lobby .code{font-size:2.2em;font-weight:700;letter-spacing:.25em;padding:.05em .4em .05em .6em}.lobby .players{display:flex;flex-direction:column;gap:8px}.lobby .player-row{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;padding:6px 10px 6px 6px}.lobby .player-row svg{width:52px;height:52px}.lobby .player-row .pname{font-weight:700;font-size:1.05em}.lobby .player-row .pmeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}.lobby .rules{padding:14px 16px}.lobby .rules h2{margin:0 0 10px;font-size:1.15em}.rule{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;padding:6px 0;border-bottom:2px dashed var(--paper-3)}.rule:last-child{border-bottom:0}.rule .rlabel{font-weight:600}.rule .rhint{font-size:.8em;color:var(--ink-soft)}.rule input[type=number],.rule select{width:7.5em;padding:.25em .5em;border-width:2px;border-radius:8px}.switch{position:relative;width:52px;height:28px;border:3px solid var(--ink);border-radius:16px;background:var(--paper-3);box-shadow:inset 0 2px #00000014}.switch:after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:var(--paper-edge);border:2px solid var(--ink);transition:left .12s}.switch.is-on{background:var(--good)}.switch.is-on:after{left:24px}.switch:disabled{opacity:.7;cursor:default}.lobby .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.lobby .my-token{display:flex;align-items:center;gap:10px;margin:10px 0 14px;flex-wrap:wrap}.lobby .my-token .token-grid{grid-template-columns:repeat(8,1fr);gap:6px;flex:1;min-width:300px}.lobby .my-token .token-pick svg{width:34px;height:34px}.lobby .my-token .token-pick .name{display:none}.game{flex:1;display:grid;gap:12px;padding:12px;grid-template-columns:minmax(220px,280px) minmax(0,1fr) minmax(220px,300px);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"players board log" "players actions log";height:100vh;height:100dvh;min-height:0;max-height:100dvh;overflow:hidden}.game__players{grid-area:players;display:flex;flex-direction:column;gap:10px;overflow:auto;padding-right:4px;min-height:0}.game__board{grid-area:board;display:flex;align-items:center;justify-content:center;min-height:0;min-width:0}.game__log{grid-area:log;display:flex;flex-direction:column;min-height:0;overflow:hidden}.game__actions{grid-area:actions}@media(max-width:1100px){.game{grid-template-columns:minmax(200px,240px) minmax(0,1fr);grid-template-rows:auto auto auto;grid-template-areas:"players board" "actions actions" "log log";height:auto;max-height:none;overflow:visible}.game__log{height:300px}.game__players{overflow:visible}}@media(max-width:760px){.game{grid-template-columns:1fr;grid-template-areas:"board" "actions" "players" "log";padding:8px;gap:8px}.game__players{flex-direction:row;flex-wrap:wrap;overflow:visible}.game__players .pcard{flex:1 1 46%}}.board-wrap{position:relative;width:min(100%,calc(100dvh - 120px));aspect-ratio:1;max-width:900px}@media(max-width:760px){.board-wrap{width:100%;max-width:none}}.board{position:absolute;inset:0;display:grid;grid-template-columns:1.55fr repeat(9,1fr) 1.55fr;grid-template-rows:1.55fr repeat(9,1fr) 1.55fr;gap:.25em;padding:.45em;background:var(--paper);border:.32em solid var(--ink);border-radius:.9em;box-shadow:.35em .6em 0 -.1em var(--paper-edge),.4em .7em 0 0 var(--ink),0 1.4em 2em -.6em var(--shadow);transform:rotate(-.4deg);font-size:10px}.board:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");mix-blend-mode:multiply}.space{position:relative;background:var(--paper-edge);border:.22em solid var(--ink);border-radius:.5em;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;cursor:pointer;transition:transform .12s;z-index:1;min-width:0;min-height:0;box-shadow:0 .2em 0 0 var(--paper-3)}.space:hover{transform:translateY(-.15em) scale(1.03);z-index:3;box-shadow:0 .5em .6em -.2em var(--shadow)}.space--corner{font-weight:700}.space .band{position:absolute;background:var(--band, #999);border:.18em solid var(--ink)}.space--bottom .band{top:-.18em;left:-.18em;right:-.18em;height:26%;border-radius:.35em .35em 0 0}.space--top .band{bottom:-.18em;left:-.18em;right:-.18em;height:26%;border-radius:0 0 .35em .35em}.space--left .band{right:-.18em;top:-.18em;bottom:-.18em;width:26%;border-radius:0 .35em .35em 0}.space--right .band{left:-.18em;top:-.18em;bottom:-.18em;width:26%;border-radius:.35em 0 0 .35em}.space .sname{font-size:1.05em;font-weight:600;line-height:1.05;padding:0 .2em;word-break:break-word}.space .sprice{font-size:.95em;color:var(--ink-soft);font-weight:600}.space .sicon{width:3.2em;height:3.2em}.space--corner .sicon{width:5.5em;height:5.5em}.space--corner .sname{font-size:1.15em}.space--bottom .sname,.space--bottom .sprice{margin-top:.1em}.space--bottom .content,.space--top .content{padding-top:26%}.space--top .content{padding-top:0;padding-bottom:26%}.space--left .content{padding-right:26%}.space--right .content{padding-left:26%}.space .content{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em;width:100%;height:100%}.space--bottom .sicon,.space--top .sicon,.space--left .sicon,.space--right .sicon{width:2.6em;height:2.6em}.space .owner{position:absolute;width:1.6em;height:1.6em;border-radius:50%;border:.18em solid var(--ink);background:var(--owner, #999);box-shadow:0 .1em 0 0 var(--ink);z-index:2}.space--bottom .owner{bottom:.25em;right:.25em}.space--top .owner{top:.25em;right:.25em}.space--left .owner{bottom:.25em;left:.25em}.space--right .owner{bottom:.25em;right:.25em}.space .houses{position:absolute;display:flex;gap:.1em;z-index:2}.space--bottom .houses{top:.15em;left:50%;transform:translate(-50%)}.space--top .houses{bottom:.15em;left:50%;transform:translate(-50%)}.space--left .houses{right:.15em;top:50%;transform:translateY(-50%);flex-direction:column}.space--right .houses{left:.15em;top:50%;transform:translateY(-50%);flex-direction:column}.space .houses svg{width:1.5em;height:1.5em;filter:drop-shadow(0 .08em 0 var(--ink))}.space .houses svg.hotel{width:1.9em;height:1.9em}.space.is-mortgaged .content{opacity:.45}.space.is-mortgaged:after{content:"MORTGAGED";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-18deg);font-size:.8em;font-weight:800;color:var(--accent);border:.2em solid var(--accent);padding:0 .3em;border-radius:.3em;background:#fffaf0d9;letter-spacing:.05em;z-index:2}.space.is-highlight{outline:.35em solid var(--accent-2);outline-offset:-.1em}.space.is-landing{animation:land-flash .9s ease-out}@keyframes land-flash{0%{background:#fff3a6}to{background:var(--paper-edge)}}.center{grid-area:2 / 2 / 11 / 11;position:relative;display:grid;grid-template-rows:auto 1fr auto;align-items:center;justify-items:center;padding:1em 1.2em;z-index:0;gap:.4em}.center .logo{font-size:4.6em;transform:rotate(-4deg);margin-top:.2em}.center .logo .small{font-size:.42em;display:block;letter-spacing:.25em;-webkit-text-stroke:1px var(--ink);text-shadow:2px 2px 0 var(--ink)}.center .middle{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1.5em;width:100%}.deck{width:8.5em;height:5.6em;border:.22em solid var(--ink);border-radius:.6em;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em;font-weight:700;font-size:1em;box-shadow:.25em .3em 0 0 var(--ink),.5em .6em 0 0 var(--paper-edge),.55em .65em 0 0 var(--ink);background:var(--paper-2);transform:rotate(-6deg)}.deck--chest{transform:rotate(5deg);background:#dff1fa}.deck--chance{background:#ffe1b3}.deck svg{width:2.8em;height:2.8em}.dice-area{display:flex;flex-direction:column;align-items:center;gap:.5em}.dice{display:flex;gap:1em;perspective:40em;height:5.6em}.die{width:5em;height:5em;transform-style:preserve-3d;transition:transform .2s}.die svg{width:100%;height:100%;filter:drop-shadow(.15em .25em 0 var(--shadow))}.die.is-rolling{animation:tumble .9s ease-out}.die:nth-child(2).is-rolling{animation-duration:1.05s}@keyframes tumble{0%{transform:rotate3d(1,1,0,0) translateY(-3em) scale(1.1)}40%{transform:rotate3d(1,1,0,540deg) translateY(-1.2em) scale(1.15)}75%{transform:rotate3d(1,1,0,720deg) translateY(0) scale(1)}88%{transform:rotate3d(0,0,1,12deg) translateY(-.4em)}to{transform:none}}.turn-banner{font-size:1.5em;font-weight:700;padding:.25em .9em;transform:rotate(1.5deg);text-align:center;max-width:100%}.turn-banner .who{color:var(--who, var(--accent))}.pot{font-size:1.05em;font-weight:700;padding:.15em .7em;transform:rotate(-2deg);background:#e8f6e5}.center .bottom{display:flex;gap:1em;align-items:center;flex-wrap:wrap;justify-content:center}.token{position:absolute;width:5.6em;height:5.6em;margin:-2.8em 0 0 -2.8em;z-index:5;pointer-events:none;transition:left .18s linear,top .18s linear;transform-style:preserve-3d}.token .flip{width:100%;height:100%;transition:transform .18s;transform-origin:50% 50%}.token.face-left .flip{transform:scaleX(-1)}.token .flip svg{width:100%;height:100%;filter:drop-shadow(.2em .35em 0 var(--shadow))}.token.is-hop .flip{animation:hop .18s ease-out}@keyframes hop{0%{transform:translateY(0) scaleX(var(--sx, 1))}50%{transform:translateY(-1.6em) scaleX(var(--sx, 1)) rotate(var(--rot, -6deg))}to{transform:translateY(0) scaleX(var(--sx, 1))}}.token.is-current{z-index:6}.token.is-current:after{content:"";position:absolute;left:50%;bottom:-.4em;width:3.6em;height:1.1em;margin-left:-1.8em;border-radius:50%;border:.18em solid var(--ink);background:var(--tcolor, var(--accent));opacity:.85;z-index:-1;animation:pulse 1.2s infinite}@keyframes pulse{0%,to{transform:scale(1)}50%{transform:scale(1.12)}}.token.is-bankrupt{opacity:.35;filter:grayscale(1)}.token .badge{position:absolute;top:-.3em;right:-.3em;width:2em;height:2em}.pcard{padding:8px 10px;display:grid;grid-template-columns:44px 1fr;gap:8px 10px;align-items:center;border-left-width:8px;border-left-color:var(--pcolor, var(--ink))}.pcard.is-current{outline:4px solid var(--pcolor);outline-offset:2px}.pcard.is-bankrupt{opacity:.5;filter:grayscale(.8)}.pcard .ptoken svg{width:44px;height:44px}.pcard .pname{font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pcard .pcash{font-size:1.2em;font-weight:700;font-variant-numeric:tabular-nums}.pcard .pcash.bump-up{animation:bump-up .6s}.pcard .pcash.bump-down{animation:bump-down .6s}@keyframes bump-up{30%{color:var(--good);transform:scale(1.15)}}@keyframes bump-down{30%{color:var(--accent);transform:scale(1.15)}}.pcard .pprops{grid-column:1 / -1;display:flex;flex-wrap:wrap;gap:3px}.chip{width:16px;height:22px;border:2px solid var(--ink);border-radius:3px;background:var(--chip);position:relative}.chip.is-mortgaged{background:repeating-linear-gradient(45deg,var(--chip) 0 3px,#fff 3px 5px);opacity:.7}.chip .h{position:absolute;left:0;right:0;bottom:-2px;text-align:center;font-size:9px;font-weight:800;color:#fff;text-shadow:0 0 2px #000;line-height:1}.pcard .pmeta{grid-column:1 / -1;display:flex;gap:6px;flex-wrap:wrap;font-size:.85em}.actions{padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:64px}.actions .spacer{flex:1}.actions .hint{font-weight:600;color:var(--ink-soft)}.actions .timer{font-weight:700;font-variant-numeric:tabular-nums;padding:.2em .6em}.actions .timer.is-low{background:#ffd9d6;animation:pulse .6s infinite}.actions .dice-mini{display:flex;gap:4px}.actions .dice-mini svg{width:30px;height:30px}.logbox{padding:8px 10px;flex:1;display:flex;flex-direction:column;min-height:0}.logbox h3{margin:0 0 6px;font-size:1em;display:flex;justify-content:space-between;align-items:center}.log{flex:1 1 0;overflow-y:auto;font-size:.9em;display:flex;flex-direction:column;gap:3px;min-height:0}.log .entry{padding:2px 6px;border-radius:6px;background:#ffffff59;animation:entry-in .2s}.log .entry.chat{background:#e6f0ff}.log .entry.system{color:var(--ink-soft);font-style:italic}.log .entry b{color:var(--c, var(--ink))}@keyframes entry-in{0%{opacity:0;transform:translate(-6px)}}.chatform{display:flex;gap:6px;margin-top:6px}.chatform .input{padding:.35em .6em;border-width:2px}.overlay{position:fixed;inset:0;background:#2b211873;display:flex;align-items:center;justify-content:center;z-index:50;padding:16px;perspective:1200px}.overlay.is-passive{pointer-events:none;background:transparent}.overlay.is-passive .dialog{pointer-events:auto}.dialog{width:min(520px,100%);max-height:92vh;overflow:auto;padding:18px 20px;animation:flip-in .35s cubic-bezier(.2,.9,.3,1.2)}.dialog--wide{width:min(760px,100%)}.dialog h2{margin:0 0 10px;font-size:1.4em;display:flex;align-items:center;gap:8px}.dialog h2 .ico{width:1.3em;height:1.3em}.dialog .buttons{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}@keyframes flip-in{0%{transform:rotateX(-70deg) translateY(-30px);opacity:0}to{transform:none;opacity:1}}.deed{width:250px;margin:0 auto;padding:0;overflow:hidden}.deed .deed-band{background:var(--band);color:#fff;text-align:center;padding:8px 6px 6px;border-bottom:3px solid var(--ink);text-shadow:0 1px 0 rgba(0,0,0,.4)}.deed .deed-band.is-light{color:var(--ink);text-shadow:none}.deed .deed-band .kind{font-size:.7em;letter-spacing:.15em;opacity:.9}.deed .deed-band .dname{font-size:1.15em;font-weight:700}.deed .deed-body{padding:8px 12px 10px;font-size:.9em}.deed .deed-body table{width:100%;border-collapse:collapse}.deed .deed-body td{padding:2px 0}.deed .deed-body td:last-child{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}.deed .deed-body tr.is-active td{background:#fff3a6}.deed .deed-body .foot{margin-top:6px;border-top:2px dashed var(--paper-3);padding-top:6px;color:var(--ink-soft)}.deed .deed-icon{width:64px;height:64px;margin:6px auto 0;display:block}.deed .deed-owner{display:flex;align-items:center;gap:6px;margin-top:6px;font-weight:600}.deed .deed-owner .dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--ink);background:var(--owner)}.card-pop{width:min(420px,100%);padding:0;overflow:hidden}.card-pop .card-head{padding:12px 16px;border-bottom:3px solid var(--ink);display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.2em;letter-spacing:.05em}.card-pop.chance .card-head{background:#ffe1b3}.card-pop.chest .card-head{background:#dff1fa}.card-pop .card-head svg{width:36px;height:36px}.card-pop .card-text{padding:22px 20px;font-size:1.35em;text-align:center}.auction .bids{display:flex;flex-direction:column;gap:4px;margin:8px 0}.auction .bidrow{display:flex;justify-content:space-between;padding:4px 8px;border-radius:6px;background:#fff6}.auction .bidrow.is-high{background:#fff3a6;font-weight:700}.auction .bidrow.is-out{opacity:.5;text-decoration:line-through}.auction .bidform{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.auction .bidform .input{width:7em}.manage .group{margin-bottom:8px}.manage .prow{display:grid;grid-template-columns:14px 1fr auto;gap:8px;align-items:center;padding:4px 0;border-bottom:2px dashed var(--paper-3)}.manage .prow .pn{font-weight:600}.manage .prow .pn small{color:var(--ink-soft);font-weight:500}.manage .prow .pb{display:flex;gap:4px}.trade .cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}.trade .col{padding:10px}.trade .col h3{margin:0 0 6px;font-size:1em}.trade .plist{display:flex;flex-direction:column;gap:3px;max-height:220px;overflow:auto}.trade .plist label{display:flex;align-items:center;gap:6px;font-size:.9em}.trade .plist label.is-locked{opacity:.5}.trade .cash{display:flex;align-items:center;gap:6px;margin:6px 0}.trade .cash .input{width:7em}.trade .summary{display:flex;flex-direction:column;gap:4px;margin:6px 0}.trade .summary .line{display:flex;gap:6px;align-items:center;flex-wrap:wrap}@media(max-width:600px){.trade .cols{grid-template-columns:1fr}}.standings{display:flex;flex-direction:column;gap:6px;margin-top:8px}.standings .srow{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:8px;padding:6px 10px}.standings .srow svg{width:36px;height:36px}.standings .srow.is-winner{background:#fff3a6}.winner-crown{width:90px;height:90px;margin:0 auto;display:block;animation:crown-drop .8s cubic-bezier(.2,.9,.3,1.3)}@keyframes crown-drop{0%{transform:translateY(-60px) rotate(-20deg);opacity:0}}.confetti{position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden}.confetti i{position:absolute;top:-20px;width:10px;height:16px;border:2px solid var(--ink);animation:fall linear forwards}@keyframes fall{to{transform:translateY(110vh) rotate(720deg)}}.mini-token svg{width:1.6em;height:1.6em;vertical-align:middle}.money{font-variant-numeric:tabular-nums;font-weight:700}.muted{color:var(--ink-soft)}.small{font-size:.85em}.row-between{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.topbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.setup{width:min(980px,100%);padding:24px 26px;display:grid;grid-template-columns:1.15fr 1fr;gap:22px}.setup .title-art{font-size:clamp(2.2rem,7vw,3.4rem);margin:0 0 4px}.setup .subtitle{text-align:center;margin:0 0 16px;color:var(--ink-soft);font-size:1.05em}.setup .resume{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;margin-bottom:14px;background:#e8f6e5;flex-wrap:wrap}.setup .count-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.setup .bots{display:flex;gap:8px;flex-wrap:wrap}.setup .bot{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;font-weight:600}.setup .bot svg{width:36px;height:36px}.setup .rules{padding:14px 16px;align-self:start}.setup .rules h2{margin:0 0 10px;font-size:1.15em}@media(max-width:760px){.setup,.lobby{grid-template-columns:1fr}.setup .rules{transform:none}}
` };
}

// src/server/room.ts
import { randomBytes, randomInt } from "node:crypto";

// src/shared/board.ts
function property(index, name, group, price, rent, houseCost) {
  return { index, type: "property", name, group, price, rent, houseCost };
}
function railroad(index, name) {
  return { index, type: "railroad", name, price: 200 };
}
function utility(index, name) {
  return { index, type: "utility", name, price: 150 };
}
var BOARD = [
  { index: 0, type: "go", name: "Go" },
  property(1, "Mediterranean Avenue", "brown", 60, [2, 10, 30, 90, 160, 250], 50),
  { index: 2, type: "chest", name: "Community Chest" },
  property(3, "Baltic Avenue", "brown", 60, [4, 20, 60, 180, 320, 450], 50),
  { index: 4, type: "tax", name: "Income Tax", amount: 200 },
  railroad(5, "Reading Railroad"),
  property(6, "Oriental Avenue", "lightblue", 100, [6, 30, 90, 270, 400, 550], 50),
  { index: 7, type: "chance", name: "Chance" },
  property(8, "Vermont Avenue", "lightblue", 100, [6, 30, 90, 270, 400, 550], 50),
  property(9, "Connecticut Avenue", "lightblue", 120, [8, 40, 100, 300, 450, 600], 50),
  { index: 10, type: "jail", name: "Jail / Just Visiting" },
  property(11, "St. Charles Place", "pink", 140, [10, 50, 150, 450, 625, 750], 100),
  utility(12, "Electric Company"),
  property(13, "States Avenue", "pink", 140, [10, 50, 150, 450, 625, 750], 100),
  property(14, "Virginia Avenue", "pink", 160, [12, 60, 180, 500, 700, 900], 100),
  railroad(15, "Pennsylvania Railroad"),
  property(16, "St. James Place", "orange", 180, [14, 70, 200, 550, 750, 950], 100),
  { index: 17, type: "chest", name: "Community Chest" },
  property(18, "Tennessee Avenue", "orange", 180, [14, 70, 200, 550, 750, 950], 100),
  property(19, "New York Avenue", "orange", 200, [16, 80, 220, 600, 800, 1e3], 100),
  { index: 20, type: "freeparking", name: "Free Parking" },
  property(21, "Kentucky Avenue", "red", 220, [18, 90, 250, 700, 875, 1050], 150),
  { index: 22, type: "chance", name: "Chance" },
  property(23, "Indiana Avenue", "red", 220, [18, 90, 250, 700, 875, 1050], 150),
  property(24, "Illinois Avenue", "red", 240, [20, 100, 300, 750, 925, 1100], 150),
  railroad(25, "B&O Railroad"),
  property(26, "Atlantic Avenue", "yellow", 260, [22, 110, 330, 800, 975, 1150], 150),
  property(27, "Ventnor Avenue", "yellow", 260, [22, 110, 330, 800, 975, 1150], 150),
  utility(28, "Water Works"),
  property(29, "Marvin Gardens", "yellow", 280, [24, 120, 360, 850, 1025, 1200], 150),
  { index: 30, type: "gotojail", name: "Go To Jail" },
  property(31, "Pacific Avenue", "green", 300, [26, 130, 390, 900, 1100, 1275], 200),
  property(32, "North Carolina Avenue", "green", 300, [26, 130, 390, 900, 1100, 1275], 200),
  { index: 33, type: "chest", name: "Community Chest" },
  property(34, "Pennsylvania Avenue", "green", 320, [28, 150, 450, 1e3, 1200, 1400], 200),
  railroad(35, "Short Line"),
  { index: 36, type: "chance", name: "Chance" },
  property(37, "Park Place", "darkblue", 350, [35, 175, 500, 1100, 1300, 1500], 200),
  { index: 38, type: "tax", name: "Luxury Tax", amount: 100 },
  property(39, "Boardwalk", "darkblue", 400, [50, 200, 600, 1400, 1700, 2e3], 200)
];
var GROUPS = {
  brown: [1, 3],
  lightblue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  darkblue: [37, 39]
};
var RAILROADS = [5, 15, 25, 35];
var UTILITIES = [12, 28];
var GO_INDEX = 0;
var JAIL_INDEX = 10;
var RAILROAD_RENTS = [25, 50, 100, 200];
var UTILITY_MULTIPLIERS = [4, 10];
function isOwnable(space) {
  return space.type === "property" || space.type === "railroad" || space.type === "utility";
}
function mortgageValue(space) {
  return Math.floor((space.price ?? 0) / 2);
}

// src/shared/cards.ts
var CHANCE_CARDS = [
  { id: 0, text: "Advance to Go. (Collect $200)", effect: { kind: "advance", to: 0 } },
  { id: 1, text: "Advance to Illinois Avenue. If you pass Go, collect $200.", effect: { kind: "advance", to: 24 } },
  { id: 2, text: "Advance to St. Charles Place. If you pass Go, collect $200.", effect: { kind: "advance", to: 11 } },
  {
    id: 3,
    text: "Advance token to the nearest Utility. If unowned, you may buy it from the Bank. If owned, pay the owner ten times the amount shown on the dice.",
    effect: { kind: "nearestUtility" }
  },
  {
    id: 4,
    text: "Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.",
    effect: { kind: "nearestRailroad" }
  },
  {
    id: 5,
    text: "Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.",
    effect: { kind: "nearestRailroad" }
  },
  { id: 6, text: "Bank pays you dividend of $50.", effect: { kind: "collect", amount: 50 } },
  { id: 7, text: "Get Out of Jail Free. This card may be kept until needed or traded.", effect: { kind: "jailCard" } },
  { id: 8, text: "Go Back 3 Spaces.", effect: { kind: "goBack", spaces: 3 } },
  { id: 9, text: "Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.", effect: { kind: "goToJail" } },
  {
    id: 10,
    text: "Make general repairs on all your property: for each house pay $25, for each hotel pay $100.",
    effect: { kind: "repairs", perHouse: 25, perHotel: 100 }
  },
  { id: 11, text: "Pay poor tax of $15.", effect: { kind: "pay", amount: 15 } },
  { id: 12, text: "Take a trip to Reading Railroad. If you pass Go, collect $200.", effect: { kind: "advance", to: 5 } },
  { id: 13, text: "Take a walk on the Boardwalk. Advance token to Boardwalk.", effect: { kind: "advance", to: 39 } },
  { id: 14, text: "You have been elected Chairman of the Board. Pay each player $50.", effect: { kind: "payEach", amount: 50 } },
  { id: 15, text: "Your building loan matures. Collect $150.", effect: { kind: "collect", amount: 150 } }
];
var CHEST_CARDS = [
  { id: 0, text: "Advance to Go. (Collect $200)", effect: { kind: "advance", to: 0 } },
  { id: 1, text: "Bank error in your favor. Collect $200.", effect: { kind: "collect", amount: 200 } },
  { id: 2, text: "Doctor's fee. Pay $50.", effect: { kind: "pay", amount: 50 } },
  { id: 3, text: "From sale of stock you get $50.", effect: { kind: "collect", amount: 50 } },
  { id: 4, text: "Get Out of Jail Free. This card may be kept until needed or traded.", effect: { kind: "jailCard" } },
  { id: 5, text: "Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.", effect: { kind: "goToJail" } },
  { id: 6, text: "Holiday fund matures. Receive $100.", effect: { kind: "collect", amount: 100 } },
  { id: 7, text: "Income tax refund. Collect $20.", effect: { kind: "collect", amount: 20 } },
  { id: 8, text: "It is your birthday. Collect $10 from every player.", effect: { kind: "collectFromEach", amount: 10 } },
  { id: 9, text: "Life insurance matures. Collect $100.", effect: { kind: "collect", amount: 100 } },
  { id: 10, text: "Pay hospital fees of $100.", effect: { kind: "pay", amount: 100 } },
  { id: 11, text: "Pay school fees of $50.", effect: { kind: "pay", amount: 50 } },
  { id: 12, text: "Receive $25 consultancy fee.", effect: { kind: "collect", amount: 25 } },
  {
    id: 13,
    text: "You are assessed for street repairs: $40 per house, $115 per hotel.",
    effect: { kind: "repairs", perHouse: 40, perHotel: 115 }
  },
  { id: 14, text: "You have won second prize in a beauty contest. Collect $10.", effect: { kind: "collect", amount: 10 } },
  { id: 15, text: "You inherit $100.", effect: { kind: "collect", amount: 100 } }
];
var DECKS = {
  chance: CHANCE_CARDS,
  chest: CHEST_CARDS
};
var JAIL_CARD_ID = {
  chance: CHANCE_CARDS.find((c) => c.effect.kind === "jailCard").id,
  chest: CHEST_CARDS.find((c) => c.effect.kind === "jailCard").id
};

// src/engine/rng.ts
function next(state) {
  const a = state + 1831565813 | 0;
  let t = a;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const value = ((t ^ t >>> 14) >>> 0) / 4294967296;
  return { value, state: a };
}
function rollDie(state) {
  const r = next(state);
  return { die: Math.floor(r.value * 6) + 1, state: r.state };
}
function shuffle(arr, state) {
  const result = arr.slice();
  let s = state;
  for (let i = result.length - 1; i > 0; i--) {
    const r = next(s);
    s = r.state;
    const j = Math.floor(r.value * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return { result, state: s };
}

// src/engine/queries.ts
var OK = { ok: true };
function no(reason) {
  return { ok: false, reason };
}
function getPlayer(state, playerId) {
  return state.players.find((p) => p.id === playerId);
}
function currentPlayerId(state) {
  return state.players[state.currentPlayer].id;
}
function isCurrentPlayer(state, playerId) {
  return currentPlayerId(state) === playerId;
}
function activePlayers(state) {
  return state.players.filter((p) => !p.bankrupt);
}
function ownedSpaces(state, playerId) {
  return Object.keys(state.properties).map(Number).filter((i) => state.properties[i].owner === playerId).sort((a, b) => a - b);
}
function countOwned(state, playerId, spaces) {
  return spaces.filter((i) => state.properties[i]?.owner === playerId).length;
}
function ownsFullGroup(state, playerId, group) {
  return GROUPS[group].every((i) => state.properties[i]?.owner === playerId);
}
function groupHasBuildings(state, group) {
  return GROUPS[group].some((i) => (state.properties[i]?.houses ?? 0) > 0);
}
function mortgageInterest(space) {
  return Math.ceil(mortgageValue(space) / 10);
}
function unmortgageCost(space) {
  return mortgageValue(space) + mortgageInterest(space);
}
function houseSaleValue(space) {
  return Math.floor((space.houseCost ?? 0) / 2);
}
function rentFor(state, spaceIndex, diceTotal) {
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps || ps.owner === null || ps.mortgaged) return 0;
  switch (space.type) {
    case "property": {
      const rent = space.rent ?? [];
      if (ps.houses > 0) return rent[ps.houses] ?? 0;
      const base = rent[0] ?? 0;
      return space.group && ownsFullGroup(state, ps.owner, space.group) ? base * 2 : base;
    }
    case "railroad": {
      const n = countOwned(state, ps.owner, RAILROADS);
      return RAILROAD_RENTS[Math.min(Math.max(n, 1), 4) - 1];
    }
    case "utility": {
      const n = countOwned(state, ps.owner, UTILITIES);
      return UTILITY_MULTIPLIERS[Math.min(Math.max(n, 1), 2) - 1] * diceTotal;
    }
    default:
      return 0;
  }
}
function canManageProperty(state, playerId) {
  const p = getPlayer(state, playerId);
  if (!p) return no("Unknown player");
  if (p.bankrupt) return no("You are out of the game");
  switch (state.phase) {
    case "roll":
    case "action":
      return isCurrentPlayer(state, playerId) ? OK : no("Not your turn");
    case "debt":
      return state.debt?.debtor === playerId ? OK : no("Only the player in debt may manage property now");
    case "buy":
      return no("Decide on the purchase first");
    case "auction":
      return no("Not during an auction");
    default:
      return no("The game is over");
  }
}
function canBuild(state, playerId, spaceIndex) {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const p = getPlayer(state, playerId);
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no("Not a property");
  if (space.type !== "property" || !space.group) return no("Only streets can be built on");
  if (ps.owner !== playerId) return no("You do not own this property");
  if (!ownsFullGroup(state, playerId, space.group)) return no("You must own the whole color group");
  const group = GROUPS[space.group];
  if (group.some((i) => state.properties[i].mortgaged)) return no("A property in this group is mortgaged");
  if (ps.houses >= 5) return no("There is already a hotel here");
  const min = Math.min(...group.map((i) => state.properties[i].houses));
  if (ps.houses > min) return no("Build evenly: add houses to the least-built streets first");
  if (ps.houses === 4) {
    if (state.hotelsLeft < 1) return no("The bank has no hotels left");
  } else if (state.housesLeft < 1) {
    return no("The bank has no houses left");
  }
  if (p.cash < (space.houseCost ?? 0)) return no("Not enough cash");
  return OK;
}
function canSellHouse(state, playerId, spaceIndex) {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no("Not a property");
  if (space.type !== "property" || !space.group) return no("Not a street");
  if (ps.owner !== playerId) return no("You do not own this property");
  if (ps.houses === 0) return no("Nothing to sell");
  const max = Math.max(...GROUPS[space.group].map((i) => state.properties[i].houses));
  if (ps.houses < max) return no("Sell evenly: sell from the most-built streets first");
  if (ps.houses === 5 && state.housesLeft < 4) return no("The bank lacks the 4 houses needed to break up the hotel");
  return OK;
}
function canMortgage(state, playerId, spaceIndex) {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no("Not a property");
  if (ps.owner !== playerId) return no("You do not own this property");
  if (ps.mortgaged) return no("Already mortgaged");
  if (ps.houses > 0) return no("Sell the buildings first");
  if (space.group && groupHasBuildings(state, space.group)) return no("Sell all buildings in the color group first");
  return OK;
}
function canUnmortgage(state, playerId, spaceIndex) {
  const m = canManageProperty(state, playerId);
  if (!m.ok) return m;
  const p = getPlayer(state, playerId);
  const space = state.board[spaceIndex];
  const ps = state.properties[spaceIndex];
  if (!space || !ps) return no("Not a property");
  if (ps.owner !== playerId) return no("You do not own this property");
  if (!ps.mortgaged) return no("Not mortgaged");
  if (p.cash < unmortgageCost(space)) return no("Not enough cash");
  return OK;
}
function sideInterest(state, properties) {
  let total = 0;
  for (const i of properties) {
    if (state.properties[i]?.mortgaged) total += mortgageInterest(state.board[i]);
  }
  return total;
}
function sideIsEmpty(side) {
  return side.cash === 0 && side.jailCards === 0 && side.properties.length === 0;
}
function validateSide(state, side, owner) {
  if (!side || typeof side !== "object") return "Malformed trade";
  if (!Number.isInteger(side.cash) || side.cash < 0) return "Invalid cash amount";
  if (!Number.isInteger(side.jailCards) || side.jailCards < 0) return "Invalid jail card count";
  if (side.jailCards > owner.jailCards) return `${owner.name} does not have ${side.jailCards} Get Out of Jail Free card(s)`;
  if (!Array.isArray(side.properties)) return "Invalid property list";
  const seen = /* @__PURE__ */ new Set();
  for (const idx of side.properties) {
    if (!Number.isInteger(idx) || !(idx in state.properties)) return "Invalid property";
    if (seen.has(idx)) return "Duplicate property in trade";
    seen.add(idx);
    const space = state.board[idx];
    const ps = state.properties[idx];
    if (ps.owner !== owner.id) return `${owner.name} does not own ${space.name}`;
    if (ps.houses > 0) return `${space.name} has buildings`;
    if (space.group && groupHasBuildings(state, space.group)) return `The ${space.group} group has buildings`;
  }
  return null;
}
function canTradeNow(state, a, b) {
  switch (state.phase) {
    case "roll":
    case "action":
    case "buy":
      return OK;
    case "debt":
      return state.debt && (state.debt.debtor === a || state.debt.debtor === b) ? OK : no("Only trades involving the player in debt are allowed right now");
    case "auction":
      return no("Not during an auction");
    default:
      return no("The game is over");
  }
}
function validateTrade(state, t, checkCash) {
  const from = getPlayer(state, t.from);
  const to = getPlayer(state, t.to);
  if (!from || from.bankrupt) return "The proposer is not in the game";
  if (!to || to.bankrupt) return "The other player is not in the game";
  if (from.id === to.id) return "You cannot trade with yourself";
  const e1 = validateSide(state, t.offer, from);
  if (e1) return e1;
  const e2 = validateSide(state, t.request, to);
  if (e2) return e2;
  if (sideIsEmpty(t.offer) && sideIsEmpty(t.request)) return "The trade is empty";
  if (checkCash) {
    const fromNet = from.cash - t.offer.cash + t.request.cash - sideInterest(state, t.request.properties);
    if (fromNet < 0) return `${from.name} cannot afford this trade`;
    const toNet = to.cash - t.request.cash + t.offer.cash - sideInterest(state, t.offer.properties);
    if (toNet < 0) return `${to.name} cannot afford this trade`;
  }
  return null;
}
function canProposeTrade(state, playerId) {
  const p = getPlayer(state, playerId);
  if (!p) return no("Unknown player");
  if (p.bankrupt) return no("You are out of the game");
  if (state.phase === "auction" || state.phase === "ended") return canTradeNow(state, playerId, playerId);
  if (state.phase === "debt") {
    if (!state.debt) return no("No debt");
    return getPlayer(state, state.debt.debtor)?.bankrupt ? no("No one to trade with") : OK;
  }
  return activePlayers(state).length > 1 ? OK : no("No one to trade with");
}
function canAcceptTrade(state, playerId, trade) {
  if (trade.to !== playerId) return no("Only the recipient can accept");
  const phase = canTradeNow(state, trade.from, trade.to);
  if (!phase.ok) return phase;
  const err = validateTrade(state, trade, true);
  return err ? no(err) : OK;
}
function canRejectTrade(state, playerId, trade) {
  if (trade.to !== playerId && trade.from !== playerId) return no("Not your trade");
  if (state.phase === "auction") return no("Not during an auction");
  if (state.phase === "ended") return no("The game is over");
  return OK;
}
function nextSpaceOf(position, candidates) {
  const ahead = candidates.filter((i) => i > position);
  return ahead.length ? Math.min(...ahead) : Math.min(...candidates);
}

// src/engine/engine.ts
var DEFAULT_CONFIG = {
  startingCash: 1500,
  goSalary: 200,
  auctions: true,
  freeParkingJackpot: false,
  doubleGoSalary: false,
  jailFine: 50,
  maxJailTurns: 3,
  turnTimerSeconds: null
};
var LOG_CAP = 200;
var HOUSE_SUPPLY = 32;
var HOTEL_SUPPLY = 12;
var BOARD_SIZE = 40;
function createGame(config, players, seed) {
  if (!Array.isArray(players) || players.length < 2) throw new Error("At least two players are required");
  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) throw new Error("Player ids must be unique");
  const cfg = { ...DEFAULT_CONFIG };
  const overrides = config;
  for (const key of Object.keys(DEFAULT_CONFIG)) {
    const v = overrides[key];
    if (v !== void 0) cfg[key] = v;
  }
  let rng = seed | 0;
  const cardIds = Array.from({ length: 16 }, (_, i) => i);
  const chance = shuffle(cardIds, rng);
  rng = chance.state;
  const chest = shuffle(cardIds, rng);
  rng = chest.state;
  const properties = {};
  for (const space of BOARD) {
    if (isOwnable(space)) properties[space.index] = { owner: null, houses: 0, mortgaged: false };
  }
  const state = {
    config: cfg,
    board: deepFreeze(BOARD.map((s) => ({ ...s, ...s.rent ? { rent: s.rent.slice() } : {} }))),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      token: p.token,
      color: p.color,
      cash: cfg.startingCash,
      position: GO_INDEX,
      inJail: false,
      jailTurns: 0,
      jailCards: 0,
      bankrupt: false,
      connected: true
    })),
    currentPlayer: 0,
    phase: "roll",
    dice: null,
    doublesCount: 0,
    canRollAgain: false,
    pendingSpace: null,
    properties,
    auction: null,
    debt: null,
    trades: [],
    chanceDeck: chance.result,
    chestDeck: chest.result,
    housesLeft: HOUSE_SUPPLY,
    hotelsLeft: HOTEL_SUPPLY,
    freeParkingPot: 0,
    turnNumber: 1,
    rng,
    winner: null,
    log: [],
    pendingPayments: [],
    debtResume: null,
    jailCardOrigins: {},
    nextTradeId: 1
  };
  const ctx = { state, events: [] };
  emit(ctx, { type: "turnStarted", player: state.players[0].id, turnNumber: 1 });
  return state;
}
function legalActions(state, playerId) {
  const player = getPlayer(state, playerId);
  if (!player || player.bankrupt || state.phase === "ended") return [];
  const out = [];
  const isCurrent = currentPlayerId(state) === playerId;
  switch (state.phase) {
    case "roll":
      if (isCurrent) {
        out.push("roll");
        if (player.inJail && state.dice === null) {
          if (player.cash >= state.config.jailFine) out.push("payJailFine");
          if (player.jailCards > 0) out.push("useJailCard");
        }
      }
      break;
    case "buy":
      if (isCurrent && state.pendingSpace !== null) {
        const price = state.board[state.pendingSpace]?.price ?? 0;
        if (player.cash >= price) out.push("buy");
        out.push("decline");
      }
      break;
    case "auction":
      if (state.auction && state.auction.current === playerId) {
        if (player.cash > state.auction.highBid) out.push("bid");
        if (state.auction.highBidder !== playerId) out.push("passAuction");
      }
      break;
    case "debt":
      if (state.debt && state.debt.debtor === playerId) {
        if (player.cash >= state.debt.amount) out.push("payDebt");
        out.push("declareBankruptcy");
      }
      break;
    case "action":
      if (isCurrent) out.push("endTurn");
      break;
  }
  if (canManageProperty(state, playerId).ok) {
    const owned = ownedSpaces(state, playerId);
    if (owned.some((i) => canBuild(state, playerId, i).ok)) out.push("build");
    if (owned.some((i) => canSellHouse(state, playerId, i).ok)) out.push("sellHouse");
    if (owned.some((i) => canMortgage(state, playerId, i).ok)) out.push("mortgage");
    if (owned.some((i) => canUnmortgage(state, playerId, i).ok)) out.push("unmortgage");
  }
  if (canProposeTrade(state, playerId).ok) out.push("proposeTrade");
  if (state.trades.some((t) => canAcceptTrade(state, playerId, t).ok)) out.push("acceptTrade");
  if (state.trades.some((t) => canRejectTrade(state, playerId, t).ok)) out.push("rejectTrade");
  out.push("resign");
  return out;
}
function emit(ctx, event) {
  deepFreeze(event);
  ctx.events.push(event);
  ctx.state.log.push(event);
  if (ctx.state.log.length > LOG_CAP) ctx.state.log.splice(0, ctx.state.log.length - LOG_CAP);
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}
function cloneState(state) {
  const { board, log, ...rest } = state;
  const copy = structuredClone(rest);
  copy.board = board;
  copy.log = log.slice();
  return copy;
}
function fail(error) {
  return { ok: false, error };
}
function applyAction(state, playerId, action) {
  const player = getPlayer(state, playerId);
  if (!player) return fail("Unknown player");
  if (!action || typeof action !== "object" || typeof action.type !== "string") return fail("Malformed action");
  if (state.phase === "ended") return fail("The game is over");
  if (player.bankrupt) return fail("You are out of the game");
  if (!legalActions(state, playerId).includes(action.type)) {
    return fail(`'${action.type}' is not allowed for ${player.name} right now`);
  }
  const s = cloneState(state);
  const ctx = { state: s, events: [] };
  const p = getPlayer(s, playerId);
  const error = dispatch(ctx, p, action);
  if (error) return fail(error);
  return { ok: true, state: s, events: ctx.events };
}
function dispatch(ctx, p, action) {
  switch (action.type) {
    case "roll":
      return doRoll(ctx, p);
    case "buy":
      return doBuy(ctx, p);
    case "decline":
      return doDecline(ctx, p);
    case "bid":
      return doBid(ctx, p, action.amount);
    case "passAuction":
      return doPassAuction(ctx, p);
    case "build":
      return doBuild(ctx, p, action.space);
    case "sellHouse":
      return doSellHouse(ctx, p, action.space);
    case "mortgage":
      return doMortgage(ctx, p, action.space);
    case "unmortgage":
      return doUnmortgage(ctx, p, action.space);
    case "payJailFine":
      return doPayJailFine(ctx, p);
    case "useJailCard":
      return doUseJailCard(ctx, p);
    case "proposeTrade":
      return doProposeTrade(ctx, p, action.to, action.offer, action.request);
    case "acceptTrade":
      return doAcceptTrade(ctx, p, action.tradeId);
    case "rejectTrade":
      return doRejectTrade(ctx, p, action.tradeId);
    case "payDebt":
      return doPayDebt(ctx, p);
    case "declareBankruptcy":
      return doDeclareBankruptcy(ctx, p);
    case "resign":
      return doResign(ctx, p);
    case "endTurn":
      advanceTurn(ctx);
      return null;
    default:
      return "Unknown action";
  }
}
function pay(ctx, from, to, amount, reason, toPot = false) {
  const s = ctx.state;
  if (amount <= 0) return true;
  if (from === null) {
    const t = to === null ? void 0 : getPlayer(s, to);
    if (!t) return true;
    t.cash += amount;
    emit(ctx, { type: "paid", from: null, to, amount, reason });
    return true;
  }
  const f = getPlayer(s, from);
  if (!f) return true;
  if (f.cash < amount) {
    s.debt = { debtor: from, creditor: to, amount, reason, ...toPot ? { toPot: true } : {} };
    s.phase = "debt";
    emit(ctx, { type: "debt", player: from, creditor: to, amount });
    return false;
  }
  transfer(ctx, f, to, amount, reason, toPot);
  return true;
}
function transfer(ctx, f, to, amount, reason, toPot = false) {
  const s = ctx.state;
  f.cash -= amount;
  if (to === null) {
    if (toPot && s.config.freeParkingJackpot) s.freeParkingPot += amount;
  } else {
    const t = getPlayer(s, to);
    if (t) t.cash += amount;
  }
  emit(ctx, { type: "paid", from: f.id, to, amount, reason });
}
function moveTo(ctx, p, to, opts) {
  const s = ctx.state;
  const from = p.position;
  let passedGo = false;
  let salary = 0;
  let salaryReason = "";
  if (opts.salary && !opts.direct && !opts.backwards) {
    const landed = to === GO_INDEX;
    if (landed || to < from) {
      passedGo = true;
      salary = s.config.goSalary * (landed && s.config.doubleGoSalary ? 2 : 1);
      salaryReason = landed ? "Landed on Go" : "Passed Go";
    }
  }
  p.position = to;
  emit(ctx, {
    type: "moved",
    player: p.id,
    from,
    to,
    passedGo,
    ...opts.direct ? { direct: true } : {},
    ...opts.backwards ? { backwards: true } : {}
  });
  if (salary > 0) pay(ctx, null, p.id, salary, salaryReason);
}
function moveBy(ctx, p, steps) {
  moveTo(ctx, p, (p.position + steps) % BOARD_SIZE, { salary: true });
}
function sendToJail(ctx, p, reason) {
  const s = ctx.state;
  moveTo(ctx, p, JAIL_INDEX, { salary: false, direct: true });
  p.inJail = true;
  p.jailTurns = 0;
  emit(ctx, { type: "jailed", player: p.id, reason });
  if (currentPlayerId(s) === p.id) {
    s.canRollAgain = false;
    s.doublesCount = 0;
  }
}
function freeFromJail(ctx, p, how) {
  p.inJail = false;
  p.jailTurns = 0;
  emit(ctx, { type: "freed", player: p.id, how });
}
function resolveLanding(ctx, p, opts = {}) {
  const s = ctx.state;
  const space = s.board[p.position];
  switch (space.type) {
    case "property":
    case "railroad":
    case "utility": {
      const ps = s.properties[space.index];
      if (ps.owner === null) {
        s.phase = "buy";
        s.pendingSpace = space.index;
        return;
      }
      if (ps.owner === p.id || ps.mortgaged) return;
      const owner = getPlayer(s, ps.owner);
      if (!owner || owner.bankrupt) return;
      const diceTotal = s.dice ? s.dice[0] + s.dice[1] : 0;
      let rent;
      if (space.type === "utility" && opts.utilityMultiplier) rent = diceTotal * opts.utilityMultiplier;
      else if (space.type === "railroad" && opts.railroadMultiplier) rent = rentFor(s, space.index, diceTotal) * opts.railroadMultiplier;
      else rent = rentFor(s, space.index, diceTotal);
      pay(ctx, p.id, ps.owner, rent, `Rent for ${space.name}`);
      return;
    }
    case "tax":
      pay(ctx, p.id, null, space.amount ?? 0, space.name, true);
      return;
    case "chance":
      drawCard(ctx, p, "chance");
      return;
    case "chest":
      drawCard(ctx, p, "chest");
      return;
    case "gotojail":
      sendToJail(ctx, p, "Landed on Go To Jail");
      return;
    case "freeparking":
      if (s.config.freeParkingJackpot && s.freeParkingPot > 0) {
        const amount = s.freeParkingPot;
        s.freeParkingPot = 0;
        p.cash += amount;
        emit(ctx, { type: "freeParking", player: p.id, amount });
      }
      return;
    default:
      return;
  }
}
function drawCard(ctx, p, deck) {
  const s = ctx.state;
  const pile = deck === "chance" ? s.chanceDeck : s.chestDeck;
  if (pile.length === 0) return;
  const id = pile.shift();
  const card = DECKS[deck][id];
  emit(ctx, { type: "card", player: p.id, deck, cardId: id, text: card.text });
  if (card.effect.kind === "jailCard") {
    p.jailCards += 1;
    (s.jailCardOrigins[p.id] ??= []).push(deck);
    return;
  }
  pile.push(id);
  applyCardEffect(ctx, p, card.effect, card.text);
}
function applyCardEffect(ctx, p, effect, text) {
  const s = ctx.state;
  switch (effect.kind) {
    case "advance":
      moveTo(ctx, p, effect.to, { salary: true });
      resolveLanding(ctx, p);
      return;
    case "nearestRailroad":
      moveTo(ctx, p, nextSpaceOf(p.position, RAILROADS), { salary: true });
      resolveLanding(ctx, p, { railroadMultiplier: 2 });
      return;
    case "nearestUtility":
      moveTo(ctx, p, nextSpaceOf(p.position, UTILITIES), { salary: true });
      resolveLanding(ctx, p, { utilityMultiplier: 10 });
      return;
    case "collect":
      pay(ctx, null, p.id, effect.amount, text);
      return;
    case "pay":
      pay(ctx, p.id, null, effect.amount, text, true);
      return;
    case "collectFromEach":
      for (const other of s.players) {
        if (other.id === p.id || other.bankrupt) continue;
        s.pendingPayments.push({ from: other.id, to: p.id, amount: effect.amount, reason: text });
      }
      return;
    case "payEach":
      for (const other of s.players) {
        if (other.id === p.id || other.bankrupt) continue;
        s.pendingPayments.push({ from: p.id, to: other.id, amount: effect.amount, reason: text });
      }
      return;
    case "goBack":
      moveTo(ctx, p, (p.position - effect.spaces + BOARD_SIZE) % BOARD_SIZE, { salary: false, backwards: true });
      resolveLanding(ctx, p);
      return;
    case "goToJail":
      sendToJail(ctx, p, text);
      return;
    case "repairs": {
      let total = 0;
      for (const i of ownedSpaces(s, p.id)) {
        const h = s.properties[i].houses;
        total += h === 5 ? effect.perHotel : h * effect.perHouse;
      }
      if (total > 0) pay(ctx, p.id, null, total, text, true);
      return;
    }
  }
}
function continueTurn(ctx) {
  const s = ctx.state;
  for (; ; ) {
    if (s.phase === "ended" || s.phase === "debt" || s.phase === "buy" || s.phase === "auction") return;
    if (s.pendingPayments.length > 0) {
      const pp = s.pendingPayments.shift();
      const f = getPlayer(s, pp.from);
      const t = pp.to === null ? null : getPlayer(s, pp.to);
      if (!f || f.bankrupt || pp.to !== null && (!t || t.bankrupt)) continue;
      pay(ctx, pp.from, pp.to, pp.amount, pp.reason, pp.toPot);
      continue;
    }
    const cur = s.players[s.currentPlayer];
    if (cur.bankrupt) {
      advanceTurn(ctx);
      return;
    }
    if (s.debtResume && s.debtResume.moveBy !== null) {
      const by = s.debtResume.moveBy;
      s.debtResume = null;
      moveBy(ctx, cur, by);
      resolveLanding(ctx, cur);
      continue;
    }
    s.debtResume = null;
    s.pendingSpace = null;
    s.phase = s.canRollAgain ? "roll" : "action";
    return;
  }
}
function advanceTurn(ctx) {
  const s = ctx.state;
  const cur = s.players[s.currentPlayer];
  emit(ctx, { type: "turnEnded", player: cur.id });
  const n = s.players.length;
  let i = s.currentPlayer;
  for (let step = 0; step < n; step++) {
    i = (i + 1) % n;
    if (!s.players[i].bankrupt) break;
  }
  s.currentPlayer = i;
  s.dice = null;
  s.doublesCount = 0;
  s.canRollAgain = false;
  s.pendingSpace = null;
  s.auction = null;
  s.debt = null;
  s.debtResume = null;
  s.pendingPayments = [];
  s.phase = "roll";
  s.turnNumber += 1;
  emit(ctx, { type: "turnStarted", player: s.players[i].id, turnNumber: s.turnNumber });
}
function doRoll(ctx, p) {
  const s = ctx.state;
  const r1 = rollDie(s.rng);
  const r2 = rollDie(r1.state);
  s.rng = r2.state;
  const dice = [r1.die, r2.die];
  const doubles = dice[0] === dice[1];
  const total = dice[0] + dice[1];
  s.dice = dice;
  s.canRollAgain = false;
  emit(ctx, { type: "rolled", player: p.id, dice, doubles });
  if (p.inJail) {
    if (doubles) {
      freeFromJail(ctx, p, "doubles");
      s.doublesCount = 0;
      moveBy(ctx, p, total);
      resolveLanding(ctx, p);
    } else {
      p.jailTurns += 1;
      if (p.jailTurns >= s.config.maxJailTurns) {
        freeFromJail(ctx, p, "forced");
        if (!pay(ctx, p.id, null, s.config.jailFine, "Jail fine", true)) {
          s.debtResume = { moveBy: total };
          return null;
        }
        moveBy(ctx, p, total);
        resolveLanding(ctx, p);
      }
    }
    continueTurn(ctx);
    return null;
  }
  if (doubles) {
    s.doublesCount += 1;
    if (s.doublesCount >= 3) {
      sendToJail(ctx, p, "Rolled doubles three times");
      continueTurn(ctx);
      return null;
    }
    s.canRollAgain = true;
  } else {
    s.doublesCount = 0;
  }
  moveBy(ctx, p, total);
  resolveLanding(ctx, p);
  continueTurn(ctx);
  return null;
}
function doBuy(ctx, p) {
  const s = ctx.state;
  const idx = s.pendingSpace;
  if (idx === null) return "Nothing to buy";
  const space = s.board[idx];
  const ps = s.properties[idx];
  if (!space || !ps || ps.owner !== null) return "This property is not for sale";
  const price = space.price ?? 0;
  if (p.cash < price) return "Not enough cash";
  p.cash -= price;
  ps.owner = p.id;
  emit(ctx, { type: "bought", player: p.id, space: idx, price });
  s.pendingSpace = null;
  s.phase = "roll";
  continueTurn(ctx);
  return null;
}
function doDecline(ctx, p) {
  const s = ctx.state;
  const idx = s.pendingSpace;
  if (idx === null) return "Nothing to decline";
  emit(ctx, { type: "declined", player: p.id, space: idx });
  s.pendingSpace = null;
  s.phase = "roll";
  if (s.config.auctions) startAuction(ctx, idx, p);
  else continueTurn(ctx);
  return null;
}
function startAuction(ctx, space, decliner) {
  const s = ctx.state;
  const n = s.players.length;
  const start = s.players.findIndex((x) => x.id === decliner.id);
  const active = [];
  for (let step = 1; step <= n; step++) {
    const pl = s.players[(start + step) % n];
    if (!pl.bankrupt) active.push(pl.id);
  }
  s.auction = { space, highBid: 0, highBidder: null, active, passed: [], current: active[0] };
  s.phase = "auction";
  emit(ctx, { type: "auctionStarted", space });
}
function doBid(ctx, p, amount) {
  const s = ctx.state;
  const a = s.auction;
  if (!a) return "No auction in progress";
  if (a.current !== p.id) return "It is not your turn to bid";
  if (!Number.isInteger(amount) || amount <= a.highBid) return `Bid must be more than $${a.highBid}`;
  if (amount > p.cash) return "Not enough cash";
  a.highBid = amount;
  a.highBidder = p.id;
  emit(ctx, { type: "bid", player: p.id, space: a.space, amount });
  const i = a.active.indexOf(p.id);
  a.current = a.active[(i + 1) % a.active.length];
  checkAuctionEnd(ctx);
  return null;
}
function doPassAuction(ctx, p) {
  const s = ctx.state;
  const a = s.auction;
  if (!a) return "No auction in progress";
  if (a.current !== p.id) return "It is not your turn to bid";
  if (a.highBidder === p.id) return "The high bidder cannot pass";
  removeFromAuction(ctx, p.id);
  checkAuctionEnd(ctx);
  return null;
}
function removeFromAuction(ctx, playerId) {
  const a = ctx.state.auction;
  if (!a) return;
  const i = a.active.indexOf(playerId);
  if (i === -1) return;
  a.active.splice(i, 1);
  if (!a.passed.includes(playerId)) a.passed.push(playerId);
  if (a.highBidder === playerId) {
    a.highBidder = null;
    a.highBid = 0;
  }
  if (a.current === playerId) a.current = a.active.length ? a.active[i % a.active.length] : "";
}
function checkAuctionEnd(ctx) {
  const s = ctx.state;
  const a = s.auction;
  if (!a) return;
  if (a.active.length === 0) endAuction(ctx, null);
  else if (a.active.length === 1 && a.highBidder === a.active[0]) endAuction(ctx, a.active[0]);
}
function endAuction(ctx, winnerId) {
  const s = ctx.state;
  const a = s.auction;
  const amount = winnerId ? a.highBid : 0;
  if (winnerId) {
    const w = getPlayer(s, winnerId);
    w.cash -= amount;
    s.properties[a.space].owner = winnerId;
  }
  emit(ctx, { type: "auctionEnded", space: a.space, winner: winnerId, amount });
  s.auction = null;
  s.phase = "roll";
  continueTurn(ctx);
}
function doBuild(ctx, p, spaceIndex) {
  const s = ctx.state;
  const c = canBuild(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? "Cannot build";
  const space = s.board[spaceIndex];
  const ps = s.properties[spaceIndex];
  ps.houses += 1;
  if (ps.houses === 5) {
    s.hotelsLeft -= 1;
    s.housesLeft += 4;
  } else {
    s.housesLeft -= 1;
  }
  p.cash -= space.houseCost ?? 0;
  emit(ctx, { type: "built", player: p.id, space: spaceIndex, houses: ps.houses });
  pruneTrades(ctx);
  return null;
}
function doSellHouse(ctx, p, spaceIndex) {
  const s = ctx.state;
  const c = canSellHouse(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? "Cannot sell";
  const space = s.board[spaceIndex];
  const ps = s.properties[spaceIndex];
  if (ps.houses === 5) {
    s.hotelsLeft += 1;
    s.housesLeft -= 4;
  } else {
    s.housesLeft += 1;
  }
  ps.houses -= 1;
  p.cash += houseSaleValue(space);
  emit(ctx, { type: "soldHouse", player: p.id, space: spaceIndex, houses: ps.houses });
  return null;
}
function doMortgage(ctx, p, spaceIndex) {
  const s = ctx.state;
  const c = canMortgage(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? "Cannot mortgage";
  s.properties[spaceIndex].mortgaged = true;
  p.cash += mortgageValue(s.board[spaceIndex]);
  emit(ctx, { type: "mortgaged", player: p.id, space: spaceIndex });
  return null;
}
function doUnmortgage(ctx, p, spaceIndex) {
  const s = ctx.state;
  const c = canUnmortgage(s, p.id, spaceIndex);
  if (!c.ok) return c.reason ?? "Cannot unmortgage";
  const space = s.board[spaceIndex];
  const cost = unmortgageCost(space);
  p.cash -= cost;
  if (s.config.freeParkingJackpot) s.freeParkingPot += mortgageInterest(space);
  s.properties[spaceIndex].mortgaged = false;
  emit(ctx, { type: "unmortgaged", player: p.id, space: spaceIndex });
  return null;
}
function doPayJailFine(ctx, p) {
  const s = ctx.state;
  if (!p.inJail) return "You are not in jail";
  if (p.cash < s.config.jailFine) return "Not enough cash";
  transfer(ctx, p, null, s.config.jailFine, "Jail fine", true);
  freeFromJail(ctx, p, "fine");
  return null;
}
function doUseJailCard(ctx, p) {
  const s = ctx.state;
  if (!p.inJail) return "You are not in jail";
  if (p.jailCards < 1) return "You have no Get Out of Jail Free card";
  p.jailCards -= 1;
  returnJailCard(s, p.id);
  freeFromJail(ctx, p, "card");
  return null;
}
function returnJailCard(s, playerId) {
  const origins = s.jailCardOrigins[playerId] ?? [];
  const origin = origins.shift() ?? "chance";
  if (origins.length === 0) delete s.jailCardOrigins[playerId];
  (origin === "chance" ? s.chanceDeck : s.chestDeck).push(JAIL_CARD_ID[origin]);
}
function transferJailCards(s, from, to, count) {
  if (count <= 0) return;
  const origins = s.jailCardOrigins[from.id] ?? [];
  const moved = origins.splice(0, count);
  while (moved.length < count) moved.push("chance");
  if (origins.length === 0) delete s.jailCardOrigins[from.id];
  else s.jailCardOrigins[from.id] = origins;
  (s.jailCardOrigins[to.id] ??= []).push(...moved);
  from.jailCards -= count;
  to.jailCards += count;
}
function normalizeSide(side) {
  return {
    cash: side.cash,
    properties: side.properties.slice().sort((a, b) => a - b),
    jailCards: side.jailCards
  };
}
function doProposeTrade(ctx, p, to, offer, request) {
  const s = ctx.state;
  const phase = canTradeNow(s, p.id, to);
  if (!phase.ok) return phase.reason ?? "Cannot trade now";
  const err = validateTrade(s, { from: p.id, to, offer, request }, false);
  if (err) return err;
  const trade = {
    id: `t${s.nextTradeId++}`,
    from: p.id,
    to,
    offer: normalizeSide(offer),
    request: normalizeSide(request)
  };
  s.trades.push(trade);
  emit(ctx, { type: "tradeProposed", trade: structuredClone(trade) });
  return null;
}
function doAcceptTrade(ctx, p, tradeId) {
  const s = ctx.state;
  const trade = s.trades.find((t) => t.id === tradeId);
  if (!trade) return "No such trade";
  const c = canAcceptTrade(s, p.id, trade);
  if (!c.ok) return c.reason ?? "Cannot accept this trade";
  const from = getPlayer(s, trade.from);
  const to = getPlayer(s, trade.to);
  from.cash -= trade.offer.cash;
  to.cash += trade.offer.cash;
  to.cash -= trade.request.cash;
  from.cash += trade.request.cash;
  for (const i of trade.offer.properties) s.properties[i].owner = to.id;
  for (const i of trade.request.properties) s.properties[i].owner = from.id;
  transferJailCards(s, from, to, trade.offer.jailCards);
  transferJailCards(s, to, from, trade.request.jailCards);
  s.trades = s.trades.filter((t) => t.id !== tradeId);
  emit(ctx, { type: "tradeAccepted", trade: structuredClone(trade) });
  for (const i of trade.offer.properties) {
    if (s.properties[i].mortgaged) transfer(ctx, to, null, mortgageInterest(s.board[i]), `Interest on mortgaged ${s.board[i].name}`, true);
  }
  for (const i of trade.request.properties) {
    if (s.properties[i].mortgaged) transfer(ctx, from, null, mortgageInterest(s.board[i]), `Interest on mortgaged ${s.board[i].name}`, true);
  }
  pruneTrades(ctx);
  return null;
}
function doRejectTrade(ctx, p, tradeId) {
  const s = ctx.state;
  const trade = s.trades.find((t) => t.id === tradeId);
  if (!trade) return "No such trade";
  const c = canRejectTrade(s, p.id, trade);
  if (!c.ok) return c.reason ?? "Cannot reject this trade";
  s.trades = s.trades.filter((t) => t.id !== tradeId);
  emit(ctx, { type: "tradeRejected", trade: structuredClone(trade) });
  return null;
}
function pruneTrades(ctx) {
  const s = ctx.state;
  const keep = [];
  for (const t of s.trades) {
    if (validateTrade(s, t, false) === null) keep.push(t);
    else emit(ctx, { type: "tradeRejected", trade: structuredClone(t) });
  }
  s.trades = keep;
}
function doPayDebt(ctx, p) {
  const s = ctx.state;
  const d = s.debt;
  if (!d || d.debtor !== p.id) return "You have no debt to pay";
  if (p.cash < d.amount) return "Not enough cash";
  transfer(ctx, p, d.creditor, d.amount, d.reason, d.toPot);
  s.debt = null;
  s.phase = "roll";
  continueTurn(ctx);
  return null;
}
function doDeclareBankruptcy(ctx, p) {
  const s = ctx.state;
  const d = s.debt;
  if (!d || d.debtor !== p.id) return "You are not in debt";
  eliminate(ctx, p, d.creditor);
  return null;
}
function doResign(ctx, p) {
  eliminate(ctx, p, null);
  return null;
}
function eliminate(ctx, p, creditorId) {
  const s = ctx.state;
  const creditorPlayer = creditorId ? getPlayer(s, creditorId) : void 0;
  const creditor = creditorPlayer && !creditorPlayer.bankrupt ? creditorPlayer : null;
  const debt = s.debt;
  const wasDebtor = debt?.debtor === p.id;
  const wasCreditor = debt?.creditor === p.id;
  const potBound = Boolean(wasDebtor && debt?.toPot && debt?.creditor === null);
  let proceeds = 0;
  for (const i of ownedSpaces(s, p.id)) {
    const ps = s.properties[i];
    if (ps.houses === 0) continue;
    const space = s.board[i];
    if (ps.houses === 5) s.hotelsLeft += 1;
    else s.housesLeft += ps.houses;
    proceeds += ps.houses * houseSaleValue(space);
    ps.houses = 0;
  }
  if (creditor && proceeds > 0) pay(ctx, null, p.id, proceeds, "Buildings sold to the bank");
  if (p.cash > 0) {
    const cash = p.cash;
    if (creditor) {
      transfer(ctx, p, creditor.id, cash, "Bankruptcy");
    } else {
      p.cash = 0;
      if (potBound && s.config.freeParkingJackpot) s.freeParkingPot += cash;
      emit(ctx, { type: "paid", from: p.id, to: null, amount: cash, reason: "Bankruptcy" });
    }
  }
  for (const i of ownedSpaces(s, p.id)) {
    const ps = s.properties[i];
    if (creditor) {
      ps.owner = creditor.id;
      if (ps.mortgaged) {
        const interest = mortgageInterest(s.board[i]);
        if (creditor.cash >= interest) transfer(ctx, creditor, null, interest, `Interest on mortgaged ${s.board[i].name}`, true);
      }
    } else {
      ps.owner = null;
      ps.mortgaged = false;
    }
  }
  if (creditor) {
    transferJailCards(s, p, creditor, p.jailCards);
  } else {
    while (p.jailCards > 0) {
      returnJailCard(s, p.id);
      p.jailCards -= 1;
    }
  }
  delete s.jailCardOrigins[p.id];
  p.bankrupt = true;
  p.inJail = false;
  p.jailTurns = 0;
  p.cash = 0;
  emit(ctx, { type: "bankrupt", player: p.id, creditor: creditor ? creditor.id : null });
  const involved = s.trades.filter((t) => t.from === p.id || t.to === p.id);
  s.trades = s.trades.filter((t) => t.from !== p.id && t.to !== p.id);
  for (const t of involved) emit(ctx, { type: "tradeRejected", trade: structuredClone(t) });
  pruneTrades(ctx);
  s.pendingPayments = s.pendingPayments.filter((pp) => pp.from !== p.id && pp.to !== p.id);
  if (wasDebtor || wasCreditor) s.debt = null;
  const alive = s.players.filter((x) => !x.bankrupt);
  if (alive.length <= 1) {
    s.winner = alive[0]?.id ?? null;
    s.phase = "ended";
    s.auction = null;
    s.debt = null;
    s.trades = [];
    s.pendingPayments = [];
    s.debtResume = null;
    s.pendingSpace = null;
    if (s.winner) emit(ctx, { type: "gameOver", winner: s.winner });
    return;
  }
  if (s.phase === "auction" && s.auction) {
    removeFromAuction(ctx, p.id);
    checkAuctionEnd(ctx);
    return;
  }
  if (currentPlayerId(s) === p.id) {
    advanceTurn(ctx);
  } else if (wasDebtor || wasCreditor) {
    s.phase = "roll";
    continueTurn(ctx);
  }
}

// src/shared/protocol.ts
var MAX_PLAYERS = 8;
var MIN_PLAYERS = 2;
var MAX_NAME_LENGTH = 16;
var MAX_CHAT_LENGTH = 200;

// src/shared/tokens.ts
var TOKEN_LIST = [
  { id: "hat", name: "Top Hat", color: "#8e5bc4" },
  { id: "boat", name: "Sailboat", color: "#2f6fd6" },
  { id: "dog", name: "Dog", color: "#c47a3c" },
  { id: "car", name: "Race Car", color: "#d9413a" },
  { id: "cat", name: "Cat", color: "#e8649c" },
  { id: "rocket", name: "Rocket", color: "#2aa9a0" },
  { id: "duck", name: "Rubber Duck", color: "#f2b632" },
  { id: "robot", name: "Robot", color: "#3aa655" }
];
var TOKEN_BY_ID = Object.fromEntries(TOKEN_LIST.map((t) => [t.id, t]));
function isTokenId(id) {
  return typeof id === "string" && id in TOKEN_BY_ID;
}

// src/engine/bot.ts
function debtAction(state, playerId, legal) {
  if (legal.has("payDebt")) return { type: "payDebt" };
  const owned = ownedSpaces(state, playerId).map((index) => ({ index, ps: state.properties[index], space: state.board[index] }));
  if (legal.has("sellHouse")) {
    const withHouses = owned.filter((o) => o.ps.houses > 0).sort((a, b) => (b.space.houseCost ?? 0) - (a.space.houseCost ?? 0));
    for (const o of withHouses) if (canSellHouseSafe(state, playerId, o.index)) return { type: "sellHouse", space: o.index };
  }
  if (legal.has("mortgage")) {
    const candidates = owned.filter((o) => !o.ps.mortgaged && o.ps.houses === 0).sort((a, b) => (b.space.price ?? 0) - (a.space.price ?? 0));
    for (const o of candidates) if (canMortgageSafe(state, playerId, o.index)) return { type: "mortgage", space: o.index };
  }
  if (legal.has("declareBankruptcy")) return { type: "declareBankruptcy" };
  return null;
}
function canSellHouseSafe(state, id, idx) {
  return canSellHouse(state, id, idx).ok;
}
function canMortgageSafe(state, id, idx) {
  return canMortgage(state, id, idx).ok;
}

// src/server/autoplay.ts
function playersToAct(state) {
  if (state.phase === "ended") return [];
  const blocking = /* @__PURE__ */ new Set(["roll", "buy", "decline", "bid", "passAuction", "payDebt", "declareBankruptcy", "endTurn", "payJailFine", "useJailCard"]);
  const ids = [];
  for (const p of state.players) {
    if (p.bankrupt) continue;
    const legal = legalActions(state, p.id);
    if (legal.some((t) => blocking.has(t))) ids.push(p.id);
  }
  return ids;
}
function chooseAutoAction(state, playerId) {
  const legal = new Set(legalActions(state, playerId));
  if (legal.size === 0) return null;
  if (state.phase === "debt" && state.debt?.debtor === playerId) return debtAction(state, playerId, legal);
  if (legal.has("passAuction")) return { type: "passAuction" };
  if (legal.has("decline")) return { type: "decline" };
  if (legal.has("roll")) return { type: "roll" };
  if (legal.has("endTurn")) return { type: "endTurn" };
  return null;
}

// src/server/room.ts
var DISCONNECT_GRACE_MS = Number(process.env.PT_GRACE_MS) || 45e3;
var LOBBY_FORGET_MS = 12e4;
var CHAT_HISTORY = 100;
var RoomError = class extends Error {
};
function newId(bytes = 6) {
  return randomBytes(bytes).toString("hex");
}
function sanitizeName(raw) {
  const s = String(raw ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_NAME_LENGTH);
  return s || "Player";
}
function clampInt(v, min, max, fallback) {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}
function sanitizeConfig(partial, base) {
  const c = { ...base };
  if ("startingCash" in partial) c.startingCash = clampInt(partial.startingCash, 100, 1e4, base.startingCash);
  if ("goSalary" in partial) c.goSalary = clampInt(partial.goSalary, 0, 2e3, base.goSalary);
  if ("jailFine" in partial) c.jailFine = clampInt(partial.jailFine, 0, 1e3, base.jailFine);
  if ("maxJailTurns" in partial) c.maxJailTurns = clampInt(partial.maxJailTurns, 1, 6, base.maxJailTurns);
  if ("auctions" in partial) c.auctions = Boolean(partial.auctions);
  if ("freeParkingJackpot" in partial) c.freeParkingJackpot = Boolean(partial.freeParkingJackpot);
  if ("doubleGoSalary" in partial) c.doubleGoSalary = Boolean(partial.doubleGoSalary);
  if ("turnTimerSeconds" in partial) {
    const t = partial.turnTimerSeconds;
    c.turnTimerSeconds = t === null || t === void 0 || t === 0 ? null : clampInt(t, 15, 900, 90);
  }
  return c;
}
var Room = class _Room {
  code;
  hostId;
  status = "lobby";
  members = /* @__PURE__ */ new Map();
  order = [];
  // join order = turn order
  config = { ...DEFAULT_CONFIG };
  state = null;
  chat = [];
  chatSeq = 0;
  timer = null;
  timerEndsAt = null;
  timerReason = null;
  lastActivity = Date.now();
  constructor(code, host) {
    this.code = code;
    this.hostId = host.id;
  }
  // ---------- views & messaging ----------
  view() {
    return {
      code: this.code,
      hostId: this.hostId,
      status: this.status,
      players: this.order.map((id) => this.lobbyPlayer(this.members.get(id))),
      config: this.config,
      maxPlayers: MAX_PLAYERS
    };
  }
  lobbyPlayer(m) {
    return { id: m.id, name: m.name, token: m.token, color: TOKEN_BY_ID[m.token]?.color ?? "#888", connected: m.connected, isHost: m.id === this.hostId };
  }
  send(m, msg) {
    if (m.socket && m.socket.readyState === m.socket.OPEN) m.socket.send(JSON.stringify(msg));
  }
  broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const m of this.members.values()) {
      if (m.socket && m.socket.readyState === m.socket.OPEN) m.socket.send(data);
    }
  }
  broadcastRoom() {
    this.broadcast({ t: "room", room: this.view() });
  }
  broadcastState(events) {
    if (!this.state) return;
    this.broadcast({ t: "state", state: this.state, events });
  }
  system(text) {
    this.pushChat(null, "Game", text);
  }
  pushChat(from, name, text) {
    const message = { id: ++this.chatSeq, from, name, text, at: Date.now() };
    this.chat.push(message);
    if (this.chat.length > CHAT_HISTORY) this.chat.splice(0, this.chat.length - CHAT_HISTORY);
    this.broadcast({ t: "chat", message });
  }
  get connectedCount() {
    let n = 0;
    for (const m of this.members.values()) if (m.connected) n++;
    return n;
  }
  // ---------- membership ----------
  freeToken(preferred) {
    const taken = new Set([...this.members.values()].map((m) => m.token));
    if (isTokenId(preferred) && !taken.has(preferred)) return preferred;
    const free = TOKEN_LIST.find((t) => !taken.has(t.id));
    if (!free) throw new RoomError("No tokens left");
    return free.id;
  }
  static createMember(name, token, socket) {
    return { id: newId(), name: sanitizeName(name), token, session: newId(16), socket, connected: true, disconnectedAt: null, forgetTimer: null };
  }
  /** Adds a brand-new member to the lobby. */
  join(name, token, socket) {
    if (this.status !== "lobby") throw new RoomError("That game has already started");
    if (this.members.size >= MAX_PLAYERS) throw new RoomError("That room is full");
    const m = _Room.createMember(name, this.freeToken(token), socket);
    this.members.set(m.id, m);
    this.order.push(m.id);
    this.touch();
    this.system(`${m.name} joined the room`);
    this.welcome(m);
    this.broadcastRoom();
    return m;
  }
  /** Called by the server for the host right after construction. */
  addHost(m) {
    this.members.set(m.id, m);
    this.order.push(m.id);
    this.welcome(m);
    this.broadcastRoom();
  }
  welcome(m) {
    this.send(m, { t: "welcome", session: m.session, playerId: m.id, room: this.view() });
    this.send(m, { t: "chatHistory", messages: this.chat });
    if (this.state) {
      this.send(m, { t: "state", state: this.state, events: [] });
      this.send(m, { t: "timer", endsAt: this.timerEndsAt });
    }
  }
  reconnect(m, socket) {
    if (m.socket && m.socket !== socket && m.socket.readyState === m.socket.OPEN) {
      const old = m.socket;
      m.socket = null;
      try {
        old.send(JSON.stringify({ t: "error", message: "You connected from another tab", fatal: true }));
        old.close();
      } catch {
      }
    }
    m.socket = socket;
    m.connected = true;
    m.disconnectedAt = null;
    if (m.forgetTimer) {
      clearTimeout(m.forgetTimer);
      m.forgetTimer = null;
    }
    this.touch();
    this.syncConnected();
    this.welcome(m);
    this.broadcastRoom();
    if (this.state) this.rescheduleTimer();
  }
  disconnect(m, socket) {
    if (m.socket !== socket) return;
    if (!this.members.has(m.id)) return;
    m.socket = null;
    m.connected = false;
    m.disconnectedAt = Date.now();
    this.touch();
    if (this.status === "lobby") {
      m.forgetTimer = setTimeout(() => this.forget(m), LOBBY_FORGET_MS);
      if (m.id === this.hostId) this.pickNewHost();
    } else {
      this.syncConnected();
      if (m.id === this.hostId) this.pickNewHost();
      this.rescheduleTimer();
    }
    this.broadcastRoom();
  }
  forget(m) {
    if (m.connected || this.status !== "lobby") return;
    this.removeMember(m, `${m.name} left the room`);
  }
  removeMember(m, note) {
    if (m.forgetTimer) clearTimeout(m.forgetTimer);
    this.members.delete(m.id);
    const i = this.order.indexOf(m.id);
    if (i >= 0) this.order.splice(i, 1);
    if (m.id === this.hostId) this.pickNewHost();
    this.system(note);
    this.broadcastRoom();
  }
  pickNewHost() {
    const next2 = this.order.map((id) => this.members.get(id)).find((m) => m && m.connected && m.id !== this.hostId);
    if (next2) {
      this.hostId = next2.id;
      this.system(`${next2.name} is now the host`);
    }
  }
  syncConnected() {
    if (!this.state) return;
    let changed = false;
    for (const p of this.state.players) {
      const m = this.members.get(p.id);
      const c = m ? m.connected : false;
      if (p.connected !== c) {
        p.connected = c;
        changed = true;
      }
    }
    if (changed) this.broadcastState([]);
  }
  leave(m) {
    const sock = m.socket;
    m.socket = null;
    m.connected = false;
    if (this.status === "playing" && this.state) {
      const p = this.state.players.find((x) => x.id === m.id);
      if (p && !p.bankrupt) {
        const r = applyAction(this.state, m.id, { type: "resign" });
        if (r.ok) {
          this.state = r.state;
          this.afterStateChange(r.events);
        }
      }
    }
    if (sock && sock.readyState === sock.OPEN) {
      try {
        sock.send(JSON.stringify({ t: "left" }));
        sock.close();
      } catch {
      }
    }
    if (this.status === "lobby") this.removeMember(m, `${m.name} left the room`);
    else {
      this.system(`${m.name} left the game`);
      if (m.id === this.hostId) this.pickNewHost();
      this.syncConnected();
      this.rescheduleTimer();
      this.broadcastRoom();
    }
  }
  kick(byId, targetId) {
    if (byId !== this.hostId) throw new RoomError("Only the host can remove players");
    if (targetId === byId) throw new RoomError("You cannot remove yourself");
    const target = this.members.get(targetId);
    if (!target) throw new RoomError("No such player");
    if (this.status === "playing" && this.state) {
      const p = this.state.players.find((x) => x.id === targetId);
      if (p && !p.bankrupt) {
        const r = applyAction(this.state, targetId, { type: "resign" });
        if (!r.ok) throw new RoomError(r.error);
        this.state = r.state;
        this.system(`${target.name} was removed by the host`);
        this.afterStateChange(r.events);
      }
      this.send(target, { t: "error", message: "You were removed from the game by the host", fatal: true });
      this.send(target, { t: "left" });
      target.session = newId(16);
      if (target.socket) {
        try {
          target.socket.close();
        } catch {
        }
      }
      target.socket = null;
      target.connected = false;
      this.syncConnected();
      this.broadcastRoom();
    } else {
      this.send(target, { t: "error", message: "You were removed from the room by the host", fatal: true });
      this.send(target, { t: "left" });
      if (target.socket) {
        try {
          target.socket.close();
        } catch {
        }
      }
      target.socket = null;
      this.removeMember(target, `${target.name} was removed by the host`);
    }
  }
  // ---------- lobby settings ----------
  setToken(m, token) {
    if (this.status !== "lobby") throw new RoomError("Tokens are locked once the game starts");
    if (!isTokenId(token)) throw new RoomError("Unknown token");
    for (const other of this.members.values()) if (other !== m && other.token === token) throw new RoomError("Someone already has that token");
    m.token = token;
    this.broadcastRoom();
  }
  setName(m, name) {
    if (this.status !== "lobby") throw new RoomError("Names are locked once the game starts");
    m.name = sanitizeName(name);
    this.broadcastRoom();
  }
  setConfig(m, partial) {
    if (m.id !== this.hostId) throw new RoomError("Only the host can change the rules");
    if (this.status !== "lobby") throw new RoomError("Rules are locked once the game starts");
    this.config = sanitizeConfig(partial ?? {}, this.config);
    this.broadcastRoom();
  }
  start(m) {
    if (m.id !== this.hostId) throw new RoomError("Only the host can start the game");
    if (this.status !== "lobby") throw new RoomError("The game already started");
    const present = this.order.map((id) => this.members.get(id)).filter((x) => x.connected);
    if (present.length < MIN_PLAYERS) throw new RoomError(`Need at least ${MIN_PLAYERS} connected players`);
    for (const id of [...this.order]) {
      const x = this.members.get(id);
      if (!x.connected) this.removeMember(x, `${x.name} was dropped before the start`);
    }
    const players = this.order.map((id) => this.members.get(id)).map((x) => ({ id: x.id, name: x.name, token: x.token, color: TOKEN_BY_ID[x.token]?.color ?? "#888" }));
    const seed = randomInt(1, 2 ** 31 - 1);
    this.state = createGame(this.config, players, seed);
    for (const p of this.state.players) p.connected = this.members.get(p.id)?.connected ?? false;
    this.status = "playing";
    this.touch();
    this.system("The game has started. Good luck!");
    this.broadcastRoom();
    this.broadcastState(this.state.log.slice());
    this.rescheduleTimer();
  }
  /** After a game ends the host can bring everyone back to the lobby. */
  restart(m) {
    if (m.id !== this.hostId) throw new RoomError("Only the host can do that");
    if (this.status === "playing" && this.state && this.state.phase !== "ended") throw new RoomError("The game is still running");
    this.clearTimer();
    this.state = null;
    this.status = "lobby";
    for (const id of [...this.order]) {
      const x = this.members.get(id);
      if (!x.connected) this.removeMember(x, `${x.name} was dropped`);
    }
    this.touch();
    this.system("Back in the lobby. The host can start a new game.");
    this.broadcastRoom();
  }
  // ---------- gameplay ----------
  action(m, action) {
    if (this.status !== "playing" || !this.state) throw new RoomError("The game is not running");
    const r = applyAction(this.state, m.id, action);
    if (!r.ok) throw new RoomError(r.error);
    this.state = r.state;
    this.touch();
    this.afterStateChange(r.events);
  }
  afterStateChange(events) {
    if (!this.state) return;
    this.broadcastState(events);
    if (this.state.phase === "ended" || this.state.winner) {
      this.status = "ended";
      const w = this.state.players.find((p) => p.id === this.state.winner);
      if (w) this.system(`${w.name} wins the game!`);
      this.clearTimer();
      this.broadcast({ t: "timer", endsAt: null });
      this.broadcastRoom();
      return;
    }
    this.rescheduleTimer();
  }
  chatMessage(m, text) {
    const t = String(text ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_CHAT_LENGTH);
    if (!t) return;
    this.touch();
    this.pushChat(m.id, m.name, t);
  }
  // ---------- timers ----------
  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.timerEndsAt = null;
    this.timerReason = null;
  }
  /**
   * One timer per room. Deadline is the sooner of the turn timer (if the host
   * enabled one) and the disconnect grace period (if someone who must act is
   * away). Every state change resets it.
   */
  rescheduleTimer() {
    this.clearTimer();
    if (this.status !== "playing" || !this.state) {
      this.broadcast({ t: "timer", endsAt: null });
      return;
    }
    const actors = playersToAct(this.state);
    if (actors.length === 0) {
      this.broadcast({ t: "timer", endsAt: null });
      return;
    }
    const now = Date.now();
    let endsAt = null;
    let reason = null;
    if (this.config.turnTimerSeconds) {
      endsAt = now + this.config.turnTimerSeconds * 1e3;
      reason = "turn";
    }
    const away = actors.filter((id) => !this.members.get(id)?.connected);
    if (away.length > 0) {
      const graceEnd = now + DISCONNECT_GRACE_MS;
      if (endsAt === null || graceEnd < endsAt) {
        endsAt = graceEnd;
        reason = "grace";
      }
    }
    if (endsAt !== null) {
      this.timerEndsAt = endsAt;
      this.timerReason = reason;
      this.timer = setTimeout(() => this.onTimer(), endsAt - now);
    }
    this.broadcast({ t: "timer", endsAt: reason === "turn" ? endsAt : null });
  }
  onTimer() {
    const reason = this.timerReason;
    this.timer = null;
    this.timerEndsAt = null;
    this.timerReason = null;
    if (this.status !== "playing" || !this.state) return;
    const actors = playersToAct(this.state);
    const targets = reason === "grace" ? actors.filter((id) => !this.members.get(id)?.connected) : actors;
    let acted = false;
    for (const id of targets) {
      const away = !this.members.get(id)?.connected;
      const maxSteps = away ? 30 : 12;
      for (let i = 0; i < maxSteps; i++) {
        const a = chooseAutoAction(this.state, id);
        if (!a) break;
        const r = applyAction(this.state, id, a);
        if (!r.ok) break;
        this.state = r.state;
        acted = true;
        this.broadcastState(r.events);
        if (this.state.phase === "ended") break;
        const stillBlocking = playersToAct(this.state).includes(id);
        if (!stillBlocking) break;
        if (!away && a.type !== "sellHouse" && a.type !== "mortgage") break;
      }
      if (this.state.phase === "ended") break;
    }
    if (acted) {
      const name = targets.map((id) => this.members.get(id)?.name ?? "?").join(", ");
      this.system(reason === "grace" ? `${name} is away, the game moved on automatically` : `${name} ran out of time`);
    }
    this.afterStateChange([]);
  }
  touch() {
    this.lastActivity = Date.now();
  }
  destroy() {
    this.clearTimer();
    const members = [...this.members.values()];
    this.members.clear();
    this.order.length = 0;
    for (const m of members) {
      if (m.forgetTimer) clearTimeout(m.forgetTimer);
      const sock = m.socket;
      m.socket = null;
      if (sock) {
        try {
          sock.close();
        } catch {
        }
      }
    }
  }
};

// src/server/index.ts
var PORT = Number(process.env.PORT) || 3e3;
var HOST = process.env.HOST || "0.0.0.0";
var ROOM_IDLE_MS = 30 * 60 * 1e3;
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var rooms = /* @__PURE__ */ new Map();
var sessions = /* @__PURE__ */ new Map();
function newCode() {
  for (; ; ) {
    let code = "";
    for (let i = 0; i < 4; i++) code += CODE_ALPHABET[randomInt2(CODE_ALPHABET.length)];
    if (!rooms.has(code)) return code;
  }
}
var assets = getAssets();
function serve(req, res) {
  const url = (req.url ?? "/").split("?")[0];
  const headers = { "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" };
  if (url === "/" || url === "/index.html" || /^\/[A-Z0-9]{4}$/i.test(url)) {
    res.writeHead(200, { ...headers, "Content-Type": "text/html; charset=utf-8" });
    res.end(assets.html);
  } else if (url === "/client.js") {
    res.writeHead(200, { ...headers, "Content-Type": "text/javascript; charset=utf-8" });
    res.end(assets.js);
  } else if (url === "/client.css") {
    res.writeHead(200, { ...headers, "Content-Type": "text/css; charset=utf-8" });
    res.end(assets.css);
  } else if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}
var server = createServer(serve);
var wss = new import_websocket_server.default({ server, maxPayload: 64 * 1024 });
var conns = /* @__PURE__ */ new Map();
function reply(socket, msg) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(msg));
}
function parse(data) {
  try {
    const obj = JSON.parse(String(data));
    if (obj && typeof obj === "object" && typeof obj.t === "string") return obj;
  } catch {
  }
  return null;
}
function handle(conn, msg) {
  const { socket } = conn;
  switch (msg.t) {
    case "ping":
      reply(socket, { t: "pong" });
      return;
    case "create": {
      if (conn.member) throw new RoomError("Already in a room");
      const code = newCode();
      const host = Room.createMember(msg.name, isTokenId(msg.token) ? msg.token : "hat", socket);
      const room2 = new Room(code, host);
      rooms.set(code, room2);
      room2.addHost(host);
      sessions.set(host.session, { room: room2, playerId: host.id });
      conn.room = room2;
      conn.member = host;
      console.log(`[room ${code}] created by ${host.name}`);
      return;
    }
    case "join": {
      if (conn.member) throw new RoomError("Already in a room");
      const code = String(msg.code ?? "").trim().toUpperCase();
      const room2 = rooms.get(code);
      if (!room2) throw new RoomError("No room with that code");
      const m = room2.join(msg.name, String(msg.token ?? ""), socket);
      sessions.set(m.session, { room: room2, playerId: m.id });
      conn.room = room2;
      conn.member = m;
      console.log(`[room ${code}] ${m.name} joined`);
      return;
    }
    case "rejoin": {
      if (conn.member) throw new RoomError("Already in a room");
      const hit = sessions.get(String(msg.session ?? ""));
      if (!hit) throw new RoomError("That session has expired");
      const m = hit.room.members.get(hit.playerId);
      if (!m || m.session !== msg.session) {
        sessions.delete(String(msg.session));
        throw new RoomError("That session has expired");
      }
      hit.room.reconnect(m, socket);
      conn.room = hit.room;
      conn.member = m;
      return;
    }
  }
  const room = conn.room;
  const member = conn.member;
  if (!room || !member) throw new RoomError("Join a room first");
  switch (msg.t) {
    case "setToken":
      room.setToken(member, String(msg.token));
      return;
    case "setName":
      room.setName(member, String(msg.name));
      return;
    case "setConfig":
      room.setConfig(member, msg.config);
      return;
    case "kick":
      room.kick(member.id, String(msg.playerId));
      return;
    case "start":
      room.start(member);
      return;
    case "restart":
      room.restart(member);
      return;
    case "action":
      if (!msg.action || typeof msg.action !== "object" || typeof msg.action.type !== "string") throw new RoomError("Bad action");
      room.action(member, msg.action);
      return;
    case "chat":
      room.chatMessage(member, String(msg.text ?? ""));
      return;
    case "leave":
      sessions.delete(member.session);
      room.leave(member);
      conn.room = null;
      conn.member = null;
      return;
    default:
      throw new RoomError("Unknown message");
  }
}
wss.on("connection", (socket) => {
  const conn = { socket, room: null, member: null, alive: true };
  conns.set(socket, conn);
  socket.on("pong", () => {
    conn.alive = true;
  });
  socket.on("message", (data) => {
    const msg = parse(data);
    if (!msg) {
      reply(socket, { t: "error", message: "Malformed message" });
      return;
    }
    try {
      handle(conn, msg);
    } catch (e) {
      if (e instanceof RoomError) reply(socket, { t: "error", message: e.message });
      else {
        console.error(e);
        reply(socket, { t: "error", message: "Server error" });
      }
    }
  });
  socket.on("close", () => {
    conns.delete(socket);
    if (conn.room && conn.member) conn.room.disconnect(conn.member, socket);
  });
  socket.on("error", () => {
  });
});
var heartbeat = setInterval(() => {
  for (const [socket, conn] of conns) {
    if (!conn.alive) {
      socket.terminate();
      continue;
    }
    conn.alive = false;
    socket.ping();
  }
}, 3e4);
var sweeper = setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.connectedCount === 0 && now - room.lastActivity > ROOM_IDLE_MS) {
      for (const m of room.members.values()) sessions.delete(m.session);
      room.destroy();
      rooms.delete(code);
      console.log(`[room ${code}] closed (idle)`);
    }
  }
}, 6e4);
server.listen(PORT, HOST, () => {
  const addrs = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const ni of list ?? []) if (ni.family === "IPv4" && !ni.internal) addrs.push(ni.address);
  }
  console.log("");
  console.log("  Paper Tycoon is running!");
  console.log("");
  console.log(`  You:            http://localhost:${PORT}`);
  for (const a of addrs) console.log(`  Same network:   http://${a}:${PORT}`);
  console.log(`  Over internet:  forward TCP port ${PORT} or use a tunnel (ngrok, playit.gg, Tailscale), then share that address.`);
  console.log("");
  console.log("  Press Ctrl+C to stop.");
});
function shutdown() {
  clearInterval(heartbeat);
  clearInterval(sweeper);
  for (const room of rooms.values()) room.destroy();
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1e3).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
