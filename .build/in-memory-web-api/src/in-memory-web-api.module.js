var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var in_memory_web_api_module_exports = {};
__export(in_memory_web_api_module_exports, {
  InMemoryWebApiModule: () => InMemoryWebApiModule,
  inMemoryBackendServiceFactory: () => inMemoryBackendServiceFactory
});
module.exports = __toCommonJS(in_memory_web_api_module_exports);
var import_core = require("@angular/core");
var import_http = require("@angular/http");
var import_in_memory_backend = require("./in-memory-backend.service");
function inMemoryBackendServiceFactory(injector, dbService, options) {
  let backend = new import_in_memory_backend.InMemoryBackendService(injector, dbService, options);
  return backend;
}
let InMemoryWebApiModule = class {
  static forRoot(dbCreator, options) {
    return {
      ngModule: InMemoryWebApiModule,
      providers: [
        { provide: import_in_memory_backend.InMemoryDbService, useClass: dbCreator },
        { provide: import_in_memory_backend.InMemoryBackendConfig, useValue: options }
      ]
    };
  }
};
InMemoryWebApiModule = __decorateClass([
  (0, import_core.NgModule)({
    providers: [{
      provide: import_http.XHRBackend,
      useFactory: inMemoryBackendServiceFactory,
      deps: [import_core.Injector, import_in_memory_backend.InMemoryDbService, import_in_memory_backend.InMemoryBackendConfig]
    }]
  })
], InMemoryWebApiModule);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InMemoryWebApiModule,
  inMemoryBackendServiceFactory
});
//# sourceMappingURL=in-memory-web-api.module.js.map
