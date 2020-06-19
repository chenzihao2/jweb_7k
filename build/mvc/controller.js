"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const template_1 = require("./template");
const controller_1 = require("../annos/controller");
class Controller {
    initTemplate() {
        if (!this.tpl) {
            this.tpl = new template_1.default();
        }
    }
    template(name, fileName, data, options) {
        this.initTemplate();
        if (!Path.isAbsolute(fileName)) {
            fileName = this[controller_1.TPL_DIR_KEY] + fileName;
        }
        this.tpl.assignFile(name, fileName, data, options);
    }
    templateValue(name, value) {
        this.initTemplate();
        this.tpl.assign(name, value);
    }
    templateValues(data) {
        this.initTemplate();
        this.tpl.assigns(data);
    }
    // TODO: return Promise<string>
    show(fileName, contentKey, withoutDefaultLayoutDir) {
        this.initTemplate();
        if (!withoutDefaultLayoutDir) {
            fileName = this[controller_1.LAYOUT_DIR_KEY] + fileName + '.' + this[controller_1.EXT_KEY];
        }
        if (!contentKey) {
            contentKey = 'content';
        }
        let tplFileName = this[controller_1.TPL_DIR_KEY] + this[controller_1.METHOD_KEY] + '.' + this[controller_1.EXT_KEY];
        this.template(contentKey, tplFileName, null, {
            filename: this[controller_1.TPL_DIR_KEY]
        });
        return this.tpl.render(fileName, null, {
            filename: this[controller_1.LAYOUT_DIR_KEY]
        });
    }
}
exports.default = Controller;
