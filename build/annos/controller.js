"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const jbean_1 = require("jbean");
const application_1 = require("../application");
const base_1 = require("../base");
function Controller(path) {
    return jbean_1.annotationHelper(arguments, controllerCallback);
}
exports.Controller = Controller;
function Get(path) {
    return jbean_1.annotationHelper(['GET', path], methodCallback);
}
exports.Get = Get;
function Post(path) {
    return jbean_1.annotationHelper(['POST', path], methodCallback);
}
exports.Post = Post;
function GetPost(path) {
    return jbean_1.annotationHelper(['GETPOST', path], methodCallback);
}
exports.GetPost = GetPost;
function Put(path) {
    return jbean_1.annotationHelper(['PUT', path], methodCallback);
}
exports.Put = Put;
function Patch(path) {
    return jbean_1.annotationHelper(['PATCH', path], methodCallback);
}
exports.Patch = Patch;
function Options(path) {
    return jbean_1.annotationHelper(['OPTIONS', path], methodCallback);
}
exports.Options = Options;
const controllerCallback = function (annoType, ctor, path) {
    controllers.push(ctor);
    addAnno(ctor, path);
};
const methodCallback = function (annoType, target, method, descriptor, requestMethod, path) {
    addAnno(target, path, method, requestMethod, true);
};
const URL_PATH_TRIM = /^\/*|\/*$/g;
const URL_END_PATH_TRIM = /\/*$/g;
const controllerMetas = {};
const controllers = [];
const addAnno = function (target, path, method, requestMethod, requestMapping) {
    let ctor = target;
    if (typeof target === 'object') {
        ctor = target.constructor;
    }
    let ctorId = ctor[jbean_1.CTOR_ID];
    if (typeof controllerMetas[ctorId] === 'undefined') {
        controllerMetas[ctorId] = {
            ctor: ctor,
            methods: [],
            path: ''
        };
    }
    let metas = controllerMetas[ctorId];
    if (!method) {
        metas.path = '/' + (path || '').replace(URL_PATH_TRIM, '');
        metas.path = (metas.path === '/') ? metas.path : (metas.path + '/');
    }
    else {
        metas.methods.push({
            target: target,
            method: method,
            requestMethod: requestMethod,
            subPath: (path || '').replace(URL_PATH_TRIM, ''),
            requestMapping: requestMapping
        });
    }
};
jbean_1.BeanFactory.registerInitBean(() => {
    controllers.forEach((controller) => {
        jbean_1.ReflectHelper.resetClass(controller);
    });
});
const controllerIns = {};
const TEMPLATE_DIR_NAME = 'template';
const LAYOUT_DIR_NAME = 'layout';
exports.TPL_DIR_KEY = '$__tplDir';
exports.LAYOUT_DIR_KEY = '$__layoutDir';
exports.EXT_KEY = '$__tplExt';
exports.METHOD_KEY = '$__method';
const addTemplateDir = function (ctor, ins) {
    if (typeof ctor[exports.METHOD_KEY] === 'undefined') {
        const application = application_1.default.getIns();
        let controllerPath = ctor[jbean_1.CTOR_JWEB_FILE_KEY].split(application.controllerDir);
        let viewDir = application.viewDir;
        if (!Path.isAbsolute(viewDir)) {
            viewDir = Path.join(application.root, viewDir);
        }
        ctor[exports.TPL_DIR_KEY] = viewDir + Path.sep
            + TEMPLATE_DIR_NAME + Path.sep
            + controllerPath.pop().replace(URL_PATH_TRIM, '').slice(0, -3).toLowerCase() + Path.sep;
        ctor[exports.LAYOUT_DIR_KEY] = viewDir + Path.sep + LAYOUT_DIR_NAME + Path.sep;
        ctor[exports.EXT_KEY] = application.tplExt;
    }
    if (typeof ins === 'object' && typeof ins[exports.TPL_DIR_KEY] === 'undefined') {
        ins[exports.TPL_DIR_KEY] = ctor[exports.TPL_DIR_KEY];
        ins[exports.LAYOUT_DIR_KEY] = ctor[exports.LAYOUT_DIR_KEY];
        ins[exports.EXT_KEY] = ctor[exports.EXT_KEY];
    }
};
jbean_1.BeanFactory.registerStartBean(() => {
    const app = application_1.default.getIns();
    if (app.applicationType !== application_1.ApplicationType.web) {
        return;
    }
    Object.values(controllerMetas).forEach(({ ctor, methods, path }) => {
        methods.forEach(({ target, method, requestMethod, subPath, requestMapping }) => {
            if (!requestMapping) {
                return;
            }
            const app = application_1.default.getIns();
            const supportCors = app.getAppConfigs().cors;
            const routePath = (path + subPath).replace(URL_END_PATH_TRIM, '') || '/';
            // app.route({
            //   method: requestMethod,
            //   path: routePath,
            //   handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            //     return new Promise(function(resolve, reject) {
            //       doRequest(ctor, target, app, request, h, supportCors, method)
            //     })
            //   }
            // })
            base_1.Router.add(requestMethod, routePath, (req, res, method, path, args, pathParams) => __awaiter(void 0, void 0, void 0, function* () {
                return [path, pathParams];
            }), [ctor, target, method]);
        });
    });
});
const doRequest = function (ctor, target, app, request, h, supportCors, method) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = new base_1.Request(request, h);
        const res = new base_1.Response(request, h);
        if (supportCors) {
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
            res.setHeader('Access-Control-Allow-Headers', '*, X-Requested-With, Content-Type');
            res.setHeader('Access-Control-Allow-Methods', request.method);
            res.setHeader('Access-Control-Max-Age', 86400);
            res.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate,Server-Authorization');
        }
        let ins = target;
        if (typeof target !== 'function') {
            if (jbean_1.checkSupportTransition(ctor, method)) {
                ins = new ctor();
                jbean_1.BeanFactory.genRequestId(ins);
            }
            else {
                if (typeof controllerIns[ctor[jbean_1.CTOR_ID]] === 'undefined') {
                    controllerIns[ctor[jbean_1.CTOR_ID]] = new ctor();
                }
                ins = controllerIns[ctor[jbean_1.CTOR_ID]];
            }
            addTemplateDir(ctor, ins);
        }
        const requestId = jbean_1.BeanFactory.getRequestId(ins);
        ins[exports.METHOD_KEY] = method.toLowerCase();
        let params = [req, res];
        if (request.params && Object.keys(request.params).length > 0) {
            params.push(request.params);
        }
        try {
            if (requestId) {
                yield jbean_1.emitBegin(requestId);
            }
            res.type('text/html');
            const ret = yield ins[method](...params);
            if (requestId) {
                yield jbean_1.emitCommit(requestId);
            }
            if (ret === null) {
                /** done nothing, cause res is solved by annotation which returns null*/
                res.flush();
            }
            else {
                res.writeAndFlush(ret);
                // resolve()
            }
            if (requestId) {
                yield jbean_1.BeanFactory.releaseBeans(requestId);
            }
        }
        catch (e) {
            if (requestId) {
                yield jbean_1.emitRollback(requestId);
                yield jbean_1.BeanFactory.releaseBeans(requestId);
            }
            app.emit(application_1.AppErrorEvent.REQUEST, e);
            res.error('Internal Server Error');
        }
    });
};
