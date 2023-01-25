"use strict";
var __decorate = exports && exports.__decorate || function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = exports && exports.__metadata || function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var __param = exports && exports.__param || function(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
};
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var Observable_1 = require("rxjs/Observable");
require("rxjs/add/operator/delay");
var http_status_codes_1 = require("./http-status-codes");
var InMemoryDbService = function() {
  function InMemoryDbService2() {
  }
  return InMemoryDbService2;
}();
exports.InMemoryDbService = InMemoryDbService;
var InMemoryBackendConfig = function() {
  function InMemoryBackendConfig2(config) {
    if (config === void 0) {
      config = {};
    }
    Object.assign(this, {
      caseSensitiveSearch: false,
      defaultResponseOptions: new http_1.BaseResponseOptions(),
      delay: 500,
      delete404: false,
      passThruUnknownUrl: false,
      host: "",
      rootPath: ""
    }, config);
  }
  return InMemoryBackendConfig2;
}();
exports.InMemoryBackendConfig = InMemoryBackendConfig;
exports.isSuccess = function(status) {
  return status >= 200 && status < 300;
};
var InMemoryBackendService = function() {
  function InMemoryBackendService2(injector, inMemDbService, config) {
    this.injector = injector;
    this.inMemDbService = inMemDbService;
    this.config = new InMemoryBackendConfig();
    this.resetDb();
    var loc = this.getLocation("./");
    this.config.host = loc.host;
    this.config.rootPath = loc.pathname;
    Object.assign(this.config, config || {});
    this.setPassThruBackend();
  }
  InMemoryBackendService2.prototype.createConnection = function(req) {
    var response = this.handleRequest(req);
    return {
      readyState: http_1.ReadyState.Done,
      request: req,
      response
    };
  };
  InMemoryBackendService2.prototype.handleRequest = function(req) {
    var _a = this.parseUrl(req.url), base = _a.base, collectionName = _a.collectionName, id = _a.id, resourceUrl = _a.resourceUrl, query = _a.query;
    var collection = this.db[collectionName];
    var reqInfo = {
      req,
      base,
      collection,
      collectionName,
      headers: new http_1.Headers({ "Content-Type": "application/json" }),
      id: this.parseId(collection, id),
      query,
      resourceUrl
    };
    var reqMethodName = http_1.RequestMethod[req.method || 0].toLowerCase();
    var resOptions;
    try {
      if ("commands" === reqInfo.base.toLowerCase()) {
        return this.commands(reqInfo);
      } else if (this.inMemDbService[reqMethodName]) {
        var interceptorArgs = {
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
        resOptions = this.createErrorResponse(http_status_codes_1.STATUS.NOT_FOUND, "Collection '" + collectionName + "' not found");
        return this.createObservableResponse(resOptions);
      }
    } catch (error) {
      var err = error.message || error;
      resOptions = this.createErrorResponse(http_status_codes_1.STATUS.INTERNAL_SERVER_ERROR, "" + err);
      return this.createObservableResponse(resOptions);
    }
  };
  InMemoryBackendService2.prototype.applyQuery = function(collection, query) {
    var conditions = [];
    var caseSensitive = this.config.caseSensitiveSearch ? void 0 : "i";
    query.paramsMap.forEach(function(value, name) {
      value.forEach(function(v) {
        return conditions.push({ name, rx: new RegExp(decodeURI(v), caseSensitive) });
      });
    });
    var len = conditions.length;
    if (!len) {
      return collection;
    }
    return collection.filter(function(row) {
      var ok = true;
      var i = len;
      while (ok && i) {
        i -= 1;
        var cond = conditions[i];
        ok = cond.rx.test(row[cond.name]);
      }
      return ok;
    });
  };
  InMemoryBackendService2.prototype.clone = function(data) {
    return JSON.parse(JSON.stringify(data));
  };
  InMemoryBackendService2.prototype.collectionHandler = function(reqInfo) {
    var req = reqInfo.req;
    var resOptions;
    switch (req.method) {
      case http_1.RequestMethod.Get:
        resOptions = this.get(reqInfo);
        break;
      case http_1.RequestMethod.Post:
        resOptions = this.post(reqInfo);
        break;
      case http_1.RequestMethod.Put:
        resOptions = this.put(reqInfo);
        break;
      case http_1.RequestMethod.Delete:
        resOptions = this.delete(reqInfo);
        break;
      default:
        resOptions = this.createErrorResponse(http_status_codes_1.STATUS.METHOD_NOT_ALLOWED, "Method not allowed");
        break;
    }
    return this.createObservableResponse(resOptions);
  };
  InMemoryBackendService2.prototype.commands = function(reqInfo) {
    var command = reqInfo.collectionName.toLowerCase();
    var method = reqInfo.req.method;
    var resOptions;
    switch (command) {
      case "resetdb":
        this.resetDb();
        resOptions = new http_1.ResponseOptions({ status: http_status_codes_1.STATUS.OK });
        break;
      case "config":
        if (method === http_1.RequestMethod.Get) {
          resOptions = new http_1.ResponseOptions({
            body: this.clone(this.config),
            status: http_status_codes_1.STATUS.OK
          });
        } else {
          var body = JSON.parse(reqInfo.req.text() || "{}");
          Object.assign(this.config, body);
          this.setPassThruBackend();
          resOptions = new http_1.ResponseOptions({ status: http_status_codes_1.STATUS.NO_CONTENT });
        }
        break;
      default:
        resOptions = this.createErrorResponse(http_status_codes_1.STATUS.INTERNAL_SERVER_ERROR, 'Unknown command "' + command + '"');
    }
    return this.createObservableResponse(resOptions);
  };
  InMemoryBackendService2.prototype.createErrorResponse = function(status, message) {
    return new http_1.ResponseOptions({
      body: { "error": "" + message },
      headers: new http_1.Headers({ "Content-Type": "application/json" }),
      status
    });
  };
  InMemoryBackendService2.prototype.createObservableResponse = function(resOptions) {
    resOptions = this.setStatusText(resOptions);
    if (this.config.defaultResponseOptions) {
      resOptions = this.config.defaultResponseOptions.merge(resOptions);
    }
    var res = new http_1.Response(resOptions);
    return new Observable_1.Observable(function(responseObserver) {
      if (exports.isSuccess(res.status)) {
        responseObserver.next(res);
        responseObserver.complete();
      } else {
        responseObserver.error(res);
      }
      return function() {
      };
    }).delay(this.config.delay || 500);
  };
  InMemoryBackendService2.prototype.delete = function(_a) {
    var id = _a.id, collection = _a.collection, collectionName = _a.collectionName, headers = _a.headers;
    if (!id) {
      return this.createErrorResponse(http_status_codes_1.STATUS.NOT_FOUND, 'Missing "' + collectionName + '" id');
    }
    var exists = this.removeById(collection, id);
    return new http_1.ResponseOptions({
      headers,
      status: exists || !this.config.delete404 ? http_status_codes_1.STATUS.NO_CONTENT : http_status_codes_1.STATUS.NOT_FOUND
    });
  };
  InMemoryBackendService2.prototype.findById = function(collection, id) {
    return collection.find(function(item) {
      return item.id === id;
    });
  };
  InMemoryBackendService2.prototype.genId = function(collection) {
    var maxId = 0;
    collection.reduce(function(prev, item) {
      maxId = Math.max(maxId, typeof item.id === "number" ? item.id : maxId);
    }, null);
    return maxId + 1;
  };
  InMemoryBackendService2.prototype.get = function(_a) {
    var id = _a.id, query = _a.query, collection = _a.collection, collectionName = _a.collectionName, headers = _a.headers;
    var data = collection;
    if (id) {
      data = this.findById(collection, id);
    } else if (query) {
      data = this.applyQuery(collection, query);
    }
    if (!data) {
      return this.createErrorResponse(http_status_codes_1.STATUS.NOT_FOUND, "'" + collectionName + "' with id='" + id + "' not found");
    }
    return new http_1.ResponseOptions({
      body: { data: this.clone(data) },
      headers,
      status: http_status_codes_1.STATUS.OK
    });
  };
  InMemoryBackendService2.prototype.getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
  };
  ;
  InMemoryBackendService2.prototype.indexOf = function(collection, id) {
    return collection.findIndex(function(item) {
      return item.id === id;
    });
  };
  InMemoryBackendService2.prototype.parseId = function(collection, id) {
    if (!id) {
      return null;
    }
    var isNumberId = collection[0] && typeof collection[0].id === "number";
    if (isNumberId) {
      var idNum = parseFloat(id);
      return isNaN(idNum) ? id : idNum;
    }
    return id;
  };
  InMemoryBackendService2.prototype.parseUrl = function(url) {
    try {
      var loc = this.getLocation(url);
      var drop = this.config.rootPath.length;
      var urlRoot = "";
      if (loc.host !== this.config.host) {
        drop = 1;
        urlRoot = loc.protocol + "//" + loc.host + "/";
      }
      var path = loc.pathname.substring(drop);
      var _a = path.split("/"), base = _a[0], collectionName = _a[1], id = _a[2];
      var resourceUrl = urlRoot + base + "/" + collectionName + "/";
      collectionName = collectionName.split(".")[0];
      var query = loc.search && new http_1.URLSearchParams(loc.search.substr(1));
      return { base, id, collectionName, resourceUrl, query };
    } catch (err) {
      var msg = "unable to parse url '" + url + "'; original error: " + err.message;
      throw new Error(msg);
    }
  };
  InMemoryBackendService2.prototype.post = function(_a) {
    var collection = _a.collection, headers = _a.headers, id = _a.id, req = _a.req, resourceUrl = _a.resourceUrl;
    var item = JSON.parse(req.text());
    if (!item.id) {
      item.id = id || this.genId(collection);
    }
    id = item.id;
    var existingIx = this.indexOf(collection, id);
    if (existingIx > -1) {
      collection[existingIx] = item;
      return new http_1.ResponseOptions({
        headers,
        status: http_status_codes_1.STATUS.NO_CONTENT
      });
    } else {
      collection.push(item);
      headers.set("Location", resourceUrl + "/" + id);
      return new http_1.ResponseOptions({
        headers,
        body: { data: this.clone(item) },
        status: http_status_codes_1.STATUS.CREATED
      });
    }
  };
  InMemoryBackendService2.prototype.put = function(_a) {
    var id = _a.id, collection = _a.collection, collectionName = _a.collectionName, headers = _a.headers, req = _a.req;
    var item = JSON.parse(req.text());
    if (!id) {
      return this.createErrorResponse(http_status_codes_1.STATUS.NOT_FOUND, "Missing '" + collectionName + "' id");
    }
    if (id !== item.id) {
      return this.createErrorResponse(http_status_codes_1.STATUS.BAD_REQUEST, '"' + collectionName + '" id does not match item.id');
    }
    var existingIx = this.indexOf(collection, id);
    if (existingIx > -1) {
      collection[existingIx] = item;
      return new http_1.ResponseOptions({
        headers,
        status: http_status_codes_1.STATUS.NO_CONTENT
      });
    } else {
      collection.push(item);
      return new http_1.ResponseOptions({
        body: { data: this.clone(item) },
        headers,
        status: http_status_codes_1.STATUS.CREATED
      });
    }
  };
  InMemoryBackendService2.prototype.removeById = function(collection, id) {
    var ix = this.indexOf(collection, id);
    if (ix > -1) {
      collection.splice(ix, 1);
      return true;
    }
    return false;
  };
  InMemoryBackendService2.prototype.resetDb = function() {
    this.db = this.inMemDbService.createDb();
  };
  InMemoryBackendService2.prototype.setPassThruBackend = function() {
    this.passThruBackend = void 0;
    if (this.config.passThruUnknownUrl) {
      try {
        var browserXhr = this.injector.get(http_1.BrowserXhr);
        var baseResponseOptions = this.injector.get(http_1.ResponseOptions);
        var xsrfStrategy = this.injector.get(http_1.XSRFStrategy);
        this.passThruBackend = new http_1.XHRBackend(browserXhr, baseResponseOptions, xsrfStrategy);
      } catch (ex) {
        ex.message = "Cannot create passThru404 backend; " + (ex.message || "");
        throw ex;
      }
    }
  };
  InMemoryBackendService2.prototype.setStatusText = function(options) {
    try {
      var statusCode = http_status_codes_1.STATUS_CODE_INFO[options.status];
      options["statusText"] = statusCode ? statusCode.text : "Unknown Status";
      return options;
    } catch (err) {
      return new http_1.ResponseOptions({
        status: http_status_codes_1.STATUS.INTERNAL_SERVER_ERROR,
        statusText: "Invalid Server Operation"
      });
    }
  };
  InMemoryBackendService2 = __decorate([
    __param(2, core_1.Inject(InMemoryBackendConfig)),
    __param(2, core_1.Optional()),
    __metadata("design:paramtypes", [core_1.Injector, InMemoryDbService, Object])
  ], InMemoryBackendService2);
  return InMemoryBackendService2;
}();
exports.InMemoryBackendService = InMemoryBackendService;
//# sourceMappingURL=in-memory-backend.service.js.map
