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
const jbean_1 = require("jbean");
function daoInit(application) {
    return __awaiter(this, void 0, void 0, function* () {
        const configNS = application.configNS;
        const applicationConfigs = application.applicationConfigs;
        if (!applicationConfigs ||
            !applicationConfigs[configNS] ||
            !applicationConfigs[configNS].data) {
            return;
        }
        const dataConfigs = applicationConfigs[configNS].data;
        let dbKeys = Object.keys(dataConfigs);
        for (let i0 = 0; i0 < dbKeys.length; i0++) {
            let db = dbKeys[i0];
            let dataConfig = dataConfigs[db];
            if (!Array.isArray(dataConfig)) {
                dataConfig = [dataConfig];
            }
            if (!dataConfig[0].dao) {
                throw new Error(db + '.dao is required.');
            }
            let daoPath = dataConfig[0].dao;
            let dao = require(daoPath);
            if (dao.default) {
                dao = dao.default;
            }
            let i = 0;
            for (let j = 0; j < dataConfig.length; j++) {
                let config = dataConfig[j];
                let beanName = db + '.' + (config.bean ? config.bean : 'db' + i);
                if (!config.bean) {
                    i++;
                }
                let daoIns = new dao(config);
                if (typeof config.autoconnect === 'undefined' || config.autoconnect) {
                    if (daoIns.connect) {
                        yield daoIns.connect();
                    }
                }
                jbean_1.BeanFactory.addBean(beanName, daoIns, true);
            }
        }
    });
}
exports.default = daoInit;
