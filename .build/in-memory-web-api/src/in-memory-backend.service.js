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
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
var in_memory_backend_service_exports = {};
__export(in_memory_backend_service_exports, {
  InMemoryBackendConfig: () => InMemoryBackendConfig,
  InMemoryBackendService: () => InMemoryBackendService,
  InMemoryDbService: () => InMemoryDbService,
  isSuccess: () => isSuccess
});
module.exports = __toCommonJS(in_memory_backend_service_exports);
var import_core = require("@angular/core");
var import_http = require("@angular/http");
var import_Observable = require("rxjs/Observable");
var import_delay = require("rxjs/add/operator/delay");
var import_http_status_codes = require("./http-status-codes");
class InMemoryDbService {
}
class InMemoryBackendConfig {
  constructor(config = {}) {
    Object.assign(this, {
      caseSensitiveSearch: false,
      defaultResponseOptions: new import_http.BaseResponseOptions(),
      delay: 500,
      delete404: false,
      passThruUnknownUrl: false,
      host: "",
      rootPath: ""
    }, config);
  }
}
const isSuccess = (status) => status >= 200 && status < 300;
let InMemoryBackendService = class {
  constructor(injector, inMemDbService, config) {
    this.injector = injector;
    this.inMemDbService = inMemDbService;
    this.config = new InMemoryBackendConfig();
    this.resetDb();
    const loc = this.getLocation("./");
    this.config.host = loc.host;
    this.config.rootPath = loc.pathname;
    Object.assign(this.config, config || {});
    this.setPassThruBackend();
  }
  createConnection(req) {
    const response = this.handleRequest(req);
    return {
      readyState: import_http.ReadyState.Done,
      request: req,
      response
    };
  }
  handleRequest(req) {
    const { base, collectionName, id, resourceUrl, query } = this.parseUrl(req.url);
    const collection = this.db[collectionName];
    const reqInfo = {
      req,
      base,
      collection,
      collectionName,
      headers: new import_http.Headers({ "Content-Type": "application/json" }),
      id: this.parseId(collection, id),
      query,
      resourceUrl
    };
    const reqMethodName = import_http.RequestMethod[req.method || 0].toLowerCase();
    let resOptions;
    try {
      if ("commands" === reqInfo.base.toLowerCase()) {
        return this.commands(reqInfo);
      } else if (this.inMemDbService[reqMethodName]) {
        const interceptorArgs = {
          requestInfo: reqInfo,
          db: this.db,
          config: this.config,
          passThruBackend: this.passThruBackend
        };
        return this.inMemDbService[reqMethodName](interceptorArgs);
      } else if (reqInfo.collection) {
        return this.collectionHandler(reqInfo);
      } else if (this.passThruBackend) {
        return this.passThruBackend.createConnection(req).response;
      } else {
        resOptions = this.createErrorResponse(import_http_status_codes.STATUS.NOT_FOUND, `Collection '${collectionName}' not found`);
        return this.createObservableResponse(resOptions);
      }
    } catch (error) {
      const err = error.message || error;
      resOptions = this.createErrorResponse(import_http_status_codes.STATUS.INTERNAL_SERVER_ERROR, `${err}`);
      return this.createObservableResponse(resOptions);
    }
  }
  applyQuery(collection, query) {
    const conditions = [];
    const caseSensitive = this.config.caseSensitiveSearch ? void 0 : "i";
    query.paramsMap.forEach((value, name) => {
      value.forEach((v) => conditions.push({ name, rx: new RegExp(decodeURI(v), caseSensitive) }));
    });
    const len = conditions.length;
    if (!len) {
      return collection;
    }
    return collection.filter((row) => {
      let ok = true;
      let i = len;
      while (ok && i) {
        i -= 1;
        const cond = conditions[i];
        ok = cond.rx.test(row[cond.name]);
      }
      return ok;
    });
  }
  clone(data) {
    return JSON.parse(JSON.stringify(data));
  }
  collectionHandler(reqInfo) {
    const req = reqInfo.req;
    let resOptions;
    switch (req.method) {
      case import_http.RequestMethod.Get:
        resOptions = this.get(reqInfo);
        break;
      case import_http.RequestMethod.Post:
        resOptions = this.post(reqInfo);
        break;
      case import_http.RequestMethod.Put:
        resOptions = this.put(reqInfo);
        break;
      case import_http.RequestMethod.Delete:
        resOptions = this.delete(reqInfo);
        break;
      default:
        resOptions = this.createErrorResponse(import_http_status_codes.STATUS.METHOD_NOT_ALLOWED, "Method not allowed");
        break;
    }
    return this.createObservableResponse(resOptions);
  }
  commands(reqInfo) {
    const command = reqInfo.collectionName.toLowerCase();
    const method = reqInfo.req.method;
    let resOptions;
    switch (command) {
      case "resetdb":
        this.resetDb();
        resOptions = new import_http.ResponseOptions({ status: import_http_status_codes.STATUS.OK });
        break;
      case "config":
        if (method === import_http.RequestMethod.Get) {
          resOptions = new import_http.ResponseOptions({
            body: this.clone(this.config),
            status: import_http_status_codes.STATUS.OK
          });
        } else {
          const body = JSON.parse(reqInfo.req.text() || "{}");
          Object.assign(this.config, body);
          this.setPassThruBackend();
          resOptions = new import_http.ResponseOptions({ status: import_http_status_codes.STATUS.NO_CONTENT });
        }
        break;
      default:
        resOptions = this.createErrorResponse(
          import_http_status_codes.STATUS.INTERNAL_SERVER_ERROR,
          `Unknown command "${command}"`
        );
    }
    return this.createObservableResponse(resOptions);
  }
  createErrorResponse(status, message) {
    return new import_http.ResponseOptions({
      body: { "error": `${message}` },
      headers: new import_http.Headers({ "Content-Type": "application/json" }),
      status
    });
  }
  createObservableResponse(resOptions) {
    resOptions = this.setStatusText(resOptions);
    if (this.config.defaultResponseOptions) {
      resOptions = this.config.defaultResponseOptions.merge(resOptions);
    }
    const res = new import_http.Response(resOptions);
    return new import_Observable.Observable((responseObserver) => {
      if (isSuccess(res.status)) {
        responseObserver.next(res);
        responseObserver.complete();
      } else {
        responseObserver.error(res);
      }
      return () => {
      };
    }).delay(this.config.delay || 500);
  }
  delete({ id, collection, collectionName, headers }) {
    if (!id) {
      return this.createErrorResponse(import_http_status_codes.STATUS.NOT_FOUND, `Missing "${collectionName}" id`);
    }
    const exists = this.removeById(collection, id);
    return new import_http.ResponseOptions({
      headers,
      status: exists || !this.config.delete404 ? import_http_status_codes.STATUS.NO_CONTENT : import_http_status_codes.STATUS.NOT_FOUND
    });
  }
  findById(collection, id) {
    return collection.find((item) => item.id === id);
  }
  genId(collection) {
    let maxId = 0;
    collection.reduce((prev, item) => {
      maxId = Math.max(maxId, typeof item.id === "number" ? item.id : maxId);
    }, null);
    return maxId + 1;
  }
  get({ id, query, collection, collectionName, headers }) {
    let data = collection;
    if (id) {
      data = this.findById(collection, id);
    } else if (query) {
      data = this.applyQuery(collection, query);
    }
    if (!data) {
      return this.createErrorResponse(
        import_http_status_codes.STATUS.NOT_FOUND,
        `'${collectionName}' with id='${id}' not found`
      );
    }
    return new import_http.ResponseOptions({
      body: { data: this.clone(data) },
      headers,
      status: import_http_status_codes.STATUS.OK
    });
  }
  getLocation(href) {
    const l = document.createElement("a");
    l.href = href;
    return l;
  }
  indexOf(collection, id) {
    return collection.findIndex((item) => item.id === id);
  }
  parseId(collection, id) {
    if (!id) {
      return null;
    }
    const isNumberId = collection[0] && typeof collection[0].id === "number";
    if (isNumberId) {
      const idNum = parseFloat(id);
      return isNaN(idNum) ? id : idNum;
    }
    return id;
  }
  parseUrl(url) {
    try {
      const loc = this.getLocation(url);
      let drop = this.config.rootPath.length;
      let urlRoot = "";
      if (loc.host !== this.config.host) {
        drop = 1;
        urlRoot = loc.protocol + "//" + loc.host + "/";
      }
      const path = loc.pathname.substring(drop);
      let [base, collectionName, id] = path.split("/");
      const resourceUrl = urlRoot + base + "/" + collectionName + "/";
      [collectionName] = collectionName.split(".");
      const query = loc.search && new import_http.URLSearchParams(loc.search.substr(1));
      return { base, id, collectionName, resourceUrl, query };
    } catch (err) {
      const msg = `unable to parse url '${url}'; original error: ${err.message}`;
      throw new Error(msg);
    }
  }
  post({ collection, headers, id, req, resourceUrl }) {
    const item = JSON.parse(req.text());
    if (!item.id) {
      item.id = id || this.genId(collection);
    }
    id = item.id;
    const existingIx = this.indexOf(collection, id);
    if (existingIx > -1) {
      collection[existingIx] = item;
      return new import_http.ResponseOptions({
        headers,
        status: import_http_status_codes.STATUS.NO_CONTENT
      });
    } else {
      collection.push(item);
      headers.set("Location", resourceUrl + "/" + id);
      return new import_http.ResponseOptions({
        headers,
        body: { data: this.clone(item) },
        status: import_http_status_codes.STATUS.CREATED
      });
    }
  }
  put({ id, collection, collectionName, headers, req }) {
    const item = JSON.parse(req.text());
    if (!id) {
      return this.createErrorResponse(import_http_status_codes.STATUS.NOT_FOUND, `Missing '${collectionName}' id`);
    }
    if (id !== item.id) {
      return this.createErrorResponse(
        import_http_status_codes.STATUS.BAD_REQUEST,
        `"${collectionName}" id does not match item.id`
      );
    }
    const existingIx = this.indexOf(collection, id);
    if (existingIx > -1) {
      collection[existingIx] = item;
      return new import_http.ResponseOptions({
        headers,
        status: import_http_status_codes.STATUS.NO_CONTENT
      });
    } else {
      collection.push(item);
      return new import_http.ResponseOptions({
        body: { data: this.clone(item) },
        headers,
        status: import_http_status_codes.STATUS.CREATED
      });
    }
  }
  removeById(collection, id) {
    const ix = this.indexOf(collection, id);
    if (ix > -1) {
      collection.splice(ix, 1);
      return true;
    }
    return false;
  }
  resetDb() {
    this.db = this.inMemDbService.createDb();
  }
  setPassThruBackend() {
    this.passThruBackend = void 0;
    if (this.config.passThruUnknownUrl) {
      try {
        const browserXhr = this.injector.get(import_http.BrowserXhr);
        const baseResponseOptions = this.injector.get(import_http.ResponseOptions);
        const xsrfStrategy = this.injector.get(import_http.XSRFStrategy);
        this.passThruBackend = new import_http.XHRBackend(browserXhr, baseResponseOptions, xsrfStrategy);
      } catch (ex) {
        ex.message = "Cannot create passThru404 backend; " + (ex.message || "");
        throw ex;
      }
    }
  }
  setStatusText(options) {
    try {
      const statusCode = import_http_status_codes.STATUS_CODE_INFO[options.status];
      options["statusText"] = statusCode ? statusCode.text : "Unknown Status";
      return options;
    } catch (err) {
      return new import_http.ResponseOptions({
        status: import_http_status_codes.STATUS.INTERNAL_SERVER_ERROR,
        statusText: "Invalid Server Operation"
      });
    }
  }
};
InMemoryBackendService = __decorateClass([
  __decorateParam(2, (0, import_core.Inject)(InMemoryBackendConfig)),
  __decorateParam(2, (0, import_core.Optional)())
], InMemoryBackendService);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InMemoryBackendConfig,
  InMemoryBackendService,
  InMemoryDbService,
  isSuccess
});
//# sourceMappingURL=in-memory-backend.service.js.map
