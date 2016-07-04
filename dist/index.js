'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bformat_analyser = exports.Bformat_binDecoder = exports.Bformat_vmic = exports.Bformat_rotator = exports.Bformat_encoder = exports.hoa_converters = exports.HOAloader = exports.HOA_analyser = exports.HOA_vmic = exports.HOA_binDecoder = exports.HOA_rotator = exports.HOA_orderLimiter = exports.HOA_encoder = exports.jshlib = undefined;

var _hoaEncoder = require('./hoa-encoder');

Object.defineProperty(exports, 'HOA_encoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaEncoder).default;
  }
});

var _hoaLimiter = require('./hoa-limiter');

Object.defineProperty(exports, 'HOA_orderLimiter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaLimiter).default;
  }
});

var _hoaRotator = require('./hoa-rotator');

Object.defineProperty(exports, 'HOA_rotator', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaRotator).default;
  }
});

var _hoaDecoderBin = require('./hoa-decoderBin');

Object.defineProperty(exports, 'HOA_binDecoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaDecoderBin).default;
  }
});

var _hoaVirtualMic = require('./hoa-virtualMic');

Object.defineProperty(exports, 'HOA_vmic', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaVirtualMic).default;
  }
});

var _hoaAnalyser = require('./hoa-analyser');

Object.defineProperty(exports, 'HOA_analyser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaAnalyser).default;
  }
});

var _hoaLoader = require('./hoa-loader');

Object.defineProperty(exports, 'HOAloader', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaLoader).default;
  }
});

var _foaEncoder = require('./foa-encoder');

Object.defineProperty(exports, 'Bformat_encoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaEncoder).default;
  }
});

var _foaRotator = require('./foa-rotator');

Object.defineProperty(exports, 'Bformat_rotator', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaRotator).default;
  }
});

var _foaVirtualMic = require('./foa-virtualMic');

Object.defineProperty(exports, 'Bformat_vmic', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaVirtualMic).default;
  }
});

var _foaDecoderBin = require('./foa-decoderBin');

Object.defineProperty(exports, 'Bformat_binDecoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaDecoderBin).default;
  }
});

var _foaAnalyser = require('./foa-analyser');

Object.defineProperty(exports, 'Bformat_analyser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaAnalyser).default;
  }
});

var _jshLib = require('./jsh-lib');

var _jshlib = _interopRequireWildcard(_jshLib);

var _hoaConverters = require('./hoa-converters');

var _hoa_converters = _interopRequireWildcard(_hoaConverters);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jshlib = exports.jshlib = _jshlib;

// expose for plugins
var hoa_converters = exports.hoa_converters = _hoa_converters;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OzsrQ0FJUyxPOzs7Ozs7Ozs7K0NBQ0EsTzs7Ozs7Ozs7OytDQUNBLE87Ozs7Ozs7OztrREFDQSxPOzs7Ozs7Ozs7a0RBQ0EsTzs7Ozs7Ozs7O2dEQUNBLE87Ozs7Ozs7Ozs4Q0FFQSxPOzs7Ozs7Ozs7K0NBS0EsTzs7Ozs7Ozs7OytDQUNBLE87Ozs7Ozs7OztrREFDQSxPOzs7Ozs7Ozs7a0RBQ0EsTzs7Ozs7Ozs7O2dEQUNBLE87Ozs7QUFwQlQ7O0lBQVksTzs7QUFhWjs7SUFBWSxlOzs7Ozs7QUFaTCxJQUFNLDBCQUFTLE9BQWY7OztBQWFBLElBQU0sMENBQWlCLGVBQXZCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgX2pzaGxpYiBmcm9tICcuL2pzaC1saWInO1xuZXhwb3J0IGNvbnN0IGpzaGxpYiA9IF9qc2hsaWI7XG5cbi8vIGV4cG9zZSBmb3IgcGx1Z2luc1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBIT0FfZW5jb2RlciB9IGZyb20gJy4vaG9hLWVuY29kZXInO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBIT0Ffb3JkZXJMaW1pdGVyIH0gZnJvbSAnLi9ob2EtbGltaXRlcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEhPQV9yb3RhdG9yIH0gZnJvbSAnLi9ob2Etcm90YXRvcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEhPQV9iaW5EZWNvZGVyfSBmcm9tICcuL2hvYS1kZWNvZGVyQmluJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgSE9BX3ZtaWMgfSBmcm9tICcuL2hvYS12aXJ0dWFsTWljJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgSE9BX2FuYWx5c2VyIH0gZnJvbSAnLi9ob2EtYW5hbHlzZXInO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIEhPQWxvYWRlciB9IGZyb20gJy4vaG9hLWxvYWRlcic7XG5cbmltcG9ydCAqIGFzIF9ob2FfY29udmVydGVycyBmcm9tICcuL2hvYS1jb252ZXJ0ZXJzJztcbmV4cG9ydCBjb25zdCBob2FfY29udmVydGVycyA9IF9ob2FfY29udmVydGVycztcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBCZm9ybWF0X2VuY29kZXIgfSBmcm9tICcuL2ZvYS1lbmNvZGVyJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgQmZvcm1hdF9yb3RhdG9yIH0gZnJvbSAnLi9mb2Etcm90YXRvcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEJmb3JtYXRfdm1pYyB9IGZyb20gJy4vZm9hLXZpcnR1YWxNaWMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBCZm9ybWF0X2JpbkRlY29kZXJ9IGZyb20gJy4vZm9hLWRlY29kZXJCaW4nO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBCZm9ybWF0X2FuYWx5c2VyfSBmcm9tICcuL2ZvYS1hbmFseXNlcic7XG4iXX0=