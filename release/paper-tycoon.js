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
`, js: '"use strict";(()=>{var cf=Object.defineProperty;var hf=(i,e,t)=>e in i?cf(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var X=(i,e,t)=>hf(i,typeof e!="symbol"?e+"":e,t);var rh=\'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="pp-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="pp-noise"/><feColorMatrix in="pp-noise" type="matrix" values="0.4 0.4 0.4 0 0.2  0.4 0.4 0.4 0 0.17  0.4 0.4 0.4 0 0.12  0 0 0 0 0.06" result="pp-tint"/><feBlend in="SourceGraphic" in2="pp-tint" mode="multiply" result="pp-blend"/><feComposite in="pp-blend" in2="SourceGraphic" operator="in"/></filter><filter id="pp-wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="pp-warp"/><feDisplacementMap in="SourceGraphic" in2="pp-warp" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="pp-shadow" x="-12%" y="-12%" width="130%" height="135%"><feDropShadow dx="2" dy="3" stdDeviation="1.5" flood-color="#2b2118" flood-opacity="0.35"/></filter><pattern id="pp-cardboard" patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="#c9a36b"/><rect x="0" y="0" width="12" height="3.5" fill="#b8905a"/><rect x="0" y="3.5" width="12" height="1.2" fill="#ad8752"/><rect x="0" y="7" width="12" height="1.5" fill="#d6b27c"/></pattern><pattern id="pp-wood" patternUnits="userSpaceOnUse" width="120" height="60"><rect width="120" height="60" fill="#8b5a2b"/><path d="M0 9 Q30 4 60 9 T120 9" fill="none" stroke="#a06a35" stroke-width="2" opacity="0.75"/><path d="M0 21 Q30 25 60 21 T120 21" fill="none" stroke="#7a4d22" stroke-width="1.5" opacity="0.8"/><path d="M0 33 Q30 28 60 33 T120 33" fill="none" stroke="#a06a35" stroke-width="1.5" opacity="0.6"/><path d="M0 45 Q30 49 60 45 T120 45" fill="none" stroke="#9c6531" stroke-width="2.5" opacity="0.55"/><path d="M0 55 Q30 52 60 55 T120 55" fill="none" stroke="#7a4d22" stroke-width="1" opacity="0.7"/></pattern></defs></svg>\';var Vs=null,tl=(()=>{try{return localStorage.getItem("pt.muted")==="1"}catch{return!1}})();function nl(){if(tl)return null;try{return Vs||(Vs=new(window.AudioContext||window.webkitAudioContext)),Vs.state==="suspended"&&Vs.resume(),Vs}catch{return null}}function ah(){nl()}function Or(){return tl}function oh(i){tl=i;try{localStorage.setItem("pt.muted",i?"1":"0")}catch{}}function Tt(i,e,t="sine",n=.15,s=0,r=0){let a=nl();if(!a)return;let o=a.createOscillator(),l=a.createGain();o.type=t,o.frequency.setValueAtTime(i,a.currentTime+s),r&&o.frequency.exponentialRampToValueAtTime(Math.max(20,i+r),a.currentTime+s+e),l.gain.setValueAtTime(1e-4,a.currentTime+s),l.gain.exponentialRampToValueAtTime(n,a.currentTime+s+.01),l.gain.exponentialRampToValueAtTime(1e-4,a.currentTime+s+e),o.connect(l).connect(a.destination),o.start(a.currentTime+s),o.stop(a.currentTime+s+e+.02)}function el(i,e=.08,t=0){let n=nl();if(!n)return;let s=n.createBuffer(1,Math.floor(n.sampleRate*i),n.sampleRate),r=s.getChannelData(0);for(let c=0;c<r.length;c++)r[c]=(Math.random()*2-1)*(1-c/r.length);let a=n.createBufferSource();a.buffer=s;let o=n.createGain();o.gain.value=e;let l=n.createBiquadFilter();l.type="highpass",l.frequency.value=1200,a.connect(l).connect(o).connect(n.destination),a.start(n.currentTime+t)}var Mt={step(){Tt(520+Math.random()*80,.06,"triangle",.08),el(.03,.03)},dice(){for(let i=0;i<6;i++)el(.05,.06,i*.09);Tt(300,.08,"square",.05,.55)},cash(){Tt(880,.08,"square",.06),Tt(1320,.12,"square",.06,.08)},pay(){Tt(440,.1,"sawtooth",.05),Tt(330,.16,"sawtooth",.05,.1)},card(){el(.12,.09),Tt(700,.05,"triangle",.05,.05)},build(){Tt(200,.06,"square",.08),Tt(200,.06,"square",.08,.12),Tt(260,.1,"square",.08,.24)},jail(){Tt(200,.35,"sawtooth",.08,0,-120),Tt(150,.4,"sawtooth",.08,.2,-80)},turn(){Tt(660,.08,"sine",.08),Tt(990,.12,"sine",.08,.1)},click(){Tt(900,.03,"square",.04)},win(){[523,659,784,1047].forEach((i,e)=>Tt(i,.25,"triangle",.1,e*.15))},lose(){[392,349,311,262].forEach((i,e)=>Tt(i,.3,"sawtooth",.06,e*.2))},bid(){Tt(1200,.05,"square",.05)},notify(){Tt(784,.1,"sine",.08),Tt(1047,.15,"sine",.08,.12)}};function v(i,e,...t){let n=document.createElement(i);if(e){for(let[s,r]of Object.entries(e))if(!(r==null||r===!1))if(s==="class")n.className=String(r);else if(s==="style"&&typeof r=="object")for(let[a,o]of Object.entries(r))a.startsWith("--")?n.style.setProperty(a,o):n.style[a]=o;else s==="html"?n.innerHTML=String(r):s.startsWith("on")&&typeof r=="function"?n.addEventListener(s.slice(2).toLowerCase(),r):s==="dataset"&&typeof r=="object"?Object.assign(n.dataset,r):s in n&&!(s.startsWith("aria")||s.startsWith("data-"))?n[s]=r:n.setAttribute(s,String(r))}return Br(n,t),n}function Br(i,e){for(let t of e)t==null||t===!1||(Array.isArray(t)?Br(i,t):t instanceof Node?i.appendChild(t):i.appendChild(document.createTextNode(String(t))))}function _t(i){for(;i.firstChild;)i.removeChild(i.firstChild)}function De(i){return`${i<0?"-":""}$${Math.abs(Math.round(i)).toLocaleString("en-US")}`}var Fr=null;function $n(i,e="info",t=2600){Fr||(Fr=v("div",{class:"toast-host"}),document.body.appendChild(Fr));let n=v("div",{class:`toast paper paper--flat ${e==="error"?"toast--error":""}`},i);Fr.appendChild(n),setTimeout(()=>n.remove(),t)}var Bt=i=>new Promise(e=>setTimeout(e,i));var zr=class{constructor(){X(this,"ws",null);X(this,"listeners",new Set);X(this,"statusListeners",new Set);X(this,"queue",[]);X(this,"backoff",500);X(this,"closedByUser",!1);X(this,"session",null);X(this,"status","closed")}connect(){this.closedByUser=!1;let e=location.protocol==="https:"?"wss":"ws";this.setStatus("connecting");let t=new WebSocket(`${e}://${location.host}/ws`);this.ws=t,t.addEventListener("open",()=>{this.backoff=500,this.setStatus("open"),this.session&&this.sendNow({t:"rejoin",session:this.session});for(let n of this.queue)t.send(n);this.queue=[]}),t.addEventListener("message",n=>{let s;try{s=JSON.parse(String(n.data))}catch{return}s.t==="welcome"&&(this.session=s.session),s.t==="left"&&(this.session=null),s.t==="error"&&s.fatal&&(this.session=null);for(let r of this.listeners)r(s)}),t.addEventListener("close",()=>{this.ws=null,this.setStatus("closed"),!this.closedByUser&&(setTimeout(()=>this.connect(),this.backoff),this.backoff=Math.min(8e3,this.backoff*1.7))}),t.addEventListener("error",()=>{})}send(e){let t=JSON.stringify(e);this.ws&&this.ws.readyState===WebSocket.OPEN?this.ws.send(t):this.queue.push(t)}sendNow(e){this.ws&&this.ws.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}onStatus(e){return this.statusListeners.add(e),()=>this.statusListeners.delete(e)}setStatus(e){this.status=e;for(let t of this.statusListeners)t(e)}close(){this.closedByUser=!0,this.ws?.close()}};var Hr=class{constructor(){X(this,"state",{screen:"home",connection:"closed",playerId:null,room:null,game:null,timerEndsAt:null,chat:[]});X(this,"listeners",new Set)}set(e){Object.assign(this.state,e);for(let t of this.listeners)t(this.state)}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}get me(){return this.state.game?.players.find(e=>e.id===this.state.playerId)??null}get isHost(){return!!this.state.room&&this.state.room.hostId===this.state.playerId}},il="pt.session",lh="pt.profile";function Ws(i,e){try{i&&e?localStorage.setItem(il,JSON.stringify({session:i,code:e})):localStorage.removeItem(il)}catch{}}function ch(){try{let i=localStorage.getItem(il);return i?JSON.parse(i):null}catch{return null}}function hh(i,e){try{localStorage.setItem(lh,JSON.stringify({name:i,token:e}))}catch{}}function dh(){try{return JSON.parse(localStorage.getItem(lh)||"")||{name:"",token:"hat"}}catch{return{name:"",token:"hat"}}}function vt(i,e,t,n,s,r){return{index:i,type:"property",name:e,group:t,price:n,rent:s,houseCost:r}}function Gr(i,e){return{index:i,type:"railroad",name:e,price:200}}function uh(i,e){return{index:i,type:"utility",name:e,price:150}}var fh=[{index:0,type:"go",name:"Go"},vt(1,"Mediterranean Avenue","brown",60,[2,10,30,90,160,250],50),{index:2,type:"chest",name:"Community Chest"},vt(3,"Baltic Avenue","brown",60,[4,20,60,180,320,450],50),{index:4,type:"tax",name:"Income Tax",amount:200},Gr(5,"Reading Railroad"),vt(6,"Oriental Avenue","lightblue",100,[6,30,90,270,400,550],50),{index:7,type:"chance",name:"Chance"},vt(8,"Vermont Avenue","lightblue",100,[6,30,90,270,400,550],50),vt(9,"Connecticut Avenue","lightblue",120,[8,40,100,300,450,600],50),{index:10,type:"jail",name:"Jail / Just Visiting"},vt(11,"St. Charles Place","pink",140,[10,50,150,450,625,750],100),uh(12,"Electric Company"),vt(13,"States Avenue","pink",140,[10,50,150,450,625,750],100),vt(14,"Virginia Avenue","pink",160,[12,60,180,500,700,900],100),Gr(15,"Pennsylvania Railroad"),vt(16,"St. James Place","orange",180,[14,70,200,550,750,950],100),{index:17,type:"chest",name:"Community Chest"},vt(18,"Tennessee Avenue","orange",180,[14,70,200,550,750,950],100),vt(19,"New York Avenue","orange",200,[16,80,220,600,800,1e3],100),{index:20,type:"freeparking",name:"Free Parking"},vt(21,"Kentucky Avenue","red",220,[18,90,250,700,875,1050],150),{index:22,type:"chance",name:"Chance"},vt(23,"Indiana Avenue","red",220,[18,90,250,700,875,1050],150),vt(24,"Illinois Avenue","red",240,[20,100,300,750,925,1100],150),Gr(25,"B&O Railroad"),vt(26,"Atlantic Avenue","yellow",260,[22,110,330,800,975,1150],150),vt(27,"Ventnor Avenue","yellow",260,[22,110,330,800,975,1150],150),uh(28,"Water Works"),vt(29,"Marvin Gardens","yellow",280,[24,120,360,850,1025,1200],150),{index:30,type:"gotojail",name:"Go To Jail"},vt(31,"Pacific Avenue","green",300,[26,130,390,900,1100,1275],200),vt(32,"North Carolina Avenue","green",300,[26,130,390,900,1100,1275],200),{index:33,type:"chest",name:"Community Chest"},vt(34,"Pennsylvania Avenue","green",320,[28,150,450,1e3,1200,1400],200),Gr(35,"Short Line"),{index:36,type:"chance",name:"Chance"},vt(37,"Park Place","darkblue",350,[35,175,500,1100,1300,1500],200),{index:38,type:"tax",name:"Luxury Tax",amount:100},vt(39,"Boardwalk","darkblue",400,[50,200,600,1400,1700,2e3],200)],Jn={brown:[1,3],lightblue:[6,8,9],pink:[11,13,14],orange:[16,18,19],red:[21,23,24],yellow:[26,27,29],green:[31,32,34],darkblue:[37,39]},ns=[5,15,25,35],is=[12,28];var ph=[25,50,100,200],mh=[4,10];function cn(i){return Math.floor((i.price??0)/2)}var gh=[{id:0,text:"Advance to Go. (Collect $200)",effect:{kind:"advance",to:0}},{id:1,text:"Advance to Illinois Avenue. If you pass Go, collect $200.",effect:{kind:"advance",to:24}},{id:2,text:"Advance to St. Charles Place. If you pass Go, collect $200.",effect:{kind:"advance",to:11}},{id:3,text:"Advance token to the nearest Utility. If unowned, you may buy it from the Bank. If owned, pay the owner ten times the amount shown on the dice.",effect:{kind:"nearestUtility"}},{id:4,text:"Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.",effect:{kind:"nearestRailroad"}},{id:5,text:"Advance token to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.",effect:{kind:"nearestRailroad"}},{id:6,text:"Bank pays you dividend of $50.",effect:{kind:"collect",amount:50}},{id:7,text:"Get Out of Jail Free. This card may be kept until needed or traded.",effect:{kind:"jailCard"}},{id:8,text:"Go Back 3 Spaces.",effect:{kind:"goBack",spaces:3}},{id:9,text:"Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.",effect:{kind:"goToJail"}},{id:10,text:"Make general repairs on all your property: for each house pay $25, for each hotel pay $100.",effect:{kind:"repairs",perHouse:25,perHotel:100}},{id:11,text:"Pay poor tax of $15.",effect:{kind:"pay",amount:15}},{id:12,text:"Take a trip to Reading Railroad. If you pass Go, collect $200.",effect:{kind:"advance",to:5}},{id:13,text:"Take a walk on the Boardwalk. Advance token to Boardwalk.",effect:{kind:"advance",to:39}},{id:14,text:"You have been elected Chairman of the Board. Pay each player $50.",effect:{kind:"payEach",amount:50}},{id:15,text:"Your building loan matures. Collect $150.",effect:{kind:"collect",amount:150}}],xh=[{id:0,text:"Advance to Go. (Collect $200)",effect:{kind:"advance",to:0}},{id:1,text:"Bank error in your favor. Collect $200.",effect:{kind:"collect",amount:200}},{id:2,text:"Doctor\'s fee. Pay $50.",effect:{kind:"pay",amount:50}},{id:3,text:"From sale of stock you get $50.",effect:{kind:"collect",amount:50}},{id:4,text:"Get Out of Jail Free. This card may be kept until needed or traded.",effect:{kind:"jailCard"}},{id:5,text:"Go to Jail. Go directly to Jail. Do not pass Go, do not collect $200.",effect:{kind:"goToJail"}},{id:6,text:"Holiday fund matures. Receive $100.",effect:{kind:"collect",amount:100}},{id:7,text:"Income tax refund. Collect $20.",effect:{kind:"collect",amount:20}},{id:8,text:"It is your birthday. Collect $10 from every player.",effect:{kind:"collectFromEach",amount:10}},{id:9,text:"Life insurance matures. Collect $100.",effect:{kind:"collect",amount:100}},{id:10,text:"Pay hospital fees of $100.",effect:{kind:"pay",amount:100}},{id:11,text:"Pay school fees of $50.",effect:{kind:"pay",amount:50}},{id:12,text:"Receive $25 consultancy fee.",effect:{kind:"collect",amount:25}},{id:13,text:"You are assessed for street repairs: $40 per house, $115 per hotel.",effect:{kind:"repairs",perHouse:40,perHotel:115}},{id:14,text:"You have won second prize in a beauty contest. Collect $10.",effect:{kind:"collect",amount:10}},{id:15,text:"You inherit $100.",effect:{kind:"collect",amount:100}}];var yh={chance:gh.find(i=>i.effect.kind==="jailCard").id,chest:xh.find(i=>i.effect.kind==="jailCard").id};var bn={ok:!0};function Ne(i){return{ok:!1,reason:i}}function Hn(i,e){return i.players.find(t=>t.id===e)}function sl(i){return i.players[i.currentPlayer].id}function df(i,e){return sl(i)===e}function uf(i){return i.players.filter(e=>!e.bankrupt)}function rl(i,e){return Object.keys(i.properties).map(Number).filter(t=>i.properties[t].owner===e).sort((t,n)=>t-n)}function _h(i,e,t){return t.filter(n=>i.properties[n]?.owner===e).length}function Sh(i,e,t){return Jn[t].every(n=>i.properties[n]?.owner===e)}function wh(i,e){return Jn[e].some(t=>(i.properties[t]?.houses??0)>0)}function al(i){return Math.ceil(cn(i)/10)}function Eh(i){return cn(i)+al(i)}function ol(i,e,t){let n=i.board[e],s=i.properties[e];if(!n||!s||s.owner===null||s.mortgaged)return 0;switch(n.type){case"property":{let r=n.rent??[];if(s.houses>0)return r[s.houses]??0;let a=r[0]??0;return n.group&&Sh(i,s.owner,n.group)?a*2:a}case"railroad":{let r=_h(i,s.owner,ns);return ph[Math.min(Math.max(r,1),4)-1]}case"utility":{let r=_h(i,s.owner,is);return mh[Math.min(Math.max(r,1),2)-1]*t}default:return 0}}function ss(i,e){let t=Hn(i,e);if(!t)return Ne("Unknown player");if(t.bankrupt)return Ne("You are out of the game");switch(i.phase){case"roll":case"action":return df(i,e)?bn:Ne("Not your turn");case"debt":return i.debt?.debtor===e?bn:Ne("Only the player in debt may manage property now");case"buy":return Ne("Decide on the purchase first");case"auction":return Ne("Not during an auction");default:return Ne("The game is over")}}function Xs(i,e,t){let n=ss(i,e);if(!n.ok)return n;let s=Hn(i,e),r=i.board[t],a=i.properties[t];if(!r||!a)return Ne("Not a property");if(r.type!=="property"||!r.group)return Ne("Only streets can be built on");if(a.owner!==e)return Ne("You do not own this property");if(!Sh(i,e,r.group))return Ne("You must own the whole color group");let o=Jn[r.group];if(o.some(c=>i.properties[c].mortgaged))return Ne("A property in this group is mortgaged");if(a.houses>=5)return Ne("There is already a hotel here");let l=Math.min(...o.map(c=>i.properties[c].houses));if(a.houses>l)return Ne("Build evenly: add houses to the least-built streets first");if(a.houses===4){if(i.hotelsLeft<1)return Ne("The bank has no hotels left")}else if(i.housesLeft<1)return Ne("The bank has no houses left");return s.cash<(r.houseCost??0)?Ne("Not enough cash"):bn}function qs(i,e,t){let n=ss(i,e);if(!n.ok)return n;let s=i.board[t],r=i.properties[t];if(!s||!r)return Ne("Not a property");if(s.type!=="property"||!s.group)return Ne("Not a street");if(r.owner!==e)return Ne("You do not own this property");if(r.houses===0)return Ne("Nothing to sell");let a=Math.max(...Jn[s.group].map(o=>i.properties[o].houses));return r.houses<a?Ne("Sell evenly: sell from the most-built streets first"):r.houses===5&&i.housesLeft<4?Ne("The bank lacks the 4 houses needed to break up the hotel"):bn}function Ys(i,e,t){let n=ss(i,e);if(!n.ok)return n;let s=i.board[t],r=i.properties[t];return!s||!r?Ne("Not a property"):r.owner!==e?Ne("You do not own this property"):r.mortgaged?Ne("Already mortgaged"):r.houses>0?Ne("Sell the buildings first"):s.group&&wh(i,s.group)?Ne("Sell all buildings in the color group first"):bn}function Zs(i,e,t){let n=ss(i,e);if(!n.ok)return n;let s=Hn(i,e),r=i.board[t],a=i.properties[t];return!r||!a?Ne("Not a property"):a.owner!==e?Ne("You do not own this property"):a.mortgaged?s.cash<Eh(r)?Ne("Not enough cash"):bn:Ne("Not mortgaged")}function Vr(i,e){let t=Hn(i,e);if(!t)return 0;let n=t.cash;for(let s of rl(i,e)){let r=i.board[s],a=i.properties[s];n+=a.mortgaged?cn(r):r.price??0,n+=a.houses*(r.houseCost??0)}return n}function vh(i,e){let t=0;for(let n of e)i.properties[n]?.mortgaged&&(t+=al(i.board[n]));return t}function bh(i){return i.cash===0&&i.jailCards===0&&i.properties.length===0}function Mh(i,e,t){if(!e||typeof e!="object")return"Malformed trade";if(!Number.isInteger(e.cash)||e.cash<0)return"Invalid cash amount";if(!Number.isInteger(e.jailCards)||e.jailCards<0)return"Invalid jail card count";if(e.jailCards>t.jailCards)return`${t.name} does not have ${e.jailCards} Get Out of Jail Free card(s)`;if(!Array.isArray(e.properties))return"Invalid property list";let n=new Set;for(let s of e.properties){if(!Number.isInteger(s)||!(s in i.properties))return"Invalid property";if(n.has(s))return"Duplicate property in trade";n.add(s);let r=i.board[s],a=i.properties[s];if(a.owner!==t.id)return`${t.name} does not own ${r.name}`;if(a.houses>0)return`${r.name} has buildings`;if(r.group&&wh(i,r.group))return`The ${r.group} group has buildings`}return null}function ll(i,e,t){switch(i.phase){case"roll":case"action":case"buy":return bn;case"debt":return i.debt&&(i.debt.debtor===e||i.debt.debtor===t)?bn:Ne("Only trades involving the player in debt are allowed right now");case"auction":return Ne("Not during an auction");default:return Ne("The game is over")}}function Th(i,e,t){let n=Hn(i,e.from),s=Hn(i,e.to);if(!n||n.bankrupt)return"The proposer is not in the game";if(!s||s.bankrupt)return"The other player is not in the game";if(n.id===s.id)return"You cannot trade with yourself";let r=Mh(i,e.offer,n);if(r)return r;let a=Mh(i,e.request,s);if(a)return a;if(bh(e.offer)&&bh(e.request))return"The trade is empty";if(t){if(n.cash-e.offer.cash+e.request.cash-vh(i,e.request.properties)<0)return`${n.name} cannot afford this trade`;if(s.cash-e.request.cash+e.offer.cash-vh(i,e.offer.properties)<0)return`${s.name} cannot afford this trade`}return null}function Ah(i,e){let t=Hn(i,e);return t?t.bankrupt?Ne("You are out of the game"):i.phase==="auction"||i.phase==="ended"?ll(i,e,e):i.phase==="debt"?i.debt?Hn(i,i.debt.debtor)?.bankrupt?Ne("No one to trade with"):bn:Ne("No debt"):uf(i).length>1?bn:Ne("No one to trade with"):Ne("Unknown player")}function Ch(i,e,t){if(t.to!==e)return Ne("Only the recipient can accept");let n=ll(i,t.from,t.to);if(!n.ok)return n;let s=Th(i,t,!0);return s?Ne(s):bn}function Rh(i,e,t){return t.to!==e&&t.from!==e?Ne("Not your trade"):i.phase==="auction"?Ne("Not during an auction"):i.phase==="ended"?Ne("The game is over"):bn}function jn(i,e){let t=Hn(i,e);if(!t||t.bankrupt||i.phase==="ended")return[];let n=[],s=sl(i)===e;switch(i.phase){case"roll":s&&(n.push("roll"),t.inJail&&i.dice===null&&(t.cash>=i.config.jailFine&&n.push("payJailFine"),t.jailCards>0&&n.push("useJailCard")));break;case"buy":if(s&&i.pendingSpace!==null){let r=i.board[i.pendingSpace]?.price??0;t.cash>=r&&n.push("buy"),n.push("decline")}break;case"auction":i.auction&&i.auction.current===e&&(t.cash>i.auction.highBid&&n.push("bid"),i.auction.highBidder!==e&&n.push("passAuction"));break;case"debt":i.debt&&i.debt.debtor===e&&(t.cash>=i.debt.amount&&n.push("payDebt"),n.push("declareBankruptcy"));break;case"action":s&&n.push("endTurn");break}if(ss(i,e).ok){let r=rl(i,e);r.some(a=>Xs(i,e,a).ok)&&n.push("build"),r.some(a=>qs(i,e,a).ok)&&n.push("sellHouse"),r.some(a=>Ys(i,e,a).ok)&&n.push("mortgage"),r.some(a=>Zs(i,e,a).ok)&&n.push("unmortgage")}return Ah(i,e).ok&&n.push("proposeTrade"),i.trades.some(r=>Ch(i,e,r).ok)&&n.push("acceptTrade"),i.trades.some(r=>Rh(i,e,r).ok)&&n.push("rejectTrade"),n.push("resign"),n}var xf={1:[[32,32]],2:[[20,20],[44,44]],3:[[20,20],[32,32],[44,44]],4:[[20,20],[44,20],[20,44],[44,44]],5:[[20,20],[44,20],[32,32],[20,44],[44,44]],6:[[20,20],[44,20],[20,32],[44,32],[20,44],[44,44]]};function Gn(i){let e=Math.min(6,Math.max(1,Math.round(i)||1));return\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"><path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z"/></g><g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"><path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z" fill="#fffaf0" stroke="none"/><path d="M52.8 15 L52.8 47.5 Q52.8 52.8 47.5 52.8 L15 52.8" fill="none" stroke="#e4dfd3" stroke-width="4.5"/><path d="M16 7.5 L48.5 7 Q57 7 56.8 15.5 L57 48 Q57 57 48.5 56.8 L16 57 Q7 57 7.2 48.5 L7 16 Q7 7.5 16 7.5 Z" fill="none"/>\'+xf[e].map(([n,s])=>\'<circle cx="\'+n+\'" cy="\'+s+\'" r="4.6" fill="#2b2118" stroke="none"/>\').join("")+"</g></svg>"}var At=\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\',Ct=\'<g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">\',zt=\'<g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">\',Ht="</g></svg>",Vh=\'<g stroke="#2b2118" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">\',Ph="M6 42 A24 24 0 0 1 54 42 L60 41 L47.5 57 L35 41 L41 42 A11 11 0 0 0 19 42 Z",yf=At+Ct+\'<path d="\'+Ph+\'"/></g>\'+zt+\'<path d="\'+Ph+\'" fill="#d9413a"/><path d="M17.5 42 A14.5 14.5 0 0 1 46.5 42 L44.2 42 A12.2 12.2 0 0 0 19.8 42 Z" fill="#a8302b" stroke="none"/><path d="M39.5 43 L47.5 53 L55.5 43 Z" fill="#a8302b" stroke="none"/>\'+Ht,Lh="M24 25 Q24 15 32 15 Q40 15 40 22 Q40 27 34.5 30 Q32 31.5 32 35 L32 38",_f=At+\'<g transform="rotate(-6 32 32)">\'+Ct+\'<rect x="16" y="8" width="34" height="48" rx="3"/></g>\'+zt+\'<rect x="16" y="8" width="34" height="48" rx="3" fill="#fffaf0"/><rect x="44" y="10" width="4.5" height="44" fill="#e4dfd3" stroke="none"/><rect x="19" y="11" width="28" height="42" rx="2" fill="none" stroke="#e8842f" stroke-width="1.5" stroke-dasharray="3 2.5"/><path d="\'+Lh+\'" fill="none" stroke-width="9"/><path d="\'+Lh+\'" fill="none" stroke="#e8842f" stroke-width="4"/><circle cx="32" cy="46" r="4.2" fill="#e8842f"/></g></g></svg>\',vf=At+Ct+\'<path d="M8 33 L8 24 Q8 12 20 12 L44 12 Q56 12 56 24 L56 33 Z"/><rect x="8" y="33" width="48" height="23" rx="2"/></g>\'+zt+\'<path d="M8 33 L8 24 Q8 12 20 12 L44 12 Q56 12 56 24 L56 33 Z" fill="#6cc4ea"/><path d="M44 13.5 Q54.5 14 54.5 24 L54.5 31.5 L48 31.5 L48 24 Q48 16 44 13.5 Z" fill="#3f9dc8" stroke="none"/><rect x="18" y="12.5" width="5" height="20.5" fill="#3f9dc8"/><rect x="41" y="12.5" width="5" height="20.5" fill="#3f9dc8"/><rect x="8" y="33" width="48" height="23" rx="2" fill="#6cc4ea"/><rect x="10" y="50" width="44" height="4" fill="#3f9dc8" stroke="none"/><rect x="18" y="33" width="5" height="23" fill="#3f9dc8"/><rect x="41" y="33" width="5" height="23" fill="#3f9dc8"/><rect x="26.5" y="29" width="11" height="11" rx="2" fill="#f2b632"/><circle cx="32" cy="34" r="1.7" fill="#2b2118" stroke="none"/><rect x="31" y="34" width="2" height="3.5" fill="#2b2118" stroke="none"/>\'+Ht,bf=At+Ct+\'<circle cx="54" cy="8" r="4.5"/><rect x="42" y="9" width="8" height="16"/><rect x="40" y="8" width="12" height="4" rx="1"/><rect x="24" y="23" width="32" height="21" rx="9"/><rect x="6" y="14" width="20" height="30" rx="2"/><rect x="4" y="12" width="24" height="4" rx="1"/><rect x="4" y="44" width="52" height="5"/><path d="M54 44 L62 54 L54 54 Z"/><circle cx="15" cy="53" r="6.5"/><circle cx="33" cy="53" r="6.5"/><circle cx="47" cy="53" r="4.5"/></g>\'+zt+\'<circle cx="54" cy="8" r="4.5" fill="#e4dfd3"/><rect x="42" y="9" width="8" height="16" fill="#4a4a4a"/><rect x="40" y="8" width="12" height="4" rx="1" fill="#4a4a4a"/><rect x="24" y="23" width="32" height="21" rx="9" fill="#4a4a4a"/><path d="M27 37 L52 37 Q49 42 44 42.5 L28 42.5 Z" fill="#333333" stroke="none"/><circle cx="55" cy="29.5" r="3" fill="#f9e27a"/><rect x="6" y="14" width="20" height="30" rx="2" fill="#4a4a4a"/><rect x="8" y="37" width="16" height="5" fill="#333333" stroke="none"/><rect x="10" y="19" width="11" height="10" rx="1" fill="#bfe3f5"/><rect x="4" y="12" width="24" height="4" rx="1" fill="#4a4a4a"/><rect x="4" y="44" width="52" height="5" fill="#2b2118"/><path d="M54 44 L62 54 L54 54 Z" fill="#6b7177"/><circle cx="15" cy="53" r="6.5" fill="#d9413a"/><circle cx="33" cy="53" r="6.5" fill="#d9413a"/><circle cx="47" cy="53" r="4.5" fill="#d9413a"/><path d="M15 53 L33 53" fill="none"/><circle cx="15" cy="53" r="2" fill="#fffaf0" stroke="none"/><circle cx="33" cy="53" r="2" fill="#fffaf0" stroke="none"/><circle cx="47" cy="53" r="1.5" fill="#fffaf0" stroke="none"/>\'+Ht,Ih="M32 4 L32 8 M15 9 L18 12 M49 9 L46 12 M9 28 L13 28 M55 28 L51 28",Mf=At+Ct+\'<path d="\'+Ih+\'" fill="none"/><circle cx="32" cy="28" r="16"/><path d="M24 42 L40 42 L40 52 Q40 54 38 54 L26 54 Q24 54 24 52 Z"/><rect x="28" y="54" width="8" height="4" rx="1.5"/></g>\'+zt+\'<path d="\'+Ih+\'" fill="none"/><circle cx="32" cy="28" r="16" fill="#f9e27a" stroke="none"/><path d="M40 14.2 A16 16 0 0 1 40 41.8 A26 26 0 0 0 40 14.2 Z" fill="#e9c94d" stroke="none"/><circle cx="32" cy="28" r="16" fill="none"/><path d="M26 36 L26 32 L29 27 L32 34 L35 27 L38 32 L38 36" fill="none" stroke-width="2"/><path d="M24 42 L40 42 L40 52 Q40 54 38 54 L26 54 Q24 54 24 52 Z" fill="#9aa0a6"/><path d="M24 46 L40 46 M24 50 L40 50" fill="none" stroke-width="2"/><rect x="28" y="54" width="8" height="4" rx="1.5" fill="#6b7177"/>\'+Ht,Dh="M16 36 L16 26 Q16 15 27 15 L42 15 Q52 15 52 25 L52 38 L58 38 L58 50 L46 50 L46 38 L44 38 L44 25 Q44 23 42 23 L27 23 Q24 23 24 26 L24 36 Z",Sf=At+Ct+\'<rect x="44" y="8" width="4" height="8"/><rect x="38" y="4" width="16" height="5" rx="2.5"/><path d="\'+Dh+\'"/><rect x="13" y="35" width="14" height="5" rx="1"/><path d="M20 44 Q13 53 20 58 Q27 53 20 44 Z"/></g>\'+zt+\'<rect x="44" y="8" width="4" height="8" fill="#9aa0a6"/><rect x="38" y="4" width="16" height="5" rx="2.5" fill="#6b7177"/><path d="\'+Dh+\'" fill="#9aa0a6"/><rect x="48" y="44" width="8" height="4" fill="#6b7177" stroke="none"/><path d="M20 30 L20 24 Q20 19.5 26 19.5" fill="none" stroke="#d7dbe0" stroke-width="2"/><rect x="13" y="35" width="14" height="5" rx="1" fill="#6b7177"/><path d="M20 44 Q13 53 20 58 Q27 53 20 44 Z" fill="#4aa3e0"/><circle cx="17.5" cy="53" r="1.5" fill="#bfe3f5" stroke="none"/>\'+Ht,Nh="M37.5 30.5 Q35 26.5 31 27 Q26 27.5 26.5 32 Q27 36 32 37 Q37.5 38 37.5 42.5 Q37 47 32 47 Q28 47 26 44",wf=At+Ct+\'<path d="M25 18 L39 18 L37 9 L27 9 Z"/><path d="M32 18 Q12 26 11 44 Q11 58 32 58 Q53 58 53 44 Q52 26 32 18 Z"/></g>\'+zt+\'<path d="M25 18 L39 18 L37 9 L27 9 Z" fill="#9aa0a6"/><path d="M32 18 Q12 26 11 44 Q11 58 32 58 Q53 58 53 44 Q52 26 32 18 Z" fill="#9aa0a6"/><path d="M44 29 Q51.3 38 51.3 45 Q51 54 41 56.6 Q47.5 52 47.5 45 Q47.5 37 44 29 Z" fill="#6b7177" stroke="none"/><rect x="24" y="16" width="16" height="4.5" rx="2" fill="#6b7177"/><path d="M32 23.5 L32 27.5 M32 46.5 L32 50.5" fill="none" stroke-width="7"/><path d="\'+Nh+\'" fill="none" stroke-width="8"/><path d="M32 23.5 L32 27.5 M32 46.5 L32 50.5" fill="none" stroke="#3aa655" stroke-width="2.5"/><path d="\'+Nh+\'" fill="none" stroke="#3aa655" stroke-width="3.5"/>\'+Ht,Uh="M50 8 L51.6 12.4 L56 14 L51.6 15.6 L50 20 L48.4 15.6 L44 14 L48.4 12.4 Z",kh="M12 11 L13.2 14 L16 15 L13.2 16 L12 19 L10.8 16 L8 15 L10.8 14 Z",Ef=At+Ct+\'<circle cx="32" cy="42" r="13" fill="none" stroke-width="17"/><path d="M22 20 L27 12 L37 12 L42 20 L32 32 Z"/><path d="\'+Uh+\'"/><path d="\'+kh+\'"/></g>\'+zt+\'<circle cx="32" cy="42" r="13" fill="none" stroke-width="11"/><circle cx="32" cy="42" r="13" fill="none" stroke="#f2b632" stroke-width="6"/><path d="M21 46 A11.5 11.5 0 0 0 43 46" fill="none" stroke="#d99a1e" stroke-width="3"/><path d="M22 20 L27 12 L37 12 L42 20 L32 32 Z" fill="#bfe3f5"/><path d="M32 20 L42 20 L32 32 Z" fill="#8fd0ee" stroke="none"/><path d="M22 20 L42 20 M27 12 L32 20 L37 12" fill="none" stroke-width="2"/><path d="\'+Uh+\'" fill="#fffaf0" stroke-width="2"/><path d="\'+kh+\'" fill="#fffaf0" stroke-width="2"/>\'+Ht,Tf=At+Ct+\'<rect x="8" y="8" width="48" height="48" rx="3"/><rect x="9" y="6" width="4" height="52" rx="1.5"/><rect x="51" y="6" width="4" height="52" rx="1.5"/></g>\'+zt+\'<rect x="8" y="8" width="48" height="48" rx="3" fill="#d7d2c4"/><rect x="10.5" y="10.5" width="43" height="43" rx="2" fill="#c9c3b3" stroke="none"/><circle cx="32" cy="33" r="12" fill="#fffaf0"/><circle cx="28.5" cy="31" r="2" fill="#2b2118" stroke="none"/><circle cx="35.5" cy="31" r="2" fill="#2b2118" stroke="none"/><path d="M26 26 L29.5 27.5 M38 26 L34.5 27.5" fill="none" stroke-width="2"/><path d="M27.5 40 Q32 36 36.5 40" fill="none" stroke-width="2.2"/><rect x="8" y="16" width="48" height="3.5" fill="#8a8f94"/><rect x="8" y="46" width="48" height="3.5" fill="#8a8f94"/><rect x="9" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/><rect x="20.5" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/><rect x="39.5" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/><rect x="51" y="6" width="4" height="52" rx="1.5" fill="#8a8f94"/>\'+Ht,Oh="M13 12 L45 12 L54 20.5 L45 29 L13 29 Z",Fh="M51 33 L19 33 L10 41 L19 49 L51 49 Z",Af=At+Ct+\'<rect x="29.5" y="14" width="5" height="44" rx="1.5"/><path d="\'+Oh+\'"/><path d="\'+Fh+\'"/><ellipse cx="32" cy="57" rx="11" ry="3.5"/></g>\'+zt+\'<ellipse cx="32" cy="57" rx="11" ry="3.5" fill="#8a8f94"/><rect x="29.5" y="14" width="5" height="44" rx="1.5" fill="#6b7177"/><path d="\'+Oh+\'" fill="#9aa0a6"/><path d="M13 25 L47.5 25 L45 27.5 L13 27.5 Z" fill="#6b7177" stroke="none"/><path d="M19 18 L40 18 M19 23 L33 23" fill="none" stroke-width="2.2"/><path d="\'+Fh+\'" fill="#9aa0a6"/><path d="M51 45 L16.5 45 L19 47.5 L51 47.5 Z" fill="#6b7177" stroke="none"/><path d="M25 39 L46 39 M31 44 L46 44" fill="none" stroke-width="2.2"/>\'+Ht,Cf=At+Ct+\'<rect x="9" y="44" width="10" height="12" rx="3"/><rect x="45" y="44" width="10" height="12" rx="3"/><path d="M15 33 L19 17 Q20 13 25 13 L39 13 Q44 13 45 17 L49 33 Z"/><rect x="10" y="26" width="6" height="4" rx="1"/><rect x="48" y="26" width="6" height="4" rx="1"/><rect x="5" y="32" width="54" height="20" rx="4"/></g>\'+zt+\'<rect x="9" y="44" width="10" height="12" rx="3" fill="#2b2118"/><rect x="45" y="44" width="10" height="12" rx="3" fill="#2b2118"/><path d="M15 33 L19 17 Q20 13 25 13 L39 13 Q44 13 45 17 L49 33 Z" fill="#d9413a"/><path d="M19.5 30 L22.5 18 L41.5 18 L44.5 30 Z" fill="#bfe3f5"/><rect x="10" y="26" width="6" height="4" rx="1" fill="#a8302b"/><rect x="48" y="26" width="6" height="4" rx="1" fill="#a8302b"/><rect x="5" y="32" width="54" height="20" rx="4" fill="#d9413a"/><rect x="8" y="46" width="48" height="4" fill="#a8302b" stroke="none"/><circle cx="14" cy="40" r="4" fill="#f9e27a"/><circle cx="50" cy="40" r="4" fill="#f9e27a"/><rect x="24" y="38" width="16" height="5" rx="1.5" fill="#2b2118" stroke="none"/><rect x="7" y="48" width="50" height="5" rx="2" fill="#9aa0a6"/>\'+Ht,Rf=At+Ct+\'<path d="M27 37 L12 28" fill="none" stroke-width="16"/><path d="M45 37 L50 48" fill="none" stroke-width="16"/><circle cx="11" cy="27" r="4"/><path d="M9 25 L5 22" fill="none" stroke-width="10"/><circle cx="50.5" cy="49.5" r="3.5"/><path d="M26 34 L46 34 L50 54 L22 54 Z"/><rect x="27" y="53.5" width="8" height="6" rx="1"/><rect x="37" y="53.5" width="8" height="6" rx="1"/><circle cx="36" cy="23" r="9"/><path d="M25 17 Q25 6 36 6 Q47 6 47 17 Z"/><rect x="23" y="16" width="26" height="4" rx="1.5"/></g>\'+zt+\'<path d="M27 37 L12 28" fill="none" stroke-width="9"/><path d="M27 37 L12 28" fill="none" stroke="#2f6fd6" stroke-width="4.5"/><path d="M45 37 L50 48" fill="none" stroke-width="9"/><path d="M45 37 L50 48" fill="none" stroke="#2f6fd6" stroke-width="4.5"/><rect x="27" y="53.5" width="8" height="6" rx="1" fill="#1f4fa3"/><rect x="37" y="53.5" width="8" height="6" rx="1" fill="#1f4fa3"/><path d="M26 34 L46 34 L50 54 L22 54 Z" fill="#2f6fd6"/><path d="M42 35.5 L45 35.5 L48.6 52.5 L45 52.5 Z" fill="#1f4fa3" stroke="none"/><rect x="23.2" y="51" width="25.6" height="3.5" fill="#2b2118" stroke="none"/><circle cx="36" cy="42" r="1.5" fill="#f2b632" stroke="none"/><circle cx="36" cy="47.5" r="1.5" fill="#f2b632" stroke="none"/><circle cx="11" cy="27" r="4" fill="#f1c7a4"/><path d="M9 25 L5 22" fill="none" stroke-width="6"/><path d="M9 25 L5 22" fill="none" stroke="#f1c7a4" stroke-width="3"/><circle cx="50.5" cy="49.5" r="3.5" fill="#f1c7a4"/><circle cx="36" cy="23" r="9" fill="#f1c7a4"/><circle cx="33" cy="24" r="1.7" fill="#2b2118" stroke="none"/><circle cx="39" cy="24" r="1.7" fill="#2b2118" stroke="none"/><path d="M33 28.5 L39 28.5" fill="none" stroke-width="2"/><path d="M25 17 Q25 6 36 6 Q47 6 47 17 Z" fill="#2f6fd6"/><rect x="23" y="16" width="26" height="4" rx="1.5" fill="#1f4fa3"/><circle cx="36" cy="11.5" r="2.2" fill="#f2b632" stroke="none"/>\'+Ht,Pf=At+Ct+\'<rect x="42" y="14" width="7" height="12"/><rect x="13" y="30" width="38" height="28" rx="1.5"/><path d="M6 32 L32 9 L58 32 Z"/></g>\'+Vh+\'<rect x="42" y="14" width="7" height="12" fill="#2c7f41"/><rect x="13" y="30" width="38" height="28" rx="1.5" fill="#3aa655"/><rect x="28" y="42" width="8" height="16" rx="1" fill="#2c7f41"/><rect x="17" y="36" width="7" height="6" fill="#fffaf0" stroke-width="2"/><path d="M6 32 L32 9 L58 32 Z" fill="#2c7f41"/>\'+Ht,Lf=At+Ct+\'<rect x="8" y="21" width="48" height="37" rx="1.5"/><rect x="4" y="15" width="56" height="8" rx="2"/></g>\'+Vh+\'<rect x="8" y="21" width="48" height="37" rx="1.5" fill="#d9413a"/><rect x="13" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="28" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="43" y="27" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="13" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="28" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="43" y="37" width="8" height="7" rx="1" fill="#fffaf0" stroke-width="2"/><rect x="28" y="47" width="8" height="11" rx="1" fill="#a8302b"/><rect x="4" y="15" width="56" height="8" rx="2" fill="#a8302b"/>\'+Ht,cl="M23 30 L23 21 A9 9 0 0 1 41 21 L41 30",If=At+Ct+\'<path d="\'+cl+\'" fill="none" stroke-width="13"/><rect x="14" y="28" width="36" height="28" rx="4"/></g>\'+zt+\'<path d="\'+cl+\'" fill="none" stroke-width="9"/><path d="\'+cl+\'" fill="none" stroke="#9aa0a6" stroke-width="4.5"/><rect x="14" y="28" width="36" height="28" rx="4" fill="#9aa0a6"/><rect x="16.5" y="49" width="31" height="4.5" rx="1" fill="#6b7177" stroke="none"/><circle cx="32" cy="40" r="4" fill="#2b2118" stroke="none"/><rect x="30" y="41" width="4" height="8" rx="1" fill="#2b2118" stroke="none"/>\'+Ht,Df=At+Ct+\'<rect x="4" y="17" width="56" height="30" rx="2"/></g>\'+zt+\'<rect x="4" y="17" width="56" height="30" rx="2" fill="#5cb85c"/><rect x="6.5" y="43" width="51" height="2.5" fill="#2c7f41" stroke="none"/><rect x="8.5" y="21.5" width="47" height="21" rx="1" fill="none" stroke="#2c7f41" stroke-width="1.5"/><circle cx="12.5" cy="26" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="51.5" cy="26" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="12.5" cy="38" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="51.5" cy="38" r="1.5" fill="#2c7f41" stroke="none"/><circle cx="32" cy="32" r="8.5" fill="#a5dba4"/><path d="M35 28 Q34 26.5 32 26.5 Q29 26.5 29 29.5 Q29 32 32 32 Q35 32 35 34.5 Q35 37.5 32 37.5 Q30 37.5 29 36 M32 24.5 L32 26.5 M32 37.5 L32 39.5" fill="none" stroke-width="2"/>\'+Ht,Bh="M12 26 L33 26 Q40 26 40 33 L40 38 Q40 45 33 45 L12 45 Z",zh="M52 26 L35 26 Q27 26 27 34 L27 37 Q27 45 35 45 L52 45 Z",Nf="M36 28 L45.5 28 Q50 28 50 32 L50 40.5 Q50 44.5 45.5 44.5 L36 44.5 Z",Hh="M20 21 Q20 17.5 24 17.5 L37 20 Q41 21 40 25 Q39 28 35 27.5 L22 27.5 Q20 27 20 25 Z",Gh=At+Ct+\'<rect x="2" y="25" width="12" height="20" rx="2"/><rect x="50" y="25" width="12" height="20" rx="2"/><path d="\'+zh+\'"/><path d="\'+Bh+\'"/><path d="\'+Hh+\'"/></g>\'+zt+\'<rect x="2" y="25" width="12" height="20" rx="2" fill="#5a6a8a"/><rect x="50" y="25" width="12" height="20" rx="2" fill="#8a6a5a"/><path d="\'+zh+\'" fill="#d8a274"/><path d="M44 28 L50.5 28 L50.5 43 L44 43 Z" fill="#c48b5c" stroke="none"/><path d="\'+Bh+\'" fill="#f1c7a4"/><path d="\'+Nf+\'" fill="#f1c7a4"/><path d="M37 33.5 L48.5 33.5 M37 39 L48.5 39" fill="none" stroke-width="2"/><path d="\'+Hh+\'" fill="#d8a274"/>\'+Ht,Uf=At+\'<g transform="rotate(-40 32 34)">\'+Ct+\'<rect x="29" y="22" width="6.5" height="34" rx="2"/><rect x="17" y="8" width="30" height="14" rx="2.5"/></g>\'+zt+\'<rect x="29" y="22" width="6.5" height="34" rx="2" fill="#c9a36b"/><path d="M33.5 26 L33.5 53" fill="none" stroke="#a8844f" stroke-width="1.5"/><rect x="17" y="8" width="30" height="14" rx="2.5" fill="#8a8f94"/><rect x="19" y="17" width="26" height="3.2" fill="#6b7177" stroke="none"/><rect x="41.5" y="10" width="4" height="7" fill="#6b7177" stroke="none"/></g></g></svg>\',hl="M19 12 L45 12 L45 18 L34 32 L45 46 L45 52 L19 52 L19 46 L30 32 L19 18 Z",kf=At+Ct+\'<path d="\'+hl+\'"/><rect x="15" y="6" width="34" height="6" rx="2"/><rect x="15" y="52" width="34" height="6" rx="2"/></g>\'+zt+\'<path d="\'+hl+\'" fill="#e8f4fa" stroke="none"/><path d="M22 22 L42 22 L34 32 L30 32 Z" fill="#f2b632" stroke="none"/><path d="M22.5 42 L41.5 42 L45 46 L45 50.5 L19 50.5 L19 46 Z" fill="#f2b632" stroke="none"/><path d="M32 32 L32 44" fill="none" stroke="#f2b632" stroke-width="2"/><path d="\'+hl+\'" fill="none"/><rect x="15" y="6" width="34" height="6" rx="2" fill="#c9a36b"/><rect x="15" y="52" width="34" height="6" rx="2" fill="#c9a36b"/>\'+Ht,Of=At+Ct+\'<path d="M10 50 L7 20 L22 33 L32 12 L42 33 L57 20 L54 50 Z"/><rect x="9" y="46" width="46" height="9" rx="2"/></g>\'+zt+\'<path d="M10 50 L7 20 L22 33 L32 12 L42 33 L57 20 L54 50 Z" fill="#f2b632"/><path d="M45.5 36 L54.5 27.5 L53.5 46 L45.5 46 Z" fill="#d99a1e" stroke="none"/><rect x="9" y="46" width="46" height="9" rx="2" fill="#d99a1e"/><circle cx="7" cy="20" r="3.2" fill="#d9413a"/><circle cx="57" cy="20" r="3.2" fill="#d9413a"/><circle cx="32" cy="12" r="3.5" fill="#2f6fd6"/><circle cx="32" cy="50.5" r="2.8" fill="#2aa9a0"/>\'+Ht,Fe={go:yf,chance:_f,chest:vf,railroad:bf,electric:Mf,water:Sf,incometax:wf,luxurytax:Ef,jail:Tf,visiting:Af,freeparking:Cf,gotojail:Rf,house:Pf,hotel:Lf,mortgage:If,dollar:Df,handshake:Gh,trade:Gh,hammer:Uf,timer:kf,crown:Of};var hi=\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\',di=\'<g fill="#fffaf0" stroke="#fffaf0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">\',ui=\'<g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">\',fi="</g></svg>",Ff=hi+di+\'<path d="M17 46 L19 13 Q32 9 45 13 L47 46 Z"/><rect x="8" y="45" width="48" height="9" rx="4"/></g>\'+ui+\'<path d="M17 46 L19 13 Q32 9 45 13 L47 46 Z" fill="#8e5bc4"/><path d="M41 14 L43.8 13.4 L45.8 44.8 L42.5 44.8 Z" fill="#6b3f9e" stroke="none"/><rect x="17.5" y="36" width="29" height="6.5" fill="#6b3f9e"/><rect x="8" y="45" width="48" height="9" rx="4" fill="#8e5bc4"/><rect x="11" y="49.5" width="42" height="3" fill="#6b3f9e" stroke="none"/><circle cx="26" cy="25" r="2.2" fill="#2b2118" stroke="none"/><circle cx="38" cy="25" r="2.2" fill="#2b2118" stroke="none"/><circle cx="22.5" cy="29.5" r="1.7" fill="#e8649c" stroke="none"/><path d="M27 30 Q32 34.5 37 30" fill="none"/>\'+fi,Bf=hi+di+\'<path d="M32 8 L32 42"/><path d="M32 8 L42 11 L32 14 Z"/><path d="M29 16 L29 40 L13 40 Z"/><path d="M35 12 L35 40 L55 40 Z"/><path d="M6 42 L58 42 L52 56 L12 56 Z"/></g>\'+ui+\'<path d="M32 8 L32 42" fill="none"/><path d="M29 16 L29 40 L13 40 Z" fill="#fffaf0"/><path d="M27.8 31 L27.8 38.6 L18.6 38.6 Z" fill="#e4dfd3" stroke="none"/><path d="M35 12 L35 40 L55 40 Z" fill="#fffaf0"/><path d="M36.5 26 L44.4 26 L48.4 31.8 L36.5 31.8 Z" fill="#2f6fd6" stroke="none"/><path d="M32 8 L42 11 L32 14 Z" fill="#d9413a"/><path d="M6 42 L58 42 L52 56 L12 56 Z" fill="#2f6fd6"/><path d="M11 51.5 L53 51.5 L51.5 54.6 L12.5 54.6 Z" fill="#1f4fa3" stroke="none"/><circle cx="26" cy="46.5" r="2.2" fill="#2b2118" stroke="none"/><circle cx="38" cy="46.5" r="2.2" fill="#2b2118" stroke="none"/><path d="M27.5 49.5 Q32 53 36.5 49.5" fill="none"/>\'+fi,zf=hi+di+\'<path d="M21 12 Q9 14 12 30 Q17 33 21 26 Z"/><path d="M43 12 Q55 14 52 30 Q47 33 43 26 Z"/><path d="M18 58 L18 42 Q18 33 32 33 Q46 33 46 42 L46 58 Z"/><ellipse cx="25" cy="56" rx="5.5" ry="3.5"/><ellipse cx="39" cy="56" rx="5.5" ry="3.5"/><circle cx="32" cy="22" r="13"/></g>\'+ui+\'<path d="M18 58 L18 42 Q18 33 32 33 Q46 33 46 42 L46 58 Z" fill="#c47a3c"/><path d="M40.5 35 Q44.6 37 44.6 42 L44.6 56.6 L40.5 56.6 Z" fill="#9a5a28" stroke="none"/><ellipse cx="25" cy="56" rx="5.5" ry="3.5" fill="#c47a3c"/><ellipse cx="39" cy="56" rx="5.5" ry="3.5" fill="#c47a3c"/><path d="M21 12 Q9 14 12 30 Q17 33 21 26 Z" fill="#9a5a28"/><path d="M43 12 Q55 14 52 30 Q47 33 43 26 Z" fill="#9a5a28"/><circle cx="32" cy="22" r="13" fill="#c47a3c"/><ellipse cx="32" cy="27" rx="7" ry="5" fill="#e6b07a" stroke="none"/><circle cx="27" cy="19.5" r="2.2" fill="#2b2118" stroke="none"/><circle cx="37" cy="19.5" r="2.2" fill="#2b2118" stroke="none"/><ellipse cx="32" cy="25.5" rx="3" ry="2.2" fill="#2b2118" stroke="none"/><path d="M28.5 29 Q32 32.5 35.5 29" fill="none" stroke-width="2"/>\'+fi,Hf=hi+di+\'<rect x="3" y="24" width="12" height="4" rx="1.5"/><rect x="8" y="27" width="3.5" height="6"/><path d="M4 46 L6 34 L20 31 L26 20 L42 20 L48 31 L60 35 L61 46 Z"/><circle cx="18" cy="46" r="8"/><circle cx="46" cy="46" r="8"/></g>\'+ui+\'<rect x="8" y="27" width="3.5" height="6" fill="#a8302b"/><rect x="3" y="24" width="12" height="4" rx="1.5" fill="#a8302b"/><path d="M4 46 L6 34 L20 31 L26 20 L42 20 L48 31 L60 35 L61 46 Z" fill="#d9413a"/><path d="M6.5 39 L58.6 39 L59.4 44.6 L5.5 44.6 Z" fill="#a8302b" stroke="none"/><path d="M27 23 L40 23 L44 31 L24 31 Z" fill="#bfe3f5"/><circle cx="57.5" cy="37.5" r="2" fill="#f9e27a" stroke="none"/><circle cx="18" cy="46" r="8" fill="#2b2118"/><circle cx="46" cy="46" r="8" fill="#2b2118"/><circle cx="18" cy="46" r="3.5" fill="#fffaf0" stroke="none"/><circle cx="46" cy="46" r="3.5" fill="#fffaf0" stroke="none"/><circle cx="31.5" cy="26" r="1.8" fill="#2b2118" stroke="none"/><circle cx="37" cy="26" r="1.8" fill="#2b2118" stroke="none"/><path d="M31 28.5 Q34.5 31 38 28.5" fill="none" stroke-width="2"/>\'+fi,Gf=hi+di+\'<path d="M43 53 Q56 53 55 41" fill="none" stroke-width="16"/><path d="M14 22 L23 24 M14 27 L23 26.5 M50 22 L41 24 M50 27 L41 26.5" fill="none"/><path d="M21 16 L23.5 4 L31 11 Z"/><path d="M43 16 L40.5 4 L33 11 Z"/><path d="M20 58 L20 44 Q20 35 32 35 Q44 35 44 44 L44 58 Z"/><ellipse cx="26" cy="57" rx="5.5" ry="3.2"/><ellipse cx="38" cy="57" rx="5.5" ry="3.2"/><circle cx="32" cy="22" r="13"/></g>\'+ui+\'<path d="M43 53 Q56 53 55 41" fill="none" stroke-width="9"/><path d="M43 53 Q56 53 55 41" fill="none" stroke="#e8649c" stroke-width="4"/><path d="M20 58 L20 44 Q20 35 32 35 Q44 35 44 44 L44 58 Z" fill="#e8649c"/><path d="M39 37 Q42.6 39 42.6 44 L42.6 56.6 L39 56.6 Z" fill="#c24a7e" stroke="none"/><ellipse cx="26" cy="57" rx="5.5" ry="3.2" fill="#e8649c"/><ellipse cx="38" cy="57" rx="5.5" ry="3.2" fill="#e8649c"/><path d="M21 16 L23.5 4 L31 11 Z" fill="#e8649c"/><path d="M43 16 L40.5 4 L33 11 Z" fill="#e8649c"/><circle cx="32" cy="22" r="13" fill="#e8649c"/><path d="M23.5 11 L24.5 6.5 L28 9.5 Z" fill="#c24a7e" stroke="none"/><path d="M40.5 11 L39.5 6.5 L36 9.5 Z" fill="#c24a7e" stroke="none"/><path d="M14 22 L23 24 M14 27 L23 26.5 M50 22 L41 24 M50 27 L41 26.5" fill="none" stroke-width="2"/><circle cx="27" cy="21" r="2.2" fill="#2b2118" stroke="none"/><circle cx="37" cy="21" r="2.2" fill="#2b2118" stroke="none"/><path d="M30 25.5 L34 25.5 L32 28 Z" fill="#2b2118" stroke="none"/><path d="M29 29 Q30.5 31 32 29 Q33.5 31 35 29" fill="none" stroke-width="2"/>\'+fi,Vf=hi+di+\'<path d="M21 36 L9 52 L21 50 Z"/><path d="M43 36 L55 52 L43 50 Z"/><path d="M25 43 L32 57 L39 43 Z"/><path d="M32 4 Q45 17 43.5 43 L20.5 43 Q19 17 32 4 Z"/></g>\'+ui+\'<path d="M25 43 L32 57 L39 43 Z" fill="#f2b632"/><path d="M28.5 45 L32 53 L35.5 45 Z" fill="#e8842f" stroke="none"/><path d="M21 36 L9 52 L21 50 Z" fill="#1d7f78"/><path d="M43 36 L55 52 L43 50 Z" fill="#1d7f78"/><path d="M32 4 Q45 17 43.5 43 L20.5 43 Q19 17 32 4 Z" fill="#2aa9a0"/><path d="M38 25 L41.3 25 L42.3 41.5 L38 41.5 Z" fill="#1d7f78" stroke="none"/><path d="M32 4 Q40 12 42 22 L22 22 Q24 12 32 4 Z" fill="#1d7f78"/><circle cx="32" cy="31" r="6.5" fill="#bfe3f5"/><circle cx="29.5" cy="30" r="1.6" fill="#2b2118" stroke="none"/><circle cx="34.5" cy="30" r="1.6" fill="#2b2118" stroke="none"/><path d="M29.5 33 Q32 35 34.5 33" fill="none" stroke-width="2"/>\'+fi,Wf=hi+di+\'<path d="M12 40 L5 32 L20 35 Z"/><path d="M9 47 Q9 34 24 34 L40 34 Q57 34 57 47 Q57 58 42 58 L22 58 Q9 58 9 47 Z"/><path d="M32 16 L50 21 L32 27.5 Z"/><circle cx="23" cy="22" r="12"/></g>\'+ui+\'<path d="M12 40 L5 32 L20 35 Z" fill="#f2b632"/><path d="M9 47 Q9 34 24 34 L40 34 Q57 34 57 47 Q57 58 42 58 L22 58 Q9 58 9 47 Z" fill="#f2b632"/><path d="M12 52 L54 52 Q51.5 56.6 42 56.6 L22 56.6 Q13 56.6 12 52 Z" fill="#d99a1e" stroke="none"/><path d="M27 41 Q40 35 50 44 Q40 52 27 46 Z" fill="#d99a1e"/><path d="M32 16 L50 21 L32 27.5 Z" fill="#e8842f"/><path d="M37 21.6 L47.5 21.2" fill="none" stroke-width="1.6"/><circle cx="23" cy="22" r="12" fill="#f2b632"/><circle cx="21" cy="19" r="2.2" fill="#2b2118" stroke="none"/><circle cx="28" cy="19" r="2.2" fill="#2b2118" stroke="none"/><circle cx="17.5" cy="24.5" r="1.8" fill="#f5a3a3" stroke="none"/>\'+fi,Xf=hi+di+\'<path d="M32 12 L32 8"/><circle cx="32" cy="7" r="2.6"/><rect x="14" y="19" width="4" height="8" rx="1"/><rect x="46" y="19" width="4" height="8" rx="1"/><rect x="18" y="13" width="28" height="20" rx="3"/><rect x="28" y="33" width="8" height="3"/><rect x="8" y="37" width="6" height="14" rx="2"/><rect x="50" y="37" width="6" height="14" rx="2"/><rect x="16" y="35" width="32" height="18" rx="2.5"/><rect x="20" y="53" width="9" height="7" rx="1.5"/><rect x="35" y="53" width="9" height="7" rx="1.5"/></g>\'+ui+\'<path d="M32 12 L32 8" fill="none"/><circle cx="32" cy="7" r="2.6" fill="#d9413a"/><rect x="14" y="19" width="4" height="8" rx="1" fill="#2c7f41"/><rect x="46" y="19" width="4" height="8" rx="1" fill="#2c7f41"/><rect x="28" y="33" width="8" height="3" fill="#2c7f41"/><rect x="8" y="37" width="6" height="14" rx="2" fill="#3aa655"/><rect x="50" y="37" width="6" height="14" rx="2" fill="#3aa655"/><rect x="20" y="53" width="9" height="7" rx="1.5" fill="#2c7f41"/><rect x="35" y="53" width="9" height="7" rx="1.5" fill="#2c7f41"/><rect x="16" y="35" width="32" height="18" rx="2.5" fill="#3aa655"/><rect x="43" y="37" width="3.5" height="14.5" fill="#2c7f41" stroke="none"/><rect x="24" y="39" width="16" height="10" rx="1.5" fill="#2c7f41"/><circle cx="28" cy="44" r="1.7" fill="#f2b632" stroke="none"/><circle cx="32" cy="44" r="1.7" fill="#d9413a" stroke="none"/><circle cx="36" cy="44" r="1.7" fill="#bfe3f5" stroke="none"/><rect x="18" y="13" width="28" height="20" rx="3" fill="#3aa655"/><circle cx="26" cy="22" r="3.2" fill="#fffaf0"/><circle cx="38" cy="22" r="3.2" fill="#fffaf0"/><circle cx="26" cy="22" r="1.5" fill="#2b2118" stroke="none"/><circle cx="38" cy="22" r="1.5" fill="#2b2118" stroke="none"/><path d="M27 28 Q32 31 37 28" fill="none" stroke-width="2"/>\'+fi,dl=[{id:"hat",name:"Top Hat",color:"#8e5bc4",svg:Ff},{id:"boat",name:"Sailboat",color:"#2f6fd6",svg:Bf},{id:"dog",name:"Dog",color:"#c47a3c",svg:zf},{id:"car",name:"Race Car",color:"#d9413a",svg:Hf},{id:"cat",name:"Cat",color:"#e8649c",svg:Gf},{id:"rocket",name:"Rocket",color:"#2aa9a0",svg:Vf},{id:"duck",name:"Rubber Duck",color:"#f2b632",svg:Wf},{id:"robot",name:"Robot",color:"#3aa655",svg:Xf}];var ki=[{id:"hat",name:"Top Hat",color:"#8e5bc4"},{id:"boat",name:"Sailboat",color:"#2f6fd6"},{id:"dog",name:"Dog",color:"#c47a3c"},{id:"car",name:"Race Car",color:"#d9413a"},{id:"cat",name:"Cat",color:"#e8649c"},{id:"rocket",name:"Rocket",color:"#2aa9a0"},{id:"duck",name:"Rubber Duck",color:"#f2b632"},{id:"robot",name:"Robot",color:"#3aa655"}],O_=Object.fromEntries(ki.map(i=>[i.id,i]));function Mn(i){return dl.find(e=>e.id===i)?.svg??dl[0].svg}function Wh(i,e,t=""){_t(i);let n=dh(),s=ki.some(b=>b.id===n.token)?n.token:"hat",r=v("input",{class:"input",placeholder:"Your name",maxLength:16,value:n.name,autocomplete:"off"}),a=v("input",{class:"input input--code",placeholder:"CODE",maxLength:4,value:t,autocomplete:"off",spellcheck:!1}),o=v("div",{class:"token-grid"}),l=new Map;for(let b of ki){let m=v("button",{class:"token-pick",type:"button",title:b.name,onClick:()=>c(b.id)},v("span",{html:Mn(b.id)}),v("span",{class:"name"},b.name));l.set(b.id,m),o.appendChild(m)}function c(b){s=b;for(let[m,p]of l)p.classList.toggle("is-selected",m===b)}c(s);function h(){let b=r.value.trim()||"Player";return hh(b,s),b}let u=v("button",{class:"btn btn--primary btn--lg",type:"button",onClick:()=>e.onCreate(h(),s)},"Create a room"),d=v("button",{class:"btn btn--blue",type:"button",onClick:()=>f()},"Join");function f(){let b=a.value.trim().toUpperCase();if(b.length!==4){a.focus(),a.classList.add("shake");return}e.onJoin(b,h(),s)}a.addEventListener("keydown",b=>{b.key==="Enter"&&f()});let x=v("div",{class:"home paper paper--tilt-l"},v("h1",{class:"title-art"},v("span",null,"PAPER"),v("span",null,"TYCOON")),v("p",{class:"subtitle hand"},"Buy streets, build houses, bankrupt your friends. All out of paper."),v("div",{class:"field"},v("label",null,"Your name"),r),v("div",{class:"field"},v("label",null,"Pick a token"),o),v("div",{style:{textAlign:"center",marginTop:"6px"}},u),v("div",{class:"or"},"\\u2014 or join a friend \\u2014"),v("div",{class:"row"},v("div",{class:"field",style:{marginBottom:"0"}},v("label",null,"Room code"),a),d));i.appendChild(v("div",{class:"screen-center"},x)),r.focus()}var rs={brown:"#8b4a2b",lightblue:"#7ec8e3",pink:"#d94f9a",orange:"#ef8a2b",red:"#d9413a",yellow:"#f2c94c",green:"#3aa655",darkblue:"#2f4fa8",railroad:"#2b2118",utility:"#9aa0a6"},Xr=new Set(["lightblue","yellow","utility"]);function Kn(i){return i.type==="property"&&i.group?rs[i.group]:i.type==="railroad"?rs.railroad:i.type==="utility"?rs.utility:"#bbb"}function pi(i){return i<=10?"bottom":i<=20?"left":i<=30?"top":"right"}function qf(i){let e,t;return i<=10?(e=11-i,t=11):i<20?(e=1,t=21-i):i===20?(e=1,t=1):i<30?(e=i-19,t=1):i===30?(e=11,t=1):(e=11,t=i-29),`${t} / ${e} / ${t+1} / ${e+1}`}function Yf(i){switch(i.type){case"go":return Fe.go;case"chance":return Fe.chance;case"chest":return Fe.chest;case"railroad":return Fe.railroad;case"utility":return/water/i.test(i.name)?Fe.water:Fe.electric;case"tax":return/luxury/i.test(i.name)?Fe.luxurytax:Fe.incometax;case"jail":return Fe.jail;case"freeparking":return Fe.freeparking;case"gotojail":return Fe.gotojail;default:return null}}var Xh=[[0,.05],[-.3,-.18],[.3,-.18],[-.3,.28],[.3,.28],[0,-.32],[-.32,.05],[.32,.05]],Wr=class{constructor(e){X(this,"wrap");X(this,"board");X(this,"spaces",[]);X(this,"tokens",new Map);X(this,"tokenPos",new Map);X(this,"facing",new Map);X(this,"dice",[]);X(this,"banner");X(this,"bannerWho");X(this,"pot");X(this,"onSpaceClick");X(this,"state",null);X(this,"ro");this.onSpaceClick=e,this.board=v("div",{class:"board"}),this.wrap=v("div",{class:"board-wrap"},this.board),this.bannerWho=v("span",{class:"who"}),this.banner=v("div",{class:"turn-banner paper paper--flat"},this.bannerWho,v("span",null,"\'s turn")),this.pot=v("div",{class:"pot paper paper--flat hidden"}),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(this.wrap)}destroy(){this.ro.disconnect(),this.wrap.remove()}build(e){this.state=e,_t(this.board),this.spaces.length=0;for(let r of e.board){let a=pi(r.index),o=r.index%10===0,l=v("div",{class:`space space--${a} ${o?"space--corner":""} ${r.type==="property"?"space--property":""}`,style:{gridArea:qf(r.index)},dataset:{index:String(r.index)},title:r.name,onClick:()=>this.onSpaceClick(r.index)});r.type==="property"&&l.appendChild(v("div",{class:"band",style:{"--band":Kn(r)}}));let c=v("div",{class:"content"}),h=Yf(r);h&&c.appendChild(v("span",{class:"sicon",html:h}));let u=r.type==="chest"?"Community Chest":r.type==="jail"?"Jail":r.name;c.appendChild(v("div",{class:"sname"},u)),r.price&&c.appendChild(v("div",{class:"sprice"},`$${r.price}`)),r.type==="tax"&&c.appendChild(v("div",{class:"sprice"},`Pay $${r.amount}`)),l.appendChild(c),l.appendChild(v("div",{class:"houses"})),this.board.appendChild(l),this.spaces[r.index]=l}let t=v("div",{class:"deck deck--chance"},v("span",{html:Fe.chance}),"CHANCE"),n=v("div",{class:"deck deck--chest"},v("span",{html:Fe.chest}),v("span",null,"COMMUNITY"),v("span",null,"CHEST"));this.dice=[v("div",{class:"die",html:Gn(1)}),v("div",{class:"die",html:Gn(1)})];let s=v("div",{class:"center"},v("div",{class:"logo title-art"},"PAPER",v("span",{class:"small"},"TYCOON")),v("div",{class:"middle"},t,v("div",{class:"dice-area"},v("div",{class:"dice"},...this.dice)),n),v("div",{class:"bottom"},this.banner,this.pot));this.board.appendChild(s);for(let r of this.tokens.values())r.remove();this.tokens.clear(),this.tokenPos.clear();for(let r of e.players){let a=v("div",{class:"token",style:{"--tcolor":r.color}},v("div",{class:"flip",html:Mn(r.token)}),v("span",{class:"badge hidden",html:Fe.jail}));this.board.appendChild(a),this.tokens.set(r.id,a),this.tokenPos.set(r.id,r.position),this.facing.set(r.id,"left")}this.resize(),this.updateStatic(e),this.placeTokens(e,!1),e.dice&&this.showDice(e.dice,!1)}resize(){let e=this.wrap.clientWidth||600;this.board.style.fontSize=`${(e/100).toFixed(2)}px`,this.state&&this.placeTokens(this.state,!1)}updateStatic(e){this.state=e;let t=new Map(e.players.map(s=>[s.id,s]));for(let s of e.board){let r=this.spaces[s.index];if(!r)continue;let a=e.properties[s.index];r.querySelector(".owner")?.remove();let o=r.querySelector(".houses");if(_t(o),r.classList.toggle("is-mortgaged",!!a?.mortgaged),a?.owner){let l=t.get(a.owner);if(r.appendChild(v("span",{class:"owner",style:{"--owner":l?.color??"#999"},title:l?.name??""})),a.houses===5)o.appendChild(v("span",{class:"hotel",html:Fe.hotel}));else for(let c=0;c<a.houses;c++)o.appendChild(v("span",{html:Fe.house}));o.querySelectorAll("span").forEach(c=>{let h=c.querySelector("svg");h&&c.classList.contains("hotel")&&h.classList.add("hotel")})}}let n=e.players[e.currentPlayer];if(n&&(this.bannerWho.textContent=n.name,this.banner.style.setProperty("--who",n.color)),e.phase==="ended"&&e.winner){let s=t.get(e.winner);this.bannerWho.textContent=s?.name??"",this.banner.lastChild.textContent=" wins!"}this.pot.classList.toggle("hidden",!e.config.freeParkingJackpot),this.pot.textContent=`Free Parking pot: $${e.freeParkingPot}`;for(let s of e.players){let r=this.tokens.get(s.id);r&&(r.classList.toggle("is-current",e.players[e.currentPlayer]?.id===s.id&&e.phase!=="ended"),r.classList.toggle("is-bankrupt",s.bankrupt),r.querySelector(".badge")?.classList.toggle("hidden",!s.inJail))}}slotsAt(e,t){return t.players.filter(n=>!n.bankrupt&&(this.tokenPos.get(n.id)??n.position)===e).map(n=>n.id)}coordsFor(e,t){let n=this.spaces[e],s=parseFloat(this.board.style.fontSize)||6,[r,a]=Xh[t%Xh.length],o=n.offsetWidth,l=n.offsetHeight,c=n.offsetLeft+o/2+r*Math.min(o,9*s),h=n.offsetTop+l/2+a*Math.min(l,9*s),u=pi(e),d=e%10===0?0:.6*s;return{left:c+(u==="left"?-d:u==="right"?d:0),top:h+(u==="bottom"?d:u==="top"?-d:0)}}placeTokens(e,t){for(let n of e.players)this.tokenPos.set(n.id,n.position);for(let n of e.players){let s=this.tokens.get(n.id);if(!s)continue;let r=this.slotsAt(n.position,e),a=Math.max(0,r.indexOf(n.id)),o=this.coordsFor(n.position,a);t||(s.style.transition="none"),s.style.left=`${o.left}px`,s.style.top=`${o.top}px`,t||(s.offsetWidth,s.style.transition="")}}setFacing(e,t){let n=this.tokens.get(e);n&&(this.facing.set(e,t),n.classList.toggle("face-left",t==="left"),n.style.setProperty("--sx",t==="left"?"-1":"1"))}async moveToken(e,t,n,s,r){let a=this.tokens.get(e);if(!a)return;if(s.direct){this.tokenPos.set(e,n),a.classList.add("is-hop"),await Bt(120);let u=Math.max(0,this.slotsAt(n,r).indexOf(e)),d=this.coordsFor(n,u);a.style.transition="left 0.5s cubic-bezier(.3,1.4,.5,1), top 0.5s cubic-bezier(.3,1.4,.5,1)",a.style.left=`${d.left}px`,a.style.top=`${d.top}px`,await Bt(520),a.style.transition="",a.classList.remove("is-hop");return}let o=s.backward??(t-n+40)%40===3,l=o?(t-n+40)%40:(n-t+40)%40,c=l>12?95:170,h=t;for(let u=0;u<l;u++){h=o?(h+39)%40:(h+1)%40;let d=pi(h),f=o?d==="bottom"?"right":d==="left"||d==="top"?"left":"right":d==="bottom"?"left":d==="left"||d==="top"?"right":"left";this.facing.get(e)!==f&&this.setFacing(e,f),this.tokenPos.set(e,h);let x=h===n?Math.max(0,this.slotsAt(h,r).indexOf(e)):0,b=this.coordsFor(h,x);a.style.transitionDuration=`${c}ms, ${c}ms`,a.style.left=`${b.left}px`,a.style.top=`${b.top}px`,a.classList.remove("is-hop"),a.offsetWidth,a.classList.add("is-hop"),Mt.step(),await Bt(c)}a.style.transitionDuration="",a.classList.remove("is-hop"),this.placeTokens({...r,players:r.players.map(u=>u.id===e?{...u,position:n}:{...u,position:this.tokenPos.get(u.id)??u.position})},!0),this.flash(n)}flash(e){let t=this.spaces[e];t&&(t.classList.remove("is-landing"),t.offsetWidth,t.classList.add("is-landing"))}highlight(e){this.spaces.forEach((t,n)=>t.classList.toggle("is-highlight",n===e))}async showDice(e,t){if(t){Mt.dice();for(let n of this.dice)n.classList.remove("is-rolling"),n.offsetWidth,n.classList.add("is-rolling");await Bt(450)}if(this.dice[0].innerHTML=Gn(e[0]),this.dice[1].innerHTML=Gn(e[1]),t){await Bt(600);for(let n of this.dice)n.classList.remove("is-rolling")}}};var Ci={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ri={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},gd=0,Hl=1,xd=2;var Wi=1,yd=2,Ds=3,Pi=0,Lt=1,_n=2,qn=0,Ns=1,Gl=2,Vl=3,Wl=4,_d=5;var Xi=100,vd=101,bd=102,Md=103,Sd=104,wd=200,Ed=201,Td=202,Ad=203,Xl=204,ql=205,Cd=206,Rd=207,Pd=208,Ld=209,Id=210,Dd=211,Nd=212,Ud=213,kd=214,fa=0,pa=1,ma=2,bs=3,ga=4,xa=5,ya=6,_a=7,Wa=0,Od=1,Fd=2,Un=0,Yl=1,Zl=2,$l=3,Jl=4,jl=5,Kl=6,Ql=7;var ec=300,Li=301,qi=302,Xa=303,qa=304,Mr=306,Ms=1e3,Wn=1001,va=1002,Vt=1003,Bd=1004;var Sr=1005;var Xt=1006,Ya=1007;var Ii=1008;var dn=1009,tc=1010,nc=1011,Us=1012,Za=1013,kn=1014,On=1015,Fn=1016,$a=1017,Ja=1018,ks=1020,ic=35902,sc=35899,rc=1021,ac=1022,An=1023,Xn=1026,Di=1027,oc=1028,ja=1029,Ni=1030,Ka=1031;var Qa=1033,wr=33776,Er=33777,Tr=33778,Ar=33779,eo=35840,to=35841,no=35842,io=35843,so=36196,ro=37492,ao=37496,oo=37488,lo=37489,Cr=37490,co=37491,ho=37808,uo=37809,fo=37810,po=37811,mo=37812,go=37813,xo=37814,yo=37815,_o=37816,vo=37817,bo=37818,Mo=37819,So=37820,wo=37821,Eo=36492,To=36494,Ao=36495,Co=36283,Ro=36284,Rr=36285,Po=36286;var tr=2300,ba=2301,da=2302,Dl=2303,Nl=2400,Ul=2401,kl=2402;var zd=3200;var Lo=0,Hd=1,ri="",Nt="srgb",nr="srgb-linear",ir="linear",tt="srgb";var ua=7680;var Gd=519,Vd=512,Wd=513,Xd=514,Io=515,qd=516,Yd=517,Do=518,Zd=519,$d=35044;var lc="300 es",In=2e3,Ss=2001;function Zf(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function $f(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function sr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Jd(){let i=sr("canvas");return i.style.display="block",i}var qh={},ws=null;function cc(...i){let e="THREE."+i.shift();ws?ws("log",e,...i):console.log(e,...i)}function jd(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]=\'Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.\'}return i}function Le(...i){i=jd(i);let e="THREE."+i.shift();if(ws)ws("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Ie(...i){i=jd(i);let e="THREE."+i.shift();if(ws)ws("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Hi(...i){let e=i.join(" ");e in qh||(qh[e]=!0,Le(...i))}function Kd(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var Qd={[fa]:pa,[ma]:ya,[ga]:_a,[bs]:xa,[pa]:fa,[ya]:ma,[_a]:ga,[xa]:bs},Dn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},Zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Yh=1234567,Qs=Math.PI/180,Es=180/Math.PI;function Os(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Zt[i&255]+Zt[i>>8&255]+Zt[i>>16&255]+Zt[i>>24&255]+"-"+Zt[e&255]+Zt[e>>8&255]+"-"+Zt[e>>16&15|64]+Zt[e>>24&255]+"-"+Zt[t&63|128]+Zt[t>>8&255]+"-"+Zt[t>>16&255]+Zt[t>>24&255]+Zt[n&255]+Zt[n>>8&255]+Zt[n>>16&255]+Zt[n>>24&255]).toLowerCase()}function Ve(i,e,t){return Math.max(e,Math.min(t,i))}function hc(i,e){return(i%e+e)%e}function Jf(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function jf(i,e,t){return i!==e?(t-i)/(e-i):0}function er(i,e,t){return(1-t)*i+t*e}function Kf(i,e,t,n){return er(i,e,1-Math.exp(-t*n))}function Qf(i,e=1){return e-Math.abs(hc(i,e*2)-e)}function ep(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function tp(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function np(i,e){return i+Math.floor(Math.random()*(e-i+1))}function ip(i,e){return i+Math.random()*(e-i)}function sp(i){return i*(.5-Math.random())}function rp(i){i!==void 0&&(Yh=i);let e=Yh+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function ap(i){return i*Qs}function op(i){return i*Es}function lp(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function cp(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function hp(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function dp(i,e,t,n,s){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),f=r((n-e)/2),x=a((n-e)/2);switch(s){case"XYX":i.set(o*h,l*u,l*d,o*c);break;case"YZY":i.set(l*d,o*h,l*u,o*c);break;case"ZXZ":i.set(l*u,l*d,o*h,o*c);break;case"XZX":i.set(o*h,l*x,l*f,o*c);break;case"YXY":i.set(l*f,o*h,l*x,o*c);break;case"ZYZ":i.set(l*x,l*f,o*h,o*c);break;default:Le("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function _s(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function rn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Fs={DEG2RAD:Qs,RAD2DEG:Es,generateUUID:Os,clamp:Ve,euclideanModulo:hc,mapLinear:Jf,inverseLerp:jf,lerp:er,damp:Kf,pingpong:Qf,smoothstep:ep,smootherstep:tp,randInt:np,randFloat:ip,randFloatSpread:sp,seededRandom:rp,degToRad:ap,radToDeg:op,isPowerOfTwo:lp,ceilPowerOfTwo:cp,floorPowerOfTwo:hp,setQuaternionFromProperEuler:dp,normalize:rn,denormalize:_s},mc=class mc{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ve(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};mc.prototype.isVector2=!0;var Re=mc,jt=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],d=r[a+0],f=r[a+1],x=r[a+2],b=r[a+3];if(u!==b||l!==d||c!==f||h!==x){let m=l*d+c*f+h*x+u*b;m<0&&(d=-d,f=-f,x=-x,b=-b,m=-m);let p=1-o;if(m<.9995){let A=Math.acos(m),R=Math.sin(A);p=Math.sin(p*A)/R,o=Math.sin(o*A)/R,l=l*p+d*o,c=c*p+f*o,h=h*p+x*o,u=u*p+b*o}else{l=l*p+d*o,c=c*p+f*o,h=h*p+x*o,u=u*p+b*o;let A=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=A,c*=A,h*=A,u*=A}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[a],d=r[a+1],f=r[a+2],x=r[a+3];return e[t]=o*x+h*u+l*f-c*d,e[t+1]=l*x+h*d+c*u-o*f,e[t+2]=c*x+h*f+o*d-l*u,e[t+3]=h*x-o*u-l*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),u=o(r/2),d=l(n/2),f=l(s/2),x=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*f*x,this._y=c*f*u-d*h*x,this._z=c*h*x+d*f*u,this._w=c*h*u-d*f*x;break;case"YXZ":this._x=d*h*u+c*f*x,this._y=c*f*u-d*h*x,this._z=c*h*x-d*f*u,this._w=c*h*u+d*f*x;break;case"ZXY":this._x=d*h*u-c*f*x,this._y=c*f*u+d*h*x,this._z=c*h*x+d*f*u,this._w=c*h*u-d*f*x;break;case"ZYX":this._x=d*h*u-c*f*x,this._y=c*f*u+d*h*x,this._z=c*h*x-d*f*u,this._w=c*h*u+d*f*x;break;case"YZX":this._x=d*h*u+c*f*x,this._y=c*f*u+d*h*x,this._z=c*h*x-d*f*u,this._w=c*h*u-d*f*x;break;case"XZY":this._x=d*h*u-c*f*x,this._y=c*f*u-d*h*x,this._z=c*h*x+d*f*u,this._w=c*h*u+d*f*x;break;default:Le("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(n>o&&n>u){let f=2*Math.sqrt(1+n-o-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>u){let f=2*Math.sqrt(1+o-n-u);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+u-n-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ve(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},gc=class gc{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Zh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Zh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),h=2*(o*t-r*s),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=s+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ul.copy(this).projectOnVector(e),this.sub(ul)}reflect(e){return this.sub(ul.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Ve(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};gc.prototype.isVector3=!0;var k=gc,ul=new k,Zh=new jt,xc=class xc{constructor(e,t,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],x=n[8],b=s[0],m=s[3],p=s[6],A=s[1],R=s[4],M=s[7],S=s[2],w=s[5],C=s[8];return r[0]=a*b+o*A+l*S,r[3]=a*m+o*R+l*w,r[6]=a*p+o*M+l*C,r[1]=c*b+h*A+u*S,r[4]=c*m+h*R+u*w,r[7]=c*p+h*M+u*C,r[2]=d*b+f*A+x*S,r[5]=d*m+f*R+x*w,r[8]=d*p+f*M+x*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,f=c*r-a*l,x=t*u+n*d+s*f;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/x;return e[0]=u*b,e[1]=(s*c-h*n)*b,e[2]=(o*n-s*a)*b,e[3]=d*b,e[4]=(h*t-s*l)*b,e[5]=(s*r-o*t)*b,e[6]=f*b,e[7]=(n*l-c*t)*b,e[8]=(a*t-n*r)*b,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Hi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(fl.makeScale(e,t)),this}rotate(e){return Hi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(fl.makeRotation(-e)),this}translate(e,t){return Hi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(fl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};xc.prototype.isMatrix3=!0;var Ue=xc,fl=new Ue,$h=new Ue().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Jh=new Ue().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function up(){let i={enabled:!0,workingColorSpace:nr,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===tt&&(s.r=si(s.r),s.g=si(s.g),s.b=si(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===tt&&(s.r=vs(s.r),s.g=vs(s.g),s.b=vs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===ri?ir:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Hi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Hi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[nr]:{primaries:e,whitePoint:n,transfer:ir,toXYZ:$h,fromXYZ:Jh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Nt},outputColorSpaceConfig:{drawingBufferColorSpace:Nt}},[Nt]:{primaries:e,whitePoint:n,transfer:tt,toXYZ:$h,fromXYZ:Jh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Nt}}}),i}var Ye=up();function si(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function vs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var as,Ma=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{as===void 0&&(as=sr("canvas")),as.width=e.width,as.height=e.height;let s=as.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=as}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=sr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=si(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(si(t[n]/255)*255):t[n]=si(t[n]);return{data:t,width:e.width,height:e.height}}else return Le("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},fp=0,Ts=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:fp++}),this.uuid=Os(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(pl(s[a].image)):r.push(pl(s[a]))}else r=pl(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function pl(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ma.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Le("Texture: Unable to serialize Texture."),{})}var pp=0,ml=new k,on=class i extends Dn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Wn,s=Wn,r=Xt,a=Ii,o=An,l=dn,c=i.DEFAULT_ANISOTROPY,h=ri){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:pp++}),this.uuid=Os(),this.name="",this.source=new Ts(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Re(0,0),this.repeat=new Re(1,1),this.center=new Re(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ml).x}get height(){return this.source.getSize(ml).y}get depth(){return this.source.getSize(ml).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Le(`Texture.setValues(): parameter \'${t}\' has value of undefined.`);continue}let s=this[t];if(s===void 0){Le(`Texture.setValues(): property \'${t}\' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ec)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ms:e.x=e.x-Math.floor(e.x);break;case Wn:e.x=e.x<0?0:1;break;case va:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Ms:e.y=e.y-Math.floor(e.y);break;case Wn:e.y=e.y<0?0:1;break;case va:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};on.DEFAULT_IMAGE=null;on.DEFAULT_MAPPING=ec;on.DEFAULT_ANISOTROPY=1;var yc=class yc{constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],x=l[9],b=l[2],m=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-b)<.01&&Math.abs(x-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+b)<.1&&Math.abs(x+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let R=(c+1)/2,M=(f+1)/2,S=(p+1)/2,w=(h+d)/4,C=(u+b)/4,y=(x+m)/4;return R>M&&R>S?R<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(R),s=w/n,r=C/n):M>S?M<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(M),n=w/s,r=y/s):S<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(S),n=C/r,s=y/r),this.set(n,s,r,t),this}let A=Math.sqrt((m-x)*(m-x)+(u-b)*(u-b)+(d-h)*(d-h));return Math.abs(A)<.001&&(A=1),this.x=(m-x)/A,this.y=(u-b)/A,this.z=(d-h)/A,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ve(this.x,e.x,t.x),this.y=Ve(this.y,e.y,t.y),this.z=Ve(this.z,e.z,t.z),this.w=Ve(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ve(this.x,e,t),this.y=Ve(this.y,e,t),this.z=Ve(this.z,e,t),this.w=Ve(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Ve(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};yc.prototype.isVector4=!0;var xt=yc,Sa=class extends Dn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Xt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new xt(0,0,e,t),this.scissorTest=!1,this.viewport=new xt(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:n.depth},r=new on(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Xt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ts(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},hn=class extends Sa{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},rr=class extends on{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Vt,this.minFilter=Vt,this.wrapR=Wn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var wa=class extends on{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Vt,this.minFilter=Vt,this.wrapR=Wn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Va=class Va{constructor(e,t,n,s,r,a,o,l,c,h,u,d,f,x,b,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,h,u,d,f,x,b,m)}set(e,t,n,s,r,a,o,l,c,h,u,d,f,x,b,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=x,p[11]=b,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Va().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/os.setFromMatrixColumn(e,0).length(),r=1/os.setFromMatrixColumn(e,1).length(),a=1/os.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*h,f=a*u,x=o*h,b=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=f+x*c,t[5]=d-b*c,t[9]=-o*l,t[2]=b-d*c,t[6]=x+f*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,f=l*u,x=c*h,b=c*u;t[0]=d+b*o,t[4]=x*o-f,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=f*o-x,t[6]=b+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,f=l*u,x=c*h,b=c*u;t[0]=d-b*o,t[4]=-a*u,t[8]=x+f*o,t[1]=f+x*o,t[5]=a*h,t[9]=b-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,f=a*u,x=o*h,b=o*u;t[0]=l*h,t[4]=x*c-f,t[8]=d*c+b,t[1]=l*u,t[5]=b*c+d,t[9]=f*c-x,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,f=a*c,x=o*l,b=o*c;t[0]=l*h,t[4]=b-d*u,t[8]=x*u+f,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=f*u+x,t[10]=d-b*u}else if(e.order==="XZY"){let d=a*l,f=a*c,x=o*l,b=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+b,t[5]=a*h,t[9]=f*u-x,t[2]=x*u-f,t[6]=o*h,t[10]=b*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(mp,e,gp)}lookAt(e,t,n){let s=this.elements;return pn.subVectors(e,t),pn.lengthSq()===0&&(pn.z=1),pn.normalize(),mi.crossVectors(n,pn),mi.lengthSq()===0&&(Math.abs(n.z)===1?pn.x+=1e-4:pn.z+=1e-4,pn.normalize(),mi.crossVectors(n,pn)),mi.normalize(),qr.crossVectors(pn,mi),s[0]=mi.x,s[4]=qr.x,s[8]=pn.x,s[1]=mi.y,s[5]=qr.y,s[9]=pn.y,s[2]=mi.z,s[6]=qr.z,s[10]=pn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],x=n[2],b=n[6],m=n[10],p=n[14],A=n[3],R=n[7],M=n[11],S=n[15],w=s[0],C=s[4],y=s[8],T=s[12],L=s[1],U=s[5],F=s[9],G=s[13],D=s[2],V=s[6],J=s[10],j=s[14],se=s[3],Y=s[7],te=s[11],ie=s[15];return r[0]=a*w+o*L+l*D+c*se,r[4]=a*C+o*U+l*V+c*Y,r[8]=a*y+o*F+l*J+c*te,r[12]=a*T+o*G+l*j+c*ie,r[1]=h*w+u*L+d*D+f*se,r[5]=h*C+u*U+d*V+f*Y,r[9]=h*y+u*F+d*J+f*te,r[13]=h*T+u*G+d*j+f*ie,r[2]=x*w+b*L+m*D+p*se,r[6]=x*C+b*U+m*V+p*Y,r[10]=x*y+b*F+m*J+p*te,r[14]=x*T+b*G+m*j+p*ie,r[3]=A*w+R*L+M*D+S*se,r[7]=A*C+R*U+M*V+S*Y,r[11]=A*y+R*F+M*J+S*te,r[15]=A*T+R*G+M*j+S*ie,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],f=e[14],x=e[3],b=e[7],m=e[11],p=e[15],A=l*f-c*d,R=o*f-c*u,M=o*d-l*u,S=a*f-c*h,w=a*d-l*h,C=a*u-o*h;return t*(b*A-m*R+p*M)-n*(x*A-m*S+p*w)+s*(x*R-b*S+p*C)-r*(x*M-b*w+m*C)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],f=e[11],x=e[12],b=e[13],m=e[14],p=e[15],A=t*o-n*a,R=t*l-s*a,M=t*c-r*a,S=n*l-s*o,w=n*c-r*o,C=s*c-r*l,y=h*b-u*x,T=h*m-d*x,L=h*p-f*x,U=u*m-d*b,F=u*p-f*b,G=d*p-f*m,D=A*G-R*F+M*U+S*L-w*T+C*y;if(D===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let V=1/D;return e[0]=(o*G-l*F+c*U)*V,e[1]=(s*F-n*G-r*U)*V,e[2]=(b*C-m*w+p*S)*V,e[3]=(d*w-u*C-f*S)*V,e[4]=(l*L-a*G-c*T)*V,e[5]=(t*G-s*L+r*T)*V,e[6]=(m*M-x*C-p*R)*V,e[7]=(h*C-d*M+f*R)*V,e[8]=(a*F-o*L+c*y)*V,e[9]=(n*L-t*F-r*y)*V,e[10]=(x*w-b*M+p*A)*V,e[11]=(u*M-h*w-f*A)*V,e[12]=(o*T-a*U-l*y)*V,e[13]=(t*U-n*T+s*y)*V,e[14]=(b*R-x*S-m*A)*V,e[15]=(h*S-u*R+d*A)*V,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,f=r*h,x=r*u,b=a*h,m=a*u,p=o*u,A=l*c,R=l*h,M=l*u,S=n.x,w=n.y,C=n.z;return s[0]=(1-(b+p))*S,s[1]=(f+M)*S,s[2]=(x-R)*S,s[3]=0,s[4]=(f-M)*w,s[5]=(1-(d+p))*w,s[6]=(m+A)*w,s[7]=0,s[8]=(x+R)*C,s[9]=(m-A)*C,s[10]=(1-(d+b))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=os.set(s[0],s[1],s[2]).length(),o=os.set(s[4],s[5],s[6]).length(),l=os.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Rn.copy(this);let c=1/a,h=1/o,u=1/l;return Rn.elements[0]*=c,Rn.elements[1]*=c,Rn.elements[2]*=c,Rn.elements[4]*=h,Rn.elements[5]*=h,Rn.elements[6]*=h,Rn.elements[8]*=u,Rn.elements[9]*=u,Rn.elements[10]*=u,t.setFromRotationMatrix(Rn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,s,r,a,o=In,l=!1){let c=this.elements,h=2*r/(t-e),u=2*r/(n-s),d=(t+e)/(t-e),f=(n+s)/(n-s),x,b;if(l)x=r/(a-r),b=a*r/(a-r);else if(o===In)x=-(a+r)/(a-r),b=-2*a*r/(a-r);else if(o===Ss)x=-a/(a-r),b=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=x,c[14]=b,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=In,l=!1){let c=this.elements,h=2/(t-e),u=2/(n-s),d=-(t+e)/(t-e),f=-(n+s)/(n-s),x,b;if(l)x=1/(a-r),b=a/(a-r);else if(o===In)x=-2/(a-r),b=-(a+r)/(a-r);else if(o===Ss)x=-1/(a-r),b=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=x,c[14]=b,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Va.prototype.isMatrix4=!0;var gt=Va,os=new k,Rn=new gt,mp=new k(0,0,0),gp=new k(1,1,1),mi=new k,qr=new k,pn=new k,jh=new gt,Kh=new jt,Nn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Ve(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ve(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ve(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ve(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ve(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Ve(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Le("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return jh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(jh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Kh.setFromEuler(this),this.setFromQuaternion(Kh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Nn.DEFAULT_ORDER="XYZ";var As=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},xp=0,Qh=new k,ls=new jt,Qn=new gt,Yr=new k,$s=new k,yp=new k,_p=new jt,ed=new k(1,0,0),td=new k(0,1,0),nd=new k(0,0,1),id={type:"added"},vp={type:"removed"},cs={type:"childadded",child:null},gl={type:"childremoved",child:null},Kt=class i extends Dn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:xp++}),this.uuid=Os(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new k,t=new Nn,n=new jt,s=new k(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new gt},normalMatrix:{value:new Ue}}),this.matrix=new gt,this.matrixWorld=new gt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new As,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ls.setFromAxisAngle(e,t),this.quaternion.multiply(ls),this}rotateOnWorldAxis(e,t){return ls.setFromAxisAngle(e,t),this.quaternion.premultiply(ls),this}rotateX(e){return this.rotateOnAxis(ed,e)}rotateY(e){return this.rotateOnAxis(td,e)}rotateZ(e){return this.rotateOnAxis(nd,e)}translateOnAxis(e,t){return Qh.copy(e).applyQuaternion(this.quaternion),this.position.add(Qh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ed,e)}translateY(e){return this.translateOnAxis(td,e)}translateZ(e){return this.translateOnAxis(nd,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Qn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Yr.copy(e):Yr.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),$s.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qn.lookAt($s,Yr,this.up):Qn.lookAt(Yr,$s,this.up),this.quaternion.setFromRotationMatrix(Qn),s&&(Qn.extractRotation(s.matrixWorld),ls.setFromRotationMatrix(Qn),this.quaternion.premultiply(ls.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Ie("Object3D.add: object can\'t be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(id),cs.child=e,this.dispatchEvent(cs),cs.child=null):Ie("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(vp),gl.child=e,this.dispatchEvent(gl),gl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Qn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Qn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Qn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(id),cs.child=e,this.dispatchEvent(cs),cs.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,e,yp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,_p,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),f=a(e.animations),x=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),x.length>0&&(n.nodes=x)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Kt.DEFAULT_UP=new k(0,1,0);Kt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Kt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var wn=class extends Kt{constructor(){super(),this.isGroup=!0,this.type="Group"}},bp={type:"move"},Cs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new wn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new wn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new k,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new k),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new wn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new k,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new k,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let b of e.hand.values()){let m=t.getJointPose(b,n),p=this._getHandJoint(c,b);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,x=.005;c.inputState.pinching&&d>f+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=f-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(bp)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new wn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},eu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gi={h:0,s:0,l:0},Zr={h:0,s:0,l:0};function xl(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var ze=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Nt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ye.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ye.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=Ye.workingColorSpace){if(e=hc(e,1),t=Ve(t,0,1),n=Ve(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=xl(a,r,e+1/3),this.g=xl(a,r,e),this.b=xl(a,r,e-1/3)}return Ye.colorSpaceToWorking(this,s),this}setStyle(e,t=Nt){function n(r){r!==void 0&&parseFloat(r)<1&&Le("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\\w+)\\(([^\\)]*)\\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\\s*(\\d*\\.?\\d+)\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Le("Color: Unknown color model "+e)}}else if(s=/^\\#([A-Fa-f\\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Le("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Nt){let n=eu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Le("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=si(e.r),this.g=si(e.g),this.b=si(e.b),this}copyLinearToSRGB(e){return this.r=vs(e.r),this.g=vs(e.g),this.b=vs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Nt){return Ye.workingToColorSpace($t.copy(this),e),Math.round(Ve($t.r*255,0,255))*65536+Math.round(Ve($t.g*255,0,255))*256+Math.round(Ve($t.b*255,0,255))}getHexString(e=Nt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.workingToColorSpace($t.copy(this),t);let n=$t.r,s=$t.g,r=$t.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Ye.workingColorSpace){return Ye.workingToColorSpace($t.copy(this),t),e.r=$t.r,e.g=$t.g,e.b=$t.b,e}getStyle(e=Nt){Ye.workingToColorSpace($t.copy(this),e);let t=$t.r,n=$t.g,s=$t.b;return e!==Nt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(gi),this.setHSL(gi.h+e,gi.s+t,gi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(gi),e.getHSL(Zr);let n=er(gi.h,Zr.h,t),s=er(gi.s,Zr.s,t),r=er(gi.l,Zr.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},$t=new ze;ze.NAMES=eu;var ar=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new ze(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},or=class extends Kt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Nn,this.environmentIntensity=1,this.environmentRotation=new Nn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Pn=new k,ei=new k,yl=new k,ti=new k,hs=new k,ds=new k,sd=new k,_l=new k,vl=new k,bl=new k,Ml=new xt,Sl=new xt,wl=new xt,vi=class i{constructor(e=new k,t=new k,n=new k){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Pn.subVectors(e,t),s.cross(Pn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Pn.subVectors(s,t),ei.subVectors(n,t),yl.subVectors(e,t);let a=Pn.dot(Pn),o=Pn.dot(ei),l=Pn.dot(yl),c=ei.dot(ei),h=ei.dot(yl),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(c*l-o*h)*d,x=(a*h-o*l)*d;return r.set(1-f-x,x,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,ti)===null?!1:ti.x>=0&&ti.y>=0&&ti.x+ti.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,ti)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ti.x),l.addScaledVector(a,ti.y),l.addScaledVector(o,ti.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return Ml.setScalar(0),Sl.setScalar(0),wl.setScalar(0),Ml.fromBufferAttribute(e,t),Sl.fromBufferAttribute(e,n),wl.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Ml,r.x),a.addScaledVector(Sl,r.y),a.addScaledVector(wl,r.z),a}static isFrontFacing(e,t,n,s){return Pn.subVectors(n,t),ei.subVectors(e,t),Pn.cross(ei).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Pn.subVectors(this.c,this.b),ei.subVectors(this.a,this.b),Pn.cross(ei).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;hs.subVectors(s,n),ds.subVectors(r,n),_l.subVectors(e,n);let l=hs.dot(_l),c=ds.dot(_l);if(l<=0&&c<=0)return t.copy(n);vl.subVectors(e,s);let h=hs.dot(vl),u=ds.dot(vl);if(h>=0&&u<=h)return t.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(hs,a);bl.subVectors(e,r);let f=hs.dot(bl),x=ds.dot(bl);if(x>=0&&f<=x)return t.copy(r);let b=f*c-l*x;if(b<=0&&c>=0&&x<=0)return o=c/(c-x),t.copy(n).addScaledVector(ds,o);let m=h*x-f*u;if(m<=0&&u-h>=0&&f-x>=0)return sd.subVectors(r,s),o=(u-h)/(u-h+(f-x)),t.copy(s).addScaledVector(sd,o);let p=1/(m+b+d);return a=b*p,o=d*p,t.copy(n).addScaledVector(hs,a).addScaledVector(ds,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},bi=class{constructor(e=new k(1/0,1/0,1/0),t=new k(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Ln.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Ln.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Ln.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Ln):Ln.fromBufferAttribute(r,a),Ln.applyMatrix4(e.matrixWorld),this.expandByPoint(Ln);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),$r.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),$r.copy(n.boundingBox)),$r.applyMatrix4(e.matrixWorld),this.union($r)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ln),Ln.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Js),Jr.subVectors(this.max,Js),us.subVectors(e.a,Js),fs.subVectors(e.b,Js),ps.subVectors(e.c,Js),xi.subVectors(fs,us),yi.subVectors(ps,fs),Oi.subVectors(us,ps);let t=[0,-xi.z,xi.y,0,-yi.z,yi.y,0,-Oi.z,Oi.y,xi.z,0,-xi.x,yi.z,0,-yi.x,Oi.z,0,-Oi.x,-xi.y,xi.x,0,-yi.y,yi.x,0,-Oi.y,Oi.x,0];return!El(t,us,fs,ps,Jr)||(t=[1,0,0,0,1,0,0,0,1],!El(t,us,fs,ps,Jr))?!1:(jr.crossVectors(xi,yi),t=[jr.x,jr.y,jr.z],El(t,us,fs,ps,Jr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ln).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ln).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ni[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ni[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ni[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ni[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ni[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ni[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ni[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ni[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ni),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ni=[new k,new k,new k,new k,new k,new k,new k,new k],Ln=new k,$r=new bi,us=new k,fs=new k,ps=new k,xi=new k,yi=new k,Oi=new k,Js=new k,Jr=new k,jr=new k,Fi=new k;function El(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Fi.fromArray(i,r);let o=s.x*Math.abs(Fi.x)+s.y*Math.abs(Fi.y)+s.z*Math.abs(Fi.z),l=e.dot(Fi),c=t.dot(Fi),h=n.dot(Fi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Rt=new k,Kr=new Re,Mp=0,En=class extends Dn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Mp++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=$d,this.updateRanges=[],this.gpuType=On,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Kr.fromBufferAttribute(this,t),Kr.applyMatrix3(e),this.setXY(t,Kr.x,Kr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix3(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix4(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyNormalMatrix(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.transformDirection(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=_s(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=rn(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=_s(t,this.array)),t}setX(e,t){return this.normalized&&(t=rn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=_s(t,this.array)),t}setY(e,t){return this.normalized&&(t=rn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=_s(t,this.array)),t}setZ(e,t){return this.normalized&&(t=rn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=_s(t,this.array)),t}setW(e,t){return this.normalized&&(t=rn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=rn(t,this.array),n=rn(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=rn(t,this.array),n=rn(n,this.array),s=rn(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=rn(t,this.array),n=rn(n,this.array),s=rn(s,this.array),r=rn(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var lr=class extends En{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var cr=class extends En{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var St=class extends En{constructor(e,t,n){super(new Float32Array(e),t,n)}},Sp=new bi,js=new k,Tl=new k,Rs=class{constructor(e=new k,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Sp.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;js.subVectors(e,this.center);let t=js.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(js,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Tl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(js.copy(e.center).add(Tl)),this.expandByPoint(js.copy(e.center).sub(Tl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},wp=0,Sn=new gt,Al=new Kt,ms=new k,mn=new bi,Ks=new bi,Gt=new k,gn=class i extends Dn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:wp++}),this.uuid=Os(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Zf(e)?cr:lr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ue().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Sn.makeRotationFromQuaternion(e),this.applyMatrix4(Sn),this}rotateX(e){return Sn.makeRotationX(e),this.applyMatrix4(Sn),this}rotateY(e){return Sn.makeRotationY(e),this.applyMatrix4(Sn),this}rotateZ(e){return Sn.makeRotationZ(e),this.applyMatrix4(Sn),this}translate(e,t,n){return Sn.makeTranslation(e,t,n),this.applyMatrix4(Sn),this}scale(e,t,n){return Sn.makeScale(e,t,n),this.applyMatrix4(Sn),this}lookAt(e){return Al.lookAt(e),Al.updateMatrix(),this.applyMatrix4(Al.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ms).negate(),this.translate(ms.x,ms.y,ms.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new St(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Le("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new bi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ie("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new k(-1/0,-1/0,-1/0),new k(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];mn.setFromBufferAttribute(r),this.morphTargetsRelative?(Gt.addVectors(this.boundingBox.min,mn.min),this.boundingBox.expandByPoint(Gt),Gt.addVectors(this.boundingBox.max,mn.max),this.boundingBox.expandByPoint(Gt)):(this.boundingBox.expandByPoint(mn.min),this.boundingBox.expandByPoint(mn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ie(\'BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.\',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Rs);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ie("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new k,1/0);return}if(e){let n=this.boundingSphere.center;if(mn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Ks.setFromBufferAttribute(o),this.morphTargetsRelative?(Gt.addVectors(mn.min,Ks.min),mn.expandByPoint(Gt),Gt.addVectors(mn.max,Ks.max),mn.expandByPoint(Gt)):(mn.expandByPoint(Ks.min),mn.expandByPoint(Ks.max))}mn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Gt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Gt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Gt.fromBufferAttribute(o,c),l&&(ms.fromBufferAttribute(e,c),Gt.add(ms)),s=Math.max(s,n.distanceToSquared(Gt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Ie(\'BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.\',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ie("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new En(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let y=0;y<n.count;y++)o[y]=new k,l[y]=new k;let c=new k,h=new k,u=new k,d=new Re,f=new Re,x=new Re,b=new k,m=new k;function p(y,T,L){c.fromBufferAttribute(n,y),h.fromBufferAttribute(n,T),u.fromBufferAttribute(n,L),d.fromBufferAttribute(r,y),f.fromBufferAttribute(r,T),x.fromBufferAttribute(r,L),h.sub(c),u.sub(c),f.sub(d),x.sub(d);let U=1/(f.x*x.y-x.x*f.y);isFinite(U)&&(b.copy(h).multiplyScalar(x.y).addScaledVector(u,-f.y).multiplyScalar(U),m.copy(u).multiplyScalar(f.x).addScaledVector(h,-x.x).multiplyScalar(U),o[y].add(b),o[T].add(b),o[L].add(b),l[y].add(m),l[T].add(m),l[L].add(m))}let A=this.groups;A.length===0&&(A=[{start:0,count:e.count}]);for(let y=0,T=A.length;y<T;++y){let L=A[y],U=L.start,F=L.count;for(let G=U,D=U+F;G<D;G+=3)p(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let R=new k,M=new k,S=new k,w=new k;function C(y){S.fromBufferAttribute(s,y),w.copy(S);let T=o[y];R.copy(T),R.sub(S.multiplyScalar(S.dot(T))).normalize(),M.crossVectors(w,T);let U=M.dot(l[y])<0?-1:1;a.setXYZW(y,R.x,R.y,R.z,U)}for(let y=0,T=A.length;y<T;++y){let L=A[y],U=L.start,F=L.count;for(let G=U,D=U+F;G<D;G+=3)C(e.getX(G+0)),C(e.getX(G+1)),C(e.getX(G+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new En(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let s=new k,r=new k,a=new k,o=new k,l=new k,c=new k,h=new k,u=new k;if(e)for(let d=0,f=e.count;d<f;d+=3){let x=e.getX(d+0),b=e.getX(d+1),m=e.getX(d+2);s.fromBufferAttribute(t,x),r.fromBufferAttribute(t,b),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(n,x),l.fromBufferAttribute(n,b),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(x,o.x,o.y,o.z),n.setXYZ(b,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Gt.fromBufferAttribute(e,t),Gt.normalize(),e.setXYZ(t,Gt.x,Gt.y,Gt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),f=0,x=0;for(let b=0,m=l.length;b<m;b++){o.isInterleavedBufferAttribute?f=l[b]*o.data.stride+o.offset:f=l[b]*h;for(let p=0;p<h;p++)d[x++]=c[f++]}return new En(d,h,u)}if(this.index===null)return Le("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let d=c[h],f=e(d,n);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let f=c[u];h.push(f.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Cl=new k,Ep=new k,Tp=new Ue,an=class{constructor(e=new k(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Cl.subVectors(n,t).cross(Ep.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(Cl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Tp.getNormalMatrix(e),s=this.coplanarPoint(Cl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Ap=0,Mi=class extends Dn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ap++}),this.uuid=Os(),this.name="",this.type="Material",this.blending=Ns,this.side=Pi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Xl,this.blendDst=ql,this.blendEquation=Xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=bs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Gd,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ua,this.stencilZFail=ua,this.stencilZPass=ua,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Le(`Material: parameter \'${t}\' has value of undefined.`);continue}let s=this[t];if(s===void 0){Le(`Material: \'${t}\' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new ze().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new an().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Re().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Re().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var ii=new k,Rl=new k,Qr=new k,ea=new k,Gi=class{constructor(e=new k,t=new k(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ii)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ii.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ii.copy(this.origin).addScaledVector(this.direction,t),ii.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Rl.copy(e).add(t).multiplyScalar(.5),Qr.copy(t).sub(e).normalize(),ea.copy(this.origin).sub(Rl);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Qr),o=ea.dot(this.direction),l=-ea.dot(Qr),c=ea.lengthSq(),h=Math.abs(1-a*a),u,d,f,x;if(h>0)if(u=a*l-o,d=a*o-l,x=r*h,u>=0)if(d>=-x)if(d<=x){let b=1/h;u*=b,d*=b,f=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d<=-x?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=x?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Rl).addScaledVector(Qr,d),f}intersectSphere(e,t){if(e.radius<0)return null;ii.subVectors(e.center,this.origin);let n=ii.dot(this.direction),s=ii.dot(ii)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,s=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,s=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,ii)!==null}intersectTriangle(e,t,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,x=t.x-a.x,b=t.y-a.y,m=t.z-a.z,p=n.x-a.x,A=n.y-a.y,R=n.z-a.z,M=Math.abs(l),S=Math.abs(c),w=Math.abs(h),C,y,T,L,U,F,G,D,V,J,j,se;if(M>=S&&M>=w?(T=l,F=u,V=x,se=p,l>=0?(C=c,y=h,L=d,U=f,G=b,D=m,J=A,j=R):(C=h,y=c,L=f,U=d,G=m,D=b,J=R,j=A)):S>=w?(T=c,F=d,V=b,se=A,c>=0?(C=h,y=l,L=f,U=u,G=m,D=x,J=R,j=p):(C=l,y=h,L=u,U=f,G=x,D=m,J=p,j=R)):(T=h,F=f,V=m,se=R,h>=0?(C=l,y=c,L=u,U=d,G=x,D=b,J=p,j=A):(C=c,y=l,L=d,U=u,G=b,D=x,J=A,j=p)),T===0)return null;let Y=C/T,te=y/T,ie=1/T,Ce=L-Y*F,Te=U-te*F,ct=G-Y*V,Ze=D-te*V,Ke=J-Y*se,Z=j-te*se,ee=Ke*Ze-Z*ct,_e=Ce*Z-Te*Ke,ke=ct*Te-Ze*Ce;if(s){if(ee<0||_e<0||ke<0)return null}else if((ee<0||_e<0||ke<0)&&(ee>0||_e>0||ke>0))return null;let xe=ee+_e+ke;if(xe===0)return null;let Ge=ie*(ee*F+_e*V+ke*se);return(xe>0?Ge<0:Ge>0)?null:this.at(Ge/xe,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Qt=class extends Mi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.combine=Wa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},rd=new gt,Bi=new Gi,ta=new Rs,ad=new k,na=new k,ia=new k,sa=new k,Pl=new k,ra=new k,od=new k,aa=new k,Je=class extends Kt{constructor(e=new gn,t=new Qt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){ra.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(Pl.fromBufferAttribute(u,e),a?ra.addScaledVector(Pl,h):ra.addScaledVector(Pl.sub(t),h))}t.add(ra)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ta.copy(n.boundingSphere),ta.applyMatrix4(r),Bi.copy(e.ray).recast(e.near),!(ta.containsPoint(Bi.origin)===!1&&(Bi.intersectSphere(ta,ad)===null||Bi.origin.distanceToSquared(ad)>(e.far-e.near)**2))&&(rd.copy(r).invert(),Bi.copy(e.ray).applyMatrix4(rd),!(n.boundingBox!==null&&Bi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Bi)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,b=d.length;x<b;x++){let m=d[x],p=a[m.materialIndex],A=Math.max(m.start,f.start),R=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let M=A,S=R;M<S;M+=3){let w=o.getX(M),C=o.getX(M+1),y=o.getX(M+2);s=oa(this,p,e,n,c,h,u,w,C,y),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let x=Math.max(0,f.start),b=Math.min(o.count,f.start+f.count);for(let m=x,p=b;m<p;m+=3){let A=o.getX(m),R=o.getX(m+1),M=o.getX(m+2);s=oa(this,a,e,n,c,h,u,A,R,M),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,b=d.length;x<b;x++){let m=d[x],p=a[m.materialIndex],A=Math.max(m.start,f.start),R=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let M=A,S=R;M<S;M+=3){let w=M,C=M+1,y=M+2;s=oa(this,p,e,n,c,h,u,w,C,y),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let x=Math.max(0,f.start),b=Math.min(l.count,f.start+f.count);for(let m=x,p=b;m<p;m+=3){let A=m,R=m+1,M=m+2;s=oa(this,a,e,n,c,h,u,A,R,M),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function Cp(i,e,t,n,s,r,a,o){let l;if(e.side===Lt?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===Pi,o),l===null)return null;aa.copy(o),aa.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(aa);return c<t.near||c>t.far?null:{distance:c,point:aa.clone(),object:i}}function oa(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,na),i.getVertexPosition(l,ia),i.getVertexPosition(c,sa);let h=Cp(i,e,t,n,na,ia,sa,od);if(h){let u=new k;vi.getBarycoord(od,na,ia,sa,u),s&&(h.uv=vi.getInterpolatedAttribute(s,o,l,c,u,new Re)),r&&(h.uv1=vi.getInterpolatedAttribute(r,o,l,c,u,new Re)),a&&(h.normal=vi.getInterpolatedAttribute(a,o,l,c,u,new k),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a:o,b:l,c,normal:new k,materialIndex:0};vi.getNormal(na,ia,sa,d.normal),h.face=d,h.barycoord=u}return h}var Ea=class extends on{constructor(e=null,t=1,n=1,s,r,a,o,l,c=Vt,h=Vt,u,d){super(null,a,o,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var zi=new Rs,Rp=new Re(.5,.5),la=new k,Ps=class{constructor(e=new an,t=new an,n=new an,s=new an,r=new an,a=new an){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=In,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],u=r[5],d=r[6],f=r[7],x=r[8],b=r[9],m=r[10],p=r[11],A=r[12],R=r[13],M=r[14],S=r[15];if(s[0].setComponents(c-a,f-h,p-x,S-A).normalize(),s[1].setComponents(c+a,f+h,p+x,S+A).normalize(),s[2].setComponents(c+o,f+u,p+b,S+R).normalize(),s[3].setComponents(c-o,f-u,p-b,S-R).normalize(),n)s[4].setComponents(l,d,m,M).normalize(),s[5].setComponents(c-l,f-d,p-m,S-M).normalize();else if(s[4].setComponents(c-l,f-d,p-m,S-M).normalize(),t===In)s[5].setComponents(c+l,f+d,p+m,S+M).normalize();else if(t===Ss)s[5].setComponents(l,d,m,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),zi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),zi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(zi)}intersectsSprite(e){zi.center.set(0,0,0);let t=Rp.distanceTo(e.center);return zi.radius=.7071067811865476+t,zi.applyMatrix4(e.matrixWorld),this.intersectsSphere(zi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(la.x=s.normal.x>0?e.max.x:e.min.x,la.y=s.normal.y>0?e.max.y:e.min.y,la.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(la)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var hr=class extends on{constructor(e=[],t=Li,n,s,r,a,o,l,c,h){super(e,t,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Si=class extends on{constructor(e,t,n,s,r,a,o,l,c){super(e,t,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var wi=class extends on{constructor(e,t,n=kn,s,r,a,o=Vt,l=Vt,c,h=Xn,u=1){if(h!==Xn&&h!==Di)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:u};super(d,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ts(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Ta=class extends wi{constructor(e,t=kn,n=Li,s,r,a=Vt,o=Vt,l,c=Xn){let h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,n,s,r,a,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},dr=class extends on{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},en=class i extends gn{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,f=0;x("z","y","x",-1,-1,n,t,e,a,r,0),x("z","y","x",1,-1,n,t,-e,a,r,1),x("x","z","y",1,1,e,n,t,s,a,2),x("x","z","y",1,-1,e,n,-t,s,a,3),x("x","y","z",1,-1,e,t,n,s,r,4),x("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new St(c,3)),this.setAttribute("normal",new St(h,3)),this.setAttribute("uv",new St(u,2));function x(b,m,p,A,R,M,S,w,C,y,T){let L=M/C,U=S/y,F=M/2,G=S/2,D=w/2,V=C+1,J=y+1,j=0,se=0,Y=new k;for(let te=0;te<J;te++){let ie=te*U-G;for(let Ce=0;Ce<V;Ce++){let Te=Ce*L-F;Y[b]=Te*A,Y[m]=ie*R,Y[p]=D,c.push(Y.x,Y.y,Y.z),Y[b]=0,Y[m]=0,Y[p]=w>0?1:-1,h.push(Y.x,Y.y,Y.z),u.push(Ce/C),u.push(1-te/y),j+=1}}for(let te=0;te<y;te++)for(let ie=0;ie<C;ie++){let Ce=d+ie+V*te,Te=d+ie+V*(te+1),ct=d+(ie+1)+V*(te+1),Ze=d+(ie+1)+V*te;l.push(Ce,Te,Ze),l.push(Te,ct,Ze),se+=6}o.addGroup(f,se,T),f+=se,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var ur=class i extends gn{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new k,h=new Re;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let f=n+u/t*s;c.x=e*Math.cos(f),c.y=e*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new St(a,3)),this.setAttribute("normal",new St(o,3)),this.setAttribute("uv",new St(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Vi=class i extends gn{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],f=[],x=0,b=[],m=n/2,p=0;A(),a===!1&&(e>0&&R(!0),t>0&&R(!1)),this.setIndex(h),this.setAttribute("position",new St(u,3)),this.setAttribute("normal",new St(d,3)),this.setAttribute("uv",new St(f,2));function A(){let M=new k,S=new k,w=0,C=(t-e)/n;for(let y=0;y<=r;y++){let T=[],L=y/r,U=L*(t-e)+e;for(let F=0;F<=s;F++){let G=F/s,D=G*l+o,V=Math.sin(D),J=Math.cos(D);S.x=U*V,S.y=-L*n+m,S.z=U*J,u.push(S.x,S.y,S.z),M.set(V,C,J).normalize(),d.push(M.x,M.y,M.z),f.push(G,1-L),T.push(x++)}b.push(T)}for(let y=0;y<s;y++)for(let T=0;T<r;T++){let L=b[T][y],U=b[T+1][y],F=b[T+1][y+1],G=b[T][y+1];(e>0||T!==0)&&(h.push(L,U,G),w+=3),(t>0||T!==r-1)&&(h.push(U,F,G),w+=3)}c.addGroup(p,w,0),p+=w}function R(M){let S=x,w=new Re,C=new k,y=0,T=M===!0?e:t,L=M===!0?1:-1;for(let F=1;F<=s;F++)u.push(0,m*L,0),d.push(0,L,0),f.push(.5,.5),x++;let U=x;for(let F=0;F<=s;F++){let D=F/s*l+o,V=Math.cos(D),J=Math.sin(D);C.x=T*J,C.y=m*L,C.z=T*V,u.push(C.x,C.y,C.z),d.push(0,L,0),w.x=V*.5+.5,w.y=J*.5*L+.5,f.push(w.x,w.y),x++}for(let F=0;F<s;F++){let G=S+F,D=U+F;M===!0?h.push(D,D+1,G):h.push(D+1,D,G),y+=3}c.addGroup(p,y,M===!0?1:2),p+=y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},fr=class i extends Vi{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Tn=class i extends gn{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,u=e/o,d=t/l,f=[],x=[],b=[],m=[];for(let p=0;p<h;p++){let A=p*d-a;for(let R=0;R<c;R++){let M=R*u-r;x.push(M,-A,0),b.push(0,0,1),m.push(R/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let A=0;A<o;A++){let R=A+c*p,M=A+c*(p+1),S=A+1+c*(p+1),w=A+1+c*p;f.push(R,M,w),f.push(M,S,w)}this.setIndex(f),this.setAttribute("position",new St(x,3)),this.setAttribute("normal",new St(b,3)),this.setAttribute("uv",new St(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},pr=class i extends gn{constructor(e=.5,t=1,n=32,s=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:a},n=Math.max(3,n),s=Math.max(1,s);let o=[],l=[],c=[],h=[],u=e,d=(t-e)/s,f=new k,x=new Re;for(let b=0;b<=s;b++){for(let m=0;m<=n;m++){let p=r+m/n*a;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),x.x=(f.x/t+1)/2,x.y=(f.y/t+1)/2,h.push(x.x,x.y)}u+=d}for(let b=0;b<s;b++){let m=b*(n+1);for(let p=0;p<n;p++){let A=p+m,R=A,M=A+n+1,S=A+n+2,w=A+1;o.push(R,M,w),o.push(M,S,w)}}this.setIndex(o),this.setAttribute("position",new St(l,3)),this.setAttribute("normal",new St(c,3)),this.setAttribute("uv",new St(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};function Yi(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(ld(s))s.isRenderTargetTexture?(Le("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(ld(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function tn(i){let e={};for(let t=0;t<i.length;t++){let n=Yi(i[t]);for(let s in n)e[s]=n[s]}return e}function ld(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Pp(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function dc(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}var tu={clone:Yi,merge:tn},Lp=`void main() {\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}`,Ip=`void main() {\n	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}`,xn=class extends Mi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Lp,this.fragmentShader=Ip,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Yi(e.uniforms),this.uniformsGroups=Pp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new ze().setHex(s.value);break;case"v2":this.uniforms[n].value=new Re().fromArray(s.value);break;case"v3":this.uniforms[n].value=new k().fromArray(s.value);break;case"v4":this.uniforms[n].value=new xt().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Ue().fromArray(s.value);break;case"m4":this.uniforms[n].value=new gt().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Aa=class extends xn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Pt=class extends Mi{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ze(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Lo,this.normalScale=new Re(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.combine=Wa,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Ca=class extends Mi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=zd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ra=class extends Mi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function gs(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Ll(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var Ei=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Pa=class extends Ei{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Nl,endingEnd:Nl}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Ul:r=e,o=2*t-n;break;case kl:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ul:a=e,l=2*n-t;break;case kl:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,x=(n-t)/(s-t),b=x*x,m=b*x,p=-d*m+2*d*b-d*x,A=(1+d)*m+(-1.5-2*d)*b+(-.5+d)*x+1,R=(-1-f)*m+(1.5+f)*b+.5*x,M=f*m-f*b;for(let S=0;S!==o;++S)r[S]=p*a[h+S]+A*a[c+S]+R*a[l+S]+M*a[u+S];return r}},La=class extends Ei{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(s-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}},Ia=class extends Ei{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Da=class extends Ei{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,u=this.outTangents;if(!h||!u){let x=(n-t)/(s-t),b=1-x;for(let m=0;m!==o;++m)r[m]=a[c+m]*b+a[l+m]*x;return r}let d=o*2,f=e-1;for(let x=0;x!==o;++x){let b=a[c+x],m=a[l+x],p=f*d+x*2,A=u[p],R=u[p+1],M=e*d+x*2,S=h[M],w=h[M+1],C=Np(n,t,A,S,s);r[x]=nu(C,b,R,w,m)}return r}};function nu(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function Dp(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function Np(i,e,t,n,s){let r=(i-e)/(s-e);for(let a=0;a<8;a++){let o=nu(r,e,t,n,s)-i;if(Math.abs(o)<1e-10)break;let l=Dp(r,e,t,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var yn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=gs(t,this.TimeBufferType),this.values=gs(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:gs(e.times,Array),values:gs(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),Ll(e.settings)&&(n.settings={inTangents:gs(e.settings.inTangents,Array),outTangents:gs(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ia(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new La(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Pa(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Da(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case tr:t=this.InterpolantFactoryMethodDiscrete;break;case ba:t=this.InterpolantFactoryMethodLinear;break;case da:t=this.InterpolantFactoryMethodSmooth;break;case Dl:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Le("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return tr;case this.InterpolantFactoryMethodLinear:return ba;case this.InterpolantFactoryMethodSmooth:return da;case this.InterpolantFactoryMethodBezier:return Dl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;Ll(this.settings)&&(cd(this.settings.inTangents,e),cd(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Ie("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Ie("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Ie("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Ie("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&$f(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Ie("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===da,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let u=o*n,d=u-n,f=u+n;for(let x=0;x!==n;++x){let b=t[u+x];if(b!==t[d+x]||b!==t[f+x]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*n,d=a*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,Ll(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function cd(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}yn.prototype.ValueTypeName="";yn.prototype.TimeBufferType=Float32Array;yn.prototype.ValueBufferType=Float32Array;yn.prototype.DefaultInterpolation=ba;var Ti=class extends yn{constructor(e,t,n){super(e,t,n)}};Ti.prototype.ValueTypeName="bool";Ti.prototype.ValueBufferType=Array;Ti.prototype.DefaultInterpolation=tr;Ti.prototype.InterpolantFactoryMethodLinear=void 0;Ti.prototype.InterpolantFactoryMethodSmooth=void 0;var Na=class extends yn{constructor(e,t,n,s){super(e,t,n,s)}};Na.prototype.ValueTypeName="color";var Ua=class extends yn{constructor(e,t,n,s){super(e,t,n,s)}};Ua.prototype.ValueTypeName="number";var ka=class extends Ei{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)jt.slerpFlat(r,0,a,c-o,a,c,l);return r}},mr=class extends yn{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new ka(this.times,this.values,this.getValueSize(),e)}};mr.prototype.ValueTypeName="quaternion";mr.prototype.InterpolantFactoryMethodSmooth=void 0;var Ai=class extends yn{constructor(e,t,n){super(e,t,n)}};Ai.prototype.ValueTypeName="string";Ai.prototype.ValueBufferType=Array;Ai.prototype.DefaultInterpolation=tr;Ai.prototype.InterpolantFactoryMethodLinear=void 0;Ai.prototype.InterpolantFactoryMethodSmooth=void 0;var Oa=class extends yn{constructor(e,t,n,s){super(e,t,n,s)}};Oa.prototype.ValueTypeName="vector";var Fa=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let f=c[u],x=c[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return x}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},iu=new Fa,Ba=class{constructor(e){this.manager=e!==void 0?e:iu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Ba.DEFAULT_MATERIAL_NAME="__DEFAULT";var gr=class extends Kt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ze(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},xr=class extends gr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Kt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ze(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Il=new gt,hd=new k,dd=new k,za=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Re(512,512),this.mapType=dn,this.map=null,this.mapPass=null,this.matrix=new gt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ps,this._frameExtents=new Re(1,1),this._viewportCount=1,this._viewports=[new xt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;hd.setFromMatrixPosition(e.matrixWorld),t.position.copy(hd),dd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(dd),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,s){Il.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Il,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;e.coordinateSystem===Ss||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Il)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ca=new k,ha=new jt,Vn=new k,yr=class extends Kt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new gt,this.projectionMatrix=new gt,this.projectionMatrixInverse=new gt,this.coordinateSystem=In,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ca,ha,Vn),Vn.x===1&&Vn.y===1&&Vn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ca,ha,Vn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(ca,ha,Vn),Vn.x===1&&Vn.y===1&&Vn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ca,ha,Vn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},_i=new k,ud=new Re,fd=new Re,Jt=class extends yr{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Es*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Qs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Es*2*Math.atan(Math.tan(Qs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){_i.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(_i.x,_i.y).multiplyScalar(-e/_i.z),_i.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(_i.x,_i.y).multiplyScalar(-e/_i.z)}getViewSize(e,t){return this.getViewBounds(e,ud,fd),t.subVectors(fd,ud)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Qs*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var Ls=class extends yr{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ol=class extends za{constructor(){super(new Ls(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},_r=class extends gr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Kt.DEFAULT_UP),this.updateMatrix(),this.target=new Kt,this.shadow=new Ol}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var xs=-90,ys=1,Ha=class extends Kt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Jt(xs,ys,e,t);s.layers=this.layers,this.add(s);let r=new Jt(xs,ys,e,t);r.layers=this.layers,this.add(r);let a=new Jt(xs,ys,e,t);a.layers=this.layers,this.add(a);let o=new Jt(xs,ys,e,t);o.layers=this.layers,this.add(o);let l=new Jt(xs,ys,e,t);l.layers=this.layers,this.add(l);let c=new Jt(xs,ys,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===In)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Ss)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;let b=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=b,e.setRenderTarget(n,5,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=x,n.texture.needsPMREMUpdate=!0}},Ga=class extends Jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var uc="\\\\[\\\\]\\\\.:\\\\/",Up=new RegExp("["+uc+"]","g"),fc="[^"+uc+"]",kp="[^"+uc.replace("\\\\.","")+"]",Op=/((?:WC+[\\/:])*)/.source.replace("WC",fc),Fp=/(WCOD+)?/.source.replace("WCOD",kp),Bp=/(?:\\.(WC+)(?:\\[(.+)\\])?)?/.source.replace("WC",fc),zp=/\\.(WC+)(?:\\[(.+)\\])?/.source.replace("WC",fc),Hp=new RegExp("^"+Op+Fp+Bp+zp+"$"),Gp=["material","materials","bones","map"],Fl=class{constructor(e,t,n){let s=n||pt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},pt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\\s/g,"_").replace(Up,"")}static parseTrackName(e){let t=Hp.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Gp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Le("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Ie("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Ie("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Ie("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Ie("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Ie("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Ie("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Ie("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;Ie("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn\'t found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Ie("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Ie("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};pt.Composite=Fl;pt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};pt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};pt.prototype.GetterByBindingType=[pt.prototype._getValue_direct,pt.prototype._getValue_array,pt.prototype._getValue_arrayElement,pt.prototype._getValue_toArray];pt.prototype.SetterByBindingTypeAndVersioning=[[pt.prototype._setValue_direct,pt.prototype._setValue_direct_setNeedsUpdate,pt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_array,pt.prototype._setValue_array_setNeedsUpdate,pt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_arrayElement,pt.prototype._setValue_arrayElement_setNeedsUpdate,pt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[pt.prototype._setValue_fromArray,pt.prototype._setValue_fromArray_setNeedsUpdate,pt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var j_=new Float32Array(1);var pd=new gt,vr=class{constructor(e,t,n=0,s=1/0){this.ray=new Gi(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new As,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Ie("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return pd.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(pd),this}intersectObject(e,t=!0,n=[]){return Bl(e,this,n,t),n.sort(md),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)Bl(e[s],this,n,t);return n.sort(md),n}};function md(i,e){return i.distance-e.distance}function Bl(i,e,t,n){let s=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let a=0,o=r.length;a<o;a++)Bl(r[a],e,t,!0)}}var Is=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Ve(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Ve(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var _c=class _c{constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};_c.prototype.isMatrix2=!0;var zl=_c;var br=class extends Dn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function pc(i,e,t,n){let s=Vp(n);switch(t){case rc:return i*e;case oc:return i*e/s.components*s.byteLength;case ja:return i*e/s.components*s.byteLength;case Ni:return i*e*2/s.components*s.byteLength;case Ka:return i*e*2/s.components*s.byteLength;case ac:return i*e*3/s.components*s.byteLength;case An:return i*e*4/s.components*s.byteLength;case Qa:return i*e*4/s.components*s.byteLength;case wr:case Er:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Tr:case Ar:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case to:case io:return Math.max(i,16)*Math.max(e,8)/4;case eo:case no:return Math.max(i,8)*Math.max(e,8)/2;case so:case ro:case oo:case lo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ao:case Cr:case co:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ho:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case uo:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case fo:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case po:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case mo:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case go:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case xo:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case yo:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case _o:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case vo:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case bo:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Mo:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case So:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case wo:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Eo:case To:case Ao:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Co:case Ro:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Rr:case Po:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Vp(i){switch(i){case dn:case tc:return{byteLength:1,components:1};case Us:case nc:case Fn:return{byteLength:2,components:1};case $a:case Ja:return{byteLength:2,components:4};case kn:case Za:case On:return{byteLength:4,components:1};case ic:case sc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Le("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function Eu(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Xp(i){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,u=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){let h=l.array,u=l.updateRanges;if(i.bindBuffer(c,o),u.length===0)i.bufferSubData(c,0,h);else{u.sort((f,x)=>f.start-x.start);let d=0;for(let f=1;f<u.length;f++){let x=u[d],b=u[f];b.start<=x.start+x.count+1?x.count=Math.max(x.count,b.start+b.count-x.start):(++d,u[d]=b)}u.length=d+1;for(let f=0,x=u.length;f<x;f++){let b=u[f];i.bufferSubData(c,b.start*h.BYTES_PER_ELEMENT,h,b.start,b.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute\'s array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var qp=`#ifdef USE_ALPHAHASH\n	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;\n#endif`,Yp=`#ifdef USE_ALPHAHASH\n	const float ALPHA_HASH_SCALE = 0.05;\n	float hash2D( vec2 value ) {\n		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );\n	}\n	float hash3D( vec3 value ) {\n		return hash2D( vec2( hash2D( value.xy ), value.z ) );\n	}\n	float getAlphaHashThreshold( vec3 position ) {\n		float maxDeriv = max(\n			length( dFdx( position.xyz ) ),\n			length( dFdy( position.xyz ) )\n		);\n		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );\n		vec2 pixScales = vec2(\n			exp2( floor( log2( pixScale ) ) ),\n			exp2( ceil( log2( pixScale ) ) )\n		);\n		vec2 alpha = vec2(\n			hash3D( floor( pixScales.x * position.xyz ) ),\n			hash3D( floor( pixScales.y * position.xyz ) )\n		);\n		float lerpFactor = fract( log2( pixScale ) );\n		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;\n		float a = min( lerpFactor, 1.0 - lerpFactor );\n		vec3 cases = vec3(\n			x * x / ( 2.0 * a * ( 1.0 - a ) ),\n			( x - 0.5 * a ) / ( 1.0 - a ),\n			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )\n		);\n		float threshold = ( x < ( 1.0 - a ) )\n			? ( ( x < a ) ? cases.x : cases.y )\n			: cases.z;\n		return clamp( threshold , 1.0e-6, 1.0 );\n	}\n#endif`,Zp=`#ifdef USE_ALPHAMAP\n	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;\n#endif`,$p=`#ifdef USE_ALPHAMAP\n	uniform sampler2D alphaMap;\n#endif`,Jp=`#ifdef USE_ALPHATEST\n	#ifdef ALPHA_TO_COVERAGE\n	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );\n	if ( diffuseColor.a == 0.0 ) discard;\n	#else\n	if ( diffuseColor.a < alphaTest ) discard;\n	#endif\n#endif`,jp=`#ifdef USE_ALPHATEST\n	uniform float alphaTest;\n#endif`,Kp=`#ifdef USE_AOMAP\n	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;\n	reflectedLight.indirectDiffuse *= ambientOcclusion;\n	#if defined( USE_CLEARCOAT ) \n		clearcoatSpecularIndirect *= ambientOcclusion;\n	#endif\n	#if defined( USE_SHEEN ) \n		sheenSpecularIndirect *= ambientOcclusion;\n	#endif\n	#if defined( USE_ENVMAP ) && defined( STANDARD )\n		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );\n		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );\n	#endif\n#endif`,Qp=`#ifdef USE_AOMAP\n	uniform sampler2D aoMap;\n	uniform float aoMapIntensity;\n#endif`,em=`#ifdef USE_BATCHING\n	#if ! defined( GL_ANGLE_multi_draw )\n	#define gl_DrawID _gl_DrawID\n	uniform int _gl_DrawID;\n	#endif\n	uniform highp sampler2D batchingTexture;\n	uniform highp usampler2D batchingIdTexture;\n	mat4 getBatchingMatrix( const in float i ) {\n		int size = textureSize( batchingTexture, 0 ).x;\n		int j = int( i ) * 4;\n		int x = j % size;\n		int y = j / size;\n		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );\n		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );\n		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );\n		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );\n		return mat4( v1, v2, v3, v4 );\n	}\n	float getIndirectIndex( const in int i ) {\n		int size = textureSize( batchingIdTexture, 0 ).x;\n		int x = i % size;\n		int y = i / size;\n		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );\n	}\n#endif\n#ifdef USE_BATCHING_COLOR\n	uniform sampler2D batchingColorTexture;\n	vec4 getBatchingColor( const in float i ) {\n		int size = textureSize( batchingColorTexture, 0 ).x;\n		int j = int( i );\n		int x = j % size;\n		int y = j / size;\n		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );\n	}\n#endif`,tm=`#ifdef USE_BATCHING\n	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );\n#endif`,nm=`vec3 transformed = vec3( position );\n#ifdef USE_ALPHAHASH\n	vPosition = vec3( position );\n#endif`,im=`vec3 objectNormal = vec3( normal );\n#ifdef USE_TANGENT\n	vec3 objectTangent = vec3( tangent.xyz );\n#endif`,sm=`float G_BlinnPhong_Implicit( ) {\n	return 0.25;\n}\nfloat D_BlinnPhong( const in float shininess, const in float dotNH ) {\n	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n}\nvec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float dotVH = saturate( dot( viewDir, halfDir ) );\n	vec3 F = F_Schlick( specularColor, 1.0, dotVH );\n	float G = G_BlinnPhong_Implicit( );\n	float D = D_BlinnPhong( shininess, dotNH );\n	return F * ( G * D );\n} // validated`,rm=`#ifdef USE_IRIDESCENCE\n	const mat3 XYZ_TO_REC709 = mat3(\n		 3.2404542, -0.9692660,  0.0556434,\n		-1.5371385,  1.8760108, -0.2040259,\n		-0.4985314,  0.0415560,  1.0572252\n	);\n	vec3 Fresnel0ToIor( vec3 fresnel0 ) {\n		vec3 sqrtF0 = sqrt( fresnel0 );\n		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );\n	}\n	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {\n		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );\n	}\n	float IorToFresnel0( float transmittedIor, float incidentIor ) {\n		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));\n	}\n	vec3 evalSensitivity( float OPD, vec3 shift ) {\n		float phase = 2.0 * PI * OPD * 1.0e-9;\n		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );\n		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );\n		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );\n		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );\n		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );\n		xyz /= 1.0685e-7;\n		vec3 rgb = XYZ_TO_REC709 * xyz;\n		return rgb;\n	}\n	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {\n		vec3 I;\n		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );\n		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );\n		float cosTheta2Sq = 1.0 - sinTheta2Sq;\n		if ( cosTheta2Sq < 0.0 ) {\n			return vec3( 1.0 );\n		}\n		float cosTheta2 = sqrt( cosTheta2Sq );\n		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );\n		float R12 = F_Schlick( R0, 1.0, cosTheta1 );\n		float T121 = 1.0 - R12;\n		float phi12 = 0.0;\n		if ( iridescenceIOR < outsideIOR ) phi12 = PI;\n		float phi21 = PI - phi12;\n		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );\n		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );\n		vec3 phi23 = vec3( 0.0 );\n		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;\n		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;\n		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;\n		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;\n		vec3 phi = vec3( phi21 ) + phi23;\n		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );\n		vec3 r123 = sqrt( R123 );\n		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );\n		vec3 C0 = R12 + Rs;\n		I = C0;\n		vec3 Cm = Rs - T121;\n		for ( int m = 1; m <= 2; ++ m ) {\n			Cm *= r123;\n			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );\n			I += Cm * Sm;\n		}\n		return max( I, vec3( 0.0 ) );\n	}\n#endif`,am=`#ifdef USE_BUMPMAP\n	uniform sampler2D bumpMap;\n	uniform float bumpScale;\n	vec2 dHdxy_fwd() {\n		vec2 dSTdx = dFdx( vBumpMapUv );\n		vec2 dSTdy = dFdy( vBumpMapUv );\n		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;\n		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;\n		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;\n		return vec2( dBx, dBy );\n	}\n	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {\n		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );\n		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );\n		vec3 vN = surf_norm;\n		vec3 R1 = cross( vSigmaY, vN );\n		vec3 R2 = cross( vN, vSigmaX );\n		float fDet = dot( vSigmaX, R1 ) * faceDirection;\n		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n		return normalize( abs( fDet ) * surf_norm - vGrad );\n	}\n#endif`,om=`#if NUM_CLIPPING_PLANES > 0\n	vec4 plane;\n	#ifdef ALPHA_TO_COVERAGE\n		float distanceToPlane, distanceGradient;\n		float clipOpacity = 1.0;\n		#pragma unroll_loop_start\n		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n			plane = clippingPlanes[ i ];\n			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n			distanceGradient = fwidth( distanceToPlane ) / 2.0;\n			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n			if ( clipOpacity == 0.0 ) discard;\n		}\n		#pragma unroll_loop_end\n		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n			float unionClipOpacity = 1.0;\n			#pragma unroll_loop_start\n			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n				plane = clippingPlanes[ i ];\n				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;\n				distanceGradient = fwidth( distanceToPlane ) / 2.0;\n				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );\n			}\n			#pragma unroll_loop_end\n			clipOpacity *= 1.0 - unionClipOpacity;\n		#endif\n		diffuseColor.a *= clipOpacity;\n		if ( diffuseColor.a == 0.0 ) discard;\n	#else\n		#pragma unroll_loop_start\n		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {\n			plane = clippingPlanes[ i ];\n			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;\n		}\n		#pragma unroll_loop_end\n		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES\n			bool clipped = true;\n			#pragma unroll_loop_start\n			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {\n				plane = clippingPlanes[ i ];\n				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;\n			}\n			#pragma unroll_loop_end\n			if ( clipped ) discard;\n		#endif\n	#endif\n#endif`,lm=`#if NUM_CLIPPING_PLANES > 0\n	varying vec3 vClipPosition;\n	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];\n#endif`,cm=`#if NUM_CLIPPING_PLANES > 0\n	varying vec3 vClipPosition;\n#endif`,hm=`#if NUM_CLIPPING_PLANES > 0\n	vClipPosition = - mvPosition.xyz;\n#endif`,dm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n	diffuseColor *= vColor;\n#endif`,um=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n	varying vec4 vColor;\n#endif`,fm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n	varying vec4 vColor;\n#endif`,pm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )\n	vColor = vec4( 1.0 );\n#endif\n#ifdef USE_COLOR_ALPHA\n	vColor *= color;\n#elif defined( USE_COLOR )\n	vColor.rgb *= color;\n#endif\n#ifdef USE_INSTANCING_COLOR\n	vColor.rgb *= instanceColor.rgb;\n#endif\n#ifdef USE_BATCHING_COLOR\n	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );\n#endif`,mm=`#define PI 3.141592653589793\n#define PI2 6.283185307179586\n#define PI_HALF 1.5707963267948966\n#define RECIPROCAL_PI 0.3183098861837907\n#define RECIPROCAL_PI2 0.15915494309189535\n#define EPSILON 1e-6\n#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\n#define whiteComplement( a ) ( 1.0 - saturate( a ) )\nfloat pow2( const in float x ) { return x*x; }\nvec3 pow2( const in vec3 x ) { return x*x; }\nfloat pow3( const in float x ) { return x*x*x; }\nfloat pow4( const in float x ) { float x2 = x*x; return x2*x2; }\nfloat max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }\nfloat average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }\nhighp float rand( const in vec2 uv ) {\n	const highp float a = 12.9898, b = 78.233, c = 43758.5453;\n	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );\n	return fract( sin( sn ) * c );\n}\n#ifdef HIGH_PRECISION\n	float precisionSafeLength( vec3 v ) { return length( v ); }\n#else\n	float precisionSafeLength( vec3 v ) {\n		float maxComponent = max3( abs( v ) );\n		return length( v / maxComponent ) * maxComponent;\n	}\n#endif\nstruct IncidentLight {\n	vec3 color;\n	vec3 direction;\n	bool visible;\n};\nstruct ReflectedLight {\n	vec3 directDiffuse;\n	vec3 directSpecular;\n	vec3 indirectDiffuse;\n	vec3 indirectSpecular;\n};\n#ifdef USE_ALPHAHASH\n	varying vec3 vPosition;\n#endif\nvec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n}\n#define inverseTransformDirection transformDirectionByInverseViewMatrix\nvec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {\n	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );\n}\nvec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {\n	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );\n}\nbool isPerspectiveMatrix( mat4 m ) {\n	return m[ 2 ][ 3 ] == - 1.0;\n}\nvec2 equirectUv( in vec3 dir ) {\n	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;\n	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;\n	return vec2( u, v );\n}\nvec3 BRDF_Lambert( const in vec3 diffuseColor ) {\n	return RECIPROCAL_PI * diffuseColor;\n}\nvec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {\n	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n}\nfloat F_Schlick( const in float f0, const in float f90, const in float dotVH ) {\n	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );\n	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );\n} // validated`,gm=`#ifdef ENVMAP_TYPE_CUBE_UV\n	#define cubeUV_minMipLevel 4.0\n	#define cubeUV_minTileSize 16.0\n	float getFace( vec3 direction ) {\n		vec3 absDirection = abs( direction );\n		float face = - 1.0;\n		if ( absDirection.x > absDirection.z ) {\n			if ( absDirection.x > absDirection.y )\n				face = direction.x > 0.0 ? 0.0 : 3.0;\n			else\n				face = direction.y > 0.0 ? 1.0 : 4.0;\n		} else {\n			if ( absDirection.z > absDirection.y )\n				face = direction.z > 0.0 ? 2.0 : 5.0;\n			else\n				face = direction.y > 0.0 ? 1.0 : 4.0;\n		}\n		return face;\n	}\n	vec2 getUV( vec3 direction, float face ) {\n		vec2 uv;\n		if ( face == 0.0 ) {\n			uv = vec2( direction.z, direction.y ) / abs( direction.x );\n		} else if ( face == 1.0 ) {\n			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );\n		} else if ( face == 2.0 ) {\n			uv = vec2( - direction.x, direction.y ) / abs( direction.z );\n		} else if ( face == 3.0 ) {\n			uv = vec2( - direction.z, direction.y ) / abs( direction.x );\n		} else if ( face == 4.0 ) {\n			uv = vec2( - direction.x, direction.z ) / abs( direction.y );\n		} else {\n			uv = vec2( direction.x, direction.y ) / abs( direction.z );\n		}\n		return 0.5 * ( uv + 1.0 );\n	}\n	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {\n		float face = getFace( direction );\n		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );\n		mipInt = max( mipInt, cubeUV_minMipLevel );\n		float faceSize = exp2( mipInt );\n		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;\n		if ( face > 2.0 ) {\n			uv.y += faceSize;\n			face -= 3.0;\n		}\n		uv.x += face * faceSize;\n		uv.x += filterInt * 3.0 * cubeUV_minTileSize;\n		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );\n		uv.x *= CUBEUV_TEXEL_WIDTH;\n		uv.y *= CUBEUV_TEXEL_HEIGHT;\n		#ifdef texture2DGradEXT\n			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;\n		#else\n			return texture2D( envMap, uv ).rgb;\n		#endif\n	}\n	#define cubeUV_r0 1.0\n	#define cubeUV_m0 - 2.0\n	#define cubeUV_r1 0.8\n	#define cubeUV_m1 - 1.0\n	#define cubeUV_r4 0.4\n	#define cubeUV_m4 2.0\n	#define cubeUV_r5 0.305\n	#define cubeUV_m5 3.0\n	#define cubeUV_r6 0.21\n	#define cubeUV_m6 4.0\n	float roughnessToMip( float roughness ) {\n		float mip = 0.0;\n		if ( roughness >= cubeUV_r1 ) {\n			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;\n		} else if ( roughness >= cubeUV_r4 ) {\n			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;\n		} else if ( roughness >= cubeUV_r5 ) {\n			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;\n		} else if ( roughness >= cubeUV_r6 ) {\n			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;\n		} else {\n			mip = - 2.0 * log2( 1.16 * roughness );		}\n		return mip;\n	}\n	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {\n		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );\n		float mipF = fract( mip );\n		float mipInt = floor( mip );\n		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );\n		if ( mipF == 0.0 ) {\n			return vec4( color0, 1.0 );\n		} else {\n			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );\n			return vec4( mix( color0, color1, mipF ), 1.0 );\n		}\n	}\n#endif`,xm=`vec3 transformedNormal = objectNormal;\n#ifdef USE_TANGENT\n	vec3 transformedTangent = objectTangent;\n#endif\n#ifdef USE_BATCHING\n	mat3 bm = mat3( batchingMatrix );\n	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );\n	transformedNormal = bm * transformedNormal;\n	#ifdef USE_TANGENT\n		transformedTangent = bm * transformedTangent;\n	#endif\n#endif\n#ifdef USE_INSTANCING\n	mat3 im = mat3( instanceMatrix );\n	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );\n	transformedNormal = im * transformedNormal;\n	#ifdef USE_TANGENT\n		transformedTangent = im * transformedTangent;\n	#endif\n#endif\ntransformedNormal = normalMatrix * transformedNormal;\n#ifdef FLIP_SIDED\n	transformedNormal = - transformedNormal;\n#endif\n#ifdef USE_TANGENT\n	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;\n#endif`,ym=`#ifdef USE_DISPLACEMENTMAP\n	uniform sampler2D displacementMap;\n	uniform float displacementScale;\n	uniform float displacementBias;\n#endif`,_m=`#ifdef USE_DISPLACEMENTMAP\n	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );\n#endif`,vm=`#ifdef USE_EMISSIVEMAP\n	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );\n	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE\n		emissiveColor = sRGBTransferEOTF( emissiveColor );\n	#endif\n	totalEmissiveRadiance *= emissiveColor.rgb;\n#endif`,bm=`#ifdef USE_EMISSIVEMAP\n	uniform sampler2D emissiveMap;\n#endif`,Mm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Sm=`vec4 LinearTransferOETF( in vec4 value ) {\n	return value;\n}\nvec4 sRGBTransferEOTF( in vec4 value ) {\n	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );\n}\nvec4 sRGBTransferOETF( in vec4 value ) {\n	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );\n}`,wm=`#ifdef USE_ENVMAP\n	#ifdef ENV_WORLDPOS\n		vec3 cameraToFrag;\n		if ( isOrthographic ) {\n			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n		} else {\n			cameraToFrag = normalize( vWorldPosition - cameraPosition );\n		}\n		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n		#ifdef ENVMAP_MODE_REFLECTION\n			vec3 reflectVec = reflect( cameraToFrag, worldNormal );\n		#else\n			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );\n		#endif\n	#else\n		vec3 reflectVec = vReflect;\n	#endif\n	#ifdef ENVMAP_TYPE_CUBE\n		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );\n		#ifdef ENVMAP_BLENDING_MULTIPLY\n			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );\n		#elif defined( ENVMAP_BLENDING_MIX )\n			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );\n		#elif defined( ENVMAP_BLENDING_ADD )\n			outgoingLight += envColor.xyz * specularStrength * reflectivity;\n		#endif\n	#endif\n#endif`,Em=`#ifdef USE_ENVMAP\n	uniform float envMapIntensity;\n	uniform mat3 envMapRotation;\n	#ifdef ENVMAP_TYPE_CUBE\n		uniform samplerCube envMap;\n	#else\n		uniform sampler2D envMap;\n	#endif\n#endif`,Tm=`#ifdef USE_ENVMAP\n	uniform float reflectivity;\n	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n		#define ENV_WORLDPOS\n	#endif\n	#ifdef ENV_WORLDPOS\n		varying vec3 vWorldPosition;\n		uniform float refractionRatio;\n	#else\n		varying vec3 vReflect;\n	#endif\n#endif`,Am=`#ifdef USE_ENVMAP\n	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )\n		#define ENV_WORLDPOS\n	#endif\n	#ifdef ENV_WORLDPOS\n		\n		varying vec3 vWorldPosition;\n	#else\n		varying vec3 vReflect;\n		uniform float refractionRatio;\n	#endif\n#endif`,Cm=`#ifdef USE_ENVMAP\n	#ifdef ENV_WORLDPOS\n		vWorldPosition = worldPosition.xyz;\n	#else\n		vec3 cameraToVertex;\n		if ( isOrthographic ) {\n			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );\n		} else {\n			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n		}\n		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );\n		#ifdef ENVMAP_MODE_REFLECTION\n			vReflect = reflect( cameraToVertex, worldNormal );\n		#else\n			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n		#endif\n	#endif\n#endif`,Rm=`#ifdef USE_FOG\n	vFogDepth = - mvPosition.z;\n#endif`,Pm=`#ifdef USE_FOG\n	varying float vFogDepth;\n#endif`,Lm=`#ifdef USE_FOG\n	#ifdef FOG_EXP2\n		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n	#else\n		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n	#endif\n	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif`,Im=`#ifdef USE_FOG\n	uniform vec3 fogColor;\n	varying float vFogDepth;\n	#ifdef FOG_EXP2\n		uniform float fogDensity;\n	#else\n		uniform float fogNear;\n		uniform float fogFar;\n	#endif\n#endif`,Dm=`#ifdef USE_GRADIENTMAP\n	uniform sampler2D gradientMap;\n#endif\nvec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {\n	float dotNL = dot( normal, lightDirection );\n	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );\n	#ifdef USE_GRADIENTMAP\n		return vec3( texture2D( gradientMap, coord ).r );\n	#else\n		vec2 fw = fwidth( coord ) * 0.5;\n		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );\n	#endif\n}`,Nm=`#ifdef USE_LIGHTMAP\n	uniform sampler2D lightMap;\n	uniform float lightMapIntensity;\n#endif`,Um=`LambertMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularStrength = specularStrength;`,km=`varying vec3 vViewPosition;\nstruct LambertMaterial {\n	vec3 diffuseColor;\n	float specularStrength;\n};\nvoid RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_Lambert\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Om=`uniform bool receiveShadow;\nuniform vec3 ambientLightColor;\n#if defined( USE_LIGHT_PROBES )\n	uniform vec3 lightProbe[ 9 ];\n#endif\nvec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {\n	float x = normal.x, y = normal.y, z = normal.z;\n	vec3 result = shCoefficients[ 0 ] * 0.886227;\n	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;\n	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;\n	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;\n	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;\n	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;\n	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );\n	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;\n	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );\n	return result;\n}\nvec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {\n	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );\n	return irradiance;\n}\nvec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {\n	vec3 irradiance = ambientLightColor;\n	return irradiance;\n}\nfloat getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );\n	if ( cutoffDistance > 0.0 ) {\n		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );\n	}\n	return distanceFalloff;\n}\nfloat getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {\n	return smoothstep( coneCosine, penumbraCosine, angleCosine );\n}\n#if NUM_SUN_LIGHTS > 0\n	struct SunLight {\n		vec3 direction;\n		vec3 color;\n	};\n	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];\n	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {\n		light.color = sunLight.color;\n		light.direction = sunLight.direction;\n		light.visible = true;\n	}\n#endif\n#if NUM_DIR_LIGHTS > 0\n	struct DirectionalLight {\n		vec3 direction;\n		vec3 color;\n	};\n	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];\n	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {\n		light.color = directionalLight.color;\n		light.direction = directionalLight.direction;\n		light.visible = true;\n	}\n#endif\n#if NUM_POINT_LIGHTS > 0\n	struct PointLight {\n		vec3 position;\n		vec3 color;\n		float distance;\n		float decay;\n	};\n	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];\n	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {\n		vec3 lVector = pointLight.position - geometryPosition;\n		light.direction = normalize( lVector );\n		float lightDistance = length( lVector );\n		light.color = pointLight.color;\n		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );\n		light.visible = ( light.color != vec3( 0.0 ) );\n	}\n#endif\n#if NUM_SPOT_LIGHTS > 0\n	struct SpotLight {\n		vec3 position;\n		vec3 direction;\n		vec3 color;\n		float distance;\n		float decay;\n		float coneCos;\n		float penumbraCos;\n	};\n	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];\n	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {\n		vec3 lVector = spotLight.position - geometryPosition;\n		light.direction = normalize( lVector );\n		float angleCos = dot( light.direction, spotLight.direction );\n		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );\n		if ( spotAttenuation > 0.0 ) {\n			float lightDistance = length( lVector );\n			light.color = spotLight.color * spotAttenuation;\n			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );\n			light.visible = ( light.color != vec3( 0.0 ) );\n		} else {\n			light.color = vec3( 0.0 );\n			light.visible = false;\n		}\n	}\n#endif\n#if NUM_RECT_AREA_LIGHTS > 0\n	struct RectAreaLight {\n		vec3 color;\n		vec3 position;\n		vec3 halfWidth;\n		vec3 halfHeight;\n	};\n	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;\n	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];\n#endif\n#if NUM_HEMI_LIGHTS > 0\n	struct HemisphereLight {\n		vec3 direction;\n		vec3 skyColor;\n		vec3 groundColor;\n	};\n	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];\n	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {\n		float dotNL = dot( normal, hemiLight.direction );\n		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;\n		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );\n		return irradiance;\n	}\n#endif\n#include <lightprobes_pars_fragment>`,Fm=`#ifdef USE_ENVMAP\n	vec3 getIBLIrradiance( const in vec3 normal ) {\n		#ifdef ENVMAP_TYPE_CUBE_UV\n			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );\n			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );\n			return PI * envMapColor.rgb * envMapIntensity;\n		#else\n			return vec3( 0.0 );\n		#endif\n	}\n	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n		#ifdef ENVMAP_TYPE_CUBE_UV\n			vec3 reflectVec = reflect( - viewDir, normal );\n			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );\n			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );\n			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );\n			return envMapColor.rgb * envMapIntensity;\n		#else\n			return vec3( 0.0 );\n		#endif\n	}\n	#ifdef USE_RETROREFLECTION\n		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {\n			#ifdef ENVMAP_TYPE_CUBE_UV\n				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );\n				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );\n				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );\n				return envMapColor.rgb * envMapIntensity;\n			#else\n				return vec3( 0.0 );\n			#endif\n		}\n	#endif\n	#ifdef USE_ANISOTROPY\n		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n			#ifdef ENVMAP_TYPE_CUBE_UV\n				vec3 bentNormal = cross( bitangent, viewDir );\n				bentNormal = normalize( cross( bentNormal, bitangent ) );\n				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n				return getIBLRadiance( viewDir, bentNormal, roughness );\n			#else\n				return vec3( 0.0 );\n			#endif\n		}\n		#ifdef USE_RETROREFLECTION\n			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {\n				#ifdef ENVMAP_TYPE_CUBE_UV\n					vec3 bentNormal = cross( bitangent, viewDir );\n					bentNormal = normalize( cross( bentNormal, bitangent ) );\n					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );\n					return getIBLRetroRadiance( viewDir, bentNormal, roughness );\n				#else\n					return vec3( 0.0 );\n				#endif\n			}\n		#endif\n	#endif\n#endif`,Bm=`ToonMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;`,zm=`varying vec3 vViewPosition;\nstruct ToonMaterial {\n	vec3 diffuseColor;\n};\nvoid RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\nvoid RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_Toon\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Hm=`BlinnPhongMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.specularColor = specular;\nmaterial.specularShininess = shininess;\nmaterial.specularStrength = specularStrength;`,Gm=`varying vec3 vViewPosition;\nstruct BlinnPhongMaterial {\n	vec3 diffuseColor;\n	vec3 specularColor;\n	float specularShininess;\n	float specularStrength;\n};\nvoid RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;\n}\nvoid RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {\n	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}\n#define RE_Direct				RE_Direct_BlinnPhong\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Vm=`PhysicalMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\nmaterial.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );\nmaterial.metalness = metalnessFactor;\nvec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );\nfloat geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );\nmaterial.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;\nmaterial.roughness = min( material.roughness, 1.0 );\n#ifdef IOR\n	material.ior = ior;\n	#ifdef USE_SPECULAR\n		float specularIntensityFactor = specularIntensity;\n		vec3 specularColorFactor = specularColor;\n		#ifdef USE_SPECULAR_COLORMAP\n			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;\n		#endif\n		#ifdef USE_SPECULAR_INTENSITYMAP\n			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;\n		#endif\n		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );\n	#else\n		float specularIntensityFactor = 1.0;\n		vec3 specularColorFactor = vec3( 1.0 );\n		material.specularF90 = 1.0;\n	#endif\n	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;\n	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );\n#else\n	material.specularColor = vec3( 0.04 );\n	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );\n	material.specularF90 = 1.0;\n#endif\n#ifdef USE_CLEARCOAT\n	material.clearcoat = clearcoat;\n	material.clearcoatRoughness = clearcoatRoughness;\n	material.clearcoatF0 = vec3( 0.04 );\n	material.clearcoatF90 = 1.0;\n	#ifdef USE_CLEARCOATMAP\n		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;\n	#endif\n	#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;\n	#endif\n	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );\n	material.clearcoatRoughness += geometryRoughness;\n	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );\n#endif\n#ifdef USE_DISPERSION\n	material.dispersion = dispersion;\n#endif\n#ifdef USE_RETROREFLECTION\n	material.retroreflectivity = retroreflectivity;\n#endif\n#ifdef USE_IRIDESCENCE\n	material.iridescence = iridescence;\n	material.iridescenceIOR = iridescenceIOR;\n	#ifdef USE_IRIDESCENCEMAP\n		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;\n	#endif\n	#ifdef USE_IRIDESCENCE_THICKNESSMAP\n		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;\n	#else\n		material.iridescenceThickness = iridescenceThicknessMaximum;\n	#endif\n#endif\n#ifdef USE_SHEEN\n	material.sheenColor = sheenColor;\n	#ifdef USE_SHEEN_COLORMAP\n		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;\n	#endif\n	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );\n	#ifdef USE_SHEEN_ROUGHNESSMAP\n		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;\n	#endif\n#endif\n#ifdef USE_ANISOTROPY\n	#ifdef USE_ANISOTROPYMAP\n		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );\n		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;\n		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;\n	#else\n		vec2 anisotropyV = anisotropyVector;\n	#endif\n	material.anisotropy = length( anisotropyV );\n	if( material.anisotropy == 0.0 ) {\n		anisotropyV = vec2( 1.0, 0.0 );\n	} else {\n		anisotropyV /= material.anisotropy;\n		material.anisotropy = saturate( material.anisotropy );\n	}\n	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );\n	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;\n	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;\n#endif`,Wm=`uniform sampler2D dfgLUT;\nstruct PhysicalMaterial {\n	vec3 diffuseColor;\n	vec3 diffuseContribution;\n	vec3 specularColor;\n	vec3 specularColorBlended;\n	float roughness;\n	float metalness;\n	float specularF90;\n	float dispersion;\n	vec2 dfg;\n	vec3 multiScatteringCompensation;\n	#ifdef USE_RETROREFLECTION\n		float retroreflectivity;\n	#endif\n	#ifdef USE_CLEARCOAT\n		float clearcoat;\n		float clearcoatRoughness;\n		vec3 clearcoatF0;\n		float clearcoatF90;\n	#endif\n	#ifdef USE_IRIDESCENCE\n		float iridescence;\n		float iridescenceIOR;\n		float iridescenceThickness;\n		vec3 iridescenceFresnel;\n		vec3 iridescenceF0Dielectric;\n		vec3 iridescenceF0Metallic;\n	#endif\n	#ifdef USE_SHEEN\n		vec3 sheenColor;\n		float sheenRoughness;\n	#endif\n	#ifdef IOR\n		float ior;\n	#endif\n	#ifdef USE_TRANSMISSION\n		float transmission;\n		float transmissionAlpha;\n		float thickness;\n		float attenuationDistance;\n		vec3 attenuationColor;\n	#endif\n	#ifdef USE_ANISOTROPY\n		float anisotropy;\n		float alphaT;\n		vec3 anisotropyT;\n		vec3 anisotropyB;\n	#endif\n};\nvec3 clearcoatSpecularDirect = vec3( 0.0 );\nvec3 clearcoatSpecularIndirect = vec3( 0.0 );\nvec3 sheenSpecularDirect = vec3( 0.0 );\nvec3 sheenSpecularIndirect = vec3(0.0 );\nvec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {\n    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );\n    float x2 = x * x;\n    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );\n    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );\n}\nfloat V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {\n	float a2 = pow2( alpha );\n	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );\n	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );\n	return 0.5 / max( gv + gl, EPSILON );\n}\nfloat D_GGX( const in float alpha, const in float dotNH ) {\n	float a2 = pow2( alpha );\n	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;\n	return RECIPROCAL_PI * a2 / pow2( denom );\n}\n#ifdef USE_ANISOTROPY\n	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {\n		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );\n		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );\n		return 0.5 / max( gv + gl, EPSILON );\n	}\n	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {\n		float a2 = alphaT * alphaB;\n		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );\n		highp float v2 = dot( v, v );\n		float w2 = a2 / v2;\n		return RECIPROCAL_PI * a2 * pow2 ( w2 );\n	}\n#endif\n#ifdef USE_CLEARCOAT\n	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {\n		vec3 f0 = material.clearcoatF0;\n		float f90 = material.clearcoatF90;\n		float roughness = material.clearcoatRoughness;\n		float alpha = pow2( roughness );\n		vec3 halfDir = normalize( lightDir + viewDir );\n		float dotNL = saturate( dot( normal, lightDir ) );\n		float dotNV = saturate( dot( normal, viewDir ) );\n		float dotNH = saturate( dot( normal, halfDir ) );\n		float dotVH = saturate( dot( viewDir, halfDir ) );\n		vec3 F = F_Schlick( f0, f90, dotVH );\n		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n		float D = D_GGX( alpha, dotNH );\n		return F * ( V * D );\n	}\n#endif\nvec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {\n	vec3 f0 = material.specularColorBlended;\n	float f90 = material.specularF90;\n	float roughness = material.roughness;\n	float alpha = pow2( roughness );\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNL = saturate( dot( normal, lightDir ) );\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float dotVH = saturate( dot( viewDir, halfDir ) );\n	vec3 F = F_Schlick( f0, f90, dotVH );\n	#ifdef USE_IRIDESCENCE\n		F = mix( F, material.iridescenceFresnel, material.iridescence );\n	#endif\n	#ifdef USE_ANISOTROPY\n		float dotTL = dot( material.anisotropyT, lightDir );\n		float dotTV = dot( material.anisotropyT, viewDir );\n		float dotTH = dot( material.anisotropyT, halfDir );\n		float dotBL = dot( material.anisotropyB, lightDir );\n		float dotBV = dot( material.anisotropyB, viewDir );\n		float dotBH = dot( material.anisotropyB, halfDir );\n		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );\n		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );\n	#else\n		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );\n		float D = D_GGX( alpha, dotNH );\n	#endif\n	return F * ( V * D );\n}\nvec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {\n	const float LUT_SIZE = 64.0;\n	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;\n	const float LUT_BIAS = 0.5 / LUT_SIZE;\n	float dotNV = saturate( dot( N, V ) );\n	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );\n	uv = uv * LUT_SCALE + LUT_BIAS;\n	return uv;\n}\nfloat LTC_ClippedSphereFormFactor( const in vec3 f ) {\n	float l = length( f );\n	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );\n}\nvec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {\n	float x = dot( v1, v2 );\n	float y = abs( x );\n	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;\n	float b = 3.4175940 + ( 4.1616724 + y ) * y;\n	float v = a / b;\n	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;\n	return cross( v1, v2 ) * theta_sintheta;\n}\nvec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {\n	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];\n	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];\n	vec3 lightNormal = cross( v1, v2 );\n	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );\n	vec3 T1, T2;\n	T1 = normalize( V - N * dot( V, N ) );\n	T2 = - cross( N, T1 );\n	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );\n	vec3 coords[ 4 ];\n	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );\n	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );\n	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );\n	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );\n	coords[ 0 ] = normalize( coords[ 0 ] );\n	coords[ 1 ] = normalize( coords[ 1 ] );\n	coords[ 2 ] = normalize( coords[ 2 ] );\n	coords[ 3 ] = normalize( coords[ 3 ] );\n	vec3 vectorFormFactor = vec3( 0.0 );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );\n	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );\n	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );\n	return vec3( result );\n}\n#if defined( USE_SHEEN )\nfloat D_Charlie( float roughness, float dotNH ) {\n	float alpha = pow2( roughness );\n	float invAlpha = 1.0 / alpha;\n	float cos2h = dotNH * dotNH;\n	float sin2h = max( 1.0 - cos2h, 0.0078125 );\n	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );\n}\nfloat V_Neubelt( float dotNV, float dotNL ) {\n	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );\n}\nvec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {\n	vec3 halfDir = normalize( lightDir + viewDir );\n	float dotNL = saturate( dot( normal, lightDir ) );\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float dotNH = saturate( dot( normal, halfDir ) );\n	float D = D_Charlie( sheenRoughness, dotNH );\n	float V = V_Neubelt( dotNV, dotNL );\n	return sheenColor * ( D * V );\n}\n#endif\nfloat IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {\n	float dotNV = saturate( dot( normal, viewDir ) );\n	float r2 = roughness * roughness;\n	float rInv = 1.0 / ( roughness + 0.1 );\n	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;\n	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;\n	float DG = exp( a * dotNV + b );\n	return saturate( DG );\n}\nvec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {\n	float dotNV = saturate( dot( normal, viewDir ) );\n	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;\n	return specularColor * fab.x + specularF90 * fab.y;\n}\n#ifdef USE_IRIDESCENCE\nvoid computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#else\nvoid computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {\n#endif\n	#ifdef USE_IRIDESCENCE\n		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );\n	#else\n		vec3 Fr = specularColor;\n	#endif\n	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;\n	float Ess = fab.x + fab.y;\n	float Ems = 1.0 - Ess;\n	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );\n	singleScatter += FssEss;\n	multiScatter += Fms * Ems;\n}\n#if NUM_RECT_AREA_LIGHTS > 0\n	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n		vec3 normal = geometryNormal;\n		vec3 viewDir = geometryViewDir;\n		vec3 position = geometryPosition;\n		vec3 lightPos = rectAreaLight.position;\n		vec3 halfWidth = rectAreaLight.halfWidth;\n		vec3 halfHeight = rectAreaLight.halfHeight;\n		vec3 lightColor = rectAreaLight.color;\n		float roughness = material.roughness;\n		vec3 rectCoords[ 4 ];\n		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;\n		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;\n		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;\n		vec2 uv = LTC_Uv( normal, viewDir, roughness );\n		vec4 t1 = texture2D( ltc_1, uv );\n		vec4 t2 = texture2D( ltc_2, uv );\n		mat3 mInv = mat3(\n			vec3( t1.x, 0, t1.y ),\n			vec3(    0, 1,    0 ),\n			vec3( t1.z, 0, t1.w )\n		);\n		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );\n		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );\n		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );\n		#ifdef USE_CLEARCOAT\n			vec3 Ncc = geometryClearcoatNormal;\n			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );\n			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );\n			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );\n			mat3 mInvClearcoat = mat3(\n				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),\n				vec3(             0, 1,             0 ),\n				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )\n			);\n			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;\n			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );\n		#endif\n	}\n#endif\nvoid RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n	vec3 irradiance = dotNL * directLight.color;\n	#ifdef USE_CLEARCOAT\n		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );\n		vec3 ccIrradiance = dotNLcc * directLight.color;\n		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );\n	#endif\n	#ifdef USE_SHEEN\n \n 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );\n \n 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );\n \n 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );\n \n 		irradiance *= sheenEnergyComp;\n \n 	#endif\n	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );\n	#ifdef USE_RETROREFLECTION\n		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );\n		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );\n		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );\n	#endif\n	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;\n	vec3 halfDir = normalize( directLight.direction + geometryViewDir );\n	float dotVH = saturate( dot( geometryViewDir, halfDir ) );\n	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );\n	#ifdef USE_RETROREFLECTION\n		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );\n		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );\n		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );\n		F = mix( F, retroF, saturate( material.retroreflectivity ) );\n	#endif\n	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );\n}\nvoid RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {\n	vec3 singleScattering = vec3( 0.0 );\n	vec3 multiScattering = vec3( 0.0 );\n	#ifdef USE_IRIDESCENCE\n		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );\n	#else\n		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );\n	#endif\n	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );\n	#ifdef USE_SHEEN\n		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;\n		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;\n		diffuse *= sheenEnergyComp;\n	#endif\n	reflectedLight.indirectDiffuse += diffuse;\n}\nvoid RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {\n	#ifdef USE_CLEARCOAT\n		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );\n	#endif\n	#ifdef USE_SHEEN\n		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;\n 	#endif\n	vec3 singleScatteringDielectric = vec3( 0.0 );\n	vec3 multiScatteringDielectric = vec3( 0.0 );\n	vec3 singleScatteringMetallic = vec3( 0.0 );\n	vec3 multiScatteringMetallic = vec3( 0.0 );\n	#ifdef USE_IRIDESCENCE\n		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );\n		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );\n	#else\n		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );\n		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );\n	#endif\n	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );\n	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );\n	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;\n	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );\n	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;\n	vec3 indirectSpecular = radiance * singleScattering;\n	indirectSpecular += multiScattering * cosineWeightedIrradiance;\n	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;\n	#ifdef USE_SHEEN\n		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );\n		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;\n		indirectSpecular *= sheenEnergyComp;\n		indirectDiffuse *= sheenEnergyComp;\n	#endif\n	reflectedLight.indirectSpecular += indirectSpecular;\n	reflectedLight.indirectDiffuse += indirectDiffuse;\n}\n#define RE_Direct				RE_Direct_Physical\n#define RE_Direct_RectArea		RE_Direct_RectArea_Physical\n#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical\n#define RE_IndirectSpecular		RE_IndirectSpecular_Physical\nfloat computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {\n	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );\n}`,Xm=`\nvec3 geometryPosition = - vViewPosition;\nvec3 geometryNormal = normal;\nvec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\nvec3 geometryClearcoatNormal = vec3( 0.0 );\n#ifdef USE_CLEARCOAT\n	geometryClearcoatNormal = clearcoatNormal;\n#endif\n#ifdef USE_IRIDESCENCE\n	float dotNVi = saturate( dot( normal, geometryViewDir ) );\n	if ( material.iridescenceThickness == 0.0 ) {\n		material.iridescence = 0.0;\n	} else {\n		material.iridescence = saturate( material.iridescence );\n	}\n	if ( material.iridescence > 0.0 ) {\n		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );\n		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );\n		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );\n		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );\n		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );\n	}\n#endif\n#ifdef STANDARD\n	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );\n	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;\n	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )\n		float EssMs = material.dfg.x + material.dfg.y;\n		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );\n	#endif\n#endif\nIncidentLight directLight;\n#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n	PointLight pointLight;\n	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n	PointLightShadow pointLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n		pointLight = pointLights[ i ];\n		getPointLightInfo( pointLight, geometryPosition, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )\n		pointLightShadow = pointLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n	SpotLight spotLight;\n	vec4 spotColor;\n	vec3 spotLightCoord;\n	bool inSpotLightMap;\n	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n	SpotLightShadow spotLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n		spotLight = spotLights[ i ];\n		getSpotLightInfo( spotLight, geometryPosition, directLight );\n		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX\n		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS\n		#else\n		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )\n		#endif\n		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )\n			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;\n			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );\n			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );\n			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;\n		#endif\n		#undef SPOT_LIGHT_MAP_INDEX\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n		spotLightShadow = spotLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )\n	SunLight sunLight;\n	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0\n	SunLightShadow sunLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {\n		sunLight = sunLights[ i ];\n		getSunLightInfo( sunLight, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )\n		sunLightShadow = sunLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n	DirectionalLight directionalLight;\n	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n	DirectionalLightShadow directionalLightShadow;\n	#endif\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n		directionalLight = directionalLights[ i ];\n		getDirectionalLightInfo( directionalLight, directLight );\n		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n		directionalLightShadow = directionalLightShadows[ i ];\n		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n		#endif\n		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n	RectAreaLight rectAreaLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n		rectAreaLight = rectAreaLights[ i ];\n		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n	}\n	#pragma unroll_loop_end\n#endif\n#if defined( RE_IndirectDiffuse )\n	vec3 iblIrradiance = vec3( 0.0 );\n	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n	#if defined( USE_LIGHT_PROBES )\n		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n	#endif\n	#if ( NUM_HEMI_LIGHTS > 0 )\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n		}\n		#pragma unroll_loop_end\n	#endif\n	#ifdef USE_LIGHT_PROBES_GRID\n		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;\n		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );\n		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );\n	#endif\n#endif\n#if defined( RE_IndirectSpecular )\n	vec3 radiance = vec3( 0.0 );\n	vec3 clearcoatRadiance = vec3( 0.0 );\n#endif`,qm=`#if defined( RE_IndirectDiffuse )\n	#ifdef USE_LIGHTMAP\n		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;\n		irradiance += lightMapIrradiance;\n	#endif\n	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )\n		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )\n			iblIrradiance += getIBLIrradiance( geometryNormal );\n		#endif\n	#endif\n#endif\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n	#ifdef USE_ANISOTROPY\n		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n	#else\n		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );\n	#endif\n	#ifdef USE_RETROREFLECTION\n		#ifdef USE_ANISOTROPY\n			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );\n		#else\n			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );\n		#endif\n		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );\n	#endif\n	radiance += iblRadiance;\n	#ifdef USE_CLEARCOAT\n		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );\n	#endif\n#endif`,Ym=`#if defined( RE_IndirectDiffuse )\n	#if defined( LAMBERT ) || defined( PHONG )\n		irradiance += iblIrradiance;\n	#endif\n	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif\n#if defined( RE_IndirectSpecular )\n	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n#endif`,Zm=`#ifdef USE_LIGHT_PROBES_GRID\nuniform highp sampler3D probesSH;\nuniform vec3 probesMin;\nuniform vec3 probesMax;\nuniform vec3 probesResolution;\nvec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {\n	vec3 res = probesResolution;\n	vec3 gridRange = probesMax - probesMin;\n	vec3 resMinusOne = res - 1.0;\n	vec3 probeSpacing = gridRange / resMinusOne;\n	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;\n	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );\n	uvw = uvw * resMinusOne / res + 0.5 / res;\n	float nz          = res.z;\n	float paddedSlices = nz + 2.0;\n	float atlasDepth  = 7.0 * paddedSlices;\n	float uvZBase     = uvw.z * nz + 1.0;\n	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );\n	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );\n	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );\n	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );\n	vec3 c0 = s0.xyz;\n	vec3 c1 = vec3( s0.w, s1.xy );\n	vec3 c2 = vec3( s1.zw, s2.x );\n	vec3 c3 = s2.yzw;\n	vec3 c4 = s3.xyz;\n	vec3 c5 = vec3( s3.w, s4.xy );\n	vec3 c6 = vec3( s4.zw, s5.x );\n	vec3 c7 = s5.yzw;\n	vec3 c8 = s6.xyz;\n	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;\n	vec3 result = c0 * 0.886227;\n	result += c1 * 2.0 * 0.511664 * y;\n	result += c2 * 2.0 * 0.511664 * z;\n	result += c3 * 2.0 * 0.511664 * x;\n	result += c4 * 2.0 * 0.429043 * x * y;\n	result += c5 * 2.0 * 0.429043 * y * z;\n	result += c6 * ( 0.743125 * z * z - 0.247708 );\n	result += c7 * 2.0 * 0.429043 * x * z;\n	result += c8 * 0.429043 * ( x * x - y * y );\n	return max( result, vec3( 0.0 ) );\n}\n#endif`,$m=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;\n#endif`,Jm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )\n	uniform float logDepthBufFC;\n	varying float vFragDepth;\n	varying float vIsPerspective;\n#endif`,jm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n	varying float vFragDepth;\n	varying float vIsPerspective;\n#endif`,Km=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER\n	vFragDepth = 1.0 + gl_Position.w;\n	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );\n#endif`,Qm=`#ifdef USE_MAP\n	vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n	#ifdef DECODE_VIDEO_TEXTURE\n		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );\n	#endif\n	diffuseColor *= sampledDiffuseColor;\n#endif`,eg=`#ifdef USE_MAP\n	uniform sampler2D map;\n#endif`,tg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n	#if defined( USE_POINTS_UV )\n		vec2 uv = vUv;\n	#else\n		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;\n	#endif\n#endif\n#ifdef USE_MAP\n	diffuseColor *= texture2D( map, uv );\n#endif\n#ifdef USE_ALPHAMAP\n	diffuseColor.a *= texture2D( alphaMap, uv ).g;\n#endif`,ng=`#if defined( USE_POINTS_UV )\n	varying vec2 vUv;\n#else\n	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )\n		uniform mat3 uvTransform;\n	#endif\n#endif\n#ifdef USE_MAP\n	uniform sampler2D map;\n#endif\n#ifdef USE_ALPHAMAP\n	uniform sampler2D alphaMap;\n#endif`,ig=`float metalnessFactor = metalness;\n#ifdef USE_METALNESSMAP\n	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );\n	metalnessFactor *= texelMetalness.b;\n#endif`,sg=`#ifdef USE_METALNESSMAP\n	uniform sampler2D metalnessMap;\n#endif`,rg=`#ifdef USE_INSTANCING_MORPH\n	float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;\n	}\n#endif`,ag=`#if defined( USE_MORPHCOLORS )\n	vColor *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		#if defined( USE_COLOR_ALPHA )\n			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];\n		#elif defined( USE_COLOR )\n			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];\n		#endif\n	}\n#endif`,og=`#ifdef USE_MORPHNORMALS\n	objectNormal *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];\n	}\n#endif`,lg=`#ifdef USE_MORPHTARGETS\n	#ifndef USE_INSTANCING_MORPH\n		uniform float morphTargetBaseInfluence;\n		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];\n	#endif\n	uniform sampler2DArray morphTargetsTexture;\n	uniform ivec2 morphTargetsTextureSize;\n	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {\n		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;\n		int y = texelIndex / morphTargetsTextureSize.x;\n		int x = texelIndex - y * morphTargetsTextureSize.x;\n		ivec3 morphUV = ivec3( x, y, morphTargetIndex );\n		return texelFetch( morphTargetsTexture, morphUV, 0 );\n	}\n#endif`,cg=`#ifdef USE_MORPHTARGETS\n	transformed *= morphTargetBaseInfluence;\n	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {\n		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];\n	}\n#endif`,hg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;\n#ifdef FLAT_SHADED\n	vec3 fdx = dFdx( vViewPosition );\n	vec3 fdy = dFdy( vViewPosition );\n	vec3 normal = normalize( cross( fdx, fdy ) );\n#else\n	vec3 normal = normalize( vNormal );\n	#ifdef DOUBLE_SIDED\n		normal *= faceDirection;\n	#endif\n#endif\n#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )\n	#ifdef USE_TANGENT\n		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n	#else\n		mat3 tbn = getTangentFrame( - vViewPosition, normal,\n		#if defined( USE_NORMALMAP )\n			vNormalMapUv\n		#elif defined( USE_CLEARCOAT_NORMALMAP )\n			vClearcoatNormalMapUv\n		#else\n			vUv\n		#endif\n		);\n	#endif\n	#ifdef DOUBLE_SIDED\n		tbn[0] *= faceDirection;\n		tbn[1] *= faceDirection;\n	#endif\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	#ifdef USE_TANGENT\n		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n	#else\n		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );\n	#endif\n	#ifdef DOUBLE_SIDED\n		tbn2[0] *= faceDirection;\n		tbn2[1] *= faceDirection;\n	#endif\n#endif\nvec3 nonPerturbedNormal = normal;`,dg=`#ifdef USE_NORMALMAP_OBJECTSPACE\n	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n	#ifdef FLIP_SIDED\n		normal = - normal;\n	#endif\n	#ifdef DOUBLE_SIDED\n		normal = normal * faceDirection;\n	#endif\n	normal = normalize( normalMatrix * normal );\n#elif defined( USE_NORMALMAP_TANGENTSPACE )\n	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;\n	#if defined( USE_PACKED_NORMALMAP )\n		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );\n	#endif\n	mapN.xy *= normalScale;\n	normal = normalize( tbn * mapN );\n#elif defined( USE_BUMPMAP )\n	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );\n#endif`,ug=`#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif`,fg=`#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif`,pg=`#ifndef FLAT_SHADED\n	vNormal = normalize( transformedNormal );\n	#ifdef USE_TANGENT\n		vTangent = normalize( transformedTangent );\n		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );\n		#ifdef FLIP_SIDED\n			vBitangent = - vBitangent;\n		#endif\n	#endif\n#endif`,mg=`#ifdef USE_NORMALMAP\n	uniform sampler2D normalMap;\n	uniform vec2 normalScale;\n#endif\n#ifdef USE_NORMALMAP_OBJECTSPACE\n	uniform mat3 normalMatrix;\n#endif\n#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )\n	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {\n		vec3 q0 = dFdx( eye_pos.xyz );\n		vec3 q1 = dFdy( eye_pos.xyz );\n		vec2 st0 = dFdx( uv.st );\n		vec2 st1 = dFdy( uv.st );\n		vec3 N = surf_norm;\n		vec3 q1perp = cross( q1, N );\n		vec3 q0perp = cross( N, q0 );\n		vec3 T = q1perp * st0.x + q0perp * st1.x;\n		vec3 B = q1perp * st0.y + q0perp * st1.y;\n		float det = max( dot( T, T ), dot( B, B ) );\n		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );\n		return mat3( T * scale, B * scale, N );\n	}\n#endif`,gg=`#ifdef USE_CLEARCOAT\n	vec3 clearcoatNormal = nonPerturbedNormal;\n#endif`,xg=`#ifdef USE_CLEARCOAT_NORMALMAP\n	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;\n	clearcoatMapN.xy *= clearcoatNormalScale;\n	clearcoatNormal = normalize( tbn2 * clearcoatMapN );\n#endif`,yg=`#ifdef USE_CLEARCOATMAP\n	uniform sampler2D clearcoatMap;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	uniform sampler2D clearcoatNormalMap;\n	uniform vec2 clearcoatNormalScale;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	uniform sampler2D clearcoatRoughnessMap;\n#endif`,_g=`#ifdef USE_IRIDESCENCEMAP\n	uniform sampler2D iridescenceMap;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	uniform sampler2D iridescenceThicknessMap;\n#endif`,vg=`#ifdef OPAQUE\ndiffuseColor.a = 1.0;\n#endif\n#ifdef USE_TRANSMISSION\ndiffuseColor.a *= material.transmissionAlpha;\n#endif\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );`,bg=`vec3 packNormalToRGB( const in vec3 normal ) {\n	return normalize( normal ) * 0.5 + 0.5;\n}\nvec3 unpackRGBToNormal( const in vec3 rgb ) {\n	return 2.0 * rgb.xyz - 1.0;\n}\nconst float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;\nconst float Inv255 = 1. / 255.;\nconst vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );\nconst vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );\nconst vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );\nconst vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );\nvec4 packDepthToRGBA( const in float v ) {\n	if( v <= 0.0 )\n		return vec4( 0., 0., 0., 0. );\n	if( v >= 1.0 )\n		return vec4( 1., 1., 1., 1. );\n	float vuf;\n	float af = modf( v * PackFactors.a, vuf );\n	float bf = modf( vuf * ShiftRight8, vuf );\n	float gf = modf( vuf * ShiftRight8, vuf );\n	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );\n}\nvec3 packDepthToRGB( const in float v ) {\n	if( v <= 0.0 )\n		return vec3( 0., 0., 0. );\n	if( v >= 1.0 )\n		return vec3( 1., 1., 1. );\n	float vuf;\n	float bf = modf( v * PackFactors.b, vuf );\n	float gf = modf( vuf * ShiftRight8, vuf );\n	return vec3( vuf * Inv255, gf * PackUpscale, bf );\n}\nvec2 packDepthToRG( const in float v ) {\n	if( v <= 0.0 )\n		return vec2( 0., 0. );\n	if( v >= 1.0 )\n		return vec2( 1., 1. );\n	float vuf;\n	float gf = modf( v * 256., vuf );\n	return vec2( vuf * Inv255, gf );\n}\nfloat unpackRGBAToDepth( const in vec4 v ) {\n	return dot( v, UnpackFactors4 );\n}\nfloat unpackRGBToDepth( const in vec3 v ) {\n	return dot( v, UnpackFactors3 );\n}\nfloat unpackRGToDepth( const in vec2 v ) {\n	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;\n}\nvec4 pack2HalfToRGBA( const in vec2 v ) {\n	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );\n	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );\n}\nvec2 unpackRGBATo2Half( const in vec4 v ) {\n	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );\n}\nfloat viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {\n	return ( viewZ + near ) / ( near - far );\n}\nfloat orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n	\n		return depth * ( far - near ) - far;\n	#else\n		return depth * ( near - far ) - near;\n	#endif\n}\nfloat viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {\n	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );\n}\nfloat perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {\n	\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n		return ( near * far ) / ( ( near - far ) * depth - near );\n	#else\n		return ( near * far ) / ( ( far - near ) * depth - far );\n	#endif\n}`,Mg=`#ifdef PREMULTIPLIED_ALPHA\n	gl_FragColor.rgb *= gl_FragColor.a;\n#endif`,Sg=`vec4 mvPosition = vec4( transformed, 1.0 );\n#ifdef USE_BATCHING\n	mvPosition = batchingMatrix * mvPosition;\n#endif\n#ifdef USE_INSTANCING\n	mvPosition = instanceMatrix * mvPosition;\n#endif\nmvPosition = modelViewMatrix * mvPosition;\ngl_Position = projectionMatrix * mvPosition;`,wg=`#ifdef DITHERING\n	gl_FragColor.rgb = dithering( gl_FragColor.rgb );\n#endif`,Eg=`#ifdef DITHERING\n	vec3 dithering( vec3 color ) {\n		float grid_position = rand( gl_FragCoord.xy );\n		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );\n		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );\n		return color + dither_shift_RGB;\n	}\n#endif`,Tg=`float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );\n	roughnessFactor *= texelRoughness.g;\n#endif`,Ag=`#ifdef USE_ROUGHNESSMAP\n	uniform sampler2D roughnessMap;\n#endif`,Cg=`#if NUM_SPOT_LIGHT_COORDS > 0\n	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#if NUM_SPOT_LIGHT_MAPS > 0\n	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];\n#endif\n#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		#define SUN_LIGHT_CASCADES 2\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];\n		#endif\n		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];\n		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];\n		varying vec4 vSunShadowWorldPosition;\n		varying vec3 vSunShadowWorldNormal;\n		struct SunLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];\n		#endif\n		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n		struct DirectionalLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n		#else\n			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];\n		#endif\n		struct SpotLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		#if defined( SHADOWMAP_TYPE_PCF )\n			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n		#elif defined( SHADOWMAP_TYPE_BASIC )\n			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];\n		#endif\n		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n		struct PointLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n			float shadowCameraNear;\n			float shadowCameraFar;\n		};\n		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n	#endif\n	#if defined( SHADOWMAP_TYPE_PCF )\n		float interleavedGradientNoise( vec2 position ) {\n			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );\n		}\n		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {\n			const float goldenAngle = 2.399963229728653;\n			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );\n			float theta = float( sampleIndex ) * goldenAngle + phi;\n			return vec2( cos( theta ), sin( theta ) ) * r;\n		}\n	#endif\n	#if defined( SHADOWMAP_TYPE_PCF )\n		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			shadowCoord.z += shadowBias;\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;\n				float radius = shadowRadius * texelSize.x;\n				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;\n				shadow = (\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +\n					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )\n				) * 0.2;\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#elif defined( SHADOWMAP_TYPE_VSM )\n		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				shadowCoord.z -= shadowBias;\n			#else\n				shadowCoord.z += shadowBias;\n			#endif\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;\n				float mean = distribution.x;\n				float variance = distribution.y * distribution.y;\n				#ifdef USE_REVERSED_DEPTH_BUFFER\n					float hard_shadow = step( mean, shadowCoord.z );\n				#else\n					float hard_shadow = step( shadowCoord.z, mean );\n				#endif\n				\n				if ( hard_shadow == 1.0 ) {\n					shadow = 1.0;\n				} else {\n					variance = max( variance, 0.0000001 );\n					float d = shadowCoord.z - mean;\n					float p_max = variance / ( variance + d * d );\n					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );\n					shadow = max( hard_shadow, p_max );\n				}\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#else\n		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {\n			float shadow = 1.0;\n			shadowCoord.xyz /= shadowCoord.w;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				shadowCoord.z -= shadowBias;\n			#else\n				shadowCoord.z += shadowBias;\n			#endif\n			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;\n			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;\n			if ( frustumTest ) {\n				float depth = texture2D( shadowMap, shadowCoord.xy ).r;\n				#ifdef USE_REVERSED_DEPTH_BUFFER\n					shadow = step( depth, shadowCoord.z );\n				#else\n					shadow = step( shadowCoord.z, depth );\n				#endif\n			}\n			return mix( 1.0, shadow, shadowIntensity );\n		}\n	#endif\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		float getSunShadow(\n			#if defined( SHADOWMAP_TYPE_PCF )\n				sampler2DShadow shadowMap,\n			#else\n				sampler2D shadowMap,\n			#endif\n			SunLightShadow sunLightShadow,\n			int shadowIndex\n		) {\n			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );\n			float viewDepth = vSunShadowWorldPosition.w;\n			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;\n			float shadow = 1.0;\n			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {\n				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];\n				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {\n					float cascadeShadow = getShadow(\n						shadowMap,\n						sunLightShadow.shadowMapSize,\n						sunLightShadow.shadowIntensity,\n						sunLightShadow.shadowBias,\n						sunLightShadow.shadowRadius,\n						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition\n					);\n					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );\n				}\n			}\n			return shadow;\n		}\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n	#if defined( SHADOWMAP_TYPE_PCF )\n	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n		float shadow = 1.0;\n		vec3 lightToPosition = shadowCoord.xyz;\n		vec3 bd3D = normalize( lightToPosition );\n		vec3 absVec = abs( lightToPosition );\n		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );\n		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );\n				dp -= shadowBias;\n			#else\n				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );\n				dp += shadowBias;\n			#endif\n			float texelSize = shadowRadius / shadowMapSize.x;\n			vec3 absDir = abs( bd3D );\n			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );\n			tangent = normalize( cross( bd3D, tangent ) );\n			vec3 bitangent = cross( bd3D, tangent );\n			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;\n			vec2 sample0 = vogelDiskSample( 0, 5, phi );\n			vec2 sample1 = vogelDiskSample( 1, 5, phi );\n			vec2 sample2 = vogelDiskSample( 2, 5, phi );\n			vec2 sample3 = vogelDiskSample( 3, 5, phi );\n			vec2 sample4 = vogelDiskSample( 4, 5, phi );\n			shadow = (\n				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +\n				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )\n			) * 0.2;\n		}\n		return mix( 1.0, shadow, shadowIntensity );\n	}\n	#elif defined( SHADOWMAP_TYPE_BASIC )\n	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {\n		float shadow = 1.0;\n		vec3 lightToPosition = shadowCoord.xyz;\n		vec3 absVec = abs( lightToPosition );\n		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );\n		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {\n			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );\n			dp += shadowBias;\n			vec3 bd3D = normalize( lightToPosition );\n			float depth = textureCube( shadowMap, bd3D ).r;\n			#ifdef USE_REVERSED_DEPTH_BUFFER\n				depth = 1.0 - depth;\n			#endif\n			shadow = step( dp, depth );\n		}\n		return mix( 1.0, shadow, shadowIntensity );\n	}\n	#endif\n	#endif\n#endif`,Rg=`#if NUM_SPOT_LIGHT_COORDS > 0\n	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];\n	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];\n#endif\n#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		varying vec4 vSunShadowWorldPosition;\n		varying vec3 vSunShadowWorldNormal;\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];\n		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];\n		struct DirectionalLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n		struct SpotLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n		};\n		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];\n		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];\n		struct PointLightShadow {\n			float shadowIntensity;\n			float shadowBias;\n			float shadowNormalBias;\n			float shadowRadius;\n			vec2 shadowMapSize;\n			float shadowCameraNear;\n			float shadowCameraFar;\n		};\n		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];\n	#endif\n#endif`,Pg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )\n	#ifdef HAS_NORMAL\n		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );\n	#else\n		vec3 shadowWorldNormal = vec3( 0.0 );\n	#endif\n	vec4 shadowWorldPosition;\n#endif\n#if defined( USE_SHADOWMAP )\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );\n		vSunShadowWorldNormal = shadowWorldNormal;\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );\n			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;\n		}\n		#pragma unroll_loop_end\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0\n		#pragma unroll_loop_start\n		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );\n			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;\n		}\n		#pragma unroll_loop_end\n	#endif\n#endif\n#if NUM_SPOT_LIGHT_COORDS > 0\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {\n		shadowWorldPosition = worldPosition;\n		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;\n		#endif\n		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;\n	}\n	#pragma unroll_loop_end\n#endif`,Lg=`float getShadowMask() {\n	float shadow = 1.0;\n	#ifdef USE_SHADOWMAP\n	#if NUM_SUN_LIGHT_SHADOWS > 0\n	SunLightShadow sunLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {\n		sunLight = sunLightShadows[ i ];\n		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_DIR_LIGHT_SHADOWS > 0\n	DirectionalLightShadow directionalLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {\n		directionalLight = directionalLightShadows[ i ];\n		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_SPOT_LIGHT_SHADOWS > 0\n	SpotLightShadow spotLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {\n		spotLight = spotLightShadows[ i ];\n		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )\n	PointLightShadow pointLight;\n	#pragma unroll_loop_start\n	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {\n		pointLight = pointLightShadows[ i ];\n		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;\n	}\n	#pragma unroll_loop_end\n	#endif\n	#endif\n	return shadow;\n}`,Ig=`#ifdef USE_SKINNING\n	mat4 boneMatX = getBoneMatrix( skinIndex.x );\n	mat4 boneMatY = getBoneMatrix( skinIndex.y );\n	mat4 boneMatZ = getBoneMatrix( skinIndex.z );\n	mat4 boneMatW = getBoneMatrix( skinIndex.w );\n#endif`,Dg=`#ifdef USE_SKINNING\n	uniform mat4 bindMatrix;\n	uniform mat4 bindMatrixInverse;\n	uniform highp sampler2D boneTexture;\n	mat4 getBoneMatrix( const in float i ) {\n		int size = textureSize( boneTexture, 0 ).x;\n		int j = int( i ) * 4;\n		int x = j % size;\n		int y = j / size;\n		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );\n		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );\n		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );\n		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );\n		return mat4( v1, v2, v3, v4 );\n	}\n#endif`,Ng=`#ifdef USE_SKINNING\n	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );\n	vec4 skinned = vec4( 0.0 );\n	skinned += boneMatX * skinVertex * skinWeight.x;\n	skinned += boneMatY * skinVertex * skinWeight.y;\n	skinned += boneMatZ * skinVertex * skinWeight.z;\n	skinned += boneMatW * skinVertex * skinWeight.w;\n	transformed = ( bindMatrixInverse * skinned ).xyz;\n#endif`,Ug=`#ifdef USE_SKINNING\n	mat4 skinMatrix = mat4( 0.0 );\n	skinMatrix += skinWeight.x * boneMatX;\n	skinMatrix += skinWeight.y * boneMatY;\n	skinMatrix += skinWeight.z * boneMatZ;\n	skinMatrix += skinWeight.w * boneMatW;\n	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;\n	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;\n	#ifdef USE_TANGENT\n		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;\n	#endif\n#endif`,kg=`float specularStrength;\n#ifdef USE_SPECULARMAP\n	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );\n	specularStrength = texelSpecular.r;\n#else\n	specularStrength = 1.0;\n#endif`,Og=`#ifdef USE_SPECULARMAP\n	uniform sampler2D specularMap;\n#endif`,Fg=`#if defined( TONE_MAPPING )\n	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif`,Bg=`#ifndef saturate\n#define saturate( a ) clamp( a, 0.0, 1.0 )\n#endif\nuniform float toneMappingExposure;\nvec3 LinearToneMapping( vec3 color ) {\n	return saturate( toneMappingExposure * color );\n}\nvec3 ReinhardToneMapping( vec3 color ) {\n	color *= toneMappingExposure;\n	return saturate( color / ( vec3( 1.0 ) + color ) );\n}\nvec3 CineonToneMapping( vec3 color ) {\n	color *= toneMappingExposure;\n	color = max( vec3( 0.0 ), color - 0.004 );\n	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );\n}\nvec3 RRTAndODTFit( vec3 v ) {\n	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;\n	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;\n	return a / b;\n}\nvec3 ACESFilmicToneMapping( vec3 color ) {\n	const mat3 ACESInputMat = mat3(\n		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),\n		vec3( 0.04823, 0.01566, 0.83777 )\n	);\n	const mat3 ACESOutputMat = mat3(\n		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),\n		vec3( -0.07367, -0.00605,  1.07602 )\n	);\n	color *= toneMappingExposure / 0.6;\n	color = ACESInputMat * color;\n	color = RRTAndODTFit( color );\n	color = ACESOutputMat * color;\n	return saturate( color );\n}\nconst mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(\n	vec3( 1.6605, - 0.1246, - 0.0182 ),\n	vec3( - 0.5876, 1.1329, - 0.1006 ),\n	vec3( - 0.0728, - 0.0083, 1.1187 )\n);\nconst mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(\n	vec3( 0.6274, 0.0691, 0.0164 ),\n	vec3( 0.3293, 0.9195, 0.0880 ),\n	vec3( 0.0433, 0.0113, 0.8956 )\n);\nvec3 agxDefaultContrastApprox( vec3 x ) {\n	vec3 x2 = x * x;\n	vec3 x4 = x2 * x2;\n	return + 15.5 * x4 * x2\n		- 40.14 * x4 * x\n		+ 31.96 * x4\n		- 6.868 * x2 * x\n		+ 0.4298 * x2\n		+ 0.1191 * x\n		- 0.00232;\n}\nvec3 AgXToneMapping( vec3 color ) {\n	const mat3 AgXInsetMatrix = mat3(\n		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),\n		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),\n		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )\n	);\n	const mat3 AgXOutsetMatrix = mat3(\n		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),\n		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),\n		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )\n	);\n	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;\n	color *= toneMappingExposure;\n	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;\n	color = AgXInsetMatrix * color;\n	color = max( color, 1e-10 );	color = log2( color );\n	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );\n	color = clamp( color, 0.0, 1.0 );\n	color = agxDefaultContrastApprox( color );\n	color = AgXOutsetMatrix * color;\n	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );\n	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;\n	color = clamp( color, 0.0, 1.0 );\n	return color;\n}\nvec3 NeutralToneMapping( vec3 color ) {\n	const float StartCompression = 0.8 - 0.04;\n	const float Desaturation = 0.15;\n	color *= toneMappingExposure;\n	float x = min( color.r, min( color.g, color.b ) );\n	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;\n	color -= offset;\n	float peak = max( color.r, max( color.g, color.b ) );\n	if ( peak < StartCompression ) return color;\n	float d = 1. - StartCompression;\n	float newPeak = 1. - d * d / ( peak + d - StartCompression );\n	color *= newPeak / peak;\n	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );\n	return mix( color, vec3( newPeak ), g );\n}\nvec3 CustomToneMapping( vec3 color ) { return color; }`,zg=`#ifdef USE_TRANSMISSION\n	material.transmission = transmission;\n	material.transmissionAlpha = 1.0;\n	material.thickness = thickness;\n	material.attenuationDistance = attenuationDistance;\n	material.attenuationColor = attenuationColor;\n	#ifdef USE_TRANSMISSIONMAP\n		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;\n	#endif\n	#ifdef USE_THICKNESSMAP\n		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;\n	#endif\n	vec3 pos = vWorldPosition;\n	vec3 v = normalize( cameraPosition - pos );\n	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );\n	vec4 transmitted = getIBLVolumeRefraction(\n		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,\n		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,\n		material.attenuationColor, material.attenuationDistance );\n	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );\n	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );\n#endif`,Hg=`#ifdef USE_TRANSMISSION\n	uniform float transmission;\n	uniform float thickness;\n	uniform float attenuationDistance;\n	uniform vec3 attenuationColor;\n	#ifdef USE_TRANSMISSIONMAP\n		uniform sampler2D transmissionMap;\n	#endif\n	#ifdef USE_THICKNESSMAP\n		uniform sampler2D thicknessMap;\n	#endif\n	uniform vec2 transmissionSamplerSize;\n	uniform sampler2D transmissionSamplerMap;\n	uniform mat4 modelMatrix;\n	uniform mat4 projectionMatrix;\n	varying vec3 vWorldPosition;\n	float w0( float a ) {\n		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );\n	}\n	float w1( float a ) {\n		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );\n	}\n	float w2( float a ){\n		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );\n	}\n	float w3( float a ) {\n		return ( 1.0 / 6.0 ) * ( a * a * a );\n	}\n	float g0( float a ) {\n		return w0( a ) + w1( a );\n	}\n	float g1( float a ) {\n		return w2( a ) + w3( a );\n	}\n	float h0( float a ) {\n		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );\n	}\n	float h1( float a ) {\n		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );\n	}\n	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {\n		uv = uv * texelSize.zw + 0.5;\n		vec2 iuv = floor( uv );\n		vec2 fuv = fract( uv );\n		float g0x = g0( fuv.x );\n		float g1x = g1( fuv.x );\n		float h0x = h0( fuv.x );\n		float h1x = h1( fuv.x );\n		float h0y = h0( fuv.y );\n		float h1y = h1( fuv.y );\n		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;\n		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;\n		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +\n			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );\n	}\n	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {\n		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );\n		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );\n		vec2 fLodSizeInv = 1.0 / fLodSize;\n		vec2 cLodSizeInv = 1.0 / cLodSize;\n		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );\n		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );\n		return mix( fSample, cSample, fract( lod ) );\n	}\n	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {\n		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );\n		vec3 modelScale;\n		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );\n		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );\n		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );\n		return normalize( refractionVector ) * thickness * modelScale;\n	}\n	float applyIorToRoughness( const in float roughness, const in float ior ) {\n		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );\n	}\n	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {\n		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );\n		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );\n	}\n	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {\n		if ( isinf( attenuationDistance ) ) {\n			return vec3( 1.0 );\n		} else {\n			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;\n			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;\n		}\n	}\n	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,\n		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,\n		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,\n		const in vec3 attenuationColor, const in float attenuationDistance ) {\n		vec4 transmittedLight;\n		vec3 transmittance;\n		#ifdef USE_DISPERSION\n			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;\n			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );\n			for ( int i = 0; i < 3; i ++ ) {\n				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );\n				vec3 refractedRayExit = position + transmissionRay;\n				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n				vec2 refractionCoords = ndcPos.xy / ndcPos.w;\n				refractionCoords += 1.0;\n				refractionCoords /= 2.0;\n				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );\n				transmittedLight[ i ] = transmissionSample[ i ];\n				transmittedLight.a += transmissionSample.a;\n				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];\n			}\n			transmittedLight.a /= 3.0;\n		#else\n			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );\n			vec3 refractedRayExit = position + transmissionRay;\n			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );\n			vec2 refractionCoords = ndcPos.xy / ndcPos.w;\n			refractionCoords += 1.0;\n			refractionCoords /= 2.0;\n			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );\n			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );\n		#endif\n		vec3 attenuatedColor = transmittance * transmittedLight.rgb;\n		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );\n		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;\n		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );\n	}\n#endif`,Gg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	varying vec2 vUv;\n#endif\n#ifdef USE_MAP\n	varying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n	varying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n	varying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n	varying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n	varying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n	varying vec2 vNormalMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n	varying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n	varying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	varying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	varying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n	varying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	varying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	varying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	varying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	varying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	varying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	varying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n	varying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	varying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	varying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	uniform mat3 transmissionMapTransform;\n	varying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n	uniform mat3 thicknessMapTransform;\n	varying vec2 vThicknessMapUv;\n#endif`,Vg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	varying vec2 vUv;\n#endif\n#ifdef USE_MAP\n	uniform mat3 mapTransform;\n	varying vec2 vMapUv;\n#endif\n#ifdef USE_ALPHAMAP\n	uniform mat3 alphaMapTransform;\n	varying vec2 vAlphaMapUv;\n#endif\n#ifdef USE_LIGHTMAP\n	uniform mat3 lightMapTransform;\n	varying vec2 vLightMapUv;\n#endif\n#ifdef USE_AOMAP\n	uniform mat3 aoMapTransform;\n	varying vec2 vAoMapUv;\n#endif\n#ifdef USE_BUMPMAP\n	uniform mat3 bumpMapTransform;\n	varying vec2 vBumpMapUv;\n#endif\n#ifdef USE_NORMALMAP\n	uniform mat3 normalMapTransform;\n	varying vec2 vNormalMapUv;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n	uniform mat3 displacementMapTransform;\n	varying vec2 vDisplacementMapUv;\n#endif\n#ifdef USE_EMISSIVEMAP\n	uniform mat3 emissiveMapTransform;\n	varying vec2 vEmissiveMapUv;\n#endif\n#ifdef USE_METALNESSMAP\n	uniform mat3 metalnessMapTransform;\n	varying vec2 vMetalnessMapUv;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	uniform mat3 roughnessMapTransform;\n	varying vec2 vRoughnessMapUv;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	uniform mat3 anisotropyMapTransform;\n	varying vec2 vAnisotropyMapUv;\n#endif\n#ifdef USE_CLEARCOATMAP\n	uniform mat3 clearcoatMapTransform;\n	varying vec2 vClearcoatMapUv;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	uniform mat3 clearcoatNormalMapTransform;\n	varying vec2 vClearcoatNormalMapUv;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	uniform mat3 clearcoatRoughnessMapTransform;\n	varying vec2 vClearcoatRoughnessMapUv;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	uniform mat3 sheenColorMapTransform;\n	varying vec2 vSheenColorMapUv;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	uniform mat3 sheenRoughnessMapTransform;\n	varying vec2 vSheenRoughnessMapUv;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	uniform mat3 iridescenceMapTransform;\n	varying vec2 vIridescenceMapUv;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	uniform mat3 iridescenceThicknessMapTransform;\n	varying vec2 vIridescenceThicknessMapUv;\n#endif\n#ifdef USE_SPECULARMAP\n	uniform mat3 specularMapTransform;\n	varying vec2 vSpecularMapUv;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	uniform mat3 specularColorMapTransform;\n	varying vec2 vSpecularColorMapUv;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	uniform mat3 specularIntensityMapTransform;\n	varying vec2 vSpecularIntensityMapUv;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	uniform mat3 transmissionMapTransform;\n	varying vec2 vTransmissionMapUv;\n#endif\n#ifdef USE_THICKNESSMAP\n	uniform mat3 thicknessMapTransform;\n	varying vec2 vThicknessMapUv;\n#endif`,Wg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )\n	vUv = vec3( uv, 1 ).xy;\n#endif\n#ifdef USE_MAP\n	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ALPHAMAP\n	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_LIGHTMAP\n	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_AOMAP\n	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_BUMPMAP\n	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_NORMALMAP\n	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_DISPLACEMENTMAP\n	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_EMISSIVEMAP\n	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_METALNESSMAP\n	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ROUGHNESSMAP\n	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_ANISOTROPYMAP\n	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOATMAP\n	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_NORMALMAP\n	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_CLEARCOAT_ROUGHNESSMAP\n	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCEMAP\n	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_IRIDESCENCE_THICKNESSMAP\n	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_COLORMAP\n	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SHEEN_ROUGHNESSMAP\n	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULARMAP\n	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_COLORMAP\n	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_SPECULAR_INTENSITYMAP\n	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_TRANSMISSIONMAP\n	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;\n#endif\n#ifdef USE_THICKNESSMAP\n	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;\n#endif`,Xg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0\n	vec4 worldPosition = vec4( transformed, 1.0 );\n	#ifdef USE_BATCHING\n		worldPosition = batchingMatrix * worldPosition;\n	#endif\n	#ifdef USE_INSTANCING\n		worldPosition = instanceMatrix * worldPosition;\n	#endif\n	worldPosition = modelMatrix * worldPosition;\n#endif`,qg=`varying vec2 vUv;\nuniform mat3 uvTransform;\nvoid main() {\n	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n	gl_Position = vec4( position.xy, 1.0, 1.0 );\n}`,Yg=`uniform sampler2D t2D;\nuniform float backgroundIntensity;\nvarying vec2 vUv;\nvoid main() {\n	vec4 texColor = texture2D( t2D, vUv );\n	#ifdef DECODE_VIDEO_TEXTURE\n		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );\n	#endif\n	texColor.rgb *= backgroundIntensity;\n	gl_FragColor = texColor;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}`,Zg=`varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n	gl_Position.z = gl_Position.w;\n}`,$g=`#ifdef ENVMAP_TYPE_CUBE\n	uniform samplerCube envMap;\n#elif defined( ENVMAP_TYPE_CUBE_UV )\n	uniform sampler2D envMap;\n#endif\nuniform float backgroundBlurriness;\nuniform float backgroundIntensity;\nuniform mat3 backgroundRotation;\nvarying vec3 vWorldDirection;\n#include <cube_uv_reflection_fragment>\nvoid main() {\n	#ifdef ENVMAP_TYPE_CUBE\n		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );\n	#elif defined( ENVMAP_TYPE_CUBE_UV )\n		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );\n	#else\n		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n	#endif\n	texColor.rgb *= backgroundIntensity;\n	gl_FragColor = texColor;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}`,Jg=`varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n	gl_Position.z = gl_Position.w;\n}`,jg=`uniform samplerCube tCube;\nuniform float tFlip;\nuniform float opacity;\nvarying vec3 vWorldDirection;\nvoid main() {\n	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );\n	gl_FragColor = texColor;\n	gl_FragColor.a *= opacity;\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}`,Kg=`#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <skinbase_vertex>\n	#include <morphinstance_vertex>\n	#ifdef USE_DISPLACEMENTMAP\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vHighPrecisionZW = gl_Position.zw;\n}`,Qg=`#if DEPTH_PACKING == 3200\n	uniform float opacity;\n#endif\n#include <common>\n#include <packing>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvarying vec2 vHighPrecisionZW;\nvoid main() {\n	vec4 diffuseColor = vec4( 1.0 );\n	#include <clipping_planes_fragment>\n	#if DEPTH_PACKING == 3200\n		diffuseColor.a = opacity;\n	#endif\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <logdepthbuf_fragment>\n	#ifdef USE_REVERSED_DEPTH_BUFFER\n		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];\n	#else\n		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;\n	#endif\n	#if DEPTH_PACKING == 3200\n		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );\n	#elif DEPTH_PACKING == 3201\n		gl_FragColor = packDepthToRGBA( fragCoordZ );\n	#elif DEPTH_PACKING == 3202\n		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );\n	#elif DEPTH_PACKING == 3203\n		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );\n	#endif\n}`,e0=`#define DISTANCE\nvarying vec3 vWorldPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <skinbase_vertex>\n	#include <morphinstance_vertex>\n	#ifdef USE_DISPLACEMENTMAP\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <worldpos_vertex>\n	#include <clipping_planes_vertex>\n	vWorldPosition = worldPosition.xyz;\n}`,t0=`#define DISTANCE\nuniform vec3 referencePosition;\nuniform float nearDistance;\nuniform float farDistance;\nvarying vec3 vWorldPosition;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( 1.0 );\n	#include <clipping_planes_fragment>\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	float dist = length( vWorldPosition - referencePosition );\n	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );\n	dist = saturate( dist );\n	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );\n}`,n0=`varying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vWorldDirection = transformDirection( position, modelMatrix );\n	#include <begin_vertex>\n	#include <project_vertex>\n}`,i0=`uniform sampler2D tEquirect;\nvarying vec3 vWorldDirection;\n#include <common>\nvoid main() {\n	vec3 direction = normalize( vWorldDirection );\n	vec2 sampleUV = equirectUv( direction );\n	gl_FragColor = texture2D( tEquirect, sampleUV );\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n}`,s0=`uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;\n#include <common>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	vLineDistance = scale * lineDistance;\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n}`,r0=`uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;\n#include <common>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	if ( mod( vLineDistance, totalSize ) > dashSize ) {\n		discard;\n	}\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}`,a0=`#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )\n		#include <beginnormal_vertex>\n		#include <morphnormal_vertex>\n		#include <skinbase_vertex>\n		#include <skinnormal_vertex>\n		#include <defaultnormal_vertex>\n	#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <fog_vertex>\n}`,o0=`uniform vec3 diffuse;\nuniform float opacity;\n#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n#endif\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	#ifdef USE_LIGHTMAP\n		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );\n		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;\n	#else\n		reflectedLight.indirectDiffuse += vec3( 1.0 );\n	#endif\n	#include <aomap_fragment>\n	reflectedLight.indirectDiffuse *= diffuseColor.rgb;\n	vec3 outgoingLight = reflectedLight.indirectDiffuse;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}`,l0=`#define LAMBERT\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}`,c0=`#define LAMBERT\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_lambert_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_lambert_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}`,h0=`#define MATCAP\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <color_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n	vViewPosition = - mvPosition.xyz;\n}`,d0=`#define MATCAP\nuniform vec3 diffuse;\nuniform float opacity;\nuniform sampler2D matcap;\nvarying vec3 vViewPosition;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	vec3 viewDir = normalize( vViewPosition );\n	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );\n	vec3 y = cross( viewDir, x );\n	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;\n	#ifdef USE_MATCAP\n		vec4 matcapColor = texture2D( matcap, uv );\n	#else\n		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );\n	#endif\n	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}`,u0=`#define NORMAL\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	varying vec3 vViewPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	vViewPosition = - mvPosition.xyz;\n#endif\n}`,f0=`#define NORMAL\nuniform float opacity;\n#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )\n	varying vec3 vViewPosition;\n#endif\n#include <uv_pars_fragment>\n#include <normal_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );\n	#include <clipping_planes_fragment>\n	#include <logdepthbuf_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );\n	#ifdef OPAQUE\n		gl_FragColor.a = 1.0;\n	#endif\n}`,p0=`#define PHONG\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <envmap_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}`,m0=`#define PHONG\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <specularmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_phong_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n	#include <envmap_fragment>\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}`,g0=`#define STANDARD\nvarying vec3 vViewPosition;\n#ifdef USE_TRANSMISSION\n	varying vec3 vWorldPosition;\n#endif\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n#ifdef USE_TRANSMISSION\n	vWorldPosition = worldPosition.xyz;\n#endif\n}`,x0=`#define STANDARD\n#ifdef PHYSICAL\n	#define IOR\n	#define USE_SPECULAR\n#endif\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\n#ifdef IOR\n	uniform float ior;\n#endif\n#ifdef USE_SPECULAR\n	uniform float specularIntensity;\n	uniform vec3 specularColor;\n	#ifdef USE_SPECULAR_COLORMAP\n		uniform sampler2D specularColorMap;\n	#endif\n	#ifdef USE_SPECULAR_INTENSITYMAP\n		uniform sampler2D specularIntensityMap;\n	#endif\n#endif\n#ifdef USE_CLEARCOAT\n	uniform float clearcoat;\n	uniform float clearcoatRoughness;\n#endif\n#ifdef USE_DISPERSION\n	uniform float dispersion;\n#endif\n#ifdef USE_RETROREFLECTION\n	uniform float retroreflectivity;\n#endif\n#ifdef USE_IRIDESCENCE\n	uniform float iridescence;\n	uniform float iridescenceIOR;\n	uniform float iridescenceThicknessMinimum;\n	uniform float iridescenceThicknessMaximum;\n#endif\n#ifdef USE_SHEEN\n	uniform vec3 sheenColor;\n	uniform float sheenRoughness;\n	#ifdef USE_SHEEN_COLORMAP\n		uniform sampler2D sheenColorMap;\n	#endif\n	#ifdef USE_SHEEN_ROUGHNESSMAP\n		uniform sampler2D sheenRoughnessMap;\n	#endif\n#endif\n#ifdef USE_ANISOTROPY\n	uniform vec2 anisotropyVector;\n	#ifdef USE_ANISOTROPYMAP\n		uniform sampler2D anisotropyMap;\n	#endif\n#endif\nvarying vec3 vViewPosition;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <iridescence_fragment>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_physical_pars_fragment>\n#include <transmission_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <clearcoat_pars_fragment>\n#include <iridescence_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <roughnessmap_fragment>\n	#include <metalnessmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <clearcoat_normal_fragment_begin>\n	#include <clearcoat_normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_physical_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;\n	#include <transmission_fragment>\n	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;\n	#ifdef USE_SHEEN\n \n		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;\n \n 	#endif\n	#ifdef USE_CLEARCOAT\n		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );\n		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );\n		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;\n	#endif\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}`,y0=`#define TOON\nvarying vec3 vViewPosition;\n#include <common>\n#include <batching_pars_vertex>\n#include <uv_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <normal_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <normal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}`,_0=`#define TOON\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float opacity;\n#include <common>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <gradientmap_pars_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <normal_pars_fragment>\n#include <lights_toon_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_toon_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}`,v0=`uniform float size;\nuniform float scale;\n#include <common>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n#ifdef USE_POINTS_UV\n	varying vec2 vUv;\n	uniform mat3 uvTransform;\n#endif\nvoid main() {\n	#ifdef USE_POINTS_UV\n		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n	#endif\n	#include <color_vertex>\n	#include <morphinstance_vertex>\n	#include <morphcolor_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <project_vertex>\n	gl_PointSize = size;\n	#ifdef USE_SIZEATTENUATION\n		bool isPerspective = isPerspectiveMatrix( projectionMatrix );\n		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );\n	#endif\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <worldpos_vertex>\n	#include <fog_vertex>\n}`,b0=`uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <color_pars_fragment>\n#include <map_particle_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_particle_fragment>\n	#include <color_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}`,M0=`#include <common>\n#include <batching_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <shadowmap_pars_vertex>\nvoid main() {\n	#include <batching_vertex>\n	#include <beginnormal_vertex>\n	#include <morphinstance_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <worldpos_vertex>\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}`,S0=`uniform vec3 color;\nuniform float opacity;\n#include <common>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <logdepthbuf_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>\nvoid main() {\n	#include <logdepthbuf_fragment>\n	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n}`,w0=`uniform float rotation;\nuniform vec2 center;\n#include <common>\n#include <uv_pars_vertex>\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\nvoid main() {\n	#include <uv_vertex>\n	vec4 mvPosition = modelViewMatrix[ 3 ];\n	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );\n	#ifndef USE_SIZEATTENUATION\n		bool isPerspective = isPerspectiveMatrix( projectionMatrix );\n		if ( isPerspective ) scale *= - mvPosition.z;\n	#endif\n	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;\n	vec2 rotatedPosition;\n	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;\n	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;\n	mvPosition.xy += rotatedPosition;\n	gl_Position = projectionMatrix * mvPosition;\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	#include <fog_vertex>\n}`,E0=`uniform vec3 diffuse;\nuniform float opacity;\n#include <common>\n#include <uv_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\n#include <alphahash_pars_fragment>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\nvoid main() {\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	#include <clipping_planes_fragment>\n	vec3 outgoingLight = vec3( 0.0 );\n	#include <logdepthbuf_fragment>\n	#include <map_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <alphahash_fragment>\n	outgoingLight = diffuseColor.rgb;\n	#include <opaque_fragment>\n	#include <tonemapping_fragment>\n	#include <colorspace_fragment>\n	#include <fog_fragment>\n}`,He={alphahash_fragment:qp,alphahash_pars_fragment:Yp,alphamap_fragment:Zp,alphamap_pars_fragment:$p,alphatest_fragment:Jp,alphatest_pars_fragment:jp,aomap_fragment:Kp,aomap_pars_fragment:Qp,batching_pars_vertex:em,batching_vertex:tm,begin_vertex:nm,beginnormal_vertex:im,bsdfs:sm,iridescence_fragment:rm,bumpmap_pars_fragment:am,clipping_planes_fragment:om,clipping_planes_pars_fragment:lm,clipping_planes_pars_vertex:cm,clipping_planes_vertex:hm,color_fragment:dm,color_pars_fragment:um,color_pars_vertex:fm,color_vertex:pm,common:mm,cube_uv_reflection_fragment:gm,defaultnormal_vertex:xm,displacementmap_pars_vertex:ym,displacementmap_vertex:_m,emissivemap_fragment:vm,emissivemap_pars_fragment:bm,colorspace_fragment:Mm,colorspace_pars_fragment:Sm,envmap_fragment:wm,envmap_common_pars_fragment:Em,envmap_pars_fragment:Tm,envmap_pars_vertex:Am,envmap_physical_pars_fragment:Fm,envmap_vertex:Cm,fog_vertex:Rm,fog_pars_vertex:Pm,fog_fragment:Lm,fog_pars_fragment:Im,gradientmap_pars_fragment:Dm,lightmap_pars_fragment:Nm,lights_lambert_fragment:Um,lights_lambert_pars_fragment:km,lights_pars_begin:Om,lights_toon_fragment:Bm,lights_toon_pars_fragment:zm,lights_phong_fragment:Hm,lights_phong_pars_fragment:Gm,lights_physical_fragment:Vm,lights_physical_pars_fragment:Wm,lights_fragment_begin:Xm,lights_fragment_maps:qm,lights_fragment_end:Ym,lightprobes_pars_fragment:Zm,logdepthbuf_fragment:$m,logdepthbuf_pars_fragment:Jm,logdepthbuf_pars_vertex:jm,logdepthbuf_vertex:Km,map_fragment:Qm,map_pars_fragment:eg,map_particle_fragment:tg,map_particle_pars_fragment:ng,metalnessmap_fragment:ig,metalnessmap_pars_fragment:sg,morphinstance_vertex:rg,morphcolor_vertex:ag,morphnormal_vertex:og,morphtarget_pars_vertex:lg,morphtarget_vertex:cg,normal_fragment_begin:hg,normal_fragment_maps:dg,normal_pars_fragment:ug,normal_pars_vertex:fg,normal_vertex:pg,normalmap_pars_fragment:mg,clearcoat_normal_fragment_begin:gg,clearcoat_normal_fragment_maps:xg,clearcoat_pars_fragment:yg,iridescence_pars_fragment:_g,opaque_fragment:vg,packing:bg,premultiplied_alpha_fragment:Mg,project_vertex:Sg,dithering_fragment:wg,dithering_pars_fragment:Eg,roughnessmap_fragment:Tg,roughnessmap_pars_fragment:Ag,shadowmap_pars_fragment:Cg,shadowmap_pars_vertex:Rg,shadowmap_vertex:Pg,shadowmask_pars_fragment:Lg,skinbase_vertex:Ig,skinning_pars_vertex:Dg,skinning_vertex:Ng,skinnormal_vertex:Ug,specularmap_fragment:kg,specularmap_pars_fragment:Og,tonemapping_fragment:Fg,tonemapping_pars_fragment:Bg,transmission_fragment:zg,transmission_pars_fragment:Hg,uv_pars_fragment:Gg,uv_pars_vertex:Vg,uv_vertex:Wg,worldpos_vertex:Xg,background_vert:qg,background_frag:Yg,backgroundCube_vert:Zg,backgroundCube_frag:$g,cube_vert:Jg,cube_frag:jg,depth_vert:Kg,depth_frag:Qg,distance_vert:e0,distance_frag:t0,equirect_vert:n0,equirect_frag:i0,linedashed_vert:s0,linedashed_frag:r0,meshbasic_vert:a0,meshbasic_frag:o0,meshlambert_vert:l0,meshlambert_frag:c0,meshmatcap_vert:h0,meshmatcap_frag:d0,meshnormal_vert:u0,meshnormal_frag:f0,meshphong_vert:p0,meshphong_frag:m0,meshphysical_vert:g0,meshphysical_frag:x0,meshtoon_vert:y0,meshtoon_frag:_0,points_vert:v0,points_frag:b0,shadow_vert:M0,shadow_frag:S0,sprite_vert:w0,sprite_frag:E0},ue={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new Re(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new k},probesMax:{value:new k},probesResolution:{value:new k}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new Re(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},Zn={basic:{uniforms:tn([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.fog]),vertexShader:He.meshbasic_vert,fragmentShader:He.meshbasic_frag},lambert:{uniforms:tn([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new ze(0)},envMapIntensity:{value:1}}]),vertexShader:He.meshlambert_vert,fragmentShader:He.meshlambert_frag},phong:{uniforms:tn([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:He.meshphong_vert,fragmentShader:He.meshphong_frag},standard:{uniforms:tn([ue.common,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.roughnessmap,ue.metalnessmap,ue.fog,ue.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag},toon:{uniforms:tn([ue.common,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.gradientmap,ue.fog,ue.lights,{emissive:{value:new ze(0)}}]),vertexShader:He.meshtoon_vert,fragmentShader:He.meshtoon_frag},matcap:{uniforms:tn([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,{matcap:{value:null}}]),vertexShader:He.meshmatcap_vert,fragmentShader:He.meshmatcap_frag},points:{uniforms:tn([ue.points,ue.fog]),vertexShader:He.points_vert,fragmentShader:He.points_frag},dashed:{uniforms:tn([ue.common,ue.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:He.linedashed_vert,fragmentShader:He.linedashed_frag},depth:{uniforms:tn([ue.common,ue.displacementmap]),vertexShader:He.depth_vert,fragmentShader:He.depth_frag},normal:{uniforms:tn([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,{opacity:{value:1}}]),vertexShader:He.meshnormal_vert,fragmentShader:He.meshnormal_frag},sprite:{uniforms:tn([ue.sprite,ue.fog]),vertexShader:He.sprite_vert,fragmentShader:He.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:He.background_vert,fragmentShader:He.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:He.backgroundCube_vert,fragmentShader:He.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:He.cube_vert,fragmentShader:He.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:He.equirect_vert,fragmentShader:He.equirect_frag},distance:{uniforms:tn([ue.common,ue.displacementmap,{referencePosition:{value:new k},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:He.distance_vert,fragmentShader:He.distance_frag},shadow:{uniforms:tn([ue.lights,ue.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:He.shadow_vert,fragmentShader:He.shadow_frag}};Zn.physical={uniforms:tn([Zn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new Re(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new Re},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new Re},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:He.meshphysical_vert,fragmentShader:He.meshphysical_frag};var No={r:0,b:0,g:0},T0=new gt,Tu=new Ue;Tu.set(-1,0,0,0,1,0,0,0,1);function A0(i,e,t,n,s,r){let a=new ze(0),o=s===!0?0:1,l,c,h=null,u=0,d=null;function f(A){let R=A.isScene===!0?A.background:null;if(R&&R.isTexture){let M=A.backgroundBlurriness>0;R=e.get(R,M)}return R}function x(A){let R=!1,M=f(A);M===null?m(a,o):M&&M.isColor&&(m(M,1),R=!0);let S=i.xr.getEnvironmentBlendMode();S==="additive"?t.buffers.color.setClear(0,0,0,1,r):S==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||R)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function b(A,R){let M=f(R);M&&(M.isCubeTexture||M.mapping===Mr)?(c===void 0&&(c=new Je(new en(1,1,1),new xn({name:"BackgroundCubeMaterial",uniforms:Yi(Zn.backgroundCube.uniforms),vertexShader:Zn.backgroundCube.vertexShader,fragmentShader:Zn.backgroundCube.fragmentShader,side:Lt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(S,w,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=M,c.material.uniforms.backgroundBlurriness.value=R.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(T0.makeRotationFromEuler(R.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Tu),c.material.toneMapped=Ye.getTransfer(M.colorSpace)!==tt,(h!==M||u!==M.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,h=M,u=M.version,d=i.toneMapping),c.layers.enableAll(),A.unshift(c,c.geometry,c.material,0,0,null)):M&&M.isTexture&&(l===void 0&&(l=new Je(new Tn(2,2),new xn({name:"BackgroundMaterial",uniforms:Yi(Zn.background.uniforms),vertexShader:Zn.background.vertexShader,fragmentShader:Zn.background.fragmentShader,side:Pi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=M,l.material.uniforms.backgroundIntensity.value=R.backgroundIntensity,l.material.toneMapped=Ye.getTransfer(M.colorSpace)!==tt,M.matrixAutoUpdate===!0&&M.updateMatrix(),l.material.uniforms.uvTransform.value.copy(M.matrix),(h!==M||u!==M.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,h=M,u=M.version,d=i.toneMapping),l.layers.enableAll(),A.unshift(l,l.geometry,l.material,0,0,null))}function m(A,R){A.getRGB(No,dc(i)),t.buffers.color.setClear(No.r,No.g,No.b,R,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(A,R=1){a.set(A),o=R,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(A){o=A,m(a,o)},render:x,addToRenderList:b,dispose:p}}function C0(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,a=!1;function o(U,F,G,D,V){let J=!1,j=u(U,D,G,F);r!==j&&(r=j,c(r.object)),J=f(U,D,G,V),J&&x(U,D,G,V),V!==null&&e.update(V,i.ELEMENT_ARRAY_BUFFER),(J||a)&&(a=!1,M(U,F,G,D),V!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(V).buffer))}function l(){return i.createVertexArray()}function c(U){return i.bindVertexArray(U)}function h(U){return i.deleteVertexArray(U)}function u(U,F,G,D){let V=D.wireframe===!0,J=n[F.id];J===void 0&&(J={},n[F.id]=J);let j=U.isInstancedMesh===!0?U.id:0,se=J[j];se===void 0&&(se={},J[j]=se);let Y=se[G.id];Y===void 0&&(Y={},se[G.id]=Y);let te=Y[V];return te===void 0&&(te=d(l()),Y[V]=te),te}function d(U){let F=[],G=[],D=[];for(let V=0;V<t;V++)F[V]=0,G[V]=0,D[V]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:F,enabledAttributes:G,attributeDivisors:D,object:U,attributes:{},index:null}}function f(U,F,G,D){let V=r.attributes,J=F.attributes,j=0,se=G.getAttributes();for(let Y in se)if(se[Y].location>=0){let ie=V[Y],Ce=J[Y];if(Ce===void 0&&(Y==="instanceMatrix"&&U.instanceMatrix&&(Ce=U.instanceMatrix),Y==="instanceColor"&&U.instanceColor&&(Ce=U.instanceColor)),ie===void 0||ie.attribute!==Ce||Ce&&ie.data!==Ce.data)return!0;j++}return r.attributesNum!==j||r.index!==D}function x(U,F,G,D){let V={},J=F.attributes,j=0,se=G.getAttributes();for(let Y in se)if(se[Y].location>=0){let ie=J[Y];ie===void 0&&(Y==="instanceMatrix"&&U.instanceMatrix&&(ie=U.instanceMatrix),Y==="instanceColor"&&U.instanceColor&&(ie=U.instanceColor));let Ce={};Ce.attribute=ie,ie&&ie.data&&(Ce.data=ie.data),V[Y]=Ce,j++}r.attributes=V,r.attributesNum=j,r.index=D}function b(){let U=r.newAttributes;for(let F=0,G=U.length;F<G;F++)U[F]=0}function m(U){p(U,0)}function p(U,F){let G=r.newAttributes,D=r.enabledAttributes,V=r.attributeDivisors;G[U]=1,D[U]===0&&(i.enableVertexAttribArray(U),D[U]=1),V[U]!==F&&(i.vertexAttribDivisor(U,F),V[U]=F)}function A(){let U=r.newAttributes,F=r.enabledAttributes;for(let G=0,D=F.length;G<D;G++)F[G]!==U[G]&&(i.disableVertexAttribArray(G),F[G]=0)}function R(U,F,G,D,V,J,j){j===!0?i.vertexAttribIPointer(U,F,G,V,J):i.vertexAttribPointer(U,F,G,D,V,J)}function M(U,F,G,D){b();let V=D.attributes,J=G.getAttributes(),j=F.defaultAttributeValues;for(let se in J){let Y=J[se];if(Y.location>=0){let te=V[se];if(te===void 0&&(se==="instanceMatrix"&&U.instanceMatrix&&(te=U.instanceMatrix),se==="instanceColor"&&U.instanceColor&&(te=U.instanceColor)),te!==void 0){let ie=te.normalized,Ce=te.itemSize,Te=e.get(te);if(Te===void 0)continue;let ct=Te.buffer,Ze=Te.type,Ke=Te.bytesPerElement,Z=Ze===i.INT||Ze===i.UNSIGNED_INT||te.gpuType===Za;if(te.isInterleavedBufferAttribute){let ee=te.data,_e=ee.stride,ke=te.offset;if(ee.isInstancedInterleavedBuffer){for(let xe=0;xe<Y.locationSize;xe++)p(Y.location+xe,ee.meshPerAttribute);U.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let xe=0;xe<Y.locationSize;xe++)m(Y.location+xe);i.bindBuffer(i.ARRAY_BUFFER,ct);for(let xe=0;xe<Y.locationSize;xe++)R(Y.location+xe,Ce/Y.locationSize,Ze,ie,_e*Ke,(ke+Ce/Y.locationSize*xe)*Ke,Z)}else{if(te.isInstancedBufferAttribute){for(let ee=0;ee<Y.locationSize;ee++)p(Y.location+ee,te.meshPerAttribute);U.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let ee=0;ee<Y.locationSize;ee++)m(Y.location+ee);i.bindBuffer(i.ARRAY_BUFFER,ct);for(let ee=0;ee<Y.locationSize;ee++)R(Y.location+ee,Ce/Y.locationSize,Ze,ie,Ce*Ke,Ce/Y.locationSize*ee*Ke,Z)}}else if(j!==void 0){let ie=j[se];if(ie!==void 0)switch(ie.length){case 2:i.vertexAttrib2fv(Y.location,ie);break;case 3:i.vertexAttrib3fv(Y.location,ie);break;case 4:i.vertexAttrib4fv(Y.location,ie);break;default:i.vertexAttrib1fv(Y.location,ie)}}}}A()}function S(){T();for(let U in n){let F=n[U];for(let G in F){let D=F[G];for(let V in D){let J=D[V];for(let j in J)h(J[j].object),delete J[j];delete D[V]}}delete n[U]}}function w(U){if(n[U.id]===void 0)return;let F=n[U.id];for(let G in F){let D=F[G];for(let V in D){let J=D[V];for(let j in J)h(J[j].object),delete J[j];delete D[V]}}delete n[U.id]}function C(U){for(let F in n){let G=n[F];for(let D in G){let V=G[D];if(V[U.id]===void 0)continue;let J=V[U.id];for(let j in J)h(J[j].object),delete J[j];delete V[U.id]}}}function y(U){for(let F in n){let G=n[F],D=U.isInstancedMesh===!0?U.id:0,V=G[D];if(V!==void 0){for(let J in V){let j=V[J];for(let se in j)h(j[se].object),delete j[se];delete V[J]}delete G[D],Object.keys(G).length===0&&delete n[F]}}}function T(){L(),a=!0,r!==s&&(r=s,c(r.object))}function L(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:T,resetDefaultState:L,dispose:S,releaseStatesOfGeometry:w,releaseStatesOfObject:y,releaseStatesOfProgram:C,initAttributes:b,enableAttribute:m,disableUnusedAttributes:A}}function R0(i,e,t){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let d=0;for(let f=0;f<h;f++)d+=c[f];t.update(d,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function P0(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(C){return!(C!==An&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){let y=C===Fn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==dn&&C!==On&&!y&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Le("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&Le("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),A=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),R=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),S=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:x,maxTextureSize:b,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:A,maxVaryings:R,maxFragmentUniforms:M,maxSamples:S,samples:w}}function L0(i){let e=this,t=null,n=0,s=!1,r=!1,a=new an,o=new Ue,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||s;return s=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){let x=u.clippingPlanes,b=u.clipIntersection,m=u.clipShadows,p=i.get(u);if(!s||x===null||x.length===0||r&&!m)r?h(null):c();else{let A=r?0:n,R=A*4,M=p.clippingState||null;l.value=M,M=h(x,d,R,f);for(let S=0;S!==R;++S)M[S]=t[S];p.clippingState=M,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=A}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,x){let b=u!==null?u.length:0,m=null;if(b!==0){if(m=l.value,x!==!0||m===null){let p=f+b*4,A=d.matrixWorldInverse;o.getNormalMatrix(A),(m===null||m.length<p)&&(m=new Float32Array(p));for(let R=0,M=f;R!==b;++R,M+=4)a.copy(u[R]).applyMatrix4(A,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,m}}var zs=4,I0=6,D0=20,N0=256,Pr=new Ls,su=new ze,vc=null,bc=0,Mc=0,Sc=!1,U0=new k,Zi=new k,ko=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=U0}=r;vc=this._renderer.getRenderTarget(),bc=this._renderer.getActiveCubeFace(),Mc=this._renderer.getActiveMipmapLevel(),Sc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,s,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ou(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=au(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(vc,bc,Mc),this._renderer.xr.enabled=Sc,e.scissorTest=!1,Bs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Li||e.mapping===qi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),vc=this._renderer.getRenderTarget(),bc=this._renderer.getActiveCubeFace(),Mc=this._renderer.getActiveMipmapLevel(),Sc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Xt,minFilter:Xt,generateMipmaps:!1,type:Fn,format:An,colorSpace:nr,depthBuffer:!1},s=ru(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ru(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=k0(r)),this._blurMaterial=F0(r,e,t),this._ggxMaterial=O0(r,e,t)}return s}_compileMaterial(e){let t=new Je(new gn,e);this._renderer.compile(t,Pr)}_sceneToCubeUV(e,t,n,s,r){let l=new Jt(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(su),u.toneMapping=Un,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(s),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Je(new en,new Qt({name:"PMREM.Background",side:Lt,depthWrite:!1,depthTest:!1})));let b=this._backgroundBox,m=b.material,p=!1,A=e.background;A?A.isColor&&(m.color.copy(A),e.background=null,p=!0):(m.color.copy(su),p=!0);for(let R=0;R<6;R++){let M=R%3;M===0?(l.up.set(0,c[R],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[R],r.y,r.z)):M===1?(l.up.set(0,0,c[R]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[R],r.z)):(l.up.set(0,c[R],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[R]));let S=this._cubeSize;Bs(s,M*S,R>2?S:0,S,S),u.setRenderTarget(s),p&&u.render(b,l),u.render(e,l)}u.toneMapping=f,u.autoClear=d,e.background=A}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Li||e.mapping===qi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ou()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=au());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;Bs(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,Pr)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),d=c*1.25,f=u*d,{_lodMax:x}=this,b=this._sizeLods[n],m=3*b*(n>x-zs?n-x+zs:0),p=4*(this._cubeSize-b);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=x-t,Bs(r,m,p,3*b,2*b),s.setRenderTarget(r),s.render(o,Pr),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=x-n,Bs(e,m,p,3*b,2*b),s.setRenderTarget(e),s.render(o,Pr)}_blur(e,t,n,s){let r=this._pingPongRenderTarget,a=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,n,a),this._blurPass(r,e,n,n,a)}_blurPass(e,t,n,s,r){let a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-n;let h=this._sizeLods[s],u=3*h*(s>this._lodMax-zs?s-this._lodMax+zs:0),d=4*(this._cubeSize-h);Bs(t,u,d,3*h,2*h),a.setRenderTarget(t),a.render(l,Pr)}};function k0(i){let e=[],t=[],n=i,s=i-zs+1+I0;for(let r=0;r<s;r++){let a=Math.pow(2,n);e.push(a);let o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],u=6,d=6,f=3,x=new Float32Array(f*d*u),b=new Float32Array(f*d*u);for(let p=0;p<u;p++){let A=p%3*2/3-1,R=p>2?0:-1,M=[A,R,0,A+2/3,R,0,A+2/3,R+1,0,A,R,0,A+2/3,R+1,0,A,R+1,0];x.set(M,f*d*p);for(let S=0;S<d;S++){let w=h[S*2]*2-1,C=h[S*2+1]*2-1;p===0?Zi.set(1,C,w):p===1?Zi.set(-w,1,-C):p===2?Zi.set(-w,C,1):p===3?Zi.set(-1,C,-w):p===4?Zi.set(-w,-1,C):Zi.set(w,C,-1),Zi.toArray(b,(p*d+S)*f)}}let m=new gn;m.setAttribute("position",new En(x,f)),m.setAttribute("outputDirection",new En(b,f)),t.push(new Je(m,null)),n>zs&&n--}return{lodMeshes:t,sizeLods:e}}function ru(i,e,t){let n=new hn(i,e,t);return n.texture.mapping=Mr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Bs(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function O0(i,e,t){return new xn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:N0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Bo(),fragmentShader:`\n\n			precision highp float;\n			precision highp int;\n\n			varying vec3 vOutputDirection;\n\n			uniform sampler2D envMap;\n			uniform float roughness;\n			uniform float mipInt;\n\n			#define ENVMAP_TYPE_CUBE_UV\n			#include <cube_uv_reflection_fragment>\n\n			#define PI 3.14159265359\n\n			// Van der Corput radical inverse\n			float radicalInverse_VdC(uint bits) {\n				bits = (bits << 16u) | (bits >> 16u);\n				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);\n				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);\n				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);\n				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);\n				return float(bits) * 2.3283064365386963e-10; // / 0x100000000\n			}\n\n			// Hammersley sequence\n			vec2 hammersley(uint i, uint N) {\n				return vec2(float(i) / float(N), radicalInverse_VdC(i));\n			}\n\n			// GGX VNDF importance sampling (Eric Heitz 2018)\n			// "Sampling the GGX Distribution of Visible Normals"\n			// https://jcgt.org/published/0007/04/01/\n			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {\n				float alpha = roughness * roughness;\n\n				// Section 4.1: Orthonormal basis\n				vec3 T1 = vec3(1.0, 0.0, 0.0);\n				vec3 T2 = cross(V, T1);\n\n				// Section 4.2: Parameterization of projected area\n				float r = sqrt(Xi.x);\n				float phi = 2.0 * PI * Xi.y;\n				float t1 = r * cos(phi);\n				float t2 = r * sin(phi);\n				float s = 0.5 * (1.0 + V.z);\n				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;\n\n				// Section 4.3: Reprojection onto hemisphere\n				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;\n\n				// Section 3.4: Transform back to ellipsoid configuration\n				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));\n			}\n\n			void main() {\n				vec3 N = normalize(vOutputDirection);\n				vec3 V = N; // Assume view direction equals normal for pre-filtering\n\n				vec3 prefilteredColor = vec3(0.0);\n				float totalWeight = 0.0;\n\n				// For very low roughness, just sample the environment directly\n				if (roughness < 0.001) {\n					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);\n					return;\n				}\n\n				// Tangent space basis for VNDF sampling\n				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);\n				vec3 tangent = normalize(cross(up, N));\n				vec3 bitangent = cross(N, tangent);\n\n				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {\n					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));\n\n					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)\n					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);\n\n					// Transform H back to world space\n					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);\n					vec3 L = normalize(2.0 * dot(V, H) * H - V);\n\n					float NdotL = max(dot(N, L), 0.0);\n\n					if(NdotL > 0.0) {\n						// Sample environment at fixed mip level\n						// VNDF importance sampling handles the distribution filtering\n						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);\n\n						// Weight by NdotL for the split-sum approximation\n						// VNDF PDF naturally accounts for the visible microfacet distribution\n						prefilteredColor += sampleColor * NdotL;\n						totalWeight += NdotL;\n					}\n				}\n\n				if (totalWeight > 0.0) {\n					prefilteredColor = prefilteredColor / totalWeight;\n				}\n\n				gl_FragColor = vec4(prefilteredColor, 1.0);\n			}\n		`,blending:qn,depthTest:!1,depthWrite:!1})}function F0(i,e,t){return new xn({name:"SphericalGaussianBlur",defines:{SAMPLES:D0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Bo(),fragmentShader:`\n\n			precision highp float;\n			precision highp int;\n\n			varying vec3 vOutputDirection;\n\n			uniform sampler2D envMap;\n			uniform float sigma;\n			uniform float mipInt;\n\n			#define ENVMAP_TYPE_CUBE_UV\n			#include <cube_uv_reflection_fragment>\n\n			#define PI 3.14159265359\n			#define GOLDEN_ANGLE 2.39996322973\n\n			void main() {\n\n				if ( sigma == 0.0 ) {\n\n					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );\n					return;\n\n				}\n\n				vec3 outputDirection = normalize( vOutputDirection );\n\n				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );\n				vec3 tangent = normalize( cross( up, outputDirection ) );\n				vec3 bitangent = cross( outputDirection, tangent );\n\n				// Truncate the kernel at three standard deviations or at the antipode.\n				float thetaMax = min( 3.0 * sigma, PI );\n				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );\n\n				vec3 accumColor = vec3( 0.0 );\n				float accumWeight = 0.0;\n\n				for ( int i = 0; i < SAMPLES; i ++ ) {\n\n					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.\n					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );\n					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );\n					float phi = float( i ) * GOLDEN_ANGLE;\n\n					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;\n					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;\n\n					// Correct the planar sample density to solid angle.\n					float weight = sin( theta ) / theta;\n\n					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );\n					accumWeight += weight;\n\n				}\n\n				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );\n\n			}\n		`,blending:qn,depthTest:!1,depthWrite:!1})}function au(){return new xn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Bo(),fragmentShader:`\n\n			precision mediump float;\n			precision mediump int;\n\n			varying vec3 vOutputDirection;\n\n			uniform sampler2D envMap;\n\n			#include <common>\n\n			void main() {\n\n				vec3 outputDirection = normalize( vOutputDirection );\n				vec2 uv = equirectUv( outputDirection );\n\n				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );\n\n			}\n		`,blending:qn,depthTest:!1,depthWrite:!1})}function ou(){return new xn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Bo(),fragmentShader:`\n\n			precision mediump float;\n			precision mediump int;\n\n			uniform float flipEnvMap;\n\n			varying vec3 vOutputDirection;\n\n			uniform samplerCube envMap;\n\n			void main() {\n\n				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );\n\n			}\n		`,blending:qn,depthTest:!1,depthWrite:!1})}function Bo(){return`\n\n		precision mediump float;\n		precision mediump int;\n\n		attribute vec3 outputDirection;\n\n		varying vec3 vOutputDirection;\n\n		void main() {\n\n			vOutputDirection = outputDirection;\n			gl_Position = vec4( position, 1.0 );\n\n		}\n	`}var Oo=class extends hn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new hr(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`\n\n				varying vec3 vWorldDirection;\n\n				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {\n\n					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );\n\n				}\n\n				void main() {\n\n					vWorldDirection = transformDirection( position, modelMatrix );\n\n					#include <begin_vertex>\n					#include <project_vertex>\n\n				}\n			`,fragmentShader:`\n\n				uniform sampler2D tEquirect;\n\n				varying vec3 vWorldDirection;\n\n				#include <common>\n\n				void main() {\n\n					vec3 direction = normalize( vWorldDirection );\n\n					vec2 sampleUV = equirectUv( direction );\n\n					gl_FragColor = texture2D( tEquirect, sampleUV );\n\n				}\n			`},s=new en(5,5,5),r=new xn({name:"CubemapFromEquirect",uniforms:Yi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Lt,blending:qn});r.uniforms.tEquirect.value=t;let a=new Je(s,r),o=t.minFilter;return t.minFilter===Ii&&(t.minFilter=Xt),new Ha(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}};function B0(i){let e=new WeakMap,t=new WeakMap,n=null;function s(d,f=!1){return d==null?null:f?a(d):r(d)}function r(d){if(d&&d.isTexture){let f=d.mapping;if(f===Xa||f===qa)if(e.has(d)){let x=e.get(d).texture;return o(x,d.mapping)}else{let x=d.image;if(x&&x.height>0){let b=new Oo(x.height);return b.fromEquirectangularTexture(i,d),e.set(d,b),d.addEventListener("dispose",c),o(b.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){let f=d.mapping,x=f===Xa||f===qa,b=f===Li||f===qi;if(x||b){let m=t.get(d),p=m!==void 0?m.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return n===null&&(n=new ko(i)),m=x?n.fromEquirectangular(d,m):n.fromCubemap(d,m),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),m.texture;if(m!==void 0)return m.texture;{let A=d.image;return x&&A&&A.height>0||b&&A&&l(A)?(n===null&&(n=new ko(i)),m=x?n.fromEquirectangular(d):n.fromCubemap(d),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),d.addEventListener("dispose",h),m.texture):null}}}return d}function o(d,f){return f===Xa?d.mapping=Li:f===qa&&(d.mapping=qi),d}function l(d){let f=0,x=6;for(let b=0;b<x;b++)d[b]!==void 0&&f++;return f===x}function c(d){let f=d.target;f.removeEventListener("dispose",c);let x=e.get(f);x!==void 0&&(e.delete(f),x.dispose())}function h(d){let f=d.target;f.removeEventListener("dispose",h);let x=t.get(f);x!==void 0&&(t.delete(f),x.dispose())}function u(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:u}}function z0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Hi("WebGLRenderer: "+n+" extension not supported."),s}}}function H0(i,e,t,n){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let x in d.attributes)e.remove(d.attributes[x]);d.removeEventListener("dispose",a),delete s[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let f in d)e.update(d[f],i.ARRAY_BUFFER)}function c(u){let d=[],f=u.index,x=u.attributes.position,b=0;if(x===void 0)return;if(f!==null){let A=f.array;b=f.version;for(let R=0,M=A.length;R<M;R+=3){let S=A[R+0],w=A[R+1],C=A[R+2];d.push(S,w,w,C,C,S)}}else{let A=x.array;b=x.version;for(let R=0,M=A.length/3-1;R<M;R+=3){let S=R+0,w=R+1,C=R+2;d.push(S,w,w,C,C,S)}}let m=new(x.count>=65535?cr:lr)(d,1);m.version=b;let p=r.get(u);p&&e.remove(p),r.set(u,m)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function G0(i,e,t){let n;function s(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,d){i.drawElements(n,d,r,u*a),t.update(d,n,1)}function c(u,d,f){f!==0&&(i.drawElementsInstanced(n,d,r,u*a,f),t.update(d,n,f))}function h(u,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,u,0,f);let b=0;for(let m=0;m<f;m++)b+=d[m];t.update(b,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function V0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Ie("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function W0(i,e,t){let n=new WeakMap,s=new xt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0,d=n.get(o);if(d===void 0||d.count!==u){let T=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",T)};d!==void 0&&d.texture.dispose();let f=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,b=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],A=o.morphAttributes.color||[],R=0;f===!0&&(R=1),x===!0&&(R=2),b===!0&&(R=3);let M=o.attributes.position.count*R,S=1;M>e.maxTextureSize&&(S=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let w=new Float32Array(M*S*4*u),C=new rr(w,M,S,u);C.type=On,C.needsUpdate=!0;let y=R*4;for(let L=0;L<u;L++){let U=m[L],F=p[L],G=A[L],D=M*S*4*L;for(let V=0;V<U.count;V++){let J=V*y;f===!0&&(s.fromBufferAttribute(U,V),w[D+J+0]=s.x,w[D+J+1]=s.y,w[D+J+2]=s.z,w[D+J+3]=0),x===!0&&(s.fromBufferAttribute(F,V),w[D+J+4]=s.x,w[D+J+5]=s.y,w[D+J+6]=s.z,w[D+J+7]=0),b===!0&&(s.fromBufferAttribute(G,V),w[D+J+8]=s.x,w[D+J+9]=s.y,w[D+J+10]=s.z,w[D+J+11]=G.itemSize===4?s.w:1)}}d={count:u,texture:C,size:new Re(M,S)},n.set(o,d),o.addEventListener("dispose",T)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let f=0;for(let b=0;b<c.length;b++)f+=c[b];let x=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function X0(i,e,t,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,u=c.geometry,d=e.get(c,u);if(r.get(d)!==h&&(e.update(d),r.set(d,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return d}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}var q0={[Yl]:"LINEAR_TONE_MAPPING",[Zl]:"REINHARD_TONE_MAPPING",[$l]:"CINEON_TONE_MAPPING",[Jl]:"ACES_FILMIC_TONE_MAPPING",[Kl]:"AGX_TONE_MAPPING",[Ql]:"NEUTRAL_TONE_MAPPING",[jl]:"CUSTOM_TONE_MAPPING"};function Y0(i,e,t,n,s,r){let a=new hn(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new gn;c.setAttribute("position",new St([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new St([0,2,0,0,2,0],2));let h=new Aa({uniforms:{tDiffuse:{value:null}},vertexShader:`\n			precision highp float;\n\n			uniform mat4 modelViewMatrix;\n			uniform mat4 projectionMatrix;\n\n			attribute vec3 position;\n			attribute vec2 uv;\n\n			varying vec2 vUv;\n\n			void main() {\n				vUv = uv;\n				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n			}`,fragmentShader:`\n			precision highp float;\n\n			uniform sampler2D tDiffuse;\n\n			varying vec2 vUv;\n\n			#include <tonemapping_pars_fragment>\n			#include <colorspace_pars_fragment>\n\n			void main() {\n				gl_FragColor = texture2D( tDiffuse, vUv );\n\n				#ifdef LINEAR_TONE_MAPPING\n					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );\n				#elif defined( REINHARD_TONE_MAPPING )\n					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );\n				#elif defined( CINEON_TONE_MAPPING )\n					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );\n				#elif defined( ACES_FILMIC_TONE_MAPPING )\n					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );\n				#elif defined( AGX_TONE_MAPPING )\n					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );\n				#elif defined( NEUTRAL_TONE_MAPPING )\n					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );\n				#elif defined( CUSTOM_TONE_MAPPING )\n					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );\n				#endif\n\n				#ifdef SRGB_TRANSFER\n					gl_FragColor = sRGBTransferOETF( gl_FragColor );\n				#endif\n			}`,depthTest:!1,depthWrite:!1}),u=new Je(c,h),d=new Ls(-1,1,1,-1,0,1),f=null,x=null,b=!1,m,p=null,A=[],R=!1;this.setSize=function(M,S){a.setSize(M,S),o!==null&&o.setSize(M,S),l!==null&&l.setSize(M,S);for(let w=0;w<A.length;w++){let C=A[w];C.setSize&&C.setSize(M,S)}},this.setEffects=function(M){A=M,R=A.length>0&&A[0].isRenderPass===!0;let S=a.width,w=a.height;A.length>0&&o===null&&(o=new hn(S,w,{type:Fn,depthBuffer:!1,stencilBuffer:!1}),l=new hn(S,w,{type:Fn,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<A.length;C++){let y=A[C];y.setSize&&y.setSize(S,w)}},this.begin=function(M,S){if(b||M.toneMapping===Un&&A.length===0)return!1;if(p=S,S!==null){let w=S.width,C=S.height;(a.width!==w||a.height!==C)&&this.setSize(w,C)}return R===!1&&M.setRenderTarget(a),m=M.toneMapping,M.toneMapping=Un,!0},this.hasRenderPass=function(){return R},this.end=function(M,S){M.toneMapping=m,b=!0;let w=a,C=o;for(let y=0;y<A.length;y++){let T=A[y];T.enabled!==!1&&(T.render(M,C,w,S),T.needsSwap!==!1&&(w=C,C=C===o?l:o))}if(f!==M.outputColorSpace||x!==M.toneMapping){f=M.outputColorSpace,x=M.toneMapping,h.defines={},Ye.getTransfer(f)===tt&&(h.defines.SRGB_TRANSFER="");let y=q0[x];y&&(h.defines[y]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=w.texture,M.setRenderTarget(p),M.render(u,d),p=null,b=!1},this.isCompositing=function(){return b},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var Au=new on,Tc=new wi(1,1),Cu=new rr,Ru=new wa,Pu=new hr,lu=[],cu=[],hu=new Float32Array(16),du=new Float32Array(9),uu=new Float32Array(4);function Gs(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=lu[s];if(r===void 0&&(r=new Float32Array(s),lu[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Ut(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function kt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function zo(i,e){let t=cu[e];t===void 0&&(t=new Int32Array(e),cu[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Z0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function $0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;i.uniform2fv(this.addr,e),kt(t,e)}}function J0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ut(t,e))return;i.uniform3fv(this.addr,e),kt(t,e)}}function j0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;i.uniform4fv(this.addr,e),kt(t,e)}}function K0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ut(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),kt(t,e)}else{if(Ut(t,n))return;uu.set(n),i.uniformMatrix2fv(this.addr,!1,uu),kt(t,n)}}function Q0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ut(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),kt(t,e)}else{if(Ut(t,n))return;du.set(n),i.uniformMatrix3fv(this.addr,!1,du),kt(t,n)}}function ex(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Ut(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),kt(t,e)}else{if(Ut(t,n))return;hu.set(n),i.uniformMatrix4fv(this.addr,!1,hu),kt(t,n)}}function tx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function nx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;i.uniform2iv(this.addr,e),kt(t,e)}}function ix(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;i.uniform3iv(this.addr,e),kt(t,e)}}function sx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;i.uniform4iv(this.addr,e),kt(t,e)}}function rx(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function ax(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;i.uniform2uiv(this.addr,e),kt(t,e)}}function ox(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;i.uniform3uiv(this.addr,e),kt(t,e)}}function lx(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;i.uniform4uiv(this.addr,e),kt(t,e)}}function cx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Tc.compareFunction=t.isReversedDepthBuffer()?Do:Io,r=Tc):r=Au,t.setTexture2D(e||r,s)}function hx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Ru,s)}function dx(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Pu,s)}function ux(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Cu,s)}function fx(i){switch(i){case 5126:return Z0;case 35664:return $0;case 35665:return J0;case 35666:return j0;case 35674:return K0;case 35675:return Q0;case 35676:return ex;case 5124:case 35670:return tx;case 35667:case 35671:return nx;case 35668:case 35672:return ix;case 35669:case 35673:return sx;case 5125:return rx;case 36294:return ax;case 36295:return ox;case 36296:return lx;case 35678:case 36198:case 36298:case 36306:case 35682:return cx;case 35679:case 36299:case 36307:return hx;case 35680:case 36300:case 36308:case 36293:return dx;case 36289:case 36303:case 36311:case 36292:return ux}}function px(i,e){i.uniform1fv(this.addr,e)}function mx(i,e){let t=Gs(e,this.size,2);i.uniform2fv(this.addr,t)}function gx(i,e){let t=Gs(e,this.size,3);i.uniform3fv(this.addr,t)}function xx(i,e){let t=Gs(e,this.size,4);i.uniform4fv(this.addr,t)}function yx(i,e){let t=Gs(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function _x(i,e){let t=Gs(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function vx(i,e){let t=Gs(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function bx(i,e){i.uniform1iv(this.addr,e)}function Mx(i,e){i.uniform2iv(this.addr,e)}function Sx(i,e){i.uniform3iv(this.addr,e)}function wx(i,e){i.uniform4iv(this.addr,e)}function Ex(i,e){i.uniform1uiv(this.addr,e)}function Tx(i,e){i.uniform2uiv(this.addr,e)}function Ax(i,e){i.uniform3uiv(this.addr,e)}function Cx(i,e){i.uniform4uiv(this.addr,e)}function Rx(i,e,t){let n=this.cache,s=e.length,r=zo(t,s);Ut(n,r)||(i.uniform1iv(this.addr,r),kt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=Tc:a=Au;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function Px(i,e,t){let n=this.cache,s=e.length,r=zo(t,s);Ut(n,r)||(i.uniform1iv(this.addr,r),kt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Ru,r[a])}function Lx(i,e,t){let n=this.cache,s=e.length,r=zo(t,s);Ut(n,r)||(i.uniform1iv(this.addr,r),kt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Pu,r[a])}function Ix(i,e,t){let n=this.cache,s=e.length,r=zo(t,s);Ut(n,r)||(i.uniform1iv(this.addr,r),kt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Cu,r[a])}function Dx(i){switch(i){case 5126:return px;case 35664:return mx;case 35665:return gx;case 35666:return xx;case 35674:return yx;case 35675:return _x;case 35676:return vx;case 5124:case 35670:return bx;case 35667:case 35671:return Mx;case 35668:case 35672:return Sx;case 35669:case 35673:return wx;case 5125:return Ex;case 36294:return Tx;case 36295:return Ax;case 36296:return Cx;case 35678:case 36198:case 36298:case 36306:case 35682:return Rx;case 35679:case 36299:case 36307:return Px;case 35680:case 36300:case 36308:case 36293:return Lx;case 36289:case 36303:case 36311:case 36292:return Ix}}var Ac=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=fx(t.type)}},Cc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Dx(t.type)}},Rc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},wc=/(\\w+)(\\])?(\\[|\\.)?/g;function fu(i,e){i.seq.push(e),i.map[e.id]=e}function Nx(i,e,t){let n=i.name,s=n.length;for(wc.lastIndex=0;;){let r=wc.exec(n),a=wc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){fu(t,c===void 0?new Ac(o,i,e):new Cc(o,i,e));break}else{let u=t.map[o];u===void 0&&(u=new Rc(o),fu(t,u)),t=u}}}var Hs=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);Nx(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function pu(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Ux=37297,kx=0;function Ox(i,e){let t=i.split(`\n`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`\n`)}var mu=new Ue;function Fx(i){Ye._getMatrix(mu,Ye.workingColorSpace,i);let e=`mat3( ${mu.elements.map(t=>t.toFixed(4))} )`;switch(Ye.getTransfer(i)){case ir:return[e,"LinearTransferOETF"];case tt:return[e,"sRGBTransferOETF"];default:return Le("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function gu(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`\n\n`+r+`\n\n`+Ox(i.getShaderSource(e),o)}else return r}function Bx(i,e){let t=Fx(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`\n`)}var zx={[Yl]:"Linear",[Zl]:"Reinhard",[$l]:"Cineon",[Jl]:"ACESFilmic",[Kl]:"AgX",[Ql]:"Neutral",[jl]:"Custom"};function Hx(i,e){let t=zx[e];return t===void 0?(Le("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Uo=new k;function Gx(){Ye.getLuminanceCoefficients(Uo);let i=Uo.x.toFixed(4),e=Uo.y.toFixed(4),t=Uo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`\n`)}function Vx(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ir).join(`\n`)}function Wx(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`\n`)}function Xx(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Ir(i){return i!==""}function xu(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function yu(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var qx=/^[ \\t]*#include +<([\\w\\d./]+)>/gm;function Pc(i){return i.replace(qx,Zx)}var Yx=new Map;function Zx(i,e){let t=He[e];if(t===void 0){let n=Yx.get(e);if(n!==void 0)t=He[n],Le(\'WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.\',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Pc(t)}var $x=/#pragma unroll_loop_start\\s+for\\s*\\(\\s*int\\s+i\\s*=\\s*(\\d+)\\s*;\\s*i\\s*<\\s*(\\d+)\\s*;\\s*i\\s*\\+\\+\\s*\\)\\s*{([\\s\\S]+?)}\\s+#pragma unroll_loop_end/g;function _u(i){return i.replace($x,Jx)}function Jx(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\\[\\s*i\\s*\\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function vu(i){let e=`precision ${i.precision} float;\n	precision ${i.precision} int;\n	precision ${i.precision} sampler2D;\n	precision ${i.precision} samplerCube;\n	precision ${i.precision} sampler3D;\n	precision ${i.precision} sampler2DArray;\n	precision ${i.precision} sampler2DShadow;\n	precision ${i.precision} samplerCubeShadow;\n	precision ${i.precision} sampler2DArrayShadow;\n	precision ${i.precision} isampler2D;\n	precision ${i.precision} isampler3D;\n	precision ${i.precision} isamplerCube;\n	precision ${i.precision} isampler2DArray;\n	precision ${i.precision} usampler2D;\n	precision ${i.precision} usampler3D;\n	precision ${i.precision} usamplerCube;\n	precision ${i.precision} usampler2DArray;\n	`;return i.precision==="highp"?e+=`\n#define HIGH_PRECISION`:i.precision==="mediump"?e+=`\n#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`\n#define LOW_PRECISION`),e}var jx={[Wi]:"SHADOWMAP_TYPE_PCF",[Ds]:"SHADOWMAP_TYPE_VSM"};function Kx(i){return jx[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Qx={[Li]:"ENVMAP_TYPE_CUBE",[qi]:"ENVMAP_TYPE_CUBE",[Mr]:"ENVMAP_TYPE_CUBE_UV"};function ey(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Qx[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var ty={[qi]:"ENVMAP_MODE_REFRACTION"};function ny(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":ty[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var iy={[Wa]:"ENVMAP_BLENDING_MULTIPLY",[Od]:"ENVMAP_BLENDING_MIX",[Fd]:"ENVMAP_BLENDING_ADD"};function sy(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":iy[i.combine]||"ENVMAP_BLENDING_NONE"}function ry(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function ay(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Kx(t),c=ey(t),h=ny(t),u=sy(t),d=ry(t),f=Vx(t),x=Wx(r),b=s.createProgram(),m,p,A=t.glslVersion?"#version "+t.glslVersion+`\n`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Ir).join(`\n`),m.length>0&&(m+=`\n`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(Ir).join(`\n`),p.length>0&&(p+=`\n`)):(m=[vu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`\n`].filter(Ir).join(`\n`),p=[vu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Un?"#define TONE_MAPPING":"",t.toneMapping!==Un?He.tonemapping_pars_fragment:"",t.toneMapping!==Un?Hx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",He.colorspace_pars_fragment,Bx("linearToOutputTexel",t.outputColorSpace),Gx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`\n`].filter(Ir).join(`\n`)),a=Pc(a),a=xu(a,t),a=yu(a,t),o=Pc(o),o=xu(o,t),o=yu(o,t),a=_u(a),o=_u(o),t.isRawShaderMaterial!==!0&&(A=`#version 300 es\n`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`\n`)+`\n`+m,p=["#define varying in",t.glslVersion===lc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===lc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`\n`)+`\n`+p);let R=A+m+a,M=A+p+o,S=pu(s,s.VERTEX_SHADER,R),w=pu(s,s.FRAGMENT_SHADER,M);s.attachShader(b,S),s.attachShader(b,w),t.index0AttributeName!==void 0?s.bindAttribLocation(b,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(b,0,"position"),s.linkProgram(b);function C(U){if(i.debug.checkShaderErrors){let F=s.getProgramInfoLog(b)||"",G=s.getShaderInfoLog(S)||"",D=s.getShaderInfoLog(w)||"",V=F.trim(),J=G.trim(),j=D.trim(),se=!0,Y=!0;if(s.getProgramParameter(b,s.LINK_STATUS)===!1)if(se=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,b,S,w);else{let te=gu(s,S,"vertex"),ie=gu(s,w,"fragment");Ie("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(b,s.VALIDATE_STATUS)+`\n\nMaterial Name: `+U.name+`\nMaterial Type: `+U.type+`\n\nProgram Info Log: `+V+`\n`+te+`\n`+ie)}else V!==""?Le("WebGLProgram: Program Info Log:",V):(J===""||j==="")&&(Y=!1);Y&&(U.diagnostics={runnable:se,programLog:V,vertexShader:{log:J,prefix:m},fragmentShader:{log:j,prefix:p}})}s.deleteShader(S),s.deleteShader(w),y=new Hs(s,b),T=Xx(s,b)}let y;this.getUniforms=function(){return y===void 0&&C(this),y};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=s.getProgramParameter(b,Ux)),L},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=kx++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=S,this.fragmentShader=w,this}var oy=0,Lc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Ic(e),t.set(e,n)),n}},Ic=class{constructor(e){this.id=oy++,this.code=e,this.usedTimes=0}};function ly(i){return i===Ni||i===Cr||i===Rr}function cy(i,e,t,n,s,r){let a=new As,o=new Lc,l=new Set,c=[],h=new Map,u=n.logarithmicDepthBuffer,d=n.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(y){return l.add(y),y===0?"uv":`uv${y}`}function b(y,T,L,U,F,G){let D=U.fog,V=F.geometry,J=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?U.environment:null,j=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,se=e.get(y.envMap||J,j),Y=se&&se.mapping===Mr?se.image.height:null,te=f[y.type];y.precision!==null&&(d=n.getMaxPrecision(y.precision),d!==y.precision&&Le("WebGLProgram.getParameters:",y.precision,"not supported, using",d,"instead."));let ie=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,Ce=ie!==void 0?ie.length:0,Te=0;V.morphAttributes.position!==void 0&&(Te=1),V.morphAttributes.normal!==void 0&&(Te=2),V.morphAttributes.color!==void 0&&(Te=3);let ct,Ze,Ke,Z;if(te){let dt=Zn[te];ct=dt.vertexShader,Ze=dt.fragmentShader}else{ct=y.vertexShader,Ze=y.fragmentShader;let dt=o.getVertexShaderStage(y),Qe=o.getFragmentShaderStage(y);o.update(y,dt,Qe),Ke=dt.id,Z=Qe.id}let ee=i.getRenderTarget(),_e=i.state.buffers.depth.getReversed(),ke=F.isInstancedMesh===!0,xe=F.isBatchedMesh===!0,Ge=!!y.map,Dt=!!y.matcap,We=!!se,je=!!y.aoMap,ht=!!y.lightMap,qe=!!y.bumpMap&&y.wireframe===!1,mt=!!y.normalMap,Ft=!!y.displacementMap,ln=!!y.emissiveMap,yt=!!y.metalnessMap,wt=!!y.roughnessMap,N=y.anisotropy>0,qt=y.clearcoat>0,nt=y.dispersion>0,E=y.retroreflectivity>0,g=y.iridescence>0,O=y.sheen>0,H=y.transmission>0,q=N&&!!y.anisotropyMap,re=qt&&!!y.clearcoatMap,ae=qt&&!!y.clearcoatNormalMap,$=qt&&!!y.clearcoatRoughnessMap,Q=g&&!!y.iridescenceMap,oe=g&&!!y.iridescenceThicknessMap,we=O&&!!y.sheenColorMap,de=O&&!!y.sheenRoughnessMap,le=!!y.specularMap,Ee=!!y.specularColorMap,Pe=!!y.specularIntensityMap,Oe=H&&!!y.transmissionMap,I=H&&!!y.thicknessMap,ce=!!y.gradientMap,K=!!y.alphaMap,he=y.alphaTest>0,me=!!y.alphaHash,ne=!!y.extensions,Ae=Un;y.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Ae=i.toneMapping);let Me={shaderID:te,shaderType:y.type,shaderName:y.name,vertexShader:ct,fragmentShader:Ze,defines:y.defines,customVertexShaderID:Ke,customFragmentShaderID:Z,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:d,batching:xe,batchingColor:xe&&F._colorsTexture!==null,instancing:ke,instancingColor:ke&&F.instanceColor!==null,instancingMorph:ke&&F.morphTexture!==null,outputColorSpace:ee===null?i.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:Ye.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:Ge,matcap:Dt,envMap:We,envMapMode:We&&se.mapping,envMapCubeUVHeight:Y,aoMap:je,lightMap:ht,bumpMap:qe,normalMap:mt,displacementMap:Ft,emissiveMap:ln,normalMapObjectSpace:mt&&y.normalMapType===Hd,normalMapTangentSpace:mt&&y.normalMapType===Lo,packedNormalMap:mt&&y.normalMapType===Lo&&ly(y.normalMap.format),metalnessMap:yt,roughnessMap:wt,anisotropy:N,anisotropyMap:q,clearcoat:qt,clearcoatMap:re,clearcoatNormalMap:ae,clearcoatRoughnessMap:$,dispersion:nt,retroreflection:E,iridescence:g,iridescenceMap:Q,iridescenceThicknessMap:oe,sheen:O,sheenColorMap:we,sheenRoughnessMap:de,specularMap:le,specularColorMap:Ee,specularIntensityMap:Pe,transmission:H,transmissionMap:Oe,thicknessMap:I,gradientMap:ce,opaque:y.transparent===!1&&y.blending===Ns&&y.alphaToCoverage===!1,alphaMap:K,alphaTest:he,alphaHash:me,combine:y.combine,mapUv:Ge&&x(y.map.channel),aoMapUv:je&&x(y.aoMap.channel),lightMapUv:ht&&x(y.lightMap.channel),bumpMapUv:qe&&x(y.bumpMap.channel),normalMapUv:mt&&x(y.normalMap.channel),displacementMapUv:Ft&&x(y.displacementMap.channel),emissiveMapUv:ln&&x(y.emissiveMap.channel),metalnessMapUv:yt&&x(y.metalnessMap.channel),roughnessMapUv:wt&&x(y.roughnessMap.channel),anisotropyMapUv:q&&x(y.anisotropyMap.channel),clearcoatMapUv:re&&x(y.clearcoatMap.channel),clearcoatNormalMapUv:ae&&x(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:$&&x(y.clearcoatRoughnessMap.channel),iridescenceMapUv:Q&&x(y.iridescenceMap.channel),iridescenceThicknessMapUv:oe&&x(y.iridescenceThicknessMap.channel),sheenColorMapUv:we&&x(y.sheenColorMap.channel),sheenRoughnessMapUv:de&&x(y.sheenRoughnessMap.channel),specularMapUv:le&&x(y.specularMap.channel),specularColorMapUv:Ee&&x(y.specularColorMap.channel),specularIntensityMapUv:Pe&&x(y.specularIntensityMap.channel),transmissionMapUv:Oe&&x(y.transmissionMap.channel),thicknessMapUv:I&&x(y.thicknessMap.channel),alphaMapUv:K&&x(y.alphaMap.channel),vertexTangents:!!V.attributes.tangent&&(mt||N),vertexNormals:!!V.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!V.attributes.uv&&(Ge||K),fog:!!D,useFog:y.fog===!0,fogExp2:!!D&&D.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||V.attributes.normal===void 0&&mt===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:_e,skinning:F.isSkinnedMesh===!0,hasPositionAttribute:V.attributes.position!==void 0,morphTargets:V.morphAttributes.position!==void 0,morphNormals:V.morphAttributes.normal!==void 0,morphColors:V.morphAttributes.color!==void 0,morphTargetsCount:Ce,morphTextureStride:Te,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ae,decodeVideoTexture:Ge&&y.map.isVideoTexture===!0&&Ye.getTransfer(y.map.colorSpace)===tt,decodeVideoTextureEmissive:ln&&y.emissiveMap.isVideoTexture===!0&&Ye.getTransfer(y.emissiveMap.colorSpace)===tt,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===_n,flipSided:y.side===Lt,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:ne&&y.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ne&&y.extensions.multiDraw===!0||xe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Me.vertexUv1s=l.has(1),Me.vertexUv2s=l.has(2),Me.vertexUv3s=l.has(3),l.clear(),Me}function m(y){let T=[];if(y.shaderID?T.push(y.shaderID):(T.push(y.customVertexShaderID),T.push(y.customFragmentShaderID)),y.defines!==void 0)for(let L in y.defines)T.push(L),T.push(y.defines[L]);return y.isRawShaderMaterial===!1&&(p(T,y),A(T,y),T.push(i.outputColorSpace)),T.push(y.customProgramCacheKey),T.join()}function p(y,T){y.push(T.precision),y.push(T.outputColorSpace),y.push(T.envMapMode),y.push(T.envMapCubeUVHeight),y.push(T.mapUv),y.push(T.alphaMapUv),y.push(T.lightMapUv),y.push(T.aoMapUv),y.push(T.bumpMapUv),y.push(T.normalMapUv),y.push(T.displacementMapUv),y.push(T.emissiveMapUv),y.push(T.metalnessMapUv),y.push(T.roughnessMapUv),y.push(T.anisotropyMapUv),y.push(T.clearcoatMapUv),y.push(T.clearcoatNormalMapUv),y.push(T.clearcoatRoughnessMapUv),y.push(T.iridescenceMapUv),y.push(T.iridescenceThicknessMapUv),y.push(T.sheenColorMapUv),y.push(T.sheenRoughnessMapUv),y.push(T.specularMapUv),y.push(T.specularColorMapUv),y.push(T.specularIntensityMapUv),y.push(T.transmissionMapUv),y.push(T.thicknessMapUv),y.push(T.combine),y.push(T.fogExp2),y.push(T.sizeAttenuation),y.push(T.morphTargetsCount),y.push(T.morphAttributeCount),y.push(T.numSunLights),y.push(T.numDirLights),y.push(T.numPointLights),y.push(T.numSpotLights),y.push(T.numSpotLightMaps),y.push(T.numHemiLights),y.push(T.numRectAreaLights),y.push(T.numSunLightShadows),y.push(T.numDirLightShadows),y.push(T.numPointLightShadows),y.push(T.numSpotLightShadows),y.push(T.numSpotLightShadowsWithMaps),y.push(T.numLightProbes),y.push(T.shadowMapType),y.push(T.toneMapping),y.push(T.numClippingPlanes),y.push(T.numClipIntersection),y.push(T.depthPacking)}function A(y,T){a.disableAll(),T.instancing&&a.enable(0),T.instancingColor&&a.enable(1),T.instancingMorph&&a.enable(2),T.matcap&&a.enable(3),T.envMap&&a.enable(4),T.normalMapObjectSpace&&a.enable(5),T.normalMapTangentSpace&&a.enable(6),T.clearcoat&&a.enable(7),T.iridescence&&a.enable(8),T.alphaTest&&a.enable(9),T.vertexColors&&a.enable(10),T.vertexAlphas&&a.enable(11),T.vertexUv1s&&a.enable(12),T.vertexUv2s&&a.enable(13),T.vertexUv3s&&a.enable(14),T.vertexTangents&&a.enable(15),T.anisotropy&&a.enable(16),T.alphaHash&&a.enable(17),T.batching&&a.enable(18),T.dispersion&&a.enable(19),T.retroreflection&&a.enable(24),T.batchingColor&&a.enable(20),T.gradientMap&&a.enable(21),T.packedNormalMap&&a.enable(22),T.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reversedDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),T.numLightProbeGrids>0&&a.enable(22),T.hasPositionAttribute&&a.enable(23),y.push(a.mask)}function R(y){let T=f[y.type],L;if(T){let U=Zn[T];L=tu.clone(U.uniforms)}else L=y.uniforms;return L}function M(y,T){let L=h.get(T);return L!==void 0?++L.usedTimes:(L=new ay(i,T,y,s),c.push(L),h.set(T,L)),L}function S(y){if(--y.usedTimes===0){let T=c.indexOf(y);c[T]=c[c.length-1],c.pop(),h.delete(y.cacheKey),y.destroy()}}function w(y){o.remove(y)}function C(){o.dispose()}return{getParameters:b,getProgramCacheKey:m,getUniforms:R,acquireProgram:M,releaseProgram:S,releaseShaderCache:w,programs:c,dispose:C}}function hy(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function dy(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function bu(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Mu(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function o(d,f,x,b,m,p){let A=i[e];return A===void 0?(A={id:d.id,object:d,geometry:f,material:x,materialVariant:a(d),groupOrder:b,renderOrder:d.renderOrder,z:m,group:p},i[e]=A):(A.id=d.id,A.object=d,A.geometry=f,A.material=x,A.materialVariant=a(d),A.groupOrder=b,A.renderOrder=d.renderOrder,A.z=m,A.group=p),e++,A}function l(d,f,x,b,m,p,A){A.reversedDepth===!0&&(m=-m);let R=o(d,f,x,b,m,p);x.transmission>0?n.push(R):x.transparent===!0?s.push(R):t.push(R)}function c(d,f,x,b,m,p){let A=o(d,f,x,b,m,p);x.transmission>0?n.unshift(A):x.transparent===!0?s.unshift(A):t.unshift(A)}function h(d,f){t.length>1&&t.sort(d||dy),n.length>1&&n.sort(f||bu),s.length>1&&s.sort(f||bu)}function u(){for(let d=e,f=i.length;d<f;d++){let x=i[d];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:u,sort:h}}function uy(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new Mu,i.set(n,[a])):s>=r.length?(a=new Mu,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function fy(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new k,color:new ze};break;case"SpotLight":t={position:new k,direction:new k,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new k,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new k,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new k,halfWidth:new k,halfHeight:new k};break}return i[e.id]=t,t}}}function py(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Re};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Re};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Re,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var my=0;function gy(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function xy(i){let e=new fy,t=py(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new k);let s=new k,r=new gt,a=new gt;function o(c){let h=0,u=0,d=0;for(let F=0;F<9;F++)n.probe[F].set(0,0,0);let f=0,x=0,b=0,m=0,p=0,A=0,R=0,M=0,S=0,w=0,C=0,y=0,T=0,L=0;c.sort(gy);for(let F=0,G=c.length;F<G;F++){let D=c[F],V=D.color,J=D.intensity,j=D.distance,se=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===Ni?se=D.shadow.map.texture:se=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)h+=V.r*J,u+=V.g*J,d+=V.b*J;else if(D.isLightProbe){for(let Y=0;Y<9;Y++)n.probe[Y].addScaledVector(D.sh.coefficients[Y],J);L++}else if(D.isSunLight){let Y=e.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let te=D.shadow,ie=t.get(D);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize.copy(te.mapSize).multiply(te.getFrameExtents()),n.sunShadow[x]=ie,n.sunShadowMap[x]=se;let Ce=te.getViewportCount();for(let Te=0;Te<Ce;Te++)n.sunShadowMatrix[b+Te]=te.getMatrix(Te),n.sunShadowCascade[b+Te]=te._cascadeData[Te];b+=Ce,x++}n.sun[f]=Y,f++}else if(D.isDirectionalLight){let Y=e.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let te=D.shadow,ie=t.get(D);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize=te.mapSize,n.directionalShadow[m]=ie,n.directionalShadowMap[m]=se,n.directionalShadowMatrix[m]=D.shadow.matrix,S++}n.directional[m]=Y,m++}else if(D.isSpotLight){let Y=e.get(D);Y.position.setFromMatrixPosition(D.matrixWorld),Y.color.copy(V).multiplyScalar(J),Y.distance=j,Y.coneCos=Math.cos(D.angle),Y.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),Y.decay=D.decay,n.spot[A]=Y;let te=D.shadow;if(D.map&&(n.spotLightMap[y]=D.map,y++,te.updateMatrices(D),D.castShadow&&T++),n.spotLightMatrix[A]=te.matrix,D.castShadow){let ie=t.get(D);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize=te.mapSize,n.spotShadow[A]=ie,n.spotShadowMap[A]=se,C++}A++}else if(D.isRectAreaLight){let Y=e.get(D);Y.color.copy(V).multiplyScalar(J),Y.halfWidth.set(D.width*.5,0,0),Y.halfHeight.set(0,D.height*.5,0),n.rectArea[R]=Y,R++}else if(D.isPointLight){let Y=e.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),Y.distance=D.distance,Y.decay=D.decay,D.castShadow){let te=D.shadow,ie=t.get(D);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize=te.mapSize,ie.shadowCameraNear=te.camera.near,ie.shadowCameraFar=te.camera.far,n.pointShadow[p]=ie,n.pointShadowMap[p]=se,n.pointShadowMatrix[p]=D.shadow.matrix,w++}n.point[p]=Y,p++}else if(D.isHemisphereLight){let Y=e.get(D);Y.skyColor.copy(D.color).multiplyScalar(J),Y.groundColor.copy(D.groundColor).multiplyScalar(J),n.hemi[M]=Y,M++}}R>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ue.LTC_FLOAT_1,n.rectAreaLTC2=ue.LTC_FLOAT_2):(n.rectAreaLTC1=ue.LTC_HALF_1,n.rectAreaLTC2=ue.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let U=n.hash;(U.sunLength!==f||U.directionalLength!==m||U.pointLength!==p||U.spotLength!==A||U.rectAreaLength!==R||U.hemiLength!==M||U.numSunShadows!==x||U.numDirectionalShadows!==S||U.numPointShadows!==w||U.numSpotShadows!==C||U.numSpotMaps!==y||U.numLightProbes!==L)&&(n.sun.length=f,n.directional.length=m,n.spot.length=A,n.rectArea.length=R,n.point.length=p,n.hemi.length=M,n.sunShadow.length=x,n.sunShadowMap.length=x,n.sunShadowMatrix.length=b,n.sunShadowCascade.length=b,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.directionalShadowMatrix.length=S,n.pointShadow.length=w,n.pointShadowMap.length=w,n.pointShadowMatrix.length=w,n.spotShadow.length=C,n.spotShadowMap.length=C,n.spotLightMatrix.length=C+y-T,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=L,U.sunLength=f,U.directionalLength=m,U.pointLength=p,U.spotLength=A,U.rectAreaLength=R,U.hemiLength=M,U.numSunShadows=x,U.numDirectionalShadows=S,U.numPointShadows=w,U.numSpotShadows=C,U.numSpotMaps=y,U.numLightProbes=L,n.version=my++)}function l(c,h){let u=0,d=0,f=0,x=0,b=0,m=0,p=h.matrixWorldInverse;for(let A=0,R=c.length;A<R;A++){let M=c[A];if(M.isSunLight){let S=n.sun[u];S.direction.setFromMatrixPosition(M.matrixWorld),S.direction.transformDirection(p),u++}else if(M.isDirectionalLight){let S=n.directional[d];S.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(s),S.direction.transformDirection(p),d++}else if(M.isSpotLight){let S=n.spot[x];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(p),S.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(s),S.direction.transformDirection(p),x++}else if(M.isRectAreaLight){let S=n.rectArea[b];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(p),a.identity(),r.copy(M.matrixWorld),r.premultiply(p),a.extractRotation(r),S.halfWidth.set(M.width*.5,0,0),S.halfHeight.set(0,M.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),b++}else if(M.isPointLight){let S=n.point[f];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(p),f++}else if(M.isHemisphereLight){let S=n.hemi[m];S.direction.setFromMatrixPosition(M.matrixWorld),S.direction.transformDirection(p),m++}}}return{setup:o,setupView:l,state:n}}function Su(i){let e=new xy(i),t=[],n=[],s=[];function r(d){u.camera=d,t.length=0,n.length=0,s.length=0}function a(d){t.push(d)}function o(d){n.push(d)}function l(d){s.push(d)}function c(){e.setup(t)}function h(d){e.setupView(t,d)}let u={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function yy(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Su(i),e.set(s,[o])):r>=a.length?(o=new Su(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var _y=`void main() {\n	gl_Position = vec4( position, 1.0 );\n}`,vy=`uniform sampler2D shadow_pass;\nuniform vec2 resolution;\nuniform float radius;\nvoid main() {\n	const float samples = float( VSM_SAMPLES );\n	float mean = 0.0;\n	float squared_mean = 0.0;\n	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );\n	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;\n	for ( float i = 0.0; i < samples; i ++ ) {\n		float uvOffset = uvStart + i * uvStride;\n		#ifdef HORIZONTAL_PASS\n			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;\n			mean += distribution.x;\n			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;\n		#else\n			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;\n			mean += depth;\n			squared_mean += depth * depth;\n		#endif\n	}\n	mean = mean / samples;\n	squared_mean = squared_mean / samples;\n	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );\n	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );\n}`,by=[new k(1,0,0),new k(-1,0,0),new k(0,1,0),new k(0,-1,0),new k(0,0,1),new k(0,0,-1)],My=[new k(0,-1,0),new k(0,-1,0),new k(0,0,1),new k(0,0,-1),new k(0,-1,0),new k(0,-1,0)],wu=new gt,Lr=new k,Ec=new k;function Sy(i,e,t){let n=new Ps,s=new Re,r=new Re,a=new xt,o=new Ca,l=new Ra,c={},h=t.maxTextureSize,u={[Pi]:Lt,[Lt]:Pi,[_n]:_n},d=new xn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Re},radius:{value:4}},vertexShader:_y,fragmentShader:vy}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let x=new gn;x.setAttribute("position",new En(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new Je(x,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Wi;let p=this.type;this.render=function(w,C,y){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;this.type===yd&&(Le("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Wi);let T=i.getRenderTarget(),L=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),F=i.state;F.setBlending(qn),F.buffers.depth.getReversed()===!0?F.buffers.color.setClear(0,0,0,0):F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let G=p!==this.type;G&&C.traverse(function(D){D.material&&(Array.isArray(D.material)?D.material.forEach(V=>V.needsUpdate=!0):D.material.needsUpdate=!0)});for(let D=0,V=w.length;D<V;D++){let J=w[D],j=J.shadow;if(j===void 0){Le("WebGLShadowMap:",J,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;s.copy(j.mapSize);let se=j.getFrameExtents();s.multiply(se),r.copy(j.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/se.x),s.x=r.x*se.x,j.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/se.y),s.y=r.y*se.y,j.mapSize.y=r.y));let Y=i.state.buffers.depth.getReversed();if(j.camera._reversedDepth=Y,j.map===null||G===!0){if(j.map!==null&&(j.map.depthTexture!==null&&(j.map.depthTexture.dispose(),j.map.depthTexture=null),j.map.dispose()),this.type===Ds){if(J.isPointLight){Le("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}j.map=new hn(s.x,s.y,{format:Ni,type:Fn,minFilter:Xt,magFilter:Xt,generateMipmaps:!1}),j.map.texture.name=J.name+".shadowMap",j.map.depthTexture=new wi(s.x,s.y,On),j.map.depthTexture.name=J.name+".shadowMapDepth",j.map.depthTexture.format=Xn,j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Vt,j.map.depthTexture.magFilter=Vt}else J.isPointLight?(j.map=new Oo(s.x),j.map.depthTexture=new Ta(s.x,kn)):(j.map=new hn(s.x,s.y),j.map.depthTexture=new wi(s.x,s.y,kn)),j.map.depthTexture.name=J.name+".shadowMap",j.map.depthTexture.format=Xn,this.type===Wi?(j.map.depthTexture.compareFunction=Y?Do:Io,j.map.depthTexture.minFilter=Xt,j.map.depthTexture.magFilter=Xt):(j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Vt,j.map.depthTexture.magFilter=Vt);j.camera.updateProjectionMatrix()}j.map.isWebGLCubeRenderTarget!==!0&&(j.map.width!==s.x||j.map.height!==s.y)&&j.map.setSize(s.x,s.y);let te=j.map.isWebGLCubeRenderTarget?6:j.getViewportCount();J.isPointLight!==!0&&j.updateMatrices(J,y);for(let ie=0;ie<te;ie++){let Ce=j.getCamera(ie);if(J.isPointLight){let Te=j.camera,ct=j.matrix,Ze=J.distance||Te.far;Ze!==Te.far&&(Te.far=Ze,Te.updateProjectionMatrix()),Lr.setFromMatrixPosition(J.matrixWorld),Te.position.copy(Lr),Ec.copy(Te.position),Ec.add(by[ie]),Te.up.copy(My[ie]),Te.lookAt(Ec),Te.updateMatrixWorld(),ct.makeTranslation(-Lr.x,-Lr.y,-Lr.z),wu.multiplyMatrices(Te.projectionMatrix,Te.matrixWorldInverse),j._frustum.setFromProjectionMatrix(wu,Te.coordinateSystem,Te.reversedDepth)}if(j.map.isWebGLCubeRenderTarget)i.setRenderTarget(j.map,ie),i.clear();else{ie===0&&(i.setRenderTarget(j.map),i.clear());let Te=j.getViewport(ie);a.set(r.x*Te.x,r.y*Te.y,r.x*Te.z,r.y*Te.w),F.viewport(a)}n=j.getFrustum(ie),M(C,y,Ce,J,this.type)}j.isPointLightShadow!==!0&&this.type===Ds&&A(j,y),j.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(T,L,U)};function A(w,C){let y=e.update(b);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null?w.mapPass=new hn(s.x,s.y,{format:Ni,type:Fn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),d.uniforms.shadow_pass.value=w.map.depthTexture,d.uniforms.resolution.value.set(w.map.width,w.map.height),d.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(C,null,y,d,b,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value.set(w.map.width,w.map.height),f.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(C,null,y,f,b,null)}function R(w,C,y,T){let L=null,U=y.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(U!==void 0)L=U;else if(L=y.isPointLight===!0?l:o,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let F=L.uuid,G=C.uuid,D=c[F];D===void 0&&(D={},c[F]=D);let V=D[G];V===void 0&&(V=L.clone(),D[G]=V,C.addEventListener("dispose",S)),L=V}if(L.visible=C.visible,L.wireframe=C.wireframe,T===Ds?L.side=C.shadowSide!==null?C.shadowSide:C.side:L.side=C.shadowSide!==null?C.shadowSide:u[C.side],L.alphaMap=C.alphaMap,L.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,L.map=C.map,L.clipShadows=C.clipShadows,L.clippingPlanes=C.clippingPlanes,L.clipIntersection=C.clipIntersection,L.displacementMap=C.displacementMap,L.displacementScale=C.displacementScale,L.displacementBias=C.displacementBias,L.wireframeLinewidth=C.wireframeLinewidth,L.linewidth=C.linewidth,y.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let F=i.properties.get(L);F.light=y}return L}function M(w,C,y,T,L){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&L===Ds)&&(!w.frustumCulled||w.intersectsFrustum(n))){w.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,w.matrixWorld);let G=e.update(w),D=w.material;if(Array.isArray(D)){let V=G.groups;for(let J=0,j=V.length;J<j;J++){let se=V[J],Y=D[se.materialIndex];if(Y&&Y.visible){let te=R(w,Y,T,L);w.onBeforeShadow(i,w,C,y,G,te,se),i.renderBufferDirect(y,null,G,te,w,se),w.onAfterShadow(i,w,C,y,G,te,se)}}}else if(D.visible){let V=R(w,D,T,L);w.onBeforeShadow(i,w,C,y,G,V,null),i.renderBufferDirect(y,null,G,V,w,null),w.onAfterShadow(i,w,C,y,G,V,null)}}let F=w.children;for(let G=0,D=F.length;G<D;G++)M(F[G],C,y,T,L)}function S(w){w.target.removeEventListener("dispose",S);for(let y in c){let T=c[y],L=w.target.uuid;L in T&&(T[L].dispose(),delete T[L])}}}function wy(i,e){function t(){let I=!1,ce=new xt,K=null,he=new xt(0,0,0,0);return{setMask:function(me){K!==me&&!I&&(i.colorMask(me,me,me,me),K=me)},setLocked:function(me){I=me},setClear:function(me,ne,Ae,Me,dt){dt===!0&&(me*=Me,ne*=Me,Ae*=Me),ce.set(me,ne,Ae,Me),he.equals(ce)===!1&&(i.clearColor(me,ne,Ae,Me),he.copy(ce))},reset:function(){I=!1,K=null,he.set(-1,0,0,0)}}}function n(){let I=!1,ce=!1,K=null,he=null,me=null;return{setReversed:function(ne){if(ce!==ne){let Ae=e.get("EXT_clip_control");ne?Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.ZERO_TO_ONE_EXT):Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.NEGATIVE_ONE_TO_ONE_EXT),ce=ne;let Me=me;me=null,this.setClear(Me)}},getReversed:function(){return ce},setTest:function(ne){ne?ee(i.DEPTH_TEST):_e(i.DEPTH_TEST)},setMask:function(ne){K!==ne&&!I&&(i.depthMask(ne),K=ne)},setFunc:function(ne){if(ce&&(ne=Qd[ne]),he!==ne){switch(ne){case fa:i.depthFunc(i.NEVER);break;case pa:i.depthFunc(i.ALWAYS);break;case ma:i.depthFunc(i.LESS);break;case bs:i.depthFunc(i.LEQUAL);break;case ga:i.depthFunc(i.EQUAL);break;case xa:i.depthFunc(i.GEQUAL);break;case ya:i.depthFunc(i.GREATER);break;case _a:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}he=ne}},setLocked:function(ne){I=ne},setClear:function(ne){me!==ne&&(me=ne,ce&&(ne=1-ne),i.clearDepth(ne))},reset:function(){I=!1,K=null,he=null,me=null,ce=!1}}}function s(){let I=!1,ce=null,K=null,he=null,me=null,ne=null,Ae=null,Me=null,dt=null;return{setTest:function(Qe){I||(Qe?ee(i.STENCIL_TEST):_e(i.STENCIL_TEST))},setMask:function(Qe){ce!==Qe&&!I&&(i.stencilMask(Qe),ce=Qe)},setFunc:function(Qe,Cn,Bn){(K!==Qe||he!==Cn||me!==Bn)&&(i.stencilFunc(Qe,Cn,Bn),K=Qe,he=Cn,me=Bn)},setOp:function(Qe,Cn,Bn){(ne!==Qe||Ae!==Cn||Me!==Bn)&&(i.stencilOp(Qe,Cn,Bn),ne=Qe,Ae=Cn,Me=Bn)},setLocked:function(Qe){I=Qe},setClear:function(Qe){dt!==Qe&&(i.clearStencil(Qe),dt=Qe)},reset:function(){I=!1,ce=null,K=null,he=null,me=null,ne=null,Ae=null,Me=null,dt=null}}}let r=new t,a=new n,o=new s,l=new WeakMap,c=new WeakMap,h={},u={},d={},f=new WeakMap,x=[],b=null,m=!1,p=null,A=null,R=null,M=null,S=null,w=null,C=null,y=new ze(0,0,0),T=0,L=!1,U=null,F=null,G=null,D=null,V=null,J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),j=!1,se=0,Y=i.getParameter(i.VERSION);Y.indexOf("WebGL")!==-1?(se=parseFloat(/^WebGL (\\d)/.exec(Y)[1]),j=se>=1):Y.indexOf("OpenGL ES")!==-1&&(se=parseFloat(/^OpenGL ES (\\d)/.exec(Y)[1]),j=se>=2);let te=null,ie={},Ce=i.getParameter(i.SCISSOR_BOX),Te=i.getParameter(i.VIEWPORT),ct=new xt().fromArray(Ce),Ze=new xt().fromArray(Te);function Ke(I,ce,K,he){let me=new Uint8Array(4),ne=i.createTexture();i.bindTexture(I,ne),i.texParameteri(I,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(I,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ae=0;Ae<K;Ae++)I===i.TEXTURE_3D||I===i.TEXTURE_2D_ARRAY?i.texImage3D(ce,0,i.RGBA,1,1,he,0,i.RGBA,i.UNSIGNED_BYTE,me):i.texImage2D(ce+Ae,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,me);return ne}let Z={};Z[i.TEXTURE_2D]=Ke(i.TEXTURE_2D,i.TEXTURE_2D,1),Z[i.TEXTURE_CUBE_MAP]=Ke(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z[i.TEXTURE_2D_ARRAY]=Ke(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Z[i.TEXTURE_3D]=Ke(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ee(i.DEPTH_TEST),a.setFunc(bs),qe(!1),mt(Hl),ee(i.CULL_FACE),je(qn);function ee(I){h[I]!==!0&&(i.enable(I),h[I]=!0)}function _e(I){h[I]!==!1&&(i.disable(I),h[I]=!1)}function ke(I,ce){return d[I]!==ce?(i.bindFramebuffer(I,ce),d[I]=ce,I===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=ce),I===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=ce),!0):!1}function xe(I,ce){let K=x,he=!1;if(I){K=f.get(ce),K===void 0&&(K=[],f.set(ce,K));let me=I.textures;if(K.length!==me.length||K[0]!==i.COLOR_ATTACHMENT0){for(let ne=0,Ae=me.length;ne<Ae;ne++)K[ne]=i.COLOR_ATTACHMENT0+ne;K.length=me.length,he=!0}}else K[0]!==i.BACK&&(K[0]=i.BACK,he=!0);he&&i.drawBuffers(K)}function Ge(I){return b!==I?(i.useProgram(I),b=I,!0):!1}let Dt={[Xi]:i.FUNC_ADD,[vd]:i.FUNC_SUBTRACT,[bd]:i.FUNC_REVERSE_SUBTRACT};Dt[Md]=i.MIN,Dt[Sd]=i.MAX;let We={[wd]:i.ZERO,[Ed]:i.ONE,[Td]:i.SRC_COLOR,[Xl]:i.SRC_ALPHA,[Id]:i.SRC_ALPHA_SATURATE,[Pd]:i.DST_COLOR,[Cd]:i.DST_ALPHA,[Ad]:i.ONE_MINUS_SRC_COLOR,[ql]:i.ONE_MINUS_SRC_ALPHA,[Ld]:i.ONE_MINUS_DST_COLOR,[Rd]:i.ONE_MINUS_DST_ALPHA,[Dd]:i.CONSTANT_COLOR,[Nd]:i.ONE_MINUS_CONSTANT_COLOR,[Ud]:i.CONSTANT_ALPHA,[kd]:i.ONE_MINUS_CONSTANT_ALPHA};function je(I,ce,K,he,me,ne,Ae,Me,dt,Qe){if(I===qn){m===!0&&(_e(i.BLEND),m=!1);return}if(m===!1&&(ee(i.BLEND),m=!0),I!==_d){if(I!==p||Qe!==L){if((A!==Xi||S!==Xi)&&(i.blendEquation(i.FUNC_ADD),A=Xi,S=Xi),Qe)switch(I){case Ns:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Gl:i.blendFunc(i.ONE,i.ONE);break;case Vl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Wl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Ie("WebGLState: Invalid blending: ",I);break}else switch(I){case Ns:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Gl:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Vl:Ie("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Wl:Ie("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ie("WebGLState: Invalid blending: ",I);break}R=null,M=null,w=null,C=null,y.set(0,0,0),T=0,p=I,L=Qe}return}me=me||ce,ne=ne||K,Ae=Ae||he,(ce!==A||me!==S)&&(i.blendEquationSeparate(Dt[ce],Dt[me]),A=ce,S=me),(K!==R||he!==M||ne!==w||Ae!==C)&&(i.blendFuncSeparate(We[K],We[he],We[ne],We[Ae]),R=K,M=he,w=ne,C=Ae),(Me.equals(y)===!1||dt!==T)&&(i.blendColor(Me.r,Me.g,Me.b,dt),y.copy(Me),T=dt),p=I,L=!1}function ht(I,ce){I.side===_n?_e(i.CULL_FACE):ee(i.CULL_FACE);let K=I.side===Lt;ce&&(K=!K),qe(K),I.blending===Ns&&I.transparent===!1?je(qn):je(I.blending,I.blendEquation,I.blendSrc,I.blendDst,I.blendEquationAlpha,I.blendSrcAlpha,I.blendDstAlpha,I.blendColor,I.blendAlpha,I.premultipliedAlpha),a.setFunc(I.depthFunc),a.setTest(I.depthTest),a.setMask(I.depthWrite),r.setMask(I.colorWrite);let he=I.stencilWrite;o.setTest(he),he&&(o.setMask(I.stencilWriteMask),o.setFunc(I.stencilFunc,I.stencilRef,I.stencilFuncMask),o.setOp(I.stencilFail,I.stencilZFail,I.stencilZPass)),ln(I.polygonOffset,I.polygonOffsetFactor,I.polygonOffsetUnits),I.alphaToCoverage===!0?ee(i.SAMPLE_ALPHA_TO_COVERAGE):_e(i.SAMPLE_ALPHA_TO_COVERAGE)}function qe(I){U!==I&&(I?i.frontFace(i.CW):i.frontFace(i.CCW),U=I)}function mt(I){I!==gd?(ee(i.CULL_FACE),I!==F&&(I===Hl?i.cullFace(i.BACK):I===xd?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):_e(i.CULL_FACE),F=I}function Ft(I){I!==G&&(j&&i.lineWidth(I),G=I)}function ln(I,ce,K){I?(ee(i.POLYGON_OFFSET_FILL),(D!==ce||V!==K)&&(D=ce,V=K,a.getReversed()&&(ce=-ce),i.polygonOffset(ce,K))):_e(i.POLYGON_OFFSET_FILL)}function yt(I){I?ee(i.SCISSOR_TEST):_e(i.SCISSOR_TEST)}function wt(I){I===void 0&&(I=i.TEXTURE0+J-1),te!==I&&(i.activeTexture(I),te=I)}function N(I,ce,K){K===void 0&&(te===null?K=i.TEXTURE0+J-1:K=te);let he=ie[K];he===void 0&&(he={type:void 0,texture:void 0},ie[K]=he),(he.type!==I||he.texture!==ce)&&(te!==K&&(i.activeTexture(K),te=K),i.bindTexture(I,ce||Z[I]),he.type=I,he.texture=ce)}function qt(){let I=ie[te];I!==void 0&&I.type!==void 0&&(i.bindTexture(I.type,null),I.type=void 0,I.texture=void 0)}function nt(){try{i.compressedTexImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function E(){try{i.compressedTexImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function g(){try{i.texSubImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function O(){try{i.texSubImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function H(){try{i.compressedTexSubImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function q(){try{i.compressedTexSubImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function re(){try{i.texStorage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function ae(){try{i.texStorage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function $(){try{i.texImage2D(...arguments)}catch(I){Ie("WebGLState:",I)}}function Q(){try{i.texImage3D(...arguments)}catch(I){Ie("WebGLState:",I)}}function oe(I){return u[I]!==void 0?u[I]:i.getParameter(I)}function we(I,ce){u[I]!==ce&&(i.pixelStorei(I,ce),u[I]=ce)}function de(I){ct.equals(I)===!1&&(i.scissor(I.x,I.y,I.z,I.w),ct.copy(I))}function le(I){Ze.equals(I)===!1&&(i.viewport(I.x,I.y,I.z,I.w),Ze.copy(I))}function Ee(I,ce){let K=c.get(ce);K===void 0&&(K=new WeakMap,c.set(ce,K));let he=K.get(I);he===void 0&&(he=i.getUniformBlockIndex(ce,I.name),K.set(I,he))}function Pe(I,ce){let he=c.get(ce).get(I);l.get(ce)!==he&&(i.uniformBlockBinding(ce,he,I.__bindingPointIndex),l.set(ce,he))}function Oe(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},u={},te=null,ie={},d={},f=new WeakMap,x=[],b=null,m=!1,p=null,A=null,R=null,M=null,S=null,w=null,C=null,y=new ze(0,0,0),T=0,L=!1,U=null,F=null,G=null,D=null,V=null,ct.set(0,0,i.canvas.width,i.canvas.height),Ze.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ee,disable:_e,bindFramebuffer:ke,drawBuffers:xe,useProgram:Ge,setBlending:je,setMaterial:ht,setFlipSided:qe,setCullFace:mt,setLineWidth:Ft,setPolygonOffset:ln,setScissorTest:yt,activeTexture:wt,bindTexture:N,unbindTexture:qt,compressedTexImage2D:nt,compressedTexImage3D:E,texImage2D:$,texImage3D:Q,pixelStorei:we,getParameter:oe,updateUBOMapping:Ee,uniformBlockBinding:Pe,texStorage2D:re,texStorage3D:ae,texSubImage2D:g,texSubImage3D:O,compressedTexSubImage2D:H,compressedTexSubImage3D:q,scissor:de,viewport:le,reset:Oe}}function Ey(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Re,h=new WeakMap,u=new Set,d,f=new WeakMap,x=!1;try{x=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(E,g){return x?new OffscreenCanvas(E,g):sr("canvas")}function m(E,g,O){let H=1,q=nt(E);if((q.width>O||q.height>O)&&(H=O/Math.max(q.width,q.height)),H<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){let re=Math.floor(H*q.width),ae=Math.floor(H*q.height);d===void 0&&(d=b(re,ae));let $=g?b(re,ae):d;return $.width=re,$.height=ae,$.getContext("2d").drawImage(E,0,0,re,ae),Le("WebGLRenderer: Texture has been resized from ("+q.width+"x"+q.height+") to ("+re+"x"+ae+")."),$}else return"data"in E&&Le("WebGLRenderer: Image in DataTexture is too big ("+q.width+"x"+q.height+")."),E;return E}function p(E){return E.generateMipmaps}function A(E){i.generateMipmap(E)}function R(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function M(E,g,O,H,q,re=!1){if(E!==null){if(i[E]!==void 0)return i[E];Le("WebGLRenderer: Attempt to use non-existing WebGL internal format \'"+E+"\'")}let ae;H&&(ae=e.get("EXT_texture_norm16"),ae||Le("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=g;if(g===i.RED&&(O===i.FLOAT&&($=i.R32F),O===i.HALF_FLOAT&&($=i.R16F),O===i.UNSIGNED_BYTE&&($=i.R8),O===i.UNSIGNED_SHORT&&ae&&($=ae.R16_EXT),O===i.SHORT&&ae&&($=ae.R16_SNORM_EXT)),g===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&($=i.R8UI),O===i.UNSIGNED_SHORT&&($=i.R16UI),O===i.UNSIGNED_INT&&($=i.R32UI),O===i.BYTE&&($=i.R8I),O===i.SHORT&&($=i.R16I),O===i.INT&&($=i.R32I)),g===i.RG&&(O===i.FLOAT&&($=i.RG32F),O===i.HALF_FLOAT&&($=i.RG16F),O===i.UNSIGNED_BYTE&&($=i.RG8),O===i.UNSIGNED_SHORT&&ae&&($=ae.RG16_EXT),O===i.SHORT&&ae&&($=ae.RG16_SNORM_EXT)),g===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&($=i.RG8UI),O===i.UNSIGNED_SHORT&&($=i.RG16UI),O===i.UNSIGNED_INT&&($=i.RG32UI),O===i.BYTE&&($=i.RG8I),O===i.SHORT&&($=i.RG16I),O===i.INT&&($=i.RG32I)),g===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&($=i.RGB8UI),O===i.UNSIGNED_SHORT&&($=i.RGB16UI),O===i.UNSIGNED_INT&&($=i.RGB32UI),O===i.BYTE&&($=i.RGB8I),O===i.SHORT&&($=i.RGB16I),O===i.INT&&($=i.RGB32I)),g===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&($=i.RGBA8UI),O===i.UNSIGNED_SHORT&&($=i.RGBA16UI),O===i.UNSIGNED_INT&&($=i.RGBA32UI),O===i.BYTE&&($=i.RGBA8I),O===i.SHORT&&($=i.RGBA16I),O===i.INT&&($=i.RGBA32I)),g===i.RGB&&(O===i.UNSIGNED_SHORT&&ae&&($=ae.RGB16_EXT),O===i.SHORT&&ae&&($=ae.RGB16_SNORM_EXT),O===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&($=i.R11F_G11F_B10F)),g===i.RGBA){let Q=re?ir:Ye.getTransfer(q);O===i.FLOAT&&($=i.RGBA32F),O===i.HALF_FLOAT&&($=i.RGBA16F),O===i.UNSIGNED_BYTE&&($=Q===tt?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT&&ae&&($=ae.RGBA16_EXT),O===i.SHORT&&ae&&($=ae.RGBA16_SNORM_EXT),O===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function S(E,g){let O;return E?g===null||g===kn||g===ks?O=i.DEPTH24_STENCIL8:g===On?O=i.DEPTH32F_STENCIL8:g===Us&&(O=i.DEPTH24_STENCIL8,Le("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===kn||g===ks?O=i.DEPTH_COMPONENT24:g===On?O=i.DEPTH_COMPONENT32F:g===Us&&(O=i.DEPTH_COMPONENT16),O}function w(E,g){return p(E)===!0||E.isFramebufferTexture&&E.minFilter!==Vt&&E.minFilter!==Xt?Math.log2(Math.max(g.width,g.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?g.mipmaps.length:1}function C(E){let g=E.target;g.removeEventListener("dispose",C),T(g),g.isVideoTexture&&h.delete(g),g.isHTMLTexture&&u.delete(g)}function y(E){let g=E.target;g.removeEventListener("dispose",y),U(g)}function T(E){let g=n.get(E);if(g.__webglInit===void 0)return;let O=E.source,H=f.get(O);if(H){let q=H[g.__cacheKey];q.usedTimes--,q.usedTimes===0&&L(E),Object.keys(H).length===0&&f.delete(O)}n.remove(E)}function L(E){let g=n.get(E);i.deleteTexture(g.__webglTexture);let O=E.source,H=f.get(O);delete H[g.__cacheKey],a.memory.textures--}function U(E){let g=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let H=0;H<6;H++){if(Array.isArray(g.__webglFramebuffer[H]))for(let q=0;q<g.__webglFramebuffer[H].length;q++)i.deleteFramebuffer(g.__webglFramebuffer[H][q]);else i.deleteFramebuffer(g.__webglFramebuffer[H]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[H])}else{if(Array.isArray(g.__webglFramebuffer))for(let H=0;H<g.__webglFramebuffer.length;H++)i.deleteFramebuffer(g.__webglFramebuffer[H]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let H=0;H<g.__webglColorRenderbuffer.length;H++)g.__webglColorRenderbuffer[H]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[H]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}let O=E.textures;for(let H=0,q=O.length;H<q;H++){let re=n.get(O[H]);re.__webglTexture&&(i.deleteTexture(re.__webglTexture),a.memory.textures--),n.remove(O[H])}n.remove(E)}let F=0;function G(){F=0}function D(){return F}function V(E){F=E}function J(){let E=F;return E>=s.maxTextures&&Le("WebGLTextures: Trying to use "+(E+1)+" texture units while this GPU supports only "+s.maxTextures),F+=1,E}function j(E){let g=[];return g.push(E.wrapS),g.push(E.wrapT),g.push(E.wrapR||0),g.push(E.magFilter),g.push(E.minFilter),g.push(E.anisotropy),g.push(E.internalFormat),g.push(E.format),g.push(E.type),g.push(E.generateMipmaps),g.push(E.premultiplyAlpha),g.push(E.flipY),g.push(E.unpackAlignment),g.push(E.colorSpace),g.join()}function se(E,g){let O=n.get(E);if(E.isVideoTexture&&N(E),E.isRenderTargetTexture===!1&&E.isExternalTexture!==!0&&E.version>0&&O.__version!==E.version){let H=E.image;if(H===null)Le("WebGLRenderer: Texture marked for update but no image data found.");else if(H.complete===!1)Le("WebGLRenderer: Texture marked for update but image is incomplete");else{_e(O,E,g);return}}else E.isExternalTexture&&(O.__webglTexture=E.sourceTexture?E.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+g)}function Y(E,g){let O=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&O.__version!==E.version){_e(O,E,g);return}else E.isExternalTexture&&(O.__webglTexture=E.sourceTexture?E.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+g)}function te(E,g){let O=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&O.__version!==E.version){_e(O,E,g);return}t.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+g)}function ie(E,g){let O=n.get(E);if(E.isCubeDepthTexture!==!0&&E.version>0&&O.__version!==E.version){ke(O,E,g);return}t.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+g)}let Ce={[Ms]:i.REPEAT,[Wn]:i.CLAMP_TO_EDGE,[va]:i.MIRRORED_REPEAT},Te={[Vt]:i.NEAREST,[Bd]:i.NEAREST_MIPMAP_NEAREST,[Sr]:i.NEAREST_MIPMAP_LINEAR,[Xt]:i.LINEAR,[Ya]:i.LINEAR_MIPMAP_NEAREST,[Ii]:i.LINEAR_MIPMAP_LINEAR},ct={[Vd]:i.NEVER,[Zd]:i.ALWAYS,[Wd]:i.LESS,[Io]:i.LEQUAL,[Xd]:i.EQUAL,[Do]:i.GEQUAL,[qd]:i.GREATER,[Yd]:i.NOTEQUAL};function Ze(E,g){if(g.type===On&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===Xt||g.magFilter===Ya||g.magFilter===Sr||g.magFilter===Ii||g.minFilter===Xt||g.minFilter===Ya||g.minFilter===Sr||g.minFilter===Ii)&&Le("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,Ce[g.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,Ce[g.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,Ce[g.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,Te[g.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,Te[g.minFilter]),g.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,ct[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===Vt||g.minFilter!==Sr&&g.minFilter!==Ii||g.type===On&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){let O=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function Ke(E,g){let O=!1;E.__webglInit===void 0&&(E.__webglInit=!0,g.addEventListener("dispose",C));let H=g.source,q=f.get(H);q===void 0&&(q={},f.set(H,q));let re=j(g);if(re!==E.__cacheKey){q[re]===void 0&&(q[re]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,O=!0),q[re].usedTimes++;let ae=q[E.__cacheKey];ae!==void 0&&(q[E.__cacheKey].usedTimes--,ae.usedTimes===0&&L(g)),E.__cacheKey=re,E.__webglTexture=q[re].texture}return O}function Z(E,g,O){return Math.floor(Math.floor(E/O)/g)}function ee(E,g,O,H){let re=E.updateRanges;if(re.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,O,H,g.data);else{re.sort((we,de)=>we.start-de.start);let ae=0;for(let we=1;we<re.length;we++){let de=re[ae],le=re[we],Ee=de.start+de.count,Pe=Z(le.start,g.width,4),Oe=Z(de.start,g.width,4);le.start<=Ee+1&&Pe===Oe&&Z(le.start+le.count-1,g.width,4)===Pe?de.count=Math.max(de.count,le.start+le.count-de.start):(++ae,re[ae]=le)}re.length=ae+1;let $=t.getParameter(i.UNPACK_ROW_LENGTH),Q=t.getParameter(i.UNPACK_SKIP_PIXELS),oe=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let we=0,de=re.length;we<de;we++){let le=re[we],Ee=Math.floor(le.start/4),Pe=Math.ceil(le.count/4),Oe=Ee%g.width,I=Math.floor(Ee/g.width),ce=Pe,K=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,Oe),t.pixelStorei(i.UNPACK_SKIP_ROWS,I),t.texSubImage2D(i.TEXTURE_2D,0,Oe,I,ce,K,O,H,g.data)}E.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,$),t.pixelStorei(i.UNPACK_SKIP_PIXELS,Q),t.pixelStorei(i.UNPACK_SKIP_ROWS,oe)}}function _e(E,g,O){let H=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(H=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(H=i.TEXTURE_3D);let q=Ke(E,g),re=g.source;t.bindTexture(H,E.__webglTexture,i.TEXTURE0+O);let ae=n.get(re);if(re.version!==ae.__version||q===!0){if(t.activeTexture(i.TEXTURE0+O),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){let K=Ye.getPrimaries(Ye.workingColorSpace),he=g.colorSpace===ri?null:Ye.getPrimaries(g.colorSpace),me=g.colorSpace===ri||K===he?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,me)}t.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment);let Q=m(g.image,!1,s.maxTextureSize);Q=qt(g,Q);let oe=r.convert(g.format,g.colorSpace),we=r.convert(g.type),de=M(g.internalFormat,oe,we,g.normalized,g.colorSpace,g.isVideoTexture);Ze(H,g);let le,Ee=g.mipmaps,Pe=g.isVideoTexture!==!0,Oe=ae.__version===void 0||q===!0,I=re.dataReady,ce=w(g,Q);if(g.isDepthTexture)de=S(g.format===Di,g.type),Oe&&(Pe?t.texStorage2D(i.TEXTURE_2D,1,de,Q.width,Q.height):t.texImage2D(i.TEXTURE_2D,0,de,Q.width,Q.height,0,oe,we,null));else if(g.isDataTexture)if(Ee.length>0){Pe&&Oe&&t.texStorage2D(i.TEXTURE_2D,ce,de,Ee[0].width,Ee[0].height);for(let K=0,he=Ee.length;K<he;K++)le=Ee[K],Pe?I&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,oe,we,le.data):t.texImage2D(i.TEXTURE_2D,K,de,le.width,le.height,0,oe,we,le.data);g.generateMipmaps=!1}else Pe?(Oe&&t.texStorage2D(i.TEXTURE_2D,ce,de,Q.width,Q.height),I&&ee(g,Q,oe,we)):t.texImage2D(i.TEXTURE_2D,0,de,Q.width,Q.height,0,oe,we,Q.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){Pe&&Oe&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,de,Ee[0].width,Ee[0].height,Q.depth);for(let K=0,he=Ee.length;K<he;K++)if(le=Ee[K],g.format!==An)if(oe!==null)if(Pe){if(I)if(g.layerUpdates.size>0){let me=pc(le.width,le.height,g.format,g.type);for(let ne of g.layerUpdates){let Ae=le.data.subarray(ne*me/le.data.BYTES_PER_ELEMENT,(ne+1)*me/le.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,ne,le.width,le.height,1,oe,Ae)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,le.width,le.height,Q.depth,oe,le.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,K,de,le.width,le.height,Q.depth,0,le.data,0,0);else Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Pe?I&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,le.width,le.height,Q.depth,oe,we,le.data):t.texImage3D(i.TEXTURE_2D_ARRAY,K,de,le.width,le.height,Q.depth,0,oe,we,le.data);g.layerUpdates.size>0&&g.clearLayerUpdates()}else{Pe&&Oe&&t.texStorage2D(i.TEXTURE_2D,ce,de,Ee[0].width,Ee[0].height);for(let K=0,he=Ee.length;K<he;K++)le=Ee[K],g.format!==An?oe!==null?Pe?I&&t.compressedTexSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,oe,le.data):t.compressedTexImage2D(i.TEXTURE_2D,K,de,le.width,le.height,0,le.data):Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Pe?I&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,le.width,le.height,oe,we,le.data):t.texImage2D(i.TEXTURE_2D,K,de,le.width,le.height,0,oe,we,le.data)}else if(g.isDataArrayTexture)if(Pe){if(Oe&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ce,de,Q.width,Q.height,Q.depth),I)if(g.layerUpdates.size>0){let K=pc(Q.width,Q.height,g.format,g.type);for(let he of g.layerUpdates){let me=Q.data.subarray(he*K/Q.data.BYTES_PER_ELEMENT,(he+1)*K/Q.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,he,Q.width,Q.height,1,oe,we,me)}g.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,oe,we,Q.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,de,Q.width,Q.height,Q.depth,0,oe,we,Q.data);else if(g.isData3DTexture)Pe?(Oe&&t.texStorage3D(i.TEXTURE_3D,ce,de,Q.width,Q.height,Q.depth),I&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,oe,we,Q.data)):t.texImage3D(i.TEXTURE_3D,0,de,Q.width,Q.height,Q.depth,0,oe,we,Q.data);else if(g.isFramebufferTexture){if(Oe)if(Pe)t.texStorage2D(i.TEXTURE_2D,ce,de,Q.width,Q.height);else{let K=Q.width,he=Q.height;for(let me=0;me<ce;me++)t.texImage2D(i.TEXTURE_2D,me,de,K,he,0,oe,we,null),K>>=1,he>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in i){let K=i.canvas;if(K.hasAttribute("layoutsubtree")||K.setAttribute("layoutsubtree","true"),Q.parentNode!==K){K.appendChild(Q),u.add(g),K.onpaint=he=>{let me=he.changedElements;for(let ne of u)me.includes(ne.image)&&(ne.needsUpdate=!0)},K.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,Q);else{let me=i.RGBA,ne=i.RGBA,Ae=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,me,ne,Ae,Q)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ee.length>0){if(Pe&&Oe){let K=nt(Ee[0]);t.texStorage2D(i.TEXTURE_2D,ce,de,K.width,K.height)}for(let K=0,he=Ee.length;K<he;K++)le=Ee[K],Pe?I&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,oe,we,le):t.texImage2D(i.TEXTURE_2D,K,de,oe,we,le);g.generateMipmaps=!1}else if(Pe){if(Oe){let K=nt(Q);t.texStorage2D(i.TEXTURE_2D,ce,de,K.width,K.height)}I&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,oe,we,Q)}else t.texImage2D(i.TEXTURE_2D,0,de,oe,we,Q);p(g)&&A(H),ae.__version=re.version,g.onUpdate&&g.onUpdate(g)}E.__version=g.version}function ke(E,g,O){if(g.image.length!==6)return;let H=Ke(E,g),q=g.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+O);let re=n.get(q);if(q.version!==re.__version||H===!0){t.activeTexture(i.TEXTURE0+O);let ae=Ye.getPrimaries(Ye.workingColorSpace),$=g.colorSpace===ri?null:Ye.getPrimaries(g.colorSpace),Q=g.colorSpace===ri||ae===$?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Q);let oe=g.isCompressedTexture||g.image[0].isCompressedTexture,we=g.image[0]&&g.image[0].isDataTexture,de=[];for(let ne=0;ne<6;ne++)!oe&&!we?de[ne]=m(g.image[ne],!0,s.maxCubemapSize):de[ne]=we?g.image[ne].image:g.image[ne],de[ne]=qt(g,de[ne]);let le=de[0],Ee=r.convert(g.format,g.colorSpace),Pe=r.convert(g.type),Oe=M(g.internalFormat,Ee,Pe,g.normalized,g.colorSpace),I=g.isVideoTexture!==!0,ce=re.__version===void 0||H===!0,K=q.dataReady,he=w(g,le);Ze(i.TEXTURE_CUBE_MAP,g);let me;if(oe){I&&ce&&t.texStorage2D(i.TEXTURE_CUBE_MAP,he,Oe,le.width,le.height);for(let ne=0;ne<6;ne++){me=de[ne].mipmaps;for(let Ae=0;Ae<me.length;Ae++){let Me=me[Ae];g.format!==An?Ee!==null?I?K&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,0,0,Me.width,Me.height,Ee,Me.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,Oe,Me.width,Me.height,0,Me.data):Le("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,0,0,Me.width,Me.height,Ee,Pe,Me.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,Oe,Me.width,Me.height,0,Ee,Pe,Me.data)}}}else{if(me=g.mipmaps,I&&ce){me.length>0&&he++;let ne=nt(de[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,he,Oe,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(we){I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,de[ne].width,de[ne].height,Ee,Pe,de[ne].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Oe,de[ne].width,de[ne].height,0,Ee,Pe,de[ne].data);for(let Ae=0;Ae<me.length;Ae++){let dt=me[Ae].image[ne].image;I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,0,0,dt.width,dt.height,Ee,Pe,dt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,Oe,dt.width,dt.height,0,Ee,Pe,dt.data)}}else{I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,Ee,Pe,de[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Oe,Ee,Pe,de[ne]);for(let Ae=0;Ae<me.length;Ae++){let Me=me[Ae];I?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,0,0,Ee,Pe,Me.image[ne]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,Oe,Ee,Pe,Me.image[ne])}}}p(g)&&A(i.TEXTURE_CUBE_MAP),re.__version=q.version,g.onUpdate&&g.onUpdate(g)}E.__version=g.version}function xe(E,g,O,H,q,re){let ae=r.convert(O.format,O.colorSpace),$=r.convert(O.type),Q=M(O.internalFormat,ae,$,O.normalized,O.colorSpace),oe=n.get(g),we=n.get(O);if(we.__renderTarget=g,!oe.__hasExternalTextures){let de=Math.max(1,g.width>>re),le=Math.max(1,g.height>>re);q===i.TEXTURE_3D||q===i.TEXTURE_2D_ARRAY?t.texImage3D(q,re,Q,de,le,g.depth,0,ae,$,null):t.texImage2D(q,re,Q,de,le,0,ae,$,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),wt(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,H,q,we.__webglTexture,0,yt(g)):(q===i.TEXTURE_2D||q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,H,q,we.__webglTexture,re),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ge(E,g,O){if(i.bindRenderbuffer(i.RENDERBUFFER,E),g.depthBuffer){let H=g.depthTexture,q=H&&H.isDepthTexture?H.type:null,re=S(g.stencilBuffer,q),ae=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;wt(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,yt(g),re,g.width,g.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,yt(g),re,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,re,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ae,i.RENDERBUFFER,E)}else{let H=g.textures;for(let q=0;q<H.length;q++){let re=H[q],ae=r.convert(re.format,re.colorSpace),$=r.convert(re.type),Q=M(re.internalFormat,ae,$,re.normalized,re.colorSpace);wt(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,yt(g),Q,g.width,g.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,yt(g),Q,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,Q,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Dt(E,g,O){let H=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let q=n.get(g.depthTexture);if(q.__renderTarget=g,(!q.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),H){if(q.__webglInit===void 0&&(q.__webglInit=!0,g.depthTexture.addEventListener("dispose",C)),q.__webglTexture===void 0){q.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,q.__webglTexture),Ze(i.TEXTURE_CUBE_MAP,g.depthTexture);let oe=r.convert(g.depthTexture.format),we=r.convert(g.depthTexture.type),de;g.depthTexture.format===Xn?de=i.DEPTH_COMPONENT24:g.depthTexture.format===Di&&(de=i.DEPTH24_STENCIL8);for(let le=0;le<6;le++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+le,0,de,g.width,g.height,0,oe,we,null)}}else se(g.depthTexture,0);let re=q.__webglTexture,ae=yt(g),$=H?i.TEXTURE_CUBE_MAP_POSITIVE_X+O:i.TEXTURE_2D,Q=g.depthTexture.format===Di?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(g.depthTexture.format===Xn)wt(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,$,re,0,ae):i.framebufferTexture2D(i.FRAMEBUFFER,Q,$,re,0);else if(g.depthTexture.format===Di)wt(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,$,re,0,ae):i.framebufferTexture2D(i.FRAMEBUFFER,Q,$,re,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function We(E){let g=n.get(E),O=E.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==E.depthTexture){let H=E.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),H){let q=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,H.removeEventListener("dispose",q)};H.addEventListener("dispose",q),g.__depthDisposeCallback=q}g.__boundDepthTexture=H}if(E.depthTexture&&!g.__autoAllocateDepthBuffer)if(O)for(let H=0;H<6;H++)Dt(g.__webglFramebuffer[H],E,H);else{let H=E.texture.mipmaps;H&&H.length>0?Dt(g.__webglFramebuffer[0],E,0):Dt(g.__webglFramebuffer,E,0)}else if(O){g.__webglDepthbuffer=[];for(let H=0;H<6;H++)if(t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[H]),g.__webglDepthbuffer[H]===void 0)g.__webglDepthbuffer[H]=i.createRenderbuffer(),Ge(g.__webglDepthbuffer[H],E,!1);else{let q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=g.__webglDepthbuffer[H];i.bindRenderbuffer(i.RENDERBUFFER,re),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,re)}}else{let H=E.texture.mipmaps;if(H&&H.length>0?t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),Ge(g.__webglDepthbuffer,E,!1);else{let q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,re=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,re),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,re)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function je(E,g,O){let H=n.get(E);g!==void 0&&xe(H.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&We(E)}function ht(E){let g=E.texture,O=n.get(E),H=n.get(g);E.addEventListener("dispose",y);let q=E.textures,re=E.isWebGLCubeRenderTarget===!0,ae=q.length>1;if(ae||(H.__webglTexture===void 0&&(H.__webglTexture=i.createTexture()),H.__version=g.version,a.memory.textures++),re){O.__webglFramebuffer=[];for(let $=0;$<6;$++)if(g.mipmaps&&g.mipmaps.length>0){O.__webglFramebuffer[$]=[];for(let Q=0;Q<g.mipmaps.length;Q++)O.__webglFramebuffer[$][Q]=i.createFramebuffer()}else O.__webglFramebuffer[$]=i.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){O.__webglFramebuffer=[];for(let $=0;$<g.mipmaps.length;$++)O.__webglFramebuffer[$]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(ae)for(let $=0,Q=q.length;$<Q;$++){let oe=n.get(q[$]);oe.__webglTexture===void 0&&(oe.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&wt(E)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let $=0;$<q.length;$++){let Q=q[$];O.__webglColorRenderbuffer[$]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[$]);let oe=r.convert(Q.format,Q.colorSpace),we=r.convert(Q.type),de=M(Q.internalFormat,oe,we,Q.normalized,Q.colorSpace,E.isXRRenderTarget===!0),le=yt(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,le,de,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+$,i.RENDERBUFFER,O.__webglColorRenderbuffer[$])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),Ge(O.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(re){t.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture),Ze(i.TEXTURE_CUBE_MAP,g);for(let $=0;$<6;$++)if(g.mipmaps&&g.mipmaps.length>0)for(let Q=0;Q<g.mipmaps.length;Q++)xe(O.__webglFramebuffer[$][Q],E,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,Q);else xe(O.__webglFramebuffer[$],E,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);p(g)&&A(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ae){for(let $=0,Q=q.length;$<Q;$++){let oe=q[$],we=n.get(oe),de=i.TEXTURE_2D;(E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(de=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(de,we.__webglTexture),Ze(de,oe),xe(O.__webglFramebuffer,E,oe,i.COLOR_ATTACHMENT0+$,de,0),p(oe)&&A(de)}t.unbindTexture()}else{let $=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&($=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture($,H.__webglTexture),Ze($,g),g.mipmaps&&g.mipmaps.length>0)for(let Q=0;Q<g.mipmaps.length;Q++)xe(O.__webglFramebuffer[Q],E,g,i.COLOR_ATTACHMENT0,$,Q);else xe(O.__webglFramebuffer,E,g,i.COLOR_ATTACHMENT0,$,0);p(g)&&A($),t.unbindTexture()}E.depthBuffer&&We(E)}function qe(E){let g=E.textures;for(let O=0,H=g.length;O<H;O++){let q=g[O];if(p(q)){let re=R(E),ae=n.get(q).__webglTexture;t.bindTexture(re,ae),A(re),t.unbindTexture()}}}let mt=[],Ft=[];function ln(E){if(E.samples>0){if(wt(E)===!1){let g=E.textures,O=E.width,H=E.height,q=i.COLOR_BUFFER_BIT,re=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=n.get(E),$=g.length>1;if($)for(let oe=0;oe<g.length;oe++)t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ae.__webglMultisampledFramebuffer);let Q=E.texture.mipmaps;Q&&Q.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglFramebuffer);for(let oe=0;oe<g.length;oe++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(q|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(q|=i.STENCIL_BUFFER_BIT)),$){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ae.__webglColorRenderbuffer[oe]);let we=n.get(g[oe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,we,0)}i.blitFramebuffer(0,0,O,H,0,0,O,H,q,i.NEAREST),l===!0&&(mt.length=0,Ft.length=0,mt.push(i.COLOR_ATTACHMENT0+oe),E.depthBuffer&&E.storeMultisampledDepthBuffer===!1&&(mt.push(re),Ft.push(re),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ft)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,mt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),$)for(let oe=0;oe<g.length;oe++){t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,ae.__webglColorRenderbuffer[oe]);let we=n.get(g[oe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ae.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,we,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ae.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.storeMultisampledDepthBuffer===!1&&l){let g=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function yt(E){return Math.min(s.maxSamples,E.samples)}function wt(E){let g=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function N(E){let g=a.render.frame;h.get(E)!==g&&(h.set(E,g),E.update())}function qt(E,g){let O=E.colorSpace,H=E.format,q=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||O!==nr&&O!==ri&&(Ye.getTransfer(O)===tt?(H!==An||q!==dn)&&Le("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ie("WebGLTextures: Unsupported texture color space:",O)),g}function nt(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(c.width=E.naturalWidth||E.width,c.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(c.width=E.displayWidth,c.height=E.displayHeight):(c.width=E.width,c.height=E.height),c}this.allocateTextureUnit=J,this.resetTextureUnits=G,this.getTextureUnits=D,this.setTextureUnits=V,this.setTexture2D=se,this.setTexture2DArray=Y,this.setTexture3D=te,this.setTextureCube=ie,this.rebindTextures=je,this.setupRenderTarget=ht,this.updateRenderTargetMipmap=qe,this.updateMultisampleRenderTarget=ln,this.setupDepthRenderbuffer=We,this.setupFrameBufferTexture=xe,this.useMultisampledRTT=wt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Ty(i,e){function t(n,s=ri){let r,a=Ye.getTransfer(s);if(n===dn)return i.UNSIGNED_BYTE;if(n===$a)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ja)return i.UNSIGNED_SHORT_5_5_5_1;if(n===ic)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===sc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===tc)return i.BYTE;if(n===nc)return i.SHORT;if(n===Us)return i.UNSIGNED_SHORT;if(n===Za)return i.INT;if(n===kn)return i.UNSIGNED_INT;if(n===On)return i.FLOAT;if(n===Fn)return i.HALF_FLOAT;if(n===rc)return i.ALPHA;if(n===ac)return i.RGB;if(n===An)return i.RGBA;if(n===Xn)return i.DEPTH_COMPONENT;if(n===Di)return i.DEPTH_STENCIL;if(n===oc)return i.RED;if(n===ja)return i.RED_INTEGER;if(n===Ni)return i.RG;if(n===Ka)return i.RG_INTEGER;if(n===Qa)return i.RGBA_INTEGER;if(n===wr||n===Er||n===Tr||n===Ar)if(a===tt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===wr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Er)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Tr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ar)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===wr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Er)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Tr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ar)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===eo||n===to||n===no||n===io)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===eo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===to)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===no)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===io)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===so||n===ro||n===ao||n===oo||n===lo||n===Cr||n===co)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===so||n===ro)return a===tt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ao)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===oo)return r.COMPRESSED_R11_EAC;if(n===lo)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Cr)return r.COMPRESSED_RG11_EAC;if(n===co)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===ho||n===uo||n===fo||n===po||n===mo||n===go||n===xo||n===yo||n===_o||n===vo||n===bo||n===Mo||n===So||n===wo)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===ho)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===uo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===fo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===po)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===mo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===go)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===xo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===yo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===_o)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===vo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===bo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Mo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===So)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===wo)return a===tt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Eo||n===To||n===Ao)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Eo)return a===tt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===To)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ao)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Co||n===Ro||n===Rr||n===Po)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Co)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ro)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Rr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Po)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ks?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var Ay=`\nvoid main() {\n\n	gl_Position = vec4( position, 1.0 );\n\n}`,Cy=`\nuniform sampler2DArray depthColor;\nuniform float depthWidth;\nuniform float depthHeight;\n\nvoid main() {\n\n	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );\n\n	if ( coord.x >= 1.0 ) {\n\n		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;\n\n	} else {\n\n		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;\n\n	}\n\n}`,Dc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new dr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new xn({vertexShader:Ay,fragmentShader:Cy,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Je(new Tn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Nc=class extends Dn{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,x=null,b=typeof XRWebGLBinding<"u",m=new Dc,p={},A=t.getContextAttributes(),R=null,M=null,S=[],w=[],C=new Re,y=null,T=null,L=new Jt;L.viewport=new xt;let U=new Jt;U.viewport=new xt;let F=[L,U],G=new Ga,D=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Z){let ee=S[Z];return ee===void 0&&(ee=new Cs,S[Z]=ee),ee.getTargetRaySpace()},this.getControllerGrip=function(Z){let ee=S[Z];return ee===void 0&&(ee=new Cs,S[Z]=ee),ee.getGripSpace()},this.getHand=function(Z){let ee=S[Z];return ee===void 0&&(ee=new Cs,S[Z]=ee),ee.getHandSpace()};function J(Z){let ee=w.indexOf(Z.inputSource);if(ee===-1)return;let _e=S[ee];_e!==void 0&&(_e.update(Z.inputSource,Z.frame,c||a),_e.dispatchEvent({type:Z.type,data:Z.inputSource}))}function j(){s.removeEventListener("select",J),s.removeEventListener("selectstart",J),s.removeEventListener("selectend",J),s.removeEventListener("squeeze",J),s.removeEventListener("squeezestart",J),s.removeEventListener("squeezeend",J),s.removeEventListener("end",j),s.removeEventListener("inputsourceschange",se);for(let Z=0;Z<S.length;Z++){let ee=w[Z];ee!==null&&(w[Z]=null,S[Z].disconnect(ee))}D=null,V=null,m.reset();for(let Z in p)delete p[Z];if(e.setRenderTarget(R),f=null,d=null,u=null,s=null,M=null,Ke.stop(),n.isPresenting=!1,e.setPixelRatio(y),e.setSize(C.width,C.height,!1),T!==null){let Z=T.camera;Z.fov=T.fov,Z.zoom=T.zoom,Z.updateProjectionMatrix(),T=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Z){r=Z,n.isPresenting===!0&&Le("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Z){o=Z,n.isPresenting===!0&&Le("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Z){c=Z},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&b&&(u=new XRWebGLBinding(s,t)),u},this.getFrame=function(){return x},this.getSession=function(){return s},this.setSession=async function(Z){if(s=Z,s!==null){if(R=e.getRenderTarget(),s.addEventListener("select",J),s.addEventListener("selectstart",J),s.addEventListener("selectend",J),s.addEventListener("squeeze",J),s.addEventListener("squeezestart",J),s.addEventListener("squeezeend",J),s.addEventListener("end",j),s.addEventListener("inputsourceschange",se),A.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(C),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let _e=null,ke=null,xe=null;A.depth&&(xe=A.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,_e=A.stencil?Di:Xn,ke=A.stencil?ks:kn);let Ge={colorFormat:t.RGBA8,depthFormat:xe,scaleFactor:r};u=this.getBinding(),d=u.createProjectionLayer(Ge),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),M=new hn(d.textureWidth,d.textureHeight,{format:An,type:dn,depthTexture:new wi(d.textureWidth,d.textureHeight,ke,void 0,void 0,void 0,void 0,void 0,void 0,_e),stencilBuffer:A.stencil,colorSpace:e.outputColorSpace,samples:A.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let _e={antialias:A.antialias,alpha:!0,depth:A.depth,stencil:A.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,_e),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),M=new hn(f.framebufferWidth,f.framebufferHeight,{format:An,type:dn,colorSpace:e.outputColorSpace,stencilBuffer:A.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Ke.setContext(s),Ke.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function se(Z){for(let ee=0;ee<Z.removed.length;ee++){let _e=Z.removed[ee],ke=w.indexOf(_e);ke>=0&&(w[ke]=null,S[ke].disconnect(_e))}for(let ee=0;ee<Z.added.length;ee++){let _e=Z.added[ee],ke=w.indexOf(_e);if(ke===-1){for(let Ge=0;Ge<S.length;Ge++)if(Ge>=w.length){w.push(_e),ke=Ge;break}else if(w[Ge]===null){w[Ge]=_e,ke=Ge;break}if(ke===-1)break}let xe=S[ke];xe&&xe.connect(_e)}}let Y=new k,te=new k;function ie(Z,ee,_e){Y.setFromMatrixPosition(ee.matrixWorld),te.setFromMatrixPosition(_e.matrixWorld);let ke=Y.distanceTo(te),xe=ee.projectionMatrix.elements,Ge=_e.projectionMatrix.elements,Dt=xe[14]/(xe[10]-1),We=xe[14]/(xe[10]+1),je=(xe[9]+1)/xe[5],ht=(xe[9]-1)/xe[5],qe=(xe[8]-1)/xe[0],mt=(Ge[8]+1)/Ge[0],Ft=Dt*qe,ln=Dt*mt,yt=ke/(-qe+mt),wt=yt*-qe;if(ee.matrixWorld.decompose(Z.position,Z.quaternion,Z.scale),Z.translateX(wt),Z.translateZ(yt),Z.matrixWorld.compose(Z.position,Z.quaternion,Z.scale),Z.matrixWorldInverse.copy(Z.matrixWorld).invert(),xe[10]===-1)Z.projectionMatrix.copy(ee.projectionMatrix),Z.projectionMatrixInverse.copy(ee.projectionMatrixInverse);else{let N=Dt+yt,qt=We+yt,nt=Ft-wt,E=ln+(ke-wt),g=je*We/qt*N,O=ht*We/qt*N;Z.projectionMatrix.makePerspective(nt,E,g,O,N,qt),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert()}}function Ce(Z,ee){ee===null?Z.matrixWorld.copy(Z.matrix):Z.matrixWorld.multiplyMatrices(ee.matrixWorld,Z.matrix),Z.matrixWorldInverse.copy(Z.matrixWorld).invert()}this.updateCamera=function(Z){if(s===null)return;let ee=Z.near,_e=Z.far;m.texture!==null&&(m.depthNear>0&&(ee=m.depthNear),m.depthFar>0&&(_e=m.depthFar)),G.near=U.near=L.near=ee,G.far=U.far=L.far=_e,(D!==G.near||V!==G.far)&&(s.updateRenderState({depthNear:G.near,depthFar:G.far}),D=G.near,V=G.far),G.layers.mask=Z.layers.mask|6,L.layers.mask=G.layers.mask&-5,U.layers.mask=G.layers.mask&-3;let ke=Z.parent,xe=G.cameras;Ce(G,ke);for(let Ge=0;Ge<xe.length;Ge++)Ce(xe[Ge],ke);xe.length===2?ie(G,L,U):G.projectionMatrix.copy(L.projectionMatrix),T===null&&Z.isPerspectiveCamera&&(T={camera:Z,fov:Z.fov,zoom:Z.zoom}),Te(Z,G,ke)};function Te(Z,ee,_e){_e===null?Z.matrix.copy(ee.matrixWorld):(Z.matrix.copy(_e.matrixWorld),Z.matrix.invert(),Z.matrix.multiply(ee.matrixWorld)),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.updateMatrixWorld(!0),Z.projectionMatrix.copy(ee.projectionMatrix),Z.projectionMatrixInverse.copy(ee.projectionMatrixInverse),Z.isPerspectiveCamera&&(Z.fov=Es*2*Math.atan(1/Z.projectionMatrix.elements[5]),Z.zoom=1)}this.getCamera=function(){return G},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(Z){l=Z,d!==null&&(d.fixedFoveation=Z),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Z)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(G)},this.getCameraTexture=function(Z){return p[Z]};let ct=null;function Ze(Z,ee){if(h=ee.getViewerPose(c||a),x=ee,h!==null){let _e=h.views;f!==null&&(e.setRenderTargetFramebuffer(M,f.framebuffer),e.setRenderTarget(M));let ke=!1;_e.length!==G.cameras.length&&(G.cameras.length=0,ke=!0);for(let We=0;We<_e.length;We++){let je=_e[We],ht=null;if(f!==null)ht=f.getViewport(je);else{let mt=u.getViewSubImage(d,je);ht=mt.viewport,We===0&&(e.setRenderTargetTextures(M,mt.colorTexture,mt.depthStencilTexture),e.setRenderTarget(M))}let qe=F[We];qe===void 0&&(qe=new Jt,qe.layers.enable(We),qe.viewport=new xt,F[We]=qe),qe.matrix.fromArray(je.transform.matrix),qe.matrix.decompose(qe.position,qe.quaternion,qe.scale),qe.projectionMatrix.fromArray(je.projectionMatrix),qe.projectionMatrixInverse.copy(qe.projectionMatrix).invert(),qe.viewport.set(ht.x,ht.y,ht.width,ht.height),We===0&&(G.matrix.copy(qe.matrix),G.matrix.decompose(G.position,G.quaternion,G.scale)),ke===!0&&G.cameras.push(qe)}let xe=s.enabledFeatures;if(xe&&xe.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&b){u=n.getBinding();let We=u.getDepthInformation(_e[0]);We&&We.isValid&&We.texture&&m.init(We,s.renderState)}if(xe&&xe.includes("camera-access")&&b){e.state.unbindTexture(),u=n.getBinding();for(let We=0;We<_e.length;We++){let je=_e[We].camera;if(je){let ht=p[je];ht||(ht=new dr,p[je]=ht);let qe=u.getCameraImage(je);ht.sourceTexture=qe}}}}for(let _e=0;_e<S.length;_e++){let ke=w[_e],xe=S[_e];ke!==null&&xe!==void 0&&xe.update(ke,ee,c||a)}ct&&ct(Z,ee),ee.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ee}),x=null}let Ke=new Eu;Ke.setAnimationLoop(Ze),this.setAnimationLoop=function(Z){ct=Z},this.dispose=function(){}}},Ry=new gt,Lu=new Ue;Lu.set(-1,0,0,0,1,0,0,0,1);function Py(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,dc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,A,R,M){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(m,p):p.isMeshLambertMaterial?(r(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,M)):p.isMeshMatcapMaterial?(r(m,p),x(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),b(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,A,R):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Lt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Lt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let A=e.get(p),R=A.envMap,M=A.envMapRotation;R&&(m.envMap.value=R,m.envMapRotation.value.setFromMatrix4(Ry.makeRotationFromEuler(M)).transpose(),R.isCubeTexture&&R.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Lu),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,A,R){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*A,m.scale.value=R*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,A){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Lt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=A.texture,m.transmissionSamplerSize.value.set(A.width,A.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function x(m,p){p.matcap&&(m.matcap.value=p.matcap)}function b(m,p){let A=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(A.matrixWorld),m.nearDistance.value=A.shadow.camera.near,m.farDistance.value=A.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Ly(i,e,t,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,S){let w=S.program;n.uniformBlockBinding(M,w)}function c(M,S){let w=s[M.id];w===void 0&&(m(M),w=h(M),s[M.id]=w,M.addEventListener("dispose",A));let C=S.program;n.updateUBOMapping(M,C);let y=e.render.frame;r[M.id]!==y&&(d(M),r[M.id]=y)}function h(M){let S=u();M.__bindingPointIndex=S;let w=i.createBuffer(),C=M.__size,y=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,C,y),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,S,w),w}function u(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return Ie("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){let S=s[M.id],w=M.uniforms,C=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,S);for(let y=0,T=w.length;y<T;y++){let L=w[y];if(Array.isArray(L))for(let U=0,F=L.length;U<F;U++)f(L[U],y,U,C);else f(L,y,0,C)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(M,S,w,C){if(b(M,S,w,C)===!0){let y=M.__offset,T=M.value;if(Array.isArray(T)){let L=0;for(let U=0;U<T.length;U++){let F=T[U],G=p(F);x(F,M.__data,L),typeof F!="number"&&typeof F!="boolean"&&!F.isMatrix3&&!ArrayBuffer.isView(F)&&(L+=G.storage/Float32Array.BYTES_PER_ELEMENT)}}else x(T,M.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,y,M.__data)}}function x(M,S,w){typeof M=="number"||typeof M=="boolean"?S[0]=M:M.isMatrix3?(S[0]=M.elements[0],S[1]=M.elements[1],S[2]=M.elements[2],S[3]=0,S[4]=M.elements[3],S[5]=M.elements[4],S[6]=M.elements[5],S[7]=0,S[8]=M.elements[6],S[9]=M.elements[7],S[10]=M.elements[8],S[11]=0):ArrayBuffer.isView(M)?S.set(new M.constructor(M.buffer,M.byteOffset,S.length)):M.toArray(S,w)}function b(M,S,w,C){let y=M.value,T=S+"_"+w;if(C[T]===void 0)return typeof y=="number"||typeof y=="boolean"?C[T]=y:ArrayBuffer.isView(y)?C[T]=y.slice():C[T]=y.clone(),!0;{let L=C[T];if(typeof y=="number"||typeof y=="boolean"){if(L!==y)return C[T]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(L.equals(y)===!1)return L.copy(y),!0}}return!1}function m(M){let S=M.uniforms,w=0,C=16;for(let T=0,L=S.length;T<L;T++){let U=Array.isArray(S[T])?S[T]:[S[T]];for(let F=0,G=U.length;F<G;F++){let D=U[F],V=Array.isArray(D.value)?D.value:[D.value];for(let J=0,j=V.length;J<j;J++){let se=V[J],Y=p(se),te=w%C,ie=te%Y.boundary,Ce=te+ie;w+=ie,Ce!==0&&C-Ce<Y.storage&&(w+=C-Ce),D.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=w,w+=Y.storage}}}let y=w%C;return y>0&&(w+=C-y),M.__size=w,M.__cache={},this}function p(M){let S={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(S.boundary=4,S.storage=4):M.isVector2?(S.boundary=8,S.storage=8):M.isVector3||M.isColor?(S.boundary=16,S.storage=12):M.isVector4?(S.boundary=16,S.storage=16):M.isMatrix3?(S.boundary=48,S.storage=48):M.isMatrix4?(S.boundary=64,S.storage=64):M.isTexture?Le("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(S.boundary=16,S.storage=M.byteLength):Le("WebGLRenderer: Unsupported uniform value type.",M),S}function A(M){let S=M.target;S.removeEventListener("dispose",A);let w=a.indexOf(S.__bindingPointIndex);a.splice(w,1),i.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function R(){for(let M in s)i.deleteBuffer(s[M]);a=[],s={},r={}}return{bind:l,update:c,dispose:R}}var Iy=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Yn=null;function Dy(){return Yn===null&&(Yn=new Ea(Iy,16,16,Ni,Fn),Yn.name="DFG_LUT",Yn.minFilter=Xt,Yn.magFilter=Xt,Yn.wrapS=Wn,Yn.wrapT=Wn,Yn.generateMipmaps=!1,Yn.needsUpdate=!0),Yn}var Fo=class{constructor(e={}){let{canvas:t=Jd(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=dn}=e;this.isWebGLRenderer=!0;let x;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");x=n.getContextAttributes().alpha}else x=a;let b=f,m=new Set([Qa,Ka,ja]),p=new Set([dn,kn,Us,ks,$a,Ja]),A=new Uint32Array(4),R=new Int32Array(4),M=new k,S=null,w=null,C=[],y=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Un,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let L=this,U=!1,F=null,G=null,D=null,V=null;this._outputColorSpace=Nt;let J=0,j=0,se=null,Y=-1,te=null,ie=new xt,Ce=new xt,Te=null,ct=new ze(0),Ze=0,Ke=t.width,Z=t.height,ee=1,_e=null,ke=null,xe=new xt(0,0,Ke,Z),Ge=new xt(0,0,Ke,Z),Dt=!1,We=new Ps,je=!1,ht=!1,qe=new gt,mt=new k,Ft=new xt,ln={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},yt=!1;function wt(){return se===null?ee:1}let N=n;function qt(_,P){return t.getContext(_,P)}let nt,E,g,O,H,q,re,ae,$,Q,oe,we,de,le,Ee,Pe,Oe,I,ce,K,he,me,ne;try{let _={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",dt,!1),t.addEventListener("webglcontextrestored",Qe,!1),t.addEventListener("webglcontextcreationerror",Cn,!1),N===null){let P="webgl2";if(N=qt(P,_),N===null)throw qt(P)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ae()}catch(_){throw t.removeEventListener("webglcontextlost",dt,!1),t.removeEventListener("webglcontextrestored",Qe,!1),t.removeEventListener("webglcontextcreationerror",Cn,!1),Ie("WebGLRenderer: "+_.message),_}function Ae(){nt=new z0(N),nt.init(),he=new Ty(N,nt),E=new P0(N,nt,e,he),g=new wy(N,nt),E.reversedDepthBuffer&&d&&g.buffers.depth.setReversed(!0),G=N.createFramebuffer(),D=N.createFramebuffer(),V=N.createFramebuffer(),O=new V0(N),H=new hy,q=new Ey(N,nt,g,H,E,he,O),re=new B0(L),ae=new Xp(N),me=new C0(N,ae),$=new H0(N,ae,O,me),Q=new X0(N,$,ae,me,O),I=new W0(N,E,q),Ee=new L0(H),oe=new cy(L,re,nt,E,me,Ee),we=new Py(L,H),de=new uy,le=new yy(nt),Oe=new A0(L,re,g,Q,x,l),Pe=new Sy(L,Q,E),ne=new Ly(N,O,E,g),ce=new R0(N,nt,O),K=new G0(N,nt,O),O.programs=oe.programs,L.capabilities=E,L.extensions=nt,L.properties=H,L.renderLists=de,L.shadowMap=Pe,L.state=g,L.info=O}b!==dn&&(T=new Y0(b,t.width,t.height,o,s,r));let Me=new Nc(L,N);this.xr=Me,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let _=nt.get("WEBGL_lose_context");_&&_.loseContext()},this.forceContextRestore=function(){let _=nt.get("WEBGL_lose_context");_&&_.restoreContext()},this.getPixelRatio=function(){return ee},this.setPixelRatio=function(_){_!==void 0&&(ee=_,this.setSize(Ke,Z,!1))},this.getSize=function(_){return _.set(Ke,Z)},this.setSize=function(_,P,W=!0){if(Me.isPresenting){Le("WebGLRenderer: Can\'t change size while VR device is presenting.");return}Ke=_,Z=P,t.width=Math.floor(_*ee),t.height=Math.floor(P*ee),W===!0&&(t.style.width=_+"px",t.style.height=P+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,_,P)},this.getDrawingBufferSize=function(_){return _.set(Ke*ee,Z*ee).floor()},this.setDrawingBufferSize=function(_,P,W){Ke=_,Z=P,ee=W,t.width=Math.floor(_*W),t.height=Math.floor(P*W),this.setViewport(0,0,_,P)},this.setEffects=function(_){if(b===dn){Ie("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(_){for(let P=0;P<_.length;P++)if(_[P].isOutputPass===!0){Le("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(_||[])},this.getCurrentViewport=function(_){return _.copy(ie)},this.getViewport=function(_){return _.copy(xe)},this.setViewport=function(_,P,W,B){_.isVector4?xe.set(_.x,_.y,_.z,_.w):xe.set(_,P,W,B),g.viewport(ie.copy(xe).multiplyScalar(ee).round())},this.getScissor=function(_){return _.copy(Ge)},this.setScissor=function(_,P,W,B){_.isVector4?Ge.set(_.x,_.y,_.z,_.w):Ge.set(_,P,W,B),g.scissor(Ce.copy(Ge).multiplyScalar(ee).round())},this.getScissorTest=function(){return Dt},this.setScissorTest=function(_){g.setScissorTest(Dt=_)},this.setOpaqueSort=function(_){_e=_},this.setTransparentSort=function(_){ke=_},this.getClearColor=function(_){return _.copy(Oe.getClearColor())},this.setClearColor=function(){Oe.setClearColor(...arguments)},this.getClearAlpha=function(){return Oe.getClearAlpha()},this.setClearAlpha=function(){Oe.setClearAlpha(...arguments)},this.clear=function(_=!0,P=!0,W=!0){let B=0;if(_){let z=!1;if(se!==null){let pe=se.texture.format;z=m.has(pe)}if(z){let pe=se.texture.type,ye=p.has(pe),fe=Oe.getClearColor(),ve=Oe.getClearAlpha(),Se=fe.r,Be=fe.g,Xe=fe.b;ye?(A[0]=Se,A[1]=Be,A[2]=Xe,A[3]=ve,N.clearBufferuiv(N.COLOR,0,A)):(R[0]=Se,R[1]=Be,R[2]=Xe,R[3]=ve,N.clearBufferiv(N.COLOR,0,R))}else B|=N.COLOR_BUFFER_BIT}P&&(B|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(B|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B!==0&&N.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(_){_.setRenderer(this),F=_},this.dispose=function(){t.removeEventListener("webglcontextlost",dt,!1),t.removeEventListener("webglcontextrestored",Qe,!1),t.removeEventListener("webglcontextcreationerror",Cn,!1),Oe.dispose(),de.dispose(),le.dispose(),H.dispose(),re.dispose(),Q.dispose(),me.dispose(),ne.dispose(),oe.dispose(),Me.dispose(),Me.removeEventListener("sessionstart",Jc),Me.removeEventListener("sessionend",jc),Ui.stop()};function dt(_){_.preventDefault(),cc("WebGLRenderer: Context Lost."),U=!0}function Qe(){cc("WebGLRenderer: Context Restored."),U=!1;let _=O.autoReset,P=Pe.enabled,W=Pe.autoUpdate,B=Pe.needsUpdate,z=Pe.type;Ae(),O.autoReset=_,Pe.enabled=P,Pe.autoUpdate=W,Pe.needsUpdate=B,Pe.type=z}function Cn(_){Ie("WebGLRenderer: A WebGL context could not be created. Reason: ",_.statusMessage)}function Bn(_){let P=_.target;P.removeEventListener("dispose",Bn),tf(P)}function tf(_){nf(_),H.remove(_)}function nf(_){let P=H.get(_).programs;P!==void 0&&(P.forEach(function(W){oe.releaseProgram(W)}),_.isShaderMaterial&&oe.releaseShaderCache(_))}this.renderBufferDirect=function(_,P,W,B,z,pe){P===null&&(P=ln);let ye=z.isMesh&&z.matrixWorld.determinantAffine()<0,fe=af(_,P,W,B,z);g.setMaterial(B,ye);let ve=W.index,Se=1;if(B.wireframe===!0){if(ve=$.getWireframeAttribute(W),ve===void 0)return;Se=2}let Be=W.drawRange,Xe=W.attributes.position,be=Be.start*Se,et=(Be.start+Be.count)*Se;pe!==null&&(be=Math.max(be,pe.start*Se),et=Math.min(et,(pe.start+pe.count)*Se)),ve!==null?(be=Math.max(be,0),et=Math.min(et,ve.count)):Xe!=null&&(be=Math.max(be,0),et=Math.min(et,Xe.count));let Et=et-be;if(Et<0||Et===1/0)return;me.setup(z,B,fe,W,ve);let ft,ot=ce;if(ve!==null&&(ft=ae.get(ve),ot=K,ot.setIndex(ft)),z.isMesh)B.wireframe===!0?(g.setLineWidth(B.wireframeLinewidth*wt()),ot.setMode(N.LINES)):ot.setMode(N.TRIANGLES);else if(z.isLine){let Yt=B.linewidth;Yt===void 0&&(Yt=1),g.setLineWidth(Yt*wt()),z.isLineSegments?ot.setMode(N.LINES):z.isLineLoop?ot.setMode(N.LINE_LOOP):ot.setMode(N.LINE_STRIP)}else z.isPoints?ot.setMode(N.POINTS):z.isSprite&&ot.setMode(N.TRIANGLES);if(z.isBatchedMesh)if(nt.get("WEBGL_multi_draw"))ot.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else{let Yt=z._multiDrawStarts,ge=z._multiDrawCounts,sn=z._multiDrawCount,$e=ve?ae.get(ve).bytesPerElement:1,vn=H.get(B).currentProgram.getUniforms();for(let zn=0;zn<sn;zn++)vn.setValue(N,"_gl_DrawID",zn),ot.render(Yt[zn]/$e,ge[zn])}else if(z.isInstancedMesh)ot.renderInstances(be,Et,z.count);else if(W.isInstancedBufferGeometry){let Yt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,ge=Math.min(W.instanceCount,Yt);ot.renderInstances(be,Et,ge)}else ot.render(be,Et)};function $c(_,P,W,B){F!==null&&_.isNodeMaterial&&F.setObject(B,_),je===!0&&Ee.setState(_,W,!1),_.transparent===!0&&_.side===_n&&_.forceSinglePass===!1?(_.side=Lt,_.needsUpdate=!0,kr(_,P,B),_.side=Pi,_.needsUpdate=!0,kr(_,P,B),_.side=_n):kr(_,P,B)}this.compile=function(_,P,W=null){W===null&&(W=_),F!==null&&F.renderStart(_,P,W),w=le.get(W),w.init(P),y.push(w),W.traverseVisible(function(z){z.isLight&&z.layers.test(P.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),_!==W&&_.traverseVisible(function(z){z.isLight&&z.layers.test(P.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),w.setupLights(),F!==null&&F.updateLights(w.state.lightsArray),ht=this.localClippingEnabled,je=Ee.init(this.clippingPlanes,ht),je===!0&&Ee.setGlobalState(this.clippingPlanes,P),F!==null&&Pe.render(w.state.shadowsArray,W,P);let B=new Set;return _.traverse(function(z){if(!(z.isMesh||z.isPoints||z.isLine||z.isSprite))return;let pe=z.material;if(pe)if(Array.isArray(pe))for(let ye=0;ye<pe.length;ye++){let fe=pe[ye];$c(fe,W,P,z),B.add(fe)}else $c(pe,W,P,z),B.add(pe)}),w=y.pop(),F!==null&&F.renderEnd(),B},this.compileAsync=function(_,P,W=null){let B=this.compile(_,P,W);return new Promise(z=>{function pe(){if(B.forEach(function(ye){let ve=H.get(ye).currentProgram;(ve===void 0||ve.isReady())&&B.delete(ye)}),B.size===0){z(_);return}setTimeout(pe,10)}nt.get("KHR_parallel_shader_compile")!==null?pe():setTimeout(pe,10)})};let Ko=null;function sf(_){Ko&&Ko(_)}function Jc(){Ui.stop()}function jc(){Ui.start()}let Ui=new Eu;Ui.setAnimationLoop(sf),typeof self<"u"&&Ui.setContext(self),this.setAnimationLoop=function(_){Ko=_,Me.setAnimationLoop(_),_===null?Ui.stop():Ui.start()},Me.addEventListener("sessionstart",Jc),Me.addEventListener("sessionend",jc),this.render=function(_,P){if(P!==void 0&&P.isCamera!==!0){Ie("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(U===!0)return;F!==null&&F.renderStart(_,P);let W=Me.enabled===!0&&Me.isPresenting===!0,B=T!==null&&(se===null||W)&&T.begin(L,se);if(_.matrixWorldAutoUpdate===!0&&_.updateMatrixWorld(),P.parent===null&&P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),Me.enabled===!0&&Me.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Me.cameraAutoUpdate===!0&&Me.updateCamera(P),P=Me.getCamera()),_.isScene===!0&&_.onBeforeRender(L,_,P,se),w=le.get(_,y.length),w.init(P),w.state.textureUnits=q.getTextureUnits(),y.push(w),qe.multiplyMatrices(P.projectionMatrix,P.matrixWorldInverse),We.setFromProjectionMatrix(qe,In,P.reversedDepth),ht=this.localClippingEnabled,je=Ee.init(this.clippingPlanes,ht),S=de.get(_,C.length),S.init(),C.push(S),Me.enabled===!0&&Me.isPresenting===!0){let ye=L.xr.getDepthSensingMesh();ye!==null&&Qo(ye,P,-1/0,L.sortObjects)}Qo(_,P,0,L.sortObjects),S.finish(),F!==null&&F.updateLights(w.state.lightsArray),L.sortObjects===!0&&S.sort(_e,ke),yt=Me.enabled===!1||Me.isPresenting===!1||Me.hasDepthSensing()===!1,yt&&Oe.addToRenderList(S,_),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),je===!0&&Ee.beginShadows();let z=w.state.shadowsArray;if(Pe.render(z,_,P),je===!0&&Ee.endShadows(),(B&&T.hasRenderPass())===!1){let ye=S.opaque,fe=S.transmissive;if(w.setupLights(),P.isArrayCamera){let ve=P.cameras;if(fe.length>0)for(let Se=0,Be=ve.length;Se<Be;Se++){let Xe=ve[Se];Qc(ye,fe,_,Xe)}yt&&Oe.render(_);for(let Se=0,Be=ve.length;Se<Be;Se++){let Xe=ve[Se];Kc(S,_,Xe,Xe.viewport)}}else fe.length>0&&Qc(ye,fe,_,P),yt&&Oe.render(_),Kc(S,_,P)}se!==null&&j===0&&(q.updateMultisampleRenderTarget(se),q.updateRenderTargetMipmap(se)),B&&T.end(L),_.isScene===!0&&_.onAfterRender(L,_,P),me.resetDefaultState(),Y=-1,te=null,y.pop(),y.length>0?(w=y[y.length-1],q.setTextureUnits(w.state.textureUnits),je===!0&&Ee.setGlobalState(L.clippingPlanes,w.state.camera)):w=null,C.pop(),C.length>0?S=C[C.length-1]:S=null,F!==null&&F.renderEnd()};function Qo(_,P,W,B){if(_.visible===!1)return;if(_.layers.test(P.layers)){if(_.isGroup)W=_.renderOrder;else if(_.isLOD)_.autoUpdate===!0&&_.update(P);else if(_.isLightProbeGrid)w.pushLightProbeGrid(_);else if(_.isLight)w.pushLight(_),_.castShadow&&w.pushShadow(_);else if(_.isSprite){if(!_.frustumCulled||_.intersectsFrustum(We)){B&&Ft.setFromMatrixPosition(_.matrixWorld).applyMatrix4(qe);let ye=Q.update(_),fe=_.material;fe.visible&&S.push(_,ye,fe,W,Ft.z,null,P)}}else if((_.isMesh||_.isLine||_.isPoints)&&(!_.frustumCulled||_.intersectsFrustum(We))){let ye=Q.update(_),fe=_.material;if(B&&(_.boundingSphere!==void 0?(_.boundingSphere===null&&_.computeBoundingSphere(),Ft.copy(_.boundingSphere.center)):(ye.boundingSphere===null&&ye.computeBoundingSphere(),Ft.copy(ye.boundingSphere.center)),Ft.applyMatrix4(_.matrixWorld).applyMatrix4(qe)),Array.isArray(fe)){let ve=ye.groups;for(let Se=0,Be=ve.length;Se<Be;Se++){let Xe=ve[Se],be=fe[Xe.materialIndex];be&&be.visible&&S.push(_,ye,be,W,Ft.z,Xe,P)}}else fe.visible&&S.push(_,ye,fe,W,Ft.z,null,P)}}let pe=_.children;for(let ye=0,fe=pe.length;ye<fe;ye++)Qo(pe[ye],P,W,B)}function Kc(_,P,W,B){let{opaque:z,transmissive:pe,transparent:ye}=_;w.setupLightsView(W),je===!0&&Ee.setGlobalState(L.clippingPlanes,W),B&&g.viewport(ie.copy(B)),z.length>0&&Ur(z,P,W),pe.length>0&&Ur(pe,P,W),ye.length>0&&Ur(ye,P,W),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function Qc(_,P,W,B){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[B.id]===void 0){let be=nt.has("EXT_color_buffer_half_float")||nt.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[B.id]=new hn(1,1,{generateMipmaps:!0,type:be?Fn:dn,minFilter:Ii,samples:Math.max(4,E.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Ye.workingColorSpace})}let pe=w.state.transmissionRenderTarget[B.id],ye=B.viewport||ie;pe.setSize(ye.z*L.transmissionResolutionScale,ye.w*L.transmissionResolutionScale);let fe=L.getRenderTarget(),ve=L.getActiveCubeFace(),Se=L.getActiveMipmapLevel();L.setRenderTarget(pe),L.getClearColor(ct),Ze=L.getClearAlpha(),Ze<1&&L.setClearColor(16777215,.5),L.clear(),yt&&Oe.render(W);let Be=L.toneMapping;L.toneMapping=Un;let Xe=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),w.setupLightsView(B),je===!0&&Ee.setGlobalState(L.clippingPlanes,B),Ur(_,W,B),q.updateMultisampleRenderTarget(pe),q.updateRenderTargetMipmap(pe),nt.has("WEBGL_multisampled_render_to_texture")===!1){let be=!1;for(let et=0,Et=P.length;et<Et;et++){let ft=P[et],{object:ot,geometry:Yt,material:ge,group:sn}=ft;if(ge.side===_n&&ot.layers.test(B.layers)){let $e=ge.side;ge.side=Lt,ge.needsUpdate=!0,eh(ot,W,B,Yt,ge,sn),ge.side=$e,ge.needsUpdate=!0,be=!0}}be===!0&&(q.updateMultisampleRenderTarget(pe),q.updateRenderTargetMipmap(pe))}L.setRenderTarget(fe,ve,Se),L.setClearColor(ct,Ze),Xe!==void 0&&(B.viewport=Xe),L.toneMapping=Be}function Ur(_,P,W){let B=P.isScene===!0?P.overrideMaterial:null;for(let z=0,pe=_.length;z<pe;z++){let ye=_[z],{object:fe,geometry:ve,group:Se}=ye,Be=ye.material;Be.allowOverride===!0&&B!==null&&(Be=B),fe.layers.test(W.layers)&&eh(fe,P,W,ve,Be,Se)}}function eh(_,P,W,B,z,pe){F!==null&&z.isNodeMaterial&&F.setObject(_,z),_.onBeforeRender(L,P,W,B,z,pe),_.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,_.matrixWorld),_.normalMatrix.getNormalMatrix(_.modelViewMatrix),z.onBeforeRender(L,P,W,B,_,pe),z.transparent===!0&&z.side===_n&&z.forceSinglePass===!1?(z.side=Lt,z.needsUpdate=!0,L.renderBufferDirect(W,P,B,z,_,pe),z.side=Pi,z.needsUpdate=!0,L.renderBufferDirect(W,P,B,z,_,pe),z.side=_n):L.renderBufferDirect(W,P,B,z,_,pe),_.onAfterRender(L,P,W,B,z,pe)}function kr(_,P,W){P.isScene!==!0&&(P=ln);let B=H.get(_),z=w.state.lights,pe=w.state.shadowsArray,ye=z.state.version,fe=oe.getParameters(_,z.state,pe,P,W,w.state.lightProbeGridArray),ve=oe.getProgramCacheKey(fe),Se=B.programs;B.environment=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?P.environment:null,B.fog=P.fog;let Be=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap;B.envMap=re.get(_.envMap||B.environment,Be),B.envMapRotation=B.environment!==null&&_.envMap===null?P.environmentRotation:_.envMapRotation,Se===void 0&&(_.addEventListener("dispose",Bn),Se=new Map,B.programs=Se);let Xe=Se.get(ve);if(Xe!==void 0){if(B.currentProgram===Xe&&B.lightsStateVersion===ye)return nh(_,fe),Xe}else fe.uniforms=oe.getUniforms(_),F!==null&&_.isNodeMaterial&&F.build(_,W,fe),_.onBeforeCompile(fe,L),Xe=oe.acquireProgram(fe,ve),Se.set(ve,Xe),B.uniforms=fe.uniforms;let be=B.uniforms;return(!_.isShaderMaterial&&!_.isRawShaderMaterial||_.clipping===!0)&&(be.clippingPlanes=Ee.uniform),nh(_,fe),B.needsLights=lf(_),B.lightsStateVersion=ye,B.needsLights&&(be.ambientLightColor.value=z.state.ambient,be.lightProbe.value=z.state.probe,be.sunLights.value=z.state.sun,be.sunLightShadows.value=z.state.sunShadow,be.directionalLights.value=z.state.directional,be.directionalLightShadows.value=z.state.directionalShadow,be.spotLights.value=z.state.spot,be.spotLightShadows.value=z.state.spotShadow,be.rectAreaLights.value=z.state.rectArea,be.ltc_1.value=z.state.rectAreaLTC1,be.ltc_2.value=z.state.rectAreaLTC2,be.pointLights.value=z.state.point,be.pointLightShadows.value=z.state.pointShadow,be.hemisphereLights.value=z.state.hemi,be.sunShadowMatrix.value=z.state.sunShadowMatrix,be.sunShadowCascade.value=z.state.sunShadowCascade,be.directionalShadowMatrix.value=z.state.directionalShadowMatrix,be.spotLightMatrix.value=z.state.spotLightMatrix,be.spotLightMap.value=z.state.spotLightMap,be.pointShadowMatrix.value=z.state.pointShadowMatrix),B.lightProbeGrid=w.state.lightProbeGridArray.length>0,B.currentProgram=Xe,B.uniformsList=null,Xe}function th(_){if(_.uniformsList===null){let P=_.currentProgram.getUniforms();_.uniformsList=Hs.seqWithValue(P.seq,_.uniforms)}return _.uniformsList}function nh(_,P){let W=H.get(_);W.outputColorSpace=P.outputColorSpace,W.batching=P.batching,W.batchingColor=P.batchingColor,W.instancing=P.instancing,W.instancingColor=P.instancingColor,W.instancingMorph=P.instancingMorph,W.skinning=P.skinning,W.morphTargets=P.morphTargets,W.morphNormals=P.morphNormals,W.morphColors=P.morphColors,W.morphTargetsCount=P.morphTargetsCount,W.numClippingPlanes=P.numClippingPlanes,W.numIntersection=P.numClipIntersection,W.vertexAlphas=P.vertexAlphas,W.vertexTangents=P.vertexTangents,W.toneMapping=P.toneMapping}function rf(_,P){if(_.length===0)return null;if(_.length===1)return _[0].texture!==null?_[0]:null;M.setFromMatrixPosition(P.matrixWorld);for(let W=0,B=_.length;W<B;W++){let z=_[W];if(z.texture!==null&&z.boundingBox.containsPoint(M))return z}return null}function af(_,P,W,B,z){P.isScene!==!0&&(P=ln),q.resetTextureUnits();let pe=P.fog,ye=B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial?P.environment:null,fe=se===null?L.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:Ye.workingColorSpace,ve=B.isMeshStandardMaterial||B.isMeshLambertMaterial&&!B.envMap||B.isMeshPhongMaterial&&!B.envMap,Se=re.get(B.envMap||ye,ve),Be=B.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Xe=!!W.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),be=!!W.morphAttributes.position,et=!!W.morphAttributes.normal,Et=!!W.morphAttributes.color,ft=Un;B.toneMapped&&(se===null||se.isXRRenderTarget===!0)&&(ft=L.toneMapping);let ot=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Yt=ot!==void 0?ot.length:0,ge=H.get(B),sn=w.state.lights;if(je===!0&&(ht===!0||_!==te)){let ut=_===te&&B.id===Y;Ee.setState(B,_,ut)}let $e=!1;B.version===ge.__version?(ge.needsLights&&ge.lightsStateVersion!==sn.state.version||ge.outputColorSpace!==fe||z.isBatchedMesh&&ge.batching===!1||!z.isBatchedMesh&&ge.batching===!0||z.isBatchedMesh&&ge.batchingColor===!0&&z._colorsTexture===null||z.isBatchedMesh&&ge.batchingColor===!1&&z._colorsTexture!==null||z.isInstancedMesh&&ge.instancing===!1||!z.isInstancedMesh&&ge.instancing===!0||z.isSkinnedMesh&&ge.skinning===!1||!z.isSkinnedMesh&&ge.skinning===!0||z.isInstancedMesh&&ge.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&ge.instancingColor===!1&&z.instanceColor!==null||z.isInstancedMesh&&ge.instancingMorph===!0&&z.morphTexture===null||z.isInstancedMesh&&ge.instancingMorph===!1&&z.morphTexture!==null||ge.envMap!==Se||B.fog===!0&&ge.fog!==pe||ge.numClippingPlanes!==void 0&&(ge.numClippingPlanes!==Ee.numPlanes||ge.numIntersection!==Ee.numIntersection)||ge.vertexAlphas!==Be||ge.vertexTangents!==Xe||ge.morphTargets!==be||ge.morphNormals!==et||ge.morphColors!==Et||ge.toneMapping!==ft||ge.morphTargetsCount!==Yt||!!ge.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&($e=!0):($e=!0,ge.__version=B.version);let vn=ge.currentProgram;$e===!0&&(vn=kr(B,P,z),F&&B.isNodeMaterial&&F.onUpdateProgram(B,vn,ge));let zn=!1,oi=!1,es=!1,at=vn.getUniforms(),bt=ge.uniforms;if(g.useProgram(vn.program)&&(zn=!0,oi=!0,es=!0),B.id!==Y&&(Y=B.id,oi=!0),ge.needsLights){let ut=rf(w.state.lightProbeGridArray,z);ge.lightProbeGrid!==ut&&(ge.lightProbeGrid=ut,oi=!0)}if(zn||te!==_){g.buffers.depth.getReversed()&&_.reversedDepth!==!0&&(_._reversedDepth=!0,_.updateProjectionMatrix()),at.setValue(N,"projectionMatrix",_.projectionMatrix),at.setValue(N,"viewMatrix",_.matrixWorldInverse);let ci=at.map.cameraPosition;ci!==void 0&&ci.setValue(N,mt.setFromMatrixPosition(_.matrixWorld)),E.logarithmicDepthBuffer&&at.setValue(N,"logDepthBufFC",2/(Math.log(_.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&at.setValue(N,"isOrthographic",_.isOrthographicCamera===!0),te!==_&&(te=_,oi=!0,es=!0)}if(ge.needsLights&&(sn.state.sunShadowMap.length>0&&at.setValue(N,"sunShadowMap",sn.state.sunShadowMap,q),sn.state.directionalShadowMap.length>0&&at.setValue(N,"directionalShadowMap",sn.state.directionalShadowMap,q),sn.state.spotShadowMap.length>0&&at.setValue(N,"spotShadowMap",sn.state.spotShadowMap,q),sn.state.pointShadowMap.length>0&&at.setValue(N,"pointShadowMap",sn.state.pointShadowMap,q)),z.isSkinnedMesh){at.setOptional(N,z,"bindMatrix"),at.setOptional(N,z,"bindMatrixInverse");let ut=z.skeleton;ut&&(ut.boneTexture===null&&ut.computeBoneTexture(),at.setValue(N,"boneTexture",ut.boneTexture,q))}z.isBatchedMesh&&(at.setOptional(N,z,"batchingTexture"),at.setValue(N,"batchingTexture",z._matricesTexture,q),at.setOptional(N,z,"batchingIdTexture"),at.setValue(N,"batchingIdTexture",z._indirectTexture,q),at.setOptional(N,z,"batchingColorTexture"),z._colorsTexture!==null&&at.setValue(N,"batchingColorTexture",z._colorsTexture,q));let li=W.morphAttributes;if((li.position!==void 0||li.normal!==void 0||li.color!==void 0)&&I.update(z,W,vn),(oi||ge.receiveShadow!==z.receiveShadow)&&(ge.receiveShadow=z.receiveShadow,at.setValue(N,"receiveShadow",z.receiveShadow)),(B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial)&&B.envMap===null&&P.environment!==null&&(bt.envMapIntensity.value=P.environmentIntensity),bt.dfgLUT!==void 0&&(bt.dfgLUT.value=Dy()),oi){if(at.setValue(N,"toneMappingExposure",L.toneMappingExposure),ge.needsLights&&of(bt,es),pe&&B.fog===!0&&we.refreshFogUniforms(bt,pe),we.refreshMaterialUniforms(bt,B,ee,Z,w.state.transmissionRenderTarget[_.id]),ge.needsLights&&ge.lightProbeGrid){let ut=ge.lightProbeGrid;bt.probesSH.value=ut.texture,bt.probesMin.value.copy(ut.boundingBox.min),bt.probesMax.value.copy(ut.boundingBox.max),bt.probesResolution.value.copy(ut.resolution)}Hs.upload(N,th(ge),bt,q)}if(B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(Hs.upload(N,th(ge),bt,q),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&at.setValue(N,"center",z.center),at.setValue(N,"modelViewMatrix",z.modelViewMatrix),at.setValue(N,"normalMatrix",z.normalMatrix),at.setValue(N,"modelMatrix",z.matrixWorld),B.uniformsGroups!==void 0){let ut=B.uniformsGroups;for(let ci=0,ts=ut.length;ci<ts;ci++){let sh=ut[ci];ne.update(sh,vn),ne.bind(sh,vn)}}return vn}function of(_,P){_.ambientLightColor.needsUpdate=P,_.lightProbe.needsUpdate=P,_.sunLights.needsUpdate=P,_.sunLightShadows.needsUpdate=P,_.directionalLights.needsUpdate=P,_.directionalLightShadows.needsUpdate=P,_.pointLights.needsUpdate=P,_.pointLightShadows.needsUpdate=P,_.spotLights.needsUpdate=P,_.spotLightShadows.needsUpdate=P,_.rectAreaLights.needsUpdate=P,_.hemisphereLights.needsUpdate=P}function lf(_){return _.isMeshLambertMaterial||_.isMeshToonMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isShadowMaterial||_.isShaderMaterial&&_.lights===!0}this.getActiveCubeFace=function(){return J},this.getActiveMipmapLevel=function(){return j},this.getRenderTarget=function(){return se},this.setRenderTargetTextures=function(_,P,W){let B=H.get(_);B.__autoAllocateDepthBuffer=_.resolveDepthBuffer===!1,B.__autoAllocateDepthBuffer===!1&&(B.__useRenderToTexture=!1),H.get(_.texture).__webglTexture=P,H.get(_.depthTexture).__webglTexture=B.__autoAllocateDepthBuffer?void 0:W,B.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(_,P){let W=H.get(_);W.__webglFramebuffer=P,W.__useDefaultFramebuffer=P===void 0},this.setRenderTarget=function(_,P=0,W=0){se=_,J=P,j=W;let B=null,z=!1,pe=!1;if(_){let fe=H.get(_);if(fe.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(N.FRAMEBUFFER,fe.__webglFramebuffer),ie.copy(_.viewport),Ce.copy(_.scissor),Te=_.scissorTest,g.viewport(ie),g.scissor(Ce),g.setScissorTest(Te),Y=-1;return}else if(fe.__webglFramebuffer===void 0)q.setupRenderTarget(_);else if(fe.__hasExternalTextures)q.rebindTextures(_,H.get(_.texture).__webglTexture,H.get(_.depthTexture).__webglTexture);else if(_.depthBuffer){let Be=_.depthTexture;if(fe.__boundDepthTexture!==Be){if(Be!==null&&H.has(Be)&&(_.width!==Be.image.width||_.height!==Be.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");q.setupDepthRenderbuffer(_)}}let ve=_.texture;(ve.isData3DTexture||ve.isDataArrayTexture||ve.isCompressedArrayTexture)&&(pe=!0);let Se=H.get(_).__webglFramebuffer;_.isWebGLCubeRenderTarget?(Array.isArray(Se[P])?B=Se[P][W]:B=Se[P],z=!0):_.samples>0&&q.useMultisampledRTT(_)===!1?B=H.get(_).__webglMultisampledFramebuffer:Array.isArray(Se)?B=Se[W]:B=Se,ie.copy(_.viewport),Ce.copy(_.scissor),Te=_.scissorTest}else ie.copy(xe).multiplyScalar(ee).floor(),Ce.copy(Ge).multiplyScalar(ee).floor(),Te=Dt;if(W!==0&&(B=G),g.bindFramebuffer(N.FRAMEBUFFER,B)&&g.drawBuffers(_,B),g.viewport(ie),g.scissor(Ce),g.setScissorTest(Te),z){let fe=H.get(_.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+P,fe.__webglTexture,W)}else if(pe){let fe=P;for(let ve=0;ve<_.textures.length;ve++){let Se=H.get(_.textures[ve]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+ve,Se.__webglTexture,W,fe)}}else if(_!==null&&W!==0){let fe=H.get(_.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,fe.__webglTexture,W)}Y=-1};function ih(_){let P=H.get(_);return(P.__readFormat!==_.format||P.__readType!==_.type)&&(P.__readFormat=_.format,P.__readType=_.type,P.__formatReadable=E.textureFormatReadable(_.format),P.__typeReadable=E.textureTypeReadable(_.type)),P}this.readRenderTargetPixels=function(_,P,W,B,z,pe,ye,fe=0){if(!(_&&_.isWebGLRenderTarget)){Ie("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=H.get(_).__webglFramebuffer;if(_.isWebGLCubeRenderTarget&&ye!==void 0&&(ve=ve[ye]),ve){g.bindFramebuffer(N.FRAMEBUFFER,ve);try{let Se=_.textures[fe],Be=Se.format,Xe=Se.type;_.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+fe);let be=ih(Se);if(be.__formatReadable===!1){Ie("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(be.__typeReadable===!1){Ie("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}P>=0&&P<=_.width-B&&W>=0&&W<=_.height-z&&N.readPixels(P,W,B,z,he.convert(Be),he.convert(Xe),pe)}finally{let Se=se!==null?H.get(se).__webglFramebuffer:null;g.bindFramebuffer(N.FRAMEBUFFER,Se)}}},this.readRenderTargetPixelsAsync=async function(_,P,W,B,z,pe,ye,fe=0){if(!(_&&_.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=H.get(_).__webglFramebuffer;if(_.isWebGLCubeRenderTarget&&ye!==void 0&&(ve=ve[ye]),ve)if(P>=0&&P<=_.width-B&&W>=0&&W<=_.height-z){g.bindFramebuffer(N.FRAMEBUFFER,ve);let Se=_.textures[fe],Be=Se.format,Xe=Se.type;_.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+fe);let be=ih(Se);if(be.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(be.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let et=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,et),N.bufferData(N.PIXEL_PACK_BUFFER,pe.byteLength,N.STREAM_READ),N.readPixels(P,W,B,z,he.convert(Be),he.convert(Xe),0),N.bindBuffer(N.PIXEL_PACK_BUFFER,null);let Et=se!==null?H.get(se).__webglFramebuffer:null;g.bindFramebuffer(N.FRAMEBUFFER,Et);let ft=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Kd(N,ft,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,et),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,pe),N.bindBuffer(N.PIXEL_PACK_BUFFER,null),N.deleteBuffer(et),N.deleteSync(ft),pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(_,P=null,W=0){let B=Math.pow(2,-W),z=Math.floor(_.image.width*B),pe=Math.floor(_.image.height*B),ye=P!==null?P.x:0,fe=P!==null?P.y:0;q.setTexture2D(_,0),N.copyTexSubImage2D(N.TEXTURE_2D,W,0,0,ye,fe,z,pe),g.unbindTexture()},this.copyTextureToTexture=function(_,P,W=null,B=null,z=0,pe=0){let ye,fe,ve,Se,Be,Xe,be,et,Et,ft=_.isCompressedTexture?_.mipmaps[pe]:_.image;if(W!==null)ye=W.max.x-W.min.x,fe=W.max.y-W.min.y,ve=W.isBox3?W.max.z-W.min.z:1,Se=W.min.x,Be=W.min.y,Xe=W.isBox3?W.min.z:0;else{let bt=Math.pow(2,-z);ye=Math.floor(ft.width*bt),fe=Math.floor(ft.height*bt),_.isDataArrayTexture?ve=ft.depth:_.isData3DTexture?ve=Math.floor(ft.depth*bt):ve=1,Se=0,Be=0,Xe=0}B!==null?(be=B.x,et=B.y,Et=B.z):(be=0,et=0,Et=0);let ot=he.convert(P.format),Yt=he.convert(P.type),ge;P.isData3DTexture?(q.setTexture3D(P,0),ge=N.TEXTURE_3D):P.isDataArrayTexture||P.isCompressedArrayTexture?(q.setTexture2DArray(P,0),ge=N.TEXTURE_2D_ARRAY):(q.setTexture2D(P,0),ge=N.TEXTURE_2D),g.activeTexture(N.TEXTURE0),g.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,P.flipY),g.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,P.premultiplyAlpha),g.pixelStorei(N.UNPACK_ALIGNMENT,P.unpackAlignment);let sn=g.getParameter(N.UNPACK_ROW_LENGTH),$e=g.getParameter(N.UNPACK_IMAGE_HEIGHT),vn=g.getParameter(N.UNPACK_SKIP_PIXELS),zn=g.getParameter(N.UNPACK_SKIP_ROWS),oi=g.getParameter(N.UNPACK_SKIP_IMAGES);g.pixelStorei(N.UNPACK_ROW_LENGTH,ft.width),g.pixelStorei(N.UNPACK_IMAGE_HEIGHT,ft.height),g.pixelStorei(N.UNPACK_SKIP_PIXELS,Se),g.pixelStorei(N.UNPACK_SKIP_ROWS,Be),g.pixelStorei(N.UNPACK_SKIP_IMAGES,Xe);let es=_.isDataArrayTexture||_.isData3DTexture,at=P.isDataArrayTexture||P.isData3DTexture;if(_.isDepthTexture){let bt=H.get(_),li=H.get(P),ut=H.get(bt.__renderTarget),ci=H.get(li.__renderTarget);g.bindFramebuffer(N.READ_FRAMEBUFFER,ut.__webglFramebuffer),g.bindFramebuffer(N.DRAW_FRAMEBUFFER,ci.__webglFramebuffer);for(let ts=0;ts<ve;ts++)es&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,H.get(_).__webglTexture,z,Xe+ts),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,H.get(P).__webglTexture,pe,Et+ts)),N.blitFramebuffer(Se,Be,ye,fe,be,et,ye,fe,N.DEPTH_BUFFER_BIT,N.NEAREST);g.bindFramebuffer(N.READ_FRAMEBUFFER,null),g.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(z!==0||_.isRenderTargetTexture||H.has(_)){let bt=H.get(_),li=H.get(P);g.bindFramebuffer(N.READ_FRAMEBUFFER,D),g.bindFramebuffer(N.DRAW_FRAMEBUFFER,V);for(let ut=0;ut<ve;ut++)es?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,bt.__webglTexture,z,Xe+ut):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,bt.__webglTexture,z),at?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,li.__webglTexture,pe,Et+ut):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,li.__webglTexture,pe),z!==0?N.blitFramebuffer(Se,Be,ye,fe,be,et,ye,fe,N.COLOR_BUFFER_BIT,N.NEAREST):at?N.copyTexSubImage3D(ge,pe,be,et,Et+ut,Se,Be,ye,fe):N.copyTexSubImage2D(ge,pe,be,et,Se,Be,ye,fe);g.bindFramebuffer(N.READ_FRAMEBUFFER,null),g.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else at?_.isDataTexture||_.isData3DTexture?N.texSubImage3D(ge,pe,be,et,Et,ye,fe,ve,ot,Yt,ft.data):P.isCompressedArrayTexture?N.compressedTexSubImage3D(ge,pe,be,et,Et,ye,fe,ve,ot,ft.data):N.texSubImage3D(ge,pe,be,et,Et,ye,fe,ve,ot,Yt,ft):_.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,pe,be,et,ye,fe,ot,Yt,ft.data):_.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,pe,be,et,ft.width,ft.height,ot,ft.data):N.texSubImage2D(N.TEXTURE_2D,pe,be,et,ye,fe,ot,Yt,ft);g.pixelStorei(N.UNPACK_ROW_LENGTH,sn),g.pixelStorei(N.UNPACK_IMAGE_HEIGHT,$e),g.pixelStorei(N.UNPACK_SKIP_PIXELS,vn),g.pixelStorei(N.UNPACK_SKIP_ROWS,zn),g.pixelStorei(N.UNPACK_SKIP_IMAGES,oi),pe===0&&P.generateMipmaps&&N.generateMipmap(ge),g.unbindTexture()},this.initRenderTarget=function(_){H.get(_).__webglFramebuffer===void 0&&q.setupRenderTarget(_)},this.initTexture=function(_){_.isCubeTexture?q.setTextureCube(_,0):_.isData3DTexture?q.setTexture3D(_,0):_.isDataArrayTexture||_.isCompressedArrayTexture?q.setTexture2DArray(_,0):q.setTexture2D(_,0),g.unbindTexture()},this.resetState=function(){J=0,j=0,se=null,g.reset(),me.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return In}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Ye._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ye._getUnpackColorSpace()}};var Iu={type:"change"},kc={type:"start"},Nu={type:"end"},Ho=new Gi,Du=new an,Uy=Math.cos(70*Fs.DEG2RAD),Ot=new k,un=2*Math.PI,it={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Uc=1e-6,Go=class extends br{constructor(e,t=null){super(e,t),this.state=it.NONE,this.target=new k,this.cursor=new k,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ci.ROTATE,MIDDLE:Ci.DOLLY,RIGHT:Ci.PAN},this.touches={ONE:Ri.ROTATE,TWO:Ri.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new k,this._lastQuaternion=new jt,this._lastTargetPosition=new k,this._quat=new jt().setFromUnitVectors(e.up,new k(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Is,this._sphericalDelta=new Is,this._scale=1,this._panOffset=new k,this._rotateStart=new Re,this._rotateEnd=new Re,this._rotateDelta=new Re,this._panStart=new Re,this._panEnd=new Re,this._panDelta=new Re,this._dollyStart=new Re,this._dollyEnd=new Re,this._dollyDelta=new Re,this._dollyDirection=new k,this._mouse=new Re,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Oy.bind(this),this._onPointerDown=ky.bind(this),this._onPointerUp=Fy.bind(this),this._onContextMenu=Xy.bind(this),this._onMouseWheel=Hy.bind(this),this._onKeyDown=Gy.bind(this),this._onTouchStart=Vy.bind(this),this._onTouchMove=Wy.bind(this),this._onMouseDown=By.bind(this),this._onMouseMove=zy.bind(this),this._interceptControlDown=qy.bind(this),this._interceptControlUp=Yy.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=it.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Iu),this.update(),this.state=it.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;Ot.copy(t).sub(this.target),Ot.applyQuaternion(this._quat),this._spherical.setFromVector3(Ot),this.autoRotate&&this.state===it.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=un:n>Math.PI&&(n-=un),s<-Math.PI?s+=un:s>Math.PI&&(s-=un),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(Ot.setFromSpherical(this._spherical),Ot.applyQuaternion(this._quatInverse),t.copy(this.target).add(Ot),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=Ot.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new k(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new k(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=Ot.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(Ho.origin.copy(this.object.position),Ho.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ho.direction))<Uy?this.object.lookAt(this.target):(Du.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ho.intersectPlane(Du,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Uc||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Uc||this._lastTargetPosition.distanceToSquared(this.target)>Uc?(this.dispatchEvent(Iu),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?un/60*this.autoRotateSpeed*e:un/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Ot.setFromMatrixColumn(t,0),Ot.multiplyScalar(-e),this._panOffset.add(Ot)}_panUp(e,t){this.screenSpacePanning===!0?Ot.setFromMatrixColumn(t,1):(Ot.setFromMatrixColumn(t,0),Ot.crossVectors(this.object.up,Ot)),Ot.multiplyScalar(e),this._panOffset.add(Ot)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Ot.copy(s).sub(this.target);let r=Ot.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=e-n.left,r=t-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(un*this._rotateDelta.x/t.clientHeight),this._rotateUp(un*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-un*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(n,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),s=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(un*this._rotateDelta.x/t.clientHeight),this._rotateUp(un*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new Re,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function ky(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function Oy(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function Fy(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Nu),this.state=it.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function By(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Ci.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=it.DOLLY;break;case Ci.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=it.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=it.ROTATE}break;case Ci.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=it.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=it.PAN}break;default:this.state=it.NONE}this.state!==it.NONE&&this.dispatchEvent(kc)}function zy(i){switch(this.state){case it.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case it.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case it.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function Hy(i){this.enabled===!1||this.enableZoom===!1||this.state!==it.NONE||(i.preventDefault(),this.dispatchEvent(kc),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Nu))}function Gy(i){this.enabled!==!1&&this._handleKeyDown(i)}function Vy(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Ri.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=it.TOUCH_ROTATE;break;case Ri.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=it.TOUCH_PAN;break;default:this.state=it.NONE}break;case 2:switch(this.touches.TWO){case Ri.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=it.TOUCH_DOLLY_PAN;break;case Ri.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=it.TOUCH_DOLLY_ROTATE;break;default:this.state=it.NONE}break;default:this.state=it.NONE}this.state!==it.NONE&&this.dispatchEvent(kc)}function Wy(i){switch(this._trackPointer(i),this.state){case it.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case it.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case it.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case it.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=it.NONE}}function Xy(i){this.enabled!==!1&&i.preventDefault()}function qy(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Yy(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var lt=1.55,st=(2*lt+9)/2,ai=2048,Vo=ai/(2*st),It=.12,nn="#2b2118",Oc="#fffaf0";function ji(i){return i===0?{x:st-lt,z:st-lt,w:lt,d:lt}:i<10?{x:st-lt-i,z:st-lt,w:1,d:lt}:i===10?{x:-st,z:st-lt,w:lt,d:lt}:i<20?{x:-st,z:st-lt-(i-10),w:lt,d:1}:i===20?{x:-st,z:-st,w:lt,d:lt}:i<30?{x:-st+lt+(i-21),z:-st,w:1,d:lt}:i===30?{x:st-lt,z:-st,w:lt,d:lt}:{x:st-lt,z:-st+lt+(i-31),w:lt,d:1}}function Zy(i,e){if(Math.abs(i)>st||Math.abs(e)>st)return null;for(let t=0;t<40;t++){let n=ji(t);if(i>=n.x&&i<=n.x+n.w&&e>=n.z&&e<=n.z+n.d)return t}return null}function $y(i){let e=pi(i);return e==="bottom"?0:e==="left"?Math.PI/2:e==="top"?Math.PI:-Math.PI/2}function Uu(i){let e=pi(i);return i%10===0?{along:[1,0],inward:[0,-1]}:e==="bottom"?{along:[1,0],inward:[0,-1]}:e==="left"?{along:[0,-1],inward:[1,0]}:e==="top"?{along:[-1,0],inward:[0,1]}:{along:[0,1],inward:[-1,0]}}function ku(i){let e=ji(i);return[e.x+e.w/2,e.z+e.d/2]}var Ou=[[0,0],[-.3,.12],[.3,.12],[-.3,-.22],[.3,-.22],[0,.34],[0,-.4],[.32,.38]];function zc(i){return new Promise((e,t)=>{let n=new Image;n.onload=()=>e(n),n.onerror=()=>t(new Error("svg failed")),n.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(i)})}async function Fu(i,e=256){let t=await zc(i),n=document.createElement("canvas");n.width=e,n.height=e,n.getContext("2d").drawImage(t,0,0,e,e);let s=new Si(n);return s.colorSpace=Nt,s.anisotropy=4,s}function Jy(){let i=document.createElement("canvas");i.width=1024,i.height=1024;let e=i.getContext("2d");e.fillStyle="#8b5a2b",e.fillRect(0,0,1024,1024);for(let n=0;n<90;n++){e.strokeStyle=`rgba(${40+Math.random()*30}, ${20+Math.random()*20}, 10, ${.12+Math.random()*.2})`,e.lineWidth=1+Math.random()*3,e.beginPath();let s=Math.random()*1024;e.moveTo(0,s);for(let r=0;r<=1024;r+=64)e.lineTo(r,s+Math.sin(r/90+n)*6+Math.random()*3);e.stroke()}for(let n=0;n<8;n++)e.fillStyle="rgba(0,0,0,0.18)",e.fillRect(0,n*128-2,1024,3),e.fillStyle="rgba(255,255,255,0.06)",e.fillRect(0,n*128+1,1024,2);let t=new Si(i);return t.colorSpace=Nt,t.wrapS=t.wrapT=Ms,t.repeat.set(4,4),t}function $i(){return\'Fredoka, "Trebuchet MS", "Segoe UI", sans-serif\'}function jy(i,e,t){let n=e.split(" "),s=[],r="";for(let a of n){let o=r?`${r} ${a}`:a;i.measureText(o).width>t&&r?(s.push(r),r=a):r=o}return r&&s.push(r),s}function Fc(i,e,t,n,s,r){i.beginPath(),i.moveTo(e+r,t),i.lineTo(e+n-r,t),i.quadraticCurveTo(e+n,t,e+n,t+r),i.lineTo(e+n,t+s-r),i.quadraticCurveTo(e+n,t+s,e+n-r,t+s),i.lineTo(e+r,t+s),i.quadraticCurveTo(e,t+s,e,t+s-r),i.lineTo(e,t+r),i.quadraticCurveTo(e,t,e+r,t),i.closePath()}function Ky(i){switch(i.type){case"go":return"go";case"chance":return"chance";case"chest":return"chest";case"railroad":return"railroad";case"utility":return/water/i.test(i.name)?"water":"electric";case"tax":return/luxury/i.test(i.name)?"luxurytax":"incometax";case"jail":return"jail";case"freeparking":return"freeparking";case"gotojail":return"gotojail";default:return null}}function Qy(i){return 1-(1-i)*(1-i)}function Ji(i,e,t){let n=performance.now();return{update:(s,r)=>{let a=Math.min(1,(s-n)/i);return e(a,r),a>=1?(t?.(),!1):!0}}}function Bc(i){return i<.5?4*i*i*i:1-Math.pow(-2*i+2,3)/2}var Hc=class{constructor(e){X(this,"material",e);X(this,"group",new wn);X(this,"sprite");X(this,"shadow");X(this,"facing",1);X(this,"baseY",It+.47);this.sprite=new Je(new Tn(.92,.92),e),this.sprite.position.y=.47,this.shadow=new Je(new ur(.32,24),new Qt({color:2826520,transparent:!0,opacity:.3,depthWrite:!1})),this.shadow.rotation.x=-Math.PI/2,this.shadow.position.y=.012,this.shadow.scale.set(1.25,.7,1),this.group.add(this.sprite,this.shadow)}setBankrupt(e){this.material.opacity=e?.35:1,this.material.transparent=!0,this.material.color.setScalar(e?.55:1)}},Wo=class{constructor(e){X(this,"wrap");X(this,"canvas");X(this,"renderer");X(this,"scene",new or);X(this,"camera");X(this,"controls");X(this,"raycaster",new vr);X(this,"pickPlane",new an(new k(0,1,0),-It));X(this,"boardTex");X(this,"boardCanvas");X(this,"icons",new Map);X(this,"tokens",new Map);X(this,"tokenPos",new Map);X(this,"dynamic",new wn);X(this,"hover");X(this,"select");X(this,"flashMesh");X(this,"ring");X(this,"dice",[]);X(this,"dieTextures",[]);X(this,"tweens",[]);X(this,"raf",0);X(this,"last",performance.now());X(this,"state",null);X(this,"bannerWho");X(this,"banner");X(this,"pot");X(this,"onSpaceClick");X(this,"destroyed",!1);X(this,"pointerDown",null);X(this,"ro");X(this,"topView",!1);X(this,"userMoved",!1);X(this,"loop",()=>{if(this.destroyed)return;this.raf=requestAnimationFrame(this.loop);let e=performance.now(),t=Math.min(50,e-this.last);this.last=e,this.controls.update();for(let s=this.tweens.length-1;s>=0;s--)this.tweens[s].update(e,t)||this.tweens.splice(s,1);for(let s of this.tokens.values()){let r=s.group.position;s.group.rotation.y=Math.atan2(this.camera.position.x-r.x,this.camera.position.z-r.z)}let n=1+Math.sin(e/350)*.08;this.ring.scale.set(n,n,1),this.renderer.render(this.scene,this.camera)});this.onSpaceClick=e,this.canvas=document.createElement("canvas"),this.canvas.className="board3d-canvas",this.bannerWho=v("span",{class:"who"}),this.banner=v("div",{class:"turn-banner paper paper--flat"},this.bannerWho,v("span",null,"\'s turn")),this.pot=v("div",{class:"pot paper paper--flat hidden"});let t=v("button",{class:"btn btn--sm view-btn",type:"button",title:"Switch camera",onClick:()=>this.toggleView()},"Top view"),n=v("div",{class:"board3d-hint"},"Drag to look around \\xB7 scroll to zoom \\xB7 click a street for its deed");setTimeout(()=>n.classList.add("is-fading"),7e3),this.wrap=v("div",{class:"board3d-wrap"},this.canvas,v("div",{class:"board3d-overlay"},this.banner,this.pot),t,n),this.renderer=new Fo({canvas:this.canvas,antialias:!0,alpha:!1,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Wi,this.renderer.outputColorSpace=Nt,this.scene.background=new ze("#7d4d22"),this.scene.fog=new ar("#7d4d22",30,60),this.camera=new Jt(40,1,.1,200),this.camera.position.set(0,13,15),this.controls=new Go(this.camera,this.canvas),this.controls.addEventListener("start",()=>{this.userMoved=!0}),this.controls.enableDamping=!0,this.controls.dampingFactor=.08,this.controls.minDistance=6,this.controls.maxDistance=34,this.controls.maxPolarAngle=1.32,this.controls.minPolarAngle=.12,this.controls.enablePan=!1,this.controls.target.set(0,0,.6),this.scene.add(new xr(16774368,7031339,1.35));let s=new _r(16777215,1.15);s.position.set(7,15,8),s.castShadow=!0,s.shadow.mapSize.set(1024,1024),s.shadow.camera.left=-9,s.shadow.camera.right=9,s.shadow.camera.top=9,s.shadow.camera.bottom=-9,s.shadow.camera.near=1,s.shadow.camera.far=40,s.shadow.bias=-8e-4,this.scene.add(s);let r=new Je(new Tn(80,80),new Pt({map:Jy()}));r.rotation.x=-Math.PI/2,r.receiveShadow=!0,this.scene.add(r);let a=new Je(new en(2*st+.5,.05,2*st+.5),new Pt({color:Oc}));a.position.y=.025,a.castShadow=!0,a.receiveShadow=!0,a.rotation.y=-.006;let o=new Je(new en(2*st+.16,It-.05,2*st+.16),new Pt({color:nn}));o.position.y=.05+(It-.05)/2,o.castShadow=!0,this.boardCanvas=document.createElement("canvas"),this.boardCanvas.width=ai,this.boardCanvas.height=ai,this.boardTex=new Si(this.boardCanvas),this.boardTex.colorSpace=Nt,this.boardTex.anisotropy=8;let l=new Je(new Tn(2*st,2*st),new Pt({map:this.boardTex}));l.rotation.x=-Math.PI/2,l.position.y=It+.001,l.receiveShadow=!0,this.scene.add(a,o,l),this.scene.add(this.deck("CHANCE","#ffe1b3",Fe.chance,-2.7,.2,-.12),this.deck("COMMUNITY CHEST","#dff1fa",Fe.chest,2.7,.2,.09));let c=(h,u)=>{let d=new Je(new Tn(1,1),new Qt({color:h,transparent:!0,opacity:u,depthWrite:!1}));return d.rotation.x=-Math.PI/2,d.position.y=It+.004,d.visible=!1,this.scene.add(d),d};this.hover=c(3112918,.22),this.select=c(3112918,.35),this.flashMesh=c(16774054,.7),this.ring=new Je(new pr(.42,.55,40),new Qt({color:14238010,transparent:!0,opacity:.85,depthWrite:!1,side:_n})),this.ring.rotation.x=-Math.PI/2,this.ring.position.y=It+.006,this.ring.visible=!1,this.scene.add(this.ring,this.dynamic);for(let h=0;h<2;h++){let u=new Je(new en(.62,.62,.62),new Pt({color:Oc}));u.castShadow=!0,u.position.set(h===0?-.5:.5,It+.31,1.3);let d=new Je(new en(.62,.62,.62),new Qt({color:nn,side:Lt}));d.scale.setScalar(1.07),u.add(d),this.scene.add(u),this.dice.push(u)}this.loadDiceFaces(),this.canvas.addEventListener("pointermove",h=>this.onPointerMove(h)),this.canvas.addEventListener("pointerdown",h=>{this.pointerDown={x:h.clientX,y:h.clientY}}),this.canvas.addEventListener("pointerup",h=>this.onPointerUp(h)),this.canvas.addEventListener("pointerleave",()=>{this.hover.visible=!1}),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(this.wrap),this.loadIcons(),this.loop()}deck(e,t,n,s,r,a){let o=new wn,l=document.createElement("canvas");l.width=512,l.height=340;let c=l.getContext("2d");c.fillStyle=t,c.fillRect(0,0,512,340),c.lineWidth=14,c.strokeStyle=nn,Fc(c,7,7,498,326,30),c.stroke(),c.fillStyle=nn,c.font=`700 54px ${$i()}`,c.textAlign="center",c.textBaseline="middle";let h=e.split(" ");h.forEach((x,b)=>c.fillText(x,256,250+b*54-(h.length-1)*27));let u=new Si(l);u.colorSpace=Nt,zc(n).then(x=>{c.drawImage(x,196,30,120,120),u.needsUpdate=!0});let d=[new Pt({color:nn}),new Pt({color:nn}),new Pt({map:u}),new Pt({color:nn}),new Pt({color:nn}),new Pt({color:nn})],f=new Je(new en(1.5,.09,1),d);return f.castShadow=!0,f.position.y=It+.045,o.add(f),o.position.set(s,0,r),o.rotation.y=a,this.scene.add(o),o}async loadDiceFaces(){let e=await Promise.all([1,2,3,4,5,6].map(s=>Fu(Gn(s),256)));this.dieTextures=e;let t=[1,6,2,5,3,4];for(let s of this.dice)s.material=t.map(r=>new Pt({map:e[r-1]}));let n=this.state?.dice??[1,1];this.setDieFace(this.dice[0],n[0],.3),this.setDieFace(this.dice[1],n[1],-.4)}setDieFace(e,t,n){let s=new Nn;switch(t){case 1:s.set(0,0,Math.PI/2);break;case 6:s.set(0,0,-Math.PI/2);break;case 2:s.set(0,0,0);break;case 5:s.set(Math.PI,0,0);break;case 3:s.set(-Math.PI/2,0,0);break;case 4:s.set(Math.PI/2,0,0);break}let r=new jt().setFromEuler(s),a=new jt().setFromAxisAngle(new k(0,1,0),n);e.quaternion.copy(a.multiply(r))}async loadIcons(){let e=Object.keys(Fe);await Promise.all(e.map(async t=>{try{this.icons.set(t,await zc(Fe[t]))}catch{}})),this.state&&this.drawBoard(this.state);try{await document.fonts?.ready,this.state&&this.drawBoard(this.state)}catch{}}drawBoard(e){let t=this.boardCanvas.getContext("2d");t.setTransform(1,0,0,1,0,0),t.fillStyle="#fbf3e0",t.fillRect(0,0,ai,ai);for(let n=0;n<4e3;n++)t.fillStyle=`rgba(43,33,24,${Math.random()*.05})`,t.fillRect(Math.random()*ai,Math.random()*ai,2,2);t.save(),t.translate(ai/2,ai/2-300),t.rotate(-.07),t.textAlign="center",t.textBaseline="middle",t.font=`700 190px ${$i()}`,t.lineWidth=16,t.lineJoin="round",t.strokeStyle=nn,t.fillStyle="#d9413a",t.fillText("PAPER",14,14),t.strokeText("PAPER",0,0),t.fillStyle="#fbf3e0",t.fillText("PAPER",0,0),t.font=`700 92px ${$i()}`,t.lineWidth=10,t.fillStyle="#d9413a",t.fillText("T Y C O O N",8,150),t.strokeText("T Y C O O N",0,142),t.fillStyle="#fbf3e0",t.fillText("T Y C O O N",0,142),t.restore();for(let n of e.board)this.drawSpace(t,n);this.boardTex.needsUpdate=!0}drawSpace(e,t){let n=t.index,s=ji(n),r=n%10===0,a=(s.x+s.w/2+st)*Vo,o=(s.z+s.d/2+st)*Vo,l=r?0:$y(n),c=(r?lt:1)*Vo,h=lt*Vo;e.save(),e.translate(a,o),e.rotate(l);let u=6;e.fillStyle=Oc,Fc(e,-c/2+u,-h/2+u,c-2*u,h-2*u,12),e.fill(),e.lineWidth=7,e.strokeStyle=nn,e.stroke();let d=-h/2+u+16;if(t.type==="property"){let R=h*.24;e.fillStyle=Kn(t),Fc(e,-c/2+u,-h/2+u,c-2*u,R,12),e.fill(),e.lineWidth=7,e.strokeStyle=nn,e.stroke(),e.fillRect(-c/2+u+3,-h/2+u+R-14,c-2*u-6,12),d=-h/2+u+R+14}e.fillStyle=nn,e.textAlign="center",e.textBaseline="top";let f=Ky(t),x=f?this.icons.get(f):void 0,b=d;if(x){let R=r?150:66;e.drawImage(x,-R/2,b,R,R),b+=R+6}else f&&(b+=r?156:68);let m=t.type==="chest"?"Community Chest":t.type==="jail"?"Jail":t.name,p=r?36:27;e.font=`600 ${p}px ${$i()}`;let A=jy(e,m,c-2*u-14);for(let R of A)e.fillText(R,0,b),b+=p*1.08;t.price&&(e.font=`600 25px ${$i()}`,e.fillStyle="#5b4a3a",e.fillText(`$${t.price}`,0,b+4)),t.type==="tax"&&(e.font=`600 25px ${$i()}`,e.fillStyle="#5b4a3a",e.fillText(`Pay $${t.amount}`,0,b+4)),t.type==="jail"&&(e.font=`500 20px ${$i()}`,e.fillStyle="#5b4a3a",e.fillText("just visiting",0,b+4)),e.restore()}build(e){this.state=e,this.drawBoard(e);for(let t of this.tokens.values())this.scene.remove(t.group);this.tokens.clear(),this.tokenPos.clear();for(let t of e.players){let n=new Qt({transparent:!0,alphaTest:.08,side:_n,depthWrite:!0});n.visible=!1;let s=new Hc(n);this.scene.add(s.group),this.tokens.set(t.id,s),this.tokenPos.set(t.id,t.position),Fu(Mn(t.token),512).then(r=>{n.map=r,n.visible=!0,n.needsUpdate=!0})}this.resize(),this.updateStatic(e),this.placeTokens(e,!1),e.dice&&this.showDice(e.dice,!1)}resize(){let e=this.wrap.clientWidth||600,t=this.wrap.clientHeight||500;this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),!this.userMoved&&!this.topView&&this.frameBoard()}frameBoard(){let e=Fs.degToRad(this.camera.fov),t=Math.tan(e/2),n=t*this.camera.aspect,s=st+.6,r=Math.max(s/n,s/t*.78)*1.06,a=.78;this.camera.position.set(0,Math.sin(a)*r,Math.cos(a)*r+.4),this.controls.target.set(0,0,.4),this.controls.update()}updateStatic(e){this.state=e;let t=new Map(e.players.map(s=>[s.id,s]));e_(this.dynamic);for(let s of e.board){let r=e.properties[s.index];if(!r?.owner)continue;let a=t.get(r.owner),o=ji(s.index),l=Uu(s.index),[c,h]=ku(s.index),u=(pi(s.index)==="bottom"||pi(s.index)==="top"?o.w:o.d)/2,d=lt/2,f=new Je(new Vi(.1,.1,.05,20),new Pt({color:a?.color??"#999"})),x=new Je(new Vi(.1,.1,.05,20),new Qt({color:nn,side:Lt}));x.scale.set(1.25,1.4,1.25),f.add(x);let b=c+l.along[0]*(u-.16)-l.inward[0]*(d-.16),m=h+l.along[1]*(u-.16)-l.inward[1]*(d-.16);if(f.position.set(b,It+.025,m),f.castShadow=!0,this.dynamic.add(f),r.houses>0){let p=It,A=c+l.inward[0]*(d-.2),R=h+l.inward[1]*(d-.2);if(r.houses===5)this.dynamic.add(this.building(A,p,R,!0,l));else for(let M=0;M<r.houses;M++){let S=(M-(r.houses-1)/2)*.22;this.dynamic.add(this.building(A+l.along[0]*S,p,R+l.along[1]*S,!1,l))}}if(r.mortgaged){let p=new Je(new Tn(o.w-.08,o.d-.08),new Qt({color:8947848,transparent:!0,opacity:.55,depthWrite:!1}));p.rotation.x=-Math.PI/2,p.position.set(c,It+.003,h);let A=new Je(new Tn(Math.min(o.w,o.d)*.9,.16),new Qt({color:14238010,depthWrite:!1}));A.rotation.x=-Math.PI/2,A.rotation.z=-.5,A.position.set(c,It+.0045,h),this.dynamic.add(p,A)}}let n=e.players[e.currentPlayer];if(n&&(this.bannerWho.textContent=n.name,this.banner.style.setProperty("--who",n.color),this.ring.material.color.set(n.color)),e.phase==="ended"&&e.winner){let s=t.get(e.winner);this.bannerWho.textContent=s?.name??"",this.banner.lastChild.textContent=" wins!",this.ring.visible=!1}else this.ring.visible=!!n;this.pot.classList.toggle("hidden",!e.config.freeParkingJackpot),this.pot.textContent=`Free Parking pot: $${e.freeParkingPot}`;for(let s of e.players)this.tokens.get(s.id)?.setBankrupt(s.bankrupt);this.updateRing()}building(e,t,n,s,r){let a=new wn,o=s?.36:.17,l=s?.2:.13,c=s?.2:.17,h=s?"#d9413a":"#3aa655",u=s?"#a8302b":"#2c7f41",d=new Je(new en(o,l,c),new Pt({color:h}));d.position.y=l/2,d.castShadow=!0;let f=new Je(new fr(Math.max(o,c)*.72,l*.8,4),new Pt({color:u}));f.position.y=l+l*.4,f.rotation.y=Math.PI/4,f.scale.set(o/Math.max(o,c),1,c/Math.max(o,c)),f.castShadow=!0;let x=new Je(new en(o,l,c),new Qt({color:nn,side:Lt}));return x.position.y=l/2,x.scale.set(1.18,1.12,1.18),a.add(x,d,f),a.position.set(e,t,n),a.rotation.y=Math.atan2(r.along[0],r.along[1]),a}slotPosition(e,t,n){let[s,r]=ku(e),a=Uu(e),o=e%10===0,[l,c]=Ou[t%Ou.length],h=o?n&&e===10?-.35:.05:.22,u=o&&n&&e===10?.35:0,d=s+a.along[0]*(l*.9+u)-a.inward[0]*(h+c*.5),f=r+a.along[1]*(l*.9+u)-a.inward[1]*(h+c*.5);return new k(d,It,f)}slotsAt(e,t){return t.players.filter(n=>!n.bankrupt&&(this.tokenPos.get(n.id)??n.position)===e).map(n=>n.id)}placeTokens(e,t){for(let n of e.players)this.tokenPos.set(n.id,n.position);for(let n of e.players){let s=this.tokens.get(n.id);if(!s)continue;let r=this.slotsAt(n.position,e),a=this.slotPosition(n.position,Math.max(0,r.indexOf(n.id)),n.inJail);t?this.tweenTo(s,a,250,!1):s.group.position.copy(a)}this.updateRing()}updateRing(){let e=this.state;if(!e)return;let t=e.players[e.currentPlayer],n=t?this.tokens.get(t.id):void 0;n&&this.ring.position.set(n.group.position.x,It+.006,n.group.position.z)}tweenTo(e,t,n,s){return new Promise(r=>{let a=e.group.position.clone();this.tweens.push(Ji(n,o=>{let l=Bc(o);e.group.position.lerpVectors(a,t,l),e.sprite.position.y=.47+(s?Math.sin(o*Math.PI)*.42:0),e.sprite.rotation.z=s?Math.sin(o*Math.PI)*-.12*e.facing:0;let c=e.shadow.scale,h=s?1-Math.sin(o*Math.PI)*.35:1;c.set(1.25*h,.7*h,1)},r))})}setFacing(e,t){if(e.facing===t)return;e.facing=t;let n=e.sprite.scale.x;this.tweens.push(Ji(160,s=>{e.sprite.scale.x=n+(t-n)*s}))}facingFor(e,t,n){let s=new k(1,0,0).applyQuaternion(this.camera.quaternion),r=e*s.x+t*s.z;return Math.abs(r)<.15?n.facing:r>=0?1:-1}async moveToken(e,t,n,s,r){let a=this.tokens.get(e);if(!a)return;let o=r.players.find(d=>d.id===e);if(s.direct){this.tokenPos.set(e,n);let d=Math.max(0,this.slotsAt(n,r).indexOf(e)),f=this.slotPosition(n,d,n===10?!0:!!o?.inJail),x=f.clone().sub(a.group.position);this.setFacing(a,this.facingFor(x.x,x.z,a));let b=a.group.position.clone();await new Promise(m=>this.tweens.push(Ji(650,p=>{let A=Bc(p);a.group.position.lerpVectors(b,f,A),a.sprite.position.y=.47+Math.sin(p*Math.PI)*1.6},m))),this.flash(n),this.updateRing();return}let l=s.backward??(t-n+40)%40===3,c=l?(t-n+40)%40:(n-t+40)%40,h=c>12?110:190,u=t;for(let d=0;d<c;d++){u=l?(u+39)%40:(u+1)%40,this.tokenPos.set(e,u);let f=u===n?Math.max(0,this.slotsAt(u,r).indexOf(e)):0,x=this.slotPosition(u,f,!1),b=x.clone().sub(a.group.position);this.setFacing(a,this.facingFor(b.x,b.z,a)),Mt.step(),await this.tweenTo(a,x,h,!0)}this.placeTokens({...r,players:r.players.map(d=>d.id===e?{...d,position:n}:{...d,position:this.tokenPos.get(d.id)??d.position})},!0),this.flash(n)}flash(e){let t=ji(e);this.flashMesh.scale.set(t.w-.06,t.d-.06,1),this.flashMesh.position.set(t.x+t.w/2,It+.005,t.z+t.d/2),this.flashMesh.visible=!0;let n=this.flashMesh.material;this.tweens.push(Ji(900,s=>{n.opacity=.7*(1-Qy(s))},()=>{this.flashMesh.visible=!1}))}highlight(e){if(e===null){this.select.visible=!1;return}let t=ji(e);this.select.scale.set(t.w-.06,t.d-.06,1),this.select.position.set(t.x+t.w/2,It+.0045,t.z+t.d/2),this.select.visible=!0}async showDice(e,t){let n=[.3+Math.random()*.6,-.4-Math.random()*.6];if(!t){this.dice.forEach((o,l)=>this.setDieFace(o,e[l],n[l]));return}Mt.dice();let s=this.dice.map(o=>o.position.clone()),r=this.dice.map(()=>new k(Math.random()*8+6,Math.random()*8+6,Math.random()*8+6)),a=this.dice.map((o,l)=>{let c=o.clone();return this.setDieFace(c,e[l],n[l]),c.quaternion.clone()});await new Promise(o=>this.tweens.push(Ji(1e3,(l,c)=>{this.dice.forEach((h,u)=>{let d=Math.abs(Math.sin(l*Math.PI*2.2))*(1-l)*1.6;if(h.position.set(s[u].x+Math.sin(l*9+u)*(1-l)*.35,s[u].y+d,s[u].z+Math.cos(l*7+u)*(1-l)*.3),l<.7)h.rotation.x+=r[u].x*c/1e3,h.rotation.y+=r[u].y*c/1e3,h.rotation.z+=r[u].z*c/1e3;else{let f=(l-.7)/.3;h.quaternion.slerp(a[u],Math.min(1,f*.35+.1))}})},()=>{this.dice.forEach((l,c)=>{l.quaternion.copy(a[c]),l.position.copy(s[c])}),o()})))}drawCard(e){let t=e==="chance"?-2.7:2.7,n=new Je(new en(1.4,.03,.92),new Pt({color:e==="chance"?"#ffe1b3":"#dff1fa"})),s=new Je(new en(1.4,.03,.92),new Qt({color:nn,side:Lt}));s.scale.set(1.04,2.5,1.06),n.add(s),n.position.set(t,It+.12,.2),n.castShadow=!0,this.scene.add(n),this.tweens.push(Ji(900,r=>{n.position.y=It+.12+Math.sin(r*Math.PI)*1.4,n.position.x=t*(1-r*.6),n.rotation.z=r*Math.PI*2*(e==="chance"?1:-1),n.rotation.y=r*.6},()=>{this.scene.remove(n)}))}toggleView(){this.topView=!this.topView;let e=this.wrap.querySelector(".view-btn");e.textContent=this.topView?"3D view":"Top view";let t=Fs.degToRad(this.camera.fov),n=(st+.8)/Math.min(Math.tan(t/2),Math.tan(t/2)*this.camera.aspect)*1.02,s=this.camera.position.clone(),r;this.topView?r=new k(0,n,.41):(this.userMoved=!1,this.frameBoard(),r=this.camera.position.clone(),this.camera.position.copy(s)),this.tweens.push(Ji(700,a=>{this.camera.position.lerpVectors(s,r,Bc(a))}))}pick(e){let t=this.canvas.getBoundingClientRect(),n=new Re((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1);this.raycaster.setFromCamera(n,this.camera);let s=new k;return this.raycaster.ray.intersectPlane(this.pickPlane,s)?Zy(s.x,s.z):null}onPointerMove(e){let t=this.pick(e),n=t!==null&&this.state?["property","railroad","utility"].includes(this.state.board[t].type):!1;if(this.canvas.style.cursor=n?"pointer":"",t===null||!n){this.hover.visible=!1;return}let s=ji(t);this.hover.scale.set(s.w-.06,s.d-.06,1),this.hover.position.set(s.x+s.w/2,It+.004,s.z+s.d/2),this.hover.visible=!0}onPointerUp(e){let t=this.pointerDown;if(this.pointerDown=null,!t||Math.hypot(e.clientX-t.x,e.clientY-t.y)>6)return;let n=this.pick(e);n!==null&&this.onSpaceClick(n)}destroy(){this.destroyed=!0,cancelAnimationFrame(this.raf),this.ro.disconnect(),this.controls.dispose(),this.renderer.dispose(),this.wrap.remove()}};function e_(i){for(;i.children.length;){let e=i.children[i.children.length-1];i.remove(e),e.traverse(t=>{let n=t;n.geometry&&n.geometry.dispose();let s=n.material;Array.isArray(s)?s.forEach(r=>r.dispose()):s?.dispose()})}}function Gc(){try{let i=document.createElement("canvas");return!!(i.getContext("webgl2")||i.getContext("webgl"))}catch{return!1}}var Xo=class{constructor(){X(this,"open",new Map)}show(e,t,n={}){this.close(e);let s=v("div",{class:`dialog paper ${n.wide?"dialog--wide":""}`},t),r=v("div",{class:`overlay ${n.passive?"is-passive":""}`},s);n.dismissible&&r.addEventListener("click",o=>{o.target===r&&a.close()}),document.body.appendChild(r);let a={el:s,close:()=>{r.remove(),this.open.get(e)===a&&this.open.delete(e),n.onClose?.()}};return this.open.set(e,a),a}has(e){return this.open.has(e)}get(e){return this.open.get(e)}close(e){this.open.get(e)?.close()}closeAll(e=[]){for(let t of[...this.open.keys()])e.includes(t)||this.close(t)}};function Vc(i,e,t,n="Yes",s="Cancel"){let r=v("div",null,v("p",{style:{fontSize:"1.1em",margin:"4px 0 0"}},e),v("div",{class:"buttons"},v("button",{class:"btn",type:"button",onClick:()=>i.close("confirm")},s),v("button",{class:"btn btn--primary",type:"button",onClick:()=>{i.close("confirm"),t()}},n)));i.show("confirm",r,{dismissible:!0})}function Ki(i,e){return e===null?"the Bank":i.players.find(t=>t.id===e)?.name??"?"}function Bu(i,e){return e===null?"#666":i.players.find(t=>t.id===e)?.color??"#666"}function Qi(i,e){return v("b",{style:{color:Bu(i,e)}},Ki(i,e))}function zu(i,e){return Object.entries(i.properties).filter(([,t])=>t.owner===e).map(([t])=>Number(t)).sort((t,n)=>t-n)}function t_(i,e){return e.type!=="property"||!e.group?!1:Jn[e.group].some(t=>(i.properties[t]?.houses??0)>0)}function Wc(i,e,t={}){let n=i.board[e],s=i.properties[e],r=Kn(n),a=n.group?Xr.has(n.group):n.type==="utility",o=v("div",{class:`deed-band ${a?"is-light":""}`,style:{"--band":r}},v("div",{class:"kind"},n.type==="property"?"TITLE DEED":n.type==="railroad"?"RAILROAD":"UTILITY"),v("div",{class:"dname"},n.name)),l=v("div",{class:"deed-body"}),c=s?.owner??null,h=f=>f.filter(x=>c&&i.properties[x]?.owner===c).length,u=v("table"),d=(f,x,b=!1)=>u.appendChild(v("tr",{class:b?"is-active":""},v("td",null,f),v("td",null,x)));if(n.type==="property"&&n.rent){let f=s?.houses??0,x=!!c&&Jn[n.group].every(b=>i.properties[b]?.owner===c);d("Rent",De(n.rent[0]),f===0&&!x),d("Rent with full set",De(n.rent[0]*2),f===0&&x);for(let b=1;b<=4;b++)d(`With ${b} house${b>1?"s":""}`,De(n.rent[b]),f===b);d("With hotel",De(n.rent[5]),f===5),l.appendChild(u),l.appendChild(v("div",{class:"foot"},`Houses cost ${De(n.houseCost)} each \\xB7 Mortgage value ${De(cn(n))}`))}else if(n.type==="railroad"){l.appendChild(v("span",{class:"deed-icon",html:Fe.railroad}));let f=h(ns);[25,50,100,200].forEach((x,b)=>d(`Rent with ${b+1} railroad${b>0?"s":""}`,De(x),f===b+1)),l.appendChild(u),l.appendChild(v("div",{class:"foot"},`Mortgage value ${De(cn(n))}`))}else if(n.type==="utility"){l.appendChild(v("span",{class:"deed-icon",html:/water/i.test(n.name)?Fe.water:Fe.electric}));let f=h(is);d("One utility owned","4 \\xD7 dice",f===1),d("Both utilities owned","10 \\xD7 dice",f===2),l.appendChild(u),l.appendChild(v("div",{class:"foot"},`Mortgage value ${De(cn(n))}`))}return c?(l.appendChild(v("div",{class:"deed-owner"},v("span",{class:"dot",style:{"--owner":Bu(i,c)}}),"Owned by ",Qi(i,c),s?.mortgaged?v("span",{class:"tag"},"mortgaged"):null)),t.diceTotal!==void 0&&!s?.mortgaged&&l.appendChild(v("div",{class:"foot"},`Current rent: ${De(ol(i,e,t.diceTotal))}`))):l.appendChild(v("div",{class:"deed-owner"},v("span",{class:"muted"},`Unowned \\xB7 Price ${De(n.price??0)}`))),v("div",{class:"deed paper paper--flat"},o,l)}function Hu(i,e,t,n,s){let r=i.board[e],a=r.price??0,o=t.cash>=a;return v("div",null,v("h2",null,v("span",{class:"ico",html:Fe.dollar}),`Buy ${r.name}?`),Wc(i,e),v("p",{class:"muted",style:{textAlign:"center"}},`You have ${De(t.cash)}. `,o?"":"You cannot afford this."),v("div",{class:"buttons"},v("button",{class:"btn",type:"button",onClick:()=>n({type:"decline"})},s?"Decline (auction)":"Decline"),v("button",{class:"btn btn--good btn--lg",type:"button",disabled:!o,onClick:()=>n({type:"buy"})},`Buy for ${De(a)}`)))}var qo=class{constructor(e){X(this,"el",v("div",{class:"auction"}));X(this,"bidsEl",v("div",{class:"bids"}));X(this,"input",v("input",{class:"input",type:"number",min:1,step:1}));X(this,"status",v("div",{class:"hand",style:{fontSize:"1.15em",margin:"6px 0"}}));X(this,"form",v("div",{class:"bidform"}));X(this,"deedHost",v("div"));X(this,"send");X(this,"lastSpace",-1);X(this,"high",null);this.send=e;let t=v("button",{class:"btn btn--good",type:"button",onClick:()=>this.bid()},"Bid"),n=v("button",{class:"btn",type:"button",onClick:()=>e({type:"passAuction"})},"Pass"),s=r=>v("button",{class:"btn btn--sm",type:"button",onClick:()=>{this.input.value=String(this.minBid()+r-1),this.bid()}},`+${r}`);this.input.addEventListener("keydown",r=>{r.key==="Enter"&&this.bid()}),this.form.append(this.input,t,s(1),s(10),s(50),n),this.el.append(v("h2",null,v("span",{class:"ico",html:Fe.hammer}),"Auction"),this.deedHost,this.status,this.bidsEl,this.form)}minBid(){return(this.high??0)+1}bid(){let e=Math.floor(Number(this.input.value));if(!Number.isFinite(e)||e<this.minBid()){this.input.value=String(this.minBid());return}this.send({type:"bid",amount:e})}update(e,t){let n=e.auction;if(!n)return;n.space!==this.lastSpace&&(_t(this.deedHost),this.deedHost.appendChild(Wc(e,n.space)),this.lastSpace=n.space),this.high=n.highBid;let s=n.current??n.active[0];_t(this.bidsEl);for(let c of e.players){if(c.bankrupt)continue;let h=!n.active.includes(c.id),u=n.highBidder===c.id;this.bidsEl.appendChild(v("div",{class:`bidrow ${u?"is-high":""} ${h?"is-out":""}`},v("span",null,Qi(e,c.id),c.id===s&&!h?v("span",{class:"tag",style:{marginLeft:"6px"}},"bidding"):null),v("span",null,u?`High bid ${De(n.highBid)}`:h?"passed":`cash ${De(c.cash)}`)))}let r=s===t&&n.active.includes(t),a=jn(e,t),o=r&&a.includes("bid");this.form.classList.toggle("hidden",!r),this.form.querySelectorAll("button, input").forEach(c=>c.disabled=!o&&!c.textContent?.includes("Pass"));let l=e.players.find(c=>c.id===t);this.input.min=String(this.minBid()),(!this.input.value||Number(this.input.value)<this.minBid())&&(this.input.value=String(this.minBid())),this.status.textContent=r?`Your bid. Minimum ${De(this.minBid())}, you have ${De(l?.cash??0)}.`:`${Ki(e,s??null)} is deciding\\u2026 ${n.highBidder?`High bid ${De(n.highBid)} by ${Ki(e,n.highBidder)}.`:"No bids yet."}`}};async function Gu(i,e,t){Mt.card();let n=v("div",{class:`card-pop ${e}`},v("div",{class:"card-head"},v("span",{html:e==="chance"?Fe.chance:Fe.chest}),e==="chance"?"CHANCE":"COMMUNITY CHEST"),v("div",{class:"card-text hand"},t),v("div",{class:"muted small",style:{textAlign:"center",paddingBottom:"10px"}},"click to continue")),s=i.show("card",n,{dismissible:!0});s.el.style.padding="0",s.el.style.overflow="hidden";let r=!1,a=new Promise(o=>{let l=()=>{r||(r=!0,s.close(),o())};s.el.addEventListener("click",l),s.el.parentElement?.addEventListener("click",l),setTimeout(l,4200)});await Bt(1500)}var Dr=class{constructor(e,t){X(this,"el",v("div",{class:"manage"}));X(this,"list",v("div"));X(this,"cashEl",v("span",{class:"money"}));X(this,"supply",v("span",{class:"muted small"}));X(this,"send");this.send=e,this.el.append(v("h2",null,v("span",{class:"ico",html:Fe.hammer}),"Manage properties"),v("div",{class:"row-between",style:{marginBottom:"8px"}},v("span",null,"Cash: ",this.cashEl),this.supply),this.list,v("div",{class:"buttons"},v("button",{class:"btn",type:"button",onClick:t},"Done")))}update(e,t){let n=e.players.find(a=>a.id===t);this.cashEl.textContent=De(n.cash),this.supply.textContent=`Bank has ${e.housesLeft} houses, ${e.hotelsLeft} hotels`,_t(this.list);let s=zu(e,t);if(s.length===0){this.list.appendChild(v("p",{class:"muted"},"You do not own anything yet."));return}let r=new Map;for(let a of s){let o=e.board[a],l=o.type==="property"?o.group:o.type;r.has(l)||r.set(l,[]),r.get(l).push(a)}for(let[a,o]of r){let l=v("div",{class:"group"});for(let c of o){let h=e.board[c],u=e.properties[c],d=v("span",{class:`chip ${u.mortgaged?"is-mortgaged":""}`,style:{"--chip":rs[a]??"#999"}}),f=u.mortgaged?"mortgaged":u.houses===5?"hotel":u.houses>0?`${u.houses} house${u.houses>1?"s":""}`:"",x=v("div",{class:"pb"});if(h.type==="property"){let p=Xs(e,t,c),A=qs(e,t,c);x.append(v("button",{class:"btn btn--sm btn--good",type:"button",disabled:!p.ok,title:p.ok?`Build for ${De(h.houseCost)}`:p.reason??"",onClick:()=>this.send({type:"build",space:c})},u.houses===4?"Hotel":"Build",` ${De(h.houseCost)}`),v("button",{class:"btn btn--sm",type:"button",disabled:!A.ok,title:A.ok?`Sell for ${De(h.houseCost/2)}`:A.reason??"",onClick:()=>this.send({type:"sellHouse",space:c})},"Sell"))}let b=Ys(e,t,c),m=Zs(e,t,c);u.mortgaged?x.appendChild(v("button",{class:"btn btn--sm btn--blue",type:"button",disabled:!m.ok,title:m.ok?"":m.reason??"",onClick:()=>this.send({type:"unmortgage",space:c})},`Unmortgage ${De(Math.ceil(cn(h)*1.1))}`)):x.appendChild(v("button",{class:"btn btn--sm",type:"button",disabled:!b.ok,title:b.ok?"":b.reason??"",onClick:()=>this.send({type:"mortgage",space:c})},`Mortgage +${De(cn(h))}`)),l.appendChild(v("div",{class:"prow"},d,v("div",{class:"pn"},h.name," ",v("small",null,f)),x))}this.list.appendChild(l)}}},Yo=class{constructor(e,t){X(this,"el",v("div"));X(this,"text",v("p",{style:{fontSize:"1.1em"}}));X(this,"manage");X(this,"payBtn",v("button",{class:"btn btn--good btn--lg",type:"button"}));X(this,"bankruptBtn",v("button",{class:"btn btn--primary",type:"button"}));this.manage=new Dr(e,()=>{}),this.manage.el.querySelector(".buttons")?.remove(),this.manage.el.querySelector("h2")?.remove(),this.payBtn.addEventListener("click",()=>e({type:"payDebt"})),this.bankruptBtn.addEventListener("click",()=>Vc(t,"Declare bankruptcy? You will be out of the game.",()=>e({type:"declareBankruptcy"}),"Declare bankruptcy")),this.el.append(v("h2",null,v("span",{class:"ico",html:Fe.incometax}),"You owe money"),this.text,this.manage.el,v("div",{class:"buttons"},this.bankruptBtn,this.payBtn))}update(e,t){let n=e.debt,s=e.players.find(a=>a.id===t);_t(this.text),this.text.append("You owe ",v("b",null,De(n.amount))," to ",Qi(e,n.creditor),` (${n.reason}). You have `,v("b",null,De(s.cash)),". Sell houses or mortgage properties to raise cash."),this.manage.update(e,t);let r=jn(e,t);this.payBtn.disabled=!r.includes("payDebt"),this.payBtn.textContent=`Pay ${De(n.amount)}`,this.bankruptBtn.textContent="Declare bankruptcy",this.bankruptBtn.disabled=!r.includes("declareBankruptcy")}},Zo=class{constructor(e,t,n,s,r){X(this,"el",v("div",{class:"trade"}));X(this,"partnerSel",v("select",{class:"input"}));X(this,"cols",v("div",{class:"cols"}));X(this,"send");X(this,"state");X(this,"meId");X(this,"offer",{cash:0,properties:[],jailCards:0});X(this,"request",{cash:0,properties:[],jailCards:0});this.send=e,this.state=t,this.meId=n;let a=t.players.filter(l=>l.id!==n&&!l.bankrupt);for(let l of a)this.partnerSel.appendChild(v("option",{value:l.id,selected:l.id===r},l.name));this.partnerSel.addEventListener("change",()=>{this.request={cash:0,properties:[],jailCards:0},this.render()});let o=v("button",{class:"btn btn--good",type:"button",onClick:()=>this.propose()},"Propose trade");this.el.append(v("h2",null,v("span",{class:"ico",html:Fe.trade}),"Propose a trade"),v("div",{class:"field"},v("label",null,"Trade with"),this.partnerSel),this.cols,v("div",{class:"buttons"},v("button",{class:"btn",type:"button",onClick:s},"Cancel"),o)),this.render()}update(e){this.state=e,this.render()}side(e,t,n){let s=this.state,r=v("div",{class:"plist"});for(let l of zu(s,e.id)){let c=s.board[l],h=s.properties[l],u=t_(s,c),d=v("input",{type:"checkbox",checked:t.properties.includes(l),disabled:u});d.addEventListener("change",()=>{t.properties=d.checked?[...t.properties,l]:t.properties.filter(f=>f!==l)}),r.appendChild(v("label",{class:u?"is-locked":"",title:u?"Sell the buildings in this color group first":""},d,v("span",{class:`chip ${h.mortgaged?"is-mortgaged":""}`,style:{"--chip":Kn(c)}}),c.name,h.mortgaged?v("span",{class:"tag"},"mortgaged"):null))}r.hasChildNodes()||r.appendChild(v("span",{class:"muted small"},"No properties"));let a=v("input",{class:"input",type:"number",min:0,max:e.cash,step:1,value:String(t.cash)});a.addEventListener("change",()=>{t.cash=Math.max(0,Math.min(e.cash,Math.floor(Number(a.value)||0))),a.value=String(t.cash)});let o=v("input",{class:"input",type:"number",min:0,max:e.jailCards,step:1,value:String(t.jailCards),style:{width:"5em"}});return o.addEventListener("change",()=>{t.jailCards=Math.max(0,Math.min(e.jailCards,Math.floor(Number(o.value)||0))),o.value=String(t.jailCards)}),v("div",{class:"col paper paper--flat"},v("h3",null,n," ",v("span",{class:"muted small"},`(${De(e.cash)} cash)`)),v("div",{class:"cash"},"Cash $",a),e.jailCards>0?v("div",{class:"cash"},"Jail cards",o):null,r)}render(){let e=this.state.players.find(n=>n.id===this.meId),t=this.state.players.find(n=>n.id===this.partnerSel.value);if(_t(this.cols),!t){this.cols.appendChild(v("p",{class:"muted"},"Nobody to trade with."));return}this.cols.append(this.side(e,this.offer,"You give"),this.side(t,this.request,`${t.name} gives`))}propose(){let e=this.partnerSel.value;e&&(this.offer.cash===0&&this.offer.properties.length===0&&this.offer.jailCards===0&&this.request.cash===0&&this.request.properties.length===0&&this.request.jailCards===0||this.send({type:"proposeTrade",to:e,offer:this.offer,request:this.request}))}};function Vu(i,e){let t=(n,s)=>{let r=[];s.cash&&r.push(v("span",{class:"money"},De(s.cash)));for(let a of s.properties)r.push(v("span",{class:"tag",style:{background:Kn(i.board[a]),color:Xr.has(i.board[a].group??i.board[a].type)?"#2b2118":"#fff"}},i.board[a].name));return s.jailCards&&r.push(v("span",{class:"tag"},`${s.jailCards} jail card${s.jailCards>1?"s":""}`)),r.length===0&&r.push(v("span",{class:"muted"},"nothing")),v("div",{class:"line"},Qi(i,n)," gives: ",...r)};return v("div",{class:"summary"},t(e.from,e.offer),t(e.to,e.request))}function Wu(i,e,t,n){let r=jn(i,n).includes("acceptTrade");return v("div",{class:"trade"},v("h2",null,v("span",{class:"ico",html:Fe.trade}),`${Ki(i,e.from)} proposes a trade`),Vu(i,e),v("div",{class:"buttons"},v("button",{class:"btn",type:"button",onClick:()=>t({type:"rejectTrade",tradeId:e.id})},"Reject"),v("button",{class:"btn btn--good",type:"button",disabled:!r,onClick:()=>t({type:"acceptTrade",tradeId:e.id})},"Accept")))}function Xu(i,e,t,n,s){let r=v("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}});for(let a of i.trades){let o=a.from===e,l=a.to===e;r.appendChild(v("div",{class:"paper paper--flat",style:{padding:"8px 10px"}},Vu(i,a),v("div",{class:"buttons",style:{marginTop:"6px"}},o?v("button",{class:"btn btn--sm",type:"button",onClick:()=>t({type:"rejectTrade",tradeId:a.id})},"Cancel offer"):null,l?v("button",{class:"btn btn--sm",type:"button",onClick:()=>t({type:"rejectTrade",tradeId:a.id})},"Reject"):null,l?v("button",{class:"btn btn--sm btn--good",type:"button",onClick:()=>t({type:"acceptTrade",tradeId:a.id})},"Accept"):null,!o&&!l?v("span",{class:"muted small"},"between other players"):null)))}return i.trades.length===0&&r.appendChild(v("p",{class:"muted"},"No open trade offers.")),v("div",null,v("h2",null,v("span",{class:"ico",html:Fe.trade}),"Trades"),r,v("div",{class:"buttons"},v("button",{class:"btn",type:"button",onClick:n},"Close"),v("button",{class:"btn btn--good",type:"button",onClick:s},"New trade")))}function qu(i,e,t,n,s,r){let a=i.board[e],o=i.properties[e],l=v("div",{class:"buttons"});if(o?.owner===t){if(a.type==="property"){let u=Xs(i,t,e),d=qs(i,t,e);l.append(v("button",{class:"btn btn--sm btn--good",type:"button",disabled:!u.ok,title:u.reason??"",onClick:()=>n({type:"build",space:e})},`Build ${De(a.houseCost)}`),v("button",{class:"btn btn--sm",type:"button",disabled:!d.ok,title:d.reason??"",onClick:()=>n({type:"sellHouse",space:e})},"Sell house"))}let c=Ys(i,t,e),h=Zs(i,t,e);o.mortgaged?l.appendChild(v("button",{class:"btn btn--sm btn--blue",type:"button",disabled:!h.ok,title:h.reason??"",onClick:()=>n({type:"unmortgage",space:e})},`Unmortgage ${De(Math.ceil(cn(a)*1.1))}`)):l.appendChild(v("button",{class:"btn btn--sm",type:"button",disabled:!c.ok,title:c.reason??"",onClick:()=>n({type:"mortgage",space:e})},`Mortgage +${De(cn(a))}`))}else o?.owner&&!i.players.find(c=>c.id===o.owner)?.bankrupt&&i.phase!=="ended"&&l.appendChild(v("button",{class:"btn btn--sm btn--blue",type:"button",onClick:()=>r(o.owner)},`Offer a trade to ${Ki(i,o.owner)}`));return l.appendChild(v("button",{class:"btn btn--sm",type:"button",onClick:s},"Close")),v("div",null,Wc(i,e,{diceTotal:i.dice?i.dice[0]+i.dice[1]:7}),l)}function Yu(i,e,t,n,s,r="Back to lobby"){let a=[...i.players].map(c=>({p:c,worth:c.bankrupt?-1:Vr(i,c.id)})).sort((c,h)=>h.worth-c.worth),o=i.players.find(c=>c.id===i.winner),l=a.map(({p:c,worth:h})=>v("div",{class:`srow paper paper--flat ${c.id===i.winner?"is-winner":""}`},v("span",{html:Mn(c.token)}),v("span",null,v("b",{style:{color:c.color}},c.name),c.id===e?v("span",{class:"tag tag--you",style:{marginLeft:"6px"}},"you"):null,c.bankrupt?v("span",{class:"tag",style:{marginLeft:"6px"}},"bankrupt"):null),v("span",{class:"money"},c.bankrupt?"\\u2014":De(h))));return v("div",null,o?v("span",{class:"winner-crown",html:Fe.crown}):null,v("h2",{style:{justifyContent:"center"}},o?`${o.name} wins!`:"Game over"),v("div",{class:"standings"},...l),v("div",{class:"buttons"},v("button",{class:"btn",type:"button",onClick:n},"Leave"),t?v("button",{class:"btn btn--good",type:"button",onClick:s},r):v("span",{class:"muted small"},"Waiting for the host\\u2026")))}function Zu(i){let e=v("div",{class:"confetti"});for(let t=0;t<90;t++){let n=v("i",{style:{left:`${Math.random()*100}%`,background:i[t%i.length],animationDuration:`${2+Math.random()*2.5}s`,animationDelay:`${Math.random()*1.5}s`,transform:`rotate(${Math.random()*360}deg)`}});e.appendChild(n)}document.body.appendChild(e),setTimeout(()=>e.remove(),6e3)}var $o=class{constructor(e,t,n,s={}){X(this,"root");X(this,"handlers");X(this,"board");X(this,"boardHost",v("div",{class:"game__board"}));X(this,"mode3d",!1);X(this,"playersEl",v("div",{class:"game__players"}));X(this,"actionsEl",v("div",{class:"actions paper paper--flat"}));X(this,"logEl",v("div",{class:"log"}));X(this,"chatInput",v("input",{class:"input",placeholder:"Say something\\u2026",maxLength:200}));X(this,"timerEl",v("span",{class:"timer paper paper--flat hidden"}));X(this,"modals",new Xo);X(this,"state",null);X(this,"meId");X(this,"room",null);X(this,"queue",[]);X(this,"processing",!1);X(this,"timerEndsAt",null);X(this,"timerHandle",null);X(this,"manage",null);X(this,"auction",null);X(this,"debt",null);X(this,"trade",null);X(this,"lastCash",new Map);X(this,"seenTrades",new Set);X(this,"incomingShown",null);X(this,"gameOverShown",!1);X(this,"lastLogCount",0);X(this,"opts");X(this,"locked",[]);this.root=e,this.meId=t,this.opts=s,this.handlers={...n,send:h=>{this.lockButtons(),n.send(h)}},_t(e),this.mode3d=(s.board3d??!0)&&Gc()&&i_()!=="2d",this.board=this.makeBoard(),this.boardHost.appendChild(this.board.wrap);let r=v("form",{class:"chatform",onSubmit:h=>{h.preventDefault();let u=this.chatInput.value.trim();u&&(n.chat(u),this.chatInput.value="")}},this.chatInput,v("button",{class:"btn btn--sm",type:"submit"},"Send")),a=v("button",{class:"btn btn--sm",type:"button",title:"Toggle sound"},Or()?"\\u{1F507}":"\\u{1F50A}");a.addEventListener("click",()=>{oh(!Or()),a.textContent=Or()?"\\u{1F507}":"\\u{1F50A}"});let o=v("button",{class:"btn btn--sm",type:"button",onClick:()=>Vc(this.modals,s.leaveText??"Leave the game? If it is still running you will forfeit.",()=>this.handlers.leave(),"Leave")},"Leave"),l=v("button",{class:"btn btn--sm",type:"button",title:"Switch between the 3D and flat board"},this.mode3d?"2D":"3D");l.addEventListener("click",()=>{this.switchBoard(!this.mode3d),l.textContent=this.mode3d?"2D":"3D"}),Gc()||l.classList.add("hidden");let c=v("div",{class:"logbox paper paper--flat"},v("h3",null,s.chat===!1?"Log":"Log & chat",v("span",{class:"topbar"},l,a,o)),this.logEl,s.chat===!1?null:r);e.appendChild(v("div",{class:"game"},this.playersEl,this.boardHost,v("div",{class:"game__actions"},this.actionsEl),v("div",{class:"game__log"},c))),this.timerHandle=window.setInterval(()=>this.tickTimer(),500)}makeBoard(){if(this.mode3d)try{return new Wo(e=>this.openDeed(e))}catch(e){console.warn("3D board unavailable",e),this.mode3d=!1}return new Wr(e=>this.openDeed(e))}switchBoard(e){e!==this.mode3d&&(this.board.destroy?.(),this.mode3d=e,s_(e?"3d":"2d"),this.board=this.makeBoard(),_t(this.boardHost),this.boardHost.appendChild(this.board.wrap),this.state&&this.board.build(this.state))}lockButtons(){this.locked=[],document.querySelectorAll(".dialog button, .actions button").forEach(e=>{e.disabled||(e.disabled=!0,this.locked.push(e))})}onError(){for(let e of this.locked)e.disabled=!1;this.locked=[],this.state&&!this.processing&&this.renderActions()}destroy(){this.timerHandle&&clearInterval(this.timerHandle),this.modals.closeAll(),this.board.destroy?.()}setRoom(e){this.room=e}setTimer(e){this.timerEndsAt=e,this.tickTimer()}tickTimer(){if(!this.timerEndsAt){this.timerEl.classList.add("hidden");return}let e=Math.max(0,Math.ceil((this.timerEndsAt-Date.now())/1e3));this.timerEl.classList.remove("hidden"),this.timerEl.textContent=`\\u23F1 ${Math.floor(e/60)}:${String(e%60).padStart(2,"0")}`,this.timerEl.classList.toggle("is-low",e<=10)}addChat(e){let t=v("div",{class:`entry ${e.from?"chat":"system"}`});e.from?t.append(v("b",{style:{color:this.state?this.playerColor(e.from):"inherit"}},e.name),": ",e.text):t.append(e.text),this.logEl.appendChild(t),this.logEl.scrollTop=this.logEl.scrollHeight,e.from&&e.from!==this.meId&&Mt.notify()}playerColor(e){return this.state?.players.find(t=>t.id===e)?.color??"inherit"}onState(e,t){let n=!this.state;if(this.state=e,n){this.board.build(e);for(let s of e.players)this.lastCash.set(s.id,s.cash);for(let s of e.log)this.appendLog(s,e);this.lastLogCount=e.log.length,this.render(),this.opts.onIdle?.();return}this.locked=[],this.queue.push(...t),this.processing||this.process()}async process(){for(this.processing=!0,this.renderActions();this.queue.length;){let e=this.queue.shift(),t=this.state;try{await this.animate(e,t)}catch(n){console.error(n)}this.appendLog(e,t)}this.processing=!1,this.render(),this.opts.onIdle?.()}async animate(e,t){switch(e.type){case"rolled":await this.board.showDice(e.dice,!0);return;case"moved":await this.board.moveToken(e.player,e.from,e.to,{direct:e.direct,backward:e.backwards},t),await Bt(120);return;case"paid":e.to===this.meId?Mt.cash():e.from===this.meId&&Mt.pay(),this.bumpCash(e.from,-e.amount),this.bumpCash(e.to,e.amount),await Bt(250);return;case"card":this.board.drawCard?.(e.deck),await Bt(350),await Gu(this.modals,e.deck,e.text);return;case"bought":Mt.cash(),this.board.updateStatic(t),this.board.flash(e.space),await Bt(250);return;case"built":case"soldHouse":Mt.build(),this.board.updateStatic(t),await Bt(150);return;case"mortgaged":case"unmortgaged":case"auctionEnded":case"tradeAccepted":case"bankrupt":this.board.updateStatic(t),this.renderPlayers(),await Bt(150);return;case"jailed":Mt.jail(),this.board.updateStatic(t),await Bt(300);return;case"turnStarted":this.board.updateStatic(t),e.player===this.meId&&(Mt.turn(),$n("Your turn!"));return;case"freeParking":Mt.cash(),await Bt(200);return;case"gameOver":return;default:return}}bumpCash(e,t){if(!e)return;let n=this.playersEl.querySelector(`[data-player="${e}"] .pcash`);if(!n)return;let s=(this.lastCash.get(e)??0)+t;this.lastCash.set(e,s),n.textContent=De(s),n.classList.remove("bump-up","bump-down"),n.offsetWidth,n.classList.add(t>=0?"bump-up":"bump-down")}render(){let e=this.state;this.board.updateStatic(e),this.board.placeTokens(e,!0);for(let t of e.players)this.lastCash.set(t.id,t.cash);this.renderPlayers(),this.renderActions(),this.syncDialogs()}renderPlayers(){let e=this.state;_t(this.playersEl);for(let t of e.players){let n=e.players[e.currentPlayer]?.id===t.id&&e.phase!=="ended",s=v("div",{class:"pprops"});for(let[a,o]of Object.entries(e.properties)){if(o.owner!==t.id)continue;let l=e.board[Number(a)];s.appendChild(v("span",{class:`chip ${o.mortgaged?"is-mortgaged":""}`,title:`${l.name}${o.mortgaged?" (mortgaged)":""}`,style:{"--chip":Kn(l)},onClick:()=>this.openDeed(Number(a))},o.houses>0?v("span",{class:"h"},o.houses===5?"H":String(o.houses)):null))}let r=v("div",{class:`pcard paper paper--flat ${n?"is-current":""} ${t.bankrupt?"is-bankrupt":""}`,dataset:{player:t.id},style:{"--pcolor":t.color}},v("span",{class:"ptoken",html:Mn(t.token)}),v("div",null,v("div",{class:"pname"},t.name,t.id===this.meId?v("span",{class:"tag tag--you"},"you"):null,this.room?.hostId===t.id?v("span",{class:"tag tag--host"},"host"):null,t.inJail?v("span",{class:"tag tag--jail"},"in jail"):null,t.connected?null:v("span",{class:"tag tag--off"},"away"),t.bankrupt?v("span",{class:"tag"},"bankrupt"):null),v("div",{class:"pcash"},t.bankrupt?"\\u2014":De(t.cash))),s,v("div",{class:"pmeta muted"},t.bankrupt?null:`worth ${De(Vr(e,t.id))}`,t.jailCards>0?` \\xB7 ${t.jailCards} jail card${t.jailCards>1?"s":""}`:null));this.playersEl.appendChild(r)}}renderActions(){let e=this.state;_t(this.actionsEl);let t=(...f)=>Br(this.actionsEl,f),n=e.players.find(f=>f.id===this.meId),s=this.processing,r=n&&!s?new Set(jn(e,this.meId)):new Set,a=(f,x,b="btn",m=!0)=>v("button",{class:b,type:"button",disabled:!m,onClick:()=>{Mt.click(),this.handlers.send(x)}},f),o=e.players[e.currentPlayer],l=e.dice?v("span",{class:"dice-mini",html:Gn(e.dice[0])+Gn(e.dice[1])}):null;if(e.phase==="ended"){t(v("span",{class:"hint"},"Game over."),v("span",{class:"spacer"}),v("button",{class:"btn",type:"button",onClick:()=>this.syncDialogs(!0)},"Show standings"));return}if(!n||n.bankrupt){t(v("span",{class:"hint"},"You are out of the game. Enjoy the show!"));return}if(s){t(l,v("span",{class:"hint"},"\\u2026"),v("span",{class:"spacer"}),this.timerEl);return}let c=o?.id===this.meId,h;if(e.phase==="roll"&&c)n.inJail?(h=v("span",{class:"hint"},`You are in jail (turn ${n.jailTurns+1} of ${e.config.maxJailTurns}). Roll doubles to get out, or pay.`),t(h,a("Roll for doubles",{type:"roll"},"btn btn--primary btn--lg",r.has("roll")),a(`Pay ${De(e.config.jailFine)}`,{type:"payJailFine"},"btn btn--warn",r.has("payJailFine")),n.jailCards>0?a("Use jail card",{type:"useJailCard"},"btn btn--blue",r.has("useJailCard")):null)):(h=v("span",{class:"hint"},e.canRollAgain?"Doubles! Roll again.":"Your turn."),t(h,a("Roll dice",{type:"roll"},"btn btn--primary btn--lg",r.has("roll"))));else if(e.phase==="action"&&c)h=v("span",{class:"hint"},"Build, trade, or end your turn."),t(l,h,a("End turn",{type:"endTurn"},"btn btn--primary btn--lg",r.has("endTurn")));else if(e.phase==="buy"&&c)h=v("span",{class:"hint"},`Buy ${e.board[e.pendingSpace??0]?.name}?`),t(l,h,v("button",{class:"btn btn--good",type:"button",onClick:()=>this.syncDialogs(!0)},"Show offer"));else if(e.phase==="auction")h=v("span",{class:"hint"},`Auction for ${e.board[e.auction?.space??0]?.name}`),t(h,v("button",{class:"btn btn--good",type:"button",onClick:()=>this.syncDialogs(!0)},"Show auction"));else if(e.phase==="debt"){let f=e.debt;h=v("span",{class:"hint"},f.debtor===this.meId?`You owe ${De(f.amount)}.`:`${Ki(e,f.debtor)} is raising ${De(f.amount)}\\u2026`),t(h,f.debtor===this.meId?v("button",{class:"btn btn--primary",type:"button",onClick:()=>this.syncDialogs(!0)},"Raise money"):null)}else h=v("span",{class:"hint"},"","Waiting for ",Qi(e,o?.id??null),"\\u2026"),t(l,h);t(v("span",{class:"spacer"}));let u=r.has("build")||r.has("sellHouse")||r.has("mortgage")||r.has("unmortgage"),d=e.trades.filter(f=>f.to===this.meId||f.from===this.meId).length;t(v("button",{class:"btn",type:"button",disabled:e.phase==="debt"&&e.debt?.debtor!==this.meId,onClick:()=>this.openManage()},v("span",{class:"ico",html:Fe.hammer}),u?"Manage":"Properties"),v("button",{class:"btn",type:"button",disabled:!r.has("proposeTrade")&&d===0,onClick:()=>this.openTrades()},v("span",{class:"ico",html:Fe.trade}),d?`Trades (${d})`:"Trade"),this.timerEl)}syncDialogs(e=!1){let t=this.state,n=t.players.find(u=>u.id===this.meId),s=t.players[t.currentPlayer]?.id===this.meId,r=t.phase==="buy"&&s&&!!n&&!n.bankrupt,a=t.phase==="auction"&&!!t.auction,o=t.phase==="debt"&&t.debt?.debtor===this.meId,l=t.phase==="ended";if(r&&(e||!this.modals.has("buy"))?this.modals.show("buy",Hu(t,t.pendingSpace,n,this.handlers.send,t.config.auctions)):r||this.modals.close("buy"),a?((!this.auction||e||!this.modals.has("auction"))&&(this.auction=new qo(this.handlers.send),this.modals.show("auction",this.auction.el,{passive:!1})),this.auction.update(t,this.meId)):this.modals.has("auction")&&(this.modals.close("auction"),this.auction=null),o?((!this.debt||e||!this.modals.has("debt"))&&(this.debt=new Yo(this.handlers.send,this.modals),this.modals.show("debt",this.debt.el,{wide:!0})),this.debt.update(t,this.meId)):this.modals.has("debt")&&(this.modals.close("debt"),this.debt=null),this.manage&&this.modals.has("manage")){let u=new Set(jn(t,this.meId));t.phase==="debt"&&t.debt?.debtor!==this.meId?this.modals.close("manage"):this.manage.update(t,this.meId)}this.trade&&this.modals.has("trade")&&(jn(t,this.meId).includes("proposeTrade")?this.trade.update(t):this.modals.close("trade")),this.modals.has("trades")&&this.openTrades(!0);let c=t.trades.filter(u=>u.to===this.meId);this.incomingShown&&!c.some(u=>u.id===this.incomingShown)&&(this.modals.close("incoming"),this.incomingShown=null);let h=c.find(u=>!this.seenTrades.has(u.id));h&&!this.incomingShown&&!r&&!o&&!a&&(this.seenTrades.add(h.id),this.incomingShown=h.id,Mt.notify(),this.modals.show("incoming",Wu(t,h,this.handlers.send,this.meId),{dismissible:!0,onClose:()=>{this.incomingShown=null}}));for(let u of t.trades)this.seenTrades.add(u.id);l&&(e||!this.gameOverShown)&&(this.gameOverShown=!0,this.modals.closeAll(),t.players.find(d=>d.id===t.winner)?.id===this.meId?(Mt.win(),Zu(t.players.map(d=>d.color))):Mt.lose(),this.modals.show("over",Yu(t,this.meId,this.room?.hostId===this.meId,this.handlers.leave,this.handlers.restart,this.opts.restartLabel),{dismissible:!0}))}openManage(){let e=this.state;this.manage=new Dr(this.handlers.send,()=>this.modals.close("manage")),this.manage.update(e,this.meId),this.modals.show("manage",this.manage.el,{wide:!0,dismissible:!0,onClose:()=>{this.manage=null}})}openTrades(e=!1){let t=this.state,n=Xu(t,this.meId,this.handlers.send,()=>this.modals.close("trades"),()=>{this.modals.close("trades"),this.openTradeComposer()});if(e&&this.modals.has("trades")){let s=this.modals.get("trades").el;_t(s),s.appendChild(n);return}if(t.trades.length===0){this.openTradeComposer();return}this.modals.show("trades",n,{dismissible:!0})}openTradeComposer(e){let t=this.state;if(!jn(t,this.meId).includes("proposeTrade")){$n("You cannot trade right now","error");return}this.trade=new Zo(this.handlers.send,t,this.meId,()=>this.modals.close("trade"),e),this.modals.show("trade",this.trade.el,{wide:!0,dismissible:!0,onClose:()=>{this.trade=null}})}onTradeProposed(){this.modals.close("trade")}openDeed(e){let t=this.state;if(!t)return;let n=t.board[e];(n.type==="property"||n.type==="railroad"||n.type==="utility")&&(this.board.highlight(e),this.modals.show("deed",qu(t,e,this.meId,s=>{this.handlers.send(s)},()=>this.modals.close("deed"),s=>{this.modals.close("deed"),this.openTradeComposer(s)}),{dismissible:!0,onClose:()=>this.board.highlight(null)}))}refreshDeed(){this.modals.has("deed")&&this.modals.close("deed")}appendLog(e,t){let n=n_(e,t);if(!n)return;let s=v("div",{class:"entry"},...n);for(this.logEl.appendChild(s);this.logEl.children.length>300;)this.logEl.firstElementChild?.remove();this.logEl.scrollTop=this.logEl.scrollHeight,(e.type==="tradeAccepted"||e.type==="bought"||e.type==="mortgaged"||e.type==="unmortgaged"||e.type==="built"||e.type==="soldHouse")&&this.refreshDeed()}};function n_(i,e){let t=s=>Qi(e,s),n=s=>v("b",null,e.board[s]?.name??`#${s}`);switch(i.type){case"rolled":return[t(i.player),` rolled ${i.dice[0]} + ${i.dice[1]}${i.doubles?" (doubles!)":""}`];case"moved":return i.passedGo?[t(i.player)," passed Go and landed on ",n(i.to)]:[t(i.player),i.direct?" went to ":" landed on ",n(i.to)];case"paid":return[t(i.from),` paid ${De(i.amount)} to `,t(i.to),i.reason?` (${i.reason})`:""];case"bought":return[t(i.player)," bought ",n(i.space),` for ${De(i.price)}`];case"declined":return[t(i.player)," declined to buy ",n(i.space)];case"auctionStarted":return["Auction started for ",n(i.space)];case"bid":return[t(i.player),` bid ${De(i.amount)}`];case"auctionEnded":return i.winner?[t(i.winner)," won the auction for ",n(i.space),` at ${De(i.amount)}`]:["Nobody bid on ",n(i.space)];case"card":return[t(i.player),` drew ${i.deck==="chance"?"Chance":"Community Chest"}: \\u201C${i.text}\\u201D`];case"built":return[t(i.player),i.houses===5?" built a hotel on ":" built a house on ",n(i.space)];case"soldHouse":return[t(i.player)," sold a building on ",n(i.space)];case"mortgaged":return[t(i.player)," mortgaged ",n(i.space)];case"unmortgaged":return[t(i.player)," lifted the mortgage on ",n(i.space)];case"jailed":return[t(i.player),` went to jail (${i.reason})`];case"freed":return[t(i.player),i.how==="doubles"?" rolled doubles and left jail":i.how==="card"?" used a Get Out of Jail Free card":i.how==="fine"?" paid the fine and left jail":" had to pay and leave jail"];case"tradeProposed":return[t(i.trade.from)," proposed a trade to ",t(i.trade.to)];case"tradeAccepted":return[t(i.trade.to)," accepted a trade from ",t(i.trade.from)];case"tradeRejected":return["Trade between ",t(i.trade.from)," and ",t(i.trade.to)," was declined"];case"debt":return[t(i.player),` owes ${De(i.amount)} to `,t(i.creditor)];case"bankrupt":return[t(i.player)," went bankrupt",i.creditor?[" to ",t(i.creditor)]:""].flat();case"freeParking":return[t(i.player),` collected ${De(i.amount)} from Free Parking`];case"turnStarted":return[v("span",{class:"muted"},`\\u2014 Turn ${i.turnNumber}: `),t(i.player)];case"turnEnded":return null;case"gameOver":return[v("b",null,"\\u{1F3C6} "),t(i.winner)," wins the game!"];default:return null}}function i_(){try{let i=localStorage.getItem("pt.board");return i==="2d"||i==="3d"?i:null}catch{return null}}function s_(i){try{localStorage.setItem("pt.board",i)}catch{}}function $u(i,e,t){let n=v("div"),s=(a,o,l,c,h,u=1)=>{let d=v("input",{class:"input",type:"number",min:c,max:h,step:u,value:String(i[a]??0),disabled:!e,id:`rule-${a}`});d.addEventListener("change",()=>t({[a]:Number(d.value)})),n.appendChild(v("div",{class:"rule"},v("div",null,v("div",{class:"rlabel"},o),v("div",{class:"rhint"},l)),d))},r=(a,o,l)=>{let c=v("button",{class:`switch ${i[a]?"is-on":""}`,type:"button",role:"switch","aria-checked":String(!!i[a]),"aria-label":o,disabled:!e,id:`rule-${a}`,onClick:()=>t({[a]:!i[a]})});n.appendChild(v("div",{class:"rule"},v("div",null,v("div",{class:"rlabel"},o),v("div",{class:"rhint"},l)),c))};return s("startingCash","Starting cash","Everyone begins with this much.",100,1e4,50),s("goSalary","Salary for passing Go","Collected each lap.",0,2e3,10),r("auctions","Auctions","A property nobody buys goes to auction (official rule)."),r("freeParkingJackpot","Free Parking jackpot","Taxes and fees pile up; land there to collect."),r("doubleGoSalary","Double salary on Go","Landing exactly on Go pays twice."),s("jailFine","Jail fine","Cost to leave jail early.",0,1e3,10),s("maxJailTurns","Max turns in jail","Then you must pay and move.",1,6),n}function Ju(i,e,t){let n=v("select",{class:"input",disabled:!e,id:"rule-turnTimerSeconds"});for(let[s,r]of[[0,"Off"],[30,"30 s"],[60,"60 s"],[90,"90 s"],[120,"2 min"],[180,"3 min"],[300,"5 min"]])n.appendChild(v("option",{value:String(s),selected:(i.turnTimerSeconds??0)===s},r));return n.addEventListener("change",()=>t({turnTimerSeconds:Number(n.value)||null})),v("div",{class:"rule"},v("div",null,v("div",{class:"rlabel"},"Turn timer"),v("div",{class:"rhint"},"Slow players get auto-played.")),n)}function ju(){return v("div",{class:"muted small",style:{marginTop:"8px"}},v("span",{class:"ico",html:Fe.timer,style:{width:"1em",display:"inline-block",verticalAlign:"middle"}})," Only the host can change the rules.")}var Jo=class{constructor(e,t){X(this,"root");X(this,"handlers");X(this,"playersEl",v("div",{class:"players"}));X(this,"tokenGrid",v("div",{class:"token-grid"}));X(this,"rulesEl",v("div"));X(this,"startBtn",v("button",{class:"btn btn--primary btn--lg",type:"button"},"Start game"));X(this,"codeEl",v("span",{class:"code paper paper--flat"}));X(this,"linkEl",v("input",{class:"input",readOnly:!0,style:{maxWidth:"300px"}}));X(this,"hint",v("div",{class:"muted small",style:{marginTop:"8px"}}));X(this,"me",null);X(this,"room",null);this.root=e,this.handlers=t,_t(e),this.startBtn.addEventListener("click",()=>t.onStart());let n=v("button",{class:"btn btn--sm",type:"button",onClick:()=>this.copyLink()},"Copy invite link"),s=v("button",{class:"btn btn--sm",type:"button",onClick:()=>t.onLeave()},"Leave"),r=v("div",null,v("h1",null,"Waiting room"),v("div",{class:"muted small"},"Share the code or the link. Friends can join from any browser."),v("div",{class:"code-box"},this.codeEl,n),this.linkEl,v("h2",{style:{fontSize:"1.1em",margin:"16px 0 6px"}},"Players"),this.playersEl,v("div",{class:"my-token"},v("span",{style:{fontWeight:"600"}},"Your token:"),this.tokenGrid),v("div",{class:"actions"},this.startBtn,s),this.hint),a=v("div",{class:"rules paper paper--flat paper--tilt-r"},v("h2",null,"House rules"),this.rulesEl);e.appendChild(v("div",{class:"screen-center"},v("div",{class:"lobby paper"},r,a)))}copyLink(){let e=this.linkEl.value;navigator.clipboard?.writeText(e).then(()=>$n("Invite link copied"),()=>{this.linkEl.select(),$n("Select and copy the link")})}update(e,t){this.room=e,this.me=t;let n=e.hostId===t;this.codeEl.textContent=e.code,this.linkEl.value=`${location.origin}/${e.code}`,_t(this.playersEl);for(let o of e.players){let l=v("div",{class:"player-row paper paper--flat",style:{"--pcolor":o.color}},v("span",{html:Mn(o.token)}),v("div",null,v("div",{class:"pname"},o.name,o.id===t?v("span",{class:"tag tag--you",style:{marginLeft:"6px"}},"you"):null),v("div",{class:"pmeta"},o.isHost?v("span",{class:"tag tag--host"},"host"):null,o.connected?null:v("span",{class:"tag tag--off"},"disconnected"),v("span",{class:"tag",style:{background:o.color,color:"#fff"}},ki.find(c=>c.id===o.token)?.name??o.token))),n&&o.id!==t?v("button",{class:"btn btn--sm",type:"button",onClick:()=>this.handlers.onKick(o.id)},"Remove"):v("span"));if(o.id===t){let c=v("button",{class:"btn btn--sm",type:"button",onClick:()=>{let h=prompt("Your name",o.name);h!==null&&h.trim()&&this.handlers.onSetName(h.trim())}},"Rename");l.lastElementChild.replaceWith(c)}this.playersEl.appendChild(l)}_t(this.tokenGrid);let s=e.players.find(o=>o.id===t),r=new Set(e.players.filter(o=>o.id!==t).map(o=>o.token));for(let o of ki){let l=v("button",{class:`token-pick ${s?.token===o.id?"is-selected":""} ${r.has(o.id)?"is-taken":""}`,type:"button",title:o.name,disabled:r.has(o.id),onClick:()=>this.handlers.onSetToken(o.id)},v("span",{html:Mn(o.id)}),v("span",{class:"name"},o.name));this.tokenGrid.appendChild(l)}this.renderRules(e.config,n);let a=e.players.filter(o=>o.connected).length;this.startBtn.disabled=!n||a<2,this.startBtn.classList.toggle("hidden",!n),this.hint.textContent=n?a<2?"You need at least 2 players to start.":`${a} players ready. Up to ${e.maxPlayers} can join.`:"Waiting for the host to start the game\\u2026"}renderRules(e,t){_t(this.rulesEl),this.rulesEl.appendChild($u(e,t,n=>this.handlers.onSetConfig(n))),this.rulesEl.appendChild(Ju(e,t,n=>this.handlers.onSetConfig(n))),t||this.rulesEl.appendChild(ju())}};var jo=document.getElementById("app");document.body.insertAdjacentHTML("afterbegin",rh);document.addEventListener("pointerdown",ah,{once:!0});var rt=new Hr,Wt=new zr,Nr=null,fn=null,r_=null,Ku=location.pathname.replace(/^\\//,"").toUpperCase(),Yc=/^[A-Z0-9]{4}$/.test(Ku)?Ku:"";function Zc(){fn?.destroy(),fn=null,Nr=null,rt.set({screen:"home",room:null,game:null,playerId:null}),Wh(jo,{onCreate:(i,e)=>Wt.send({t:"create",name:i,token:e}),onJoin:(i,e,t)=>Wt.send({t:"join",code:i,name:e,token:t})},Yc)}function Qu(){fn?.destroy(),fn=null,rt.set({screen:"lobby",game:null}),Nr=new Jo(jo,{onSetToken:i=>Wt.send({t:"setToken",token:i}),onSetName:i=>Wt.send({t:"setName",name:i}),onSetConfig:i=>Wt.send({t:"setConfig",config:i}),onKick:i=>{confirm("Remove this player?")&&Wt.send({t:"kick",playerId:i})},onStart:()=>Wt.send({t:"start"}),onLeave:()=>ef()}),rt.state.room&&rt.state.playerId&&Nr.update(rt.state.room,rt.state.playerId)}function Xc(){Nr=null,rt.set({screen:"game"}),fn=new $o(jo,rt.state.playerId,{send:i=>Wt.send({t:"action",action:i}),chat:i=>Wt.send({t:"chat",text:i}),leave:()=>ef(),restart:()=>Wt.send({t:"restart"})}),rt.state.room&&fn.setRoom(rt.state.room);for(let i of rt.state.chat)fn.addChat(i)}function ef(){Wt.send({t:"leave"}),Wt.session=null,Ws(null,null),history.replaceState(null,"","/"),Zc()}Wt.on(i=>{if(!(!(rt.state.playerId!==null)&&(i.t==="room"||i.t==="state"||i.t==="timer"||i.t==="chat"||i.t==="chatHistory")))switch(i.t){case"welcome":{rt.set({playerId:i.playerId,room:i.room,chat:[]}),r_=i.room.code,Ws(i.session,i.room.code),history.replaceState(null,"",`/${i.room.code}`),i.room.status==="lobby"?Qu():rt.state.screen!=="game"?Xc():fn?.setRoom(i.room);return}case"room":{let t=rt.state.room;if(rt.set({room:i.room}),i.room.status==="lobby"&&rt.state.screen!=="lobby"){Qu();return}i.room.status!=="lobby"&&rt.state.screen==="lobby"&&Xc(),Nr?.update(i.room,rt.state.playerId),fn?.setRoom(i.room);return}case"state":{rt.set({game:i.state}),rt.state.screen!=="game"&&Xc(),fn?.onState(i.state,i.events),i.events.some(t=>t.type==="tradeProposed"&&t.trade.from===rt.state.playerId)&&fn?.onTradeProposed();return}case"timer":rt.set({timerEndsAt:i.endsAt}),fn?.setTimer(i.endsAt);return;case"chat":rt.state.chat.push(i.message),rt.state.chat.length>100&&rt.state.chat.shift(),fn?.addChat(i.message);return;case"chatHistory":rt.set({chat:i.messages});return;case"error":$n(i.message,"error"),fn?.onError(),i.fatal&&(Ws(null,null),Wt.session=null,history.replaceState(null,"","/"),Zc());return;case"left":return;case"pong":return}});Wt.onStatus(i=>{rt.set({connection:i}),i==="closed"&&rt.state.screen!=="home"&&$n("Connection lost, reconnecting\\u2026","error",1500)});var qc=ch();qc&&(!Yc||qc.code===Yc)?(Wt.session=qc.session,jo.appendChild(v("div",{class:"screen-center"},v("div",{class:"paper",style:{padding:"20px 28px",fontWeight:"600"}},"Reconnecting\\u2026"))),Wt.connect()):(Ws(null,null),Zc(),Wt.connect());})();\n/*! Bundled license information:\n\nthree/build/three.core.js:\nthree/build/three.module.js:\n  (**\n   * @license\n   * Copyright 2010-2026 Three.js Authors\n   * SPDX-License-Identifier: MIT\n   *)\n*/\n', css: `:root{--ink: #2b2118;--ink-soft: #5b4a3a;--paper: #fbf3e0;--paper-2: #f3e7c9;--paper-3: #e8d9b5;--paper-edge: #fffaf0;--wood: #8b5a2b;--wood-dark: #6e4520;--accent: #d9413a;--accent-2: #2f7fd6;--good: #3aa655;--warn: #e8b923;--shadow: rgba(43, 33, 24, .35);--font-ui: "Fredoka", "Trebuchet MS", "Segoe UI", sans-serif;--font-hand: "Patrick Hand", "Comic Sans MS", cursive;--g-brown: #8b4a2b;--g-lightblue: #7ec8e3;--g-pink: #d94f9a;--g-orange: #ef8a2b;--g-red: #d9413a;--g-yellow: #f2c94c;--g-green: #3aa655;--g-darkblue: #2f4fa8;--g-railroad: #2b2118;--g-utility: #9aa0a6}*{box-sizing:border-box}html,body{margin:0;height:100%}body{font-family:var(--font-ui);color:var(--ink);background:repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 2px,transparent 2px 38px),repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 7px),linear-gradient(180deg,#9a6431,#7d4d22);min-height:100%;overflow-x:hidden}button,input,select{font:inherit;color:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.55}.hidden{display:none!important}.sr-only{position:absolute;left:-9999px}.app{min-height:100vh;display:flex;flex-direction:column}.paper{background:var(--paper);border:3px solid var(--ink);border-radius:10px;box-shadow:0 6px 0 -2px var(--paper-edge),0 8px 0 -1px var(--ink),0 14px 18px -6px var(--shadow);position:relative}.paper:after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");opacity:.9;mix-blend-mode:multiply}.paper--flat{box-shadow:0 3px 0 -1px var(--ink),0 6px 10px -4px var(--shadow)}.paper--tilt-l{transform:rotate(-.8deg)}.paper--tilt-r{transform:rotate(.7deg)}.btn{display:inline-flex;align-items:center;justify-content:center;gap:.4em;background:var(--paper-2);border:3px solid var(--ink);border-radius:10px;padding:.5em 1.1em;font-weight:600;letter-spacing:.01em;line-height:1.1;box-shadow:0 4px 0 0 var(--ink);transform:translateY(0);transition:transform .08s,box-shadow .08s;white-space:nowrap;user-select:none}.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 0 0 var(--ink)}.btn:active:not(:disabled){transform:translateY(3px);box-shadow:0 1px 0 0 var(--ink)}.btn--primary{background:var(--accent);color:#fff}.btn--blue{background:var(--accent-2);color:#fff}.btn--good{background:var(--good);color:#fff}.btn--warn{background:var(--warn)}.btn--ghost{background:transparent;box-shadow:none;border-color:transparent;text-decoration:underline;padding:.3em .5em}.btn--sm{padding:.3em .7em;font-size:.85em;border-width:2px;box-shadow:0 3px 0 0 var(--ink);border-radius:8px}.btn--lg{font-size:1.25em;padding:.6em 1.4em}.btn--icon{padding:.35em;width:2.4em;height:2.4em}.btn .ico{width:1.3em;height:1.3em;display:inline-block}.btn .ico svg{width:100%;height:100%;display:block}.input{background:var(--paper-edge);border:3px solid var(--ink);border-radius:10px;padding:.5em .8em;width:100%;outline:none;box-shadow:inset 0 2px #0000000f}.input:focus{border-color:var(--accent-2)}.input--code{text-transform:uppercase;letter-spacing:.25em;font-weight:700;text-align:center;font-size:1.4em}.field{display:flex;flex-direction:column;gap:.3em;margin-bottom:.9em}.field label{font-weight:600;font-size:.9em;color:var(--ink-soft)}.tag{display:inline-block;padding:.1em .5em;border:2px solid var(--ink);border-radius:6px;font-size:.75em;font-weight:700;background:var(--paper-2);line-height:1.3}.tag--host{background:var(--warn)}.tag--off{background:#ccc;color:#444}.tag--jail{background:#9aa0a6;color:#fff}.tag--you{background:var(--accent-2);color:#fff}.title-art{font-family:var(--font-ui);font-weight:700;letter-spacing:.02em;line-height:.95;text-align:center;color:var(--paper);-webkit-text-stroke:2px var(--ink);text-shadow:3px 3px 0 var(--ink),6px 6px 0 var(--accent)}.title-art span{display:block}.hand{font-family:var(--font-hand)}.toast-host{position:fixed;left:50%;top:14px;transform:translate(-50%);z-index:90;display:flex;flex-direction:column;gap:8px;pointer-events:none}.toast{padding:.5em 1em;font-weight:600;animation:toast-in .25s ease-out}.toast--error{background:#ffd9d6}@keyframes toast-in{0%{transform:translateY(-20px) rotate(-2deg);opacity:0}to{transform:none;opacity:1}}.screen-center{flex:1;display:flex;align-items:center;justify-content:center;padding:24px 16px}.home{width:min(560px,100%);padding:28px 28px 24px}.home .title-art{font-size:clamp(2.4rem,8vw,4rem);margin:0 0 6px}.home .subtitle{text-align:center;margin:0 0 20px;color:var(--ink-soft);font-size:1.1em}.home .row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end}.home .or{text-align:center;margin:14px 0 6px;font-weight:700;color:var(--ink-soft)}.token-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.token-pick{background:var(--paper-edge);border:3px solid var(--ink);border-radius:12px;padding:6px 4px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 3px 0 0 var(--ink);transition:transform .1s}.token-pick svg{width:52px;height:52px}.token-pick .name{font-size:.75em;font-weight:600}.token-pick.is-selected{outline:4px solid var(--accent-2);outline-offset:-1px;transform:translateY(-2px) rotate(-2deg)}.token-pick.is-taken{opacity:.4}.token-pick.is-taken .name:after{content:" (taken)"}.lobby{width:min(980px,100%);padding:22px;display:grid;grid-template-columns:1.1fr 1fr;gap:22px}.lobby h1{margin:0 0 4px;font-size:1.6em}.lobby .code-box{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}.lobby .code{font-size:2.2em;font-weight:700;letter-spacing:.25em;padding:.05em .4em .05em .6em}.lobby .players{display:flex;flex-direction:column;gap:8px}.lobby .player-row{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;padding:6px 10px 6px 6px}.lobby .player-row svg{width:52px;height:52px}.lobby .player-row .pname{font-weight:700;font-size:1.05em}.lobby .player-row .pmeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}.lobby .rules{padding:14px 16px}.lobby .rules h2{margin:0 0 10px;font-size:1.15em}.rule{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;padding:6px 0;border-bottom:2px dashed var(--paper-3)}.rule:last-child{border-bottom:0}.rule .rlabel{font-weight:600}.rule .rhint{font-size:.8em;color:var(--ink-soft)}.rule input[type=number],.rule select{width:7.5em;padding:.25em .5em;border-width:2px;border-radius:8px}.switch{position:relative;width:52px;height:28px;border:3px solid var(--ink);border-radius:16px;background:var(--paper-3);box-shadow:inset 0 2px #00000014}.switch:after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:var(--paper-edge);border:2px solid var(--ink);transition:left .12s}.switch.is-on{background:var(--good)}.switch.is-on:after{left:24px}.switch:disabled{opacity:.7;cursor:default}.lobby .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.lobby .my-token{display:flex;align-items:center;gap:10px;margin:10px 0 14px;flex-wrap:wrap}.lobby .my-token .token-grid{grid-template-columns:repeat(8,1fr);gap:6px;flex:1;min-width:300px}.lobby .my-token .token-pick svg{width:34px;height:34px}.lobby .my-token .token-pick .name{display:none}.game{flex:1;display:grid;gap:12px;padding:12px;grid-template-columns:minmax(220px,280px) minmax(0,1fr) minmax(220px,300px);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"players board log" "players actions log";height:100vh;height:100dvh;min-height:0;max-height:100dvh;overflow:hidden}.game__players{grid-area:players;display:flex;flex-direction:column;gap:10px;overflow:auto;padding-right:4px;min-height:0}.game__board{grid-area:board;display:flex;align-items:center;justify-content:center;min-height:0;min-width:0}.game__log{grid-area:log;display:flex;flex-direction:column;min-height:0;overflow:hidden}.game__actions{grid-area:actions}@media(max-width:1100px){.game{grid-template-columns:minmax(200px,240px) minmax(0,1fr);grid-template-rows:auto auto auto;grid-template-areas:"players board" "actions actions" "log log";height:auto;max-height:none;overflow:visible}.game__log{height:300px}.game__players{overflow:visible}}@media(max-width:760px){.game{grid-template-columns:1fr;grid-template-areas:"board" "actions" "players" "log";padding:8px;gap:8px}.game__players{flex-direction:row;flex-wrap:wrap;overflow:visible}.game__players .pcard{flex:1 1 46%}}.board-wrap{position:relative;width:min(100%,calc(100dvh - 120px));aspect-ratio:1;max-width:900px}@media(max-width:760px){.board-wrap{width:100%;max-width:none}}.board{position:absolute;inset:0;display:grid;grid-template-columns:1.55fr repeat(9,1fr) 1.55fr;grid-template-rows:1.55fr repeat(9,1fr) 1.55fr;gap:.25em;padding:.45em;background:var(--paper);border:.32em solid var(--ink);border-radius:.9em;box-shadow:.35em .6em 0 -.1em var(--paper-edge),.4em .7em 0 0 var(--ink),0 1.4em 2em -.6em var(--shadow);transform:rotate(-.4deg);font-size:10px}.board:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");mix-blend-mode:multiply}.space{position:relative;background:var(--paper-edge);border:.22em solid var(--ink);border-radius:.5em;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;cursor:pointer;transition:transform .12s;z-index:1;min-width:0;min-height:0;box-shadow:0 .2em 0 0 var(--paper-3)}.space:hover{transform:translateY(-.15em) scale(1.03);z-index:3;box-shadow:0 .5em .6em -.2em var(--shadow)}.space--corner{font-weight:700}.space .band{position:absolute;background:var(--band, #999);border:.18em solid var(--ink)}.space--bottom .band{top:-.18em;left:-.18em;right:-.18em;height:26%;border-radius:.35em .35em 0 0}.space--top .band{bottom:-.18em;left:-.18em;right:-.18em;height:26%;border-radius:0 0 .35em .35em}.space--left .band{right:-.18em;top:-.18em;bottom:-.18em;width:26%;border-radius:0 .35em .35em 0}.space--right .band{left:-.18em;top:-.18em;bottom:-.18em;width:26%;border-radius:.35em 0 0 .35em}.space .sname{font-size:1.05em;font-weight:600;line-height:1.05;padding:0 .2em;word-break:break-word}.space .sprice{font-size:.95em;color:var(--ink-soft);font-weight:600}.space .sicon{width:3.2em;height:3.2em}.space--corner .sicon{width:5.5em;height:5.5em}.space--corner .sname{font-size:1.15em}.space--bottom .sname,.space--bottom .sprice{margin-top:.1em}.space--bottom .content,.space--top .content{padding-top:26%}.space--top .content{padding-top:0;padding-bottom:26%}.space--left .content{padding-right:26%}.space--right .content{padding-left:26%}.space .content{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em;width:100%;height:100%}.space--bottom .sicon,.space--top .sicon,.space--left .sicon,.space--right .sicon{width:2.6em;height:2.6em}.space .owner{position:absolute;width:1.6em;height:1.6em;border-radius:50%;border:.18em solid var(--ink);background:var(--owner, #999);box-shadow:0 .1em 0 0 var(--ink);z-index:2}.space--bottom .owner{bottom:.25em;right:.25em}.space--top .owner{top:.25em;right:.25em}.space--left .owner{bottom:.25em;left:.25em}.space--right .owner{bottom:.25em;right:.25em}.space .houses{position:absolute;display:flex;gap:.1em;z-index:2}.space--bottom .houses{top:.15em;left:50%;transform:translate(-50%)}.space--top .houses{bottom:.15em;left:50%;transform:translate(-50%)}.space--left .houses{right:.15em;top:50%;transform:translateY(-50%);flex-direction:column}.space--right .houses{left:.15em;top:50%;transform:translateY(-50%);flex-direction:column}.space .houses svg{width:1.5em;height:1.5em;filter:drop-shadow(0 .08em 0 var(--ink))}.space .houses svg.hotel{width:1.9em;height:1.9em}.space.is-mortgaged .content{opacity:.45}.space.is-mortgaged:after{content:"MORTGAGED";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-18deg);font-size:.8em;font-weight:800;color:var(--accent);border:.2em solid var(--accent);padding:0 .3em;border-radius:.3em;background:#fffaf0d9;letter-spacing:.05em;z-index:2}.space.is-highlight{outline:.35em solid var(--accent-2);outline-offset:-.1em}.space.is-landing{animation:land-flash .9s ease-out}@keyframes land-flash{0%{background:#fff3a6}to{background:var(--paper-edge)}}.center{grid-area:2 / 2 / 11 / 11;position:relative;display:grid;grid-template-rows:auto 1fr auto;align-items:center;justify-items:center;padding:1em 1.2em;z-index:0;gap:.4em}.center .logo{font-size:4.6em;transform:rotate(-4deg);margin-top:.2em}.center .logo .small{font-size:.42em;display:block;letter-spacing:.25em;-webkit-text-stroke:1px var(--ink);text-shadow:2px 2px 0 var(--ink)}.center .middle{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1.5em;width:100%}.deck{width:8.5em;height:5.6em;border:.22em solid var(--ink);border-radius:.6em;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em;font-weight:700;font-size:1em;box-shadow:.25em .3em 0 0 var(--ink),.5em .6em 0 0 var(--paper-edge),.55em .65em 0 0 var(--ink);background:var(--paper-2);transform:rotate(-6deg)}.deck--chest{transform:rotate(5deg);background:#dff1fa}.deck--chance{background:#ffe1b3}.deck svg{width:2.8em;height:2.8em}.dice-area{display:flex;flex-direction:column;align-items:center;gap:.5em}.dice{display:flex;gap:1em;perspective:40em;height:5.6em}.die{width:5em;height:5em;transform-style:preserve-3d;transition:transform .2s}.die svg{width:100%;height:100%;filter:drop-shadow(.15em .25em 0 var(--shadow))}.die.is-rolling{animation:tumble .9s ease-out}.die:nth-child(2).is-rolling{animation-duration:1.05s}@keyframes tumble{0%{transform:rotate3d(1,1,0,0) translateY(-3em) scale(1.1)}40%{transform:rotate3d(1,1,0,540deg) translateY(-1.2em) scale(1.15)}75%{transform:rotate3d(1,1,0,720deg) translateY(0) scale(1)}88%{transform:rotate3d(0,0,1,12deg) translateY(-.4em)}to{transform:none}}.turn-banner{font-size:1.5em;font-weight:700;padding:.25em .9em;transform:rotate(1.5deg);text-align:center;max-width:100%}.turn-banner .who{color:var(--who, var(--accent))}.pot{font-size:1.05em;font-weight:700;padding:.15em .7em;transform:rotate(-2deg);background:#e8f6e5}.center .bottom{display:flex;gap:1em;align-items:center;flex-wrap:wrap;justify-content:center}.token{position:absolute;width:5.6em;height:5.6em;margin:-2.8em 0 0 -2.8em;z-index:5;pointer-events:none;transition:left .18s linear,top .18s linear;transform-style:preserve-3d}.token .flip{width:100%;height:100%;transition:transform .18s;transform-origin:50% 50%}.token.face-left .flip{transform:scaleX(-1)}.token .flip svg{width:100%;height:100%;filter:drop-shadow(.2em .35em 0 var(--shadow))}.token.is-hop .flip{animation:hop .18s ease-out}@keyframes hop{0%{transform:translateY(0) scaleX(var(--sx, 1))}50%{transform:translateY(-1.6em) scaleX(var(--sx, 1)) rotate(var(--rot, -6deg))}to{transform:translateY(0) scaleX(var(--sx, 1))}}.token.is-current{z-index:6}.token.is-current:after{content:"";position:absolute;left:50%;bottom:-.4em;width:3.6em;height:1.1em;margin-left:-1.8em;border-radius:50%;border:.18em solid var(--ink);background:var(--tcolor, var(--accent));opacity:.85;z-index:-1;animation:pulse 1.2s infinite}@keyframes pulse{0%,to{transform:scale(1)}50%{transform:scale(1.12)}}.token.is-bankrupt{opacity:.35;filter:grayscale(1)}.token .badge{position:absolute;top:-.3em;right:-.3em;width:2em;height:2em}.pcard{padding:8px 10px;display:grid;grid-template-columns:44px 1fr;gap:8px 10px;align-items:center;border-left-width:8px;border-left-color:var(--pcolor, var(--ink))}.pcard.is-current{outline:4px solid var(--pcolor);outline-offset:2px}.pcard.is-bankrupt{opacity:.5;filter:grayscale(.8)}.pcard .ptoken svg{width:44px;height:44px}.pcard .pname{font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pcard .pcash{font-size:1.2em;font-weight:700;font-variant-numeric:tabular-nums}.pcard .pcash.bump-up{animation:bump-up .6s}.pcard .pcash.bump-down{animation:bump-down .6s}@keyframes bump-up{30%{color:var(--good);transform:scale(1.15)}}@keyframes bump-down{30%{color:var(--accent);transform:scale(1.15)}}.pcard .pprops{grid-column:1 / -1;display:flex;flex-wrap:wrap;gap:3px}.chip{width:16px;height:22px;border:2px solid var(--ink);border-radius:3px;background:var(--chip);position:relative}.chip.is-mortgaged{background:repeating-linear-gradient(45deg,var(--chip) 0 3px,#fff 3px 5px);opacity:.7}.chip .h{position:absolute;left:0;right:0;bottom:-2px;text-align:center;font-size:9px;font-weight:800;color:#fff;text-shadow:0 0 2px #000;line-height:1}.pcard .pmeta{grid-column:1 / -1;display:flex;gap:6px;flex-wrap:wrap;font-size:.85em}.actions{padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:64px}.actions .spacer{flex:1}.actions .hint{font-weight:600;color:var(--ink-soft)}.actions .timer{font-weight:700;font-variant-numeric:tabular-nums;padding:.2em .6em}.actions .timer.is-low{background:#ffd9d6;animation:pulse .6s infinite}.actions .dice-mini{display:flex;gap:4px}.actions .dice-mini svg{width:30px;height:30px}.logbox{padding:8px 10px;flex:1;display:flex;flex-direction:column;min-height:0}.logbox h3{margin:0 0 6px;font-size:1em;display:flex;justify-content:space-between;align-items:center}.log{flex:1 1 0;overflow-y:auto;font-size:.9em;display:flex;flex-direction:column;gap:3px;min-height:0}.log .entry{padding:2px 6px;border-radius:6px;background:#ffffff59;animation:entry-in .2s}.log .entry.chat{background:#e6f0ff}.log .entry.system{color:var(--ink-soft);font-style:italic}.log .entry b{color:var(--c, var(--ink))}@keyframes entry-in{0%{opacity:0;transform:translate(-6px)}}.chatform{display:flex;gap:6px;margin-top:6px}.chatform .input{padding:.35em .6em;border-width:2px}.overlay{position:fixed;inset:0;background:#2b211873;display:flex;align-items:center;justify-content:center;z-index:50;padding:16px;perspective:1200px}.overlay.is-passive{pointer-events:none;background:transparent}.overlay.is-passive .dialog{pointer-events:auto}.dialog{width:min(520px,100%);max-height:92vh;overflow:auto;padding:18px 20px;animation:flip-in .35s cubic-bezier(.2,.9,.3,1.2)}.dialog--wide{width:min(760px,100%)}.dialog h2{margin:0 0 10px;font-size:1.4em;display:flex;align-items:center;gap:8px}.dialog h2 .ico{width:1.3em;height:1.3em}.dialog .buttons{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}@keyframes flip-in{0%{transform:rotateX(-70deg) translateY(-30px);opacity:0}to{transform:none;opacity:1}}.deed{width:250px;margin:0 auto;padding:0;overflow:hidden}.deed .deed-band{background:var(--band);color:#fff;text-align:center;padding:8px 6px 6px;border-bottom:3px solid var(--ink);text-shadow:0 1px 0 rgba(0,0,0,.4)}.deed .deed-band.is-light{color:var(--ink);text-shadow:none}.deed .deed-band .kind{font-size:.7em;letter-spacing:.15em;opacity:.9}.deed .deed-band .dname{font-size:1.15em;font-weight:700}.deed .deed-body{padding:8px 12px 10px;font-size:.9em}.deed .deed-body table{width:100%;border-collapse:collapse}.deed .deed-body td{padding:2px 0}.deed .deed-body td:last-child{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}.deed .deed-body tr.is-active td{background:#fff3a6}.deed .deed-body .foot{margin-top:6px;border-top:2px dashed var(--paper-3);padding-top:6px;color:var(--ink-soft)}.deed .deed-icon{width:64px;height:64px;margin:6px auto 0;display:block}.deed .deed-owner{display:flex;align-items:center;gap:6px;margin-top:6px;font-weight:600}.deed .deed-owner .dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--ink);background:var(--owner)}.card-pop{width:min(420px,100%);padding:0;overflow:hidden}.card-pop .card-head{padding:12px 16px;border-bottom:3px solid var(--ink);display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.2em;letter-spacing:.05em}.card-pop.chance .card-head{background:#ffe1b3}.card-pop.chest .card-head{background:#dff1fa}.card-pop .card-head svg{width:36px;height:36px}.card-pop .card-text{padding:22px 20px;font-size:1.35em;text-align:center}.auction .bids{display:flex;flex-direction:column;gap:4px;margin:8px 0}.auction .bidrow{display:flex;justify-content:space-between;padding:4px 8px;border-radius:6px;background:#fff6}.auction .bidrow.is-high{background:#fff3a6;font-weight:700}.auction .bidrow.is-out{opacity:.5;text-decoration:line-through}.auction .bidform{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.auction .bidform .input{width:7em}.manage .group{margin-bottom:8px}.manage .prow{display:grid;grid-template-columns:14px 1fr auto;gap:8px;align-items:center;padding:4px 0;border-bottom:2px dashed var(--paper-3)}.manage .prow .pn{font-weight:600}.manage .prow .pn small{color:var(--ink-soft);font-weight:500}.manage .prow .pb{display:flex;gap:4px}.trade .cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}.trade .col{padding:10px}.trade .col h3{margin:0 0 6px;font-size:1em}.trade .plist{display:flex;flex-direction:column;gap:3px;max-height:220px;overflow:auto}.trade .plist label{display:flex;align-items:center;gap:6px;font-size:.9em}.trade .plist label.is-locked{opacity:.5}.trade .cash{display:flex;align-items:center;gap:6px;margin:6px 0}.trade .cash .input{width:7em}.trade .summary{display:flex;flex-direction:column;gap:4px;margin:6px 0}.trade .summary .line{display:flex;gap:6px;align-items:center;flex-wrap:wrap}@media(max-width:600px){.trade .cols{grid-template-columns:1fr}}.standings{display:flex;flex-direction:column;gap:6px;margin-top:8px}.standings .srow{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:8px;padding:6px 10px}.standings .srow svg{width:36px;height:36px}.standings .srow.is-winner{background:#fff3a6}.winner-crown{width:90px;height:90px;margin:0 auto;display:block;animation:crown-drop .8s cubic-bezier(.2,.9,.3,1.3)}@keyframes crown-drop{0%{transform:translateY(-60px) rotate(-20deg);opacity:0}}.confetti{position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden}.confetti i{position:absolute;top:-20px;width:10px;height:16px;border:2px solid var(--ink);animation:fall linear forwards}@keyframes fall{to{transform:translateY(110vh) rotate(720deg)}}.mini-token svg{width:1.6em;height:1.6em;vertical-align:middle}.money{font-variant-numeric:tabular-nums;font-weight:700}.muted{color:var(--ink-soft)}.small{font-size:.85em}.row-between{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.topbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.setup{width:min(980px,100%);padding:24px 26px;display:grid;grid-template-columns:1.15fr 1fr;gap:22px}.setup .title-art{font-size:clamp(2.2rem,7vw,3.4rem);margin:0 0 4px}.setup .subtitle{text-align:center;margin:0 0 16px;color:var(--ink-soft);font-size:1.05em}.setup .resume{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;margin-bottom:14px;background:#e8f6e5;flex-wrap:wrap}.setup .count-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.setup .bots{display:flex;gap:8px;flex-wrap:wrap}.setup .bot{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;font-weight:600}.setup .bot svg{width:36px;height:36px}.setup .rules{padding:14px 16px;align-self:start}.setup .rules h2{margin:0 0 10px;font-size:1.15em}@media(max-width:760px){.setup,.lobby{grid-template-columns:1fr}.setup .rules{transform:none}}.board3d-wrap{position:relative;width:100%;height:100%;min-height:380px;border-radius:14px;overflow:hidden;border:3px solid var(--ink);box-shadow:0 10px 24px -8px var(--shadow);background:#7d4d22}.board3d-canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;touch-action:none}.board3d-overlay{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:12px;align-items:center;pointer-events:none;flex-wrap:wrap;padding:0 10px}.board3d-overlay .turn-banner{font-size:1.1em;pointer-events:auto}.board3d-overlay .pot{font-size:.9em;pointer-events:auto}.board3d-wrap .view-btn{position:absolute;top:10px;right:10px}.board3d-hint{position:absolute;top:12px;left:12px;font-size:.8em;color:#fbf3e0;background:#2b21188c;padding:4px 10px;border-radius:8px;transition:opacity 1s;pointer-events:none;max-width:70%}.board3d-hint.is-fading{opacity:0}@media(max-width:1100px){.board3d-wrap{height:62vh;min-height:320px}}@media(max-width:760px){.board3d-wrap{height:58vh;min-height:300px}}
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
