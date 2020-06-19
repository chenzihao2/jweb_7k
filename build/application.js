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
const Http = require("http");
const Path = require("path");
const util = require("util");
const formidable = require("formidable");
const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const YAML = require("yaml");
const events_1 = require("events");
const jbean_1 = require("jbean");
const starters_1 = require("./starters");
const utils_1 = require("./utils");
const defaultOptions = {
    port: 3000,
    host: 'localhost',
    configNS: 'node-web',
    controllerDir: 'controller',
    viewDir: 'view',
    tplExt: 'html',
    taskDir: 'task'
};
const TASK_ARG_KEY = {
    task: 't',
    loop: 'l',
    sleep: 's'
};
var AppErrorEvent;
(function (AppErrorEvent) {
    AppErrorEvent["REQUEST"] = "error_request";
    AppErrorEvent["NOT_FOUND"] = "404";
})(AppErrorEvent = exports.AppErrorEvent || (exports.AppErrorEvent = {}));
var ApplicationType;
(function (ApplicationType) {
    ApplicationType[ApplicationType["web"] = 0] = "web";
    ApplicationType[ApplicationType["task"] = 1] = "task";
})(ApplicationType = exports.ApplicationType || (exports.ApplicationType = {}));
const taskMethod = 'process';
jbean_1.registerConfigParser('yml', function (content) {
    if (!content) {
        return null;
    }
    return YAML.parse(content);
});
class Application extends events_1.EventEmitter {
    constructor() {
        super();
        this.isDev = process.env.NODE_ENV === 'development';
        this.appOptions = {};
        this.applicationConfigs = {};
        this.cmdArgs = {};
    }
    static create(options) {
        const ins = Application.ins = new Application();
        ins.appOptions = {};
        jbean_1.merge(ins.appOptions, defaultOptions);
        jbean_1.merge(ins.appOptions, options);
        ins.configNS = ins.appOptions.configNS;
        ins.applicationConfigs = jbean_1.getApplicationConfigs();
        return ins;
    }
    static getIns() {
        return Application.ins;
    }
    static start(options) {
        return __awaiter(this, void 0, void 0, function* () {
            jbean_1.BeanFactory.initBean();
            const application = Application.create(options);
            application.registerExit();
            application.init();
            jbean_1.BeanFactory.startBean();
            if (application.isDev) {
                console.log('Starting at dev enviroment');
            }
            try {
                yield starters_1.default(application);
                switch (application.applicationType) {
                    case ApplicationType.web:
                        yield application.runWebServer();
                        break;
                    case ApplicationType.task:
                        yield application.runTask();
                        break;
                    default:
                        break;
                }
            }
            catch (e) {
                console.error(e);
            }
            return application;
        });
    }
    getAppConfigs() {
        return this.getApplicationConfigs('app');
    }
    getApplicationConfigs(key) {
        if (typeof this.applicationConfigs[this.configNS] === 'undefined'
            || typeof this.applicationConfigs[this.configNS].app === 'undefined') {
            return {};
        }
        const appConfigs = this.applicationConfigs[this.configNS];
        return key ? appConfigs[key] : appConfigs;
    }
    parseCmdArgs() {
        const args = process.argv;
        if (args.length < 3) {
            return;
        }
        let argName = null;
        for (let i = 2; i < args.length; i++) {
            if (args[i].substr(0, 1) === '-') {
                argName = args[i].replace(/^\-*/g, '');
            }
            else {
                if (argName) {
                    Object.keys(TASK_ARG_KEY).forEach(key => {
                        if (key === argName) {
                            argName = TASK_ARG_KEY[key];
                        }
                    });
                    this.cmdArgs[argName] = args[i].replace(/^\-*/g, '');
                }
                argName = null;
            }
        }
    }
    checkAppType() {
        if (typeof this.cmdArgs[TASK_ARG_KEY.task] !== 'undefined') {
            this.applicationType = ApplicationType.task;
        }
        else {
            this.applicationType = ApplicationType.web;
        }
    }
    bindEvent() {
        this.on(AppErrorEvent.REQUEST, err => {
            console.error("Request error: ", err);
        });
    }
    init() {
        this.root = Path.dirname(require.main.filename);
        this.parseCmdArgs();
        this.checkAppType();
        this.bindEvent();
        switch (this.applicationType) {
            case ApplicationType.web:
                this.initWebServer();
                break;
            case ApplicationType.task:
                this.initTask();
                break;
            default:
                break;
        }
    }
    initWebServer() {
        const appConfigs = this.getAppConfigs();
        this.server = new Hapi.Server({
            port: appConfigs.port || defaultOptions.port,
            host: appConfigs.host || defaultOptions.host,
            state: {
                strictHeader: false
            }
        });
        if (typeof appConfigs.assets !== 'undefined') {
            this.assets = appConfigs.assets;
            if (!Path.isAbsolute(this.assets)) {
                this.assets = Path.join(Path.dirname(this.root), this.assets);
            }
        }
        this.controllerDir = appConfigs.controllerDir || defaultOptions.controllerDir;
        if (process.env.NODE_ENV === 'development') {
            this.viewDir = Path.join(Path.dirname(Path.dirname(this.root)), 'src', appConfigs.viewDir || defaultOptions.viewDir);
        }
        else {
            this.viewDir = appConfigs.viewDir || defaultOptions.viewDir;
        }
        this.tplExt = appConfigs.tplExt || defaultOptions.tplExt;
    }
    initTask() {
        let taskScript = this.cmdArgs[TASK_ARG_KEY.task];
        const appConfigs = this.getAppConfigs();
        this.taskDir = appConfigs.taskDir || defaultOptions.taskDir;
        if (taskScript.substr(0, 1) === '/') {
            this.taskScript = Path.join(this.root, taskScript);
        }
        else {
            this.taskScript = Path.join(this.root, this.taskDir, taskScript);
        }
    }
    runWebServer() {
        return __awaiter(this, void 0, void 0, function* () {
            var callProcess = function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    var form = new formidable.IncomingForm();
                    console.log(req.method);
                    console.log(req.url);
                    console.log(req.headers.host);
                    form.parse(req, function (err, fields, files) {
                        // console.log(fields)
                        console.log(files);
                        if (fields['a']) {
                            // console.log('start sleep', +(new Date))
                            // sleep(5)
                            // console.log('end sleep', +(new Date))
                            setTimeout(() => {
                                res.writeHead(200, { 'content-type': 'text/plain' });
                                res.write('set timeout\n\n');
                                // res.end()
                                res.end(util.inspect({ fields: fields, files: files }));
                            }, 3000);
                        }
                        else {
                            res.writeHead(200, { 'content-type': 'text/plain' });
                            res.write('received\n\n');
                            // res.end()
                            res.end(util.inspect({ fields: fields, files: files }));
                        }
                    });
                    form.on('file', function (name, file) {
                        console.log(name, '====');
                        // console.log(file, '00000')
                    });
                    form.on('progress', function (bytesReceived, bytesExpected) {
                        // console.log(bytesReceived, '------')
                    });
                    form.on('field', function (name, value) {
                        // console.log(name, value)
                    });
                });
            };
            Http.createServer(function (req, res) {
                callProcess(req, res);
                // Router.dispatch(req, res)
            }).listen(8080);
            return;
            yield this.server.register(Inert);
            if (this.assets) {
                this.route({
                    method: 'GET',
                    path: '/{param*}',
                    handler: {
                        directory: {
                            path: this.assets,
                            redirectToSlash: false,
                            index: true,
                        }
                    }
                });
            }
            yield this.server.start();
            console.log(`Server running at: ${this.server.info.uri}`);
        });
    }
    runTask() {
        return __awaiter(this, void 0, void 0, function* () {
            //const scriptFile = require.main.filename
            const entryFile = process.argv[1];
            let args = process.argv.slice(2).join(' ');
            if (args.startsWith('-')) {
                args = '\\' + args;
            }
            const cmd = 'ps aux | grep \'' + entryFile + '\' | grep -v grep | grep -v \'/bin/sh \\-c\' | grep \'' + args + '\'';
            let { err, data, message } = yield utils_1.exec(cmd, true);
            if (err) {
                console.error(message);
                process.emit('exit', 0);
                return;
            }
            data = data.replace(/^\s*|\s*$/g, '');
            data = data.split("\n");
            if (data.length > 1) {
                process.emit('exit', 0);
                return;
            }
            let task = require(this.taskScript);
            if (task.default) {
                task = task.default;
            }
            if (typeof task !== 'function') {
                console.error('typeof ' + this.taskScript + ' is not class.');
                process.emit('exit', 0);
                return;
            }
            const methods = jbean_1.ReflectHelper.getMethods(task);
            if (methods.indexOf(taskMethod) < 0) {
                console.error(taskMethod + ' method of ' + task.name + ' is not exist.');
                process.emit('exit', 0);
                return;
            }
            let sleepSeconds = this.cmdArgs[TASK_ARG_KEY.sleep] || 0;
            let loopTimes = this.cmdArgs[TASK_ARG_KEY.loop] || 1;
            if (sleepSeconds < 0) {
                sleepSeconds = 0;
            }
            if (loopTimes < 1) {
                loopTimes = 1;
            }
            const taskIns = new task();
            for (let i = 0; i < loopTimes; i++) {
                if (jbean_1.checkSupportTransition(task, taskMethod)) {
                    jbean_1.BeanFactory.genRequestId(taskIns);
                }
                const requestId = jbean_1.BeanFactory.getRequestId(taskIns);
                try {
                    if (requestId) {
                        yield jbean_1.emitBegin(requestId);
                    }
                    const args = {};
                    Object.assign(args, this.cmdArgs);
                    Object.keys(TASK_ARG_KEY).forEach(k => {
                        delete args[TASK_ARG_KEY[k]];
                    });
                    yield taskIns[taskMethod](this, args);
                    if (requestId) {
                        yield jbean_1.emitCommit(requestId);
                        yield jbean_1.BeanFactory.releaseBeans(requestId);
                    }
                }
                catch (e) {
                    if (requestId) {
                        yield jbean_1.emitRollback(requestId);
                        yield jbean_1.BeanFactory.releaseBeans(requestId);
                    }
                    console.error(e);
                    process.emit('exit', 0);
                    return;
                }
                if (sleepSeconds > 0) {
                    utils_1.sleep(sleepSeconds);
                }
            }
            process.emit('exit', 0);
        });
    }
    route(option) {
        if (this.applicationType !== ApplicationType.web) {
            return this;
        }
        const appConfig = this.getAppConfigs();
        if (appConfig && appConfig.cors) {
            option.options = {
                // cors: true
                cors: {
                    origin: ['*'],
                    maxAge: 86400,
                    credentials: true
                }
            };
        }
        this.server.route(option);
        return this;
    }
    registerExit() {
        let exitHandler = function (options, code) {
            if (options && options.exit) {
                if (this.applicationType !== ApplicationType.task) {
                    console.log('application exit at', code);
                }
                jbean_1.BeanFactory.destroyBean();
                process.exit(code);
            }
            else {
                console.error('exception', code);
            }
        };
        process.on('exit', exitHandler.bind(this, { exit: true }));
        // catch ctrl+c event
        process.on('SIGINT', exitHandler.bind(this, { exit: true }));
        // catch "kill pid"
        process.on('SIGUSR1', exitHandler.bind(this, { exit: true }));
        process.on('SIGUSR2', exitHandler.bind(this, { exit: true }));
        // catch uncaught exceptions
        process.on('uncaughtException', exitHandler.bind(this, { exit: false }));
    }
}
exports.default = Application;
